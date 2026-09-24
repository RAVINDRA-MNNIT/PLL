package com.prolearner.all.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import com.prolearner.all.entity.Transaction;
import com.prolearner.all.enums.*;
import com.prolearner.all.repository.TransactionRepository;
import lombok.AllArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.prolearner.all.entity.ApprovalRequest;
import com.prolearner.all.entity.Students;
import com.prolearner.all.entity.FeeRecord;

import com.prolearner.all.repository.ApprovalRequestRepository;
import com.prolearner.all.repository.StudentRepository;
import com.prolearner.all.repository.FeeRecordRepository;

import com.prolearner.all.dto.PendingRequestDTO;
import com.prolearner.all.dto.StudentIdAllocation;
import org.springframework.web.bind.annotation.RequestParam;


@Service
@AllArgsConstructor
public class AdminCommandService {

    private final ApprovalRequestRepository approvalRequestRepo;
    private final StudentRepository studentRepo;
    private final FeeRecordRepository feeRecordRepository;
    private final SeatService seatService;
    private final StudentIdService studentIdService;
    private final TransactionRepository transactionRepository;
    private final ConfigurationService configurationService;


    // ====================================================
    // 🔹 Admission
    // ====================================================

    @Transactional
    public Students admission(
            PendingRequestDTO body,
            Long adminId
    ) {
        StudentIdAllocation allocation = studentIdService.allocateStudentId();
        if (studentIdService.isAadhaarExist(body.getAadhaarNumber())) {
            throw new RuntimeException(
                    "Student with this Aadhaar Number already Exist!"
            );
        }
        studentIdService.deleteOldAdmissionRequest(allocation.getReusableStudentId());
        return admissionSubmit(body, allocation.getStudentId(), adminId);
    }
    // ====================================================
    // 🔹 Update Request
    // ====================================================

