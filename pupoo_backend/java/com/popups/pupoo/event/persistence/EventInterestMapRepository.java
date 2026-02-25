// file: src/main/java/com/popups/pupoo/event/persistence/EventInterestMapRepository.java
package com.popups.pupoo.event.persistence;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.popups.pupoo.event.domain.model.EventInterestMap;

public interface EventInterestMapRepository extends JpaRepository<EventInterestMap, Long> {

    int deleteByEventId(Long eventId);

    List<EventInterestMap> findByEventId(Long eventId);
}
