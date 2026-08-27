package com.prolearner.all.entity;
import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.NoArgsConstructor;

@Entity
@Table(name = "seats")
@NoArgsConstructor
public class Seat {

    // =========================================================
    // ID
    // =========================================================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    // =========================================================
    // SEAT NUMBER
    // =========================================================

    @Column(name = "seat_number", length = 20, nullable = false)
    private String seatNumber;


    // =========================================================
    // ACTIVE
    // =========================================================

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;


    // =========================================================
    // CREATED AT
    // =========================================================

    @Column(name = "created_at")
    private OffsetDateTime createdAt;


    // =========================================================
    // STUDENT
    // =========================================================

    @Column(name = "student_id")
    private Long studentId;


    // =========================================================
    // GETTERS
    // =========================================================

    public Long getId() {
        return id;
    }

    public String getSeatNumber() {
        return seatNumber;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public Long getStudentId() {
        return studentId;
    }


    // =========================================================
    // SETTERS
    // =========================================================

    public void setId(Long id) {
        this.id = id;
    }

    public void setSeatNumber(String seatNumber) {
        this.seatNumber = seatNumber;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }
}