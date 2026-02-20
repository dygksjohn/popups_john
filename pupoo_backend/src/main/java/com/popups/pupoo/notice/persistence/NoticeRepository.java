/* file: src/main/java/com/popups/pupoo/notice/persistence/NoticeRepository.java
 * 목적: notices 접근(JPA)
 */
package com.popups.pupoo.notice.persistence;

import com.popups.pupoo.notice.domain.model.Notice;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoticeRepository extends JpaRepository<Notice, Long> {
}
