package com.prolearner.all.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyProfit(
        LocalDate date,
        BigDecimal incomeCash,
        BigDecimal incomeOnline,
        BigDecimal expenseCash,
        BigDecimal expenseOnline,
        BigDecimal profitCash,
        BigDecimal profitOnline,
        BigDecimal totalProfit
) {}