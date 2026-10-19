package com.prolearner.all.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import com.prolearner.all.dto.*;
import com.prolearner.all.entity.*;
import com.prolearner.all.enums.EnrollmentStatus;
import com.prolearner.all.enums.PendingRequestStatus;
import com.prolearner.all.enums.RequestType;
import com.prolearner.all.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;


@Service
public class StudentService {

    private final StudentRepository studentRepo;
    private final FeeRecordRepository feeRecordRepo;
    private final ConfigurationService configurationService;
    private final SeatRepository seatRepo;
    private final StudentWarningRepository studentWarningRepo;
    private final StudentComplaintRepository studentComplaintRepo;
    private final SeatService seatService;
    private final ApprovalRequestRepository approvalRequestRepo;
    private final ComplaintCommentRepository complaintCommentRepo;
    private final UserRepository userRepo;


    public StudentService(StudentRepository studentRepo,
                          FeeRecordRepository feeRecordRepo,
                          ConfigurationService configurationService,
                          SeatRepository seatRepo,
                          StudentWarningRepository studentWarningRepo,
                          StudentComplaintRepository studentComplaintRepo,
                          SeatService seatService,
                          ApprovalRequestRepository approvalRequestRepo, ComplaintCommentRepository complaintCommentRepo, UserRepository userRepo) {
        this.studentRepo = studentRepo;
        this.feeRecordRepo = feeRecordRepo;
        this.configurationService = configurationService;
        this.seatRepo = seatRepo;
        this.studentWarningRepo = studentWarningRepo;
        this.studentComplaintRepo = studentComplaintRepo;
        this.seatService = seatService;
        this.approvalRequestRepo = approvalRequestRepo;
        this.complaintCommentRepo = complaintCommentRepo;
        this.userRepo = userRepo;
    }

