package com.prolearner.all.dto;

import com.prolearner.all.entity.UserRole;

public record LoginResponse(
        Long id,
        String fullName,
        UserRole role
) {}