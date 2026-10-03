package com.prolearner.all.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class StudentVerificationResponse {

    private Long studentId;
    private String fullName;
    private String mobileNumber;

    private BigDecimal allowedDiscount;

    private Long batchId;
    private String batchName;
    private String batchAlias;

    private Long seatId;
    private String seatNumber;

    private BigDecimal submittedAmount;
    private BigDecimal discountAmount;
    private BigDecimal pendingAmount;

    private String paymentMode;
    private String transactionId;
    private String paymentRemark;

    private LocalDate fromDate;
    private LocalDate tillDate;

    private String enrollmentStatus;

    private Long pendingCount;

    public StudentVerificationResponse(
            Long studentId,
            String fullName,
            String mobileNumber,
            BigDecimal allowedDiscount,
            Long batchId,
            String batchName,
            String batchAlias,
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
    ) {
        this.studentId = studentId;
        this.fullName = fullName;
        this.mobileNumber = mobileNumber;

        this.allowedDiscount = allowedDiscount;

        this.batchId = batchId;
        this.batchName = batchName;
        this.batchAlias = batchAlias;

        this.seatId = seatId;
        this.seatNumber = seatNumber;

        this.submittedAmount = submittedAmount;
        this.discountAmount = discountAmount;
        this.pendingAmount = pendingAmount;

        this.paymentMode = paymentMode;
        this.transactionId = transactionId;
        this.paymentRemark = paymentRemark;

        this.fromDate = fromDate;
        this.tillDate = tillDate;

        this.enrollmentStatus = enrollmentStatus;
    }
}