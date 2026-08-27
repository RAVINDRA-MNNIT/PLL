package com.prolearner.all.service;

import java.util.List;
import java.util.Map;

import com.prolearner.all.dto.PendingCollectionSummaryResponse;
import com.prolearner.all.dto.PendingRequestDTO;
import org.springframework.stereotype.Service;

import com.prolearner.all.entity.ApprovalRequest;
import com.prolearner.all.enums.RequestType;
import com.prolearner.all.enums.PendingRequestStatus;

/**
 * Orchestrator Service
 * Combines Query + Command operations
 */
@Service
public class PendingService {

    private final PendingQueryService queryService;

    public PendingService(
            PendingQueryService queryService,
            ManagerCommandService commandService
    ) {
        this.queryService = queryService;
    }

    // ====================================================
    // 🔹 QUERY
    // ====================================================

    // ✅ Default → PENDING
    public List<Map<String, Object>> list(RequestType type) {
        return queryService.list(
                type,
                (type == RequestType.FEES || type == RequestType.ADMISSION)
                        ? List.of(
                        PendingRequestStatus.PENDING,
                        PendingRequestStatus.REJECTED
                )
                        : List.of(PendingRequestStatus.PENDING)
        );
    }

//    // ✅ Optional custom status (flexible)
//    public List<Map<String, Object>> list(RequestType type, PendingRequestStatus status) {
//        return queryService.list(type, status);
//    }

    public ApprovalRequest get(RequestType type, Long id) {
        ApprovalRequest request = queryService.get(id);
        if (!request.getRequestType().equals(type)) {
            throw new IllegalArgumentException("Request type mismatch");
        }
        return request;
    }


    public List<Map<String, Object>> fetchNonPending() {
        return queryService.fetchNonPending();
    }

    public PendingCollectionSummaryResponse getCollectionSummary() {
        return queryService.getCollectionSummary(); // ✅ CORRECT
    }

}