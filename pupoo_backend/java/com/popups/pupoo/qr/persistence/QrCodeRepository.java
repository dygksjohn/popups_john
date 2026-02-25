// file: src/main/java/com/popups/pupoo/qr/persistence/QrCodeRepository.java
package com.popups.pupoo.qr.persistence;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.popups.pupoo.qr.domain.model.QrCode;

public interface QrCodeRepository extends JpaRepository<QrCode, Long> {

    @Query("""
        select q
        from QrCode q
        where q.user.userId = :userId
          and q.event.eventId = :eventId
          and q.expiredAt > :now
        order by q.issuedAt desc
    """)
    Optional<QrCode> findValidLatest(
            @Param("userId") Long userId,
            @Param("eventId") Long eventId,
            @Param("now") LocalDateTime now
    );

    @Query("""
        select q
        from QrCode q
        where q.user.userId = :userId
          and q.event.eventId = :eventId
        order by q.issuedAt desc
    """)
    Optional<QrCode> findLatest(
            @Param("userId") Long userId,
            @Param("eventId") Long eventId
    );
}
