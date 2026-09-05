package com.prolearner.all.dto;

import java.time.LocalDate;

public record FullDayStrength(
        String seatNumber,
        Long studentId,
        String fullName,
        String mobileNumber,
        String status,
        LocalDate tillDate
) {
}
