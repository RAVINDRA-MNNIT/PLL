package com.prolearner.all.service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prolearner.all.dto.MemberApplicationRequest;
import com.prolearner.all.dto.PendingAdmissionResponse;
import com.prolearner.all.dto.PendingCollectionSummaryResponse;
import com.prolearner.all.dto.PendingFeeResponse;

@Service
public class ManagerApprovalService {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public ManagerApprovalService(
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper
    ) {
        this.jdbcTemplate = jdbcTemplate;      // ✅ Correct
        this.objectMapper = objectMapper;      // ✅ Correct
    }
    /**
     * Returns all pending admission requests.
     */
 public List<PendingAdmissionResponse> getPendingAdmissions() {

   String sql = """
        SELECT
            ar.id AS request_id,
            ar.student_id AS student_id,

            ar.request_data ->> 'fullName' AS full_name,
            ar.request_data ->> 'dateOfBirth' AS date_of_birth,
            ar.request_data ->> 'mobile' AS mobile,
            ar.request_data ->> 'guardianNumber' AS guardian_number,
            ar.request_data ->> 'fatherName' AS father_name,
            ar.request_data ->> 'localAddress' AS local_address,
            ar.request_data ->> 'permanentAddress' AS permanent_address,
            ar.request_data ->> 'aadharNumber' AS aadhar_number,
            ar.request_data ->> 'qualification' AS qualification,
            ar.request_data ->> 'preparationFor' AS preparation_for,

            (ar.request_data ->> 'batchId')::bigint AS batch_id,

            b.batch_name,

            ar.request_data ->> 'membershipFrom' AS membership_from,
            ar.request_data ->> 'membershipTill' AS membership_till,
          
            ar.request_data ->> 'seatNumber' AS seat_number,
            ar.request_data ->> 'paymentMode' AS payment_mode,
            ar.request_data ->> 'transactionId' AS transaction_id,
            ar.request_data ->> 'paymentRemarks' AS payment_remarks,

            COALESCE(
                (ar.request_data ->> 'discount')::numeric,
                0
            ) AS discount,

            COALESCE(
                (ar.request_data ->> 'submittedAmount')::numeric,
                0
            ) AS submitted_amount,

            COALESCE(
                (ar.request_data ->> 'pendingAmount')::numeric,
                0
            ) AS pending_amount,

            ar.status::text AS status,

            ar.requested_at

        FROM library.approval_requests ar

        LEFT JOIN library.batches b
            ON b.id = (ar.request_data ->> 'batchId')::bigint

        WHERE ar.request_type =
              'ADMISSION'::library.approval_type
          AND ar.status =
              'PENDING'::library.approval_status

        ORDER BY ar.requested_at DESC
        """;

    return jdbcTemplate.query(
            sql,
            this::mapPendingAdmission
    );
}

