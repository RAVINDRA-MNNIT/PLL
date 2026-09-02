package com.prolearner.all.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import com.prolearner.all.dto.CreateUserRequest;
import com.prolearner.all.entity.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.prolearner.all.dto.UserResponse;
import com.prolearner.all.entity.UserRole;
import com.prolearner.all.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserResponse> getActiveUsers(UserRole role) {

        return userRepository.findByRoleAndActiveTrue(role)
                .stream()
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getFullName(),
                        user.getRole(),
                        user.getActive()
                ))
                .toList();
    }

    public List<UserResponse> getAllUsers(UserRole role) {

        return userRepository.findByRole(role)
                .stream()
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getFullName(),
                        user.getRole(),
                        user.getActive()
                ))
                .toList();
    }

    public void addUser(CreateUserRequest request) {

        User user = new User();

        user.setFullName(request.getFullName());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setActive(true);

        OffsetDateTime now = OffsetDateTime.now();
        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        userRepository.save(user);
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found."));
        if (user.getRole() == UserRole.ADMIN) {
            long adminCount = userRepository.countByRole(UserRole.ADMIN);
            if (adminCount <= 1) {
                throw new RuntimeException(
                        "This is the only admin. It cannot be deleted."
                );
            }
        }
        userRepository.deleteById(id);
    }

    public void updateUser(CreateUserRequest request) {
        User user = userRepository.findById(request.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setFullName(request.getFullName());
        user.setActive(request.getActive());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        user.setUpdatedAt(OffsetDateTime.now());

        userRepository.save(user);
    }
}