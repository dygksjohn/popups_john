// file: src/main/java/com/popups/pupoo/booth/domain/model/BoothWait.java
package com.popups.pupoo.booth.domain.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "booth_waits")
public class BoothWait {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "wait_id")
    private Long waitId;

    @Column(name = "booth_id", nullable = false, unique = true)
    private Long boothId;

    @Column(name = "wait_count")
    private Integer waitCount;

    @Column(name = "wait_min")
    private Integer waitMin;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected BoothWait() {}

    public Long getWaitId() { return waitId; }
    public Long getBoothId() { return boothId; }
    public Integer getWaitCount() { return waitCount; }
    public Integer getWaitMin() { return waitMin; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
