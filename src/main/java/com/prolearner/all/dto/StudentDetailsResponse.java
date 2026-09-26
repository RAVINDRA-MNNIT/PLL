package com.prolearner.all.dto;

import com.prolearner.all.entity.StudentComplaint;
import com.prolearner.all.entity.StudentWarning;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record StudentDetailsResponse(
        Long studentId,
        String fullName,
        LocalDate dateOfBirth,
        String mobileNumber,
        String guardianNumber,
        String fatherName,
        String localAddress,
        String permanentAddress,
        String aadhaarNumber,
        String qualification,
        String preparationFor,
        LocalDate dateOfAdmission,
        String enrollmentStatus,
        BigDecimal allowedDiscount,
        Integer terminationCount,
        List<StudentWarning> warnings,
        List<StudentComplaint> complaints,
        StudentFeeHistoryResponse lastFee
) {}