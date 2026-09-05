package com.prolearner.all.dto;

import java.time.LocalDate;

public interface FullDayStrengthProjection {
    String getSeatNumber();
    Long getStudentId();
    String getFullName();
    String getMobileNumber();
    String getStatus();
    LocalDate getTillDate();
    Boolean getOccupied();
}