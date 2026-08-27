package com.prolearner.all.service;

import com.prolearner.all.dto.*;
import com.prolearner.all.entity.Transaction;
import com.prolearner.all.enums.PaymentMode;
import com.prolearner.all.enums.PendingRequestStatus;
import com.prolearner.all.enums.TransactionType;
import com.prolearner.all.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static com.prolearner.all.enums.PendingRequestStatus.APPROVED;

@Service
@RequiredArgsConstructor
public class TransactionQueryService {

    private final TransactionRepository transactionRepository;

    public List<Transaction> getExpenses() {

        ZoneOffset offset = ZoneOffset.ofHoursMinutes(5, 30);

        OffsetDateTime from = LocalDate.now()
                .withDayOfMonth(1)
                .atStartOfDay()
                .atOffset(offset);

        OffsetDateTime to = LocalDate.now()
                .withDayOfMonth(LocalDate.now().lengthOfMonth())
                .atTime(LocalTime.MAX)
                .atOffset(offset);

        return transactionRepository
                .findByTransactionTypeAndTransactionDateBetweenOrderByIdDesc(
                        TransactionType.EXPENSE,
                        from,
                        to
                );
    }

    public ExpenseDashboardResponse getExpenseDashboard() {

        ZoneOffset offset = ZoneOffset.ofHoursMinutes(5, 30);

        LocalDate today = LocalDate.now();

        OffsetDateTime todayStart = today.atStartOfDay().atOffset(offset);
        OffsetDateTime todayEnd = today.atTime(LocalTime.MAX).atOffset(offset);

        OffsetDateTime monthStart = today.withDayOfMonth(1)
                .atStartOfDay()
                .atOffset(offset);

        OffsetDateTime monthEnd = today.withDayOfMonth(today.lengthOfMonth())
                .atTime(LocalTime.MAX)
                .atOffset(offset);

        List<PendingRequestStatus> completedStatuses = List.of(
                PendingRequestStatus.DIRECT,
                APPROVED
        );

        BigDecimal todayExpense = Optional.ofNullable(
                        transactionRepository.getTotalExpense(
                                TransactionType.EXPENSE,
                                completedStatuses,
                                todayStart,
                                todayEnd))
                .orElse(BigDecimal.ZERO);

        BigDecimal monthExpense = Optional.ofNullable(
                        transactionRepository.getTotalExpense(
                                TransactionType.EXPENSE,
                                completedStatuses,
                                monthStart,
                                monthEnd))
                .orElse(BigDecimal.ZERO);

        BigDecimal pendingAmount = Optional.ofNullable(
                        transactionRepository.getPendingExpense(
                                TransactionType.EXPENSE,
                                completedStatuses))
                .orElse(BigDecimal.ZERO);

        BigDecimal averagePerDay = monthExpense.divide(
                BigDecimal.valueOf(today.getDayOfMonth()),
                2,
                RoundingMode.HALF_UP);

        List<CategorySummary> categorySummary =
                transactionRepository.getCategorySummary(
                                TransactionType.EXPENSE,
                                completedStatuses,
                                monthStart,
                                monthEnd)
                        .stream()
                        .map(row -> new CategorySummary(
                                (String) row[0],
                                (BigDecimal) row[1]))
                        .toList();

        List<PaymentModeSummary> paymentModeSummary =
                transactionRepository.getPaymentModeSummary(
                                TransactionType.EXPENSE,
                                completedStatuses,
                                monthStart,
                                monthEnd)
                        .stream()
                        .map(row -> new PaymentModeSummary(
                                (PaymentMode) row[0],
                                (BigDecimal) row[1]))
                        .toList();

        long smallCount = transactionRepository.countSmallExpenses(
                TransactionType.EXPENSE,
                completedStatuses,
                monthStart,
                monthEnd);

        long mediumCount = transactionRepository.countMediumExpenses(
                TransactionType.EXPENSE,
                completedStatuses,
                monthStart,
                monthEnd);

        long largeCount = transactionRepository.countLargeExpenses(
                TransactionType.EXPENSE,
                completedStatuses,
                monthStart,
                monthEnd);

        BigDecimal smallAmount = Optional.ofNullable(
                        transactionRepository.getSmallExpenseAmount(
                                TransactionType.EXPENSE,
                                completedStatuses,
                                monthStart,
                                monthEnd))
                .orElse(BigDecimal.ZERO);

        BigDecimal mediumAmount = Optional.ofNullable(
                        transactionRepository.getMediumExpenseAmount(
                                TransactionType.EXPENSE,
                                completedStatuses,
                                monthStart,
                                monthEnd))
                .orElse(BigDecimal.ZERO);

        BigDecimal largeAmount = Optional.ofNullable(
                        transactionRepository.getLargeExpenseAmount(
                                TransactionType.EXPENSE,
                                completedStatuses,
                                monthStart,
                                monthEnd))
                .orElse(BigDecimal.ZERO);

        List<TodayExpenseResponse> todayExpenses =
                transactionRepository.findByTransactionTypeAndStatusInAndTransactionDateBetweenOrderByTransactionDateDesc(
                                TransactionType.EXPENSE,
                                completedStatuses,
                                todayStart,
                                todayEnd
                        )
                        .stream()
                        .map(t -> TodayExpenseResponse.builder()
                                .transactionDate(t.getTransactionDate())
                                .category(t.getExpenseCategory())
                                .paymentMode(t.getPaymentMode())
                                .amount(t.getAmount())
                                .description(t.getDescription())
                                .build())
                        .toList();

        return ExpenseDashboardResponse.builder()
                .todayExpense(todayExpense)
                .monthExpense(monthExpense)
                .pendingAmount(pendingAmount)
                .averagePerDay(averagePerDay)

                .smallExpenseCount(smallCount)
                .smallExpenseAmount(smallAmount)

                .mediumExpenseCount(mediumCount)
                .mediumExpenseAmount(mediumAmount)

                .largeExpenseCount(largeCount)
                .largeExpenseAmount(largeAmount)

                .categorySummary(categorySummary)
                .paymentModeSummary(paymentModeSummary)
                .todayExpenses(todayExpenses)
                .build();
    }

