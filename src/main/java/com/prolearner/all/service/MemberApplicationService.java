package com.prolearner.all.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prolearner.all.dto.MemberApplicationRequest;
import com.prolearner.all.dto.MemberApplicationResponse;

@Service
public class MemberApplicationService {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public MemberApplicationService(
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public MemberApplicationResponse createApplication(
            MemberApplicationRequest request,
            Long managerId
    ) {

        validate(request, managerId);

        validateManager(managerId);
        validateBatch(request.batchId());

        Long studentId = getNextStudentId();

        insertApprovalRequest(
                studentId,
                managerId,
                request
        );

        return new MemberApplicationResponse(
                studentId,
                "PENDING",
                "Application sent to Admin for approval."
        );
    }

    private Long getNextStudentId() {

    Long studentId = jdbcTemplate.queryForObject(
            """
            SELECT MAX(id)
            FROM library.students
            """,
            Long.class
    );

    if (studentId != null) {
        return studentId + 1;
    }

    Long pendingStudentId = jdbcTemplate.queryForObject(
            """
            SELECT MAX(student_id)
            FROM library.approval_requests
            WHERE request_type =
                  'ADMISSION'::library.approval_type
              AND student_id IS NOT NULL
            """,
            Long.class
    );

    if (pendingStudentId != null) {
        return pendingStudentId + 1;
    }

    return 1L;
}

    private void validate(
            MemberApplicationRequest request,
            Long managerId
    ) {
        if (managerId == null) {
            throw new SecurityException("Manager session not found.");
        }

        if (request == null) {
            throw new IllegalArgumentException("Application data is required.");
        }

        validateFullName(request.fullName());

        validateDob(request.dateOfBirth());

        validateMobile(request.mobile());

        validateGuardian(request.mobile(), request.guardianNumber());

        validateAddress(
                request.localAddress(),
                "Local Address"
        );

        validateAddress(
                request.permanentAddress(),
                "Permanent Address"
        );

        validateAadhaar(request.aadharNumber());

        validateMembershipDates(
                request.membershipFrom(),
                request.membershipTill()
        );

        validateAmounts(
                request.discount(),
                request.submittedAmount(),
                request.pendingAmount()
        );
    }

    private void validateFullName(String name) {

        requireText(name, "Full Name");

        name = name.trim();

        if (name.length() < 3 || name.length() > 200) {
            throw new IllegalArgumentException(
                    "Full Name must be between 3 and 200 characters."
            );
        }

        if (!name.matches("[A-Za-z .]+")) {
            throw new IllegalArgumentException(
                    "Full Name contains invalid characters."
            );
        }
    }

    private void validateDob(LocalDate dob) {

        if (dob == null) {
            throw new IllegalArgumentException(
                    "Date of Birth is required."
            );
        }

        LocalDate minimum = LocalDate.of(1980, 1, 1);
        LocalDate today = LocalDate.now();

        if (dob.isBefore(minimum)) {
            throw new IllegalArgumentException(
                    "Date of Birth cannot be before 01/01/1980."
            );
        }

        if (dob.isAfter(today)) {
            throw new IllegalArgumentException(
                    "Date of Birth cannot be in the future."
            );
        }

        int age = Period.between(dob, today).getYears();

        if (age < 10 || age > 80) {
            throw new IllegalArgumentException(
                    "Student age must be between 10 and 80 years."
            );
        }
    }

    private void validateMobile(String mobile) {

        requireText(mobile, "Mobile Number");

        if (!mobile.trim().matches("^[6-9][0-9]{9}$")) {
            throw new IllegalArgumentException(
                    "Enter a valid 10 digit Mobile Number."
            );
        }
    }

    private void validateGuardian(
            String mobile,
            String guardian
    ) {

        if (guardian == null || guardian.isBlank()) {
            return;
        }

        String trimmedGuardian = guardian.trim();

        if (!trimmedGuardian.matches("^[6-9][0-9]{9}$")) {
            throw new IllegalArgumentException(
                    "Enter a valid Guardian Number."
            );
        }

        if (trimmedGuardian.equals(mobile != null ? mobile.trim() : null)) {
            throw new IllegalArgumentException(
                    "Guardian Number cannot be same as Mobile Number."
            );
        }
    }

    private void validateAadhaar(String aadhaar) {

        requireText(aadhaar, "Aadhaar Number");

        if (!aadhaar.trim().matches("^\\d{12}$")) {
            throw new IllegalArgumentException(
                    "Enter a valid 12 digit Aadhaar Number."
            );
        }
    }

    private void validateAddress(
            String address,
            String field
    ) {

        requireText(address, field);

        if (address.trim().length() < 10) {
            throw new IllegalArgumentException(
                    field + " should contain at least 10 characters."
            );
        }
    }

    private void validateMembershipDates(
            LocalDate membershipFrom,
            LocalDate membershipTill
    ) {

        if (membershipFrom == null) {
            throw new IllegalArgumentException(
                    "Membership From date is required."
            );
        }

        if (membershipTill == null) {
            throw new IllegalArgumentException(
                    "Membership Till date is required."
            );
        }

        LocalDate minimumDate = LocalDate.of(1980, 1, 1);
        LocalDate today = LocalDate.now();
        LocalDate maximumTillDate = today.plusYears(1);

        if (membershipFrom.isBefore(minimumDate)) {
            throw new IllegalArgumentException(
                    "Membership From date cannot be before 01/01/1980."
            );
        }

        if (membershipFrom.isAfter(today)) {
            throw new IllegalArgumentException(
                    "Membership From date cannot be in the future."
            );
        }

        if (membershipTill.isBefore(today)) {
            throw new IllegalArgumentException(
                    "Membership Till date cannot be before today."
            );
        }

        if (membershipTill.isAfter(maximumTillDate)) {
            throw new IllegalArgumentException(
                    "Membership Till date cannot be more than one year from today."
            );
        }

        if (membershipTill.isBefore(membershipFrom)) {
            throw new IllegalArgumentException(
                    "Membership Till date cannot be before Membership From date."
            );
        }
    }

    private void validateAmounts(
            BigDecimal discount,
            BigDecimal submittedAmount,
            BigDecimal pendingAmount
    ) {

        if (discount != null && discount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Discount amount cannot be negative.");
        }

        if (submittedAmount == null || submittedAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Submitted amount must be non-negative.");
        }

        if (pendingAmount == null || pendingAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Pending amount must be non-negative.");
        }
    }

    private void requireText(
            String value,
            String field
    ) {

        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(
                    field + " is required."
            );
        }
    }

