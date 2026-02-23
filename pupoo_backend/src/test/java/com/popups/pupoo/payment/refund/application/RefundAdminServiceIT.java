// src/test/java/com/popups/pupoo/payment/refund/application/RefundAdminServiceIT.java
package com.popups.pupoo.payment.refund.application;

import com.popups.pupoo.event.domain.enums.RegistrationStatus;
import com.popups.pupoo.event.domain.model.EventRegistration;
import com.popups.pupoo.event.persistence.EventRegistrationRepository;
import com.popups.pupoo.payment.domain.enums.PaymentStatus;
import com.popups.pupoo.payment.domain.model.Payment;
import com.popups.pupoo.payment.persistence.PaymentRepository;
import com.popups.pupoo.payment.port.PaymentGateway;
import com.popups.pupoo.payment.refund.domain.enums.RefundStatus;
import com.popups.pupoo.payment.refund.domain.model.Refund;
import com.popups.pupoo.payment.refund.persistence.RefundRepository;
import com.popups.pupoo.program.apply.domain.enums.ApplyStatus;
import com.popups.pupoo.program.apply.domain.model.ProgramApply;
import com.popups.pupoo.program.apply.persistence.ProgramApplyRepository;
import com.popups.pupoo.program.domain.enums.ProgramCategory;
import com.popups.pupoo.program.domain.model.Program;
import com.popups.pupoo.program.persistence.ProgramRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

@ActiveProfiles("test")
@SpringBootTest
class RefundAdminServiceIT {

    @Autowired RefundAdminService refundAdminService;

    @Autowired RefundRepository refundRepository;
    @Autowired PaymentRepository paymentRepository;

    @Autowired EventRegistrationRepository eventRegistrationRepository;
    @Autowired ProgramApplyRepository programApplyRepository;
    @Autowired ProgramRepository programRepository;

    @Autowired EntityManager em;

    @MockitoBean PaymentGateway paymentGateway;

    @Test
    @Transactional
    void approveAndComplete_should_cancel_event_and_program_applies() {
        long userId = 100L;
        long eventId = 200L;

        seedUser(userId);
        seedEvent(eventId);
        em.flush();

        Payment payment = seedApprovedPayment(userId, eventId);
        Refund refund = seedRequestedRefund(payment);

        EventRegistration reg = eventRegistrationRepository.save(EventRegistration.create(eventId, userId));
        reg.approve();

        Program program = seedProgram(eventId);
        programApplyRepository.save(ProgramApply.create(userId, program.getProgramId()));

        Mockito.when(paymentGateway.cancel(any(Payment.class))).thenReturn(true);

        refundAdminService.approveAndComplete(refund.getRefundId());
        em.flush();
        em.clear();

        Refund savedRefund = refundRepository.findById(refund.getRefundId()).orElseThrow();
        Payment savedPayment = paymentRepository.findById(payment.getPaymentId()).orElseThrow();

        assertThat(savedRefund.getStatus()).isEqualTo(RefundStatus.COMPLETED);
        assertThat(savedPayment.getStatus()).isEqualTo(PaymentStatus.REFUNDED);

        EventRegistration savedReg = eventRegistrationRepository.findById(reg.getApplyId()).orElseThrow();
        assertThat(savedReg.getStatus()).isEqualTo(RegistrationStatus.CANCELLED);

        List<ProgramApply> applies = programApplyRepository.findByUserId(userId, org.springframework.data.domain.Pageable.unpaged()).getContent();
        assertThat(applies).isNotEmpty();
        applies.forEach(a -> {
            assertThat(a.getStatus()).isEqualTo(ApplyStatus.CANCELLED);
            assertThat(a.getCancelledAt()).isNotNull();
        });

        Mockito.verify(paymentGateway, Mockito.times(1)).cancel(any(Payment.class));
    }

