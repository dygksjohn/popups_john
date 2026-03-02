// file: src/main/java/com/popups/pupoo/qr/application/QrAdminService.java
package com.popups.pupoo.qr.application;

import com.popups.pupoo.booth.domain.model.Booth;
import com.popups.pupoo.booth.persistence.BoothRepository;
import com.popups.pupoo.event.domain.model.EventHistory;
import com.popups.pupoo.event.persistence.EventHistoryRepository;
import com.popups.pupoo.program.apply.domain.enums.ApplyStatus;
import com.popups.pupoo.program.apply.domain.model.ProgramApply;
import com.popups.pupoo.program.apply.domain.model.ProgramParticipationStat;
import com.popups.pupoo.program.apply.persistence.ProgramApplyRepository;
import com.popups.pupoo.program.apply.persistence.ProgramParticipationStatRepository;
import com.popups.pupoo.program.domain.model.Program;
import com.popups.pupoo.program.persistence.ProgramRepository;
import com.popups.pupoo.qr.domain.enums.QrCheckType;
import com.popups.pupoo.qr.domain.model.QrCheckin;
import com.popups.pupoo.qr.domain.model.QrCode;
import com.popups.pupoo.qr.dto.QrCheckinResponse;
import com.popups.pupoo.qr.persistence.QrCheckinRepository;
import com.popups.pupoo.qr.persistence.QrCodeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Objects;

@Service
@Transactional
public class QrAdminService {

    private final QrCodeRepository qrCodeRepository;
    private final QrCheckinRepository qrCheckinRepository;
    private final BoothRepository boothRepository;

    private final ProgramApplyRepository programApplyRepository;
    private final ProgramRepository programRepository;
    private final EventHistoryRepository eventHistoryRepository;
    private final ProgramParticipationStatRepository programParticipationStatRepository;

    public QrAdminService(QrCodeRepository qrCodeRepository,
                          QrCheckinRepository qrCheckinRepository,
                          BoothRepository boothRepository,
                          ProgramApplyRepository programApplyRepository,
                          ProgramRepository programRepository,
                          EventHistoryRepository eventHistoryRepository,
                          ProgramParticipationStatRepository programParticipationStatRepository) {
        this.qrCodeRepository = qrCodeRepository;
        this.qrCheckinRepository = qrCheckinRepository;
        this.boothRepository = boothRepository;
        this.programApplyRepository = programApplyRepository;
        this.programRepository = programRepository;
        this.eventHistoryRepository = eventHistoryRepository;
        this.programParticipationStatRepository = programParticipationStatRepository;
    }

    public QrCheckinResponse checkIn(Long eventId, Long boothId, Long qrId, Long programApplyId) {
        return process(eventId, boothId, qrId, QrCheckType.CHECKIN, programApplyId);
    }

    public QrCheckinResponse checkOut(Long eventId, Long boothId, Long qrId, Long programApplyId) {
        return process(eventId, boothId, qrId, QrCheckType.CHECKOUT, programApplyId);
    }

    private QrCheckinResponse process(Long eventId, Long boothId, Long qrId, QrCheckType type, Long programApplyId) {

        LocalDateTime now = LocalDateTime.now();

        QrCode qr = qrCodeRepository.findById(qrId)
                .orElseThrow(() -> new IllegalArgumentException("QR_NOT_FOUND"));

        if (!Objects.equals(qr.getEvent().getEventId(), eventId)) {
            throw new IllegalArgumentException("QR_EVENT_MISMATCH");
        }

        LocalDateTime activeFrom = qr.getEvent().getStartAt() == null
                ? null
                : qr.getEvent().getStartAt().minusHours(1);
        LocalDateTime expiredAt = qr.getExpiredAt() == null
                ? qr.getEvent().getEndAt()
                : qr.getExpiredAt();

        if (activeFrom != null && now.isBefore(activeFrom)) {
            throw new IllegalStateException("QR_NOT_ACTIVE_YET");
        }

        if (expiredAt != null && !now.isBefore(expiredAt)) {
            throw new IllegalStateException("QR_EXPIRED");
        }

        Booth booth = boothRepository.findById(boothId)
                .orElseThrow(() -> new IllegalArgumentException("BOOTH_NOT_FOUND"));

        if (!Objects.equals(booth.getEventId(), eventId)) {
            throw new IllegalArgumentException("BOOTH_EVENT_MISMATCH");
        }

        qrCheckinRepository.findTopByQrCode_QrIdAndBooth_BoothIdOrderByCheckedAtDesc(qrId, boothId)
                .ifPresentOrElse(last -> {
                    if (type == QrCheckType.CHECKIN && last.getCheckType() == QrCheckType.CHECKIN) {
                        throw new IllegalStateException("ALREADY_CHECKED_IN");
                    }
                    if (type == QrCheckType.CHECKOUT && last.getCheckType() == QrCheckType.CHECKOUT) {
                        throw new IllegalStateException("ALREADY_CHECKED_OUT");
                    }
                    if (type == QrCheckType.CHECKOUT && last.getCheckType() != QrCheckType.CHECKIN) {
                        throw new IllegalStateException("CHECKOUT_REQUIRES_CHECKIN");
                    }
                }, () -> {
                    if (type == QrCheckType.CHECKOUT) {
                        throw new IllegalStateException("CHECKOUT_REQUIRES_CHECKIN");
                    }
                });

        QrCheckin log = QrCheckin.builder()
                .qrCode(qr)
                .booth(booth)
                .checkType(type)
                .checkedAt(now)
                .build();

        qrCheckinRepository.save(log);

        if (type == QrCheckType.CHECKIN && programApplyId != null) {
            confirmProgramParticipation(eventId, qr, programApplyId, now);
        }

        return QrCheckinResponse.builder()
                .qrId(qrId)
                .boothId(boothId)
                .checkType(type.name())
                .checkedAt(now)
                .build();
    }

    private void confirmProgramParticipation(Long eventId, QrCode qr, Long programApplyId, LocalDateTime now) {

        ProgramApply apply = programApplyRepository.findById(programApplyId)
                .orElseThrow(() -> new IllegalArgumentException("PROGRAM_APPLY_NOT_FOUND"));

        if (!Objects.equals(apply.getUserId(), qr.getUser().getUserId())) {
            throw new IllegalArgumentException("PROGRAM_APPLY_USER_MISMATCH");
        }

        Program program = programRepository.findById(apply.getProgramId())
                .orElseThrow(() -> new IllegalArgumentException("PROGRAM_NOT_FOUND"));

        if (!Objects.equals(program.getEventId(), eventId)) {
            throw new IllegalArgumentException("PROGRAM_APPLY_EVENT_MISMATCH");
        }

        if (!(apply.getStatus() == ApplyStatus.APPROVED || apply.getStatus() == ApplyStatus.WAITING)) {
            throw new IllegalStateException("PROGRAM_APPLY_STATUS_NOT_CONFIRMABLE");
        }

        apply.markCheckedIn(now);

        EventHistory history = EventHistory.builder()
                .userId(apply.getUserId())
                .eventId(eventId)
                .programId(apply.getProgramId())
                .joinedAt(now)
                .build();
        eventHistoryRepository.save(history);

        ProgramParticipationStat stat = programParticipationStatRepository
                .findByUserIdAndProgramId(apply.getUserId(), apply.getProgramId())
                .orElseGet(() -> ProgramParticipationStat.create(apply.getUserId(), apply.getProgramId()));

        stat.increase(now);
        programParticipationStatRepository.save(stat);
    }
}