    private void validateManager(Long managerId) {

        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM library.users
                WHERE id = ?
                  AND role = 'MANAGER'::library.user_role
                  AND is_active = TRUE
                """,
                Integer.class,
                managerId
        );

        if (count == null || count == 0) {
            throw new SecurityException(
                    "Logged-in user is not an active Manager."
            );
        }
    }

    private void validateBatch(Long batchId) {

        if (batchId == null) {
            throw new IllegalArgumentException("Batch ID is required.");
        }

        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM library.batches
                WHERE id = ?
                  AND is_active = TRUE
                """,
                Integer.class,
                batchId
        );

        if (count == null || count == 0) {
            throw new IllegalArgumentException(
                    "Invalid or inactive batch."
            );
        }
    }

    private void insertApprovalRequest(
            Long studentId,
            Long managerId,
            MemberApplicationRequest request
    ) {

        Map<String, Object> requestData =
                new LinkedHashMap<>();

        requestData.put("fullName", request.fullName());
        requestData.put("dateOfBirth", request.dateOfBirth());
        requestData.put("mobile", request.mobile());
        requestData.put(
                "guardianNumber",
                request.guardianNumber()
        );
        requestData.put(
                "fatherName",
                request.fatherName()
        );
        requestData.put(
                "localAddress",
                request.localAddress()
        );
        requestData.put(
                "permanentAddress",
                request.permanentAddress()
        );
        requestData.put(
                "aadharNumber",
                request.aadharNumber()
        );
        requestData.put(
                "qualification",
                request.qualification()
        );
        requestData.put(
                "batchId",
                request.batchId()
        );
        requestData.put(
                "preparationFor",
                request.preparationFor()
        );
        requestData.put(
                "membershipFrom",
                request.membershipFrom()
        );
        requestData.put(
                "membershipTill",
                request.membershipTill()
        );
        requestData.put(
                "discount",
                request.discount()
        );
        requestData.put(
                "submittedAmount",
                request.submittedAmount()
        );
        requestData.put(
                "pendingAmount",
                request.pendingAmount()
        );
        requestData.put(
                "seatId",
                request.seatNumber()
        );

        requestData.put(
                "paymentMode",
                request.paymentMode()
        );

        requestData.put(
                "transactionId",
                request.transactionId()
        );

        requestData.put(
                "paymentRemark",
                request.paymentRemarks()
        );

        String json;

        try {
            json = objectMapper.writeValueAsString(
                    requestData
            );
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(
                    "Unable to create application data.",
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
                "NEW_STUDENT",
                studentId,
                managerId,
                json
        );
    }

    private String blankToNull(String value) {

        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}