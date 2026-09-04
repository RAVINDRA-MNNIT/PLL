package com.prolearner.all.dto;

import java.util.List;

public record FullDayStrengthResponse(
        long occupied,
        long available,
        List<FullDayStrength> students
) {
}