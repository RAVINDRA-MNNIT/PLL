package com.prolearner.all.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Optional;

import com.prolearner.all.entity.Transaction;
import com.prolearner.all.enums.*;
import com.prolearner.all.repository.TransactionRepository;
import lombok.AllArgsConstructor;

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


@Service
@AllArgsConstructor
public class AdminCommandService {

    private final ApprovalRequestRepository approvalRequestRepo;
    private final StudentRepository studentRepo;
    private final FeeRecordRepository feeRecordRepository;
    private final SeatService seatService;
    private final StudentIdService studentIdService;
    private final TransactionRepository transactionRepository;


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
            Optional<FeeRecord> lastFee = feeRecordRepository.findTopByStudentIdOrderByCreatedAtDesc(studentId);
        if (lastFee.isPresent()) {
            FeeRecord fee = lastFee.get();
            LocalDate tillDate = fee.getTillDate();
            if (body.getFromDate().isBefore(tillDate)) {
                throw new IllegalStateException("Membership from date should not be before last fees due date");
            }
        }
        FeeRecord fee = FeeRecord.builder()
                .studentId(studentId)
                .batchId(body.getBatchId())
                .seatId(body.getSeatId())
                .fromDate(body.getFromDate())
                .tillDate(body.getTillDate())
                .discountAmount(body.getDiscount())
                .submittedAmount(body.getSubmittedAmount())
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
        student.setEnrollmentStatus(EnrollmentStatus.ACTIVE.name());
        studentRepo.save(student);

        // Update Transaction
        updateTransaction(studentId, body.getSubmittedAmount(), body.getPaymentMode(), SourceType.FEE, null, adminId);

        feeRecordRepository.save(fee);
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
            Students savedStudent = studentRepo.save(student);

            // Save fee record
            FeeRecord fee = FeeRecord.builder()
                    .studentId(r.getStudentId())
                    .batchId(r.getBatchId())
                    .seatId(r.getSeatId())
                    .fromDate(r.getFromDate())
                    .tillDate(r.getTillDate())
                    .discountAmount(r.getDiscount())
                    .submittedAmount(r.getSubmittedAmount())
                    .pendingAmount(r.getPendingAmount())
                    .paymentMode(r.getPaymentMode())
                    .transactionId(r.getTransactionId())
                    .remarks(r.getRemarks())
                    .createdBy(adminId)
                    .createdAt(OffsetDateTime.now())
                    .build();

            feeRecordRepository.save(fee);

            // Update seat
            seatService.updateSeat(null, r.getSeatId(), r.getStudentId());
            // Update Transaction
            updateTransaction(r.getStudentId(), r.getSubmittedAmount(), r.getPaymentMode(), SourceType.ADMISSION, 1L, adminId);

        } else {
            Long studentId = r.getStudentId();
            Students student = studentRepo.findByStudentId(studentId)
                    .orElseThrow(() -> new RuntimeException("Student not found"));
            if (RequestType.FEES.equals(r.getRequestType())) {


                Optional<FeeRecord> lastFee = feeRecordRepository.findTopByStudentIdOrderByCreatedAtDesc(studentId);
                if (lastFee.isPresent()) {
                    FeeRecord fee = lastFee.get();
                    LocalDate tillDate = fee.getTillDate();
                    if (r.getFromDate().isBefore(tillDate)) {
                        throw new IllegalStateException("Membership from date should not be before last fees due date");
                    }
                }
                FeeRecord fee = FeeRecord.builder()
                        .studentId(studentId)
                        .batchId(r.getBatchId())
                        .seatId(r.getSeatId())
                        .fromDate(r.getFromDate())
                        .tillDate(r.getTillDate())
                        .discountAmount(r.getDiscount())
                        .submittedAmount(r.getSubmittedAmount())
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
                studentRepo.save(student);
                // Update Transaction
                updateTransaction(studentId, r.getSubmittedAmount(), r.getPaymentMode(), SourceType.FEE, 1L, adminId);
                // Update Fee
                feeRecordRepository.save(fee);

            } else if (RequestType.SEAT.equals(r.getRequestType())) {
                updateSeat(r.getStudentId(), r.getSeatId());
            } else if (RequestType.DETAILS.equals(r.getRequestType())) {
                updateDetail(student, r.getFullName(), r.getMobileNumber(), r.getGuardianNumber());
            } else if (RequestType.ENROLLMENT.equals(r.getRequestType())) {
                updateEnrollment(student, r.getEnrollmentStatus());
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
            updateDetail(student, body.getFullName(), body.getMobileNumber(), body.getGuardianNumber());
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
        // Save student first
        Students savedStudent = studentRepo.save(student);

        // Save fee record
        FeeRecord fee = FeeRecord.builder()
                .studentId(studentId)
                .batchId(body.getBatchId())
                .seatId(body.getSeatId())
                .fromDate(body.getFromDate())
                .tillDate(body.getTillDate())
                .discountAmount(body.getDiscount())
                .submittedAmount(body.getSubmittedAmount())
                .pendingAmount(body.getPendingAmount())
                .paymentMode(body.getPaymentMode())
                .transactionId(body.getTransactionId())
                .remarks(body.getRemarks())
                .createdBy(adminId)
                .createdAt(OffsetDateTime.now())
                .build();

        feeRecordRepository.save(fee);

        // Update seat
        seatService.updateSeat(null, body.getSeatId(), studentId);

        // Update Transaction
        updateTransaction(studentId, body.getSubmittedAmount(), body.getPaymentMode(), SourceType.ADMISSION, null, adminId);


        return savedStudent;
    }

    // =========================================================
    // SEAT UPDATE
    // =========================================================
    public void updateSeat(Long studentId,
                           Long newSeatId) {
        FeeRecord lastFee = feeRecordRepository.findTopByStudentIdOrderByCreatedAtDesc(studentId)
                .orElseThrow(() -> new RuntimeException("Fee Records not found"));
        seatService.updateSeat(lastFee.getSeatId(), newSeatId, studentId);
        lastFee.setSeatId(newSeatId);
        feeRecordRepository.save(lastFee);
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
        FeeRecord lastFee = feeRecordRepository.findTopByStudentIdOrderByCreatedAtDesc(student.getStudentId())
                .orElseThrow(() -> new RuntimeException("Fee Records not found"));
        if (EnrollmentStatus.DISCONTINUED.name().equals(status) || EnrollmentStatus.TERMINATED.name().equals(status)) {
            Long seatId = lastFee.getSeatId();
            seatService.removeReservedSeat(seatId);
            LocalDate today = LocalDate.now();
            lastFee.setTillDate(today);
            feeRecordRepository.save(lastFee);
        }
        studentRepo.save(student);
    }

    public void updateTransaction(Long studentId,
                                  BigDecimal amount,
                                  String paymentMode,
                                  SourceType sourceType,
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
                .paymentMode(PaymentMode.valueOf(paymentMode))
                .transactionDate(OffsetDateTime.now())
                .description("")
                .status(PendingRequestStatus.APPROVED)
                .createdBy(createdBy)
                .actionBy(adminId)
                .actionDate(OffsetDateTime.now())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        transactionRepository.save(transaction);
    }
}