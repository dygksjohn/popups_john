// file: src/main/java/com/popups/pupoo/user/application/UserAdminService.java
package com.popups.pupoo.user.application;

import com.popups.pupoo.common.audit.application.AdminLogService;
import com.popups.pupoo.common.audit.domain.enums.AdminTargetType;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.user.domain.enums.RoleName;
import com.popups.pupoo.user.domain.enums.UserStatus;
import com.popups.pupoo.user.domain.model.User;
import com.popups.pupoo.user.dto.AdminUserUpdateRequest;
import com.popups.pupoo.user.dto.UserCreateRequest;
import com.popups.pupoo.user.dto.UserResponse;
import com.popups.pupoo.user.dto.UserSearchRequest;
import com.popups.pupoo.user.persistence.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 관리자용 사용자 관리 서비스
 *
 * 정책
 * - 유저 탈퇴는 soft delete(status=INACTIVE)
 * - 유저 정지/해제는 status=SUSPENDED/ACTIVE
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserAdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminLogService adminLogService;

    public Page<UserResponse> list(UserSearchRequest cond, Pageable pageable) {
        String keyword = (cond == null ? null : trimToNull(cond.getKeyword()));
        UserStatus status = (cond == null ? null : cond.getStatus());
        return userRepository.search(status, keyword, pageable).map(UserResponse::from);
    }

    public UserResponse get(Long userId) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "사용자가 존재하지 않습니다."));
        return UserResponse.from(u);
    }

    @Transactional
    public UserResponse create(UserCreateRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "이미 존재하는 이메일입니다.");
        }
        if (userRepository.existsByPhone(req.getPhone())) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "이미 존재하는 전화번호입니다.");
        }
        if (userRepository.existsByNickname(req.getNickname())) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "이미 존재하는 닉네임입니다.");
        }

        User u = new User();
        u.setEmail(req.getEmail());
        u.setPassword(passwordEncoder.encode(req.getPassword()));
        u.setNickname(req.getNickname());
        u.setPhone(req.getPhone());

        u.setStatus(UserStatus.ACTIVE);
        u.setRoleName(RoleName.USER);

        u.setShowAge(req.isShowAge());
        u.setShowGender(req.isShowGender());
        u.setShowPet(req.isShowPet());

        User saved = userRepository.save(u);
        adminLogService.write("USER_CREATE", AdminTargetType.USER, saved.getUserId());
        return UserResponse.from(saved);
    }

    @Transactional
    public UserResponse update(Long userId, AdminUserUpdateRequest req) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "사용자가 존재하지 않습니다."));

        if (req.getNickname() != null && !req.getNickname().isBlank()) {
            if (!req.getNickname().equals(u.getNickname()) && userRepository.existsByNickname(req.getNickname())) {
                throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "이미 존재하는 닉네임입니다.");
            }
            u.setNickname(req.getNickname());
        }

        if (req.getPhone() != null && !req.getPhone().isBlank()) {
            if (!req.getPhone().equals(u.getPhone()) && userRepository.existsByPhone(req.getPhone())) {
                throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "이미 존재하는 전화번호입니다.");
            }
            u.setPhone(req.getPhone());
        }

        if (req.getStatus() != null) {
            u.setStatus(req.getStatus());
        }
        if (req.getShowAge() != null) u.setShowAge(req.getShowAge());
        if (req.getShowGender() != null) u.setShowGender(req.getShowGender());
        if (req.getShowPet() != null) u.setShowPet(req.getShowPet());

        adminLogService.write("USER_UPDATE", AdminTargetType.USER, userId);
        return UserResponse.from(u);
    }

    @Transactional
    public void delete(Long userId) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "사용자가 존재하지 않습니다."));

        // 정책: soft delete
        u.setStatus(UserStatus.INACTIVE);
        adminLogService.write("USER_DELETE_SOFT", AdminTargetType.USER, userId);
    }

    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
