package com.prolearner.all.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.prolearner.all.entity.ApprovalRequest;
import com.prolearner.all.enums.RequestType;
import com.prolearner.all.service.PendingService;

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

        if (type == null) {
            return service.getAll(); // must return Map
        }
 
        return service.list(RequestType.from(type));
    }

    @GetMapping("/pending/collection-summary")
    public Map<String, Object> getCollectionSummary() {
        return service.getCollectionSummary();
    }
    // ====================================================
    // 🔹 CREATE
    // ====================================================

    @PostMapping("/manager/pending/{type}")
    public ApprovalRequest create(
        @PathVariable String type,
        @RequestBody Map<String, Object> body
    ) {
        Long userId = 1L; // TODO: replace with logged-in user
        return service.create(type, body, userId);
    }

    // ====================================================
    // 🔹 UPDATE
    // ====================================================

    @PutMapping("/manager/pending/{id}")
    public void update(
        @PathVariable Long id,
        @RequestBody Map<String, Object> body
    ) {
        service.update(id, body);
    }

    // ====================================================
    // 🔹 CANCEL
    // ====================================================

    @PutMapping("/manager/pending/{id}/cancel")
    public void cancel(@PathVariable Long id) {
        service.cancel(id);
    }

    // ====================================================
    // 🔹 ADMIN ACTIONS
    // ====================================================

    @PutMapping("/admin/pending/{id}/approve")
    public void approve(@PathVariable Long id) {
        Long adminId = 100L; // TODO: replace with logged-in admin
        service.approve(id, adminId);
    }

    @PutMapping("/admin/pending/{id}/reject")
    public void reject(
        @PathVariable Long id,
        @RequestParam String reason
    ) {
        Long adminId = 100L;
        service.reject(id, reason, adminId);
    }


    // ====================================================
    // 🔹 CREATE / UPDATE REQUEST
    // ====================================================

    @PostMapping("/pending/updatedetail/{studentId}/{type}")
    public ApprovalRequest create(
            @PathVariable Long studentId,
            @PathVariable String type,
            @RequestBody Map<String, Object> body
    ) {
        Long userId = 1L; // TODO: from auth
        return service.create(type, studentId, body, userId);
    }
}