    public List<Transaction> getDailyIncome() {
        ZoneOffset offset = ZoneOffset.ofHoursMinutes(5, 30);

        OffsetDateTime from = LocalDate.now()
                .withDayOfMonth(1)
                .atStartOfDay()
                .atOffset(offset);

        OffsetDateTime to = LocalDate.now()
                .withDayOfMonth(LocalDate.now().lengthOfMonth())
                .atTime(LocalTime.MAX)
                .atOffset(offset);

        List<PendingRequestStatus> completedStatuses = List.of(
                PendingRequestStatus.DIRECT,
                APPROVED
        );

        return transactionRepository
                .findByTransactionTypeAndStatusInAndTransactionDateBetweenOrderByTransactionDateDesc(
                        TransactionType.INCOME,
                        completedStatuses,
                        from,
                        to
                );
    }
//
    public MonthlyIncomeSummary getMonthlyIncome(YearMonth month) {

        OffsetDateTime from = month.atDay(1)
                .atStartOfDay()
                .atOffset(ZoneOffset.UTC);

        OffsetDateTime to = month.atEndOfMonth()
                .atTime(LocalTime.MAX)
                .atOffset(ZoneOffset.UTC);

        return transactionRepository.getMonthlyIncomeSummary(
                TransactionType.INCOME,
                List.of(PendingRequestStatus.APPROVED),
                from,
                to
        );
    }

    public ProfitSummary getProfitSummary() {

        YearMonth month = YearMonth.now();

        OffsetDateTime from = month.atDay(1)
                .atStartOfDay()
                .atOffset(ZoneOffset.UTC);

        OffsetDateTime to = month.atEndOfMonth()
                .atTime(LocalTime.MAX)
                .atOffset(ZoneOffset.UTC);

        // Total summary
        Object[] wrapper = transactionRepository.getProfitSummary(
                List.of(PendingRequestStatus.APPROVED,
                        PendingRequestStatus.DIRECT
                ),
                from,
                to
        );

        // Hibernate returns Object[] containing one Object[]
        Object[] totals = (Object[]) wrapper[0];

        BigDecimal incomeCash = (BigDecimal) totals[0];
        BigDecimal incomeOnline = (BigDecimal) totals[1];

        BigDecimal expenseCash = (BigDecimal) totals[2];
        BigDecimal expenseOnline = (BigDecimal) totals[3];

        BigDecimal totalIncome = incomeCash.add(incomeOnline);
        BigDecimal totalExpense = expenseCash.add(expenseOnline);

        BigDecimal profitCash = incomeCash.subtract(expenseCash);
        BigDecimal profitOnline = incomeOnline.subtract(expenseOnline);
        BigDecimal totalProfit = totalIncome.subtract(totalExpense);

        // Daily summary
        List<DailyProfit> daily = transactionRepository
                .getDailyProfitSummary(
                        List.of(PendingRequestStatus.APPROVED,
                                PendingRequestStatus.DIRECT
                        ),
                        from,
                        to
                )
                .stream()
                .map(row -> {

                    LocalDate date = ((java.sql.Date) row[0]).toLocalDate();

                    BigDecimal dailyIncomeCash = (BigDecimal) row[1];
                    BigDecimal dailyIncomeOnline = (BigDecimal) row[2];

                    BigDecimal dailyExpenseCash = (BigDecimal) row[3];
                    BigDecimal dailyExpenseOnline = (BigDecimal) row[4];

                    BigDecimal dailyProfitCash = dailyIncomeCash.subtract(dailyExpenseCash);
                    BigDecimal dailyProfitOnline = dailyIncomeOnline.subtract(dailyExpenseOnline);

                    return new DailyProfit(
                            date,
                            dailyIncomeCash,
                            dailyIncomeOnline,
                            dailyExpenseCash,
                            dailyExpenseOnline,
                            dailyProfitCash,
                            dailyProfitOnline,
                            dailyProfitCash.add(dailyProfitOnline)
                    );
                })
                .toList();

        return new ProfitSummary(
                incomeCash,
                incomeOnline,
                totalIncome,
                expenseCash,
                expenseOnline,
                totalExpense,
                profitCash,
                profitOnline,
                totalProfit,
                daily
        );
    }
}