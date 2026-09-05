package com.prolearner.all.repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import com.prolearner.all.dto.FullDayStrength;
import com.prolearner.all.dto.FullDayStrengthProjection;
import com.prolearner.all.dto.StrengthProjection;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.prolearner.all.entity.Seat;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {

    // Find seat by seat number
    Optional<Seat> findBySeatNumber(String seatNumber);

    // Check whether a seat number already exists
    boolean existsBySeatNumber(String seatNumber);

    Long countByStudentIdIsNotNullAndSeatNumberStartingWith(String room);

    // ====================================================
    // 🔹 RESET SEATS
    // ====================================================

        @Modifying
        @Transactional
        @Query("""
    UPDATE Seat s
    SET s.studentId = null
    """)
        void resetSeats();

    @Query(value = """
SELECT
    se.id AS seatId,
    se.seat_number AS seatNumber,
    st.student_id AS studentId,
    st.full_name AS fullName,
    st.mobile_number AS mobileNumber,
    fr.till_date AS tillDate,

    CASE
        WHEN st.id IS NULL THEN NULL
        WHEN st.enrollment_status IN ('TERMINATED','DISCONTINUED','EXPIRED')
            THEN st.enrollment_status
        WHEN fr.till_date < :discontinuedDate
            THEN 'DISCONTINUED'
        WHEN fr.till_date < CURRENT_DATE
            THEN 'EXPIRED'
        ELSE 'ACTIVE'
    END AS status,

    CASE
        WHEN se.student_id IS NULL THEN FALSE
        ELSE TRUE
    END AS occupied

FROM library.seats se
LEFT JOIN library.students st
       ON st.id = se.student_id
LEFT JOIN library.fee_records fr
       ON fr.id = st.last_fee_id
WHERE split_part(se.seat_number, '-', 1) IN (:rooms)
ORDER BY se.id
""", nativeQuery = true)
    List<FullDayStrengthProjection> getStrengthByRooms(
            @Param("rooms") List<String> rooms,
            @Param("discontinuedDate") LocalDate discontinuedDate
    );
}