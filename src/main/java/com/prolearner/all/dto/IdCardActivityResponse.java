package com.prolearner.all.dto;

import java.time.LocalDateTime;

public class IdCardActivityResponse {

    private Long studentId;
    private String idCardStatus;
    private Boolean printLater;
    private LocalDateTime printedAt;
    private LocalDateTime issuedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public IdCardActivityResponse(
            Long studentId,
            String idCardStatus,
            Boolean printLater,
            LocalDateTime printedAt,
            LocalDateTime issuedAt,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {

        this.studentId = studentId;
        this.idCardStatus = idCardStatus;
        this.printLater = printLater;
        this.printedAt = printedAt;
        this.issuedAt = issuedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getStudentId() {
        return studentId;
    }

    public String getIdCardStatus() {
        return idCardStatus;
    }

    public Boolean getPrintLater() {
        return printLater;
    }

    public LocalDateTime getPrintedAt() {
        return printedAt;
    }

    public LocalDateTime getIssuedAt() {
        return issuedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}