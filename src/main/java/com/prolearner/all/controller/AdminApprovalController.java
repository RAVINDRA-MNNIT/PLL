package com.prolearner.all.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.prolearner.all.dto.RejectAdmissionRequest;
import com.prolearner.all.service.AdminApprovalService;
import com.prolearner.all.service.SessionService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/admin")
public class AdminApprovalController {

    private final AdminApprovalService adminApprovalService;
    private final SessionService sessionService;

    public AdminApprovalController(
            AdminApprovalService adminApprovalService,
            SessionService sessionService
    ) {
        this.adminApprovalService = adminApprovalService;
        this.sessionService = sessionService;
    }

    @PostMapping("/pending-admissions/{id}/approve")
    public ResponseEntity<Void> approveAdmission(
            @PathVariable Long id,
            HttpServletRequest request
    ) {

        Long adminId =
                sessionService.getCurrentUserId(request);

        adminApprovalService.approveAdmission(
                id,
                adminId
        );

        return ResponseEntity.ok().build();
    }

    @PostMapping("/pending-admissions/{id}/reject")
    public ResponseEntity<Void> rejectAdmission(
            @PathVariable Long id,
            @RequestBody RejectAdmissionRequest requestBody,
            HttpServletRequest request
    ) {

        Long adminId =
                sessionService.getCurrentUserId(request);

        adminApprovalService.rejectAdmission(
                id,
                adminId,
                requestBody.reason()
        );

        return ResponseEntity.ok().build();
    }
}