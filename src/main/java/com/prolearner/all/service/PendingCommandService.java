package com.prolearner.all.service;

import java.time.OffsetDateTime;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.prolearner.all.entity.ApprovalRequest;
import com.prolearner.all.enums.RequestType;
import com.prolearner.all.enums.Status;
import com.prolearner.all.repository.ApprovalRequestRepository;

@Service
public class PendingCommandService {

    private final ApprovalRequestRepository repo;

    public PendingCommandService(ApprovalRequestRepository repo) {
        this.repo = repo;
    }

    // ====================================================
    // ✅ CREATE
    // ====================================================

    public ApprovalRequest create(String typeStr, Map<String, Object> body, Long userId) {

        RequestType type = RequestType.from(typeStr);

        ApprovalRequest r = new ApprovalRequest();

        r.setRequestType(type);
        r.setStatus(Status.PENDING);
        r.setRequestedBy(userId);
        r.setRequestedAt(OffsetDateTime.now());
        r.setRemarks((String) body.get("remarks"));

        // ✅ FIX: directly set Map (NOT String)
        r.setRequestData(body);

        return repo.save(r);
    }

    // ====================================================
    // ✅ UPDATE (FIXED)
    // ====================================================

    public void update(Long id, Map<String, Object> body) {

        ApprovalRequest r = repo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        if (r.getStatus() != Status.PENDING) {
            throw new IllegalStateException("Only pending request can be updated");
        }

        if (body.get("remarks") != null) {
            r.setRemarks((String) body.get("remarks"));
        }

        // ✅ overwrite JSON
        r.setRequestData(body);

        repo.save(r);
    }

    // ====================================================
    // ✅ APPROVE
    // ====================================================

    public void approve(ApprovalRequest r, Long adminId) {

        if (r.getStatus() != Status.PENDING) {
            throw new IllegalStateException("Only pending request can be approved");
        }

        r.setStatus(Status.APPROVED);
        r.setReviewedBy(adminId);
        r.setReviewedAt(OffsetDateTime.now());

        repo.save(r);
    }

    // ====================================================
    // ✅ REJECT
    // ====================================================

    public void reject(ApprovalRequest r, String remark, Long adminId) {

        if (r.getStatus() != Status.PENDING) {
            throw new IllegalStateException("Only pending request can be rejected");
        }

        r.setStatus(Status.REJECTED);
        r.setRemarks(remark);
        r.setReviewedBy(adminId);
        r.setReviewedAt(OffsetDateTime.now());

        repo.save(r);
    }

    // ====================================================
    // ✅ CANCEL
    // ====================================================

    public void cancel(Long id) {

        ApprovalRequest r = repo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        if (r.getStatus() != Status.PENDING) {
            throw new IllegalStateException("Only pending request can be cancelled");
        }

        r.setStatus(Status.CANCELLED);
        r.setCancelledAt(OffsetDateTime.now());

        repo.save(r);
    }

        // ====================================================
    // ✅ CREATE
    // ====================================================

    public ApprovalRequest create(
            String typeStr,
            Long studentId,
            Map<String, Object> body,
            Long userId
    ) {

        RequestType type;
        try {
            type = RequestType.from(typeStr);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid request type: " + typeStr);
        }

        ApprovalRequest r = new ApprovalRequest();

        r.setRequestType(type);
        r.setStudentId(studentId); // ✅ FIXED
        r.setStatus(Status.PENDING);
        r.setRequestedBy(userId);
        r.setRequestedAt(OffsetDateTime.now());
        r.setRemarks((String) body.get("remarks"));

        r.setRequestData(body);

        return repo.save(r);
    }
}