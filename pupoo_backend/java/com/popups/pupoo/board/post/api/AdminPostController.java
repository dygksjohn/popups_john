// file: src/main/java/com/popups/pupoo/board/post/api/AdminPostController.java
package com.popups.pupoo.board.post.api;

import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.popups.pupoo.board.post.application.PostService;
import com.popups.pupoo.common.api.ApiResponse;
import com.popups.pupoo.common.api.MessageResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/posts")
public class AdminPostController {

    private final PostService postService;

    @PatchMapping("/{postId}/delete")
    public ApiResponse<MessageResponse> delete(@PathVariable Long postId) {
        postService.adminDelete(postId);
        return ApiResponse.success(new MessageResponse("ADMIN_DELETE_OK"));
    }
}
