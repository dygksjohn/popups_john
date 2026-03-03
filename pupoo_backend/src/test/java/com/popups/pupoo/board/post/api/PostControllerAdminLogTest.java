package com.popups.pupoo.board.post.api;

import com.popups.pupoo.auth.security.util.SecurityUtil;
import com.popups.pupoo.board.post.application.PostService;
import com.popups.pupoo.board.post.dto.PostCreateRequest;
import com.popups.pupoo.common.audit.application.AdminLogService;
import com.popups.pupoo.common.audit.domain.enums.AdminTargetType;
import com.popups.pupoo.report.application.ReportService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostControllerAdminLogTest {

    @Mock private PostService postService;
    @Mock private SecurityUtil securityUtil;
    @Mock private AdminLogService adminLogService;
    @Mock private ReportService reportService;

    @InjectMocks private PostController postController;

    @Test
    void createPost_whenAdmin_writesAdminLog() {
        PostCreateRequest request = new PostCreateRequest();
        request.setBoardId(1L);
        request.setPostTitle("title");
        request.setContent("content");

        when(securityUtil.currentUserId()).thenReturn(10L);
        when(securityUtil.isAdmin()).thenReturn(true);
        when(postService.createPost(10L, request)).thenReturn(101L);

        postController.createPost(request);

        verify(adminLogService).write("POST_CREATE", AdminTargetType.POST, 101L);
    }

    @Test
    void createPost_whenNotAdmin_doesNotWriteAdminLog() {
        PostCreateRequest request = new PostCreateRequest();
        request.setBoardId(1L);
        request.setPostTitle("title");
        request.setContent("content");

        when(securityUtil.currentUserId()).thenReturn(10L);
        when(securityUtil.isAdmin()).thenReturn(false);
        when(postService.createPost(10L, request)).thenReturn(101L);

        postController.createPost(request);

        verify(adminLogService, never()).write(anyString(), any(), any());
    }
}
