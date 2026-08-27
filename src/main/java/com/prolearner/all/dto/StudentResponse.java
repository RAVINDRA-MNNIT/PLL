package com.prolearner.all.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record StudentResponse(

    Long studentId,
    String fullName,
    LocalDate dateOfBirth,
    String mobileNumber,
    String guardianNumber,
    String fatherName,
    String localAddress,
    String permanentAddress,
    String aadhaarNumber,
    String qualification,
    String preparationFor,
    Long batchId,
    String batchName,
    Long seatId,
    String seatNumber,
    LocalDate dateOfAdmission,
    LocalDate fromDate,
    LocalDate tillDate,
    String enrollmentStatus,
    BigDecimal submittedAmount,
    BigDecimal pendingAmount,
    BigDecimal discountAmount,
    String paymentMode,
    String transactionId,
    String paymentRemark,
    Long createdBy,
    OffsetDateTime createdAt,
    Long pendingApprovalCount
) {}

