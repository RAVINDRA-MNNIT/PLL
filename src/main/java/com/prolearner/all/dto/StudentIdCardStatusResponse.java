package com.prolearner.all.dto;

import java.time.OffsetDateTime;

public class StudentIdCardStatusResponse {

    private Long studentId;
    private String fullName;
    private String idCardStatus;
    private OffsetDateTime cardPrintedAt;
    private OffsetDateTime cardIssuedAt;

    public StudentIdCardStatusResponse(
            Long studentId,
            String fullName,
            String idCardStatus,
            OffsetDateTime cardPrintedAt,
            OffsetDateTime cardIssuedAt) {

        this.studentId = studentId;
        this.fullName = fullName;
        this.idCardStatus = idCardStatus;
        this.cardPrintedAt = cardPrintedAt;
        this.cardIssuedAt = cardIssuedAt;
    }

    public Long getStudentId() {
        return studentId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getIdCardStatus() {
        return idCardStatus;
    }

    public OffsetDateTime getCardPrintedAt() {
        return cardPrintedAt;
    }

    public OffsetDateTime getCardIssuedAt() {
        return cardIssuedAt;
    }
}