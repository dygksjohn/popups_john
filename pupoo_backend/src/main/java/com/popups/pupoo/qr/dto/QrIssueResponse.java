// file: src/main/java/com/popups/pupoo/qr/dto/QrIssueResponse.java
package com.popups.pupoo.qr.dto;

import com.popups.pupoo.qr.domain.model.QrCode;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class QrIssueResponse {
    private static final String ISSUED = "ISSUED";
    private static final String ACTIVE = "ACTIVE";
    private static final String EXPIRED = "EXPIRED";

    private Long qrId;
    private Long eventId;
    private String originalUrl;
    private String mimeType;
    private LocalDateTime issuedAt;
    private LocalDateTime expiredAt;
    private LocalDateTime activeFrom;
    private String qrStatus;

    public static QrIssueResponse from(QrCode qr, LocalDateTime now) {
        LocalDateTime activeFrom = qr.getEvent().getStartAt() == null
                ? null
                : qr.getEvent().getStartAt().minusHours(1);
        LocalDateTime expiredAt = qr.getExpiredAt();
        String status = resolveStatus(now, activeFrom, expiredAt);

        return QrIssueResponse.builder()
                .qrId(qr.getQrId())
                .eventId(qr.getEvent().getEventId())
                .originalUrl(qr.getOriginalUrl())
                .mimeType(qr.getMimeType() == null ? null : qr.getMimeType().name())
                .issuedAt(qr.getIssuedAt())
                .expiredAt(expiredAt)
                .activeFrom(activeFrom)
                .qrStatus(status)
                .build();
    }

    private static String resolveStatus(LocalDateTime now, LocalDateTime activeFrom, LocalDateTime expiredAt) {
        if (expiredAt != null && !now.isBefore(expiredAt)) {
            return EXPIRED;
        }
        if (activeFrom != null && !now.isBefore(activeFrom)) {
            return ACTIVE;
        }
        return ISSUED;
    }
}
