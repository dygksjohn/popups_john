// file: src/main/java/com/popups/pupoo/qr/application/QrService.java
package com.popups.pupoo.qr.application;

import com.popups.pupoo.booth.domain.model.Booth;
import com.popups.pupoo.booth.persistence.BoothRepository;
import com.popups.pupoo.event.domain.model.Event;
import com.popups.pupoo.event.persistence.EventRepository;
import com.popups.pupoo.qr.domain.enums.QrMimeType;
import com.popups.pupoo.qr.domain.model.QrCheckin;
import com.popups.pupoo.qr.domain.model.QrCode;
import com.popups.pupoo.qr.dto.QrHistoryResponse;
import com.popups.pupoo.qr.dto.QrIssueResponse;
import com.popups.pupoo.qr.persistence.QrCheckinRepository;
import com.popups.pupoo.qr.persistence.QrCodeRepository;
import com.popups.pupoo.qr.persistence.projection.BoothVisitSummaryRow;
import com.popups.pupoo.user.domain.model.User;
import com.popups.pupoo.user.persistence.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
public class QrService {

    private final QrCodeRepository qrCodeRepository;
    private final QrCheckinRepository qrCheckinRepository;

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final BoothRepository boothRepository;

    public QrService(QrCodeRepository qrCodeRepository,
                     QrCheckinRepository qrCheckinRepository,
                     UserRepository userRepository,
                     EventRepository eventRepository,
                     BoothRepository boothRepository) {
        this.qrCodeRepository = qrCodeRepository;
        this.qrCheckinRepository = qrCheckinRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.boothRepository = boothRepository;
    }

    @Transactional
    public QrIssueResponse getMyQrOrIssue(Long userId, Long eventId) {
        LocalDateTime now = LocalDateTime.now();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("EVENT_NOT_FOUND"));

        LocalDateTime expiredAt = event.getEndAt();
        String qrUrl = buildQrUrl(userId, eventId);

        QrCode qrCode = qrCodeRepository.findByUser_UserIdAndEvent_EventId(userId, eventId)
                .map(existing -> {
                    existing.syncIssuePolicy(qrUrl, QrMimeType.PNG, expiredAt, now);
                    return existing;
                })
                .orElseGet(() -> QrCode.builder()
                        .user(user)
                        .event(event)
                        .originalUrl(qrUrl)
                        .mimeType(QrMimeType.PNG)
                        .issuedAt(now)
                        .expiredAt(expiredAt)
                        .build());

        QrCode saved = qrCodeRepository.save(qrCode);
        return QrIssueResponse.from(saved, now);
    }

    private String buildQrUrl(Long userId, Long eventId) {
        return "https://pupoo.io/qr/" + userId + "/" + eventId;
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
        if (rows == null || rows.isEmpty()) {
            return List.of();
        }

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
        return ts == null ? null : ts.toLocalDateTime();
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
