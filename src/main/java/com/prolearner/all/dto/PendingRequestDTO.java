package com.prolearner.all.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PendingRequestDTO {

    private Long id;
    private Long studentId;
    private String fullName;
    private LocalDate dateOfBirth;
    private String mobileNumber;
    private String guardianNumber;
    private String fatherName;
    private String localAddress;
    private String permanentAddress;
    private String aadhaarNumber;
    private String qualification;
    private String preparationFor;
    private Long batchId;
    private Long seatId;
    private LocalDate fromDate;
    private LocalDate tillDate;
    private BigDecimal submittedAmount;
    private BigDecimal discount; 
    private BigDecimal pendingAmount;
    private String paymentMode;
    private String transactionId;
    private String remarks;
    private String enrollmentStatus;
    private Long requestedBy;
    public Long getStudentId() {
        return studentId;
    }
    public Long getId() {
        return id;
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


    public BigDecimal getSubmittedAmount() {
        return submittedAmount;
    }

    public void setSubmittedAmount(BigDecimal submittedAmount) {
        this.submittedAmount = submittedAmount;
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


    public String getEnrollmentStatus() {
        return enrollmentStatus;
    }

    public void setEnrollmentStatus(String enrollmentStatus) {
        this.enrollmentStatus = enrollmentStatus;
    }
    public void setRequestedBy(Long requestedBy) {
        this.requestedBy = requestedBy;
    }
    public Long getRequestedBy() {
        return requestedBy;
    }


}