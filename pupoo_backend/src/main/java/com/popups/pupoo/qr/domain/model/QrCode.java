package com.popups.pupoo.qr.domain.model;

import com.popups.pupoo.event.domain.model.Event;
import com.popups.pupoo.qr.domain.enums.QrMimeType;
import com.popups.pupoo.user.domain.model.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "qr_codes",
    indexes = {
        @Index(name = "ix_qr_codes_user_id", columnList = "user_id"),
        @Index(name = "ix_qr_codes_event_id", columnList = "event_id")
    }
)
public class QrCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "qr_id", nullable = false)
    private Long qrId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_qr_codes_users"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_qr_codes_event"))
    private Event event;

    @Column(name = "original_url", nullable = false, length = 500)
    private String originalUrl;

    // DB: ENUM('jpeg','jpg','png','gif','webp','tiff','svg') NULL
    @Enumerated(EnumType.STRING)
    @Column(name = "mime_type", nullable = true, length = 10)
    private QrMimeType mimeType;

    // DB: issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    // DB: expired_at DATETIME NOT NULL
    @Column(name = "expired_at", nullable = false)
    private LocalDateTime expiredAt;

    @PrePersist
    void prePersist() {
        if (issuedAt == null) {
            issuedAt = LocalDateTime.now();
        }
    }
}
