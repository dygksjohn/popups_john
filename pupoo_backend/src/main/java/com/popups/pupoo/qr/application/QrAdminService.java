package com.popups.pupoo.qr.application;

import com.popups.pupoo.booth.domain.model.Booth;
import com.popups.pupoo.booth.persistence.BoothRepository;
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

    public QrAdminService(QrCodeRepository qrCodeRepository,
                          QrCheckinRepository qrCheckinRepository,
                          BoothRepository boothRepository) {
        this.qrCodeRepository = qrCodeRepository;
        this.qrCheckinRepository = qrCheckinRepository;
        this.boothRepository = boothRepository;
    }

    public QrCheckinResponse checkIn(Long eventId, Long boothId, Long qrId) {
        return process(eventId, boothId, qrId, QrCheckType.CHECKIN);
    }

    public QrCheckinResponse checkOut(Long eventId, Long boothId, Long qrId) {
        return process(eventId, boothId, qrId, QrCheckType.CHECKOUT);
    }

    private QrCheckinResponse process(Long eventId, Long boothId, Long qrId, QrCheckType type) {

        LocalDateTime now = LocalDateTime.now();

        // 1) QR 존재 + 이벤트 정합
        QrCode qr = qrCodeRepository.findById(qrId)
                .orElseThrow(() -> new IllegalArgumentException("QR_NOT_FOUND"));

        if (!Objects.equals(qr.getEvent().getEventId(), eventId)) {
            throw new IllegalArgumentException("QR_EVENT_MISMATCH");
        }

        // 2) 만료 체크
        if (qr.getExpiredAt() != null && qr.getExpiredAt().isBefore(now)) {
            throw new IllegalStateException("QR_EXPIRED");
        }

        // 3) 부스 존재 + 이벤트 정합
        Booth booth = boothRepository.findById(boothId)
                .orElseThrow(() -> new IllegalArgumentException("BOOTH_NOT_FOUND"));

        if (!Objects.equals(booth.getEventId(), eventId)) {
            throw new IllegalArgumentException("BOOTH_EVENT_MISMATCH");
        }

        // 4) 연속 동일 상태 방지(같은 booth에서 연속 CHECKIN/CHECKOUT)
        qrCheckinRepository.findTopByQrCode_QrIdAndBooth_BoothIdOrderByCheckedAtDesc(qrId, boothId)
        .ifPresentOrElse(last -> {

            // 1) CHECKIN 요청인데 직전이 CHECKIN이면 방지
            if (type == QrCheckType.CHECKIN && last.getCheckType() == QrCheckType.CHECKIN) {
                throw new IllegalStateException("ALREADY_CHECKED_IN");
            }

            // 2) CHECKOUT 요청인데 직전이 CHECKOUT이면 방지
            if (type == QrCheckType.CHECKOUT && last.getCheckType() == QrCheckType.CHECKOUT) {
                throw new IllegalStateException("ALREADY_CHECKED_OUT");
            }

            //  3) CHECKOUT은 직전이 반드시 CHECKIN이어야 함 (정책)
            if (type == QrCheckType.CHECKOUT && last.getCheckType() != QrCheckType.CHECKIN) {
                throw new IllegalStateException("CHECKOUT_REQUIRES_CHECKIN");
            }

        }, () -> {

            //  마지막 로그가 아예 없는데 CHECKOUT이면 불가 (정책)
            if (type == QrCheckType.CHECKOUT) {
                throw new IllegalStateException("CHECKOUT_REQUIRES_CHECKIN");
            }

            // 마지막 로그가 없고 CHECKIN이면 허용
        });


        // (선택) CHECKOUT 전에 CHECKIN 필수 정책 넣고 싶으면 여기서 last 상태 검사 추가

        // 5) 로그 저장
        QrCheckin log = QrCheckin.builder()
                .qrCode(qr)
                .booth(booth)
                .checkType(type)
                .checkedAt(now)
                .build();

        qrCheckinRepository.save(log);

        return QrCheckinResponse.builder()
                .qrId(qrId)
                .boothId(boothId)
                .checkType(type.name())
                .checkedAt(now)
                .build();
    }
}
