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
import java.util.function.Function;
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

    @Transactional
    public List<BulkIdCardResponse> getBulkIdCards(
            List<Long> studentIds,
            Long ownerId) {

        if (studentIds == null || studentIds.isEmpty()) {
            return List.of();
        }

        if (ownerId == null) {
            throw new IllegalArgumentException(
                    "Authenticated owner ID is required."
            );
        }

        // Remove duplicate Student IDs
        List<Long> uniqueStudentIds = studentIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        // Fetch students using their business-facing Student IDs
        List<Students> students =
                studentRepository.findAllByStudentIdIn(uniqueStudentIds);

        if (students.isEmpty()) {
            return List.of();
        }

        // Find existing activities for this owner and these students
        List<Long> databaseStudentIds = students.stream()
                .map(Students::getId)
                .toList();

        List<IdCardActivity> existingActivities =
                activityRepository.findAllByOwnerIdAndStudent_IdIn(
                        ownerId,
                        databaseStudentIds
                );

        Set<Long> existingStudentIds = existingActivities.stream()
                .map(activity -> activity.getStudent().getId())
                .collect(Collectors.toSet());

        // Create activity records only for students without one
        List<IdCardActivity> newActivities = students.stream()
                .filter(student -> !existingStudentIds.contains(student.getId()))
                .map(student -> {
                    IdCardActivity activity = new IdCardActivity();
                    activity.setStudent(student);
                    activity.setOwnerId(ownerId);
                    activity.setPrintLater(false);
                    return activity;
                })
                .toList();

        if (!newActivities.isEmpty()) {
            activityRepository.saveAll(newActivities);
        }

        // Return the student details as before
        return students.stream()
                .map(student -> new BulkIdCardResponse(
                        student.getStudentId(),
                        student.getFullName(),
                        student.getMobileNumber(),
                        student.getDateOfAdmission()
                ))
                .toList();
    }

    @Transactional
    public List<PrintLaterResponse> saveForLaterBulk(
            List<Long> studentIds,
            Long ownerId) {

        if (studentIds == null || studentIds.isEmpty()) {
            throw new IllegalArgumentException(
                    "Please provide at least one Student ID."
            );
        }

        if (ownerId == null) {
            throw new IllegalArgumentException(
                    "Authenticated owner ID is required."
            );
        }

        // Remove duplicate and null IDs
        List<Long> uniqueStudentIds = studentIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (uniqueStudentIds.isEmpty()) {
            throw new IllegalArgumentException(
                    "No valid Student IDs were provided."
            );
        }

        // Fetch students
        List<Students> students =
                studentRepository.findAllById(uniqueStudentIds);

        Set<Long> foundStudentIds = students.stream()
                .map(Students::getId)
                .collect(Collectors.toSet());

        List<Long> missingIds = uniqueStudentIds.stream()
                .filter(id -> !foundStudentIds.contains(id))
                .toList();

        if (!missingIds.isEmpty()) {
            throw new IllegalArgumentException(
                    "Student IDs not found: " + missingIds
            );
        }

        // Fetch existing activities for this owner
        List<IdCardActivity> existingActivities =
                activityRepository.findAllByOwnerIdAndStudent_IdIn(
                        ownerId,
                        uniqueStudentIds
                );

        Map<Long, IdCardActivity> activityByStudentId =
                existingActivities.stream()
                        .collect(Collectors.toMap(
                                activity -> activity.getStudent().getId(),
                                Function.identity()
                        ));

        List<IdCardActivity> activitiesToSave = new ArrayList<>();

        for (Students student : students) {

            IdCardActivity activity =
                    activityByStudentId.get(student.getId());

            if (activity == null) {
                activity = new IdCardActivity();
                activity.setStudent(student);
                activity.setOwnerId(ownerId);
            }

            activity.setPrintLater(true);
            activitiesToSave.add(activity);
        }

        // Save requested IDs
        activityRepository.saveAll(activitiesToSave);

        // Return ALL saved IDs for this owner, including previously saved IDs
        return activityRepository
                .findByOwnerIdAndPrintLaterTrueOrderByUpdatedAtDesc(ownerId)
                .stream()
                .map(activity -> new PrintLaterResponse(
                        activity.getStudent().getId(),
                        activity.getPrintLater()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PrintLaterResponse> getPrintLaterIds(Long ownerId) {

        return activityRepository
                .findByOwnerIdAndPrintLaterTrueOrderByUpdatedAtDesc(ownerId)
                .stream()
                .map(activity -> new PrintLaterResponse(
                        activity.getStudent().getId(),
                        activity.getPrintLater()
                ))
                .toList();
    }

    // =========================================================
    // REMOVE ONE SAVED ID
    // =========================================================
    @Transactional
    public void removeSavedStudentId(Long studentId, Long ownerId) {
        if (studentId == null || studentId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid Student ID."
            );
        }

        int updated = activityRepository.removeSavedStudentId(
                studentId,
                ownerId
        );

        if (updated == 0) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Student ID is not saved for later printing."
            );
        }
    }

    // =========================================================
    // CLEAR ALL SAVED IDS FOR AUTHENTICATED OWNER
    // =========================================================
    @Transactional
    public int clearAllSavedStudentIds(Long ownerId) {
        return activityRepository.clearSavedStudentIds(ownerId);
    }

    @Transactional(readOnly = true)
    public List<IdCardActivityResponse> getAllActivities(Long ownerId) {

        if (ownerId == null) {
            throw new IllegalArgumentException(
                    "Authenticated owner ID is required."
            );
        }

        return activityRepository
                .findByOwnerIdOrderByUpdatedAtDesc(ownerId)
                .stream()
                .map(activity -> new IdCardActivityResponse(
                        activity.getStudent().getId(),
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
            List<Long> studentIds,
            Long ownerId) {

        List<IdCardActivity> activities =
                getRequestedActivities(studentIds, ownerId);

        LocalDateTime activityNow = LocalDateTime.now();
        OffsetDateTime studentNow = OffsetDateTime.now();
        List<Long> updatedIds = new ArrayList<>();
        List<Long> skippedIds = new ArrayList<>();

        List<Students> updatedStudents = new ArrayList<>();

        for (IdCardActivity activity : activities) {

            Students student = activity.getStudent();

            if (activity.getIssuedAt() != null) {
                // Never downgrade an already issued card.
                skippedIds.add(student.getId());
                continue;
            }

            // Update ID card activity
            activity.setPrintedAt(activityNow);
            activity.setUpdatedAt(activityNow);

            // Update student table
            student.setIdCardStatus("PRINTED");
            student.setCardPrintedAt(studentNow);

            updatedStudents.add(student);
            updatedIds.add(student.getId());
        }

        // Save both tables
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
            List<Long> studentIds,
            Long ownerId) {

        List<IdCardActivity> activities =
                getRequestedActivities(studentIds, ownerId);

        LocalDateTime activityNow = LocalDateTime.now();
        OffsetDateTime studentNow = OffsetDateTime.now();
        List<Long> updatedIds = new ArrayList<>();
        List<Long> skippedIds = new ArrayList<>();

        List<Students> updatedStudents = new ArrayList<>();

        for (IdCardActivity activity : activities) {

            Students student = activity.getStudent();

            // A card must be printed before it can be issued.
            if (activity.getPrintedAt() == null) {
                skippedIds.add(student.getId());
                continue;
            }

            // Update ID card activity
            activity.setIssuedAt(activityNow);
            activity.setUpdatedAt(activityNow);

            // Update student table
            student.setIdCardStatus("ISSUED");
            student.setCardIssuedAt(studentNow);

            updatedStudents.add(student);
            updatedIds.add(student.getId());
        }

        // Save both tables
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
            List<Long> studentIds,
            Long ownerId) {

        List<IdCardActivity> activities =
                getRequestedActivities(studentIds, ownerId);

        List<Long> deletedIds = activities.stream()
                .map(activity -> activity.getStudent().getId())
                .toList();

        activityRepository.deleteAll(activities);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Selected activity records deleted successfully.");
        result.put("deletedCount", deletedIds.size());
        result.put("deletedStudentIds", deletedIds);

        return result;
    }

    // =========================================================
// VALIDATE AND FETCH ACTIVITIES FOR CURRENT OWNER
// =========================================================
    private List<IdCardActivity> getRequestedActivities(
            List<Long> studentIds,
            Long ownerId) {

        if (ownerId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authenticated owner ID is required."
            );
        }

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
                activityRepository.findAllByOwnerIdAndStudent_IdIn(
                        ownerId,
                        uniqueIds
                );

        Set<Long> foundIds = activities.stream()
                .map(activity -> activity.getStudent().getId())
                .collect(Collectors.toSet());

        List<Long> missingIds = uniqueIds.stream()
                .filter(id -> !foundIds.contains(id))
                .toList();

        if (!missingIds.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Activity records not found for this owner: " + missingIds
            );
        }

        return activities;
    }

    public StudentIdCardStatusResponse getStudentIdCardStatus(Long studentId) {

        Students student = studentRepository.findByStudentId(studentId)
                .orElseThrow(() -> new RuntimeException(
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