    public void updateFee(
            PendingRequestDTO body,
            Long adminId
    ) {
        Long studentId = body.getStudentId();
        Students student = studentRepo.findByStudentId(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        FeeRecord lastFee = student.getLastFee();
        LocalDate tillDate = lastFee.getTillDate();
        if (body.getFromDate().isBefore(tillDate)) {
            throw new IllegalStateException("Membership from date should not be before last fees due date");
        }
        FeeRecord fee = FeeRecord.builder()
                .studentId(studentId)
                .batchId(body.getBatchId())
                .seatId(body.getSeatId())
                .fromDate(body.getFromDate())
                .tillDate(body.getTillDate())
                .discountAmount(body.getDiscount())
                .submittedAmount(body.getSubmittedAmount())
                .cashAmount(body.getCashAmount())
                .onlineAmount(body.getOnlineAmount())
                .pendingAmount(body.getPendingAmount())
                .paymentMode(body.getPaymentMode())
                .transactionId(body.getTransactionId())
                .remarks(body.getRemarks())
                .createdBy(adminId)
                .createdAt(OffsetDateTime.now())
                .build();

        if (body.getBatchId() == 28L || body.getBatchId() == 27L) {
            seatService.updateSeat(fee.getSeatId(), body.getSeatId(), body.getStudentId());
        } else {
            seatService.removeReservedSeat(body.getSeatId());
        }
        feeRecordRepository.save(fee);
        student.setEnrollmentStatus(EnrollmentStatus.ACTIVE.name());
        student.setLastFee(fee);
        studentRepo.save(student);

        // Update Transaction
        updateTransaction(studentId,
                body.getSubmittedAmount(),
                body.getCashAmount(),
                body.getOnlineAmount(),
                body.getPaymentMode(),
                SourceType.FEE,
                "",
                null,
                adminId);

    }

    // ====================================================
    // 🔹 Reject Request
    // ====================================================

    public void reject(ApprovalRequest r, String remark, Long adminId) {
        if (r.getStatus() != PendingRequestStatus.PENDING) {
            throw new IllegalStateException("Only pending request can be rejected");
        }
        if (r.getRequestType().equals(RequestType.SEAT)) {
            seatService.removeReservedSeat(r.getSeatId());
        }
        r.setStatus(PendingRequestStatus.REJECTED);
        r.setRemarks(remark);
        r.setReviewedBy(adminId);
        r.setReviewedAt(OffsetDateTime.now());
        approvalRequestRepo.save(r);
    }

    // ====================================================
    // 🔹 Approve Request
    // ====================================================

    public void approve(ApprovalRequest r, Long adminId) {
        if (r.getStatus() != PendingRequestStatus.PENDING) {
            throw new IllegalStateException("Only pending request can be approved");
        }
        r.setStatus(PendingRequestStatus.APPROVED);
        r.setReviewedBy(adminId);
        r.setReviewedAt(OffsetDateTime.now());

        if (RequestType.ADMISSION.equals(r.getRequestType())) {
            Students student = Students.builder()
                    .studentId(r.getStudentId())
                    .fullName(r.getFullName())
                    .dateOfBirth(r.getDateOfBirth())
                    .mobileNumber(r.getMobileNumber())
                    .guardianNumber(r.getGuardianNumber())
                    .fatherName(r.getFatherName())
                    .localAddress(r.getLocalAddress())
                    .permanentAddress(r.getPermanentAddress())
                    .aadhaarNumber(r.getAadhaarNumber())
                    .qualification(r.getQualification())
                    .preparationFor(r.getPreparationFor())
                    .dateOfAdmission(r.getFromDate())
                    .enrollmentStatus(EnrollmentStatus.ACTIVE.name())
                    .createdBy(adminId)
                    .createdAt(OffsetDateTime.now())
                    .updatedAt(OffsetDateTime.now())

                    .build();
            // Save student first
            student = studentRepo.save(student);

            // Save fee record
            FeeRecord fee = FeeRecord.builder()
                    .studentId(r.getStudentId())
                    .batchId(r.getBatchId())
                    .seatId(r.getSeatId())
                    .fromDate(r.getFromDate())
                    .tillDate(r.getTillDate())
                    .discountAmount(r.getDiscount())
                    .submittedAmount(r.getSubmittedAmount())
                    .cashAmount(r.getCashAmount())
                    .onlineAmount(r.getOnlineAmount())
                    .pendingAmount(r.getPendingAmount())
                    .paymentMode(r.getPaymentMode())
                    .transactionId(r.getTransactionId())
                    .remarks(r.getRemarks())
                    .createdBy(adminId)
                    .createdAt(OffsetDateTime.now())
                    .build();

                    fee = feeRecordRepository.save(fee);

                    // 3. Update last fee
                    student.setLastFee(fee);
                    studentRepo.save(student);

                    // 4. Update seat
                    seatService.updateSeat(null, r.getSeatId(), student.getStudentId());

                    // 5. Update transaction
                    updateTransaction(student.getStudentId(),
                            r.getSubmittedAmount(),
                            r.getCashAmount(),
                            r.getOnlineAmount(),
                            r.getPaymentMode(),
                            SourceType.ADMISSION,
                            "",
                            1L,
                            adminId
                    );

        } else {
            Long studentId = r.getStudentId();
            Students student = studentRepo.findByStudentId(studentId)
                    .orElseThrow(() -> new RuntimeException("Student not found"));
            if (RequestType.FEES.equals(r.getRequestType())) {
                FeeRecord lastFee = student.getLastFee();
                LocalDate tillDate = lastFee.getTillDate();
                if (r.getFromDate().isBefore(tillDate)) {
                    throw new IllegalStateException("Membership from date should not be before last fees due date");
                }
                FeeRecord fee = FeeRecord.builder()
                        .studentId(studentId)
                        .batchId(r.getBatchId())
                        .seatId(r.getSeatId())
                        .fromDate(r.getFromDate())
                        .tillDate(r.getTillDate())
                        .discountAmount(r.getDiscount())
                        .submittedAmount(r.getSubmittedAmount())
                        .cashAmount(r.getCashAmount())
                        .onlineAmount(r.getOnlineAmount())
                        .pendingAmount(r.getPendingAmount())
                        .paymentMode(r.getPaymentMode())
                        .transactionId(r.getTransactionId())
                        .remarks(r.getRemarks())
                        .createdBy(adminId)
                        .createdAt(OffsetDateTime.now())
                        .build();

                if (r.getBatchId() == 28L || r.getBatchId() == 27L) {
                    seatService.updateSeat(fee.getSeatId(), r.getSeatId(), r.getStudentId());
                } else {
                    seatService.removeReservedSeat(r.getSeatId());
                }
                student.setEnrollmentStatus(EnrollmentStatus.ACTIVE.name());
                // Update Transaction
                updateTransaction(studentId,
                        r.getSubmittedAmount(),
                        r.getCashAmount(),
                        r.getOnlineAmount(),
                        r.getPaymentMode(),
                        SourceType.FEE,
                        "",
                        1L,
                        adminId);
                // Update Fee
                feeRecordRepository.save(fee);
                student.setLastFee(fee);
                studentRepo.save(student);

            } else if (RequestType.SEAT.equals(r.getRequestType())) {
                updateSeat(r.getStudentId(), r.getSeatId());
            } else if (RequestType.DETAILS.equals(r.getRequestType())) {
                if (r.getDateOfBirth() != null) {
                    student.setDateOfBirth(r.getDateOfBirth());
                }
                if (r.getFatherName() != null) {
                    student.setFatherName(r.getFatherName());
                }
                if (r.getAadhaarNumber() != null) {
                    student.setAadhaarNumber(r.getAadhaarNumber());
                }
                if (r.getLocalAddress() != null) {
                    student.setLocalAddress(r.getLocalAddress());
                }
                if (r.getPermanentAddress() != null) {
                    student.setPermanentAddress(r.getPermanentAddress());
                }
                updateDetail(student, r.getFullName(), r.getMobileNumber(), r.getGuardianNumber());
            } else if (RequestType.ENROLLMENT.equals(r.getRequestType())) {
                updateEnrollment(student, r.getEnrollmentStatus());
            }  else if (RequestType.BATCH.equals(r.getRequestType())) {
                FeeRecord lastFee = student.getLastFee();
                lastFee.setBatchId(r.getBatchId());
                lastFee.setSeatId(r.getSeatId());
                if (r.getTillDate() != null) {
                    lastFee.setTillDate(r.getTillDate());
                }
                BigDecimal submittedAmount = r.getSubmittedAmount() != null ? r.getSubmittedAmount() : BigDecimal.ZERO;
                BigDecimal existingAmount = lastFee.getSubmittedAmount() != null ? lastFee.getSubmittedAmount() : BigDecimal.ZERO;
                lastFee.setSubmittedAmount(existingAmount.add(submittedAmount));
                String transactionId = r.getTransactionId();
                String remarks = r.getRemarks();

                if (transactionId != null && !transactionId.isEmpty()) {
                    lastFee.setTransactionId(transactionId);
                }

                if (remarks != null && !remarks.isEmpty()) {
                    lastFee.setRemarks(remarks);
                }

                lastFee.setPaymentMode(r.getPaymentMode());
                if (r.getBatchId() == 28L || r.getBatchId() == 27L) {
                    seatService.updateSeat(lastFee.getSeatId(), r.getSeatId(), r.getStudentId());
                } else {
                    seatService.removeReservedSeat(r.getSeatId());
                }
                // Update Transaction

                if (submittedAmount.compareTo(BigDecimal.ZERO) > 0) {
                    updateTransaction(studentId,
                            r.getSubmittedAmount(),
                            null,
                            null,
                            r.getPaymentMode(),
                            SourceType.BATCH_ADJUSTMENT,
                            r.getTransactionId(),
                            2L,
                            2L);
                }
                // Update Fee
                feeRecordRepository.save(lastFee);
                studentRepo.save(student);
            } else if (RequestType.PENDING_FEES.equals(r.getRequestType())) {
                FeeRecord lastFee = student.getLastFee();
                BigDecimal existingAmount = lastFee.getSubmittedAmount() != null ? lastFee.getSubmittedAmount() : BigDecimal.ZERO;
                BigDecimal lastPendingAmount = lastFee.getPendingAmount() != null ? lastFee.getPendingAmount() : BigDecimal.ZERO;
                lastFee.setSubmittedAmount(lastPendingAmount.add(existingAmount));
                lastFee.setPaymentMode(r.getPaymentMode());
                lastFee.setPendingAmount(BigDecimal.ZERO);
                lastFee.setTransactionId(r.getTransactionId());
                lastFee.setRemarks(r.getRemarks());
                feeRecordRepository.save(lastFee);

                if (lastPendingAmount.compareTo(BigDecimal.ZERO) > 0) {
                    updateTransaction(studentId,
                            lastPendingAmount,
                            null,
                            null,
                            r.getPaymentMode(),
                            SourceType.FEE,
                            r.getTransactionId(),
                            2L,
                            2L);
                }
            } else {
                throw new IllegalStateException("Invalid type request");
            }
        }
        approvalRequestRepo.save(r);
    }

    // =========================================================
    // 🔹 Update Student Details Request
    // =========================================================

    public void updateStudent(String type, PendingRequestDTO body) {
        Long studentId = body.getStudentId();
        Students student = studentRepo.findByStudentId(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        if (RequestType.ENROLLMENT.name().equals(type)) {
            updateEnrollment(student, body.getEnrollmentStatus());
        } else if (RequestType.SEAT.name().equals(type)) {
            updateSeat(studentId, body.getSeatId());
        } else if (RequestType.DETAILS.name().equals(type)) {
            if (body.getDateOfBirth() != null) {
                student.setDateOfBirth(body.getDateOfBirth());
            }
            if (body.getFatherName() != null) {
                student.setFatherName(body.getFatherName());
            }
            if (body.getAadhaarNumber() != null) {
                student.setAadhaarNumber(body.getAadhaarNumber());
            }
            if (body.getLocalAddress() != null) {
                student.setLocalAddress(body.getLocalAddress());
            }
            if (body.getPermanentAddress() != null) {
                student.setPermanentAddress(body.getPermanentAddress());
            }
            updateDetail(student, body.getFullName(), body.getMobileNumber(), body.getGuardianNumber());
        } else if (RequestType.BATCH.name().equals(type)) {
            FeeRecord lastFee = student.getLastFee();
            lastFee.setBatchId(body.getBatchId());
            lastFee.setSeatId(body.getSeatId());
            if (body.getTillDate() != null) {
                lastFee.setTillDate(body.getTillDate());
            }
            BigDecimal submittedAmount = body.getSubmittedAmount() != null ? body.getSubmittedAmount() : BigDecimal.ZERO;
            BigDecimal existingAmount = lastFee.getSubmittedAmount() != null ? lastFee.getSubmittedAmount() : BigDecimal.ZERO;
            lastFee.setSubmittedAmount(existingAmount.add(submittedAmount));
            String transactionId = body.getTransactionId();
            if (transactionId != null && !transactionId.isEmpty()) {
                lastFee.setTransactionId(transactionId);
            }
            String remarks = body.getRemarks();
            if (remarks != null && !remarks.isBlank()) {
                lastFee.setRemarks(remarks);
            }
            lastFee.setPaymentMode(body.getPaymentMode());
            if (body.getBatchId() == 28L || body.getBatchId() == 27L) {
                seatService.updateSeat(lastFee.getSeatId(), body.getSeatId(), body.getStudentId());
            } else {
                seatService.removeReservedSeat(body.getSeatId());
            }
            // Update Transaction

            if (submittedAmount.compareTo(BigDecimal.ZERO) > 0) {
                updateTransaction(studentId,
                        body.getSubmittedAmount(),
                        null,
                        null,
                        body.getPaymentMode(),
                        SourceType.BATCH_ADJUSTMENT,
                        body.getTransactionId(),
                        2L,
                        2L);
            }
            // Update Fee
            feeRecordRepository.save(lastFee);
            studentRepo.save(student);
        } else if (RequestType.PENDING_FEES.name().equals(type)) {
            FeeRecord lastFee = student.getLastFee();
            BigDecimal existingAmount = lastFee.getSubmittedAmount() != null ? lastFee.getSubmittedAmount() : BigDecimal.ZERO;
            BigDecimal lastPendingAmount = lastFee.getPendingAmount() != null ? lastFee.getPendingAmount() : BigDecimal.ZERO;
            lastFee.setSubmittedAmount(lastPendingAmount.add(existingAmount));
            lastFee.setPaymentMode(body.getPaymentMode());
            lastFee.setPendingAmount(BigDecimal.ZERO);
            lastFee.setTransactionId(body.getTransactionId());
            lastFee.setRemarks(body.getRemarks());
            feeRecordRepository.save(lastFee);

            if (lastPendingAmount.compareTo(BigDecimal.ZERO) > 0) {
                updateTransaction(studentId,
                        lastPendingAmount,
                        null,
                        null,
                        body.getPaymentMode(),
                        SourceType.FEE,
                        body.getTransactionId(),
                        2L,
                        2L);
            }
        } else if (RequestType.DISCOUNT.name().equals(type)) {
            student.setAllowedDiscount(body.getDiscount());
            studentRepo.save(student);
        } else {
            throw new IllegalStateException("Invalid type request");
        }
    }

    // =========================================================
    // SAVE ADMISSION REQUEST
    // =========================================================

    public Students admissionSubmit(PendingRequestDTO body,
                                    Long studentId,
                                    Long adminId) {

        Students student = Students.builder()
                .studentId(studentId)
                .fullName(body.getFullName())
                .dateOfBirth(body.getDateOfBirth())
                .mobileNumber(body.getMobileNumber())
                .guardianNumber(body.getGuardianNumber())
                .fatherName(body.getFatherName())
                .localAddress(body.getLocalAddress())
                .permanentAddress(body.getPermanentAddress())
                .aadhaarNumber(body.getAadhaarNumber())
                .qualification(body.getQualification())
                .preparationFor(body.getPreparationFor())
                .dateOfAdmission(body.getFromDate())
                .enrollmentStatus(EnrollmentStatus.ACTIVE.name())
                .createdBy(adminId)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        // 1. Save student first
        student = studentRepo.save(student);

        // 2. Save fee record
        FeeRecord fee = FeeRecord.builder()
                .studentId(student.getStudentId())
                .batchId(body.getBatchId())
                .seatId(body.getSeatId())
                .fromDate(body.getFromDate())
                .tillDate(body.getTillDate())
                .discountAmount(body.getDiscount())
                .submittedAmount(body.getSubmittedAmount())
                .cashAmount(body.getCashAmount())
                .onlineAmount(body.getOnlineAmount())
                .pendingAmount(body.getPendingAmount())
                .paymentMode(body.getPaymentMode())
                .transactionId(body.getTransactionId())
                .remarks(body.getRemarks())
                .createdBy(adminId)
                .createdAt(OffsetDateTime.now())
                .build();

        fee = feeRecordRepository.save(fee);

        // 3. Update student's last fee
        student.setLastFee(fee);
        student = studentRepo.save(student);

        // 4. Update seat
        seatService.updateSeat(null, body.getSeatId(), student.getStudentId());

        // 5. Update transaction
        updateTransaction(
                student.getStudentId(),
                body.getSubmittedAmount(),
                body.getCashAmount(),
                body.getOnlineAmount(),
                body.getPaymentMode(),
                SourceType.ADMISSION,
                null,
                null,
                adminId
        );

        return student;
    }

    // =========================================================
    // SEAT UPDATE
    // =========================================================
    public void updateSeat(Long studentId,
                           Long newSeatId) {
        Students student = studentRepo.findByStudentId(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        FeeRecord fr = student.getLastFee();
        seatService.updateSeat(fr.getSeatId(), newSeatId, studentId);
        fr.setSeatId(newSeatId);
        feeRecordRepository.save(fr);
    }

    // =========================================================
    // DETAILS UPDATE REQUEST
    // =========================================================
    public void updateDetail(Students student,
                             String fullName,
                             String mobileNumber,
                             String guardianNumber) {
        student.setFullName(fullName);
        student.setMobileNumber(mobileNumber);
        student.setGuardianNumber(guardianNumber);
        studentRepo.save(student);
    }

    // =========================================================
    // ENROLLMENT UPDATE REQUEST
    // =========================================================
    public void updateEnrollment(Students student,
                                 String status) {
        student.setEnrollmentStatus(status);
        FeeRecord lastFee = student.getLastFee();
        if (EnrollmentStatus.DISCONTINUED.name().equals(status) || EnrollmentStatus.TERMINATED.name().equals(status)) {
            Long seatId = lastFee.getSeatId();
            seatService.removeReservedSeat(seatId);
            LocalDate today = LocalDate.now();
            // Update only if tillDate is null or in the future
            if (lastFee.getTillDate() == null || lastFee.getTillDate().isAfter(today)) {
                lastFee.setTillDate(today);
                feeRecordRepository.save(lastFee);
            }
        }
        studentRepo.save(student);
    }

    public void updateTransaction(Long studentId,
                                  BigDecimal amount,
                                  BigDecimal cashAmount,
                                  BigDecimal onlineAmount,
                                  String paymentMode,
                                  SourceType sourceType,
                                  String description,
                                  Long managerId,
                                  Long adminId) {
        Long createdBy = adminId;
        if (managerId != null) {
            createdBy = managerId;
        }

        // Update Transaction
        Transaction transaction = Transaction.builder()
                .transactionType(TransactionType.INCOME)
                .sourceType(sourceType)
                .studentId(studentId)
                .amount(amount)
                .cashAmount(cashAmount)
                .onlineAmount(onlineAmount)
                .paymentMode(PaymentMode.valueOf(paymentMode))
                .transactionDate(OffsetDateTime.now())
                .description(description)
                .status(PendingRequestStatus.APPROVED)
                .createdBy(createdBy)
                .actionBy(adminId)
                .actionDate(OffsetDateTime.now())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        transactionRepository.save(transaction);
    }

    public void clearPendingApprovals() {
        approvalRequestRepo.clearProcessedApprovalRequests();
    }

    // ====================================================
    // 🔹 CLEAR FEE RECORDS
    // ====================================================

    public void clearFeeRecords() {
        feeRecordRepository.clearFeeRecords();
    }

    // ====================================================
    // 🔹 RESET CONFIGURATION
    // ====================================================

    public void resetConfiguration() {
        configurationService.resetConfiguration();
    }

    // ====================================================
    // 🔹 RESET SEATS
    // ====================================================

    public void resetSeats() {
        seatService.resetSeats();
    }

    // ====================================================
    // 🔹 CLEAR TRANSACTIONS BEFORE DATE
    // ====================================================

    @Transactional
    public void clearTransactionsBefore(LocalDate beforeDate) {

        transactionRepository.clearTransactionsBefore(
                beforeDate.atStartOfDay()
                        .atOffset(ZoneOffset.ofHoursMinutes(5, 30))
        );
    }
}