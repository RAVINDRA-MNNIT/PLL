
package com.prolearner.all.repository;

import com.prolearner.all.entity.IdCardActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IdCardActivityRepository
        extends JpaRepository<IdCardActivity, Long> {

    // =========================================================
    // GET ALL PRINT LATER RECORDS
    // =========================================================
    List<IdCardActivity> findByPrintLaterTrueOrderByStudentIdAsc();

    // =========================================================
    // GET ALL ACTIVITY RECORDS
    // =========================================================
    List<IdCardActivity> findAllByOrderByStudentIdAsc();

    // =========================================================
    // FIND ACTIVITIES USING BUSINESS-FACING STUDENT IDs
    // =========================================================
    List<IdCardActivity> findAllByStudent_StudentIdIn(
            List<Long> studentIds
    );

    // =========================================================
    // REMOVE ONE STUDENT FROM PRINT LATER
    // Set printLater = false; preserve the activity record
    // =========================================================
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
    UPDATE IdCardActivity a
       SET a.printLater = false
     WHERE a.student.studentId = :studentId
       AND a.printLater = true
    """)
    int removeSavedStudentId(
            @Param("studentId") Long studentId
    );

    // =========================================================
    // CLEAR ALL PRINT LATER RECORDS
    // Set printLater = false; preserve all activity records
    // =========================================================
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
    UPDATE IdCardActivity a
       SET a.printLater = false
     WHERE a.printLater = true
    """)
    int clearSavedStudentIds();
}
