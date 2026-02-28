package com.cetsheet.backend.Security.Jwt;

import com.cetsheet.backend.Security.Model.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final JwtUtil jwtUtil;

    public JwtService(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    public String generateToken(UserDetails userDetails) {
        // if it's a User object, use email as subject (since CustomUserDetailsService looks up by email)
        if (userDetails instanceof User) {
            User user = (User) userDetails;
            return jwtUtil.generateToken(user.getEmail());
        }
        // fallback to username for other UserDetails implementations
        return jwtUtil.generateToken(userDetails.getUsername());
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        return jwtUtil.isTokenValid(token, userDetails);
    }

    public String extractUsername(String token) {
        return jwtUtil.extractUsername(token);
    }
}

