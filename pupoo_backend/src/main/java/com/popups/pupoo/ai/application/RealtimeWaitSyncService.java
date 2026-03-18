package com.popups.pupoo.ai.application;

import com.popups.pupoo.ai.persistence.AiCongestionAggregationQueryRepository;
import com.popups.pupoo.ai.persistence.RealtimeWaitSyncQueryRepository;
import com.popups.pupoo.booth.domain.model.BoothWait;
import com.popups.pupoo.booth.persistence.BoothWaitRepository;
import com.popups.pupoo.program.domain.model.ExperienceWait;
import com.popups.pupoo.program.persistence.ExperienceWaitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RealtimeWaitSyncService {

    private static final double MIN_THROUGHPUT_PER_MINUTE = 0.25d;
    private static final double DEFAULT_FALLBACK_THROUGHPUT_PER_MINUTE = 0.50d;
    private static final int MAX_WAIT_MINUTES = 240;

    private final RealtimeWaitSyncQueryRepository realtimeWaitSyncQueryRepository;
    private final AiCongestionAggregationQueryRepository aiCongestionAggregationQueryRepository;
    private final ExperienceWaitRepository experienceWaitRepository;
    private final BoothWaitRepository boothWaitRepository;

    @Value("${ai.wait.sync.lookback-minutes:15}")
    private int lookbackMinutes;

    @Transactional
    public WaitSyncResult syncCurrentSnapshot() {
        LocalDateTime baseTime = LocalDateTime.now().withNano(0);
        return syncAt(baseTime);
    }

    @Transactional
    public WaitSyncResult syncAt(LocalDateTime baseTime) {
        if (baseTime == null) {
            throw new IllegalArgumentException("baseTime must not be null");
        }

        int lookback = Math.max(1, lookbackMinutes);
        LocalDateTime windowFrom = baseTime.minusMinutes(lookback);

        List<RealtimeWaitSyncQueryRepository.RunningProgramRow> runningPrograms =
                realtimeWaitSyncQueryRepository.findRunningPrograms(baseTime);
        List<Long> runningProgramIds = runningPrograms.stream()
                .map(RealtimeWaitSyncQueryRepository.RunningProgramRow::programId)
                .toList();

        Map<Long, Integer> queueCountMap = toProgramCountMap(
                realtimeWaitSyncQueryRepository.findProgramQueueCounts(runningProgramIds),
                RealtimeWaitSyncQueryRepository.ProgramQueueCountRow::programId,
                RealtimeWaitSyncQueryRepository.ProgramQueueCountRow::queueCount
        );

        Map<Long, Integer> recentCheckinMap = toProgramCountMap(
                realtimeWaitSyncQueryRepository.findProgramCheckinCounts(runningProgramIds, windowFrom, baseTime),
                RealtimeWaitSyncQueryRepository.ProgramCheckinCountRow::programId,
                RealtimeWaitSyncQueryRepository.ProgramCheckinCountRow::checkinCount
        );

        Map<Long, ExperienceWait> existingProgramWaitMap = runningProgramIds.isEmpty()
                ? Map.of()
                : experienceWaitRepository.findAllByProgramIdIn(runningProgramIds).stream()
                .collect(Collectors.toMap(
                        ExperienceWait::getProgramId,
                        Function.identity(),
                        (left, right) -> left
                ));

        Map<Long, BoothProgramAggregate> boothProgramAggregateMap = new HashMap<>();
        List<ExperienceWait> programUpserts = new ArrayList<>(runningPrograms.size());
        for (RealtimeWaitSyncQueryRepository.RunningProgramRow program : runningPrograms) {
            long programId = program.programId();
            int queueCount = Math.max(queueCountMap.getOrDefault(programId, 0), 0);
            int recentCheckins = Math.max(recentCheckinMap.getOrDefault(programId, 0), 0);

            double throughputPerMinute = resolveProgramThroughputPerMinute(
                    program.throughputPerMin(),
                    program.capacity(),
                    recentCheckins,
                    lookback
            );
            int waitMin = calculateWaitMin(queueCount, throughputPerMinute);

            ExperienceWait wait = existingProgramWaitMap.get(programId);
            if (wait == null) {
                wait = ExperienceWait.create(programId, queueCount, waitMin);
            } else {
                wait.applySnapshot(queueCount, waitMin);
            }
            programUpserts.add(wait);

            Long boothId = program.boothId();
            if (boothId != null) {
                boothProgramAggregateMap.merge(
                        boothId,
                        new BoothProgramAggregate(queueCount, waitMin),
                        (left, right) -> new BoothProgramAggregate(
                                left.waitCount() + right.waitCount(),
                                Math.max(left.waitMin(), right.waitMin())
                        )
                );
            }
        }

        if (!programUpserts.isEmpty()) {
            experienceWaitRepository.saveAll(programUpserts);
        }

        List<RealtimeWaitSyncQueryRepository.ActiveBoothRow> activeBooths =
                realtimeWaitSyncQueryRepository.findActiveBooths(baseTime);
        List<Long> activeBoothIds = activeBooths.stream()
                .map(RealtimeWaitSyncQueryRepository.ActiveBoothRow::boothId)
                .distinct()
                .toList();

        Map<Long, BoothWait> existingBoothWaitMap = activeBoothIds.isEmpty()
                ? Map.of()
                : boothWaitRepository.findAllByBoothIdIn(activeBoothIds).stream()
                .collect(Collectors.toMap(
                        BoothWait::getBoothId,
                        Function.identity(),
                        (left, right) -> left
                ));

        Map<Long, AiCongestionAggregationQueryRepository.BoothQrLogCountRow> boothLogMap =
                aiCongestionAggregationQueryRepository.findBoothQrLogCounts(windowFrom, baseTime).stream()
                        .collect(Collectors.toMap(
                                AiCongestionAggregationQueryRepository.BoothQrLogCountRow::boothId,
                                Function.identity(),
                                (left, right) -> left
                        ));

        List<BoothWait> boothUpserts = new ArrayList<>(activeBoothIds.size());
        for (Long boothId : activeBoothIds) {
            BoothProgramAggregate programAggregate = boothProgramAggregateMap.getOrDefault(
                    boothId,
                    BoothProgramAggregate.ZERO
            );
            AiCongestionAggregationQueryRepository.BoothQrLogCountRow boothLog = boothLogMap.get(boothId);
            int checkins = boothLog == null ? 0 : Math.max(boothLog.checkins(), 0);
            int checkouts = boothLog == null ? 0 : Math.max(boothLog.checkouts(), 0);

            int flowBacklogCount = Math.max(checkins - checkouts, 0);
            int waitCount = Math.max(programAggregate.waitCount(), flowBacklogCount);

            double flowThroughputPerMinute = resolveFlowThroughputPerMinute(checkins, checkouts, lookback);
            int flowWaitMin = calculateWaitMin(waitCount, flowThroughputPerMinute);
            int waitMin = waitCount <= 0 ? 0 : Math.max(programAggregate.waitMin(), flowWaitMin);

            BoothWait wait = existingBoothWaitMap.get(boothId);
            if (wait == null) {
                wait = BoothWait.create(boothId, waitCount, waitMin, baseTime);
            } else {
                wait.applySnapshot(waitCount, waitMin, baseTime);
            }
            boothUpserts.add(wait);
        }

        if (!boothUpserts.isEmpty()) {
            boothWaitRepository.saveAll(boothUpserts);
        }

        log.info(
                "Realtime wait sync completed. baseTime={}, lookbackMinutes={}, programUpsertCount={}, boothUpsertCount={}",
                baseTime,
                lookback,
                programUpserts.size(),
                boothUpserts.size()
        );
        return new WaitSyncResult(baseTime, lookback, programUpserts.size(), boothUpserts.size());
    }

    private <T> Map<Long, Integer> toProgramCountMap(
            List<T> rows,
            Function<T, Long> keyExtractor,
            Function<T, Integer> countExtractor
    ) {
        if (rows == null || rows.isEmpty()) {
            return Map.of();
        }
        return rows.stream()
                .collect(Collectors.toMap(
                        keyExtractor,
                        row -> Math.max(countExtractor.apply(row), 0),
                        Integer::max
                ));
    }

    private double resolveProgramThroughputPerMinute(
            BigDecimal configuredThroughputPerMinute,
            Integer capacity,
            int recentCheckins,
            int lookbackMinutes
    ) {
        Double configuredRate = (configuredThroughputPerMinute != null && configuredThroughputPerMinute.doubleValue() > 0.0d)
                ? configuredThroughputPerMinute.doubleValue()
                : null;

        Double observedRate = recentCheckins > 0
                ? Math.max((double) recentCheckins / lookbackMinutes, MIN_THROUGHPUT_PER_MINUTE)
                : null;

        Double capacityRate = (capacity != null && capacity > 0)
                ? Math.max((double) capacity / 60.0d, MIN_THROUGHPUT_PER_MINUTE)
                : null;

        if (configuredRate != null) {
            double baselineRate = observedRate != null
                    ? observedRate
                    : (capacityRate != null ? capacityRate : DEFAULT_FALLBACK_THROUGHPUT_PER_MINUTE);
            // Keep configured throughput as anchor, but reflect observed/capacity baseline
            // so wait time is not locked to queue size when seed defaults are uniform.
            double blendedRate = (configuredRate * 0.6d) + (baselineRate * 0.4d);
            return Math.max(blendedRate, MIN_THROUGHPUT_PER_MINUTE);
        }

        if (observedRate != null) {
            return observedRate;
        }
        if (capacityRate != null) {
            return Math.max(capacityRate, DEFAULT_FALLBACK_THROUGHPUT_PER_MINUTE);
        }
        return DEFAULT_FALLBACK_THROUGHPUT_PER_MINUTE;
    }

    private double resolveFlowThroughputPerMinute(int checkins, int checkouts, int lookbackMinutes) {
        if (checkouts > 0) {
            return Math.max((double) checkouts / lookbackMinutes, MIN_THROUGHPUT_PER_MINUTE);
        }
        if (checkins > 0) {
            return Math.max((double) checkins / lookbackMinutes, MIN_THROUGHPUT_PER_MINUTE);
        }
        return DEFAULT_FALLBACK_THROUGHPUT_PER_MINUTE;
    }

    private int calculateWaitMin(int waitCount, double throughputPerMinute) {
        if (waitCount <= 0) {
            return 0;
        }
        double safeThroughput = Math.max(throughputPerMinute, MIN_THROUGHPUT_PER_MINUTE);
        int estimatedMinutes = (int) Math.ceil(waitCount / safeThroughput);
        return Math.min(Math.max(estimatedMinutes, 0), MAX_WAIT_MINUTES);
    }

    private record BoothProgramAggregate(int waitCount, int waitMin) {
        private static final BoothProgramAggregate ZERO = new BoothProgramAggregate(0, 0);
    }

    public record WaitSyncResult(
            LocalDateTime baseTime,
            int lookbackMinutes,
            int programUpsertCount,
            int boothUpsertCount
    ) {
    }
}
