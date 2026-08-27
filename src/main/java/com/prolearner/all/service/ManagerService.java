package com.prolearner.all.service;

import com.prolearner.all.dto.PendingRequestDTO;
import org.springframework.stereotype.Service;

import com.prolearner.all.entity.ApprovalRequest;

/**
 * Orchestrator Service
 * Combines Query + Command operations
 */
@Service
public class ManagerService {

    private final ManagerCommandService commandService;

    public ManagerService(
            ManagerCommandService commandService
    ) {
        this.commandService = commandService;
    }

    // ====================================================
    // 🔹 Create Request
    // ====================================================

    public ApprovalRequest create(
            String typeStr,
            PendingRequestDTO body,
            Long userId) {
        return commandService.create(typeStr, body, userId);
    }

    // ====================================================
    // 🔹 Update Request
    // ====================================================

    public ApprovalRequest update(
            Long id,
            PendingRequestDTO body,
            Long userId) {
        return commandService.update(id, body, userId);
    }

    // ====================================================
    // 🔹 Cancel Request
    // ====================================================

    public void cancel(Long id, String remark) {
        commandService.cancel(id, remark);
    }

}