// file: src/main/java/com/popups/pupoo/qr/application/QrService.java
package com.popups.pupoo.qr.application;

import com.popups.pupoo.booth.domain.model.Booth;
import com.popups.pupoo.booth.persistence.BoothRepository;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.event.domain.model.Event;
import com.popups.pupoo.event.persistence.EventRepository;
import com.popups.pupoo.notification.port.NotificationSender;
import com.popups.pupoo.qr.domain.enums.QrMimeType;
import com.popups.pupoo.qr.domain.model.QrCheckin;
import com.popups.pupoo.qr.domain.model.QrCode;
import com.popups.pupoo.qr.dto.QrHistoryResponse;
import com.popups.pupoo.qr.dto.QrIssueResponse;
import com.popups.pupoo.qr.infrastructure.QrImageGenerator;
import com.popups.pupoo.qr.persistence.QrCheckinRepository;
import com.popups.pupoo.qr.persistence.QrCodeRepository;
import com.popups.pupoo.qr.persistence.projection.BoothVisitSummaryRow;
import com.popups.pupoo.storage.infrastructure.StorageKeyGenerator;
import com.popups.pupoo.storage.port.ObjectStoragePort;
import com.popups.pupoo.user.domain.model.User;
import com.popups.pupoo.user.persistence.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
public class QrService {
    private static final String LOCAL_BUCKET_UNUSED = "local";
    private static final String LOCAL_PUBLIC_PREFIX = "/static/qr/";
    private static final int QR_IMAGE_SIZE = 320;
    private static final DateTimeFormatter QR_SMS_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm");

    private final QrCodeRepository qrCodeRepository;
    private final QrCheckinRepository qrCheckinRepository;
    private final NotificationSender notificationSender;
    private final ObjectStoragePort objectStoragePort;
    private final StorageKeyGenerator storageKeyGenerator;
    private final QrImageGenerator qrImageGenerator;

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final BoothRepository boothRepository;
    private final String qrPublicBaseUrl;

    public QrService(QrCodeRepository qrCodeRepository,
                     QrCheckinRepository qrCheckinRepository,
                     NotificationSender notificationSender,
                     ObjectStoragePort objectStoragePort,
                     StorageKeyGenerator storageKeyGenerator,
                     QrImageGenerator qrImageGenerator,
                     UserRepository userRepository,
                     EventRepository eventRepository,
                     BoothRepository boothRepository,
                     @Value("${qr.public-base-url:http://localhost:8080}") String qrPublicBaseUrl) {
        this.qrCodeRepository = qrCodeRepository;
        this.qrCheckinRepository = qrCheckinRepository;
        this.notificationSender = notificationSender;
        this.objectStoragePort = objectStoragePort;
        this.storageKeyGenerator = storageKeyGenerator;
        this.qrImageGenerator = qrImageGenerator;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.boothRepository = boothRepository;
        this.qrPublicBaseUrl = stripTrailingSlash(qrPublicBaseUrl);
    }

    @Transactional
    public QrIssueResponse getMyQrOrIssue(Long userId, Long eventId) {
        LocalDateTime now = LocalDateTime.now();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("EVENT_NOT_FOUND"));

