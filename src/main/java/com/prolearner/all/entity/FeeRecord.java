package com.prolearner.all.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

import com.prolearner.all.enums.PaymentMode;

import jakarta.persistence.*;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "fee_records", schema = "library")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeeRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "discount_amount", precision = 12, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "submitted_amount", precision = 12, scale = 2)
    private BigDecimal submittedAmount;

    @Column(name = "pending_amount", precision = 12, scale = 2)
    private BigDecimal pendingAmount;

    @Column(name = "from_date")
    private LocalDate fromDate;

    @Column(name = "till_date")
    private LocalDate tillDate;

    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "seat_id")
    private Long seatId;

    @Column(name = "payment_mode", length = 20)
    private String paymentMode;

    @Column(name = "transaction_id")
    private String transactionId;

    @Column(name = "remarks")
    private String remarks;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}