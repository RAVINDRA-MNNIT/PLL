package com.prolearner.all.controller;

import com.prolearner.all.dto.*;
import com.prolearner.all.service.IdCardActivityService;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/id-card-activities")
public class IdCardActivityController {

    private final IdCardActivityService activityService;

    public IdCardActivityController(
            IdCardActivityService activityService) {
        this.activityService = activityService;
    }

    @PostMapping("/bulk-id-cards")
    public ResponseEntity<List<BulkIdCardResponse>> getBulkIdCards(
            @RequestBody List<Long> studentIds) {

        Long ownerId = getAuthenticatedOwnerId();

        return ResponseEntity.ok(
                activityService.getBulkIdCards(studentIds, ownerId)
        );
    }

    @PostMapping("/print-later")
    public ResponseEntity<List<PrintLaterResponse>> saveForLater(
            @Valid @RequestBody BulkPrintLaterRequest request) {

        Long ownerId = getAuthenticatedOwnerId();

        List<PrintLaterResponse> savedIds =
                activityService.saveForLaterBulk(
                        request.getStudentIds(),
                        ownerId
                );

        return ResponseEntity.ok(savedIds);
    }

    @GetMapping("/print-later")
    public ResponseEntity<List<PrintLaterResponse>> getPrintLater() {

        Long ownerId = getAuthenticatedOwnerId();

        List<PrintLaterResponse> records =
                activityService.getPrintLaterIds(ownerId);

        return ResponseEntity.ok(records);
    }

    // =========================================================
    // REMOVE ONE SAVED ID
    // DELETE /api/id-card-activities/print-later/{studentId}
    // =========================================================
    @DeleteMapping("/print-later/{studentId}")
    public ResponseEntity<Map<String, String>> removeSavedStudentId(
            @PathVariable Long studentId) {

        Long ownerId = getAuthenticatedOwnerId();

        activityService.removeSavedStudentId(studentId, ownerId);

        return ResponseEntity.ok(Map.of(
                "message",
                "Student ID removed from Print Later successfully."
        ));
    }

    // =========================================================
    // CLEAR ALL SAVED IDS
    // DELETE /api/id-card-activities/print-later
    // =========================================================
    @DeleteMapping("/print-later")
    public ResponseEntity<Map<String, Object>> clearAllSavedStudentIds() {

        Long ownerId = getAuthenticatedOwnerId();

        int clearedCount = activityService.clearAllSavedStudentIds(ownerId);

        return ResponseEntity.ok(Map.of(
                "message",
                "Saved Student IDs cleared successfully.",
                "clearedCount",
                clearedCount
        ));
    }

    private Long getAuthenticatedOwnerId() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "User is not authenticated."
            );
        }

        return Long.valueOf(authentication.getName());
    }

    // =========================================================
    // GET ALL ID CARD ACTIVITIES FOR AUTHENTICATED OWNER
    // GET /api/id-card-activities
    // =========================================================
    @GetMapping
    public ResponseEntity<List<IdCardActivityResponse>> getAllActivities() {

        Long ownerId = getAuthenticatedOwnerId();

        List<IdCardActivityResponse> activities =
                activityService.getAllActivities(ownerId);

        return ResponseEntity.ok(activities);
    }

    // =========================================================
// MARK PRINTED — BULK
// POST /api/id-card-activities/mark-printed/bulk
// =========================================================
    @PostMapping("/mark-printed/bulk")
    public ResponseEntity<Map<String, Object>> markPrintedBulk(
            @Valid @RequestBody BulkPrintLaterRequest request) {

        Long ownerId = getAuthenticatedOwnerId();

        return ResponseEntity.ok(
                activityService.markPrintedBulk(
                        request.getStudentIds(),
                        ownerId
                )
        );
    }

    // =========================================================
    // MARK ISSUED — BULK
    // POST /api/id-card-activities/mark-issued/bulk
    // =========================================================
    @PostMapping("/mark-issued/bulk")
    public ResponseEntity<Map<String, Object>> markIssuedBulk(
            @Valid @RequestBody BulkPrintLaterRequest request) {

        Long ownerId = getAuthenticatedOwnerId();

        return ResponseEntity.ok(
                activityService.markIssuedBulk(
                        request.getStudentIds(),
                        ownerId
                )
        );
    }

    // =========================================================
    // DELETE ACTIVITIES — BULK
    // POST /api/id-card-activities/bulk
    // =========================================================
    @PostMapping("/bulk")
    public ResponseEntity<Map<String, Object>> deleteActivitiesBulk(
            @Valid @RequestBody BulkPrintLaterRequest request) {

        Long ownerId = getAuthenticatedOwnerId();

        return ResponseEntity.ok(
                activityService.deleteActivitiesBulk(
                        request.getStudentIds(),
                        ownerId
                )
        );
    }

    @GetMapping("/{studentId}/id-card-status")
    public ResponseEntity<StudentIdCardStatusResponse> getStudentIdCardStatus(
            @PathVariable Long studentId) {

        StudentIdCardStatusResponse response =
                activityService.getStudentIdCardStatus(studentId);

        return ResponseEntity.ok(response);
    }

}