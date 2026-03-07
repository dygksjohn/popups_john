package com.popups.pupoo.common.audit.application;

import com.popups.pupoo.common.api.PageResponse;
import com.popups.pupoo.common.audit.domain.enums.AdminTargetType;
import com.popups.pupoo.common.audit.domain.model.AdminLog;
import com.popups.pupoo.common.audit.dto.AdminLogListResponse;
import com.popups.pupoo.common.audit.persistence.AdminLogRepository;
import com.popups.pupoo.user.domain.model.User;
import com.popups.pupoo.user.persistence.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminLogQueryService {

    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 100;

    private final AdminLogRepository adminLogRepository;
    private final UserRepository userRepository;

    public PageResponse<AdminLogListResponse> list(String keyword, AdminTargetType targetType, int page, int size) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                normalizeSize(size),
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("logId"))
        );

        Page<AdminLog> logPage = adminLogRepository.search(normalizeKeyword(keyword), targetType, pageable);
        Map<Long, User> adminUserMap = userRepository.findAllById(
                        logPage.getContent().stream()
                                .map(AdminLog::getAdminId)
                                .filter(id -> id != null)
                                .distinct()
                                .collect(Collectors.toList())
                ).stream()
                .collect(Collectors.toMap(User::getUserId, Function.identity()));

        Page<AdminLogListResponse> responsePage = logPage.map(
                log -> AdminLogListResponse.from(log, adminUserMap.get(log.getAdminId()))
        );
        return PageResponse.from(responsePage);
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null) {
            return null;
        }

        String trimmed = keyword.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private int normalizeSize(int size) {
        if (size <= 0) {
            return DEFAULT_SIZE;
        }
        return Math.min(size, MAX_SIZE);
    }
}
