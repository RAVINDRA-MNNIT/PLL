package com.prolearner.all.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@AllArgsConstructor
public class StudentComplaintResponse {

    private Long id;
    private Long studentId;
    private String fullName;
    private String mobileNumber;
    private String category;
    private String description;
    private String status;
    private String resolution;
    private OffsetDateTime submittedAt;
    private OffsetDateTime resolvedAt;
    private OffsetDateTime closedAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}