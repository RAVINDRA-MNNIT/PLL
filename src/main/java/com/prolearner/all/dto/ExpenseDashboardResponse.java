package com.prolearner.all.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseDashboardResponse {
    private BigDecimal todayExpense;
    private BigDecimal monthExpense;
    private BigDecimal pendingAmount;
    private BigDecimal averagePerDay;

    // Expense Size
    private Long smallExpenseCount;
    private BigDecimal smallExpenseAmount;

    private Long mediumExpenseCount;
    private BigDecimal mediumExpenseAmount;

    private Long largeExpenseCount;
    private BigDecimal largeExpenseAmount;

    // Charts
    private List<CategorySummary> categorySummary;
    private List<PaymentModeSummary> paymentModeSummary;

    // Today's table
    private List<TodayExpenseResponse> todayExpenses;

}