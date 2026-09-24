package com.prolearner.all.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record BatchResponse(
        Long id,
        String batchName,
        String batchAlias,
        String category,
        String room,
        BigDecimal baseAmount,
        Boolean isActive,
        OffsetDateTime createdAt
) {
}