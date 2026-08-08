package com.prolearner.all.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MemberApplicationRequest(

        String fullName,
        LocalDate dateOfBirth,
        String mobile,
        String guardianNumber,
        String fatherName,
        String localAddress,
        String permanentAddress,
        String aadharNumber,
        String qualification,
        Long batchId,
        String preparationFor,
        LocalDate membershipFrom,
        LocalDate membershipTill,
        BigDecimal discount,
        BigDecimal submittedAmount,
        BigDecimal pendingAmount,

        String seatNumber,
        String paymentMode,
        String transactionId,
        String paymentRemarks

) {}