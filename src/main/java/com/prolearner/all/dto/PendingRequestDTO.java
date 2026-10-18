package com.prolearner.all.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public class PendingRequestDTO {

    // =========================================================
    // REQUEST
    // =========================================================

    private Long id;
    private String requestType;
    private String status;
    private OffsetDateTime requestedAt;

    // =========================================================
    // STUDENT
    // =========================================================

    private Long studentId;
    private String fullName;
    private LocalDate dateOfBirth;
    private String mobileNumber;
    private String guardianNumber;
    private String fatherName;

    // =========================================================
    // ADDRESS
    // =========================================================

    private String localAddress;
    private String permanentAddress;

    // =========================================================
    // IDENTITY / EDUCATION
    // =========================================================

    private String aadhaarNumber;
    private String qualification;
    private String preparationFor;

    // =========================================================
    // BATCH / SEAT
    // =========================================================

    private Long batchId;
    private Long seatId;

    // =========================================================
    // MEMBERSHIP
    // =========================================================

    private LocalDate fromDate;
    private LocalDate tillDate;

    // =========================================================
    // PAYMENT
    // =========================================================

    private BigDecimal submittedAmount;
    private BigDecimal cashAmount;
    private BigDecimal onlineAmount;
    private BigDecimal discount;
    private BigDecimal pendingAmount;

    private String paymentMode;
    private String transactionId;
    private String remarks;

    // =========================================================
    // ENROLLMENT
    // =========================================================

    private String enrollmentStatus;

    // =========================================================
    // REQUESTED BY
    // =========================================================

    private Long requestedBy;


    // =========================================================
    // REQUEST
    // =========================================================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRequestType() {
        return requestType;
    }

    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public OffsetDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(OffsetDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }


    // =========================================================
    // STUDENT
    // =========================================================

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber;
    }

    // Kept for compatibility with your existing code
    public void setMobile(String mobile) {
        this.mobileNumber = mobile;
    }

    public String getGuardianNumber() {
        return guardianNumber;
    }

    public void setGuardianNumber(String guardianNumber) {
        this.guardianNumber = guardianNumber;
    }

    public String getFatherName() {
        return fatherName;
    }

    public void setFatherName(String fatherName) {
        this.fatherName = fatherName;
    }


    // =========================================================
    // ADDRESS
    // =========================================================

    public String getLocalAddress() {
        return localAddress;
    }

    public void setLocalAddress(String localAddress) {
        this.localAddress = localAddress;
    }

    public String getPermanentAddress() {
        return permanentAddress;
    }

    public void setPermanentAddress(String permanentAddress) {
        this.permanentAddress = permanentAddress;
    }


    // =========================================================
    // IDENTITY / EDUCATION
    // =========================================================

    public String getAadhaarNumber() {
        return aadhaarNumber;
    }

    public void setAadhaarNumber(String aadhaarNumber) {
        this.aadhaarNumber = aadhaarNumber;
    }

    public String getQualification() {
        return qualification;
    }

    public void setQualification(String qualification) {
        this.qualification = qualification;
    }

    public String getPreparationFor() {
        return preparationFor;
    }

    public void setPreparationFor(String preparationFor) {
        this.preparationFor = preparationFor;
    }


    // =========================================================
    // BATCH / SEAT
    // =========================================================

    public Long getBatchId() {
        return batchId;
    }

    public void setBatchId(Long batchId) {
        this.batchId = batchId;
    }

    public Long getSeatId() {
        return seatId;
    }

    public void setSeatId(Long seatId) {
        this.seatId = seatId;
    }


    // =========================================================
    // MEMBERSHIP
    // =========================================================

    public LocalDate getFromDate() {
        return fromDate;
    }

    public void setFromDate(LocalDate fromDate) {
        this.fromDate = fromDate;
    }

    public LocalDate getTillDate() {
        return tillDate;
    }

    public void setTillDate(LocalDate tillDate) {
        this.tillDate = tillDate;
    }


    // =========================================================
    // PAYMENT
    // =========================================================

    public BigDecimal getSubmittedAmount() {
        return submittedAmount;
    }

    public void setSubmittedAmount(BigDecimal submittedAmount) {
        this.submittedAmount = submittedAmount;
    }

    public BigDecimal getCashAmount() {
        return cashAmount;
    }

    public void setCashAmount(BigDecimal cashAmount) {
        this.cashAmount = cashAmount;
    }

    public BigDecimal getOnlineAmount() {
        return onlineAmount;
    }

    public void setOnlineAmount(BigDecimal onlineAmount) {
        this.onlineAmount = onlineAmount;
    }

    public BigDecimal getDiscount() {
        return discount;
    }

    public void setDiscount(BigDecimal discount) {
        this.discount = discount;
    }

    public BigDecimal getPendingAmount() {
        return pendingAmount;
    }

    public void setPendingAmount(BigDecimal pendingAmount) {
        this.pendingAmount = pendingAmount;
    }

    public String getPaymentMode() {
        return paymentMode;
    }

    public void setPaymentMode(String paymentMode) {
        this.paymentMode = paymentMode;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }


    // =========================================================
    // ENROLLMENT
    // =========================================================

    public String getEnrollmentStatus() {
        return enrollmentStatus;
    }

    public void setEnrollmentStatus(String enrollmentStatus) {
        this.enrollmentStatus = enrollmentStatus;
    }


    // =========================================================
    // REQUESTED BY
    // =========================================================

    public Long getRequestedBy() {
        return requestedBy;
    }

    public void setRequestedBy(Long requestedBy) {
        this.requestedBy = requestedBy;
    }
}