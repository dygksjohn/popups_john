// file: src/main/java/com/popups/pupoo/notification/persistence/NotificationSendRepository.java
package com.popups.pupoo.notification.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import com.popups.pupoo.notification.domain.model.NotificationSend;

public interface NotificationSendRepository extends JpaRepository<NotificationSend, Long> {
}
