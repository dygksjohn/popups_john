// file: src/main/java/com/popups/pupoo/common/dashboard/application/AdminDashboardRealtimeQueryService.java
package com.popups.pupoo.common.dashboard.application;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.popups.pupoo.booth.domain.model.Booth;
import com.popups.pupoo.booth.dto.BoothCongestionResponse;
import com.popups.pupoo.booth.persistence.BoothCongestionQueryRepository;
import com.popups.pupoo.booth.persistence.BoothRepository;
import com.popups.pupoo.common.dashboard.dto.AdminRealtimeCongestionResponse;
import com.popups.pupoo.common.dashboard.dto.AdminRealtimeEventListResponse;
import com.popups.pupoo.common.dashboard.dto.AdminRealtimeSummaryResponse;
import com.popups.pupoo.event.domain.enums.EventStatus;
import com.popups.pupoo.event.persistence.EventRepository;
import com.popups.pupoo.qr.persistence.QrCheckinRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardRealtimeQueryService {

    private final EventRepository eventRepository;
    private final QrCheckinRepository qrCheckinRepository;
    private final BoothRepository boothRepository;
    private final BoothCongestionQueryRepository boothCongestionQueryRepository;

    public AdminRealtimeSummaryResponse summary() {
        long planned = eventRepository.countByStatus(EventStatus.PLANNED);
        long ongoing = eventRepository.countByStatus(EventStatus.ONGOING);
        long ended = eventRepository.countByStatus(EventStatus.ENDED);
        long cancelled = eventRepository.countByStatus(EventStatus.CANCELLED);

        LocalDate today = LocalDate.now();
        LocalDateTime from = LocalDateTime.of(today, LocalTime.MIN);
        LocalDateTime to = LocalDateTime.of(today, LocalTime.MAX);
        long todayCheckin = qrCheckinRepository.countByCheckedAtBetween(from, to);

        return new AdminRealtimeSummaryResponse(planned, ongoing, ended, cancelled, todayCheckin);
    }

    public Page<AdminRealtimeEventListResponse> events(String keyword, EventStatus status, Pageable pageable) {
        return eventRepository.search(keyword, status, null, null, pageable)
                .map(e -> new AdminRealtimeEventListResponse(e.getEventId(), e.getEventName(), e.getStatus(), e.getStartAt(), e.getEndAt()));
    }

    public List<AdminRealtimeCongestionResponse> congestions(Long eventId, int limit) {
        Pageable pageable = PageRequest.of(0, Math.max(1, limit), Sort.by(Sort.Direction.ASC, "boothId"));
        List<Booth> booths = boothRepository.findEventBooths(eventId, null, null, pageable).getContent();

        return booths.stream()
                .map(b -> {
                    BoothCongestionResponse r = boothCongestionQueryRepository.findLatestByBoothId(b.getBoothId()).orElse(null);
                    if (r == null) {
                        return new AdminRealtimeCongestionResponse(b.getBoothId(), b.getPlaceName(), null, null, null);
                    }
                    return new AdminRealtimeCongestionResponse(b.getBoothId(), b.getPlaceName(), r.congestionLevel, r.measuredAt, r.programId);
                })
                .toList();
    }
}
