package com.popups.pupoo.board.bannedword.api;

import com.popups.pupoo.board.bannedword.application.ModerationPolicyAdminService;
import com.popups.pupoo.board.bannedword.dto.ActivePolicyResponse;
import com.popups.pupoo.board.bannedword.dto.PolicyUploadActivateResponse;
import com.popups.pupoo.common.api.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/moderation")
public class AdminModerationPolicyController {

    private final ModerationPolicyAdminService moderationPolicyAdminService;

    @GetMapping("/policies/active")
    public ApiResponse<ActivePolicyResponse> getActive() {
        return ApiResponse.success(moderationPolicyAdminService.getActivePolicy());
    }

    @PostMapping(value = "/policies/upload", consumes = "multipart/form-data")
    public ApiResponse<PolicyUploadActivateResponse> uploadAndActivate(
            @RequestPart("file") MultipartFile file
    ) {
        return ApiResponse.success(moderationPolicyAdminService.uploadAndActivate(file));
    }
}

