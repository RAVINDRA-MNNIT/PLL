package com.prolearner.all.service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.prolearner.all.dto.PendingCollectionSummaryResponse;
import com.prolearner.all.entity.Transaction;
import com.prolearner.all.enums.PaymentMode;
import com.prolearner.all.enums.TransactionType;
import com.prolearner.all.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import com.prolearner.all.entity.ApprovalRequest;
import com.prolearner.all.enums.RequestType;
import com.prolearner.all.enums.PendingRequestStatus;
import com.prolearner.all.repository.ApprovalRequestRepository;

@Service
public class PendingQueryService {

    private final ApprovalRequestRepository repo;
    private final TransactionRepository transactionRepository ;


    public PendingQueryService(ApprovalRequestRepository repo, TransactionRepository transactionRepository) {
        this.repo = repo;
        this.transactionRepository = transactionRepository;
    }

    // ====================================================
    // 🔹 LIST BY TYPE + STATUS
    // ====================================================
    public List<Map<String, Object>> list(RequestType type, List<PendingRequestStatus> statuses) {

        return repo.getPendingData(
                type.name(),
                statuses.stream()
                        .map(Enum::name)
                        .toList()
        );
    }

    // ====================================================
    // 🔹 GET BY ID
    // ====================================================
    public ApprovalRequest get(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));
    }

    // ====================================================
    // 🔹 GET ALL (LATEST FIRST)
    // ====================================================
//    public List<Map<String, Object>> getAll() {
//        return repo.getPendingData(null, "PENDING");
//    }

    public List<Map<String, Object>> fetchNonPending() {
        return repo.fetchNonPending();
    }

    // ====================================================
    // 🔹 DASHBOARD SUMMARY
    // ====================================================

    public PendingCollectionSummaryResponse getCollectionSummary() {

        List<Object[]> list = repo.sumByPaymentMode();
        Object[] result = list.getFirst();

        BigDecimal cashCollection = BigDecimal.ZERO;
        BigDecimal onlineCollection = BigDecimal.ZERO;

        if (result != null) {
            cashCollection = result[0] != null
                    ? BigDecimal.valueOf(((Number) result[0]).doubleValue())
                    : BigDecimal.ZERO;

            onlineCollection = result[1] != null
                    ? BigDecimal.valueOf(((Number) result[1]).doubleValue())
                    : BigDecimal.ZERO;
        }

        List<Transaction> pendingExpenses =
                transactionRepository.findByTransactionTypeAndStatusOrderByTransactionDateDesc(
                        TransactionType.EXPENSE,
                        PendingRequestStatus.PENDING
                );

        BigDecimal cashPendingExpenses = BigDecimal.ZERO;
        BigDecimal onlinePendingExpenses = BigDecimal.ZERO;

        for (Transaction transaction : pendingExpenses) {

            if (transaction.getPaymentMode() == PaymentMode.CASH) {
                cashPendingExpenses =
                        cashPendingExpenses.add(transaction.getAmount());
            } else if (transaction.getPaymentMode() == PaymentMode.ONLINE) {
                onlinePendingExpenses =
                        onlinePendingExpenses.add(transaction.getAmount());
            }
        }

        return new PendingCollectionSummaryResponse(
                cashCollection,
                onlineCollection,
                cashPendingExpenses,
                onlinePendingExpenses
        );
    }

    public Integer getPendingCount() {
        return repo.countByStatus(PendingRequestStatus.PENDING);
    }

}