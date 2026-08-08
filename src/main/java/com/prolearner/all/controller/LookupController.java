package com.prolearner.all.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.prolearner.all.dto.SeatResponse;
import com.prolearner.all.service.LookupService;

@RestController
@RequestMapping("/api/lookups")
public class LookupController {

    private final LookupService lookupService;

    public LookupController(
            LookupService lookupService
    ) {
        this.lookupService = lookupService;
    }

    /**
     * Returns all qualifications.
     */
    @GetMapping("/qualifications")
    public List<String> getQualifications() {
        return lookupService.getQualifications();
    }

    /**
     * Returns all preparation types.
     */
    @GetMapping("/preparations")
    public List<String> getPreparations() {
        return lookupService.getPreparations();
    }

    /**
     * Returns all active batches.
     */
    @GetMapping("/batches")
    public List<Map<String, Object>> getBatches() {
        return lookupService.getBatches();
    }

    /**
     * Returns all active seats.
     */
    @GetMapping("/seats")
    public List<SeatResponse> getSeats() {
        return lookupService.getSeats();
    }
}