        return qrCodeRepository.findValidLatest(userId, eventId, now)
                .map(this::ensureLocalQrImage)
                .map(QrIssueResponse::from)
                .orElseGet(() -> {
                    LocalDateTime expiredAt = event.getEndAt().plusDays(1);

                    QrCode issued = QrCode.builder()
                            .user(user)
                            .event(event)
                            .originalUrl("PENDING")
                            .mimeType(QrMimeType.PNG)
                            .issuedAt(now)
                            .expiredAt(expiredAt)
                            .build();

                    QrCode saved = qrCodeRepository.save(issued);
                    ensureLocalQrImage(saved);
                    return QrIssueResponse.from(saved);
                });
    }

    private QrCode ensureLocalQrImage(QrCode qr) {
        if (qr == null) return null;

        if (isLocalQrPath(qr.getOriginalUrl())) {
            if (qr.getMimeType() == null) {
                qr.updateMimeType(QrMimeType.PNG);
            }
            return qr;
        }

        String payload = String.valueOf(qr.getQrId());
        byte[] png = qrImageGenerator.generatePng(payload, QR_IMAGE_SIZE);

        String key = storageKeyGenerator.generateKey(
                StorageKeyGenerator.UploadTargetType.QR,
                qr.getQrId(),
                "qr.png"
        );

        objectStoragePort.putObject(LOCAL_BUCKET_UNUSED, key, png, "image/png");

        String publicPath = objectStoragePort.getPublicPath(LOCAL_BUCKET_UNUSED, key);
        if (publicPath == null || publicPath.isBlank()) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Failed to build qr public path");
        }

        qr.updateOriginalUrl(toAbsolutePublicUrl(publicPath));
        qr.updateMimeType(QrMimeType.PNG);
        return qr;
    }

    private boolean isLocalQrPath(String originalUrl) {
        if (originalUrl == null || originalUrl.isBlank()) return false;
        if (originalUrl.startsWith(LOCAL_PUBLIC_PREFIX)) return true;
        return originalUrl.startsWith(qrPublicBaseUrl + LOCAL_PUBLIC_PREFIX);
    }

    private String toAbsolutePublicUrl(String publicPath) {
        if (publicPath == null || publicPath.isBlank()) return publicPath;
        if (publicPath.startsWith("http://") || publicPath.startsWith("https://")) {
            return publicPath;
        }

        String path = publicPath.startsWith("/") ? publicPath : "/" + publicPath;
        return qrPublicBaseUrl + path;
    }

    private String stripTrailingSlash(String value) {
        if (value == null || value.isBlank()) return "http://localhost:8080";
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    @Transactional
    public void sendMyQrSms(Long userId, Long eventId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("EVENT_NOT_FOUND"));

        String phone = normalizePhone(user.getPhone());
        if (phone.isBlank()) {
            throw new IllegalArgumentException("PHONE_NOT_FOUND");
        }

        QrIssueResponse qr = getMyQrOrIssue(userId, eventId);
        String smsText = buildQrSmsText(event, qr);
        notificationSender.sendSms(List.of(phone), smsText);
    }

    private String buildQrSmsText(Event event, QrIssueResponse qr) {
        String eventName = event.getEventName() == null ? "Event" : event.getEventName();
        String location = (event.getLocation() == null || event.getLocation().isBlank()) ? "-" : event.getLocation();
        String qrLabel = qr.getQrId() == null ? "-" : "QR-" + qr.getQrId();
        String start = formatDateTime(event.getStartAt());
        String end = formatDateTime(event.getEndAt());

        return "[Pupoo] QR Check-in\n"
                + "Event: " + eventName + "\n"
                + "QR: " + qrLabel + "\n"
                + "Schedule: " + start + " ~ " + end + "\n"
                + "Location: " + location;
    }

    private String formatDateTime(LocalDateTime value) {
        if (value == null) return "-";
        return value.format(QR_SMS_TIME_FORMAT);
    }

    private String normalizePhone(String value) {
        if (value == null) return "";
        return value.replaceAll("[^0-9]", "");
    }

    public List<QrHistoryResponse.EventBoothVisits> getMyBoothVisitsGroupedByEvent(Long userId) {
        List<BoothVisitSummaryRow> rows = qrCheckinRepository.findMyBoothVisitSummaryRows(userId, null);
        return toEventGroups(rows);
    }

    public QrHistoryResponse.EventBoothVisits getMyBoothVisitsEvent(Long userId, Long eventId) {
        List<BoothVisitSummaryRow> rows = qrCheckinRepository.findMyBoothVisitSummaryRows(userId, eventId);
        List<QrHistoryResponse.EventBoothVisits> grouped = toEventGroups(rows);

        if (grouped.isEmpty()) {
            return QrHistoryResponse.EventBoothVisits.builder()
                    .eventId(eventId)
                    .eventName(null)
                    .booths(List.of())
                    .build();
        }
        return grouped.get(0);
    }

    private List<QrHistoryResponse.EventBoothVisits> toEventGroups(List<BoothVisitSummaryRow> rows) {
        if (rows == null || rows.isEmpty()) return List.of();

        Map<Long, QrHistoryResponse.EventBoothVisits> grouped = new LinkedHashMap<>();

        for (BoothVisitSummaryRow row : rows) {
            Long eventId = row.getEventId();

            QrHistoryResponse.EventBoothVisits group = grouped.computeIfAbsent(eventId, id ->
                    QrHistoryResponse.EventBoothVisits.builder()
                            .eventId(id)
                            .eventName(row.getEventName())
                            .booths(new ArrayList<>())
                            .build()
            );

            group.getBooths().add(mapToSummary(row));
        }

        return new ArrayList<>(grouped.values());
    }

    private QrHistoryResponse.BoothVisitSummary mapToSummary(BoothVisitSummaryRow row) {
        return QrHistoryResponse.BoothVisitSummary.builder()
                .boothId(row.getBoothId())
                .placeName(row.getPlaceName())
                .zone(row.getZone())
                .type(row.getType())
                .status(row.getStatus())
                .company(row.getCompany())
                .description(row.getDescription())
                .visitCount(row.getVisitCount() == null ? 0 : row.getVisitCount())
                .lastVisitedAt(toLocalDateTime(row.getLastVisitedAt()))
                .lastCheckType(row.getLastCheckType())
                .build();
    }

    private LocalDateTime toLocalDateTime(Timestamp ts) {
        return (ts == null) ? null : ts.toLocalDateTime();
    }

    public List<QrHistoryResponse.VisitLog> getMyBoothVisitLogs(Long userId, Long eventId, Long boothId) {
        Booth booth = boothRepository.findById(boothId)
                .orElseThrow(() -> new IllegalArgumentException("BOOTH_NOT_FOUND"));

        if (!Objects.equals(booth.getEventId(), eventId)) {
            throw new IllegalArgumentException("BOOTH_EVENT_MISMATCH");
        }

        List<QrCheckin> logs = qrCheckinRepository.findMyLogsByBooth(userId, eventId, boothId);

        return logs.stream()
                .map(log -> QrHistoryResponse.VisitLog.builder()
                        .logId(log.getLogId())
                        .checkType(log.getCheckType().name())
                        .checkedAt(log.getCheckedAt())
                        .build())
                .toList();
    }
}