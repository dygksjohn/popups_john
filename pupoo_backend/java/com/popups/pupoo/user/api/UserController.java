// file: src/main/java/com/popups/pupoo/user/api/UserController.java
package com.popups.pupoo.user.api;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.popups.pupoo.auth.security.util.SecurityUtil;
import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.MessageResponse;
import com.popups.pupoo.user.application.UserService;
import com.popups.pupoo.user.dto.UserMeResponse;
import com.popups.pupoo.user.dto.UserUpdateRequest;

import lombok.RequiredArgsConstructor;

/**
 * 사용자 리소스 전용 컨트롤러
 * - 인증/토큰 발급은 AuthController에서 처리한다.
 * - 여기서는 로그인된 사용자 정보 조회/수정/탈퇴만 담당한다.
 */
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final SecurityUtil securityUtil;

    /**
     * 현재 로그인 사용자 정보 조회
     */
    @GetMapping("/me")
    public ApiResponse<UserMeResponse> getMe() {
        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(userService.getMe(userId));
    }

    /**
     * 현재 로그인 사용자 정보 수정
     * - phone은 본인인증 후 별도 플로우에서만 변경 가능하므로 여기서는 수정하지 않는다.
     */
    @PatchMapping("/me")
    public ApiResponse<UserMeResponse> updateMe(@RequestBody UserUpdateRequest req) {
        Long userId = securityUtil.currentUserId();
        return ApiResponse.success(userService.updateMe(userId, req));
    }

    /**
     * 현재 로그인 사용자 탈퇴 처리
     * - 정책: soft delete (status 변경)
     */
    @DeleteMapping("/me")
    public ApiResponse<MessageResponse> deleteMe() {
        Long userId = securityUtil.currentUserId();
        userService.deleteMe(userId);
        return ApiResponse.success(new MessageResponse("USER_DEACTIVATED"));
    }
}
