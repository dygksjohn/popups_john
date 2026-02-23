// file: src/main/java/com/popups/pupoo/booth/persistence/BoothCongestionQueryRepositoryImpl.java
package com.popups.pupoo.booth.persistence;

import com.popups.pupoo.booth.dto.BoothCongestionResponse;
import jakarta.persistence.*;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Repository
public class BoothCongestionQueryRepositoryImpl implements BoothCongestionQueryRepository {

    @PersistenceContext
    private EntityManager em;

    @Override
    public Optional<BoothCongestionResponse> findLatestByBoothId(Long boothId) {

        String sql = """
            select
              c.congestion_level,
              c.measured_at,
              c.program_id
            from congestions c
            join event_program p on p.program_id = c.program_id
            where p.booth_id = :boothId
            order by c.measured_at desc
            limit 1
        """;

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql)
                .setParameter("boothId", boothId)
                .getResultList();

        if (rows.isEmpty()) return Optional.empty();

        Object[] r = rows.get(0);

        BoothCongestionResponse dto = new BoothCongestionResponse();
        dto.congestionLevel = r[0] == null ? null : ((Number) r[0]).intValue();
        dto.measuredAt = r[1] == null ? null : ((Timestamp) r[1]).toLocalDateTime();
        dto.programId = r[2] == null ? null : ((Number) r[2]).longValue();

        return Optional.of(dto);
    }
}
