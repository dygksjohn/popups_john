// file: src/main/java/com/popups/pupoo/admin/analytics/persistence/AdminAnalyticsQueryRepositoryImpl.java
package com.popups.pupoo.admin.analytics.persistence;

import java.util.List;

import org.springframework.stereotype.Repository;

import com.popups.pupoo.common.dashboard.analytics.dto.AdminCongestionByHourResponse;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Repository
public class AdminAnalyticsQueryRepositoryImpl implements AdminAnalyticsQueryRepository {

    @PersistenceContext
    private EntityManager em;

    @Override
    public List<AdminCongestionByHourResponse> findAvgCongestionByHour(Long eventId) {
        String sql = """
            select
              hour(c.measured_at) as h,
              avg(c.congestion_level) as avg_level
            from congestions c
            join event_program p on p.program_id = c.program_id
            where p.event_id = :eventId
            group by hour(c.measured_at)
            order by h asc
        """;

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql)
                .setParameter("eventId", eventId)
                .getResultList();

        return rows.stream()
                .map(r -> new AdminCongestionByHourResponse(
                        r[0] == null ? 0 : ((Number) r[0]).intValue(),
                        r[1] == null ? 0.0 : ((Number) r[1]).doubleValue()
                ))
                .toList();
    }
}
