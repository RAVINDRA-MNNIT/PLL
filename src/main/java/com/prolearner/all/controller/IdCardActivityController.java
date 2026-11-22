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
            @RequestBody List<Long> studentIds,
            @RequestParam(defaultValue = "true") boolean addInActivity) {

        return ResponseEntity.ok(
                activityService.getBulkIdCards(studentIds, addInActivity)
        );
    }

    @PostMapping("/print-later")
    public ResponseEntity<List<PrintLaterResponse>> saveForLater(
            @Valid @RequestBody BulkPrintLaterRequest request) {
        List<PrintLaterResponse> savedIds = activityService.saveForLaterBulk(request.getStudentIds());
        return ResponseEntity.ok(savedIds);
    }

    @GetMapping("/print-later")
    public ResponseEntity<List<PrintLaterResponse>> getPrintLater() {
        List<PrintLaterResponse> records = activityService.getPrintLaterIds();
        return ResponseEntity.ok(records);
    }

// =========================================================
// REMOVE ONE SAVED ID
// PATCH /api/id-card-activities/print-later/{studentId}
// =========================================================

    @PatchMapping("/print-later/{studentId}")
    public ResponseEntity<Map<String, String>> removeSavedStudentId(
            @PathVariable Long studentId) {

        activityService.removeSavedStudentId(studentId);

        return ResponseEntity.ok(
                Map.of("message", "Student ID removed from Print Later successfully.")
        );
    }


// =========================================================
// CLEAR ALL SAVED IDS
// PATCH /api/id-card-activities/print-later
// =========================================================

    @PatchMapping("/print-later")
    public ResponseEntity<Map<String, Object>> clearAllSavedStudentIds() {

        int clearedCount = activityService.clearAllSavedStudentIds();

        return ResponseEntity.ok(Map.of(
                "message", "Saved Student IDs cleared successfully.",
                "clearedCount", clearedCount
        ));
    }

    // =========================================================
    // GET ALL ID CARD ACTIVITIES FOR AUTHENTICATED OWNER
    // GET /api/id-card-activities
    // =========================================================
    @GetMapping
    public ResponseEntity<List<IdCardActivityResponse>> getAllActivities() {
        List<IdCardActivityResponse> activities = activityService.getAllActivities();
        return ResponseEntity.ok(activities);
    }

    // =========================================================
    // UPDATE STATUS — BULK
    // POST /api/id-card-activities/status/bulk
    // =========================================================
        @PostMapping("/status/bulk")
        public ResponseEntity<Map<String, Object>> updateBulkStatus(
                @Valid @RequestBody BulkIdCardStatusRequest request) {

            return ResponseEntity.ok(
                    activityService.updateBulkStatus(
                            request.getStudentIds(),
                            request.getStatus()
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
        return ResponseEntity.ok(activityService.deleteActivitiesBulk(request.getStudentIds()));
    }

    @GetMapping("/{studentId}/id-card-status")
    public ResponseEntity<StudentIdCardStatusResponse> getStudentIdCardStatus(
            @PathVariable Long studentId) {
        StudentIdCardStatusResponse response = activityService.getStudentIdCardStatus(studentId);
        return ResponseEntity.ok(response);
    }

}