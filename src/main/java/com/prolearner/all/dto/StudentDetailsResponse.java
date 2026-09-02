package com.prolearner.all.dto;

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

    StudentFeeHistoryResponse lastFee
) {}