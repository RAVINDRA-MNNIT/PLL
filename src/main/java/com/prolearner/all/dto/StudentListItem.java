package com.prolearner.all.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
public record StudentListItem(

        Long studentId,
        String fullName,
        String mobileNumber,
        Long batchId,
        String batchName,
        Long seatId,
        String seatNumber,
        BigDecimal submittedAmount,
        BigDecimal discountAmount,
        BigDecimal pendingAmount,
        String paymentMode,
        String transactionId,
        String paymentRemark,
        LocalDate fromDate,
        LocalDate tillDate,
        String enrollmentStatus
) {}