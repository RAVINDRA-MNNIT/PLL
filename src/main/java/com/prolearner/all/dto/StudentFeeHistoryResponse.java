package com.prolearner.all.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;


public record StudentFeeHistoryResponse(

    Long feeRecordId,

    Long batchId,
    String batchName,

    Long seatId,
    String seatNumber,

    LocalDate membershipFrom,
    LocalDate membershipTill,

    BigDecimal submittedAmount,
    BigDecimal pendingAmount,
    BigDecimal discountAmount,

    String paymentMode,
    String transactionId,
    String paymentRemark,

    Long createdBy,
    OffsetDateTime createdAt

) {}