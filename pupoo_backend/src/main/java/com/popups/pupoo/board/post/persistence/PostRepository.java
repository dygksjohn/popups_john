/* file: src/main/java/com/popups/pupoo/board/post/persistence/PostRepository.java
 * 목적: posts 접근(JPA)
 */
package com.popups.pupoo.board.post.persistence;

import com.popups.pupoo.board.post.domain.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {
}
