
package com.prolearner.all.service;

import com.prolearner.all.dto.BulkIdCardResponse;
import com.prolearner.all.dto.IdCardActivityResponse;
import com.prolearner.all.dto.PrintLaterResponse;
import com.prolearner.all.dto.StudentIdCardStatusResponse;
import com.prolearner.all.entity.IdCardActivity;
import com.prolearner.all.entity.Students;
import com.prolearner.all.repository.IdCardActivityRepository;
import com.prolearner.all.repository.StudentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class IdCardActivityService {

    private final IdCardActivityRepository activityRepository;
    private final StudentRepository studentRepository;

    public IdCardActivityService(
            IdCardActivityRepository activityRepository,
            StudentRepository studentRepository) {
        this.activityRepository = activityRepository;
        this.studentRepository = studentRepository;
    }

    // =========================================================
    // GET BULK ID CARDS
    // =========================================================
    @Transactional
    public List<BulkIdCardResponse> getBulkIdCards(
            List<Long> studentIds) {

        if (studentIds == null || studentIds.isEmpty()) {
            return List.of();
        }

        List<Long> uniqueStudentIds = studentIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        List<Students> students =
                studentRepository.findAllByStudentIdIn(uniqueStudentIds);

        if (students.isEmpty()) {
            return List.of();
        }

        // Find existing shared activities using business Student IDs
        List<IdCardActivity> existingActivities =
                activityRepository.findAllByStudent_StudentIdIn(
                        uniqueStudentIds
                );

        Set<Long> existingStudentIds = existingActivities.stream()
                .map(activity -> activity.getStudent().getStudentId())
                .collect(Collectors.toSet());

        // Create activity records only for students without one
        List<IdCardActivity> newActivities = students.stream()
                .filter(student ->
                        !existingStudentIds.contains(student.getStudentId()))
                .map(student -> {
                    IdCardActivity activity = new IdCardActivity();
                    activity.setStudent(student);
                    activity.setPrintLater(false);
                    return activity;
                })
                .toList();

        if (!newActivities.isEmpty()) {
            activityRepository.saveAll(newActivities);
        }

        return students.stream()
                .map(student -> new BulkIdCardResponse(
                        student.getStudentId(),
                        student.getFullName(),
                        student.getMobileNumber(),
                        student.getDateOfAdmission()
                ))
                .toList();
    }

    // =========================================================
    // SAVE SELECTED STUDENTS FOR LATER
    // =========================================================
    @Transactional
    public List<PrintLaterResponse> saveForLaterBulk(
            List<Long> studentIds) {

        if (studentIds == null || studentIds.isEmpty()) {
            throw new IllegalArgumentException(
                    "Please provide at least one Student ID."
            );
        }

        List<Long> uniqueStudentIds = studentIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (uniqueStudentIds.isEmpty()) {
            throw new IllegalArgumentException(
                    "No valid Student IDs were provided."
            );
        }

        List<Students> students =
                studentRepository.findAllByStudentIdIn(uniqueStudentIds);

        Set<Long> foundStudentIds = students.stream()
                .map(Students::getStudentId)
                .collect(Collectors.toSet());

        List<Long> missingIds = uniqueStudentIds.stream()
                .filter(id -> !foundStudentIds.contains(id))
                .toList();

        if (!missingIds.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Students not found: " + missingIds
            );
        }

        List<IdCardActivity> existingActivities =
                activityRepository.findAllByStudent_StudentIdIn(
                        uniqueStudentIds
                );

        Map<Long, IdCardActivity> activityByStudentId =
                existingActivities.stream()
                        .collect(Collectors.toMap(
                                activity ->
                                        activity.getStudent().getStudentId(),
                                activity -> activity
                        ));

        List<IdCardActivity> activitiesToSave = new ArrayList<>();

        for (Students student : students) {

            Long businessStudentId = student.getStudentId();

            IdCardActivity activity =
                    activityByStudentId.get(businessStudentId);

            if (activity == null) {
                activity = new IdCardActivity();
                activity.setStudent(student);
            }

            activity.setPrintLater(true);
            activitiesToSave.add(activity);
        }

        activityRepository.saveAll(activitiesToSave);

        // Return all shared Print Later records
        return getPrintLaterIds();
    }

    // =========================================================
    // GET PRINT LATER IDS
    // =========================================================
    @Transactional(readOnly = true)
    public List<PrintLaterResponse> getPrintLaterIds() {

        return activityRepository
                .findByPrintLaterTrueOrderByUpdatedAtDesc()
                .stream()
                .map(activity -> new PrintLaterResponse(
                        activity.getStudent().getStudentId(),
                        activity.getPrintLater()
                ))
                .toList();
    }

    // =========================================================
    // REMOVE ONE SAVED ID
    // =========================================================
    @Transactional
    public void removeSavedStudentId(Long studentId) {

        if (studentId == null || studentId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid Student ID."
            );
        }

        int deleted =
                activityRepository.removeSavedStudentId(studentId);

        if (deleted == 0) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Student ID is not saved for later printing."
            );
        }
    }

    // =========================================================
    // DELETE ALL PRINT LATER RECORDS
    // =========================================================
    @Transactional
    public int clearAllSavedStudentIds() {
        return activityRepository.clearSavedStudentIds();
    }

    // =========================================================
    // GET ALL ACTIVITIES
    // =========================================================
    @Transactional(readOnly = true)
    public List<IdCardActivityResponse> getAllActivities() {

        return activityRepository
                .findAllByOrderByUpdatedAtDesc()
                .stream()
                .map(activity -> new IdCardActivityResponse(
                        activity.getStudent().getStudentId(),
                        activity.getPrintLater(),
                        activity.getPrintedAt(),
                        activity.getIssuedAt(),
                        activity.getCreatedAt(),
                        activity.getUpdatedAt()
                ))
                .toList();
    }

    // =========================================================
    // MARK SELECTED CARDS AS PRINTED
    // =========================================================
    @Transactional
    public Map<String, Object> markPrintedBulk(
            List<Long> studentIds) {

        List<IdCardActivity> activities =
                getRequestedActivities(studentIds);

        LocalDateTime activityNow = LocalDateTime.now();
        OffsetDateTime studentNow = OffsetDateTime.now();

        List<Long> updatedIds = new ArrayList<>();
        List<Long> skippedIds = new ArrayList<>();
        List<Students> updatedStudents = new ArrayList<>();

        for (IdCardActivity activity : activities) {

            Students student = activity.getStudent();
            Long businessStudentId = student.getStudentId();

            if (activity.getIssuedAt() != null) {
                skippedIds.add(businessStudentId);
                continue;
            }

            activity.setPrintedAt(activityNow);
            activity.setUpdatedAt(activityNow);

            student.setIdCardStatus("PRINTED");
            student.setCardPrintedAt(studentNow);

            updatedStudents.add(student);
            updatedIds.add(businessStudentId);
        }

        activityRepository.saveAll(activities);
        studentRepository.saveAll(updatedStudents);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Bulk print status processing completed.");
        result.put("updatedCount", updatedIds.size());
        result.put("updatedStudentIds", updatedIds);
        result.put("skippedStudentIds", skippedIds);

        return result;
    }

    // =========================================================
    // MARK SELECTED CARDS AS ISSUED
    // =========================================================
    @Transactional
    public Map<String, Object> markIssuedBulk(
            List<Long> studentIds) {

        List<IdCardActivity> activities =
                getRequestedActivities(studentIds);

        LocalDateTime activityNow = LocalDateTime.now();
        OffsetDateTime studentNow = OffsetDateTime.now();

        List<Long> updatedIds = new ArrayList<>();
        List<Long> skippedIds = new ArrayList<>();
        List<Students> updatedStudents = new ArrayList<>();

        for (IdCardActivity activity : activities) {

            Students student = activity.getStudent();
            Long businessStudentId = student.getStudentId();

            if (activity.getPrintedAt() == null) {
                skippedIds.add(businessStudentId);
                continue;
            }

            activity.setIssuedAt(activityNow);
            activity.setUpdatedAt(activityNow);

            student.setIdCardStatus("ISSUED");
            student.setCardIssuedAt(studentNow);

            updatedStudents.add(student);
            updatedIds.add(businessStudentId);
        }

        activityRepository.saveAll(activities);
        studentRepository.saveAll(updatedStudents);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Bulk issue status processing completed.");
        result.put("updatedCount", updatedIds.size());
        result.put("updatedStudentIds", updatedIds);
        result.put("skippedStudentIds", skippedIds);

        return result;
    }

    // =========================================================
    // DELETE SELECTED ACTIVITY RECORDS
    // =========================================================
    @Transactional
    public Map<String, Object> deleteActivitiesBulk(
            List<Long> studentIds) {

        List<IdCardActivity> activities =
                getRequestedActivities(studentIds);

        List<Long> deletedIds = activities.stream()
                .map(activity -> activity.getStudent().getStudentId())
                .toList();

        activityRepository.deleteAll(activities);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put(
                "message",
                "Selected activity records deleted successfully."
        );
        result.put("deletedCount", deletedIds.size());
        result.put("deletedStudentIds", deletedIds);

        return result;
    }

    // =========================================================
    // VALIDATE AND FETCH ACTIVITIES BY STUDENT IDs
    // =========================================================
    private List<IdCardActivity> getRequestedActivities(
            List<Long> studentIds) {

        if (studentIds == null || studentIds.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please select at least one Student ID."
            );
        }

        if (studentIds.stream().anyMatch(
                id -> id == null || id <= 0)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Student IDs must be positive numbers."
            );
        }

        List<Long> uniqueIds = studentIds.stream()
                .distinct()
                .toList();

        List<IdCardActivity> activities =
                activityRepository.findAllByStudent_StudentIdIn(uniqueIds);

        Set<Long> foundIds = activities.stream()
                .map(activity -> activity.getStudent().getStudentId())
                .collect(Collectors.toSet());

        List<Long> missingIds = uniqueIds.stream()
                .filter(id -> !foundIds.contains(id))
                .toList();

        if (!missingIds.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Activity records not found for Student IDs: " + missingIds
            );
        }

        return activities;
    }

    // =========================================================
    // GET STUDENT ID CARD STATUS
    // =========================================================
    @Transactional(readOnly = true)
    public StudentIdCardStatusResponse getStudentIdCardStatus(
            Long studentId) {

        Students student = studentRepository.findByStudentId(studentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Student not found with ID: " + studentId
                ));

        return new StudentIdCardStatusResponse(
                student.getStudentId(),
                student.getFullName(),
                student.getIdCardStatus(),
                student.getCardPrintedAt(),
                student.getCardIssuedAt()
        );
    }
}
