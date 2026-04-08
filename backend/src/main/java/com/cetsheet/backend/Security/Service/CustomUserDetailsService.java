package com.cetsheet.backend.Security.Service;

import com.cetsheet.backend.Security.Model.User;
import com.cetsheet.backend.Repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        Optional<User> user = userRepository.findByEmailIgnoreCase(normalizedEmail);
        return user.map(CustomUserDetails::new)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + normalizedEmail));
    }
}

