package com.cetsheet.backend.Security.Auth;

import com.cetsheet.backend.Security.Jwt.JwtService;
import com.cetsheet.backend.Security.Service.AuthService;
import com.cetsheet.backend.Security.Service.CustomUserDetailsService;
import com.cetsheet.backend.Security.Auth.AuthenticationRequest;
import com.cetsheet.backend.Security.Auth.RegisterRequest;
import com.cetsheet.backend.dto.UserDTO;
import com.cetsheet.backend.Repository.UserRepository;
import com.cetsheet.backend.Security.Model.User;
import org.modelmapper.ModelMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final CustomUserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final AuthService authService;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserDetails user = userDetailsService.loadUserByUsername(request.getEmail());
        String token = jwtService.generateToken(user);
        return ResponseEntity.ok(new AuthenticationResponse(token));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@RequestBody RegisterRequest request) {
        AuthenticationResponse resp = authService.register(request);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> me() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserDTO dto = modelMapper.map(user, UserDTO.class);
        return ResponseEntity.ok(dto);
    }
}
