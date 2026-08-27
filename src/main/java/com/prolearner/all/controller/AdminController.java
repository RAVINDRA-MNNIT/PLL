package com.prolearner.all.controller;

import com.prolearner.all.dto.*;
import com.prolearner.all.entity.Transaction;
import com.prolearner.all.service.TransactionCommandService;
import com.prolearner.all.service.TransactionQueryService;
import com.prolearner.all.service.TransactionService;
import org.springframework.web.bind.annotation.*;

import com.prolearner.all.entity.Students;

import com.prolearner.all.service.AdminService;

import java.time.YearMonth;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final TransactionService transactionService;


    public AdminController(AdminService as, TransactionService transactionService) {
        this.adminService = as;
        this.transactionService = transactionService;
    }

    // ====================================================
    // 🔹 Create Admission
    // ====================================================

    @PostMapping("/admission")
    public Students admission(
        @RequestBody PendingRequestDTO body
    ) {
        Long userId = 2L; // TODO: replace with logged-in user
        return adminService.admission(body, userId);
    }

    // ====================================================
    // 🔹 Update Fee
    // ====================================================

    @PostMapping("/updatefee")
    public void updateFee(
        @RequestBody PendingRequestDTO body
    ) {
        Long userId = 2L; // TODO: replace with logged-in user
        adminService.updateFee(body, userId);
    }

    // ====================================================
    // 🔹 Update Detail Request
    // ====================================================

     @PostMapping("/updatestudent/{type}")
     public void updateStudent(
             @PathVariable String type,
             @RequestBody PendingRequestDTO body
     ) {
         //Long userId = 2L; // TODO: from auth
         adminService.updateStudent(type, body);
     }

    // ====================================================
    // 🔹 Approve Request
    // ====================================================

    @PostMapping("/pending/approve")
    public void approve(
            @RequestBody Long requestId
    ) {
        Long adminId = 2L; // TODO: replace with logged-in admin
        adminService.approve(requestId, adminId);
    }

    // ====================================================
    // 🔹 Reject Request
    // ====================================================

    @PatchMapping("/pending/reject")
    public void reject(
            @RequestBody CancelRequestDTO request
    ) {
        Long adminId = 2L;
        adminService.reject(request.getId(),  request.getReason(), adminId);
    }

    // ====================================================
    // 🔹 Save Expenses Request
    // ====================================================

    @PostMapping("/expense/save")
    public void saveExpense(@RequestBody TransactionRequest request) {
        Long adminId = 2L;
        transactionService.saveExpense(request, adminId);
    }

    // ====================================================
    // 🔹 Get Expenses Request
    // ====================================================

    @GetMapping("/expense/get")
    public List<Transaction> expenses() {
        Long managerId = 1L;
        return transactionService.getExpenses();
    }

    // ====================================================
    // 🔹 Get Expenses Request
    // ====================================================

    @PostMapping("/expense/approve")
    public void approveExpense(@RequestBody Long requestId) {
        Long adminId = 2L;
        transactionService.approveExpense(requestId, adminId);
    }


    @PostMapping("/expense/reject")
    public void rejectExpense(@RequestBody Long requestId) {
        Long adminId = 2L;
        transactionService.rejectExpense(requestId, adminId);
    }

    @GetMapping("/transactions/expense/dashboard")
    public ExpenseDashboardResponse getExpenseDashboard() {
        return transactionService.getExpenseDashboard();
    }

    @GetMapping("/income/daily")
    public List<Transaction> getDailyIncome() {
        return transactionService.getDailyIncome();
    }

    @GetMapping("/income/monthly")
    public MonthlyIncomeSummary getMonthlyIncome(
            @RequestParam YearMonth month
    ) {
        return transactionService.getMonthlyIncome(month);
    }

    @GetMapping("/profit/summary")
    public ProfitSummary getProfitSummary(
    ) {
        return transactionService.getProfitSummary();
    }
}