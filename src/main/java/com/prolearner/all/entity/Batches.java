package com.prolearner.all.entity;

import jakarta.persistence.*;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Entity
@Table(name = "batches")
@NoArgsConstructor
public class Batches {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "batch_name", nullable = false)
    private String batchName;

    @Column(name = "category", nullable = false)
    private String category;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "batch_alias")
    private String batchAlias;

    @Column(name = "room")
    private String room;

    // Getters

    public Long getId() {
        return id;
    }

    public String getBatchName() {
        return batchName;
    }

    public String getCategory() {
        return category;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public String getBatchAlias() {
        return batchAlias;
    }

    public String getRoom() {
        return room;
    }

    // Setters

    public void setId(Long id) {
        this.id = id;
    }

    public void setBatchName(String batchName) {
        this.batchName = batchName;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setBatchAlias(String batchAlias) {
        this.batchAlias = batchAlias;
    }

    public void setRoom(String room) {
        this.room = room;
    }
}