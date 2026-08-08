package com.prolearner.all.service;
import java.time.LocalDate;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.prolearner.all.dto.PendingAdmissionResponse;


@Service
public class AdminApprovalService {

    private final JdbcTemplate jdbcTemplate;
    private final ManagerApprovalService managerApprovalService;

    public AdminApprovalService(
            JdbcTemplate jdbcTemplate,
            ManagerApprovalService managerApprovalService) {

        this.jdbcTemplate = jdbcTemplate;
        this.managerApprovalService = managerApprovalService;
    }
    /**
     * Approve pending admission.
     */
@Transactional
public void approveAdmission(Long requestId, Long adminId) {

    // 1. Read pending request
    PendingAdmissionResponse request =
            managerApprovalService.getPendingAdmission(requestId);

    if (request == null) {
        throw new IllegalArgumentException("Pending request not found.");
    }

    // // 2. Generate Student ID
    // Long studentId = jdbcTemplate.queryForObject(
    //         "SELECT COALESCE(MAX(id),0)+1 FROM library.students",
    //         Long.class);

    // 3. Generate Fee Record ID
    // Long feeRecordId = jdbcTemplate.queryForObject(
    //         "SELECT COALESCE(MAX(id),0)+1 FROM library.fee_records",
    //         Long.class);

  LocalDate membershipTill = LocalDate.parse(request.membershipTill());

  Long seatId = null;
  LocalDate today = LocalDate.now();

String enrollmentStatus = !membershipTill.isBefore(today) ? "ACTIVE" : "EXPIRED";

if (request.seatNumber() != null &&
    !request.seatNumber().isBlank()) {

    var seatIds = jdbcTemplate.query(
        """
        SELECT id
        FROM library.seats
        WHERE seat_number = ?
        """,
        (rs, rowNum) -> rs.getLong("id"),
        request.seatNumber()
    );

    if (!seatIds.isEmpty()) {

        seatId = seatIds.get(0);

        jdbcTemplate.update(
            """
            UPDATE library.seats
            SET is_active = FALSE
            WHERE id = ?
            """,
            seatId
        );
    } else {
        throw new IllegalArgumentException(
            "Seat not found: " + request.seatNumber()
        );
    }
}

    // 5. Insert Student
Long studentId = jdbcTemplate.queryForObject(
    """
    INSERT INTO library.students(
        full_name,
        date_of_birth,
        mobile_number,
        guardian_number,
        father_name,
        local_address,
        permanent_address,
        aadhaar_number,
        qualification,
        preparation_for,
        batch_id,
        seat_id,
        membership_from,
        membership_till,
        enrollment_status,
        created_by,
        created_at
    )
    VALUES(
        ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP
    )
    RETURNING id
    """,
    Long.class,
    request.fullName(),
    java.sql.Date.valueOf(request.dateOfBirth()),
    request.mobile(),
    request.guardianNumber(),
    request.fatherName(),
    request.localAddress(),
    request.permanentAddress(),
    request.aadharNumber(),
    request.qualification(),
    request.preparationFor(),
    request.batchId(),
    seatId,
    java.sql.Date.valueOf(request.membershipFrom()),
    java.sql.Date.valueOf(request.membershipTill()),
    enrollmentStatus,
    adminId
);

    // 6. Insert Fee Record

jdbcTemplate.update("""
INSERT INTO library.fee_records(
    student_id,
    discount_amount,
    submitted_amount,
    pending_amount,
    from_date,
    till_date,
    batch_id,
    seat_id,
    created_by,
    created_at,
    payment_mode, 
    transaction_id,
    payment_remark
)
VALUES(
    ?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,
    ?::library.payment_mode,
    ?,
    ?
)
""",
studentId,
request.discount(),
request.submittedAmount(),
request.pendingAmount(),
java.sql.Date.valueOf(request.membershipFrom()),
java.sql.Date.valueOf(request.membershipTill()),
request.batchId(),
seatId,
adminId,
request.paymentMode(),
request.transactionId(),
request.paymentRemarks()
);
    // 7. Update approval_requests
jdbcTemplate.update("""
DELETE FROM library.approval_requests
WHERE id = ?
""",
requestId
);
}

    /**
     * Reject pending admission.
     */
    @Transactional
    public void rejectAdmission(
            Long requestId,
            Long adminId,
            String reason
    ) {

        int updated = jdbcTemplate.update(
                """
                UPDATE library.approval_requests
                   SET status =
                           'REJECTED'::library.approval_status,
                       reviewed_by = ?,
                       reviewed_at = CURRENT_TIMESTAMP,
                       remarks = ?
                 WHERE id = ?
                   AND request_type =
                       'ADMISSION'::library.approval_type
                   AND status =
                       'PENDING'::library.approval_status
                """,
                adminId,
                reason,
                requestId
        );

        if (updated == 0) {

            throw new IllegalArgumentException(
                    "Pending admission request not found."
            );
        }
    }
}