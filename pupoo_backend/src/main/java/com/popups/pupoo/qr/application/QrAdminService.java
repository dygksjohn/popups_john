package com.popups.pupoo.qr.application;

import com.popups.pupoo.booth.domain.model.Booth;
import com.popups.pupoo.booth.persistence.BoothRepository;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.qr.domain.enums.QrCheckType;
import com.popups.pupoo.qr.domain.model.QrCheckin;
import com.popups.pupoo.qr.domain.model.QrCode;
import com.popups.pupoo.qr.dto.QrCheckinResponse;
import com.popups.pupoo.qr.persistence.QrCheckinRepository;
import com.popups.pupoo.qr.persistence.QrCodeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
public class QrAdminService {
    private final QrCodeRepository qrCodeRepository;
    private final QrCheckinRepository qrCheckinRepository;
    private final BoothRepository boothRepository;

    public QrAdminService(
            QrCodeRepository qrCodeRepository,
            QrCheckinRepository qrCheckinRepository,
            BoothRepository boothRepository
    ) {
        this.qrCodeRepository = qrCodeRepository;
        this.qrCheckinRepository = qrCheckinRepository;
        this.boothRepository = boothRepository;
    }

    public QrCheckinResponse checkIn(Long eventId, Long boothId, Long qrId, Long programApplyId) {
        return saveCheckLog(eventId, boothId, qrId, QrCheckType.CHECKIN);
    }

    public QrCheckinResponse checkOut(Long eventId, Long boothId, Long qrId, Long programApplyId) {
        return saveCheckLog(eventId, boothId, qrId, QrCheckType.CHECKOUT);
    }

    private QrCheckinResponse saveCheckLog(Long eventId, Long boothId, Long qrId, QrCheckType checkType) {
        if (eventId == null || boothId == null || qrId == null) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        QrCode qr = qrCodeRepository.findById(qrId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QR_NOT_FOUND));
        Booth booth = boothRepository.findById(boothId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOTH_NOT_FOUND));

        if (!eventId.equals(booth.getEventId()) || !eventId.equals(qr.getEvent().getEventId())) {
            throw new BusinessException(ErrorCode.QR_CHECK_CONFLICT);
        }
        if (!LocalDateTime.now().isBefore(qr.getExpiredAt())) {
            throw new BusinessException(ErrorCode.QR_EXPIRED);
        }

        QrCheckin latest = qrCheckinRepository
                .findTopByQrCode_QrIdAndBooth_BoothIdOrderByCheckedAtDesc(qrId, boothId)
                .orElse(null);

        if (latest == null && checkType == QrCheckType.CHECKOUT) {
            throw new BusinessException(ErrorCode.QR_CHECK_CONFLICT);
        }
        if (latest != null && latest.getCheckType() == checkType) {
            throw new BusinessException(ErrorCode.QR_CHECK_CONFLICT);
        }

        QrCheckin saved = qrCheckinRepository.save(QrCheckin.builder()
                .qrCode(qr)
                .booth(booth)
                .checkType(checkType)
                .checkedAt(LocalDateTime.now())
                .build());

        return QrCheckinResponse.builder()
                .qrId(saved.getQrCode().getQrId())
                .boothId(saved.getBooth().getBoothId())
                .checkType(saved.getCheckType().name())
                .checkedAt(saved.getCheckedAt())
                .build();
    }
}
