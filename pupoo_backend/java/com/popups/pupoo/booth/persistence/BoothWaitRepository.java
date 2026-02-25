// file: src/main/java/com/popups/pupoo/booth/persistence/BoothWaitRepository.java
package com.popups.pupoo.booth.persistence;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.popups.pupoo.booth.domain.model.BoothWait;

public interface BoothWaitRepository extends JpaRepository<BoothWait, Long> {
    Optional<BoothWait> findByBoothId(Long boothId);
}
