/* file: src/main/java/com/popups/pupoo/notice/api/NoticeController.java
 * 목적: 공지 API 컨트롤러
 */
package com.popups.pupoo.notice.api;

import com.popups.pupoo.notice.application.NoticeAdminService;
import com.popups.pupoo.notice.application.NoticeService;
import com.popups.pupoo.notice.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notices")
public class NoticeController {

    private final NoticeService noticeService;
    private final NoticeAdminService noticeAdminService;

    @GetMapping("/{noticeId}")
    public ResponseEntity<NoticeResponse> get(@PathVariable Long noticeId) {
        return ResponseEntity.ok(noticeService.get(noticeId));
    }

    @GetMapping
    public ResponseEntity<Page<NoticeResponse>> list(@RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(noticeService.list(page, size));
    }

    @PostMapping
    public ResponseEntity<NoticeResponse> create(@RequestHeader("X-ADMIN-ID") Long adminUserId,
                                                @Valid @RequestBody NoticeCreateRequest request) {
        return ResponseEntity.ok(noticeAdminService.create(adminUserId, request));
    }

    @PatchMapping("/{noticeId}")
    public ResponseEntity<NoticeResponse> update(@PathVariable Long noticeId,
                                                 @Valid @RequestBody NoticeUpdateRequest request) {
        return ResponseEntity.ok(noticeAdminService.update(noticeId, request));
    }

    @DeleteMapping("/{noticeId}")
    public ResponseEntity<Void> delete(@PathVariable Long noticeId) {
        noticeAdminService.delete(noticeId);
        return ResponseEntity.noContent().build();
    }
}
