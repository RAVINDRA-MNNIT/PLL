package com.prolearner.all.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import com.prolearner.all.dto.*;
import com.prolearner.all.entity.FeeRecord;
import com.prolearner.all.entity.Students;
import com.prolearner.all.enums.EnrollmentStatus;
import com.prolearner.all.repository.FeeRecordRepository;
import com.prolearner.all.repository.StudentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;


@Service
public class StudentService {

    private final StudentRepository studentRepo;
    private final FeeRecordRepository feeRecordRepo;
    private final ConfigurationService configurationService;


    public StudentService(StudentRepository studentRepo,
                          FeeRecordRepository feeRecordRepo,
                          ConfigurationService configurationService) {
        this.studentRepo = studentRepo;
        this.feeRecordRepo = feeRecordRepo;
        this.configurationService = configurationService;
    }

    public StudentListResponse getStudents(
            String searchBy,
            String search,
            Long batchId,
            String enrollmentStatus,
            Pageable pageable) {
        LocalDate discontinuedDate = LocalDate.now().minusDays(configurationService.getDaysForDiscontinue());

        Page<StudentListItem> page = studentRepo.findStudents(
                searchBy,
                search,
                batchId,
                enrollmentStatus,
                discontinuedDate,
                pageable
        );

        return new StudentListResponse(
                page.getContent(),
                page.getTotalElements(),
                page.getNumber() + 1,
                page.getTotalPages(),
                page.getSize()
        );
    }

    public StudentDetailsResponse getStudentDetails(Long studentId) {
        Students student = studentRepo.findByStudentId(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        FeeRecord fee = student.getLastFee();

        StudentFeeHistoryResponse lastFee = null;

        if (fee != null) {
            lastFee = new StudentFeeHistoryResponse(
                    fee.getId(),
                    fee.getBatch() == null ? null : fee.getBatch().getId(),
                    fee.getBatch() == null ? null : fee.getBatch().getBatchName(),
                    fee.getSeat() == null ? null : fee.getSeat().getId(),
                    fee.getSeat() == null ? null : fee.getSeat().getSeatNumber(),
                    fee.getFromDate(),
                    fee.getTillDate(),
                    fee.getSubmittedAmount(),
                    fee.getPendingAmount(),
                    fee.getDiscountAmount(),
                    fee.getPaymentMode(),
                    fee.getTransactionId(),
                    fee.getRemarks(),
                    fee.getCreatedBy(),
                    fee.getCreatedAt()
            );
        }

        LocalDate today = LocalDate.now();

        EnrollmentStatus enrollmentStatus = EnrollmentStatus.valueOf(student.getEnrollmentStatus());

        if (fee != null && fee.getTillDate() != null) {

            long diffDays = ChronoUnit.DAYS.between(today, fee.getTillDate());

            boolean isExpired =
                    diffDays < 0 && enrollmentStatus == EnrollmentStatus.ACTIVE;

            boolean isDiscontinued =
                    diffDays < -configurationService.getDaysForDiscontinue()
                            && enrollmentStatus == EnrollmentStatus.ACTIVE;

            if (enrollmentStatus == EnrollmentStatus.TERMINATED
                    || enrollmentStatus == EnrollmentStatus.DISCONTINUED
                    || enrollmentStatus == EnrollmentStatus.EXPIRED) {

                // keep existing status

            } else if (isDiscontinued) {

                enrollmentStatus = EnrollmentStatus.DISCONTINUED;

            } else if (isExpired) {

                enrollmentStatus = EnrollmentStatus.EXPIRED;

            } else {

                enrollmentStatus = EnrollmentStatus.ACTIVE;

            }
        }

        return new StudentDetailsResponse(
                student.getStudentId(),
                student.getFullName(),
                student.getDateOfBirth(),
                student.getMobileNumber(),
                student.getGuardianNumber(),
                student.getFatherName(),
                student.getLocalAddress(),
                student.getPermanentAddress(),
                student.getAadhaarNumber(),
                student.getQualification(),
                student.getPreparationFor(),
                student.getDateOfAdmission(),
                enrollmentStatus.name(),
                lastFee
        );
    }

    public List<StudentFeeHistoryResponse> getStudentFeeHistory(Long studentId) {

        return feeRecordRepo
                .findByStudentIdOrderByIdDesc(studentId)
                .stream()
                .map(fee -> new StudentFeeHistoryResponse(
                        fee.getId(),
                        fee.getBatch() == null ? null : fee.getBatch().getId(),
                        fee.getBatch() == null ? null : fee.getBatch().getBatchName(),
                        fee.getSeat() == null ? null : fee.getSeat().getId(),
                        fee.getSeat() == null ? null : fee.getSeat().getSeatNumber(),
                        fee.getFromDate(),
                        fee.getTillDate(),
                        fee.getSubmittedAmount(),
                        fee.getPendingAmount(),
                        fee.getDiscountAmount(),
                        fee.getPaymentMode(),
                        fee.getTransactionId(),
                        fee.getRemarks(),
                        fee.getCreatedBy(),
                        fee.getCreatedAt()
                ))
                .toList();
    }
}

