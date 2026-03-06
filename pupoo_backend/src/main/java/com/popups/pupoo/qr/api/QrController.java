// file: src/main/java/com/popups/pupoo/qr/api/QrController.java
package com.popups.pupoo.qr.api;

import com.popups.pupoo.auth.security.util.SecurityUtil;
import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.qr.application.QrService;
import com.popups.pupoo.qr.dto.QrHistoryResponse;
import com.popups.pupoo.qr.dto.QrIssueResponse;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

    @GetMapping("/qr/me/download")
    public ResponseEntity<byte[]> downloadMyQr(@RequestParam(name = "eventId") Long eventId) {
        Long userId = securityUtil.currentUserId();
        QrService.QrDownloadResult result = qrService.downloadMyQr(userId, eventId);

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(result.contentType());
        } catch (IllegalArgumentException e) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(result.bytes().length)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(result.filename(), StandardCharsets.UTF_8)
                                .build()
                                .toString()
                )
                .body(result.bytes());
    }

    /**
     * 내 QR 문자 발송 테스트(로컬 시뮬레이션)
     * POST /api/qr/me/sms-test
     */
    @PostMapping("/qr/me/sms-test")
    public ApiResponse<Map<String, Object>> sendMyQrSmsTest(
            @RequestBody QrSmsTestRequest request
    ) {
        Long userId = securityUtil.currentUserId();
        QrIssueResponse qr = qrService.getMyQrOrIssue(userId, request.getEventId());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "SIMULATED");
        result.put("eventId", request.getEventId());
        result.put("qrId", qr.getQrId());
        result.put("phone", request.getPhone());
        result.put("message", request.getMessage());
        result.put("requestedAt", LocalDateTime.now());
        return ApiResponse.success(result);
    }

    /**
     *  내 부스 방문 목록 (이벤트별 그룹)
     * GET /api/me/booth-visits
     */
    @GetMapping("/me/booth-visits")
    public ApiResponse<List<QrHistoryResponse.EventBoothVisits>> getMyBoothVisitsGroupedByEvent() {
        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(qrService.getMyBoothVisitsGroupedByEvent(userId));
    }

    /**
     *  내 부스 방문 목록 (특정 이벤트 1개) - eventName 포함
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

    public static class QrSmsTestRequest {
        private Long eventId;
        private String phone;
        private String message;

        public Long getEventId() {
            return eventId;
        }

        public void setEventId(Long eventId) {
            this.eventId = eventId;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
