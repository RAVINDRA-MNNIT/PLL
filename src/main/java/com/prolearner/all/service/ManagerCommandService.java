package com.prolearner.all.service;
import java.util.Objects;
import java.util.Optional;
import java.time.LocalDate;
import java.time.OffsetDateTime;

import com.prolearner.all.dto.PendingRequestDTO;
import com.prolearner.all.dto.StudentIdAllocation;
import com.prolearner.all.entity.FeeRecord;
import com.prolearner.all.entity.Students;
import com.prolearner.all.enums.EnrollmentStatus;
import com.prolearner.all.repository.StudentRepository;

import lombok.AllArgsConstructor;

import org.springframework.stereotype.Service;

import com.prolearner.all.entity.ApprovalRequest;
import com.prolearner.all.enums.RequestType;
import com.prolearner.all.enums.PendingRequestStatus;
import com.prolearner.all.repository.ApprovalRequestRepository;
//import com.prolearner.all.repository.SeatRepository;
import com.prolearner.all.repository.FeeRecordRepository;

import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.Id;

@Service
@AllArgsConstructor
public class ManagerCommandService {

    private final ApprovalRequestRepository approvalRequestRepo;
    private final StudentRepository studentRepo;
  //  private final SeatRepository seatRepo;
    private final FeeRecordRepository feeRecordRepo;
    private final SeatService seatService;
    private final StudentIdService studentIdService;

    // ====================================================
    // 🔹 Create Request
    // ====================================================

    @Transactional
    public ApprovalRequest create(
            String typeStr,
            PendingRequestDTO body,
            Long userId
    ) {

        RequestType type = RequestType.from(typeStr);
        ApprovalRequest newRequest = new ApprovalRequest();
        // STUDENT ID GENERATION
        if (type == RequestType.ADMISSION) {
            StudentIdAllocation allocation = studentIdService.allocateStudentId();
            // DUPLICATE AADHAAR CHECK
            if (studentIdService.isAadhaarExist(body.getAadhaarNumber())) {
                throw new RuntimeException(
                        "Student with this Aadhaar Number already Exist!"
                );
            }
            studentIdService.deleteOldAdmissionRequest(allocation.getReusableStudentId());
            return admissionSubmit(newRequest, body, allocation.getStudentId(), userId);
        } else if (type == RequestType.DETAILS) {
            newRequest.setFullName(body.getFullName());
            newRequest.setMobile(body.getMobileNumber());
            newRequest.setGuardianNumber(body.getGuardianNumber());
            return handleCommonRequestParamForUpdate(newRequest, type, body.getStudentId(), userId, false);
        } else if (type == RequestType.SEAT) {
            FeeRecord lastFee = feeRecordRepo.findTopByStudentIdOrderByCreatedAtDesc(body.getStudentId())
                    .orElseThrow(() -> new RuntimeException("Fee Records not found"));
            if (lastFee.getSeatId().equals(body.getSeatId())) {
                throw new IllegalStateException("Currently same seat is assigned, Please select another one!");
            }
            seatService.updateSeat(null, body.getSeatId(), body.getStudentId());
            newRequest.setSeatId(body.getSeatId());
            return handleCommonRequestParamForUpdate(newRequest, type, body.getStudentId(), userId, false);
        } else if (type == RequestType.ENROLLMENT) {
            newRequest.setEnrollmentStatus(body.getEnrollmentStatus());
            return handleCommonRequestParamForUpdate(newRequest, type, body.getStudentId(), userId, false);
        } else if (type == RequestType.FEES) {
            return handleFees(newRequest, body, type, userId, false);
        }
        else {
            throw new IllegalStateException("Only Admission, Seat, Details and Enrollment update handled");
        }
    }

    // ====================================================
    // 🔹 Update Request
    // ====================================================

    public ApprovalRequest update(
            Long id,
            PendingRequestDTO body,
            Long userId
    ) {
        ApprovalRequest r = approvalRequestRepo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Request not found"));
        if (!(r.getStatus() == PendingRequestStatus.PENDING || r.getStatus() == PendingRequestStatus.REJECTED)) {
            throw new IllegalStateException("Only pending request can be updated");
        }
        if (r.getRequestType() == RequestType.ADMISSION) {
            // DUPLICATE AADHAAR CHECK
            if (!body.getAadhaarNumber().equals(r.getAadhaarNumber())) {
                if (studentIdService.isAadhaarExist(body.getAadhaarNumber())) {
                    throw new RuntimeException(
                            "Student with this Aadhaar Number already Exist!"
                    );
                }
            }
            return admissionSubmit(r, body, null, userId);
        } else if (r.getRequestType() == RequestType.FEES) {
            return handleFees(r, body, RequestType.FEES, userId, true);
        }
        else {
            throw new IllegalStateException("Only Admission handled");
        }
    }

    // ====================================================
    // 🔹 Cancel Request
    // ====================================================

    public void cancel(Long id,
                       String remark) {
        ApprovalRequest r = approvalRequestRepo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Request not found"));
        if (r.getStatus() != PendingRequestStatus.PENDING) {
            throw new IllegalStateException("Only pending request can be cancelled");
        }
        r.setStatus(PendingRequestStatus.CANCELLED);
        r.setCancelledAt(OffsetDateTime.now());
        // ✅ save remark
        r.setRemarks(remark);
        approvalRequestRepo.save(r);
        Optional<FeeRecord> lastFee = feeRecordRepo.findTopByStudentIdOrderByCreatedAtDesc(r.getStudentId());
        if (r.getRequestType() == RequestType.ADMISSION) {
            seatService.removeReservedSeat(r.getSeatId());
        } else if (r.getRequestType() == RequestType.FEES) {
            if (lastFee.isPresent()) {
                FeeRecord fee = lastFee.get();
                if (!fee.getSeatId().equals(r.getSeatId())) {
                    seatService.removeReservedSeat(r.getSeatId());
                }
            }
        }
    }

