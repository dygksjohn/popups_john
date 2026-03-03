package com.popups.pupoo.e2e;

import com.popups.pupoo.auth.security.util.SecurityUtil;
import com.popups.pupoo.notification.api.NotificationController;
import com.popups.pupoo.notification.application.NotificationService;
import com.popups.pupoo.notification.domain.enums.InboxTargetType;
import com.popups.pupoo.notification.domain.enums.NotificationType;
import com.popups.pupoo.notification.dto.NotificationInboxResponse;
import com.popups.pupoo.notification.dto.NotificationListResponse;
import com.popups.pupoo.notification.dto.NotificationResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NotificationController.class)
@AutoConfigureMockMvc(addFilters = false)
class NotificationFlowE2ETest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private NotificationService notificationService;
    @MockitoBean private SecurityUtil securityUtil;

    @Test
    void notificationInboxAndClickFlow_routesByTargetType() throws Exception {
        NotificationInboxResponse inboxItem = new NotificationInboxResponse(
                501L,
                NotificationType.NOTICE,
                "공지 알림",
                "새 공지가 등록되었습니다.",
                LocalDateTime.now(),
                InboxTargetType.REVIEW,
                9001L
        );

        NotificationListResponse listResponse = NotificationListResponse.of(
                List.of(inboxItem),
                0,
                20,
                1L,
                1
        );

        when(securityUtil.currentUserId()).thenReturn(88L);
        when(notificationService.getMyInbox(eq(88L), any())).thenReturn(listResponse);
        when(notificationService.click(88L, 501L))
                .thenReturn(new NotificationResponse(InboxTargetType.REVIEW, 9001L));

        mockMvc.perform(get("/api/notifications")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items[0].inboxId").value(501L))
                .andExpect(jsonPath("$.data.items[0].targetType").value("REVIEW"))
                .andExpect(jsonPath("$.data.items[0].targetId").value(9001L));

        mockMvc.perform(post("/api/notifications/501/click"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.targetType").value("REVIEW"))
                .andExpect(jsonPath("$.data.targetId").value(9001L));
    }
}

