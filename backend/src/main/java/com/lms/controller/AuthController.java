package com.lms.controller;

import com.lms.model.User;
import com.lms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public User login(@RequestBody User userRequest) {
        // Simple logic: Find by email, if exists return it, else create new user
        return userRepository.findByEmail(userRequest.getEmail())
                .orElseGet(() -> userRepository.save(userRequest));
    }
}
