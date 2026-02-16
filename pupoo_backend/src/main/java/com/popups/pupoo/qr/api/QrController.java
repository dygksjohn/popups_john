package com.popups.pupoo.qr.api;

import com.popups.pupoo.auth.security.util.SecurityUtil;
import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.qr.application.QrService;
import com.popups.pupoo.qr.dto.QrHistoryResponse;
import com.popups.pupoo.qr.dto.QrIssueResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class QrController {

    private final QrService qrService;
    private final SecurityUtil securityUtil;

    public QrController(QrService qrService,
                        SecurityUtil securityUtil) {
        this.qrService = qrService;
        this.securityUtil = securityUtil;
    }

    /**
     * 내 QR 조회(없으면 발급) - event_id 기준
     * GET /api/qr/me?eventId=6
     */
    @GetMapping("/qr/me")
    public ApiResponse<QrIssueResponse> getMyQr(@RequestParam(name = "eventId") Long eventId) {
        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(qrService.getMyQrOrIssue(userId, eventId));
    }

    /**
     * ✅ 내 부스 방문 목록 (이벤트별 그룹)
     * GET /api/me/booth-visits
     */
    @GetMapping("/me/booth-visits")
    public ApiResponse<List<QrHistoryResponse.EventBoothVisits>> getMyBoothVisitsGroupedByEvent() {
        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(qrService.getMyBoothVisitsGroupedByEvent(userId));
    }

    /**
     * ✅ 내 부스 방문 목록 (특정 이벤트 1개) - eventName 포함
     * GET /api/events/{eventId}/me/booth-visits
     *
     * 응답: { eventId, eventName, booths:[...] }
     * - booths[] 항목에는 company/description 포함
     */
    @GetMapping("/events/{eventId}/me/booth-visits")
    public ApiResponse<QrHistoryResponse.EventBoothVisits> getMyBoothVisits(
            @PathVariable(name = "eventId") Long eventId) {

        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(qrService.getMyBoothVisitsEvent(userId, eventId));
    }

    /**
     * 내 부스 방문 로그(여러번 기록)
     * GET /api/events/{eventId}/booths/{boothId}/me/visits
     */
    @GetMapping("/events/{eventId}/booths/{boothId}/me/visits")
    public ApiResponse<List<QrHistoryResponse.VisitLog>> getMyBoothVisitLogs(
            @PathVariable(name = "eventId") Long eventId,
            @PathVariable(name = "boothId") Long boothId) {

        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(qrService.getMyBoothVisitLogs(userId, eventId, boothId));
    }
}
