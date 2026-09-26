package com.prolearner.all.repository;

import com.prolearner.all.dto.StudentWarningResponse;
import com.prolearner.all.entity.StudentWarning;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StudentWarningRepository
        extends JpaRepository<StudentWarning, Long> {

    List<StudentWarning> findByStudentIdOrderByIssuedAtDesc(Long studentId);
    List<StudentWarning> findByStudentIdAndWarningLevel(
            Long studentId,
            String warningLevel
    );
    @Query("""
    SELECT new com.prolearner.all.dto.StudentWarningResponse(
        w.id,
        w.studentId,
        s.fullName,
        s.mobileNumber,
        w.warningLevel,
        w.category,
        w.description,
        w.actionTaken,
        w.issuedBy,
        w.issuedByName,
        w.issuedAt,
        w.cancelledAt,
        w.cancellationReason,
        w.createdAt,
        w.updatedAt
    )
    FROM StudentWarning w
    JOIN Students s
        ON s.studentId = w.studentId
    WHERE
        :search IS NULL
        OR :search = ''
        OR CAST(w.studentId AS string) LIKE
            CONCAT('%', :search, '%')
        OR LOWER(s.fullName) LIKE
            LOWER(CONCAT('%', :search, '%'))
    ORDER BY w.issuedAt DESC
""")
    Page<StudentWarningResponse> searchWarnings(
            @Param("search") String search,
            Pageable pageable
    );
}