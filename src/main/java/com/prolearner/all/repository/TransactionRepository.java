package com.prolearner.all.repository;

import com.prolearner.all.dto.MonthlyIncomeSummary;
import com.prolearner.all.entity.Transaction;
import com.prolearner.all.enums.PendingRequestStatus;
import com.prolearner.all.enums.SourceType;
import com.prolearner.all.enums.TransactionType;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByTransactionTypeOrderByTransactionDateDesc(
            TransactionType transactionType
    );

    List<Transaction> findByTransactionTypeAndStatusOrderByTransactionDateDesc(
            TransactionType transactionType,
            PendingRequestStatus status
    );

    List<Transaction> findByTransactionTypeAndTransactionDateBetweenOrderByIdDesc(
            TransactionType transactionType,
            OffsetDateTime from,
            OffsetDateTime to
    );

    List<Transaction> findByTransactionTypeAndStatusInAndTransactionDateBetweenOrderByTransactionDateDesc(
            TransactionType type,
            List<PendingRequestStatus> statuses,
            OffsetDateTime from,
            OffsetDateTime to
    );

    List<Transaction> findByStudentIdOrderByTransactionDateDesc(Long studentId);

    List<Transaction> findByStatusOrderByTransactionDateDesc(
            PendingRequestStatus status
    );

    List<Transaction> findBySourceTypeOrderByTransactionDateDesc(
            SourceType sourceType
    );

    @Query("""
       SELECT COALESCE(SUM(t.amount),0)
       FROM Transaction t
       WHERE t.transactionType = :type
       AND t.status = 'APPROVED'
       AND t.transactionDate BETWEEN :from AND :to
       """)
    BigDecimal getTotalAmount(
            @Param("type") TransactionType type,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("""
       SELECT COALESCE(SUM(t.amount),0)
       FROM Transaction t
       WHERE t.transactionType = 'INCOME'
       AND t.status = 'APPROVED'
       """)
    BigDecimal getTotalIncome();


    @Query("""
SELECT COALESCE(SUM(t.amount),0)
FROM Transaction t
WHERE t.transactionType = :type
AND t.status IN :statuses
AND t.transactionDate BETWEEN :from AND :to
""")
    BigDecimal getTotalExpense(
            @Param("type") TransactionType type,
            @Param("statuses") List<PendingRequestStatus> statuses,
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to
    );

    @Query("""
SELECT COALESCE(SUM(t.amount),0)
FROM Transaction t
WHERE t.transactionType = :type
AND t.status IN :statuses
""")
    BigDecimal getPendingExpense(
            TransactionType type,
            List<PendingRequestStatus> statuses
    );

    long countByTransactionTypeAndStatusIn(
            TransactionType transactionType,
            List<PendingRequestStatus> statuses
    );

    @Query("""
SELECT
t.expenseCategory,
SUM(t.amount)
FROM Transaction t
WHERE t.transactionType = :type
AND t.status IN:statuses
AND t.transactionDate BETWEEN :from AND :to
GROUP BY t.expenseCategory
ORDER BY SUM(t.amount) DESC
""")
    List<Object[]> getCategorySummary(
            TransactionType type,
            List<PendingRequestStatus> statuses,
            OffsetDateTime from,
            OffsetDateTime to
    );

    @Query("""
SELECT
t.paymentMode,
SUM(t.amount)
FROM Transaction t
WHERE t.transactionType = :type
AND t.status IN :statuses
AND t.transactionDate BETWEEN :from AND :to
GROUP BY t.paymentMode
ORDER BY SUM(t.amount) DESC
""")
    List<Object[]> getPaymentModeSummary(
            TransactionType type,
            List<PendingRequestStatus> statuses,
            OffsetDateTime from,
            OffsetDateTime to
    );

    @Query("""
SELECT COUNT(t)
FROM Transaction t
WHERE t.transactionType = :type
AND t.status IN :statuses
AND t.transactionDate BETWEEN :from AND :to
AND t.amount < 500
""")
    long countSmallExpenses(
            TransactionType type,
            List<PendingRequestStatus> statuses,
            OffsetDateTime from,
            OffsetDateTime to
    );

    @Query("""
SELECT COUNT(t)
FROM Transaction t
WHERE t.transactionType = :type
AND t.status IN :statuses
AND t.transactionDate BETWEEN :from AND :to
AND t.amount >= 500
AND t.amount <= 2000
""")
    long countMediumExpenses(
            TransactionType type,
            List<PendingRequestStatus> statuses,
            OffsetDateTime from,
            OffsetDateTime to
    );

    @Query("""
SELECT COALESCE(SUM(t.amount),0)
FROM Transaction t
WHERE t.transactionType = :type
AND t.status IN :statuses
AND t.transactionDate BETWEEN :from AND :to
AND t.amount < 500
""")
    BigDecimal getSmallExpenseAmount(
            TransactionType type,
            List<PendingRequestStatus> statuses,
            OffsetDateTime from,
            OffsetDateTime to
    );

    @Query("""
SELECT COALESCE(SUM(t.amount),0)
FROM Transaction t
WHERE t.transactionType = :type
AND t.status IN :statuses
AND t.transactionDate BETWEEN :from AND :to
AND t.amount BETWEEN 500 AND 2000
""")
    BigDecimal getMediumExpenseAmount(
            TransactionType type,
            List<PendingRequestStatus> statuses,
            OffsetDateTime from,
            OffsetDateTime to
    );

    @Query("""
SELECT COALESCE(SUM(t.amount),0)
FROM Transaction t
WHERE t.transactionType = :type
AND t.status IN :statuses
AND t.transactionDate BETWEEN :from AND :to
AND t.amount > 2000
""")
    BigDecimal getLargeExpenseAmount(
            TransactionType type,
            List<PendingRequestStatus> statuses,
            OffsetDateTime from,
            OffsetDateTime to
    );


    @Query("""
SELECT COUNT(t)
FROM Transaction t
WHERE t.transactionType = :type
AND t.status IN :statuses
AND t.transactionDate BETWEEN :from AND :to
AND t.amount > 2000
""")
    long countLargeExpenses(
            TransactionType type,
            List<PendingRequestStatus> statuses,
            OffsetDateTime from,
            OffsetDateTime to
    );

    @Query("""
SELECT
SUM(CASE WHEN t.amount < 500 THEN 1 ELSE 0 END),
COALESCE(SUM(CASE WHEN t.amount < 500 THEN t.amount ELSE 0 END),0),

SUM(CASE WHEN t.amount BETWEEN 500 AND 2000 THEN 1 ELSE 0 END),
COALESCE(SUM(CASE WHEN t.amount BETWEEN 500 AND 2000 THEN t.amount ELSE 0 END),0),

SUM(CASE WHEN t.amount > 2000 THEN 1 ELSE 0 END),
COALESCE(SUM(CASE WHEN t.amount > 2000 THEN t.amount ELSE 0 END),0)

FROM Transaction t
WHERE t.transactionType = :type
AND t.status IN :statuses
AND t.transactionDate BETWEEN :from AND :to
""")
    Object[] getExpenseSizeSummary(
            @Param("type") TransactionType type,
            @Param("statuses") List<PendingRequestStatus> statuses,
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to
    );

    @Query("""
SELECT new com.prolearner.all.dto.MonthlyIncomeSummary(

COALESCE(SUM(CASE
    WHEN t.sourceType = com.prolearner.all.enums.SourceType.FEE
     AND t.paymentMode = com.prolearner.all.enums.PaymentMode.CASH
    THEN t.amount ELSE 0 END),0),

COALESCE(SUM(CASE
    WHEN t.sourceType = com.prolearner.all.enums.SourceType.FEE
     AND t.paymentMode = com.prolearner.all.enums.PaymentMode.ONLINE
    THEN t.amount ELSE 0 END),0),

COALESCE(SUM(CASE
    WHEN t.sourceType = com.prolearner.all.enums.SourceType.ADMISSION
     AND t.paymentMode = com.prolearner.all.enums.PaymentMode.CASH
    THEN t.amount ELSE 0 END),0),

COALESCE(SUM(CASE
    WHEN t.sourceType = com.prolearner.all.enums.SourceType.ADMISSION
     AND t.paymentMode = com.prolearner.all.enums.PaymentMode.ONLINE
    THEN t.amount ELSE 0 END),0),

COALESCE(SUM(CASE
    WHEN t.paymentMode = com.prolearner.all.enums.PaymentMode.CASH
    THEN t.amount ELSE 0 END),0),

COALESCE(SUM(CASE
    WHEN t.paymentMode = com.prolearner.all.enums.PaymentMode.ONLINE
    THEN t.amount ELSE 0 END),0),

COALESCE(SUM(t.amount),0)

)
FROM Transaction t
WHERE t.transactionType = :type
AND t.status IN :statuses
AND t.transactionDate BETWEEN :from AND :to
""")
    MonthlyIncomeSummary getMonthlyIncomeSummary(
            @Param("type") TransactionType type,
            @Param("statuses") List<PendingRequestStatus> statuses,
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to
    );


    @Query("""
SELECT
    COALESCE(SUM(CASE
        WHEN t.transactionType = com.prolearner.all.enums.TransactionType.INCOME
         AND t.paymentMode = com.prolearner.all.enums.PaymentMode.CASH
        THEN t.amount ELSE 0 END),0),

    COALESCE(SUM(CASE
        WHEN t.transactionType = com.prolearner.all.enums.TransactionType.INCOME
         AND t.paymentMode = com.prolearner.all.enums.PaymentMode.ONLINE
        THEN t.amount ELSE 0 END),0),

    COALESCE(SUM(CASE
        WHEN t.transactionType = com.prolearner.all.enums.TransactionType.EXPENSE
         AND t.paymentMode = com.prolearner.all.enums.PaymentMode.CASH
        THEN t.amount ELSE 0 END),0),

    COALESCE(SUM(CASE
        WHEN t.transactionType = com.prolearner.all.enums.TransactionType.EXPENSE
         AND t.paymentMode = com.prolearner.all.enums.PaymentMode.ONLINE
        THEN t.amount ELSE 0 END),0)

FROM Transaction t
WHERE t.status IN :statuses
AND t.transactionDate BETWEEN :from AND :to
""")
    Object[] getProfitSummary(
            @Param("statuses") List<PendingRequestStatus> statuses,
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to);

    @Query("""
SELECT
    FUNCTION('DATE', t.transactionDate),

    COALESCE(SUM(CASE
        WHEN t.transactionType = com.prolearner.all.enums.TransactionType.INCOME
         AND t.paymentMode = com.prolearner.all.enums.PaymentMode.CASH
        THEN t.amount ELSE 0 END),0),

    COALESCE(SUM(CASE
        WHEN t.transactionType = com.prolearner.all.enums.TransactionType.INCOME
         AND t.paymentMode = com.prolearner.all.enums.PaymentMode.ONLINE
        THEN t.amount ELSE 0 END),0),

    COALESCE(SUM(CASE
        WHEN t.transactionType = com.prolearner.all.enums.TransactionType.EXPENSE
         AND t.paymentMode = com.prolearner.all.enums.PaymentMode.CASH
        THEN t.amount ELSE 0 END),0),

    COALESCE(SUM(CASE
        WHEN t.transactionType = com.prolearner.all.enums.TransactionType.EXPENSE
         AND t.paymentMode = com.prolearner.all.enums.PaymentMode.ONLINE
        THEN t.amount ELSE 0 END),0)

FROM Transaction t
WHERE t.status IN :statuses
AND t.transactionDate BETWEEN :from AND :to
GROUP BY FUNCTION('DATE', t.transactionDate)
ORDER BY FUNCTION('DATE', t.transactionDate)
""")
    List<Object[]> getDailyProfitSummary(
            @Param("statuses") List<PendingRequestStatus> statuses,
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to);

    // ====================================================
    // 🔹 CLEAR TRANSACTIONS BEFORE DATE
    // ====================================================

        @Modifying
        @Transactional
        @Query("""
    DELETE FROM Transaction t
    WHERE t.transactionDate < :beforeDate
    """)
        void clearTransactionsBefore(
                @Param("beforeDate")
                OffsetDateTime beforeDate
        );
}