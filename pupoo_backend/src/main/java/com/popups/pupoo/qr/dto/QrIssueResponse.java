package com.popups.pupoo.qr.dto;

import java.time.LocalDateTime;

import com.popups.pupoo.qr.domain.model.QrCode;

/**
 * Data transfer object representing a QR issue response. This simplified
 * version corresponds to the develop branch which did not include status
 * fields or activation windows. It simply returns basic metadata about the
 * QR code.
 */
public class QrIssueResponse {
    private Long qrId;
    private Long eventId;
    private String originalUrl;
    private String mimeType;
    private LocalDateTime issuedAt;
    private LocalDateTime expiredAt;

    public static QrIssueResponse from(QrCode qr) {
        QrIssueResponse response = new QrIssueResponse();
        response.qrId = qr.getQrId();
        response.eventId = qr.getEvent() == null ? null : qr.getEvent().getEventId();
        response.originalUrl = qr.getOriginalUrl();
        response.mimeType = qr.getMimeType() == null ? null : qr.getMimeType().dbValue();
        response.issuedAt = qr.getIssuedAt();
        response.expiredAt = qr.getExpiredAt();
        return response;
    }

    public Long getQrId() { return qrId; }
    public Long getEventId() { return eventId; }
    public String getOriginalUrl() { return originalUrl; }
    public String getMimeType() { return mimeType; }
    public LocalDateTime getIssuedAt() { return issuedAt; }
    public LocalDateTime getExpiredAt() { return expiredAt; }
}
