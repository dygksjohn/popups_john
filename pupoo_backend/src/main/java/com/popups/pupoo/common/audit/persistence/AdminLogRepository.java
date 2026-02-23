// file: src/main/java/com/popups/pupoo/adminlog/persistence/AdminLogRepository.java
package com.popups.pupoo.common.audit.persistence;

import com.popups.pupoo.common.audit.domain.model.AdminLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminLogRepository extends JpaRepository<AdminLog, Long> {
}
