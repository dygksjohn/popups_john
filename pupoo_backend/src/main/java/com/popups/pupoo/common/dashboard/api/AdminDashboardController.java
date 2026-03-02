package com.popups.pupoo.common.dashboard.api;

import com.popups.pupoo.booth.dto.BoothCreateRequest;
import com.popups.pupoo.booth.dto.BoothResponse;
import com.popups.pupoo.booth.dto.BoothUpdateRequest;
import com.popups.pupoo.common.dashboard.application.AdminDashboardService;
import com.popups.pupoo.common.dashboard.dto.DashboardEventResponse;
import com.popups.pupoo.common.dashboard.dto.DashboardPastEventResponse;
import com.popups.pupoo.common.dashboard.dto.DashboardProgramResponse;
import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.event.application.EventAdminService;
import com.popups.pupoo.event.dto.AdminEventCreateRequest;
import com.popups.pupoo.event.dto.AdminEventUpdateRequest;
import com.popups.pupoo.event.dto.EventResponse;
import com.popups.pupoo.program.application.ProgramAdminService;
import com.popups.pupoo.program.domain.enums.ProgramCategory;
import com.popups.pupoo.program.dto.ProgramCreateRequest;
import com.popups.pupoo.program.dto.ProgramResponse;
import com.popups.pupoo.program.dto.ProgramUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;
    private final EventAdminService eventAdminService;
    private final ProgramAdminService programAdminService;

    // ─── 행사 ────────────────────────────────
    @GetMapping("/events")
    public ApiResponse<List<DashboardEventResponse>> listEvents() {
        return ApiResponse.success(dashboardService.listEvents());
    }

    @PostMapping("/events")
    public ApiResponse<EventResponse> createEvent(@RequestBody AdminEventCreateRequest request) {
        return ApiResponse.success(eventAdminService.createEvent(request));
    }

    @PatchMapping("/events/{eventId}")
    public ApiResponse<EventResponse> updateEvent(
            @PathVariable Long eventId,
            @RequestBody AdminEventUpdateRequest request) {
        return ApiResponse.success(eventAdminService.updateEvent(eventId, request));
    }

    @DeleteMapping("/events/{eventId}")
    public ApiResponse<Map<String, Long>> deleteEvent(@PathVariable Long eventId) {
        eventAdminService.hardDeleteEvent(eventId);
        return ApiResponse.success(Map.of("deletedEventId", eventId));
    }

    @PostMapping("/events/bulk-delete")
    public ApiResponse<Map<String, Integer>> bulkDeleteEvents(@RequestBody Map<String, List<Long>> body) {
        List<Long> ids = body.getOrDefault("eventIds", List.of());
        int count = 0;
        for (Long id : ids) {
            try { eventAdminService.hardDeleteEvent(id); count++; }
            catch (Exception ignored) {}
        }
        return ApiResponse.success(Map.of("deleted", count));
    }

    // ─── 프로그램 ────────────────────────────
    @GetMapping("/programs")
    public ApiResponse<List<DashboardProgramResponse>> listPrograms() {
        return ApiResponse.success(dashboardService.listPrograms());
    }

    /** 특정 행사에 속한 프로그램 목록 */
    @GetMapping("/events/{eventId}/programs")
    public ApiResponse<List<DashboardProgramResponse>> listProgramsByEvent(
            @PathVariable Long eventId,
            @RequestParam(required = false) String category) {
        if (category != null && !category.isBlank()) {
            ProgramCategory cat = ProgramCategory.valueOf(category.toUpperCase());
            return ApiResponse.success(dashboardService.listProgramsByEventAndCategory(eventId, cat));
        }
        return ApiResponse.success(dashboardService.listProgramsByEvent(eventId));
    }

    @PostMapping("/programs")
    public ApiResponse<ProgramResponse> createProgram(@RequestBody ProgramCreateRequest request) {
        return ApiResponse.success(programAdminService.createProgram(request));
    }

    @PatchMapping("/programs/{programId}")
    public ApiResponse<ProgramResponse> updateProgram(
            @PathVariable Long programId,
            @RequestBody ProgramUpdateRequest request) {
        return ApiResponse.success(programAdminService.updateProgram(programId, request));
    }

    @DeleteMapping("/programs/{programId}")
    public ApiResponse<ProgramResponse> deleteProgram(@PathVariable Long programId) {
        return ApiResponse.success(programAdminService.deleteProgram(programId));
    }

    @PostMapping("/programs/bulk-delete")
    public ApiResponse<Map<String, Integer>> bulkDeletePrograms(@RequestBody Map<String, List<Long>> body) {
        List<Long> ids = body.getOrDefault("programIds", List.of());
        int count = 0;
        for (Long id : ids) {
            try { programAdminService.deleteProgram(id); count++; }
            catch (Exception ignored) {}
        }
        return ApiResponse.success(Map.of("deleted", count));
    }

    // ─── 부스(체험존) ────────────────────────
    /** ★ 추가: 특정 행사의 부스 목록 */
    @GetMapping("/events/{eventId}/booths")
    public ApiResponse<List<BoothResponse>> listBoothsByEvent(@PathVariable Long eventId) {
        return ApiResponse.success(dashboardService.listBoothsByEvent(eventId));
    }

    /** ★ 추가: 부스 생성 */
    @PostMapping("/booths")
    public ApiResponse<BoothResponse> createBooth(@RequestBody BoothCreateRequest request) {
        return ApiResponse.success(dashboardService.createBooth(request));
    }

    /** ★ 추가: 부스 수정 */
    @PatchMapping("/booths/{boothId}")
    public ApiResponse<BoothResponse> updateBooth(
            @PathVariable Long boothId,
            @RequestBody BoothUpdateRequest request) {
        return ApiResponse.success(dashboardService.updateBooth(boothId, request));
    }

    /** ★ 추가: 부스 삭제 */
    @DeleteMapping("/booths/{boothId}")
    public ApiResponse<Map<String, Long>> deleteBooth(@PathVariable Long boothId) {
        dashboardService.deleteBooth(boothId);
        return ApiResponse.success(Map.of("deletedBoothId", boothId));
    }

    /** ★ 추가: 부스 일괄 삭제 */
    @PostMapping("/booths/bulk-delete")
    public ApiResponse<Map<String, Integer>> bulkDeleteBooths(@RequestBody Map<String, List<Long>> body) {
        List<Long> ids = body.getOrDefault("boothIds", List.of());
        int count = 0;
        for (Long id : ids) {
            try { dashboardService.deleteBooth(id); count++; }
            catch (Exception ignored) {}
        }
        return ApiResponse.success(Map.of("deleted", count));
    }

    // ─── 지난 행사 ───────────────────────────
    @GetMapping("/past-events")
    public ApiResponse<List<DashboardPastEventResponse>> listPastEvents() {
        return ApiResponse.success(dashboardService.listPastEvents());
    }
}