    // =========================================================
    // SAVE ADMISSION REQUEST
    // =========================================================

    public ApprovalRequest admissionSubmit(ApprovalRequest request,
                                           PendingRequestDTO body,
                                           Long studentId,
                                           Long userId) {
        Long previousSeatId = request.getSeatId();
        // Request metadata
        request.setRequestType(RequestType.ADMISSION);
        if (studentId != null) {
            request.setStudentId(studentId);
        }
        request.setStatus(PendingRequestStatus.PENDING);
        request.setRequestedBy(userId);
        request.setRequestedAt(OffsetDateTime.now());
        // STUDENT
        request.setFullName(body.getFullName());
        request.setDateOfBirth(body.getDateOfBirth());
        request.setMobile(body.getMobileNumber());
        request.setGuardianNumber(body.getGuardianNumber());
        request.setFatherName(body.getFatherName());
        // ADDRESS
        request.setLocalAddress(body.getLocalAddress());
        request.setPermanentAddress(body.getPermanentAddress());
        // IDENTITY / EDUCATION
        request.setAadhaarNumber(body.getAadhaarNumber());
        request.setQualification(body.getQualification());
        request.setPreparationFor(body.getPreparationFor());
        // BATCH / SEAT
        request.setBatchId(body.getBatchId());
        request.setSeatId(body.getSeatId());
        // MEMBERSHIP
        request.setFromDate(body.getFromDate());
        request.setTillDate(body.getTillDate());
        // PAYMENT
        request.setSubmittedAmount(body.getSubmittedAmount());
        request.setDiscount(body.getDiscount());
        request.setPendingAmount(body.getPendingAmount());
        request.setPaymentMode(body.getPaymentMode());
        request.setTransactionId(body.getTransactionId());
        request.setRemarks(body.getRemarks());
        // ENROLLMENT
        request.setEnrollmentStatus(body.getEnrollmentStatus());
        // SAVE REQUEST
        if (request.getBatchId() == 28L || request.getBatchId() == 27L) {
            seatService.updateSeat(previousSeatId, body.getSeatId(), request.getStudentId());
        } else {
            seatService.removeReservedSeat(request.getSeatId());
        }
        return approvalRequestRepo.save(request);
    }

    // =========================================================
    // HANDLE COMMON FUNCTION RELATED TO SEAT, DETAIL, ENROLLMENT UPDATE REQUEST
    // =========================================================

    public ApprovalRequest handleCommonRequestParamForUpdate(ApprovalRequest request,
                                                                   RequestType requestType,
                                                                   Long studentId,
                                                                   Long userId,
                                                                   Boolean isUpdateRequest) {
        if (isUpdateRequest == false) {
            ApprovalRequest oldRequest = approvalRequestRepo.findByStudentIdAndRequestTypeAndStatus(studentId, requestType, PendingRequestStatus.PENDING);
            if (oldRequest != null) {
                throw new IllegalStateException("A request related to this student is already in pending!, \n\nyou can cancel that to create new one or ask admin to approve/reject that.");
            }
        }
        request.setRequestType(requestType);
        request.setStudentId(studentId);
        request.setStatus(PendingRequestStatus.PENDING);
        request.setRequestedBy(userId);
        request.setRequestedAt(OffsetDateTime.now());
        return approvalRequestRepo.save(request);
    }

    public ApprovalRequest handleFees(ApprovalRequest request, PendingRequestDTO body, RequestType type, Long userId, Boolean isUpdateRequest) {
        Students student = studentRepo.findByStudentId(body.getStudentId())
            .orElseThrow(() -> new RuntimeException("Student not found"));
        Optional<FeeRecord> lastFee = feeRecordRepo.findTopByStudentIdOrderByCreatedAtDesc(body.getStudentId());
        if (lastFee.isPresent()) {
            FeeRecord fee = lastFee.get();
            LocalDate tillDate = fee.getTillDate();
            if (body.getFromDate().isBefore(tillDate)) {
                throw new IllegalStateException("Membership from date should not be before last fees due date");
            }
            if (Objects.equals(fee.getSeatId(), request.getSeatId())) {
                seatService.updateSeat(null, body.getSeatId(), body.getStudentId());
            } else {
                seatService.updateSeat(request.getSeatId(), body.getSeatId(), body.getStudentId());
            }
        }

        request.setBatchId(body.getBatchId());
        request.setSeatId(body.getSeatId());
        request.setFromDate(body.getFromDate());
        request.setTillDate(body.getTillDate());
        request.setSubmittedAmount(body.getSubmittedAmount());
        request.setDiscount(body.getDiscount());
        request.setPendingAmount(body.getPendingAmount());
        request.setPaymentMode(body.getPaymentMode());
        request.setTransactionId(body.getTransactionId());
        request.setRemarks(body.getRemarks());
        
        return handleCommonRequestParamForUpdate(request, type, body.getStudentId(), userId, isUpdateRequest);
    }
}