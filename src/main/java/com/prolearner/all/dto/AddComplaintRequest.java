package com.prolearner.all.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddComplaintRequest {

    private Long studentId;

    private String category;

    private String description;
}