// file: src/main/java/com/popups/pupoo/user/persistence/UserRepository.java
package com.popups.pupoo.user.persistence;

import com.popups.pupoo.user.domain.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

/**
 * User Repository
 * - 로그인/중복검사/공개설정 조회 등에서 사용
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * 이메일로 사용자 조회 (로그인용)
     */
    Optional<User> findByEmail(String email);

    /**
     * 닉네임 중복 체크
     */
    boolean existsByNickname(String nickname);

    /**
     * 이메일 중복 체크
     */
    boolean existsByEmail(String email);

    /**
     * 전화번호 중복 체크
     */
    boolean existsByPhone(String phone);

    /**
     * 공개설정(show_pet) 조회
     * - PetServiceImpl에서 사용
     */
    @Query("select u.showPet from User u where u.userId = :userId")
    Boolean findShowPetByUserId(@Param("userId") Long userId);

    /**
     * 관리자용 사용자 검색
     * - keyword(email/nickname/phone 부분검색)
     * - status 필터
     */
    @Query("""
            select u
              from User u
             where (:status is null or u.status = :status)
               and (
                    :keyword is null
                    or u.email like concat('%', :keyword, '%')
                    or u.nickname like concat('%', :keyword, '%')
                    or u.phone like concat('%', :keyword, '%')
               )
            """)
    Page<User> search(@Param("status") com.popups.pupoo.user.domain.enums.UserStatus status,
                      @Param("keyword") String keyword,
                      Pageable pageable);

    /**
     * [EMAIL] interest 구독자 + 마케팅 수신 동의 사용자 이메일 목록
     */
    @Query(value = """
            select distinct u.email
              from users u
              join notification_settings ns
                on ns.user_id = u.user_id
               and ns.allow_marketing = 1
              join user_interest_subscriptions s
                on s.user_id = u.user_id
               and s.status = 'ACTIVE'
               and s.allow_email = 1
              join event_interest_map eim
                on eim.interest_id = s.interest_id
               and eim.event_id = :eventId
             where u.status = 'ACTIVE'
            """, nativeQuery = true)
    java.util.List<String> findDistinctMarketingEmailsForEventInterest(@Param("eventId") Long eventId);

    /**
     * [SMS] interest 구독자 + 마케팅 수신 동의 사용자 전화번호 목록
     */
    @Query(value = """
            select distinct u.phone
              from users u
              join notification_settings ns
                on ns.user_id = u.user_id
               and ns.allow_marketing = 1
              join user_interest_subscriptions s
                on s.user_id = u.user_id
               and s.status = 'ACTIVE'
               and s.allow_sms = 1
              join event_interest_map eim
                on eim.interest_id = s.interest_id
               and eim.event_id = :eventId
             where u.status = 'ACTIVE'
            """, nativeQuery = true)
    java.util.List<String> findDistinctMarketingPhonesForEventInterest(@Param("eventId") Long eventId);

    /**
     * [EMAIL] 이벤트 참가자(APPROVED) + 마케팅 수신 동의 사용자 이메일 목록
     */
    @Query(value = """
            select distinct u.email
              from users u
              join notification_settings ns
                on ns.user_id = u.user_id
               and ns.allow_marketing = 1
              join event_apply ea
                on ea.user_id = u.user_id
               and ea.event_id = :eventId
               and ea.status = 'APPROVED'
             where u.status = 'ACTIVE'
            """, nativeQuery = true)
    java.util.List<String> findDistinctMarketingEmailsForEventRegistrants(@Param("eventId") Long eventId);

    /**
     * [SMS] 이벤트 참가자(APPROVED) + 마케팅 수신 동의 사용자 전화번호 목록
     */
    @Query(value = """
            select distinct u.phone
              from users u
              join notification_settings ns
                on ns.user_id = u.user_id
               and ns.allow_marketing = 1
              join event_apply ea
                on ea.user_id = u.user_id
               and ea.event_id = :eventId
               and ea.status = 'APPROVED'
             where u.status = 'ACTIVE'
            """, nativeQuery = true)
    java.util.List<String> findDistinctMarketingPhonesForEventRegistrants(@Param("eventId") Long eventId);

    /**
     * [EMAIL] 이벤트 결제완료(APPROVED) + 마케팅 수신 동의 사용자 이메일 목록
     */
    @Query(value = """
            select distinct u.email
              from users u
              join notification_settings ns
                on ns.user_id = u.user_id
               and ns.allow_marketing = 1
              join payments p
                on p.user_id = u.user_id
               and p.event_id = :eventId
               and p.status = 'APPROVED'
             where u.status = 'ACTIVE'
            """, nativeQuery = true)
    java.util.List<String> findDistinctMarketingEmailsForEventPayers(@Param("eventId") Long eventId);

    /**
     * [SMS] 이벤트 결제완료(APPROVED) + 마케팅 수신 동의 사용자 전화번호 목록
     */
    @Query(value = """
            select distinct u.phone
              from users u
              join notification_settings ns
                on ns.user_id = u.user_id
               and ns.allow_marketing = 1
              join payments p
                on p.user_id = u.user_id
               and p.event_id = :eventId
               and p.status = 'APPROVED'
             where u.status = 'ACTIVE'
            """, nativeQuery = true)
    java.util.List<String> findDistinctMarketingPhonesForEventPayers(@Param("eventId") Long eventId);
}
