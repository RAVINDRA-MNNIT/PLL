package com.prolearner.all.dto;

import com.prolearner.all.dto.ComplaintCommentResponse;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class StudentComplaintResponse {

    private Long id;
    private Long studentId;
    private String fullName;
    private String mobileNumber;

    private String category;
    private String description;
    private String status;
    private String resolution;

    private List<ComplaintCommentResponse> comments;

    private OffsetDateTime submittedAt;
    private OffsetDateTime resolvedAt;
    private OffsetDateTime closedAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // Constructor used by JPQL
    public StudentComplaintResponse(
            Long id,
            Long studentId,
            String fullName,
            String mobileNumber,
            String category,
            String description,
            String status,
            String resolution,
            OffsetDateTime submittedAt,
            OffsetDateTime resolvedAt,
            OffsetDateTime closedAt,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt
    ) {
        this.id = id;
        this.studentId = studentId;
        this.fullName = fullName;
        this.mobileNumber = mobileNumber;
        this.category = category;
        this.description = description;
        this.status = status;
        this.resolution = resolution;
        this.submittedAt = submittedAt;
        this.resolvedAt = resolvedAt;
        this.closedAt = closedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;

        // Important
        this.comments = new ArrayList<>();
    }
}