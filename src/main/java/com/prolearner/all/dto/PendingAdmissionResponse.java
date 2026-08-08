package com.prolearner.all.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record PendingAdmissionResponse(
    Long requestId,
    Long studentId,
    String fullName,
    String dateOfBirth,
    String mobile,
    String guardianNumber,
    String fatherName,
    String localAddress,
    String permanentAddress,
    String aadharNumber,
    String qualification,
    String preparationFor,
    Long batchId,
    String batchName,
    String membershipFrom,
    String membershipTill,
    BigDecimal discount,
    BigDecimal submittedAmount,
    BigDecimal pendingAmount,
    String status,
    OffsetDateTime requestedAt,
  
    String seatNumber,
    String paymentMode,
    String transactionId,
    String paymentRemarks
) {}