    @Test
    @Transactional
    void approveAndComplete_completed_should_self_heal_without_pg_call() {
        long userId = 101L;
        long eventId = 201L;

        // ✅ FK 방지: 두 번째 테스트도 반드시 시딩 필요
        seedUser(userId);
        seedEvent(eventId);
        em.flush();

        Payment payment = seedApprovedPayment(userId, eventId);
        Refund refund = seedRequestedRefund(payment);

        EventRegistration reg = eventRegistrationRepository.save(EventRegistration.create(eventId, userId));
        reg.approve();

        Program program = seedProgram(eventId);
        ProgramApply apply = programApplyRepository.save(ProgramApply.create(userId, program.getProgramId()));

        // native update 전에 PK 확보(안정)
        Long applyId = reg.getApplyId();
        Long programApplyId = apply.getProgramApplyId();

        Mockito.when(paymentGateway.cancel(any(Payment.class))).thenReturn(true);

        // 1) 정상 승인 1회 → COMPLETED + 자동 취소 완료
        refundAdminService.approveAndComplete(refund.getRefundId());
        em.flush();
        em.clear();

        // 2) 비정상 상태로 강제 회귀(자가복구 대상 만들기)
        em.createNativeQuery("""
            UPDATE event_apply
               SET status = 'APPROVED'
             WHERE apply_id = :applyId
        """)
        .setParameter("applyId", applyId)
        .executeUpdate();

        em.createNativeQuery("""
            UPDATE event_program_apply
               SET status = 'APPROVED',
                   cancelled_at = NULL
             WHERE program_apply_id = :programApplyId
        """)
        .setParameter("programApplyId", programApplyId)
        .executeUpdate();

        em.flush();
        em.clear();

        // 3) 자가복구 호출(이미 COMPLETED인 refund를 다시 호출)
        Mockito.reset(paymentGateway);
        refundAdminService.approveAndComplete(refund.getRefundId());
        em.flush();
        em.clear();

        Mockito.verify(paymentGateway, Mockito.never()).cancel(any(Payment.class));

        EventRegistration healedReg = eventRegistrationRepository.findById(applyId).orElseThrow();
        assertThat(healedReg.getStatus()).isEqualTo(RegistrationStatus.CANCELLED);

        ProgramApply healedApply = programApplyRepository.findById(programApplyId).orElseThrow();
        assertThat(healedApply.getStatus()).isEqualTo(ApplyStatus.CANCELLED);
        assertThat(healedApply.getCancelledAt()).isNotNull();
    }

    // helpers

    private Payment seedApprovedPayment(long userId, long eventId) {
        String orderNo = "ORD-TEST-" + System.nanoTime();
        Payment payment = Payment.requested(
                userId,
                eventId,
                orderNo,
                new java.math.BigDecimal("10000.00"),
                com.popups.pupoo.payment.domain.enums.PaymentProvider.KAKAOPAY
        );
        payment.markApproved();
        return paymentRepository.save(payment);
    }

    private Refund seedRequestedRefund(Payment payment) {
        Refund refund = Refund.requested(payment, payment.getAmount(), "test");
        return refundRepository.save(refund);
    }

    private Program seedProgram(long eventId) {
        return programRepository.save(
                Program.builder()
                        .eventId(eventId)
                        .category(ProgramCategory.SESSION)
                        .programTitle("test-program")
                        .description("desc")
                        .startAt(LocalDateTime.now().plusDays(1))
                        .endAt(LocalDateTime.now().plusDays(1).plusHours(1))
                        .boothId(null)
                        .createdAt(LocalDateTime.now())
                        .build()
        );
    }

    private void seedUser(long userId) {
        em.createNativeQuery("""
            INSERT INTO users
                (user_id, email, password, nickname, phone, status, role_name,
                 show_age, show_gender, show_pet,
                 created_at, last_modified_at)
            VALUES
                (:userId, :email, :pw, :nick, :phone, 'ACTIVE', 'USER',
                 0, 0, 0,
                 NOW(), NOW())
            ON DUPLICATE KEY UPDATE user_id = user_id
        """)
        .setParameter("userId", userId)
        .setParameter("email", "test" + userId + "@pupoo.io")
        .setParameter("pw", "testpw")
        .setParameter("nick", "testnick" + userId)
        .setParameter("phone", "010-0000-" + String.format("%04d", (int)(userId % 10000)))
        .executeUpdate();
    }

    private void seedEvent(long eventId) {
        em.createNativeQuery("""
            INSERT INTO event
                (event_id, event_name, description, start_at, end_at, location, status, round_no)
            VALUES
                (:eventId, :name, :desc, NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY), 'TEST', 'PLANNED', 1)
            ON DUPLICATE KEY UPDATE event_id = event_id
        """)
        .setParameter("eventId", eventId)
        .setParameter("name", "test-event-" + eventId)
        .setParameter("desc", "test")
        .executeUpdate();
    }
}
