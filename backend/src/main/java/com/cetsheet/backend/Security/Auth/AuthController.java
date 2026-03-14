package com.cetsheet.backend.Security.Auth;

import com.cetsheet.backend.Security.Service.AuthenticatedUserService;
import com.cetsheet.backend.Security.Jwt.JwtService;
import com.cetsheet.backend.Security.Service.AuthService;
import com.cetsheet.backend.Security.Service.CustomUserDetails;
import com.cetsheet.backend.dto.UserDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtService jwtService;
    private final AuthService authService;
    private final AuthenticatedUserService authenticatedUserService;

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
        Authentication authentication = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserDetails user = (UserDetails) authentication.getPrincipal();
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
        CustomUserDetails user = authenticatedUserService.currentUserDetails();
        UserDTO dto = new UserDTO(user.getId(), user.getDisplayName(), user.getEmail());
        return ResponseEntity.ok(dto);
    }
}
