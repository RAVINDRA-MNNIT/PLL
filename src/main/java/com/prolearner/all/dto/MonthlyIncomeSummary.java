package com.prolearner.all.dto;

import java.math.BigDecimal;

public record MonthlyIncomeSummary(
        BigDecimal feeCash,
        BigDecimal feeOnline,
        BigDecimal admissionCash,
        BigDecimal admissionOnline,
        BigDecimal totalCash,
        BigDecimal totalOnline,
        BigDecimal grandTotal
) {}