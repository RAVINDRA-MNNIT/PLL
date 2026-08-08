package com.prolearner.all.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateFeeRequest(

        Long batchId,

        Long seatId,

        LocalDate membershipFrom,

        LocalDate membershipTill,

        BigDecimal submittedAmount,

        BigDecimal discount,

        BigDecimal pendingAmount,

        String paymentMode,

        String transactionId,

        String paymentRemark

) {}