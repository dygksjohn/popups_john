// file: src/main/java/com/popups/pupoo/event/application/EventRegistrationService.java
package com.popups.pupoo.event.application;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.event.domain.enums.EventStatus;
import com.popups.pupoo.event.domain.enums.RegistrationStatus;
import com.popups.pupoo.event.domain.model.Event;
import com.popups.pupoo.event.domain.model.EventRegistration;
import com.popups.pupoo.event.dto.EventRegistrationResponse;
import com.popups.pupoo.event.persistence.EventRegistrationRepository;
import com.popups.pupoo.event.persistence.EventRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 사용자용 참가 신청 서비스
 * - 중복 신청 방지: (1) exists 선체크 + (2) DB UNIQUE 위반 catch
 * - 취소: 본인 신청만 가능
 */
@Service
public class EventRegistrationService {

    private final EventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;

    public EventRegistrationService(EventRepository eventRepository,
                                    EventRegistrationRepository registrationRepository) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
    }
    
    @Transactional
    public EventRegistrationResponse apply(Long eventId, Long userId) {
        if (eventId == null || userId == null) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "eventId/userId는 필수입니다.");
        }

        // 1) 행사 존재 + 상태 검증
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EVENT_NOT_FOUND));

        // 사용자 신청 가능 상태 정책(필요시 PLANNED도 허용 등 팀 정책으로 조절)
        if (event.getStatus() != EventStatus.ONGOING && event.getStatus() != EventStatus.PLANNED) {
            throw new BusinessException(ErrorCode.EVENT_NOT_APPLICABLE);
        }

        // 2) 기존 신청 존재 시 상태 전이로 처리(재신청 지원)
        EventRegistration existing = registrationRepository.findByEventIdAndUserIdForUpdate(eventId, userId).orElse(null);
        if (existing != null) {
            // APPLIED/APPROVED면 중복 신청 금지
            if (existing.getStatus() == RegistrationStatus.APPLIED || existing.getStatus() == RegistrationStatus.APPROVED) {
                throw new BusinessException(ErrorCode.EVENT_REGISTRATION_DUPLICATE);
            }
            // CANCELLED/REJECTED면 재신청으로 상태 전이
            existing.reapply();
            return EventRegistrationResponse.from(existing);
        }

        // 3) 신규 신청 생성 (DB UNIQUE가 최종 방어)
        try {
            EventRegistration saved = registrationRepository.save(EventRegistration.create(eventId, userId));
            return EventRegistrationResponse.from(saved);
        } catch (DataIntegrityViolationException e) {
            // 동시성에서 UNIQUE 충돌 가능
            throw new BusinessException(ErrorCode.EVENT_REGISTRATION_DUPLICATE);
        }
    }

    @Transactional
    public void cancel(Long applyId, Long userId) {
        EventRegistration reg = registrationRepository.findById(applyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EVENT_REGISTRATION_NOT_FOUND));

        if (!reg.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.EVENT_REGISTRATION_ACCESS_DENIED);
        }

        if (reg.getStatus() == RegistrationStatus.CANCELLED) {
            // 멱등 처리
            return;
        }

        // 정책: 사용자 취소는 APPLIED 상태에서만 가능하다.
        if (reg.getStatus() != RegistrationStatus.APPLIED) {
            throw new BusinessException(ErrorCode.EVENT_REGISTRATION_INVALID_STATUS);
        }
        
        // 상태 변경
        reg.cancel();

        //  확정 저장 (Update SQL 강제)
        registrationRepository.save(reg);

        //  즉시 DB 반영까지 강제(디버깅/확정용)
        registrationRepository.flush();

    }

    public Page<EventRegistrationResponse> getMyRegistrations(Long userId, Pageable pageable) {
        return registrationRepository.findByUserId(userId, pageable)
                .map(EventRegistrationResponse::from);
    }
}
