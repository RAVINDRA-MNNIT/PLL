package com.prolearner.all.dto;
import java.math.BigDecimal;

public record BatchRequest(
        String batchName,
        String batchAlias,
        String category,
        String room,
        BigDecimal baseAmount,
        Boolean isActive
) {
}