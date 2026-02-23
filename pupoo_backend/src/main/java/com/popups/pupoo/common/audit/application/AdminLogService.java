// file: src/main/java/com/popups/pupoo/adminlog/application/AdminLogService.java
package com.popups.pupoo.common.audit.application;

import com.popups.pupoo.common.audit.domain.enums.AdminTargetType;
import com.popups.pupoo.common.audit.domain.model.AdminLog;
import com.popups.pupoo.common.audit.persistence.AdminLogRepository;
import com.popups.pupoo.auth.security.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 관리자 작업 로그 적재 서비스.
 * 주의: 운영 안정성을 위해 로그 적재 실패가 본 기능을 막지 않도록 한다.
 */
@Service
@RequiredArgsConstructor
public class AdminLogService {

    private final AdminLogRepository adminLogRepository;
    private final SecurityUtil securityUtil;

    @Transactional
    public void write(String action, AdminTargetType targetType, Long targetId) {
        try {
            Long adminId = securityUtil.currentUserId();
            adminLogRepository.save(AdminLog.builder()
                    .adminId(adminId)
                    .action(action)
                    .targetType(targetType)
                    .targetId(targetId)
                    .build());
        } catch (Exception ignored) {
            // 운영 감사 로그는 중요하지만, 로그 적재 실패가 본 기능을 실패시키면 운영 장애가 된다.
        }
    }
}
