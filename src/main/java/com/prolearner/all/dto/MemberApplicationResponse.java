package com.prolearner.all.dto;

public record MemberApplicationResponse(
        Long studentId,
        String status,
        String message
) {
}