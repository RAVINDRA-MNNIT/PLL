package com.prolearner.all.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record PendingFeeResponse(

        Long requestId,

        Long studentId,

        String fullName,

        Long batchId,

        String batchName,

        Long seatId,

        LocalDate fromDate,

        LocalDate tillDate,

        LocalDate membershipFrom,

        LocalDate membershipTill,

        BigDecimal submittedAmount,

        BigDecimal discount,

        BigDecimal pendingAmount,

        String paymentMode,

        String requestedBy,

        OffsetDateTime requestedAt,

        String status

) {
}