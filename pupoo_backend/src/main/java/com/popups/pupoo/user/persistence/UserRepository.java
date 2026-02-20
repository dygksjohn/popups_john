// 파일 위치: src/main/java/com/popups/pupoo/user/persistence/UserRepository.java
package com.popups.pupoo.user.persistence;

import com.popups.pupoo.user.domain.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}
