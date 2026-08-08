package com.prolearner.all.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.prolearner.all.entity.ApprovalRequest;
import com.prolearner.all.enums.RequestType;
import com.prolearner.all.enums.Status;

/**
 * Orchestrator Service
 * Combines Query + Command operations
 */
@Service
public class PendingService {

    private final PendingQueryService queryService;
    private final PendingCommandService commandService;

    public PendingService(
            PendingQueryService queryService,
            PendingCommandService commandService
    ) {
        this.queryService = queryService;
        this.commandService = commandService;
    }

    // ====================================================
    // 🔹 QUERY
    // ====================================================

    // ✅ Default → PENDING
    public List<Map<String, Object>> list(RequestType type) {
        
        return queryService.list(type, Status.PENDING);
    }

    // ✅ Optional custom status (flexible)
    public List<Map<String, Object>> list(RequestType type, Status status) {
        return queryService.list(type, status);
    }

    public ApprovalRequest get(RequestType type, Long id) {
        ApprovalRequest request = queryService.get(id);

        if (!request.getRequestType().equals(type)) {
            throw new IllegalArgumentException("Request type mismatch");
        }

        return request;
    }

    public List<Map<String, Object>> getAll() {
        return queryService.getAll();
    }

    public Map<String, Object> getCollectionSummary() {
        return queryService.getCollectionSummary(); // ✅ CORRECT
    }

    // ====================================================
    // 🔹 MANAGER ACTIONS
    // ====================================================

    public ApprovalRequest create(
            String typeStr,
            Map<String, Object> body,
            Long userId
    ) {
        return commandService.create(typeStr, body, userId);
    }

    // ⚠️ ONLY keep this if method exists in commandService
    public void update(Long id, Map<String, Object> body) {
        commandService.update(id, body);
    }

    public void cancel(Long id) {
        commandService.cancel(id);
    }

    // ====================================================
    // 🔹 ADMIN ACTIONS
    // ====================================================

    public void approve(Long id, Long adminId) {
        ApprovalRequest r = queryService.get(id);
        commandService.approve(r, adminId);
    }

    public void reject(Long id, String reason, Long adminId) {
        ApprovalRequest r = queryService.get(id);
        commandService.reject(r, reason, adminId);
    }

        // ====================================================
    // 🔹 CREATE REQUEST
    // ====================================================

    public ApprovalRequest create(
            String type,
            Long studentId,
            Map<String, Object> body,
            Long userId
    ) {

        RequestType requestType;

        try {
            requestType = RequestType.from(type);
        } catch (Exception e) {
            throw new RuntimeException("Invalid request type: " + type);
        }

        ApprovalRequest request = new ApprovalRequest();
        request.setRequestType(requestType);
        request.setStudentId(studentId);
        request.setRequestedBy(userId);
        request.setRequestData(body);
        request.setStatus(Status.PENDING);
        request.setRequestedAt(OffsetDateTime.now());
        return commandService.create(type, studentId, body, userId);
    }

       // ====================================================
    // 🔥 APPLY CHANGES (MOST IMPORTANT)
    // ====================================================

    // private void applyChanges(ApprovalRequest req) {

    //     Student student = studentRepo.findById(req.getStudentId())
    //             .orElseThrow(() -> new RuntimeException("Student not found"));

    //     Map<String, Object> data = req.getRequestData();

    //     switch (req.getRequestType()) {

    //         case STUDENT_UPDATE:
    //             if (data.get("fullName") != null)
    //                 student.setFullName((String) data.get("fullName"));

    //             if (data.get("mobileNumber") != null)
    //                 student.setMobileNumber((String) data.get("mobileNumber"));

    //             if (data.get("guardianNumber") != null)
    //                 student.setGuardianNumber((String) data.get("guardianNumber"));
    //             break;

    //         case SEAT_CHANGE:
    //             if (data.get("seatId") != null)
    //                 student.setSeatId(Long.valueOf(data.get("seatId").toString()));
    //             break;

    //         case STATUS_UPDATE:
    //             if (data.get("status") != null)
    //                 student.setEnrollmentStatus((String) data.get("status"));
    //             break;
    //     }

    //     studentRepo.save(student);
    // }
}