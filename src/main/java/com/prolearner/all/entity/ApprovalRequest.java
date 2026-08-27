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

import lombok.NoArgsConstructor;

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

    @Column(name = "remarks")
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


    // =========================================================
    // GETTERS
    // =========================================================

    public Long getId() {
        return id;
    }

    public RequestType getRequestType() {
        return requestType;
    }

    public PendingRequestStatus getStatus() {
        return status;
    }

    public Long getStudentId() {
        return studentId;
    }

    public Long getRequestedBy() {
        return requestedBy;
    }

    public OffsetDateTime getRequestedAt() {
        return requestedAt;
    }

    public String getFullName() {
        return fullName;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public String getGuardianNumber() {
        return guardianNumber;
    }

    public String getFatherName() {
        return fatherName;
    }

    public String getLocalAddress() {
        return localAddress;
    }

    public String getPermanentAddress() {
        return permanentAddress;
    }

    public String getAadhaarNumber() {
        return aadhaarNumber;
    }

    public String getQualification() {
        return qualification;
    }

    public String getPreparationFor() {
        return preparationFor;
    }

    public Long getBatchId() {
        return batchId;
    }

    public Long getSeatId() {
        return seatId;
    }

    public LocalDate getFromDate() {
        return fromDate;
    }

    public LocalDate getTillDate() {
        return tillDate;
    }

    public BigDecimal getSubmittedAmount() {
        return submittedAmount;
    }

    public BigDecimal getDiscount() {
        return discount;
    }

    public BigDecimal getPendingAmount() {
        return pendingAmount;
    }

    public String getPaymentMode() {
        return paymentMode;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public String getRemarks() {
        return remarks;
    }

    public String getEnrollmentStatus() {
        return enrollmentStatus;
    }

    public Long getReviewedBy() {
        return reviewedBy;
    }

    public OffsetDateTime getReviewedAt() {
        return reviewedAt;
    }

    public OffsetDateTime getCancelledAt() {
        return cancelledAt;
    }

    // =========================================================
    // SETTERS
    // =========================================================

    public void setId(Long id) {
        this.id = id;
    }

    public void setRequestType(RequestType requestType) {
        this.requestType = requestType;
    }

    public void setStatus(PendingRequestStatus status) {
        this.status = status;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public void setRequestedBy(Long requestedBy) {
        this.requestedBy = requestedBy;
    }

    public void setRequestedAt(OffsetDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public void setMobile(String mobile) {
        this.mobileNumber = mobile;
    }

    public void setGuardianNumber(String guardianNumber) {
        this.guardianNumber = guardianNumber;
    }

    public void setFatherName(String fatherName) {
        this.fatherName = fatherName;
    }

    public void setLocalAddress(String localAddress) {
        this.localAddress = localAddress;
    }

    public void setPermanentAddress(String permanentAddress) {
        this.permanentAddress = permanentAddress;
    }

    public void setAadhaarNumber(String aadhaarNumber) {
        this.aadhaarNumber = aadhaarNumber;
    }

    public void setQualification(String qualification) {
        this.qualification = qualification;
    }

    public void setPreparationFor(String preparationFor) {
        this.preparationFor = preparationFor;
    }

    public void setBatchId(Long batchId) {
        this.batchId = batchId;
    }

    public void setSeatId(Long seatId) {
        this.seatId = seatId;
    }

    public void setFromDate(LocalDate fromDate) {
        this.fromDate = fromDate;
    }

    public void setTillDate(LocalDate tillDate) {
        this.tillDate = tillDate;
    }

    public void setSubmittedAmount(BigDecimal submittedAmount) {
        this.submittedAmount = submittedAmount;
    }

    public void setDiscount(BigDecimal discount) {
        this.discount = discount;
    }

    public void setPendingAmount(BigDecimal pendingAmount) {
        this.pendingAmount = pendingAmount;
    }

    public void setPaymentMode(String paymentMode) {
        this.paymentMode = paymentMode;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public void setEnrollmentStatus(String enrollmentStatus) {
        this.enrollmentStatus = enrollmentStatus;
    }

    public void setReviewedBy(Long reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public void setReviewedAt(OffsetDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public void setCancelledAt(OffsetDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

}