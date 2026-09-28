package com.prolearner.all.repository;

import com.prolearner.all.dto.MonthlyIncomeSummary;
import com.prolearner.all.entity.Transaction;
import com.prolearner.all.enums.PendingRequestStatus;
import com.prolearner.all.enums.TransactionType;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.OffsetDateTime;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
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




@Query("""
SELECT new com.prolearner.all.dto.MonthlyIncomeSummary(

COALESCE(SUM(CASE
    WHEN t.sourceType = com.prolearner.all.enums.SourceType.FEE
     AND t.paymentMode = com.prolearner.all.enums.PaymentMode.CASH
    THEN t.amount

    WHEN t.sourceType = com.prolearner.all.enums.SourceType.FEE
     AND t.paymentMode = com.prolearner.all.enums.PaymentMode.BOTH
    THEN t.cashAmount

    ELSE 0
END), 0),

COALESCE(SUM(CASE
    WHEN t.sourceType = com.prolearner.all.enums.SourceType.FEE
     AND t.paymentMode = com.prolearner.all.enums.PaymentMode.ONLINE
    THEN t.amount

    WHEN t.sourceType = com.prolearner.all.enums.SourceType.FEE
     AND t.paymentMode = com.prolearner.all.enums.PaymentMode.BOTH
    THEN t.onlineAmount

    ELSE 0
END), 0),

COALESCE(SUM(CASE
    WHEN t.sourceType = com.prolearner.all.enums.SourceType.ADMISSION
     AND t.paymentMode = com.prolearner.all.enums.PaymentMode.CASH
    THEN t.amount

    WHEN t.sourceType = com.prolearner.all.enums.SourceType.ADMISSION
     AND t.paymentMode = com.prolearner.all.enums.PaymentMode.BOTH
    THEN t.cashAmount

    ELSE 0
END), 0),

COALESCE(SUM(CASE
    WHEN t.sourceType = com.prolearner.all.enums.SourceType.ADMISSION
     AND t.paymentMode = com.prolearner.all.enums.PaymentMode.ONLINE
    THEN t.amount

    WHEN t.sourceType = com.prolearner.all.enums.SourceType.ADMISSION
     AND t.paymentMode = com.prolearner.all.enums.PaymentMode.BOTH
    THEN t.onlineAmount

    ELSE 0
END), 0),

COALESCE(SUM(CASE
    WHEN t.paymentMode = com.prolearner.all.enums.PaymentMode.CASH
    THEN t.amount

    WHEN t.paymentMode = com.prolearner.all.enums.PaymentMode.BOTH
    THEN t.cashAmount

    ELSE 0
END), 0),

COALESCE(SUM(CASE
    WHEN t.paymentMode = com.prolearner.all.enums.PaymentMode.ONLINE
    THEN t.amount

    WHEN t.paymentMode = com.prolearner.all.enums.PaymentMode.BOTH
    THEN t.onlineAmount

    ELSE 0
END), 0),

COALESCE(SUM(t.amount), 0)

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
    THEN t.amount

    WHEN t.transactionType = com.prolearner.all.enums.TransactionType.INCOME
     AND t.paymentMode = com.prolearner.all.enums.PaymentMode.BOTH
    THEN t.cashAmount

    ELSE 0
END), 0),

COALESCE(SUM(CASE
    WHEN t.transactionType = com.prolearner.all.enums.TransactionType.INCOME
     AND t.paymentMode = com.prolearner.all.enums.PaymentMode.ONLINE
    THEN t.amount

    WHEN t.transactionType = com.prolearner.all.enums.TransactionType.INCOME
     AND t.paymentMode = com.prolearner.all.enums.PaymentMode.BOTH
    THEN t.onlineAmount

    ELSE 0
END), 0),

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
SELECT FUNCTION('DATE', t.transactionDate),

COALESCE(SUM(CASE
    WHEN t.transactionType = com.prolearner.all.enums.TransactionType.INCOME
     AND t.paymentMode = com.prolearner.all.enums.PaymentMode.CASH
    THEN t.amount

    WHEN t.transactionType = com.prolearner.all.enums.TransactionType.INCOME
     AND t.paymentMode = com.prolearner.all.enums.PaymentMode.BOTH
    THEN t.cashAmount

    ELSE 0
END), 0),

COALESCE(SUM(CASE
    WHEN t.transactionType = com.prolearner.all.enums.TransactionType.INCOME
     AND t.paymentMode = com.prolearner.all.enums.PaymentMode.ONLINE
    THEN t.amount

    WHEN t.transactionType = com.prolearner.all.enums.TransactionType.INCOME
     AND t.paymentMode = com.prolearner.all.enums.PaymentMode.BOTH
    THEN t.onlineAmount

    ELSE 0
END), 0),

COALESCE(SUM(CASE
    WHEN t.transactionType = com.prolearner.all.enums.TransactionType.EXPENSE
     AND t.paymentMode = com.prolearner.all.enums.PaymentMode.CASH
    THEN t.amount
    ELSE 0
END), 0),

COALESCE(SUM(CASE
    WHEN t.transactionType = com.prolearner.all.enums.TransactionType.EXPENSE
     AND t.paymentMode = com.prolearner.all.enums.PaymentMode.ONLINE
    THEN t.amount
    ELSE 0
END), 0)

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