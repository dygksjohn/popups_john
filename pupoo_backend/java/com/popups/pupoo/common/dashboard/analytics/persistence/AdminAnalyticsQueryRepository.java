// file: src/main/java/com/popups/pupoo/admin/analytics/persistence/AdminAnalyticsQueryRepository.java
package com.popups.pupoo.admin.analytics.persistence;

import java.util.List;

import com.popups.pupoo.common.dashboard.analytics.dto.AdminCongestionByHourResponse;

public interface AdminAnalyticsQueryRepository {

    List<AdminCongestionByHourResponse> findAvgCongestionByHour(Long eventId);
}
