package com.prolearner.all.repository;

import java.util.List;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.prolearner.all.entity.ApprovalRequest;
import com.prolearner.all.enums.RequestType;
import com.prolearner.all.enums.PendingRequestStatus;

import jakarta.transaction.Transactional;

public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, Long> {

    boolean existsByAadhaarNumber(String addhar);

    Boolean existsByRequestTypeAndStudentIdAndStatus(RequestType typeStr,
                                                     Long studentId, PendingRequestStatus status);
    // ====================================================
    // 🔹 LIST BY STATUS
    // ====================================================
    List<ApprovalRequest> findByStatus(PendingRequestStatus status);

    // ====================================================
    // 🔹 LIST BY TYPE + STATUS
    // ====================================================
    List<ApprovalRequest> findByRequestTypeAndStatus(
            RequestType requestType,
            PendingRequestStatus status
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
            PendingRequestStatus status
    );

    // ====================================================
    // 🔹 COUNT BY STATUS (for dashboard)
    // ====================================================
    Integer countByStatus(
            PendingRequestStatus status
    );

    ApprovalRequest findByStudentIdAndRequestTypeAndStatus(
            long StudentId,
            RequestType requestType,
            PendingRequestStatus status
    );

    Optional <ApprovalRequest> findByStudentId(
            long StudentId
    );

    // ====================================================
    // 🔹 SUM BY PAYMENT MODE (FIXED)
    // ====================================================
    @Query(value = """
    SELECT
        COALESCE(
            SUM(
                CASE
                    WHEN ar.payment_mode = 'CASH'
                    THEN ar.submitted_amount
                    ELSE 0
                END
            ),
            0
        ) AS totalCash,

        COALESCE(
            SUM(
                CASE
                    WHEN ar.payment_mode = 'ONLINE'
                    THEN ar.submitted_amount
                    ELSE 0
                END
            ),
            0
        ) AS totalOnline

    FROM library.approval_requests ar

    WHERE ar.status  IN ('PENDING','REJECTED')

      AND ar.request_type IN ('ADMISSION', 'FEES')

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
// 🔥 SINGLE API FOR ALL TYPES
// ====================================================

@Query(value = """
    SELECT
        -- =================================================
        -- REQUEST
        -- =================================================
        ar.id AS "requestId",
        ar.student_id AS "studentId",
        ar.request_type AS "requestType",
        ar.status AS "status",
        ar.requested_at AS "requestedAt",
        ar.requested_by AS "requestedBy",
        ar.reviewed_by AS "reviewedBy",
        ar.reviewed_at AS "reviewedAt",
        ar.cancelled_at AS "cancelledAt",
        ar.remarks AS "remarks",


        -- =================================================
        -- STUDENT
        -- =================================================

        s.full_name AS "lastFullName",
        ar.full_name AS "fullName",

        s.mobile_number AS "lastMobileNumber",
        ar.mobile_number AS "mobileNumber",

        s.guardian_number AS "lastGuardianNumber",
        ar.guardian_number AS "guardianNumber",

        s.enrollment_status AS "lastEnrollmentStatus",
        ar.enrollment_status AS "enrollmentStatus",

        s.date_of_admission AS "dateOfAdmission",


        -- =================================================
        -- PERSONAL DETAILS
        -- =================================================

        ar.date_of_birth AS "dateOfBirth",
        ar.father_name AS "fatherName",
        ar.local_address AS "localAddress",
        ar.permanent_address AS "permanentAddress",
        ar.aadhaar_number AS "aadhaarNumber",
        ar.qualification AS "qualification",
        ar.preparation_for AS "preparationFor",

        -- =================================================
        -- BATCH
        -- =================================================

        ar.batch_id AS "batchId",
        b.batch_name AS "batchName",

        -- =================================================
        -- SEAT
        -- =================================================

        ar.seat_id AS "seatId",
        st.seat_number AS "seatNumber",


        -- =================================================
        -- NEW MEMBERSHIP
        -- =================================================

        ar.from_date AS "fromDate",
        ar.till_date AS "tillDate",


        -- =================================================
        -- PENDING REQUEST PAYMENT
        -- =================================================

        ar.submitted_amount AS "submittedAmount",
        ar.discount AS "discount",
        ar.pending_amount AS "pendingAmount",
        ar.payment_mode AS "paymentMode",
        ar.transaction_id AS "transactionId",
        ar.remarks AS "remarks",


        -- =================================================
        -- LAST FEE RECORD
        -- =================================================

        last_fee.id AS "lastFeeId",
        last_fee.student_id AS "lastFeeStudentId",
        last_fee.discount_amount AS "lastFeeDiscountAmount",
        last_fee.submitted_amount AS "lastFeeSubmittedAmount",
        last_fee.pending_amount AS "lastFeePendingAmount",
        last_fee.from_date AS "lastFeeFromDate",
        last_fee.till_date AS "lastFeeTillDate",
        last_fee.batch_id AS "lastFeeBatchId",
        last_fee.seat_id AS "lastFeeSeatId",
        last_fee.seat_number AS "lastFeeSeatNumber",
        last_fee.created_by AS "lastFeeCreatedBy",
        last_fee.created_at AS "lastFeeCreatedAt",
        last_fee.payment_mode AS "lastFeePaymentMode",
        last_fee.transaction_id AS "lastFeeTransactionId",
        last_fee.remarks AS "lastFeeRemarks"

    FROM library.approval_requests ar


    -- =====================================================
    -- STUDENT
    -- =====================================================

    LEFT JOIN library.students s
        ON s.id = ar.student_id


    -- =====================================================
    -- BATCH
    -- =====================================================

    LEFT JOIN library.batches b
        ON b.id = ar.batch_id


    -- =====================================================
    -- SEAT
    -- =====================================================

    LEFT JOIN library.seats st
        ON st.id = ar.seat_id


    -- =====================================================
    -- LAST FEE RECORD OF THIS STUDENT
    -- =====================================================

    LEFT JOIN LATERAL (
        SELECT
            fr.*,
            s.seat_number
        FROM library.fee_records fr
        LEFT JOIN library.seats s
            ON s.id = fr.seat_id
        WHERE fr.student_id = ar.student_id
        ORDER BY fr.created_at DESC, fr.id DESC
        LIMIT 1
    ) last_fee ON true


    -- =====================================================
    -- FILTER
    -- =====================================================

    WHERE ar.request_type::text = :type
        AND ar.status::text IN (:statuses)
                        

    -- =====================================================
    -- ORDER
    -- =====================================================

    ORDER BY ar.requested_at DESC

    """, nativeQuery = true)
List<Map<String, Object>> getPendingData(
        @Param("type") String type,
        @Param("statuses") List<String> statuses
);



@Query(value = """
SELECT
    ar.id AS "requestId",
    ar.student_id AS "studentId",
    ar.request_type AS "requestType",
    ar.status,
    ar.remarks,
    concat_ws('\n',
        CASE WHEN ar.full_name IS NOT NULL THEN 'Full Name: ' || ar.full_name END,
        CASE WHEN ar.date_of_birth IS NOT NULL THEN 'Date of Birth: ' || ar.date_of_birth END,
        CASE WHEN ar.mobile_number IS NOT NULL THEN 'Mobile Number: ' || ar.mobile_number END,
        CASE WHEN ar.guardian_number IS NOT NULL THEN 'Guardian Number: ' || ar.guardian_number END,
        CASE WHEN ar.father_name IS NOT NULL THEN 'Father Name: ' || ar.father_name END,
        CASE WHEN ar.local_address IS NOT NULL THEN 'Local Address: ' || ar.local_address END,
        CASE WHEN ar.permanent_address IS NOT NULL THEN 'Permanent Address: ' || ar.permanent_address END,
        CASE WHEN ar.aadhaar_number IS NOT NULL THEN 'Aadhaar Number: ' || ar.aadhaar_number END,
        CASE WHEN ar.qualification IS NOT NULL THEN 'Qualification: ' || ar.qualification END,
        CASE WHEN ar.preparation_for IS NOT NULL THEN 'Preparation For: ' || ar.preparation_for END,
        CASE WHEN ar.batch_id IS NOT NULL THEN 'Batch Id: ' || ar.batch_id END,
        CASE WHEN ar.seat_id IS NOT NULL THEN 'Seat Id: ' || ar.seat_id END,
        CASE WHEN ar.from_date IS NOT NULL THEN 'From Date: ' || ar.from_date END,
        CASE WHEN ar.till_date IS NOT NULL THEN 'Till Date: ' || ar.till_date END,
        CASE WHEN ar.submitted_amount IS NOT NULL THEN 'Submitted Amount: ' || ar.submitted_amount END,
        CASE WHEN ar.discount IS NOT NULL THEN 'Discount: ' || ar.discount END,
        CASE WHEN ar.pending_amount IS NOT NULL THEN 'Pending Amount: ' || ar.pending_amount END,
        CASE WHEN ar.payment_mode IS NOT NULL THEN 'Payment Mode: ' || ar.payment_mode END,
        CASE WHEN ar.transaction_id IS NOT NULL THEN 'Transaction Id: ' || ar.transaction_id END,
        CASE WHEN ar.enrollment_status IS NOT NULL THEN 'Enrollment Status: ' || ar.enrollment_status END
    ) AS "requestData",
    ar.requested_at AS "requestedAt"
FROM library.approval_requests ar
WHERE ar.status IN ('APPROVED', 'CANCELLED', 'REJECTED')
ORDER BY ar.requested_at DESC;
""", nativeQuery = true)
List<Map<String, Object>> fetchNonPending();

    // =========================================================
    // FIND MIN REUSABLE STUDENT ID
    //
    // Only CANCELLED / REJECTED ADMISSION requests
    // =========================================================

    @Query("""
        SELECT MIN(a.studentId)
        FROM ApprovalRequest a
        WHERE a.requestType = :type
          AND a.status IN :statuses
          AND a.studentId IS NOT NULL
    """)
    Long findMinStudentIdByStatus(
            @Param("type") RequestType type,
            @Param("statuses") Collection<PendingRequestStatus> statuses
    );


    // =========================================================
    // FIND MAX STUDENT ID FOR REQUEST TYPE
    // =========================================================

    @Query("""
        SELECT MAX(a.studentId)
        FROM ApprovalRequest a
        WHERE a.requestType = :type
          AND a.studentId IS NOT NULL
    """)
    Long findMaxStudentIdByType(
            @Param("type") RequestType type
    );


    // =========================================================
    // DELETE OLD CANCELLED / REJECTED REQUEST
    // AFTER NEW REQUEST IS SUCCESSFULLY CREATED
    // =========================================================
    @Transactional
    @Modifying
    @Query("""
        DELETE FROM ApprovalRequest a
        WHERE a.requestType = :type
          AND a.status IN :statuses
          AND a.studentId = :studentId
    """)
    int deleteOldAdmissionRequest(
            @Param("type") RequestType type,
            @Param("statuses") Collection<PendingRequestStatus> statuses,
            @Param("studentId") Long studentId
    );

    @Modifying
    @Transactional
    @Query("""
        DELETE FROM ApprovalRequest a
        WHERE NOT (
            a.status = com.prolearner.all.enums.PendingRequestStatus.PENDING
            OR (a.status = com.prolearner.all.enums.PendingRequestStatus.REJECTED
                AND a.requestType IN (
                    com.prolearner.all.enums.RequestType.FEES,
                    com.prolearner.all.enums.RequestType.ADMISSION
                ))
            OR (a.status = com.prolearner.all.enums.PendingRequestStatus.CANCELLED
                AND a.requestType = com.prolearner.all.enums.RequestType.ADMISSION)
        )
        """)
    void clearProcessedApprovalRequests();
}