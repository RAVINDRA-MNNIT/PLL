package com.prolearner.all.dto;

import com.prolearner.all.entity.UserRole;

public record UserResponse(
        Long id,
        String fullName,
        UserRole role
) {}