package com.prolearner.all.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintCommentRequest {
    private Long userId;
    private String userName;
    private String role;
    private String comment;
    private String status;
    private Long studentId;
}