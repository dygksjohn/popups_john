// 파일 위치: src/main/java/com/popups/pupoo/user/social/api/SocialAccountController.java
package com.popups.pupoo.user.social.api;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.user.social.application.SocialAccountService;
import com.popups.pupoo.user.social.dto.SocialAccountResponse;
import com.popups.pupoo.user.social.dto.SocialLinkRequest;
import com.popups.pupoo.user.social.dto.SocialUnlinkRequest;
import com.popups.pupoo.auth.security.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/social-accounts")
@RequiredArgsConstructor
public class SocialAccountController {

    private final SocialAccountService socialAccountService;
    private final SecurityUtil securityUtil;

    /**
     * 🔹 내 소셜 계정 목록 조회
     */
    @GetMapping
    public ApiResponse<List<SocialAccountResponse>> getMySocialAccounts() {
        Long userId = securityUtil.getCurrentUserId();
        List<SocialAccountResponse> result =
                socialAccountService.getMySocialAccounts(userId);
        return ApiResponse.success(result);
    }

    /**
     * 🔹 소셜 계정 연동
     */
    @PostMapping("/link")
    public ApiResponse<SocialAccountResponse> linkSocialAccount(
            @RequestBody SocialLinkRequest request
    ) {
        Long userId = securityUtil.getCurrentUserId();
        SocialAccountResponse response =
                socialAccountService.link(userId, request);
        return ApiResponse.success(response);
    }

    /**
     * 🔹 소셜 계정 해제
     */
    @DeleteMapping("/unlink")
    public ApiResponse<Void> unlinkSocialAccount(
            @RequestBody SocialUnlinkRequest request
    ) {
        Long userId = securityUtil.getCurrentUserId();
        socialAccountService.unlink(userId, request);
        return ApiResponse.success(null);
    }
}
