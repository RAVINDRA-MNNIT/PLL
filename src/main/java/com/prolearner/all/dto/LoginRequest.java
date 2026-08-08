package com.prolearner.all.dto;

public record LoginRequest(
        Long userId,
        String password
) {}