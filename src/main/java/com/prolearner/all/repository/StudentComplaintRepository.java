package com.prolearner.all.repository;

import com.prolearner.all.dto.StudentComplaintResponse;
import com.prolearner.all.entity.StudentComplaint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StudentComplaintRepository
        extends JpaRepository<StudentComplaint, Long> {

    List<StudentComplaint> findByStudentIdOrderBySubmittedAtDesc(Long studentId);

    @Query("""
    SELECT new com.prolearner.all.dto.StudentComplaintResponse(
        c.id,
        c.studentId,
        s.fullName,
        s.mobileNumber,
        c.category,
        c.description,
        c.status,
        c.resolution,
        c.submittedAt,
        c.resolvedAt,
        c.closedAt,
        c.createdAt,
        c.updatedAt
    )
    FROM StudentComplaint c
    JOIN Students s
        ON s.studentId = c.studentId
    WHERE
        :search IS NULL
        OR :search = ''
        OR CAST(c.studentId AS string) LIKE
            CONCAT('%', :search, '%')
        OR LOWER(s.fullName) LIKE
            LOWER(CONCAT('%', :search, '%'))
    ORDER BY c.submittedAt DESC
""")
    Page<StudentComplaintResponse> searchComplaints(
            @Param("search") String search,
            Pageable pageable
    );
}