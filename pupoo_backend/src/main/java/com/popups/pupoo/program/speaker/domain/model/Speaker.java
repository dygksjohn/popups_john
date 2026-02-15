package com.popups.pupoo.program.speaker.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

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

    @Column(name = "program_id", nullable = false)
    private Long programId;

    @Column(name = "speaker_name", nullable = false, length = 255)
    private String speakerName;

    @Column(name = "speaker_bio", nullable = false, length = 1000)
    private String speakerBio;

    @Column(name = "speaker_email", nullable = false, length = 255)
    private String speakerEmail;

    @Column(name = "speaker_phone", nullable = false, length = 30)
    private String speakerPhone;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
