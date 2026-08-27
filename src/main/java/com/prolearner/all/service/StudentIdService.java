package com.prolearner.all.service;
import com.prolearner.all.repository.StudentRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import com.prolearner.all.enums.RequestType;

import com.prolearner.all.enums.PendingRequestStatus;
import com.prolearner.all.repository.ApprovalRequestRepository;
import com.prolearner.all.dto.StudentIdAllocation;
import java.util.List;

@Service
@AllArgsConstructor
public class StudentIdService {

    private final ApprovalRequestRepository approvalRequestRepo;
    private final StudentRepository studentRepo;

    public StudentIdAllocation allocateStudentId() {

        Long studentId;
        Long reusableStudentId = null;

        List<PendingRequestStatus> reusableStatuses = List.of(
                PendingRequestStatus.CANCELLED
        );

        Long minReusableStudentId =
                approvalRequestRepo.findMinStudentIdByStatus(
                        RequestType.ADMISSION,
                        reusableStatuses
                );

        if (minReusableStudentId != null) {
            studentId = minReusableStudentId;
            reusableStudentId = minReusableStudentId;
        } else {
            Long maxStudentId =
                    approvalRequestRepo.findMaxStudentIdByType(
                            RequestType.ADMISSION
                    );

            if (maxStudentId != null) {
                studentId = maxStudentId + 1L;

                if (studentRepo.findByStudentId(studentId).isPresent()) {
                    studentId = studentRepo.findMaxId() + 1;
                }
            } else {
                Long maxStudentIdFromStudents = studentRepo.findMaxId();

                studentId = (maxStudentIdFromStudents != null)
                        ? maxStudentIdFromStudents + 1
                        : 1L;
            }
        }

        return new StudentIdAllocation(studentId, reusableStudentId);
    }

    // =========================================================
    // DUPLICATE AADHAAR CHECK
    // =========================================================

    public Boolean isAadhaarExist(String aadhaarNumber) {
        if (aadhaarNumber == null || !aadhaarNumber.matches("\\d{12}")) {
            throw new IllegalArgumentException(
                    "Invalid Aadhaar Number!"
            );
        }
        boolean approvalRequestExists =
                approvalRequestRepo.existsByAadhaarNumber(aadhaarNumber);
        boolean studentExists =
                studentRepo.existsByAadhaarNumber(aadhaarNumber);
        return approvalRequestExists || studentExists;
    }

    // DELETE OLD CANCELLED / REJECTED RECORD
    // AFTER SUCCESSFUL INSERT
    public void deleteOldAdmissionRequest(Long studentId) {
        if (studentId != null) {
            approvalRequestRepo.deleteOldAdmissionRequest(
                    RequestType.ADMISSION,
                    List.of(
                            PendingRequestStatus.CANCELLED
                    ),
                    studentId
            );
        }
    }
}