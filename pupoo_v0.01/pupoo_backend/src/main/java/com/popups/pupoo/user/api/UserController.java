// src/main/java/com/popups/pupoo/user/api/UserController.java
package com.popups.pupoo.user.api;

import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.auth.dto.LoginResponse;
import com.popups.pupoo.user.application.UserService;
import com.popups.pupoo.user.dto.UserCreateRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * 회원가입 (EMAIL 변경 불가 정책)
     * ✅ 가입 후 자동 로그인 ON
     * - accessToken: body
     * - refreshToken: HttpOnly 쿠키
     */
    @PostMapping
    public ApiResponse<LoginResponse> create(@RequestBody UserCreateRequest req, HttpServletResponse response) {
        return ApiResponse.success(userService.create(req, response));
    }
}
