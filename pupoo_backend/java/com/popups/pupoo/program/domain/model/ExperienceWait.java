// file: src/main/java/com/popups/pupoo/program/domain/model/ExperienceWait.java
package com.popups.pupoo.program.domain.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 체험 대기열 집계
 *
 * - DB: experience_waits
 * - 정책: program_id 당 1행(UNIQUE)
 */
@Entity
@Table(name = "experience_waits")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class ExperienceWait {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "wait_id", nullable = false)
    private Long waitId;

    @Column(name = "program_id", nullable = false)
    private Long programId;

    @Column(name = "wait_count")
    private Integer waitCount;

    @Column(name = "wait_min")
    private Integer waitMin;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
