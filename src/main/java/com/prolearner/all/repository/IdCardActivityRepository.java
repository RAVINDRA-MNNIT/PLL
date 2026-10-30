package com.prolearner.all.repository;
import com.prolearner.all.entity.IdCardActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface IdCardActivityRepository
        extends JpaRepository<IdCardActivity, Long> {

    // Find a student's activity record for a particular owner
    Optional<IdCardActivity> findByStudent_IdAndOwnerId(
            Long studentId,
            Long ownerId
    );

    // Get all Print Later records for an owner
    List<IdCardActivity> findByOwnerIdAndPrintLaterTrueOrderByUpdatedAtDesc(
            Long ownerId
    );

    // Check whether the student already has a record for this owner
    boolean existsByStudent_IdAndOwnerId(
            Long studentId,
            Long ownerId
    );

    // Get all ID card activity records belonging to an owner
    List<IdCardActivity> findByOwnerId(Long ownerId);

    // Delete one owner's Print Later record for a student
    void deleteByStudent_IdAndOwnerId(
            Long studentId,
            Long ownerId
    );

    List<IdCardActivity> findAllByOwnerIdAndStudent_IdIn(Long ownerId, List<Long> uniqueStudentIds);
    List<IdCardActivity> findByOwnerIdOrderByUpdatedAtDesc(Long ownerId);

    @Modifying
    @Query("""
        UPDATE IdCardActivity a
        SET a.printLater = false
        WHERE a.student.id = :studentId
          AND a.ownerId = :ownerId
          AND a.printLater = true
        """)
    int removeSavedStudentId(
            @Param("studentId") Long studentId,
            @Param("ownerId") Long ownerId
    );

    @Modifying
    @Query("""
        UPDATE IdCardActivity a
        SET a.printLater = false
        WHERE a.ownerId = :ownerId
          AND a.printLater = true
        """)
    int clearSavedStudentIds(
            @Param("ownerId") Long ownerId
    );

    List<IdCardActivity> findAllByOwnerIdAndStudent_IdIn(
            Long ownerId,
            Collection<Long> studentIds
    );

    void deleteAllByOwnerIdAndStudent_IdIn(
            Long ownerId,
            Collection<Long> studentIds
    );
}