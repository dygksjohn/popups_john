package com.popups.pupoo.qr.application;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.event.domain.model.Event;
import com.popups.pupoo.event.persistence.EventRepository;
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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class QrService {
    private final QrCodeRepository qrCodeRepository;
    private final QrCheckinRepository qrCheckinRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;

    public QrService(
            QrCodeRepository qrCodeRepository,
            QrCheckinRepository qrCheckinRepository,
            UserRepository userRepository,
            EventRepository eventRepository
    ) {
        this.qrCodeRepository = qrCodeRepository;
        this.qrCheckinRepository = qrCheckinRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
    }

    @Transactional
    public QrIssueResponse getMyQrOrIssue(Long userId, Long eventId) {
        if (userId == null || eventId == null) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        LocalDateTime now = LocalDateTime.now();
        return qrCodeRepository.findValidLatest(userId, eventId, now)
                .map(QrIssueResponse::from)
                .orElseGet(() -> issueNewQr(userId, eventId, now));
    }

    @Transactional(readOnly = true)
    public List<QrHistoryResponse.EventBoothVisits> getMyBoothVisitsGroupedByEvent(Long userId) {
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        List<BoothVisitSummaryRow> rows = qrCheckinRepository.findMyBoothVisitSummaryRows(userId, null);
        return toEventBoothVisits(rows);
    }

    @Transactional(readOnly = true)
    public QrHistoryResponse.EventBoothVisits getMyBoothVisitsEvent(Long userId, Long eventId) {
        if (userId == null || eventId == null) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        List<BoothVisitSummaryRow> rows = qrCheckinRepository.findMyBoothVisitSummaryRows(userId, eventId);
        List<QrHistoryResponse.EventBoothVisits> grouped = toEventBoothVisits(rows);
        if (!grouped.isEmpty()) {
            return grouped.get(0);
        }

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EVENT_NOT_FOUND));

        return QrHistoryResponse.EventBoothVisits.builder()
                .eventId(event.getEventId())
                .eventName(event.getEventName())
                .booths(List.of())
                .build();
    }

    @Transactional(readOnly = true)
    public List<QrHistoryResponse.VisitLog> getMyBoothVisitLogs(Long userId, Long eventId, Long boothId) {
        if (userId == null || eventId == null || boothId == null) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
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

    private QrIssueResponse issueNewQr(Long userId, Long eventId, LocalDateTime now) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EVENT_NOT_FOUND));

        LocalDateTime expiredAt = event.getEndAt() != null ? event.getEndAt().plusDays(1) : now.plusDays(1);

        QrCode newQr = QrCode.builder()
                .user(user)
                .event(event)
                .originalUrl("pupoo://qr/" + UUID.randomUUID())
                .mimeType(null)
                .issuedAt(now)
                .expiredAt(expiredAt)
                .build();

        return QrIssueResponse.from(qrCodeRepository.save(newQr));
    }

    private List<QrHistoryResponse.EventBoothVisits> toEventBoothVisits(List<BoothVisitSummaryRow> rows) {
        Map<Long, EventBoothVisitAccumulator> grouped = new LinkedHashMap<>();

        for (BoothVisitSummaryRow row : rows) {
            EventBoothVisitAccumulator acc = grouped.computeIfAbsent(
                    row.getEventId(),
                    ignored -> new EventBoothVisitAccumulator(row.getEventName())
            );

            acc.booths.add(QrHistoryResponse.BoothVisitSummary.builder()
                    .boothId(row.getBoothId())
                    .placeName(row.getPlaceName())
                    .zone(row.getZone())
                    .type(row.getType())
                    .status(row.getStatus())
                    .company(row.getCompany())
                    .description(row.getDescription())
                    .visitCount(row.getVisitCount() == null ? 0 : row.getVisitCount())
                    .lastVisitedAt(row.getLastVisitedAt() == null ? null : row.getLastVisitedAt().toLocalDateTime())
                    .lastCheckType(row.getLastCheckType())
                    .build());
        }

        return grouped.entrySet().stream()
                .map(entry -> QrHistoryResponse.EventBoothVisits.builder()
                        .eventId(entry.getKey())
                        .eventName(entry.getValue().eventName)
                        .booths(entry.getValue().booths)
                        .build())
                .toList();
    }

    private static final class EventBoothVisitAccumulator {
        private final String eventName;
        private final List<QrHistoryResponse.BoothVisitSummary> booths = new ArrayList<>();

        private EventBoothVisitAccumulator(String eventName) {
            this.eventName = eventName;
        }
    }
}
