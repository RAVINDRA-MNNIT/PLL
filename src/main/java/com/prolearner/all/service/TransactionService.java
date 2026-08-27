package com.prolearner.all.service;

import com.prolearner.all.dto.*;
import com.prolearner.all.entity.ApprovalRequest;
import com.prolearner.all.entity.Transaction;
import com.prolearner.all.entity.User;
import com.prolearner.all.enums.PendingRequestStatus;
import com.prolearner.all.enums.TransactionType;
import com.prolearner.all.service.ManagerCommandService;
import com.prolearner.all.service.TransactionCommandService;
import com.prolearner.all.service.TransactionQueryService;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.util.List;

@Service
public class TransactionService {

    private final TransactionCommandService transactionCommandService;
    private final TransactionQueryService transactionQueryService;


    public TransactionService(TransactionCommandService transactionCommandService, TransactionQueryService transactionQueryService
    ) {
        this.transactionCommandService = transactionCommandService;
        this.transactionQueryService = transactionQueryService;
    }


    public void saveExpense(TransactionRequest request,
                            Long userId) {
        transactionCommandService.saveExpense(request, userId);
    }

    public void saveExpensePending(TransactionRequest request,
                            Long userId) {
        transactionCommandService.saveExpensePending(request, userId);
    }

    public void approveExpense(Long id,
                               Long adminId) {
        transactionCommandService.approveExpense(id, adminId);
    }

    public void rejectExpense(Long id,
                              Long adminId) {
        transactionCommandService.rejectExpense(id, adminId);
    }

    public void cancelExpense(Long id,
                              Long managerId) {

        transactionCommandService.cancelExpense(id, managerId);
    }

    public ExpenseDashboardResponse getExpenseDashboard() {
        return transactionQueryService.getExpenseDashboard();
    }

//    public void saveAdmissionIncome(...) {
//
//    }
//
//    public void saveFeeIncome(...) {
//
//    }



    public List<Transaction> getExpenses() {
        return transactionQueryService.getExpenses();
    }

    public List<Transaction>  getDailyIncome() {
        return transactionQueryService.getDailyIncome();
    }
//
    public MonthlyIncomeSummary getMonthlyIncome(YearMonth month) {
        return transactionQueryService.getMonthlyIncome(month);
    }

    public ProfitSummary getProfitSummary() {
        return transactionQueryService.getProfitSummary();
    }
}