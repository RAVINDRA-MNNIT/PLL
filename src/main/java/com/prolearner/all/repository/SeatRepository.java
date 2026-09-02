package com.prolearner.all.repository;
import java.util.Optional;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.prolearner.all.entity.Seat;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {

    // Find seat by seat number
    Optional<Seat> findBySeatNumber(String seatNumber);

    // Check whether a seat number already exists
    boolean existsBySeatNumber(String seatNumber);

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
}