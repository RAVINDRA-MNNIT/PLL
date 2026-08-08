package com.prolearner.all.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.prolearner.all.dto.UserResponse;
import com.prolearner.all.entity.UserRole;
import com.prolearner.all.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserResponse> getActiveUsers(UserRole role) {

        return userRepository.findByRoleAndActiveTrue(role)
                .stream()
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getFullName(),
                        user.getRole()
                ))
                .toList();
    }
}