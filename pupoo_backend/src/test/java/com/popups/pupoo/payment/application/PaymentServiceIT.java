package com.popups.pupoo.payment.application;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.event.domain.enums.RegistrationStatus;
import com.popups.pupoo.event.domain.model.EventRegistration;
import com.popups.pupoo.event.persistence.EventRegistrationRepository;
import com.popups.pupoo.payment.domain.enums.PaymentProvider;
import com.popups.pupoo.payment.domain.enums.PaymentStatus;
import com.popups.pupoo.payment.domain.model.Payment;
import com.popups.pupoo.payment.domain.model.PaymentTransaction;
import com.popups.pupoo.payment.persistence.PaymentRepository;
import com.popups.pupoo.payment.persistence.PaymentTransactionRepository;
import com.popups.pupoo.payment.port.PaymentGateway;
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
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;

@ActiveProfiles("test")
@SpringBootTest
class PaymentServiceIT {

    @Autowired PaymentService paymentService;
    @Autowired PaymentRepository paymentRepository;
    @Autowired PaymentTransactionRepository paymentTransactionRepository;
    @Autowired EventRegistrationRepository eventRegistrationRepository;
    @Autowired ProgramApplyRepository programApplyRepository;
    @Autowired ProgramRepository programRepository;
    @Autowired EntityManager em;

    @MockitoBean PaymentGateway paymentGateway;

    @Test
    @Transactional
    void cancelMyPayment_should_cancel_event_and_program_applies() {
        long userId = 31001L;
        long eventId = 41001L;

        seedUser(userId);
        seedEvent(eventId, LocalDateTime.now().plusDays(1), LocalDateTime.now().plusDays(2));
        em.flush();

        EventRegistration reg = eventRegistrationRepository.save(EventRegistration.create(eventId, userId));
        reg.approve();
        Long applyId = reg.getApplyId();

        Payment payment = seedApprovedPayment(userId, eventId, applyId);
        seedApprovedTx(payment.getPaymentId());

        Program program = seedProgram(eventId);
        ProgramApply programApply = programApplyRepository.save(ProgramApply.create(userId, program.getProgramId(), null, null));
        Long programApplyId = programApply.getProgramApplyId();

        Mockito.when(paymentGateway.cancel(any(Payment.class))).thenReturn(true);

        paymentService.cancelMyPayment(userId, payment.getPaymentId());
        em.flush();
        em.clear();

        Payment savedPayment = paymentRepository.findById(payment.getPaymentId()).orElseThrow();
        EventRegistration savedReg = eventRegistrationRepository.findById(applyId).orElseThrow();
        ProgramApply savedProgramApply = programApplyRepository.findById(programApplyId).orElseThrow();

        assertThat(savedPayment.getStatus()).isEqualTo(PaymentStatus.CANCELLED);
        assertThat(savedReg.getStatus()).isEqualTo(RegistrationStatus.CANCELLED);
        assertThat(savedProgramApply.getStatus()).isEqualTo(ApplyStatus.CANCELLED);
        assertThat(savedProgramApply.getCancelledAt()).isNotNull();

        Mockito.verify(paymentGateway, Mockito.times(1)).cancel(any(Payment.class));
    }

    @Test
    @Transactional
    void cancelMyPayment_when_event_already_started_should_fail_and_keep_statuses() {
        long userId = 31002L;
        long eventId = 41002L;

        seedUser(userId);
        seedEvent(eventId, LocalDateTime.now().minusHours(2), LocalDateTime.now().plusHours(2));
        em.flush();

        EventRegistration reg = eventRegistrationRepository.save(EventRegistration.create(eventId, userId));
        reg.approve();
        Long applyId = reg.getApplyId();

        Payment payment = seedApprovedPayment(userId, eventId, applyId);
        seedApprovedTx(payment.getPaymentId());

        Program program = seedProgram(eventId);
        ProgramApply programApply = programApplyRepository.save(ProgramApply.create(userId, program.getProgramId(), null, null));
        Long programApplyId = programApply.getProgramApplyId();

        assertThatThrownBy(() -> paymentService.cancelMyPayment(userId, payment.getPaymentId()))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getErrorCode())
                .isEqualTo(ErrorCode.REFUND_NOT_ALLOWED);

        em.flush();
        em.clear();

        Payment savedPayment = paymentRepository.findById(payment.getPaymentId()).orElseThrow();
        EventRegistration savedReg = eventRegistrationRepository.findById(applyId).orElseThrow();
        ProgramApply savedProgramApply = programApplyRepository.findById(programApplyId).orElseThrow();

        assertThat(savedPayment.getStatus()).isEqualTo(PaymentStatus.APPROVED);
        assertThat(savedReg.getStatus()).isEqualTo(RegistrationStatus.APPROVED);
        assertThat(savedProgramApply.getStatus()).isEqualTo(ApplyStatus.APPLIED);
        assertThat(savedProgramApply.getCancelledAt()).isNull();

        Mockito.verify(paymentGateway, Mockito.never()).cancel(any(Payment.class));
    }

    private Payment seedApprovedPayment(long userId, long eventId, long applyId) {
        String orderNo = "PAY-SVC-TEST-" + System.nanoTime();
        Payment payment = Payment.requested(
                userId,
                eventId,
                applyId,
                orderNo,
                new BigDecimal("10000.00"),
                PaymentProvider.KAKAOPAY
        );
        payment.markApproved();
        return paymentRepository.save(payment);
    }

    private void seedApprovedTx(Long paymentId) {
        PaymentTransaction tx = PaymentTransaction.ready(paymentId, "TID-" + System.nanoTime(), "{}");
        tx.markApproved("{}");
        paymentTransactionRepository.save(tx);
    }

    private Program seedProgram(long eventId) {
        return programRepository.save(
                Program.builder()
                        .eventId(eventId)
                        .category(ProgramCategory.SESSION)
                        .programTitle("payment-service-test-program")
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
                .setParameter("email", "payment.service." + userId + "@pupoo.io")
                .setParameter("pw", "testpw")
                .setParameter("nick", "pay-svc-" + userId)
                .setParameter("phone", "010-1000-" + String.format("%04d", (int) (userId % 10000)))
                .executeUpdate();
    }

    private void seedEvent(long eventId, LocalDateTime startAt, LocalDateTime endAt) {
        em.createNativeQuery("""
            INSERT INTO event
                (event_id, event_name, description, start_at, end_at, location, status, round_no)
            VALUES
                (:eventId, :name, :desc, :startAt, :endAt, 'TEST', 'PLANNED', 1)
            ON DUPLICATE KEY UPDATE event_id = event_id
        """)
                .setParameter("eventId", eventId)
                .setParameter("name", "payment-service-event-" + eventId)
                .setParameter("desc", "test")
                .setParameter("startAt", startAt)
                .setParameter("endAt", endAt)
                .executeUpdate();
    }
}
