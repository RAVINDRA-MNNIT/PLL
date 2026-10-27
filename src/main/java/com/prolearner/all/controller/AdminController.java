package com.prolearner.all.controller;

import com.prolearner.all.dto.*;
import com.prolearner.all.entity.Transaction;
import com.prolearner.all.entity.Students;
import com.prolearner.all.service.*;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final TransactionService transactionService;
    private final ConfigurationService configurationService;
    private final BatchService batchService;

    public AdminController(
            AdminService as,
            TransactionService transactionService,
            ConfigurationService configurationService,
            PendingService pendingService,
            BatchService batchService
    ) {
        this.adminService = as;
        this.transactionService = transactionService;
        this.configurationService = configurationService;
        this.batchService = batchService;
    }

    // ====================================================
    // LOGGED-IN USER ID
    // ====================================================

    private Long getLoggedInUserId(Authentication authentication) {

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new IllegalStateException(
                    "User is not authenticated."
            );
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof Long) {
            return (Long) principal;
        }

        return Long.valueOf(principal.toString());
    }

    // ====================================================
    // 🔹 Create Admission
    // ====================================================

    @PostMapping("/admission")
    public Students admission(
            @RequestBody PendingRequestDTO body,
            Authentication authentication
    ) {
        Long userId = getLoggedInUserId(authentication);

        return adminService.admission(body, userId);
    }

    // ====================================================
    // 🔹 Update Fee
    // ====================================================

    @PostMapping("/updatefee")
    public void updateFee(
            @RequestBody PendingRequestDTO body,
            Authentication authentication
    ) {
        Long userId = getLoggedInUserId(authentication);

        adminService.updateFee(body, userId);
    }

    // ====================================================
    // 🔹 Update Detail Request
    // ====================================================

    @PostMapping("/updatestudent/{type}")
    public void updateStudent(
            @PathVariable String type,
            @RequestBody PendingRequestDTO body,
            Authentication authentication
    ) {
        Long userId = getLoggedInUserId(authentication);
        adminService.updateStudent(type, body, userId);
    }

    // ====================================================
    // 🔹 Approve Request
    // ====================================================

    @PostMapping("/pending/approve")
    public void approve(
            @RequestBody Long requestId,
            Authentication authentication
    ) {
        Long adminId = getLoggedInUserId(authentication);

        adminService.approve(requestId, adminId);
    }

    // ====================================================
    // 🔹 Reject Request
    // ====================================================

    @PatchMapping("/pending/reject")
    public void reject(
            @RequestBody CancelRequestDTO request,
            Authentication authentication
    ) {
        Long adminId = getLoggedInUserId(authentication);

        adminService.reject(
                request.getId(),
                request.getReason(),
                adminId
        );
    }

    // ====================================================
    // 🔹 Save Expenses Request
    // ====================================================

    @PostMapping("/expense/save")
    public void saveExpense(
            @RequestBody TransactionRequest request,
            Authentication authentication
    ) {
        Long adminId = getLoggedInUserId(authentication);

        transactionService.saveExpense(
                request,
                adminId
        );
    }

    // ====================================================
    // 🔹 Get Expenses Request
    // ====================================================

    @GetMapping("/expense")
    public List<Transaction> expenses(
            @RequestParam String month
    ) {
        return transactionService.getExpenses(month);
    }

    // ====================================================
    // 🔹 Approve Expense
    // ====================================================

    @PostMapping("/expense/approve")
    public void approveExpense(
            @RequestBody Long requestId,
            Authentication authentication
    ) {
        Long adminId = getLoggedInUserId(authentication);

        transactionService.approveExpense(
                requestId,
                adminId
        );
    }

    // ====================================================
    // 🔹 Reject Expense
    // ====================================================

    @PostMapping("/expense/reject")
    public void rejectExpense(
            @RequestBody Long requestId,
            Authentication authentication
    ) {
        Long adminId = getLoggedInUserId(authentication);

        transactionService.rejectExpense(
                requestId,
                adminId
        );
    }

    // ====================================================
    // 🔹 Get Daily Income
    // ====================================================

    @GetMapping("/income/daily")
    public List<Transaction> getDailyIncome(
            @RequestParam String month
    ) {
        return transactionService.getDailyIncome(month);
    }

    // ====================================================
    // 🔹 Get Monthly Income
    // ====================================================

    @GetMapping("/income/monthly")
    public MonthlyIncomeSummary getMonthlyIncome(
            @RequestParam YearMonth month
    ) {
        return transactionService.getMonthlyIncome(month);
    }

    // ====================================================
    // 🔹 Get Profit Summary
    // ====================================================

    @GetMapping("/profit/summary")
    public ProfitSummary getProfitSummary(
            @RequestParam String month
    ) {
        return transactionService.getProfitSummary(month);
    }

    // ====================================================
    // 🔹 Save General Configuration
    // ====================================================

    @PutMapping("/configuration/general")
    public void saveGeneralConfiguration(
            @RequestBody ConfigurationDTO configuration
    ) {
        configurationService.saveGeneralConfiguration(
                configuration
        );
    }

    // ====================================================
    // 🔹 Save Manager Configuration
    // ====================================================

    @PutMapping("/configuration/manager")
    public void saveManagerConfiguration(
            @RequestBody ConfigurationDTO configuration
    ) {
        configurationService.saveManagerConfiguration(
                configuration
        );
    }

    // ====================================================
    // 🔹 Save Student Configuration
    // ====================================================

    @PutMapping("/configuration/student")
    public void saveStudentConfiguration(
            @RequestBody ConfigurationDTO configuration
    ) {
        configurationService.saveStudentConfiguration(
                configuration
        );
    }

    // ====================================================
    // 🔹 Get Users
    // ====================================================

    @GetMapping("/get/users")
    public void getUsers(
            @RequestBody ConfigurationDTO configuration
    ) {
        configurationService.saveStudentConfiguration(
                configuration
        );
    }

    // ====================================================
    // 🔹 CLEAR PENDING APPROVALS
    // ====================================================

    @DeleteMapping("/pending-approvals")
    public void clearPendingApprovals() {
        adminService.clearPendingApprovals();
    }

    // ====================================================
    // 🔹 CLEAR FEE RECORDS
    // ====================================================

    @PostMapping("/fee-records/cleanup")
    public void clearFeeRecords() {
        adminService.clearFeeRecords();
    }

    // ====================================================
    // 🔹 RESET CONFIGURATION
    // ====================================================

    @PostMapping("/configuration/reset")
    public void resetConfiguration() {
        adminService.resetConfiguration();
    }

    // ====================================================
    // 🔹 RESET SEATS
    // ====================================================

    @PostMapping("/seats/reset")
    public void resetSeats() {
        adminService.resetSeats();
    }

    // ====================================================
    // 🔹 CLEAR TRANSACTIONS BEFORE DATE
    // ====================================================

    @PostMapping("/transactions/cleanup")
    public void clearTransactions(
            @RequestParam("beforeDate")
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate beforeDate
    ) {
        adminService.clearTransactionsBefore(
                beforeDate
        );
    }

    // ====================================================
    // 🔹 CREATE BATCH
    // ====================================================

    @PostMapping("/batch/create")
    public ResponseEntity<BatchResponse> create(
            @RequestBody BatchRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(batchService.create(request));
    }

    // ====================================================
    // 🔹 UPDATE BATCH
    // ====================================================

    @PutMapping("/batch/update/{id}")
    public BatchResponse update(
            @PathVariable Long id,
            @RequestBody BatchRequest request
    ) {
        return batchService.update(id, request);
    }

    // ====================================================
    // 🔹 DELETE BATCH
    // ====================================================

    @DeleteMapping("/batch/delete/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long replaceWithBatchId
    ) {
        batchService.delete(
                id,
                replaceWithBatchId
        );

        return ResponseEntity
                .noContent()
                .build();
    }
}