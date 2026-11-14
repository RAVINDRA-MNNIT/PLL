package com.prolearner.all.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

import com.prolearner.all.enums.RequestType;
import com.prolearner.all.enums.PendingRequestStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "approval_requests")
@NoArgsConstructor
public class ApprovalRequest {

    // =========================================================
    // ID
    // =========================================================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    // =========================================================
    // REQUEST
    // =========================================================

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false)
    private RequestType requestType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PendingRequestStatus status;


    // =========================================================
    // REQUEST METADATA
    // =========================================================

    @Column(name = "student_id")
    private Long studentId;

    @Column(name = "requested_by")
    private Long requestedBy;

    @Column(name = "requested_at")
    private OffsetDateTime requestedAt;


    // =========================================================
    // STUDENT
    // =========================================================

    @Column(name = "full_name", length = 150)
    private String fullName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "mobile_number", length = 15)
    private String mobileNumber;

    @Column(name = "guardian_number", length = 15)
    private String guardianNumber;

    @Column(name = "father_name", length = 150)
    private String fatherName;


    // =========================================================
    // ADDRESS
    // =========================================================

    @Column(name = "local_address")
    private String localAddress;

    @Column(name = "permanent_address")
    private String permanentAddress;


    // =========================================================
    // IDENTITY / EDUCATION
    // =========================================================

    @Column(name = "aadhaar_number", length = 12)
    private String aadhaarNumber;

    @Column(name = "qualification", length = 100)
    private String qualification;

    @Column(name = "preparation_for", length = 100)
    private String preparationFor;


    // =========================================================
    // BATCH / SEAT
    // =========================================================

    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "seat_id")
    private Long seatId;


    // =========================================================
    // MEMBERSHIP
    // =========================================================

    @Column(name = "from_date")
    private LocalDate fromDate;

    @Column(name = "till_date")
    private LocalDate tillDate;


    // =========================================================
    // PAYMENT
    // =========================================================

    @Column(name = "submitted_amount", precision = 12, scale = 2)
    private BigDecimal submittedAmount;

    @Column(name = "cash_amount", precision = 12, scale = 2)
    private BigDecimal cashAmount;

    @Column(name = "online_amount", precision = 12, scale = 2)
    private BigDecimal onlineAmount;

    @Column(name = "discount", precision = 12, scale = 2)
    private BigDecimal discount;

    @Column(name = "pending_amount", precision = 12, scale = 2)
    private BigDecimal pendingAmount;

    @Column(name = "payment_mode", length = 20)
    private String paymentMode;

    @Column(name = "transaction_id", length = 150)
    private String transactionId;


    // =========================================================
    // REMARKS
    // =========================================================

    @Column(columnDefinition = "TEXT")
    private String remarks;


    // =========================================================
    // ENROLLMENT
    // =========================================================

    @Column(name = "enrollment_status", length = 30)
    private String enrollmentStatus;


    // =========================================================
    // REVIEW / APPROVAL
    // =========================================================

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private OffsetDateTime reviewedAt;

    @Column(name = "cancelled_at")
    private OffsetDateTime cancelledAt;

    @Column(name = "requested_by_role", length = 50)
    private String requestedByRole;

    @Column(name = "adjustment_amount", precision = 12, scale = 2)
    private BigDecimal adjustmentAmount = BigDecimal.ZERO;

}