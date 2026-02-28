//package com.cetsheet.backend.Controller;
//
//import com.cetsheet.backend.Services.UserService;
//import com.cetsheet.backend.dto.UserDTO;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.web.bind.annotation.GetMapping;
//import org.springframework.web.bind.annotation.PathVariable;
//import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RestController;
//
//@RestController
//@RequestMapping("/users")
//public class UserController {
//    @Autowired
//    private UserService userService;
//
//    @GetMapping("byId/{id}")
//    public UserDTO getUserById(@PathVariable("id") int userId){
//        return userService.getUserById(userId);
//    }
//
//    @GetMapping("byName/{name}")
//    public UserDTO getUserByName(@PathVariable("name") int userName){
//        return userService.getUserById(userName);
//    }
//}
