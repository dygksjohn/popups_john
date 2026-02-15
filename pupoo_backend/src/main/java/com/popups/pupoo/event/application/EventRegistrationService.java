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
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REQUEST, "존재하지 않는 행사입니다. eventId=" + eventId));

        // 사용자 신청 가능 상태 정책(필요시 PLANNED도 허용 등 팀 정책으로 조절)
        if (event.getStatus() != EventStatus.ONGOING && event.getStatus() != EventStatus.PLANNED) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "현재 신청 가능한 행사가 아닙니다. status=" + event.getStatus());
        }

        // 2) 중복 신청 선체크 (APPLIED 상태만 중복으로 본다)
        boolean alreadyApplied = registrationRepository.existsByEventIdAndUserIdAndStatus(
                eventId, userId, RegistrationStatus.APPLIED
        );
        if (alreadyApplied) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "이미 참가 신청한 행사입니다.");
        }

        try {
            // 3) 저장 (DB UNIQUE가 최종 방어)
            EventRegistration saved = registrationRepository.save(EventRegistration.create(eventId, userId));
            return EventRegistrationResponse.from(saved);

        } catch (DataIntegrityViolationException e) {
            // 동시성(거의 동시에 2번 신청)에서 exists를 통과할 수 있으므로 최종 캐치
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "이미 참가 신청한 행사입니다.");
        }
    }

    @Transactional
    public void cancel(Long applyId, Long userId) {
        EventRegistration reg = registrationRepository.findById(applyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REQUEST, "존재하지 않는 신청입니다. applyId=" + applyId));

        if (!reg.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "본인 신청만 취소할 수 있습니다.");
        }

        if (reg.getStatus() == RegistrationStatus.CANCELLED) {
            // 멱등 처리
            return;
        }

        // 정책상 APPLIED만 취소 가능(필요시 APPROVED도 취소 허용 등 조절)
        if (reg.getStatus() != RegistrationStatus.APPLIED) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "현재 상태에서는 취소할 수 없습니다. status=" + reg.getStatus());
        }
        
     // 상태 변경
        reg.cancel();

        // ✅ 확정 저장 (Update SQL 강제)
        registrationRepository.save(reg);

        // ✅ 즉시 DB 반영까지 강제(디버깅/확정용)
        registrationRepository.flush();

    }

    public Page<EventRegistrationResponse> getMyRegistrations(Long userId, Pageable pageable) {
        return registrationRepository.findByUserId(userId, pageable)
                .map(EventRegistrationResponse::from);
    }
}
