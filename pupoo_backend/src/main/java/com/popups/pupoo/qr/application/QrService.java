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
import com.popups.pupoo.qr.persistence.projection.BoothVisitSummaryRow;
import com.popups.pupoo.qr.persistence.QrCodeRepository;
import com.popups.pupoo.user.domain.model.User;
import com.popups.pupoo.user.persistence.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;

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

    // =========================
    // 1) 내 QR 조회/발급
    // =========================
    @Transactional
    public QrIssueResponse getMyQrOrIssue(Long userId, Long eventId) {
        LocalDateTime now = LocalDateTime.now();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("행사 없음"));

        return qrCodeRepository.findValidLatest(userId, eventId, now)
                .map(QrIssueResponse::from)
                .orElseGet(() -> {
                    LocalDateTime expiredAt = event.getEndAt().plusDays(1);

                    QrCode issued = QrCode.builder()
                            .user(user)
                            .event(event)
                            .originalUrl(buildQrUrl(userId, eventId))
                            // enum 상수는 대문자, DB 저장은 Converter가 소문자로 변환한다.
                            .mimeType(QrMimeType.PNG)
                            .issuedAt(now)
                            .expiredAt(expiredAt)
                            .build();

                    QrCode saved = qrCodeRepository.save(issued);
                    return QrIssueResponse.from(saved);
                });
    }

    private String buildQrUrl(Long userId, Long eventId) {
        return "https://pupoo.io/qr/" + userId + "/" + eventId;
    }

    // =========================
    // 2) 내 부스 방문 목록 (이벤트별 그룹)
    // =========================
    public List<QrHistoryResponse.EventBoothVisits> getMyBoothVisitsGroupedByEvent(Long userId) {
        List<BoothVisitSummaryRow> rows = qrCheckinRepository.findMyBoothVisitSummaryRows(userId, null);
        return toEventGroups(rows);
    }

    // 2-1) 내 부스 방문 목록 (특정 이벤트 1개) - eventName 포함
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

        for (BoothVisitSummaryRow r : rows) {
            Long eventId = r.getEventId();

            QrHistoryResponse.EventBoothVisits group = grouped.computeIfAbsent(eventId, id ->
                    QrHistoryResponse.EventBoothVisits.builder()
                            .eventId(id)
                            .eventName(r.getEventName())
                            .booths(new ArrayList<>())
                            .build()
            );

            group.getBooths().add(mapToSummary(r));
        }

        return new ArrayList<>(grouped.values());
    }

    private QrHistoryResponse.BoothVisitSummary mapToSummary(BoothVisitSummaryRow r) {
        return QrHistoryResponse.BoothVisitSummary.builder()
                .boothId(r.getBoothId())
                .placeName(r.getPlaceName())
                .zone(r.getZone())
                .type(r.getType())
                .status(r.getStatus())
                .company(r.getCompany())
                .description(r.getDescription())
                .visitCount(r.getVisitCount() == null ? 0 : r.getVisitCount())
                .lastVisitedAt(toLocalDateTime(r.getLastVisitedAt()))
                .lastCheckType(r.getLastCheckType())
                .build();
    }

    private LocalDateTime toLocalDateTime(Timestamp ts) {
        return (ts == null) ? null : ts.toLocalDateTime();
    }

    // =========================
    // 3) 내 부스 방문 로그
    // =========================
    public List<QrHistoryResponse.VisitLog> getMyBoothVisitLogs(Long userId, Long eventId, Long boothId) {

        Booth booth = boothRepository.findById(boothId)
                .orElseThrow(() -> new IllegalArgumentException("부스 없음"));

        // Booth는 eventId(Long) 구조이므로 이걸로 검증
        if (!Objects.equals(booth.getEventId(), eventId)) {
            throw new IllegalArgumentException("부스가 해당 행사 소속이 아님");
        }

        List<QrCheckin> logs = qrCheckinRepository.findMyLogsByBooth(userId, eventId, boothId);

        return logs.stream()
                .map(l -> QrHistoryResponse.VisitLog.builder()
                        .logId(l.getLogId())
                        .checkType(l.getCheckType().name())
                        .checkedAt(l.getCheckedAt())
                        .build())
                .toList();
    }
}