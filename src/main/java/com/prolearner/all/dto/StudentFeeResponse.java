package com.prolearner.all.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record StudentFeeResponse(

        Long studentId,

        String fullName,

        Long batchId,

        LocalDate fromDate,

        LocalDate tillDate,

        String enrollmentStatus,

        BigDecimal discountAmount,

        BigDecimal submittedAmount,

        BigDecimal pendingAmount,

        String paymentMode,

        String transactionId,

        String paymentRemark

) {}