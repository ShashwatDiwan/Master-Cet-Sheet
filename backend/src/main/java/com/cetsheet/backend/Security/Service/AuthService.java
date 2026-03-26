package com.cetsheet.backend.Security.Service;

import com.cetsheet.backend.Repository.UserRepository;
import com.cetsheet.backend.Security.Auth.AuthenticationRequest;
import com.cetsheet.backend.Security.Auth.AuthenticationResponse;
import com.cetsheet.backend.Security.Auth.RegisterRequest;
import com.cetsheet.backend.Security.Model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.cetsheet.backend.Security.Jwt.JwtService;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthenticationResponse register(RegisterRequest request) {
        User user = User.builder()
                .email(request.getEmail())
                .username(request.getUsername() != null ? request.getUsername() : request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();
                System.out.println(user);
        userRepository.save(user);
        String token = jwtService.generateToken(user);
        return new AuthenticationResponse(token);
    }

    public AuthenticationResponse login(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        String token = jwtService.generateToken(user);
        return new AuthenticationResponse(token);
    }

        public AuthenticationResponse loginOrRegisterOAuthUser(String email, String username) {
                User user = userRepository.findByEmail(email)
                                .orElseGet(() -> {
                                        User newUser = User.builder()
                                                        .email(email)
                                                        .username((username != null && !username.isBlank()) ? username : email)
                                                        .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                                                        .build();
                                        return userRepository.save(newUser);
                                });

                String token = jwtService.generateToken(user);
                return new AuthenticationResponse(token);
        }
}
