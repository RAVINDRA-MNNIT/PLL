package com.prolearner.all.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prolearner.all.dto.StudentDetailsResponse;
import com.prolearner.all.dto.StudentFeeHistoryResponse;
import com.prolearner.all.dto.StudentFeeResponse;
import com.prolearner.all.dto.StudentResponse;
import com.prolearner.all.dto.UpdateFeeRequest;



@Service
public class StudentService {

   private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public StudentService(
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public List<StudentResponse> getStudents() {

    return jdbcTemplate.query(
            """
 SELECT
    s.id,
    s.full_name,
    s.date_of_birth,
    s.mobile_number,
    s.guardian_number,
    s.father_name,
    s.local_address,
    s.permanent_address,
    s.aadhaar_number,
    s.qualification,
    s.preparation_for,
    s.date_of_admission,
    s.enrollment_status,

    fr.from_date,
    fr.till_date,
    fr.seat_id,
    fr.seat_number,
    fr.batch_id,
    fr.batch_name,
    fr.discount_amount,
    fr.submitted_amount,
    fr.pending_amount,
    fr.payment_mode,
    fr.transaction_id,
    fr.payment_remark,

    (
        SELECT COUNT(*)
        FROM library.approval_requests ar
        WHERE ar.student_id = s.id
          AND ar.status = 'PENDING'
    ) AS pending_approval_count,

    s.created_by,
    s.created_at

FROM library.students s

LEFT JOIN library.fee_records fr
    ON fr.student_id = s.id

ORDER BY s.id DESC;
            """,
            (rs, rowNum) -> new StudentResponse(

                    rs.getLong("id"),

                    rs.getString("full_name"),

                    rs.getDate("date_of_birth").toLocalDate(),

                    rs.getString("mobile_number"),

                    rs.getString("guardian_number"),

                    rs.getString("father_name"),

                    rs.getString("local_address"),

                    rs.getString("permanent_address"),

                    rs.getString("aadhaar_number"),

                    rs.getString("qualification"),

                    rs.getString("preparation_for"),

                    rs.getLong("batch_id"),
                    rs.getString("batch_name"),

                    rs.getObject("seat_id") != null
                            ? rs.getLong("seat_id")
                            : null,
                    rs.getString("seat_number"),
                    rs.getDate("date_of_admission").toLocalDate(),
                    rs.getDate("from_date").toLocalDate(),

                    rs.getDate("till_date").toLocalDate(),

                    rs.getString("enrollment_status"),

                    rs.getBigDecimal("submitted_amount"),

                    rs.getBigDecimal("pending_amount"),

                    rs.getBigDecimal("discount_amount"),

                    rs.getString("payment_mode"),

                    rs.getString("transaction_id"),

                    rs.getString("payment_remark"),

                    rs.getLong("created_by"),

                    rs.getObject(
                            "created_at",
                            OffsetDateTime.class
                    ),

                    rs.getLong("pending_approval_count")
            )
    );
}

public StudentFeeResponse getStudentFees(Long studentId) {
    String sql = """
        SELECT
            s.id,
            s.full_name,
            s.seat_id,
            s.enrollment_status,

            fr.from_date,
            fr.till_date,
            fr.batch_id,
            fr.discount_amount,
            fr.submitted_amount,
            fr.pending_amount,
            fr.payment_mode,
            fr.transaction_id,
            fr.payment_remark

        FROM library.students s

        LEFT JOIN library.fee_records fr
            ON fr.student_id = s.id

        WHERE s.id = ?
        """;

    return jdbcTemplate.queryForObject(
            sql,
            (rs, rowNum) -> new StudentFeeResponse(

                    rs.getLong("id"),

                    rs.getString("full_name"),

                    rs.getLong("batch_id"),

                    rs.getObject("seat_id") != null
                            ? rs.getLong("seat_id")
                            : null,

                    rs.getDate("from_date").toLocalDate(),

                    rs.getDate("till_date").toLocalDate(),

                    rs.getString("enrollment_status"),

                    rs.getBigDecimal("discount_amount"),

                    rs.getBigDecimal("submitted_amount"),

                    rs.getBigDecimal("pending_amount"),

                    rs.getString("payment_mode"),

                    rs.getString("transaction_id"),

                    rs.getString("payment_remark")
            ),
            studentId
    );
}

 @Transactional
public void submitFeeUpdateRequest(
        Long studentId,
        Long managerId,
        UpdateFeeRequest request
) {

    Map<String, Object> requestData = new LinkedHashMap<>();

    requestData.put("studentId", studentId);
    requestData.put("batchId", request.batchId());
    requestData.put("seatId", request.seatId());
    requestData.put("membershipFrom", request.membershipFrom());
    requestData.put("membershipTill", request.membershipTill());
    requestData.put("submittedAmount", request.submittedAmount());
    requestData.put("discount", request.discount());
    requestData.put("pendingAmount", request.pendingAmount());
    requestData.put("paymentMode", request.paymentMode());
    requestData.put("transactionId", request.transactionId());
    requestData.put("paymentRemark", request.paymentRemark());

    String json;

    try {

        json = objectMapper.writeValueAsString(requestData);

    } catch (JsonProcessingException exception) {

        throw new IllegalStateException(
                "Unable to create fee update request.",
                exception
        );
    }

    jdbcTemplate.update(
            """
            INSERT INTO library.approval_requests (
                request_type,
                student_id,
                requested_by,
                request_data
            )
            VALUES (
                ?::library.approval_type,
                ?,
                ?,
                ?::jsonb
            )
            """,
            "FEE_UPDATE",
            studentId,
            managerId,
            json
    );
}

@Transactional
public void updatePendingFeeRequest(
        Long requestId,
        UpdateFeeRequest request
) {

    Map<String, Object> requestData = new LinkedHashMap<>();

    requestData.put("batchId", request.batchId());
    requestData.put("seatId", request.seatId());
    requestData.put("membershipFrom", request.membershipFrom());
    requestData.put("membershipTill", request.membershipTill());
    requestData.put("submittedAmount", request.submittedAmount());
    requestData.put("discount", request.discount());
    requestData.put("pendingAmount", request.pendingAmount());
    requestData.put("paymentMode", request.paymentMode());
    requestData.put("transactionId", request.transactionId());
    requestData.put("paymentRemark", request.paymentRemark());

    String json;

    try {
        json = objectMapper.writeValueAsString(requestData);
    } catch (JsonProcessingException e) {
        throw new IllegalStateException("Unable to update request.", e);
    }

    jdbcTemplate.update(
        """
        UPDATE library.approval_requests
        SET
            request_data = ?::jsonb,
            updated_at = NOW()
        WHERE id = ?
          AND request_type = 'FEES'::library.approval_type
          AND status = 'PENDING'::library.approval_status
        """,
        json,
        requestId
    );
}

public StudentDetailsResponse getStudentDetails(Long studentId) {

    StudentDetailsResponse student = jdbcTemplate.queryForObject(
        """
        SELECT
            s.id,
            s.full_name,
            s.date_of_birth,
            s.mobile_number,
            s.guardian_number,
            s.father_name,
            s.local_address,
            s.permanent_address,
            s.aadhaar_number,
            s.qualification,
            s.preparation_for,
            s.date_of_admission,
            s.enrollment_status
        FROM library.students s
        WHERE s.id = ?
        """,
        (rs, rowNum) -> new StudentDetailsResponse(
            rs.getLong("id"),
            rs.getString("full_name"),
            rs.getObject("date_of_birth", LocalDate.class),
            rs.getString("mobile_number"),
            rs.getString("guardian_number"),
            rs.getString("father_name"),
            rs.getString("local_address"),
            rs.getString("permanent_address"),
            rs.getString("aadhaar_number"),
            rs.getString("qualification"),
            rs.getString("preparation_for"),
            rs.getObject("date_of_admission", LocalDate.class),
            rs.getString("enrollment_status"),
            new ArrayList<>()
        ),
        studentId
    );

    if (student == null) {
        throw new IllegalArgumentException("Student not found.");
    }

    List<StudentFeeHistoryResponse> feeRecords = jdbcTemplate.query(
        """
        SELECT
            fr.id,
            fr.batch_id,
            b.batch_name,
            fr.seat_id,
            fr.seat_number,
            fr.from_date,
            fr.till_date,
            fr.submitted_amount,
            fr.discount_amount,
            fr.pending_amount,
            fr.payment_mode,
            fr.transaction_id,
            fr.payment_remark,
            fr.created_by,
            fr.created_at
        FROM library.fee_records fr
        LEFT JOIN library.batches b
            ON b.id = fr.batch_id
        WHERE fr.student_id = ?
        ORDER BY fr.till_date ASC
        """,
        (rs, rowNum) -> new StudentFeeHistoryResponse(
            rs.getLong("id"),
            rs.getLong("batch_id"),
            rs.getString("batch_name"),
            rs.getObject("seat_id", Long.class),
            rs.getString("seat_number"),
            rs.getObject("from_date", LocalDate.class),
            rs.getObject("till_date", LocalDate.class),
            rs.getBigDecimal("submitted_amount"),
            rs.getBigDecimal("discount_amount"),
            rs.getBigDecimal("pending_amount"),
            rs.getString("payment_mode"),
            rs.getString("transaction_id"),
            rs.getString("payment_remark"),
            rs.getObject("created_by", Long.class),
            rs.getObject("created_at", OffsetDateTime.class)
        ),
        studentId
    );

    return new StudentDetailsResponse(
        student.studentId(),
        student.fullName(),
        student.dateOfBirth(),
        student.mobileNumber(),
        student.guardianNumber(),
        student.fatherName(),
        student.localAddress(),
        student.permanentAddress(),
        student.aadhaarNumber(),
        student.qualification(),
        student.preparationFor(),
        student.dateOfAdmission(),
        student.enrollmentStatus(),
        feeRecords
    );
}
}

