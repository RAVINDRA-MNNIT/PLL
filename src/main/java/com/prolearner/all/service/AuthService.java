package com.prolearner.all.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.prolearner.all.dto.LoginResponse;
import com.prolearner.all.entity.User;
import com.prolearner.all.repository.UserRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponse login(Long userId, String password) {

        User user = userRepository.findByIdAndActiveTrue(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Invalid user or password")
                );

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid user or password");
        }

        return new LoginResponse(
                user.getId(),
                user.getFullName(),
                user.getRole()
        );
    }
}