package com.prolearner.all.dto;

import com.prolearner.all.enums.PaymentMode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentModeSummary {
    private PaymentMode paymentMode;
    private BigDecimal amount;
}