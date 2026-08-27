package com.prolearner.all.dto;

import java.math.BigDecimal;
import java.util.List;

public record ProfitSummary(
        BigDecimal incomeCash,
        BigDecimal incomeOnline,
        BigDecimal totalIncome,

        BigDecimal expenseCash,
        BigDecimal expenseOnline,
        BigDecimal totalExpense,

        BigDecimal profitCash,
        BigDecimal profitOnline,
        BigDecimal totalProfit,

        List<DailyProfit> daily
) {}