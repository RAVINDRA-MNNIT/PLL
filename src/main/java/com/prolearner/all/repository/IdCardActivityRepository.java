
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
    List<IdCardActivity> findByPrintLaterTrueOrderByUpdatedAtDesc();

    // =========================================================
    // GET ALL ACTIVITY RECORDS
    // =========================================================
    List<IdCardActivity> findAllByOrderByUpdatedAtDesc();

    // =========================================================
    // FIND ACTIVITIES USING BUSINESS-FACING STUDENT IDs
    // =========================================================
    List<IdCardActivity> findAllByStudent_StudentIdIn(
            List<Long> studentIds
    );

    // =========================================================
    // DELETE ONE PRINT LATER RECORD
    // =========================================================
    @Modifying
    @Query("""
        DELETE FROM IdCardActivity a
        WHERE a.student.studentId = :studentId
          AND a.printLater = true
        """)
    int removeSavedStudentId(
            @Param("studentId") Long studentId
    );

    // =========================================================
    // DELETE ALL PRINT LATER RECORDS
    // =========================================================
    @Modifying
    @Query("""
        DELETE FROM IdCardActivity a
        WHERE a.printLater = true
        """)
    int clearSavedStudentIds();
}
