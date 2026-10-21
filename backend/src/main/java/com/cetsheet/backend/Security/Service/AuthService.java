package com.cetsheet.backend.Security.Service;

import com.cetsheet.backend.Repository.UserRepository;
import com.cetsheet.backend.Security.Auth.AuthenticationResponse;
import com.cetsheet.backend.Security.Auth.RegisterRequest;
import com.cetsheet.backend.Security.Model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.cetsheet.backend.Security.Jwt.JwtService;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

        private String normalizeEmail(String email) {
                return email == null ? "" : email.trim().toLowerCase();
        }

    public AuthenticationResponse register(RegisterRequest request) {
                String normalizedEmail = normalizeEmail(request.getEmail());
        User user = User.builder()
                                .email(normalizedEmail)
                                .username(request.getUsername() != null ? request.getUsername() : normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .build();
                System.out.println(user);
        userRepository.save(user);
        String token = jwtService.generateToken(user);
        return new AuthenticationResponse(token);
    }

        public AuthenticationResponse loginOrRegisterOAuthUser(String email, String username) {
                String normalizedEmail = normalizeEmail(email);
                User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                                .orElseGet(() -> {
                                        User newUser = User.builder()
                                                        .email(normalizedEmail)
                                                        .username((username != null && !username.isBlank()) ? username : normalizedEmail)
                                                        .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                                                        .build();
                                        return userRepository.save(newUser);
                                });

                String token = jwtService.generateToken(user);
                return new AuthenticationResponse(token);
        }
}
