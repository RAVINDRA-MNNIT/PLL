package com.prolearner.all.service;

import com.prolearner.all.dto.TransactionRequest;
import com.prolearner.all.entity.Transaction;
import com.prolearner.all.entity.User;
import com.prolearner.all.enums.PendingRequestStatus;
import com.prolearner.all.enums.TransactionType;
import com.prolearner.all.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
public class TransactionCommandService {

    private final TransactionRepository transactionRepository;

    public void saveExpense(TransactionRequest request,
                            Long adminId) {
        // Save expense
        saveTransaction(request, adminId, true);
    }

    public void saveExpensePending(TransactionRequest request,
                                   Long managerId) {
        saveTransaction(request, managerId, false);
    }

    @Transactional
    public void approveExpense(Long id, Long adminId) {

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found."));

        if (transaction.getTransactionType() != TransactionType.EXPENSE) {
            throw new RuntimeException("Invalid transaction.");
        }

        if (transaction.getStatus() != PendingRequestStatus.PENDING) {
            throw new RuntimeException("Only pending expenses can be approved.");
        }

        transaction.setStatus(PendingRequestStatus.APPROVED);
        transaction.setActionBy(adminId);
        transaction.setActionDate(OffsetDateTime.now());

        transactionRepository.save(transaction);
    }

    @Transactional
    public void rejectExpense(Long id, Long adminId) {

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found."));

        if (transaction.getTransactionType() != TransactionType.EXPENSE) {
            throw new RuntimeException("Invalid transaction.");
        }

        if (transaction.getStatus() != PendingRequestStatus.PENDING) {
            throw new RuntimeException("Only pending expenses can be rejected.");
        }

        transaction.setStatus(PendingRequestStatus.REJECTED);
        transaction.setActionBy(adminId);
        transaction.setActionDate(OffsetDateTime.now());

        transactionRepository.save(transaction);
    }

    @Transactional
    public void cancelExpense(Long id, Long userId) {

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found."));

        if (transaction.getTransactionType() != TransactionType.EXPENSE) {
            throw new RuntimeException("Invalid transaction.");
        }

        if (transaction.getStatus() != PendingRequestStatus.PENDING) {
            throw new RuntimeException("Only pending expenses can be cancelled.");
        }

        if (!transaction.getCreatedBy().equals(userId)) {
            throw new RuntimeException("You can cancel only your own expenses.");
        }

        transactionRepository.delete(transaction);
    }

//    public void saveAdmissionIncome(...) {
//
//    }
//
//    public void saveFeeIncome(...) {
//
//    }

    public void saveTransaction(TransactionRequest request,
                                Long userId,
                                Boolean isAdmin) {

        PendingRequestStatus status = isAdmin
                ? PendingRequestStatus.DIRECT
                : PendingRequestStatus.PENDING;

        Transaction transaction = new Transaction();

        transaction.setTransactionType(TransactionType.EXPENSE);
        transaction.setExpenseCategory(request.getCategory());
        transaction.setAmount(request.getAmount());
        transaction.setPaymentMode(request.getPaymentMode());
        transaction.setDescription(request.getDescription());
        transaction.setStatus(status);
        transaction.setCreatedBy(userId);


        transaction.setTransactionDate(
                request.getTransactionDate()
                        .atStartOfDay()
                        .atOffset(ZoneOffset.ofHoursMinutes(5, 30)));

        if (isAdmin) {
            transaction.setActionBy(userId);
            transaction.setActionDate(OffsetDateTime.now());
        }

        transactionRepository.save(transaction);
    }
}