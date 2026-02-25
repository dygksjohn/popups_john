// file: src/main/java/com/popups/pupoo/interest/persistence/InterestRepository.java
package com.popups.pupoo.interest.persistence;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import com.popups.pupoo.interest.domain.enums.InterestType;
import com.popups.pupoo.interest.domain.model.Interest;

public interface InterestRepository extends JpaRepository<Interest, Long> {

    /**
     * is_active = true 인 항목만 정렬 조회
     */
    List<Interest> findAllByIsActiveTrue(Sort sort);

    /**
     * type + is_active = true 조건으로 정렬 조회
     */
    List<Interest> findAllByTypeAndIsActiveTrue(InterestType type, Sort sort);
}
