package com.prolearner.all.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import com.prolearner.all.dto.*;
import com.prolearner.all.entity.FeeRecord;
import com.prolearner.all.entity.Students;
import com.prolearner.all.enums.EnrollmentStatus;
import com.prolearner.all.repository.FeeRecordRepository;
import com.prolearner.all.repository.SeatRepository;
import com.prolearner.all.repository.StudentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;


@Service
public class StudentService {

    private final StudentRepository studentRepo;
    private final FeeRecordRepository feeRecordRepo;
    private final ConfigurationService configurationService;
    private final SeatRepository seatRepo;


    public StudentService(StudentRepository studentRepo,
                          FeeRecordRepository feeRecordRepo,
                          ConfigurationService configurationService, SeatRepository seatRepo) {
        this.studentRepo = studentRepo;
        this.feeRecordRepo = feeRecordRepo;
        this.configurationService = configurationService;
        this.seatRepo = seatRepo;
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
                        s.getStatus()
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

    public ShiftStrengthResponse getRoom2Strength() {

        LocalDate discontinuedDate =
                LocalDate.now().minusDays(
                        configurationService.getDaysForDiscontinue()
                );

        List<Room2StrengthProjection> rows =
                studentRepo.getStrengthByCategories(
                        List.of("5 HOURS", "6 HOURS"),
                        List.of("ACTIVE", "EXPIRED"),
                        discontinuedDate
                );
        long fullDayCount = getStrength(List.of("R2")).occupied();

        List<StrengthCount> firstShift = new ArrayList<>();
        List<StrengthCount> secondShift = new ArrayList<>();
        List<StrengthCount> thirdShift = new ArrayList<>();

        for (Room2StrengthProjection row : rows) {

            StrengthCount strength =
                    new StrengthCount(
                            row.getBatchName(),
                            row.getCount()
                    );

            switch (row.getBatchName()) {

                case "1 (6 HRS)" -> firstShift.add(strength);

                case "2 (5 HRS)" -> secondShift.add(strength);

                case "3 (5 HRS)" -> thirdShift.add(strength);

                case "1 & 2" -> {
                    firstShift.add(strength);
                    secondShift.add(strength);
                }

                case "1 & 3" -> {
                    firstShift.add(strength);
                    thirdShift.add(strength);
                }

                case "2 & 3" -> {
                    secondShift.add(strength);
                    thirdShift.add(strength);
                }
            }
        }
        StrengthCount fullDay = new StrengthCount(
                "Full Day",
                fullDayCount
        );

        firstShift.add(fullDay);
        secondShift.add(fullDay);
        thirdShift.add(fullDay);

        return new ShiftStrengthResponse(
                firstShift,
                secondShift,
                thirdShift,
                List.of()
        );
    }

    public ShiftStrengthResponse getRoom3Strength() {

        LocalDate discontinuedDate =
                LocalDate.now().minusDays(
                        configurationService.getDaysForDiscontinue()
                );

        List<Room2StrengthProjection> rows =
                studentRepo.getStrengthByCategories(
                        List.of("4 HOURS", "8 HOURS"),
                        List.of("ACTIVE", "EXPIRED"),
                        discontinuedDate
                );

        long fullDayCount = getStrength(List.of("R3")).occupied();

        List<StrengthCount> firstShift = new ArrayList<>();
        List<StrengthCount> secondShift = new ArrayList<>();
        List<StrengthCount> thirdShift = new ArrayList<>();
        List<StrengthCount> fourthShift = new ArrayList<>();

        for (Room2StrengthProjection row : rows) {

            StrengthCount strength =
                    new StrengthCount(
                            row.getBatchName(),
                            row.getCount()
                    );

            switch (row.getBatchName()) {

                case "1 (4 HRS)" ->
                        firstShift.add(strength);

                case "2 (4 HRS)" ->
                        secondShift.add(strength);

                case "3 (4 HRS)" ->
                        thirdShift.add(strength);

                case "4 (4 HRS)" ->
                        fourthShift.add(strength);

                case "1 (8 HRS)",
                     "(1 & 2) - 8 HRS" -> {
                    firstShift.add(strength);
                    secondShift.add(strength);
                }

                case "2 (8 HRS)" -> {
                    thirdShift.add(strength);
                    fourthShift.add(strength);
                }

                case "(1 & 3) - 4 HRS" -> {
                    firstShift.add(strength);
                    thirdShift.add(strength);
                }

                case "(1 & 4) - 4 HRS" -> {
                    firstShift.add(strength);
                    fourthShift.add(strength);
                }

                case "(2 & 3) - 4 HRS" -> {
                    secondShift.add(strength);
                    thirdShift.add(strength);
                }

                case "(2 & 4) - 4 HRS" -> {
                    secondShift.add(strength);
                    fourthShift.add(strength);
                }
            }
        }

        StrengthCount fullDay = new StrengthCount(
                "Full Day",
                fullDayCount
        );

        firstShift.add(fullDay);
        secondShift.add(fullDay);
        thirdShift.add(fullDay);
        fourthShift.add(fullDay);

        return new ShiftStrengthResponse(
                firstShift,
                secondShift,
                thirdShift,
                fourthShift
        );
    }
}

