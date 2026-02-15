package com.popups.pupoo.program.domain.model;

import com.popups.pupoo.program.domain.enums.ProgramCategory;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "event_program")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Program {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "program_id")
    private Long programId;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private ProgramCategory category;

    @Column(name = "program_title", nullable = false, length = 255)
    private String programTitle;

    @Column(name = "description", nullable = false, length = 1000)
    private String description;

    @Column(name = "start_at", nullable = false)
    private LocalDateTime startAt;

    @Column(name = "end_at", nullable = false)
    private LocalDateTime endAt;

    @Column(name = "place_name", length = 100)
    private String placeName;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;


    /* =========================
       상태 계산 로직
    ========================= */

    public boolean isOngoing() {
        LocalDateTime now = LocalDateTime.now();
        return (now.isEqual(startAt) || now.isAfter(startAt)) && now.isBefore(endAt);
    }

    public boolean isUpcoming() {
        return LocalDateTime.now().isBefore(startAt);
    }

    public boolean isEnded() {
        return LocalDateTime.now().isAfter(endAt);
    }
    
    // 프로그램 신청 관련
    public boolean isApplyAllowed() {
        LocalDateTime cutoff = this.startAt.minusHours(1);
        return !LocalDateTime.now().isAfter(cutoff); // now <= cutoff
    }
}
