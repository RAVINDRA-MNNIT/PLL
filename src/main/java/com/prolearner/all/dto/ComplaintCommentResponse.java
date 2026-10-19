package com.prolearner.all.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintCommentResponse {

    private Long complaintId;
    private Long userId;
    private Long studentId;
    private String userName;
    private String role;
    private String comment;
    private OffsetDateTime createdAt;
}