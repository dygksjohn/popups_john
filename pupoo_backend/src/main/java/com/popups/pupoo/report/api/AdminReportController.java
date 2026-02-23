// file: src/main/java/com/popups/pupoo/report/api/AdminReportController.java
package com.popups.pupoo.report.api;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.report.application.AdminReportService;
import com.popups.pupoo.report.domain.enums.ReportStatus;
import com.popups.pupoo.report.domain.enums.ReportTargetType;
import com.popups.pupoo.report.dto.AdminReportDecisionRequest;
import com.popups.pupoo.report.dto.ReportResponse;
import com.popups.pupoo.report.persistence.ContentReportRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin/reports")
public class AdminReportController {

    private final ContentReportRepository reportRepository;
    private final AdminReportService adminReportService;

    public AdminReportController(ContentReportRepository reportRepository,
                                 AdminReportService adminReportService) {
        this.reportRepository = reportRepository;
        this.adminReportService = adminReportService;
    }

    /**
     * 신고 목록(검색/페이징)
     */
    @GetMapping
    public ApiResponse<Page<ReportResponse>> list(@RequestParam(required = false) ReportStatus status,
                                                  @RequestParam(required = false) ReportTargetType targetType,
                                                  @RequestParam(required = false) Long reporterUserId,
                                                  Pageable pageable) {
        Page<com.popups.pupoo.report.domain.model.ContentReport> page = reportRepository.search(status, targetType, reporterUserId, pageable);

        // 정책: 누적 임계치(자동 블라인드)는 사용하지 않지만, 카운트는 운영 화면 정렬/정보용으로 제공한다.
        Map<String, long[]> counts = loadCounts(page.getContent());

        List<ReportResponse> items = new ArrayList<>();
        for (com.popups.pupoo.report.domain.model.ContentReport r : page.getContent()) {
            long[] c = counts.getOrDefault(key(r.getTargetType(), r.getTargetId()), new long[]{0L, 0L});
            items.add(ReportResponse.from(r, c[0], c[1]));
        }

        return ApiResponse.success(new PageImpl<>(items, pageable, page.getTotalElements()));
    }

    private Map<String, long[]> loadCounts(List<com.popups.pupoo.report.domain.model.ContentReport> reports) {
        Map<String, long[]> map = new HashMap<>();
        if (reports == null || reports.isEmpty()) return map;

        // type별로 targetId를 모아서 1번씩 group query
        Map<ReportTargetType, List<Long>> byType = new EnumMap<>(ReportTargetType.class);
        for (com.popups.pupoo.report.domain.model.ContentReport r : reports) {
            byType.computeIfAbsent(r.getTargetType(), k -> new ArrayList<>()).add(r.getTargetId());
        }

        for (Map.Entry<ReportTargetType, List<Long>> e : byType.entrySet()) {
            List<Long> ids = e.getValue().stream().distinct().toList();
            if (ids.isEmpty()) continue;

            for (ContentReportRepository.TargetCountRow row : reportRepository.countGroupedByTargetId(e.getKey(), ids)) {
                map.put(key(e.getKey(), row.getTargetId()), new long[]{row.getTotalCount(), row.getPendingCount()});
            }
        }

        return map;
    }

    private String key(ReportTargetType type, Long id) {
        return type.name() + ":" + id;
    }

    /**
     * 신고 처리(수용/거절)
     */
    @PatchMapping("/{reportId}")
    public ApiResponse<ReportResponse> decide(@PathVariable Long reportId,
                                              @Valid @RequestBody AdminReportDecisionRequest req) {
        String d = req.getDecision().trim().toUpperCase();
        if ("ACCEPT".equals(d) || "ACCEPTED".equals(d)) {
            return ApiResponse.success(adminReportService.accept(reportId, req.getReason()));
        }
        if ("REJECT".equals(d) || "REJECTED".equals(d)) {
            return ApiResponse.success(adminReportService.reject(reportId, req.getReason()));
        }
        throw new IllegalArgumentException("decision must be ACCEPT/REJECT");
    }
}
