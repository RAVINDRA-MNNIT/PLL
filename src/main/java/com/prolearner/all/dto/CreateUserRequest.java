package com.prolearner.all.dto;

import com.prolearner.all.entity.UserRole;
import lombok.Data;

@Data
public class CreateUserRequest {

    private Long id;
    private String fullName;
    private String password;
    private Boolean active;
    private UserRole role;
}