    public StudentListResponse getStudents(
            String searchBy,
            String search,
            Long batchId,
            String enrollmentStatus,
            boolean pendingFees,
            boolean discount,
            Pageable pageable) {

        LocalDate discontinuedDate =
                LocalDate.now().minusDays(configurationService.getDaysForDiscontinue());

        Page<StudentListItem> page = studentRepo.findStudents(
                searchBy,
                search,
                batchId,
                enrollmentStatus,
                pendingFees,
                discount,
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

        // =========================================================
        // WARNINGS
        // =========================================================

        List<StudentWarning> warnings =
                studentWarningRepo.findByStudentIdOrderByIssuedAtDesc(studentId);


        // =========================================================
        // COMPLAINTS
        // =========================================================

        List<StudentComplaint> complaints =
                studentComplaintRepo.findByStudentIdOrderBySubmittedAtDesc(studentId);


        // =========================================================
        // COMPLAINT COMMENTS
        // =========================================================

        List<Long> complaintIds = complaints.stream()
                .map(StudentComplaint::getId)
                .toList();

        List<ComplaintComment> complaintComments =
                complaintIds.isEmpty()
                        ? List.of()
                        : complaintCommentRepo
                        .findByComplaintIdInOrderByCreatedAtAsc(complaintIds);


        // =========================================================
        // GROUP COMMENTS BY COMPLAINT
        // =========================================================

        Map<Long, List<ComplaintCommentResponse>> commentsByComplaint =
                complaintComments.stream()
                        .collect(Collectors.groupingBy(
                                ComplaintComment::getComplaintId,
                                LinkedHashMap::new,
                                Collectors.mapping(
                                        comment -> ComplaintCommentResponse.builder()
                                                .userId(comment.getUserId())
                                                .userName(comment.getUserName())
                                                .role(comment.getRole())
                                                .comment(comment.getComment())
                                                .createdAt(comment.getCreatedAt())
                                                .build(),
                                        Collectors.toList()
                                )
                        ));


        // =========================================================
        // CONVERT COMPLAINTS TO RESPONSE
        // =========================================================

        List<StudentComplaintResponse> complaintResponses =
                complaints.stream()
                        .map(complaint -> {

                            StudentComplaintResponse response =
                                    new StudentComplaintResponse();

                            response.setId(complaint.getId());
                            response.setStudentId(complaint.getStudentId());
                            response.setFullName(student.getFullName());
                            response.setMobileNumber(student.getMobileNumber());

                            response.setCategory(complaint.getCategory());
                            response.setDescription(complaint.getDescription());
                            response.setStatus(complaint.getStatus());
                            response.setResolution(complaint.getResolution());

                            response.setSubmittedAt(complaint.getSubmittedAt());
                            response.setResolvedAt(complaint.getResolvedAt());
                            response.setClosedAt(complaint.getClosedAt());
                            response.setCreatedAt(complaint.getCreatedAt());
                            response.setUpdatedAt(complaint.getUpdatedAt());

                            // Comments belonging ONLY to this complaint
                            response.setComments(
                                    commentsByComplaint.getOrDefault(
                                            complaint.getId(),
                                            List.of()
                                    )
                            );

                            return response;
                        })
                        .toList();


        // =========================================================
        // ALL APPROVAL REQUESTS - ALL STATUSES
        // =========================================================

        List<ApprovalRequest> approvalRequests =
                approvalRequestRepo
                        .findByStudentIdAndStatusInAndRequestTypeNotOrderByRequestedAtDesc(
                                studentId,
                                List.of(
                                        PendingRequestStatus.PENDING,
                                        PendingRequestStatus.REJECTED
                                ),
                                RequestType.ADMISSION
                        );

        List<PendingRequestDTO> approvalRequestDTOs =
                approvalRequests.stream()
                        .map(request -> {

                            PendingRequestDTO dto = new PendingRequestDTO();

                            dto.setId(request.getId());
                            dto.setStudentId(request.getStudentId());

                            dto.setFullName(request.getFullName());
                            dto.setDateOfBirth(request.getDateOfBirth());
                            dto.setMobile(request.getMobileNumber());
                            dto.setGuardianNumber(request.getGuardianNumber());
                            dto.setFatherName(request.getFatherName());

                            dto.setLocalAddress(request.getLocalAddress());
                            dto.setPermanentAddress(request.getPermanentAddress());

                            dto.setAadhaarNumber(request.getAadhaarNumber());
                            dto.setQualification(request.getQualification());
                            dto.setPreparationFor(request.getPreparationFor());

                            dto.setBatchId(request.getBatchId());
                            dto.setSeatId(request.getSeatId());

                            dto.setFromDate(request.getFromDate());
                            dto.setTillDate(request.getTillDate());

                            dto.setSubmittedAmount(request.getSubmittedAmount());
                            dto.setCashAmount(request.getCashAmount());
                            dto.setOnlineAmount(request.getOnlineAmount());
                            dto.setDiscount(request.getDiscount());
                            dto.setPendingAmount(request.getPendingAmount());

                            dto.setPaymentMode(request.getPaymentMode());
                            dto.setTransactionId(request.getTransactionId());
                            dto.setRemarks(request.getRemarks());

                            dto.setEnrollmentStatus(request.getEnrollmentStatus());
                            dto.setRequestedBy(request.getRequestedBy());
                            dto.setRequestType(request.getRequestType().name());
                            dto.setRequestedAt(request.getRequestedAt());

                            if (request.getStatus() != null) {
                                dto.setStatus(request.getStatus().name());
                            }

                            return dto;
                        })
                        .toList();


        // =========================================================
        // LAST FEE
        // =========================================================

        FeeRecord fee = student.getLastFee();

        StudentFeeHistoryResponse lastFee = null;

        if (fee != null) {

            lastFee = new StudentFeeHistoryResponse(
                    fee.getId(),
                    fee.getBatch() == null ? null : fee.getBatch().getId(),
                    fee.getBatch() == null ? null : fee.getBatch().getBatchName(),
                    fee.getBatch() == null ? null : fee.getBatch().getBatchAlias(),
                    fee.getSeat() == null ? null : fee.getSeat().getId(),
                    fee.getSeat() == null ? null : fee.getSeat().getSeatNumber(),
                    fee.getFromDate(),
                    fee.getTillDate(),
                    fee.getSubmittedAmount(),
                    fee.getCashAmount(),
                    fee.getOnlineAmount(),
                    fee.getPendingAmount(),
                    fee.getDiscountAmount(),
                    fee.getPaymentMode(),
                    fee.getTransactionId(),
                    fee.getRemarks(),
                    fee.getCreatedBy(),
                    fee.getCreatedAt()
            );
        }


        // =========================================================
        // ENROLLMENT STATUS
        // =========================================================

        LocalDate today = LocalDate.now();

        EnrollmentStatus enrollmentStatus =
                EnrollmentStatus.valueOf(student.getEnrollmentStatus());

        if (fee != null && fee.getTillDate() != null) {

            long diffDays =
                    ChronoUnit.DAYS.between(today, fee.getTillDate());

            boolean isExpired =
                    diffDays < 0
                            && enrollmentStatus == EnrollmentStatus.ACTIVE;

            boolean isDiscontinued =
                    diffDays < -configurationService.getDaysForDiscontinue()
                            && enrollmentStatus == EnrollmentStatus.ACTIVE;

            if (enrollmentStatus == EnrollmentStatus.TERMINATED
                    || enrollmentStatus == EnrollmentStatus.DISCONTINUED
                    || enrollmentStatus == EnrollmentStatus.EXPIRED) {

                // Keep existing status

            } else if (isDiscontinued) {

                enrollmentStatus = EnrollmentStatus.DISCONTINUED;

            } else if (isExpired) {

                enrollmentStatus = EnrollmentStatus.EXPIRED;

            } else {

                enrollmentStatus = EnrollmentStatus.ACTIVE;
            }
        }


        // =========================================================
        // RESPONSE
        // =========================================================

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
                student.getAllowedDiscount(),
                student.getTerminationCount(),
                warnings,
                complaintResponses,
                lastFee,
                approvalRequestDTOs
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
                        fee.getBatch() == null ? null : fee.getBatch().getBatchAlias(),
                        fee.getSeat() == null ? null : fee.getSeat().getId(),
                        fee.getSeat() == null ? null : fee.getSeat().getSeatNumber(),
                        fee.getFromDate(),
                        fee.getTillDate(),
                        fee.getSubmittedAmount(),
                        fee.getCashAmount(),
                        fee.getOnlineAmount(),
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

    public OverallStrengthResponse getOverallStrength() {

        LocalDate discontinuedDate = LocalDate.now().minusDays(configurationService.getDaysForDiscontinue());

        List<StrengthProjection> strengths =
                studentRepo.getBatchWiseStrength(
                        List.of("ACTIVE", "EXPIRED"),
                        discontinuedDate
                );

        List<OveraallStrengthItem> room1 = new ArrayList<>();
        List<OveraallStrengthItem> room2 = new ArrayList<>();
        List<OveraallStrengthItem> room3 = new ArrayList<>();
        List<OveraallStrengthItem> nightShift = new ArrayList<>();

        for (StrengthProjection strength : strengths) {

            String batchName = strength.getBatchName();
            String room = strength.getRoom();
            Long count = strength.getStudentCount();

            if ("R2".equalsIgnoreCase(room)) {
                room2.add(new OveraallStrengthItem(batchName, count));
            } else if ("R3".equalsIgnoreCase(room)) {
                room3.add(new OveraallStrengthItem(batchName, count));
            }

            if (batchName != null &&
                    (batchName.toUpperCase().contains("NIGHT")
                            || batchName.equalsIgnoreCase("24 HOURS"))) {

                nightShift.add(new OveraallStrengthItem(batchName, count));
            }
        }

        // Room 1 comes from occupied seats
        Long fullDayCount = seatRepo.countByStudentIdIsNotNullAndSeatNumberStartingWith("R1");
        room1.add(new OveraallStrengthItem("Full Day", fullDayCount));

        // Room 2 comes from occupied seats
        Long fullDayCount2 = seatRepo.countByStudentIdIsNotNullAndSeatNumberStartingWith("R2");
        room2.add(new OveraallStrengthItem("Full Day", fullDayCount2));

        // Room 3 comes from occupied seats
        Long fullDayCount3 = seatRepo.countByStudentIdIsNotNullAndSeatNumberStartingWith("R3");
        room3.add(new OveraallStrengthItem("Full Day", fullDayCount3));

        return new OverallStrengthResponse(
                room1,
                room2,
                room3,
                nightShift
        );
    }

    public FullDayStrengthResponse getStrength(List<String> rooms) {

        LocalDate discontinuedDate =
                LocalDate.now().minusDays(configurationService.getDaysForDiscontinue());

        List<FullDayStrength> seats = seatRepo.getStrengthByRooms(rooms, discontinuedDate)
                .stream()
                .map(s -> new FullDayStrength(
                        s.getSeatNumber(),
                        s.getStudentId(),
                        s.getFullName(),
                        s.getMobileNumber(),
                        s.getStatus(),
                        s.getTillDate()
                ))
                .toList();

        long occupied = seats.stream()
                .filter(s -> s.studentId() != null)
                .count();

        long available = seats.size() - occupied;

        return new FullDayStrengthResponse(
                occupied,
                available,
                seats
        );
    }

    public ShiftStrengthResponse getRoomStrength(String room) {
        LocalDate discontinuedDate = LocalDate.now().minusDays(configurationService.getDaysForDiscontinue());
        List<Room2StrengthProjection> rows = studentRepo.getStrengthByRooms(List.of(room), List.of("ACTIVE", "EXPIRED"), discontinuedDate);
        long fullDayCount = getStrength(List.of(room)).occupied();

        List<StrengthCount> firstShift = new ArrayList<>();
        List<StrengthCount> secondShift = new ArrayList<>();
        List<StrengthCount> thirdShift = new ArrayList<>();
        List<StrengthCount> fourthShift = new ArrayList<>();

        Pattern shiftPattern =
                Pattern.compile("^\\s*\\(?\\s*([1-4](?:\\s*&\\s*[1-4])*)");

        for (Room2StrengthProjection row : rows) {

            String batchName = row.getBatchName();

            if (batchName == null ||
                    "FULL DAY".equalsIgnoreCase(batchName)) {
                continue;
            }

            StrengthCount strength =
                    new StrengthCount(
                            batchName,
                            row.getCount()
                    );

            Matcher matcher = shiftPattern.matcher(batchName);

            if (!matcher.find()) {
                continue;
            }

            String shiftPart = matcher.group(1);

            String[] shifts = shiftPart.split("\\s*&\\s*");

            for (String shift : shifts) {

                switch (shift) {

                    case "1" -> firstShift.add(strength);

                    case "2" -> secondShift.add(strength);

                    case "3" -> thirdShift.add(strength);

                    case "4" -> fourthShift.add(strength);
                }
            }
        }
        StrengthCount fullDay = new StrengthCount("Full Day", fullDayCount);
        firstShift.add(fullDay);
        secondShift.add(fullDay);
        thirdShift.add(fullDay);
        fourthShift.add(fullDay);
        return new ShiftStrengthResponse(firstShift, secondShift, thirdShift, fourthShift);
    }

    public void addWarning(AddWarningRequest request) {
        StudentWarning warning = StudentWarning.builder()
                .studentId(request.getStudentId())
                .warningLevel(request.getWarningLevel())
                .category(request.getCategory())
                .description(request.getDescription())
                .actionTaken(request.getActionTaken())
                .issuedBy(request.getIssuedBy())
                .issuedByName(request.getIssuedByName())
                .issuedAt(OffsetDateTime.now())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        if ("TERMINATE".equals(request.getWarningLevel())) {
            Students student = studentRepo.findByStudentId(request.getStudentId()).orElseThrow(() -> new RuntimeException("Student not found"));
            student.setEnrollmentStatus(EnrollmentStatus.TERMINATED.name());
            FeeRecord lastFee = student.getLastFee();
            if (lastFee != null) {
                Long seatId = lastFee.getSeatId();
                seatService.removeReservedSeat(seatId);
                LocalDate today = LocalDate.now();
                if (lastFee.getTillDate() == null || lastFee.getTillDate().isAfter(today)) {
                    lastFee.setTillDate(today);
                    feeRecordRepo.save(lastFee);
                }
            }
            studentRepo.save(student);
            student.setTerminationCount((student.getTerminationCount() == null ? 0 : student.getTerminationCount()) + 1);
        }
        studentWarningRepo.save(warning);
    }

    public void addComplaint(AddComplaintRequest request) {

        OffsetDateTime now = OffsetDateTime.now();

        StudentComplaint complaint = StudentComplaint.builder()
                .studentId(request.getStudentId())
                .category(request.getCategory())
                .description(request.getDescription())
                .status("OPEN")
                .submittedAt(now)
                .createdAt(now)
                .updatedAt(now)
                .build();

        studentComplaintRepo.save(complaint);
    }

    public void deleteWarning(Long warningId) {
        if (!studentWarningRepo.existsById(warningId)) {
            throw new RuntimeException("Warning not found");
        }
        studentWarningRepo.deleteById(warningId);
    }

    @Transactional
    public void deleteComplaint(Long complaintId) {

        if (!studentComplaintRepo.existsById(complaintId)) {
            throw new RuntimeException("Complaint not found");
        }
        // Delete all comments belonging to this complaint
        complaintCommentRepo.deleteByComplaintId(complaintId);

        studentComplaintRepo.deleteById(complaintId);
    }

    public Page<StudentComplaintResponse> getAllComplaints(
            int page,
            int size,
            String search) {

        Pageable pageable = PageRequest.of(page, size);

        Page<StudentComplaintResponse> complaints =
                studentComplaintRepo.searchComplaints(
                        search,
                        pageable
                );

        complaints.getContent().forEach(complaint -> {

            List<ComplaintComment> comments =
                    complaintCommentRepo
                            .findByComplaintIdOrderByCreatedAtAsc(
                                    complaint.getId()
                            );

            List<ComplaintCommentResponse> commentResponses =
                    comments.stream()
                            .map(comment -> ComplaintCommentResponse.builder()
                                    .userId(comment.getUserId())
                                    .userName(comment.getUserName())
                                    .role(comment.getRole())
                                    .comment(comment.getComment())
                                    .createdAt(comment.getCreatedAt())
                                    .build())
                            .toList();

            complaint.setComments(commentResponses);
        });

        return complaints;
    }


    public Page<StudentWarningResponse> getAllWarnings(
            int page,
            int size,
            String search) {

        Pageable pageable =
                PageRequest.of(page, size);

        return studentWarningRepo.searchWarnings(
                search,
                pageable
        );
    }

    public List<StudentWarning> getStudentWarnings(Long studentId) {
        return studentWarningRepo.findByStudentIdOrderByIssuedAtDesc(studentId);
    }

    @Transactional
    public void resolveComplaint(Long complaintId) {

        StudentComplaint complaint =
                studentComplaintRepo.findById(complaintId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Complaint not found"
                                )
                        );

        OffsetDateTime now =
                OffsetDateTime.now();

        complaint.setStatus("RESOLVED");
        complaint.setResolvedAt(now);
        complaint.setUpdatedAt(now);

        studentComplaintRepo.save(complaint);
    }

    public StudentVerificationResponse verifyStudent(Long studentId) {
        LocalDate discontinuedDate = LocalDate.now().minusDays(configurationService.getDaysForDiscontinue());
        StudentVerificationResponse response =
                studentRepo.verifyStudent(studentId, discontinuedDate)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Student not found: " + studentId
                                )
                        );

