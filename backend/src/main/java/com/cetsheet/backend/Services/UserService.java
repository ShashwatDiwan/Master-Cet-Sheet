//package com.cetsheet.backend.Security.Service;
//
//import org.springframework.security.core.userdetails.UserDetails;
//import org.springframework.security.core.userdetails.UserDetailsService;
//import org.springframework.security.core.userdetails.UsernameNotFoundException;
//import org.springframework.stereotype.Service;
//
//import com.cetsheet.backend.Security.Model.User; // Replace with your actual User class
//import com.cetsheet.backend.Repository.UserRepository; // Replace with your repo
//
//import java.util.Optional;
//
//@Service
//public class CustomUserDetailsService implements UserDetailsService {
//
//    private final UserRepository userRepository; // FirebaseUserService if using Firebase
//
//    public CustomUserDetailsService(UserRepository userRepository) {
//        this.userRepository = userRepository;
//    }
//
//    @Override
//    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
//        Optional<User> user = userRepository.findByEmail(email); // You'll implement this method
//
//        if (user == null) {
//            throw new UsernameNotFoundException("User not found");
//        }
//
//        return new CustomUserDetails(user); // We'll create this too
//    }
//}
//