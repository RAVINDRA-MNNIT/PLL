package com.prolearner.all.dto;

import java.time.LocalDate;

public record BulkIdCardResponse(
        Long studentId,
        String fullName,
        String mobileNumber,
        LocalDate dateOfAdmission
) {
}