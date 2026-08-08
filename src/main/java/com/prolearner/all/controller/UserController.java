package com.prolearner.all.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.prolearner.all.dto.UserResponse;
import com.prolearner.all.entity.UserRole;
import com.prolearner.all.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UserResponse> getUsers(
            @RequestParam UserRole role
    ) {
        return userService.getActiveUsers(role);
    }
}