package com.prolearner.all.controller;

import java.util.List;
import java.util.Map;

import com.prolearner.all.dto.TransactionRequest;
import com.prolearner.all.entity.Transaction;
import com.prolearner.all.service.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.prolearner.all.dto.CancelRequestDTO;
import com.prolearner.all.entity.ApprovalRequest;
import com.prolearner.all.enums.RequestType;
import com.prolearner.all.dto.PendingRequestDTO;
import com.prolearner.all.dto.CancelRequestDTO;



@RestController
@RequestMapping("/api/manager")
public class ManagerController {

    private final ManagerService service;
    private final TransactionService transactionService;



    public ManagerController(ManagerService service, TransactionService transactionService) {
        this.service = service;
        this.transactionService = transactionService;
    }

    // ====================================================
    // 🔹 Create Request
    // ====================================================

    @PostMapping("/approvalrequest/create/{type}")
    public ApprovalRequest create(
        @PathVariable String type,
        @RequestBody PendingRequestDTO body
    ) {
        Long userId = 1L; // TODO: replace with logged-in user
        if (body.getRequestedBy() != null) {
            userId = body.getRequestedBy();
        }
        return service.create(type, body, userId);
    }

    // ====================================================
    // 🔹 Update Request
    // ====================================================

    @PutMapping("/approvalrequest/update")
    public ApprovalRequest update(
            @RequestBody PendingRequestDTO body
    ) {
        Long userId = 1L; // TODO: replace with logged-in user
        if (body.getRequestedBy() != null) {
            userId = body.getRequestedBy();
        }
        return service.update(body.getId(), body, userId);
    }

    // ====================================================
    // 🔹 Cancel Request
    // ====================================================

    @PatchMapping("/approvalrequest/cancel")
    public void cancel(
            @RequestBody CancelRequestDTO request) {
        service.cancel(request.getId(), request.getReason());
    }

    // ====================================================
    // 🔹 Save Expenses Request
    // ====================================================

    @PostMapping("/expense/save")
    public void saveExpense(@RequestBody TransactionRequest request) {
        Long managerId = 1L;
        transactionService.saveExpensePending(request, managerId);
    }

    @PostMapping("/expense/cancel")
    public void cancelExpense(@RequestBody Long requestId) {
        Long managerId = 1L;
        transactionService.cancelExpense(requestId, managerId);
    }
}