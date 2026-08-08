package com.prolearner.all.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.prolearner.all.dto.MemberApplicationRequest;
import com.prolearner.all.dto.PendingCollectionSummaryResponse;
import com.prolearner.all.dto.PendingFeeResponse;
import com.prolearner.all.service.ManagerApprovalService;
import com.prolearner.all.service.SessionService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/manager")
public class ManagerApprovalController {

    private final ManagerApprovalService service;
    private final SessionService sessionService;

    public ManagerApprovalController(
            ManagerApprovalService service,
            SessionService sessionService
    ) {
        this.service = service;
        this.sessionService = sessionService;
    }

    // ====================================================
    // Pending Admissions
    // ====================================================

    @GetMapping("/pending-admissions")
    public ResponseEntity<?> getPendingAdmissions() {

        try {

            return ResponseEntity.ok(
                    service.getPendingAdmissions()
            );

        } catch (Exception exception) {

            exception.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "exception", exception.getClass().getName(),
                            "message", String.valueOf(exception.getMessage())
                    ));
        }
    }

    // ====================================================
    // Pending Fees
    // ====================================================

    @GetMapping("/pending-fees")
    public ResponseEntity<List<PendingFeeResponse>> getPendingFees() {

        return ResponseEntity.ok(
                service.getPendingFees()
        );
    }

    // ====================================================
    // View Admission
    // ====================================================

    @GetMapping("/pending-admissions/{requestId}")
    public ResponseEntity<?> getPendingAdmission(
            @PathVariable Long requestId
    ) {

        try {

            return ResponseEntity.ok(
                    service.getPendingAdmission(requestId)
            );

        } catch (Exception exception) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "message",
                            exception.getMessage()
                    ));
        }
    }

    // ====================================================
    // Update Admission
    // ====================================================

    @PutMapping("/pending-admissions/{requestId}")
    public ResponseEntity<?> updatePendingAdmission(
            @PathVariable Long requestId,
            @RequestBody MemberApplicationRequest request
    ) {

        try {

            service.updatePendingAdmission(
                    requestId,
                    request
            );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Pending admission updated successfully."
                    )
            );

        } catch (IllegalArgumentException exception) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            exception.getMessage()
                    ));
        }
    }

    // ====================================================
    // Cancel Admission
    // ====================================================

    @PatchMapping("/pending-admissions/{requestId}/cancel")
    public ResponseEntity<?> cancelPendingAdmission(
            @PathVariable Long requestId,
            HttpServletRequest request
    ) {

        try {

            Long managerId =
                    sessionService.getCurrentUserId(request);

            service.cancelPendingAdmission(
                    requestId,
                    managerId
            );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Admission request cancelled."
                    )
            );

        } catch (IllegalStateException exception) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message",
                            exception.getMessage()
                    ));

        } catch (IllegalArgumentException exception) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            exception.getMessage()
                    ));
        }
    }

    // ====================================================
    // Update Pending Fee
    // ====================================================

    @PutMapping("/pending-fees/{requestId}")
    public ResponseEntity<?> updatePendingFee(
            @PathVariable Long requestId,
            @RequestBody Map<String, Object> requestData
    ) {

        try {

            service.updatePendingFee(
                    requestId,
                    requestData
            );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Fee request updated successfully."
                    )
            );

        } catch (IllegalArgumentException exception) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            exception.getMessage()
                    ));
        }
    }

    // ====================================================
    // Cancel Pending Fee
    // ====================================================

    @PatchMapping("/pending-fees/{requestId}/cancel")
    public ResponseEntity<?> cancelPendingFee(
            @PathVariable Long requestId,
            HttpServletRequest request
    ) {

        try {

            Long managerId =
                    sessionService.getCurrentUserId(request);

            service.cancelPendingFee(
                    requestId,
                    managerId
            );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Fee request cancelled."
                    )
            );

        } catch (IllegalStateException exception) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message",
                            exception.getMessage()
                    ));

        } catch (IllegalArgumentException exception) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            exception.getMessage()
                    ));
        }
    }

        @GetMapping("/pending-collection-summary")
        public PendingCollectionSummaryResponse getPendingCollectionSummary() {

        return service.getPendingCollectionSummary();

        }
}