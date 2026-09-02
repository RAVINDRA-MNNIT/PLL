package com.prolearner.all.service;

import com.prolearner.all.dto.PendingRequestDTO;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Service;

import com.prolearner.all.entity.ApprovalRequest;
import com.prolearner.all.entity.Students;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;

/**
 * Orchestrator Service
 * Combines Query + Command operations
 */
@Service
public class AdminService {

    private final PendingQueryService pendingQueryService;
    private final AdminCommandService adminCommandService;

    public AdminService(
            PendingQueryService pendingQueryService,
            AdminCommandService adminCommandService
    ) {
        this.pendingQueryService = pendingQueryService;
        this.adminCommandService = adminCommandService;
    }

    // ====================================================
    // 🔹 Create Admission
    // ====================================================

    public Students admission(
            PendingRequestDTO body,
            Long userId) {
        return adminCommandService.admission(body, userId);
    }

    // ====================================================
    // 🔹 Update Fees
    // ====================================================

    public void updateFee(PendingRequestDTO body, Long userId) {
        // ApprovalRequest r = pendingQueryService.get(id);
        adminCommandService.updateFee(body, userId);
    }
    
    // ====================================================
    // 🔹 Reject Fees
    // ====================================================

    public void reject(Long id, String reason, Long adminId) {
        ApprovalRequest r = pendingQueryService.get(id);
        adminCommandService.reject(r, reason, adminId);
    }

    // ====================================================
    // 🔹 Approve Request
    // ====================================================

    public void approve(Long id, Long adminId) {
        ApprovalRequest r = pendingQueryService.get(id);
        adminCommandService.approve(r, adminId);
    }

    // =========================================================
    // 🔹 Update Details Request
    // =========================================================

    public void updateStudent(String type, PendingRequestDTO body) {
        adminCommandService.updateStudent(type, body);
    }



    public void clearPendingApprovals() {
        adminCommandService.clearPendingApprovals();
    }

    // ====================================================
    // 🔹 CLEAR FEE RECORDS
    // ====================================================

    public void clearFeeRecords() {
        adminCommandService.clearFeeRecords();
    }

    // ====================================================
    // 🔹 RESET CONFIGURATION
    // ====================================================

    public void resetConfiguration() {
        adminCommandService.resetConfiguration();
    }

    // ====================================================
    // 🔹 RESET SEATS
    // ====================================================

    public void resetSeats() {
        adminCommandService.resetSeats();
    }

    // ====================================================
    // 🔹 CLEAR TRANSACTIONS BEFORE DATE
    // ====================================================

    public void clearTransactionsBefore(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate beforeDate
    ) {
        adminCommandService.clearTransactionsBefore(beforeDate);
    }
}