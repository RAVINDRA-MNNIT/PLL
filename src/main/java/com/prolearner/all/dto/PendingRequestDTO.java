package com.prolearner.all.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter
@Setter
public class PendingRequestDTO {

    // =========================================================
    // REQUEST
    // =========================================================

    private Long id;
    private String requestType;
    private String status;
    private OffsetDateTime requestedAt;

    // =========================================================
    // STUDENT
    // =========================================================

    private Long studentId;
    private String fullName;
    private LocalDate dateOfBirth;
    private String mobileNumber;
    private String guardianNumber;
    private String fatherName;

    // =========================================================
    // ADDRESS
    // =========================================================

    private String localAddress;
    private String permanentAddress;

    // =========================================================
    // IDENTITY / EDUCATION
    // =========================================================

    private String aadhaarNumber;
    private String qualification;
    private String preparationFor;

    // =========================================================
    // BATCH / SEAT
    // =========================================================

    private Long batchId;
    private Long seatId;

    // =========================================================
    // MEMBERSHIP
    // =========================================================

    private LocalDate fromDate;
    private LocalDate tillDate;

    // =========================================================
    // PAYMENT
    // =========================================================

    private BigDecimal submittedAmount;
    private BigDecimal cashAmount;
    private BigDecimal onlineAmount;
    private BigDecimal discount;
    private BigDecimal pendingAmount;

    private String paymentMode;
    private String transactionId;
    private String remarks;

    // =========================================================
    // ENROLLMENT
    // =========================================================

    private String enrollmentStatus;

    // =========================================================
    // REQUESTED BY
    // =========================================================

    private Long requestedBy;
    private BigDecimal adjustmentAmount;
}