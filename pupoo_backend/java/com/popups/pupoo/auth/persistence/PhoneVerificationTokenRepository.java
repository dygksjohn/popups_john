// file: src/main/java/com/popups/pupoo/auth/persistence/PhoneVerificationTokenRepository.java
package com.popups.pupoo.auth.persistence;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.popups.pupoo.auth.domain.model.PhoneVerificationToken;

public interface PhoneVerificationTokenRepository extends JpaRepository<PhoneVerificationToken, Long> {

    Optional<PhoneVerificationToken> findTopByUserIdAndPhoneAndUsedAtIsNullOrderByCreatedAtDesc(Long userId, String phone);

    long countByUserIdAndCreatedAtAfter(Long userId, LocalDateTime after);
}
