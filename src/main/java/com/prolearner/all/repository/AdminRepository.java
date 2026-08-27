package com.prolearner.all.repository;

import java.util.List;
import java.util.Collection;
import java.util.Map;

import jakarta.persistence.EnumType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.prolearner.all.entity.ApprovalRequest;
import com.prolearner.all.enums.RequestType;
import com.prolearner.all.enums.PendingRequestStatus;

import jakarta.transaction.Transactional;

public interface AdminRepository extends JpaRepository<ApprovalRequest, Long> {

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
}