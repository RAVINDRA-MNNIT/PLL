package com.prolearner.all.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Entity
@Table(
        name = "complaint_comments",
        schema = "library"
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "complaint_id", nullable = false)
    private Long complaintId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "student_id")
    private Long studentId;

    @Column(name = "user_name", nullable = false, length = 150)
    private String userName;

    @Column(name = "role", nullable = false, length = 30)
    private String role;

    @Column(name = "comment", nullable = false, columnDefinition = "TEXT")
    private String comment;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
}