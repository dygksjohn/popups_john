// file: src/main/java/com/popups/pupoo/admin/analytics/application/AdminAnalyticsQueryService.java
package com.popups.pupoo.admin.analytics.application;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.popups.pupoo.common.dashboard.analytics.dto.AdminCongestionByHourResponse;
import com.popups.pupoo.common.dashboard.analytics.dto.AdminEventPerformanceResponse;
import com.popups.pupoo.common.dashboard.analytics.dto.AdminYearlyCompareResponse;
import com.popups.pupoo.common.dashboard.analytics.persistence.AdminAnalyticsQueryRepository;
import com.popups.pupoo.event.domain.enums.RegistrationStatus;
import com.popups.pupoo.event.persistence.EventRegistrationRepository;
import com.popups.pupoo.event.persistence.EventRepository;
import com.popups.pupoo.qr.persistence.QrCheckinRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminAnalyticsQueryService {

    private final EventRepository eventRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final QrCheckinRepository qrCheckinRepository;
    private final AdminAnalyticsQueryRepository adminAnalyticsQueryRepository;

    /**
     * 지난 행사 통계(행사별 성과)
     */
    public List<AdminEventPerformanceResponse> eventPerformance(LocalDateTime fromAt, LocalDateTime toAt, Pageable pageable) {
        return eventRepository.search(null, null, fromAt, toAt, pageable)
                .map(e -> {
                    long approved = eventRegistrationRepository.countByEventIdAndStatus(e.getEventId(), RegistrationStatus.APPROVED);
                    long checkins = qrCheckinRepository.countByQrCode_Event_EventId(e.getEventId());
                    return new AdminEventPerformanceResponse(e.getEventId(), e.getEventName(), approved, checkins);
                })
                .getContent();
    }

    public List<AdminCongestionByHourResponse> congestionByHour(Long eventId) {
        return adminAnalyticsQueryRepository.findAvgCongestionByHour(eventId);
    }

    /**
     * 연도별 비교(간단 집계)
     */
    public List<AdminYearlyCompareResponse> yearlyCompare(int fromYear, int toYear) {
        return java.util.stream.IntStream.rangeClosed(fromYear, toYear)
                .mapToObj(y -> {
                    LocalDateTime from = LocalDateTime.of(y, 1, 1, 0, 0);
                    LocalDateTime to = LocalDateTime.of(y, 12, 31, 23, 59);
                    long eventCount = eventRepository.search(null, null, from, to, Pageable.unpaged()).getTotalElements();
                    // 승인 건수는 이벤트별 합산이 필요하므로, 현재는 0으로 제공(대시보드 성능/정확도 개선 작업에서 확장)
                    return new AdminYearlyCompareResponse(y, eventCount, 0);
                })
                .toList();
    }
}
