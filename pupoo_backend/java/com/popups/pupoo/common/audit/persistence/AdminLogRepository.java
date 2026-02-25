// file: src/main/java/com/popups/pupoo/adminlog/persistence/AdminLogRepository.java
package com.popups.pupoo.common.audit.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import com.popups.pupoo.common.audit.domain.model.AdminLog;

public interface AdminLogRepository extends JpaRepository<AdminLog, Long> {
}