        long pendingCount =
                approvalRequestRepo.countPendingRequests(studentId);

        response.setPendingCount(pendingCount);

        return response;
    }








    public ComplaintCommentResponse addComplaintComment(
            Long complaintId,
            ComplaintCommentRequest request) {

        // =========================================================
        // FIND COMPLAINT
        // =========================================================

        StudentComplaint complaint = studentComplaintRepo.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        ComplaintComment comment = new ComplaintComment();

        // =========================================================
        // COMPLAINT
        // =========================================================

        comment.setComplaintId(complaint.getId());

        // =========================================================
        // COMMENT DETAILS
        // =========================================================

        comment.setComment(request.getComment());
        comment.setUserName(request.getUserName());
        comment.setRole(request.getRole());
        comment.setCreatedAt(OffsetDateTime.now());

        // =========================================================
        // AUTHOR
        // =========================================================

        if ("STUDENT".equalsIgnoreCase(request.getRole())) {

            // -----------------------------------------------------
            // STUDENT COMMENT
            // -----------------------------------------------------

            if (request.getUserId() == null) {
                throw new RuntimeException("Student user ID is required");
            }

            // For STUDENT:
            // request.userId = student's login/user ID
            //
            // In your current system this is also the student_id.
            Students student = studentRepo.findByStudentId(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("Student not found"));

            // Student → student_id
            comment.setStudentId(student.getStudentId());

            // Student must NOT use user_id
            comment.setUserId(null);

        } else {

            // -----------------------------------------------------
            // ADMIN / MANAGER COMMENT
            // -----------------------------------------------------

            if (request.getUserId() == null) {
                throw new RuntimeException("User ID is required");
            }

            User user = userRepo.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Admin / Manager → user_id
            comment.setUserId(user.getId());

            // Admin / Manager must NOT use student_id
            comment.setStudentId(null);



            // -------------------------
            // UPDATE STATUS
            // -------------------------

            String status = request.getStatus();

            if (status != null && !status.trim().isEmpty()) {

                status = status.trim().toUpperCase();

                if (!Set.of("OPEN", "IN_PROGRESS", "RESOLVED")
                        .contains(status)) {

                    throw new IllegalArgumentException(
                            "Invalid complaint status: " + status
                    );
                }

                complaint.setStatus(status);

                if ("RESOLVED".equals(status)) {
                    complaint.setResolvedAt(OffsetDateTime.now());
                }
            }
        }

        // =========================================================
        // SAVE
        // =========================================================

        ComplaintComment saved = complaintCommentRepo.save(comment);

        // =========================================================
        // RESPONSE
        // =========================================================

        return new ComplaintCommentResponse(
                saved.getComplaintId(),
                saved.getUserId(),
                saved.getStudentId(),
                saved.getUserName(),
                saved.getRole(),
                saved.getComment(),
                saved.getCreatedAt()
        );
    }
}

