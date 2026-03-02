// file: src/main/java/com/popups/pupoo/qr/persistence/QrCodeRepository.java
package com.popups.pupoo.qr.persistence;

import com.popups.pupoo.qr.domain.model.QrCode;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface QrCodeRepository extends JpaRepository<QrCode, Long> {

    Optional<QrCode> findByUser_UserIdAndEvent_EventId(Long userId, Long eventId);
}
