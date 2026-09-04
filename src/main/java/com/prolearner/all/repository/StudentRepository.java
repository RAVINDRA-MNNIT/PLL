package com.prolearner.all.repository;

import com.prolearner.all.dto.Room2StrengthProjection;
import com.prolearner.all.dto.StrengthProjection;
import com.prolearner.all.dto.StudentListItem;
import com.prolearner.all.entity.Seat;
import com.prolearner.all.entity.Students;
import com.prolearner.all.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Students,Long> {

    @Query("SELECT MAX(s.studentId) FROM Students s")
    Long findMaxId();

    boolean existsByAadhaarNumber(String addhar);

    Optional<Students> findByStudentId(Long studentId);

    @Query("""
SELECT new com.prolearner.all.dto.StudentListItem(
    s.studentId,
    s.fullName,
    s.mobileNumber,
    b.id,
    b.batchName,
    seat.id,
    seat.seatNumber,
    fr.submittedAmount,
    fr.discountAmount,
    fr.pendingAmount,
    fr.paymentMode,
    fr.transactionId,
    fr.remarks,
    fr.fromDate,
    fr.tillDate,
    CASE
        WHEN s.enrollmentStatus IN ('TERMINATED','DISCONTINUED','EXPIRED')
            THEN s.enrollmentStatus
        WHEN fr.tillDate < :discontinuedDate
            THEN 'DISCONTINUED'
        WHEN fr.tillDate < CURRENT_DATE
            THEN 'EXPIRED'
        ELSE 'ACTIVE'
    END
)
FROM Students s
LEFT JOIN s.lastFee fr
LEFT JOIN fr.batch b
LEFT JOIN fr.seat seat
WHERE
(
    COALESCE(:search, '') = ''

    OR (
        :searchBy = 'name'
        AND LOWER(s.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
    )

    OR (
        :searchBy = 'mobile'
        AND s.mobileNumber LIKE CONCAT('%', :search, '%')
    )

    OR (
        :searchBy = 'id'
        AND CAST(s.studentId AS string) = :search
    )

    OR (
        :searchBy = 'seat'
        AND CAST(seat.seatNumber AS string) LIKE CONCAT('%', :search, '%')
    )

    OR (
        COALESCE(:searchBy, 'all') = 'all'
        AND (
            LOWER(s.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
            OR s.mobileNumber LIKE CONCAT('%', :search, '%')
            OR CAST(s.studentId AS string) LIKE CONCAT('%', :search, '%')
            OR CAST(seat.id AS string) LIKE CONCAT('%', :search, '%')
        )
    )
)
AND (
    :batchId IS NULL
    OR b.id = :batchId
)
AND (
    :enrollmentStatus IS NULL
    OR :enrollmentStatus = ''
    OR :enrollmentStatus = 'all'
    OR (
        CASE
            WHEN s.enrollmentStatus IN ('TERMINATED','DISCONTINUED','EXPIRED')
                THEN s.enrollmentStatus
            WHEN fr.tillDate < :discontinuedDate
                THEN 'DISCONTINUED'
            WHEN fr.tillDate < CURRENT_DATE
                THEN 'EXPIRED'
            ELSE 'ACTIVE'
        END
    ) = :enrollmentStatus
)
ORDER BY s.studentId DESC
""")
    Page<StudentListItem> findStudents(
            @Param("searchBy") String searchBy,
            @Param("search") String search,
            @Param("batchId") Long batchId,
            @Param("enrollmentStatus") String enrollmentStatus,
            @Param("discontinuedDate") LocalDate discontinuedDate,
            Pageable pageable
    );

    @Query(value = """
SELECT
    b.id AS batchId,
    b.batch_name AS batchName,
    b.room AS room,
    COUNT(s.id) AS studentCount
FROM library.batches b
LEFT JOIN library.fee_records fr
    ON fr.batch_id = b.id
LEFT JOIN library.students s
    ON s.last_fee_id = fr.id
WHERE (
    :statuses IS NULL
    OR (
        CASE
            WHEN s.enrollment_status IN ('TERMINATED','DISCONTINUED','EXPIRED')
                THEN s.enrollment_status
            WHEN fr.till_date < :discontinuedDate
                THEN 'DISCONTINUED'
            WHEN fr.till_date < CURRENT_DATE
                THEN 'EXPIRED'
            ELSE 'ACTIVE'
        END
    ) IN (:statuses)
)
GROUP BY
    b.id,
    b.batch_name,
    b.room
ORDER BY
    b.room,
    b.batch_name
""", nativeQuery = true)
    List<StrengthProjection> getBatchWiseStrength(
            @Param("statuses") List<String> statuses,
            @Param("discontinuedDate") LocalDate discontinuedDate
    );

    @Query(value = """
SELECT
    b.batch_name AS batchName,
    b.category AS category,
    COUNT(*) AS count
FROM library.students s

JOIN library.fee_records fr
     ON fr.id = s.last_fee_id

JOIN library.batches b
     ON b.id = fr.batch_id

WHERE
    b.category IN (:categories)
    AND (
        :statuses IS NULL
        OR (
            CASE
                WHEN s.enrollment_status IN ('TERMINATED','DISCONTINUED','EXPIRED')
                    THEN s.enrollment_status
                WHEN fr.till_date < :discontinuedDate
                    THEN 'DISCONTINUED'
                WHEN fr.till_date < CURRENT_DATE
                    THEN 'EXPIRED'
                ELSE 'ACTIVE'
            END
        ) IN (:statuses)
    )

GROUP BY
    b.id,
    b.batch_name,
    b.category

ORDER BY
    b.id
""", nativeQuery = true)
    List<Room2StrengthProjection> getStrengthByCategories(
            @Param("categories") List<String> categories,
            @Param("statuses") List<String> statuses,
            @Param("discontinuedDate") LocalDate discontinuedDate
    );
}
