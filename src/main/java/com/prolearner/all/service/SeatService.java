package com.prolearner.all.service;
import com.prolearner.all.entity.Seat;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import com.prolearner.all.repository.SeatRepository;
import org.springframework.transaction.annotation.Transactional;


@Service
@AllArgsConstructor
public class SeatService {

    private final SeatRepository seatRepo;

    // =========================================================
    // UDATE SEAT REQUEST
    // =========================================================

    @Transactional
    public void updateSeat(Long previousSeatId, Long newSeatId, Long studentId) {
        removeReservedSeat(previousSeatId);

        if (newSeatId == null) {
            return;
        }

        Seat seat = seatRepo.findById(newSeatId)
                .orElseThrow(() -> new RuntimeException("Seat not found!"));

        if (!Boolean.TRUE.equals(seat.getIsActive())) {
            throw new RuntimeException("Selected seat is inactive!");
        }

        if (seat.getStudentId() != null &&
            !seat.getStudentId().equals(studentId)) {
            throw new RuntimeException("Selected seat is already occupied!");
        }

        seat.setStudentId(studentId);
        seatRepo.save(seat);
    }

    // =========================================================
    // REMOVE SEAT REQUEST
    // =========================================================

    @Transactional
    public void removeReservedSeat(Long seatId) {
        if (seatId == null) {
            return;
        }

        Seat seat = seatRepo.findById(seatId)
                .orElseThrow(() -> new RuntimeException("Seat not found!"));

        seat.setStudentId(null);
        seatRepo.save(seat);
    }

    // ====================================================
    // 🔹 RESET SEATS
    // ====================================================

    @Transactional
    public void resetSeats() {
        seatRepo.resetSeats();
    }
}

