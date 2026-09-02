package com.prolearner.all.repository;

import java.util.List;
import java.util.Optional;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.prolearner.all.entity.FeeRecord;

@Repository
public interface FeeRecordRepository extends JpaRepository<FeeRecord, Long> {
    Optional<FeeRecord> findTopByStudentIdOrderByCreatedAtDesc(Long studentId);
    Optional<FeeRecord> findTopByStudentIdOrderByIdDesc(Long studentId);
    List<FeeRecord> findByStudentIdOrderByIdDesc(Long studentId);

    // ====================================================
// 🔹 CLEAR FEE RECORDS
// ====================================================
    @Modifying
    @Transactional
    @Query(value = """
    DELETE FROM library.fee_records fr
    WHERE fr.id NOT IN (
        SELECT MIN(id)
        FROM library.fee_records
        GROUP BY student_id
    )
    AND fr.id NOT IN (
        SELECT MAX(id)
        FROM library.fee_records
        GROUP BY student_id
    )
    """, nativeQuery = true)
    void clearFeeRecords();
}