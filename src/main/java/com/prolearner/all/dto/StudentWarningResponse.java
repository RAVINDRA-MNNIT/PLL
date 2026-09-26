package com.prolearner.all.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentWarningResponse {

    private Long id;
    private Long studentId;
    private String fullName;
    private String mobileNumber;
    private String warningLevel;
    private String category;
    private String description;
    private String actionTaken;
    private Long issuedBy;
    private String issuedByName;
    private OffsetDateTime issuedAt;
    private OffsetDateTime cancelledAt;
    private String cancellationReason;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}