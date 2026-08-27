package com.prolearner.all.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.prolearner.all.entity.FeeRecord;

@Repository
public interface FeeRecordRepository extends JpaRepository<FeeRecord, Long> {
    Optional<FeeRecord> findTopByStudentIdOrderByCreatedAtDesc(Long studentId);
    Optional<FeeRecord> findTopByStudentIdOrderByIdDesc(Long studentId);
}