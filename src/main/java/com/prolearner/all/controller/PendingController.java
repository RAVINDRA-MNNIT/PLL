package com.prolearner.all.controller;

import java.util.List;
import java.util.Map;

import com.prolearner.all.dto.PendingCollectionSummaryResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.prolearner.all.dto.CancelRequestDTO;
import com.prolearner.all.entity.ApprovalRequest;
import com.prolearner.all.enums.RequestType;
import com.prolearner.all.service.PendingService;
import com.prolearner.all.dto.PendingRequestDTO;



@RestController
@RequestMapping("/api")
public class PendingController {

    private final PendingService service;

    public PendingController(PendingService service) {
        this.service = service;
    }

    // ====================================================
    // 🔹 GET APIs
    // ====================================================

    @GetMapping("/pending/{type}")
    public Object list(@PathVariable RequestType type) {
        return service.list(type);
    }

    @GetMapping("/pending/{type}/{id}")
    public Object get(@PathVariable RequestType type, @PathVariable Long id) {
        return service.get(type, id);
    }

    @GetMapping("/pending")
    public List<Map<String, Object>> list(
            @RequestParam(required = false) String type
    ) {
        return service.list(RequestType.from(type));
    }

    @GetMapping("/nonpending")
    public List<Map<String, Object>> fetchNonPending(
            @RequestParam(required = false) String type
    ) {
        // 👉 ALL (approved + cancelled + rejected)
        return service.fetchNonPending();
    }

    @GetMapping("/pending/collection-summary")
    public PendingCollectionSummaryResponse getCollectionSummary() {
        return service.getCollectionSummary();
    }

    @GetMapping("/pending/count")
    public Integer getPendingCount() {
        return service.getPendingCount();
    }
}