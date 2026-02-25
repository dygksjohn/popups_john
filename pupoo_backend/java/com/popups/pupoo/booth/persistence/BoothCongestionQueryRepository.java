// file: src/main/java/com/popups/pupoo/booth/persistence/BoothCongestionQueryRepository.java
package com.popups.pupoo.booth.persistence;

import java.util.Optional;

import com.popups.pupoo.booth.dto.BoothCongestionResponse;

public interface BoothCongestionQueryRepository {
    Optional<BoothCongestionResponse> findLatestByBoothId(Long boothId);
}
