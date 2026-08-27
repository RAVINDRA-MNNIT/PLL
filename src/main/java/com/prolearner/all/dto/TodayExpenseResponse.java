package com.prolearner.all.dto;
import com.prolearner.all.enums.PaymentMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TodayExpenseResponse {

    private OffsetDateTime transactionDate;

    private String category;

    private PaymentMode paymentMode;

    private BigDecimal amount;

    private String description;

}