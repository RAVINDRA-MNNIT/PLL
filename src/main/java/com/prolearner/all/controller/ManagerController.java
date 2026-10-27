package com.prolearner.all.controller;
import com.prolearner.all.dto.TransactionRequest;
import com.prolearner.all.service.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.prolearner.all.dto.CancelRequestDTO;
import com.prolearner.all.entity.ApprovalRequest;
import com.prolearner.all.dto.PendingRequestDTO;

@RestController
@RequestMapping("/api/manager")
public class ManagerController {

    private final ManagerService service;
    private final TransactionService transactionService;

    public ManagerController(
            ManagerService service,
            TransactionService transactionService
    ) {
        this.service = service;
        this.transactionService = transactionService;
    }

    // ====================================================
    // 🔹 Get Logged-In User ID
    // ====================================================

    private Long getLoggedInUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("User is not authenticated.");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof Long) {
            return (Long) principal;
        }
        return Long.valueOf(principal.toString());
    }

    // ====================================================
    // 🔹 Create Request
    // ====================================================

    @PostMapping("/approvalrequest/create/{type}")
    public ApprovalRequest create(
            @PathVariable String type,
            @RequestBody PendingRequestDTO body,
            Authentication authentication
    ) {
        Long userId = getLoggedInUserId(authentication);
        return service.create(
                type,
                body,
                userId
        );
    }

    // ====================================================
    // 🔹 Update Request
    // ====================================================

    @PutMapping("/approvalrequest/update")
    public ApprovalRequest update(
            @RequestBody PendingRequestDTO body,
            Authentication authentication
    ) {
        Long userId = getLoggedInUserId(authentication);
        return service.update(
                body.getId(),
                body,
                userId
        );
    }

    // ====================================================
    // 🔹 Cancel Request
    // ====================================================

    @PatchMapping("/approvalrequest/cancel")
    public void cancel(
            @RequestBody CancelRequestDTO request
    ) {
        service.cancel(
                request.getId(),
                request.getReason()
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
        Long managerId = getLoggedInUserId(authentication);
        transactionService.saveExpensePending(
                request,
                managerId
        );
    }

    // ====================================================
    // 🔹 Cancel Expense
    // ====================================================

    @PostMapping("/expense/cancel")
    public void cancelExpense(
            @RequestBody Long requestId,
            Authentication authentication
    ) {
        Long managerId = getLoggedInUserId(authentication);
        transactionService.cancelExpense(
                requestId,
                managerId
        );
    }
}