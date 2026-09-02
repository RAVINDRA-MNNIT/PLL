package com.prolearner.all.controller;

import java.util.List;

import com.prolearner.all.dto.CreateUserRequest;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/all/{role}")
    public List<UserResponse> getAllUsers(
            @PathVariable UserRole role
    ) {
        return userService.getAllUsers(role);
    }

    @PostMapping("/addUser")
    public void addUser(
            @RequestBody CreateUserRequest request
    ) {
        userService.addUser(request);
    }

    @DeleteMapping("/deleteUser/{id}")
    public void deleteAdmin(
            @PathVariable Long id
    ) {
        userService.deleteUser(id);
    }

    @PutMapping("/updateUser")
    public void updateUser(
            @RequestBody CreateUserRequest request
    ) {
        userService.updateUser(request);
    }
}