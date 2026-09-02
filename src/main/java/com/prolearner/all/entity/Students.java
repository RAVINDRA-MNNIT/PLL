package com.prolearner.all.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(
        name = "students",
        schema = "library",
        uniqueConstraints = {
                @UniqueConstraint(name = "students_aadhaar_number_key", columnNames = "aadhaar_number")
        }
)
public class Students {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "mobile_number", nullable = false, length = 15)
    private String mobileNumber;

    @Column(name = "guardian_number", length = 15)
    private String guardianNumber;

    @Column(name = "father_name", length = 200)
    private String fatherName;

    @Column(name = "local_address", nullable = false, columnDefinition = "TEXT")
    private String localAddress;

    @Column(name = "permanent_address", nullable = false, columnDefinition = "TEXT")
    private String permanentAddress;

    @Column(name = "aadhaar_number", nullable = false, unique = true, length = 12)
    private String aadhaarNumber;

    @Column(name = "qualification", length = 150)
    private String qualification;

    @Column(name = "preparation_for", length = 200)
    private String preparationFor;

    @Column(name = "date_of_admission", nullable = false)
    private LocalDate dateOfAdmission;

    @Column(name = "enrollment_status", length = 30)
    private String enrollmentStatus;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_fee_id")
    private FeeRecord lastFee;
}