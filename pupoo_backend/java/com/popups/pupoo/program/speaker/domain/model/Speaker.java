// file: src/main/java/com/popups/pupoo/program/speaker/domain/model/Speaker.java
package com.popups.pupoo.program.speaker.domain.model;

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
 * 연사 엔티티 (speakers)
 *
 * DB(v1.0) 기준
 * - speakers는 독립 리소스이다. (program_id 컬럼 없음)
 * - 프로그램과의 연결은 program_speakers 매핑 테이블에서 관리한다.
 */
@Entity
@Table(name = "speakers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Speaker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "speaker_id")
    private Long speakerId;

    @Column(name = "speaker_name", nullable = false, length = 255)
    private String speakerName;

    @Column(name = "speaker_bio", nullable = false, length = 1000)
    private String speakerBio;

    @Column(name = "speaker_email", nullable = false, length = 255, unique = true)
    private String speakerEmail;

    @Column(name = "speaker_phone", nullable = false, length = 30, unique = true)
    private String speakerPhone;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public void update(String speakerName, String speakerBio, String speakerEmail, String speakerPhone) {
        this.speakerName = speakerName;
        this.speakerBio = speakerBio;
        this.speakerEmail = speakerEmail;
        this.speakerPhone = speakerPhone;
    }

    public void softDelete(LocalDateTime now) {
        this.deletedAt = now;
    }
}