    /**
     * Maps one row into PendingAdmissionResponse.
     */
 private PendingAdmissionResponse mapPendingAdmission(
        ResultSet rs,
        int rowNum
) throws SQLException {

    OffsetDateTime requestedAt = null;

    if (rs.getObject("requested_at") != null) {
        requestedAt = rs.getObject(
                "requested_at",
                OffsetDateTime.class
        );
    }

return new PendingAdmissionResponse(

    rs.getLong("request_id"),
    rs.getLong("student_id"),
    rs.getString("full_name"),
    rs.getString("date_of_birth"),
    rs.getString("mobile"),
    rs.getString("guardian_number"),
    rs.getString("father_name"),
    rs.getString("local_address"),
    rs.getString("permanent_address"),
    rs.getString("aadhar_number"),
    rs.getString("qualification"),
    rs.getString("preparation_for"),
    rs.getLong("batch_id"),
    rs.getString("batch_name"),
    rs.getString("membership_from"),
    rs.getString("membership_till"),
    rs.getBigDecimal("discount"),
    rs.getBigDecimal("submitted_amount"),
    rs.getBigDecimal("pending_amount"),
    rs.getString("status"),
    requestedAt,

    rs.getString("seat_number"),
    rs.getString("payment_mode"),
    rs.getString("transaction_id"),
    rs.getString("payment_remarks")
);
}
/**
 * Returns all pending fee requests.
 */
public List<PendingFeeResponse> getPendingFees() {

String sql = """
SELECT
    ar.id AS request_id,

    s.id AS student_id,
    s.full_name,
    s.mobile_number AS mobile,

    (ar.request_data ->> 'batchId')::bigint
        AS batch_id,

    b.batch_name,

    (ar.request_data ->> 'seatId')::bigint
        AS seat_id,

    st.seat_number,

    -- Current membership from fee_records
    fr.from_date AS from_date,
    fr.till_date AS till_date,

    -- Requested membership
    (ar.request_data ->> 'membershipFrom')::date
        AS membership_from,

    (ar.request_data ->> 'membershipTill')::date
        AS membership_till,

    COALESCE(
        (ar.request_data ->> 'submittedAmount')::numeric,
        0
    ) AS submitted_amount,

    COALESCE(
        (ar.request_data ->> 'discount')::numeric,
        0
    ) AS discount,

    COALESCE(
        (ar.request_data ->> 'pendingAmount')::numeric,
        0
    ) AS pending_amount,

    ar.request_data ->> 'paymentMode'
        AS payment_mode,

    ar.request_data ->> 'transactionId'
        AS transaction_id,

    ar.request_data ->> 'paymentRemark'
        AS payment_remark,

    u.full_name AS requested_by,

    ar.requested_at,

    ar.status::text AS status

FROM library.approval_requests ar

JOIN library.students s
    ON s.id = ar.student_id

LEFT JOIN library.batches b
    ON b.id = (ar.request_data ->> 'batchId')::bigint

LEFT JOIN library.seats st
    ON st.id = (ar.request_data ->> 'seatId')::bigint

LEFT JOIN library.users u
    ON u.id = ar.requested_by

LEFT JOIN library.fee_records fr
    ON fr.student_id = s.id

WHERE ar.request_type =
      'FEES'::library.approval_type

  AND ar.status =
      'PENDING'::library.approval_status

ORDER BY ar.requested_at DESC;
""";

    return jdbcTemplate.query(
            sql,
            this::mapPendingFee
    );
}

/**
 * Maps one row into PendingFeeResponse.
 */
private PendingFeeResponse mapPendingFee(
        ResultSet rs,
        int rowNum
) throws SQLException {

    return new PendingFeeResponse(

            rs.getLong("request_id"),

            rs.getLong("student_id"),

            rs.getString("full_name"),

            rs.getLong("batch_id"),

            rs.getString("batch_name"),

            rs.getLong("seat_id"),

            rs.getObject(
                    "from_date",
                    LocalDate.class
            ),

            rs.getObject(
                    "till_date",
                    LocalDate.class
            ),

            rs.getObject(
                    "membership_from",
                    LocalDate.class
            ),

            rs.getObject(
                    "membership_till",
                    LocalDate.class
            ),

            rs.getBigDecimal("submitted_amount"),

            rs.getBigDecimal("discount"),

            rs.getBigDecimal("pending_amount"),

            rs.getString("payment_mode"),

            rs.getString("requested_by"),

            rs.getObject(
                    "requested_at",
                    OffsetDateTime.class
            ),

            rs.getString("status")
    );
}

/**
 * Returns a single pending admission.
 */
public PendingAdmissionResponse getPendingAdmission(Long requestId) {

    String sql = """
        SELECT
            ar.id AS request_id,
            ar.student_id AS student_id,

            ar.request_data ->> 'fullName' AS full_name,
            ar.request_data ->> 'dateOfBirth' AS date_of_birth,
            ar.request_data ->> 'mobile' AS mobile,
            ar.request_data ->> 'guardianNumber' AS guardian_number,
            ar.request_data ->> 'fatherName' AS father_name,
            ar.request_data ->> 'localAddress' AS local_address,
            ar.request_data ->> 'permanentAddress' AS permanent_address,
            ar.request_data ->> 'aadharNumber' AS aadhar_number,
            ar.request_data ->> 'qualification' AS qualification,
            ar.request_data ->> 'preparationFor' AS preparation_for,
          
            ar.request_data ->> 'seatNumber' AS seat_number,
            ar.request_data ->> 'paymentMode' AS payment_mode,
            ar.request_data ->> 'transactionId' AS transaction_id,
            ar.request_data ->> 'paymentRemarks' AS payment_remarks,
            
            (ar.request_data ->> 'batchId')::bigint AS batch_id,

            b.batch_name,

            ar.request_data ->> 'membershipFrom' AS membership_from,
            ar.request_data ->> 'membershipTill' AS membership_till,

            COALESCE(
                (ar.request_data ->> 'discount')::numeric,
                0
            ) AS discount,

            COALESCE(
                (ar.request_data ->> 'submittedAmount')::numeric,
                0
            ) AS submitted_amount,

            COALESCE(
                (ar.request_data ->> 'pendingAmount')::numeric,
                0
            ) AS pending_amount,

            ar.status::text AS status,

            ar.requested_at

        FROM library.approval_requests ar

        LEFT JOIN library.batches b
            ON b.id =
               (ar.request_data ->> 'batchId')::bigint

        WHERE ar.id = ?

          AND ar.request_type =
              'FEES'::library.approval_type
        """;

    return jdbcTemplate.queryForObject(
            sql,
            this::mapPendingAdmission,
            requestId
    );
}

@Transactional
public void updatePendingAdmission(
        Long requestId,
        MemberApplicationRequest request
) {

    PendingAdmissionResponse existing =
            getPendingAdmission(requestId);

    if (existing == null) {
        throw new IllegalArgumentException(
                "Pending admission request not found."
        );
    }

    String json =
            buildAdmissionRequestData(request);

    int updated = jdbcTemplate.update(
            """
            UPDATE library.approval_requests
               SET request_data = ?::jsonb
             WHERE id = ?
               AND request_type =
                   'FEES'::library.approval_type
               AND status =
                   'PENDING'::library.approval_status
            """,
            json,
            requestId
    );

    if (updated == 0) {
        throw new IllegalArgumentException(
                "Unable to update pending request."
        );
    }
}

private String buildAdmissionRequestData(
        MemberApplicationRequest request
) {

    Map<String, Object> data =
            new LinkedHashMap<>();

    data.put("fullName", request.fullName());
    data.put("dateOfBirth", request.dateOfBirth());
    data.put("mobile", request.mobile());
    data.put("guardianNumber", request.guardianNumber());
    data.put("fatherName", request.fatherName());
    data.put("localAddress", request.localAddress());
    data.put("permanentAddress", request.permanentAddress());
    data.put("aadharNumber", request.aadharNumber());
    data.put("qualification", request.qualification());
    data.put("batchId", request.batchId());
    data.put("preparationFor", request.preparationFor());
    data.put("membershipFrom", request.membershipFrom());
    data.put("membershipTill", request.membershipTill());
    data.put("discount", request.discount());
    data.put("submittedAmount", request.submittedAmount());
    data.put("pendingAmount", request.pendingAmount());
   
    data.put("seatNumber", request.seatNumber());
    data.put("paymentMode", request.paymentMode());
    data.put("transactionId", request.transactionId());
    data.put("paymentRemarks", request.paymentRemarks());

    return toJson(data);
}

private String toJson(
        Map<String, Object> data
) {

    try {

        return objectMapper.writeValueAsString(data);

    } catch (JsonProcessingException exception) {

        throw new IllegalStateException(
                "Unable to serialize request data.",
                exception
        );
    }
}
/**
 * Cancels a pending admission request.
 */
@Transactional
public void cancelPendingAdmission(
        Long requestId,
        Long managerId
) {

    int updated = jdbcTemplate.update(
            """
            UPDATE library.approval_requests
               SET status =
                       'CANCELLED'::library.approval_status,
                   cancelled_at = CURRENT_TIMESTAMP,
                   reviewed_by = ?,
                   remarks = 'Cancelled by Manager'
             WHERE id = ?
               AND request_type =
                   'ADMISSION'::library.approval_type
               AND status =
                   'PENDING'::library.approval_status
            """,
            managerId,
            requestId
    );

    if (updated == 0) {

        throw new IllegalArgumentException(
                "Pending admission request not found."
        );
    }
}

/**
 * Updates a pending fee request.
 */
@Transactional
public void updatePendingFee(
        Long requestId,
        Map<String, Object> requestData
) {

    String json = toJson(requestData);

    int updated = jdbcTemplate.update(
            """
            UPDATE library.approval_requests
               SET request_data = ?::jsonb
             WHERE id = ?
               AND request_type =
                   'FEES'::library.approval_type
               AND status =
                   'PENDING'::library.approval_status
            """,
            json,
            requestId
    );

    if (updated == 0) {

        throw new IllegalArgumentException(
                "Pending fee request not found."
        );
    }
}

/**
 * Cancels a pending fee request.
 */
@Transactional
public void cancelPendingFee(
        Long requestId,
        Long managerId
) {

    int updated = jdbcTemplate.update(
            """
            UPDATE library.approval_requests
               SET status =
                       'CANCELLED'::library.approval_status,
                   cancelled_at = CURRENT_TIMESTAMP,
                   reviewed_by = ?,
                   remarks = 'Cancelled by Manager'
             WHERE id = ?
               AND request_type =
                   'FEES'::library.approval_type
               AND status =
                   'PENDING'::library.approval_status
            """,
            managerId,
            requestId
    );

    if (updated == 0) {

        throw new IllegalArgumentException(
                "Pending fee request not found."
        );
    }
}

public PendingCollectionSummaryResponse getPendingCollectionSummary() {

    return jdbcTemplate.queryForObject(
        """
SELECT 
    COALESCE(SUM(
        CASE 
            WHEN ar.request_data->>'paymentMode' = 'CASH'
            THEN COALESCE((ar.request_data->>'submittedAmount')::numeric, 0)
            ELSE 0
        END
    ), 0) AS totalCash,

    COALESCE(SUM(
        CASE 
            WHEN ar.request_data->>'paymentMode' = 'ONLINE'
            THEN COALESCE((ar.request_data->>'submittedAmount')::numeric, 0)
            ELSE 0
        END
    ), 0) AS totalOnline

FROM library.approval_requests ar

WHERE ar.request_type IN (
    'ADMISSION'::library.approval_type,
    'FEES'::library.approval_type
)
AND ar.status = 'PENDING'::library.approval_status
        """,
        (rs, rowNum) -> new PendingCollectionSummaryResponse(

            rs.getBigDecimal("total_cash"),

            rs.getBigDecimal("total_online")

        )
    );
}
}