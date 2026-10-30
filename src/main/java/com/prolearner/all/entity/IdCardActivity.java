package com.prolearner.all.entity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(
        name = "id_card_activities",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_id_card_activities_student_owner",
                        columnNames = {"student_id", "owner_id"}
                )
        },
        indexes = {
                @Index(
                        name = "idx_id_card_activities_owner_print_later",
                        columnList = "owner_id, print_later"
                )
        }
)
public class IdCardActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Students student;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(name = "printed_at")
    private LocalDateTime printedAt;

    @Setter
    @Column(name = "issued_at")
    private LocalDateTime issuedAt;

    @Column(name = "print_later", nullable = false)
    private Boolean printLater = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;

        if (printLater == null) {
            printLater = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

}