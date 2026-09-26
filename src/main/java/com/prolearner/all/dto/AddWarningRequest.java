package com.prolearner.all.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddWarningRequest {
    private Long studentId;
    private String warningLevel;
    private String category;
    private String description;
    private String actionTaken;
    private Long issuedBy;
    private String issuedByName;
}