// file: src/main/java/com/popups/pupoo/report/api/AdminReportController.java
package com.popups.pupoo.report.api;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.report.application.AdminReportService;
import com.popups.pupoo.report.domain.enums.ReportStatus;
import com.popups.pupoo.report.domain.enums.ReportTargetType;
import com.popups.pupoo.report.dto.AdminReportDecisionRequest;
import com.popups.pupoo.report.dto.AdminReportDetailResponse;
import com.popups.pupoo.report.dto.ReportResponse;
import com.popups.pupoo.report.persistence.ContentReportRepository;
import com.popups.pupoo.board.post.persistence.PostRepository;
import com.popups.pupoo.gallery.persistence.GalleryRepository;
import com.popups.pupoo.board.review.persistence.ReviewRepository;
import com.popups.pupoo.reply.persistence.PostCommentRepository;
import com.popups.pupoo.reply.persistence.ReviewCommentRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin/reports")
public class AdminReportController {

    private final ContentReportRepository reportRepository;
    private final AdminReportService adminReportService;
    private final PostRepository postRepository;
    private final GalleryRepository galleryRepository;
    private final ReviewRepository reviewRepository;
    private final PostCommentRepository postCommentRepository;
    private final ReviewCommentRepository reviewCommentRepository;

    public AdminReportController(ContentReportRepository reportRepository,
                                 AdminReportService adminReportService,
                                 PostRepository postRepository,
                                 GalleryRepository galleryRepository,
                                 ReviewRepository reviewRepository,
                                 PostCommentRepository postCommentRepository,
                                 ReviewCommentRepository reviewCommentRepository) {
        this.reportRepository = reportRepository;
        this.adminReportService = adminReportService;
        this.postRepository = postRepository;
        this.galleryRepository = galleryRepository;
        this.reviewRepository = reviewRepository;
        this.postCommentRepository = postCommentRepository;
        this.reviewCommentRepository = reviewCommentRepository;
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

    /**
     * 신고 상세
     * - 정책(A): 신고 대상의 현재 상태(targetStatus)를 포함한다.
     */
    @GetMapping("/{reportId}")
    public ApiResponse<AdminReportDetailResponse> detail(@PathVariable Long reportId) {
        com.popups.pupoo.report.domain.model.ContentReport r = reportRepository.findById(reportId)
                .orElseThrow(() -> new com.popups.pupoo.common.exception.BusinessException(com.popups.pupoo.common.exception.ErrorCode.RESOURCE_NOT_FOUND));

        String targetStatus = resolveTargetStatus(r.getTargetType(), r.getTargetId());
        return ApiResponse.success(AdminReportDetailResponse.from(r, targetStatus));
    }

    private String resolveTargetStatus(ReportTargetType type, Long targetId) {
        if (type == null || targetId == null) return "UNKNOWN";

        if (type == ReportTargetType.POST) {
            return postRepository.findById(targetId)
                    .map(p -> p.getStatus().name())
                    .orElse("DELETED");
        }

        if (type == ReportTargetType.REVIEW) {
            return reviewRepository.findById(targetId)
                    .map(rv -> rv.getReviewStatus().name())
                    .orElse("DELETED");
        }

        if (type == ReportTargetType.GALLERY) {
            return galleryRepository.findById(targetId)
                    .map(g -> g.getGalleryStatus().name())
                    .orElse("DELETED");
        }

        if (type == ReportTargetType.POST_COMMENT) {
            return postCommentRepository.findById(targetId)
                    .map(c -> c.isDeleted() ? "DELETED" : "ACTIVE")
                    .orElse("DELETED");
        }

        if (type == ReportTargetType.REVIEW_COMMENT) {
            return reviewCommentRepository.findById(targetId)
                    .map(c -> c.isDeleted() ? "DELETED" : "ACTIVE")
                    .orElse("DELETED");
        }

        return "UNKNOWN";
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
