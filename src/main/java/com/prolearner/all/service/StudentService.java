package com.prolearner.all.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.prolearner.all.dto.*;
import com.prolearner.all.entity.FeeRecord;
import com.prolearner.all.entity.StudentComplaint;
import com.prolearner.all.entity.StudentWarning;
import com.prolearner.all.entity.Students;
import com.prolearner.all.enums.EnrollmentStatus;
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


    public StudentService(StudentRepository studentRepo,
                          FeeRecordRepository feeRecordRepo,
                          ConfigurationService configurationService, SeatRepository seatRepo, StudentWarningRepository studentWarningRepo, StudentComplaintRepository studentComplaintRepo, SeatService seatService) {
        this.studentRepo = studentRepo;
        this.feeRecordRepo = feeRecordRepo;
        this.configurationService = configurationService;
        this.seatRepo = seatRepo;
        this.studentWarningRepo = studentWarningRepo;
        this.studentComplaintRepo = studentComplaintRepo;
        this.seatService = seatService;
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
        List<StudentWarning> warnings = studentWarningRepo.findByStudentIdOrderByIssuedAtDesc(studentId);
        List<StudentComplaint> complaints = studentComplaintRepo.findByStudentIdOrderBySubmittedAtDesc(studentId);
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
                student.getAllowedDiscount(),
                student.getTerminationCount(),
                warnings,
                complaints,
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

    public void deleteComplaint(Long complaintId) {

        if (!studentComplaintRepo.existsById(complaintId)) {
            throw new RuntimeException("Complaint not found");
        }

        studentComplaintRepo.deleteById(complaintId);
    }

    public Page<StudentComplaintResponse> getAllComplaints(
            int page,
            int size,
            String search) {

        Pageable pageable =
                PageRequest.of(page, size);

        return studentComplaintRepo.searchComplaints(
                search,
                pageable
        );
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
}

