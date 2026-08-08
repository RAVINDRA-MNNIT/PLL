package com.prolearner.all.repository;

import java.util.List;
import java.util.Map;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.prolearner.all.entity.ApprovalRequest;
import com.prolearner.all.enums.RequestType;
import com.prolearner.all.enums.Status;

import jakarta.transaction.Transactional;

public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, Long> {

    // ====================================================
    // 🔹 LIST BY STATUS
    // ====================================================
    List<ApprovalRequest> findByStatus(Status status);

    // ====================================================
    // 🔹 LIST BY TYPE + STATUS
    // ====================================================
    List<ApprovalRequest> findByRequestTypeAndStatus(
            RequestType requestType,
            Status status
    );

    // ====================================================
    // 🔹 ALL REQUESTS (LATEST FIRST)
    // ====================================================
    List<ApprovalRequest> findAllByOrderByRequestedAtDesc();

    // ====================================================
    // 🔹 COUNT BY TYPE (for dashboard)
    // ====================================================
    long countByRequestTypeAndStatus(
            RequestType requestType,
            Status status
    );

    // ====================================================
    // 🔹 SUM BY PAYMENT MODE (FIXED)
    // ====================================================
    @Query(value = """
        SELECT
            COALESCE(SUM(
                CASE
                    WHEN request_data->>'paymentMode' = 'CASH'
                    THEN (request_data->>'submittedAmount')::numeric
                END
            ), 0) AS totalCash,

            COALESCE(SUM(
                CASE
                    WHEN request_data->>'paymentMode' = 'ONLINE'
                    THEN (request_data->>'submittedAmount')::numeric
                END
            ), 0) AS totalOnline

        FROM library.approval_requests
        WHERE status = 'PENDING'
        AND request_type IN ('ADMISSION', 'FEES')
    """, nativeQuery = true)
    List<Object[]> sumByPaymentMode(); // ✅ FIXED RETURN TYPE


    // ====================================================
    // 🔹 CLEAR PROCESSED
    // ====================================================
    @Modifying
    @Transactional
    @Query("""
        DELETE FROM ApprovalRequest a
        WHERE a.status IN ('APPROVED','REJECTED','CANCELLED')
    """)
    void deleteProcessed();


    // ====================================================
    // 🔥 SINGLE API FOR ALL TYPES (FINAL SOLUTION)
    // ====================================================
    @Query(value = """
        SELECT
            ar.id AS request_id,

            s.id AS student_id,
            s.full_name,
            s.mobile_number,

            ar.request_type,
            ar.status,
            ar.requested_at,

            ar.request_data,

            -- Common joins
            b.batch_name,
            st.seat_number,

            -- Latest fee record only
            fr.from_date,
            fr.till_date,

            -- Extracted JSON fields
            (ar.request_data ->> 'batchId')::bigint AS batch_id,
            (ar.request_data ->> 'seatId')::bigint AS seat_id,
            (ar.request_data ->> 'membershipFrom')::date AS membership_from,
            (ar.request_data ->> 'membershipTill')::date AS membership_till,
            (ar.request_data ->> 'status') AS requested_status

        FROM library.approval_requests ar

        JOIN library.students s
            ON s.id = ar.student_id

        LEFT JOIN library.batches b
            ON b.id = (ar.request_data ->> 'batchId')::bigint

        LEFT JOIN library.seats st
            ON st.id = (ar.request_data ->> 'seatId')::bigint

        -- ✅ FIX: ONLY LATEST FEE RECORD
        LEFT JOIN LATERAL (
            SELECT *
            FROM library.fee_records fr
            WHERE fr.student_id = s.id
            ORDER BY fr.id DESC
            LIMIT 1
        ) fr ON true

        WHERE ar.request_type::text = :type
        AND ar.status::text = :status

        ORDER BY ar.requested_at DESC
    """, nativeQuery = true)
    List<Map<String, Object>> getPendingData(
            @Param("type") String type,
            @Param("status") String status
    );
}