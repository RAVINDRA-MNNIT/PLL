package com.prolearner.all.service;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.prolearner.all.entity.ApprovalRequest;
import com.prolearner.all.enums.RequestType;
import com.prolearner.all.enums.Status;
import com.prolearner.all.repository.ApprovalRequestRepository;

@Service
public class PendingQueryService {

    private final ApprovalRequestRepository repo;

    public PendingQueryService(ApprovalRequestRepository repo) {
        this.repo = repo;
    }

    // ====================================================
    // 🔹 LIST BY TYPE + STATUS
    // ====================================================
    public List<Map<String, Object>> list(RequestType type, Status status) {
        return repo.getPendingData(type.name(), status.name());
    }

    // ====================================================
    // 🔹 GET BY ID
    // ====================================================
    public ApprovalRequest get(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));
    }

    // ====================================================
    // 🔹 GET ALL (LATEST FIRST)
    // ====================================================
    public List<Map<String, Object>> getAll() {
        return repo.getPendingData(null, "PENDING");
    }

    // ====================================================
    // 🔹 DASHBOARD SUMMARY
    // ====================================================

    public Map<String, Object> getCollectionSummary() {

        List<Object[]> list = repo.sumByPaymentMode();
        Object[] result = list.get(0);
        Double totalCash = 0.0;
        Double totalOnline = 0.0;

        if (result != null) {
            totalCash = result[0] != null ? ((Number) result[0]).doubleValue() : 0.0;
            totalOnline = result[1] != null ? ((Number) result[1]).doubleValue() : 0.0;
        }

        Map<String, Object> res = new HashMap<>();
        res.put("totalCash", totalCash);
        res.put("totalOnline", totalOnline);

        return res;
    }
}