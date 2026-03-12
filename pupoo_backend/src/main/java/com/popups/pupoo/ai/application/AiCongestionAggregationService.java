package com.popups.pupoo.ai.application;

import com.popups.pupoo.ai.domain.model.AiEventCongestionTimeseries;
import com.popups.pupoo.ai.domain.model.AiProgramCongestionTimeseries;
import com.popups.pupoo.ai.domain.model.EventCongestionPolicy;
import com.popups.pupoo.ai.dto.AiCongestionBackfillResponse;
import com.popups.pupoo.ai.persistence.AiCongestionAggregationQueryRepository;
import com.popups.pupoo.ai.persistence.AiEventCongestionTimeseriesRepository;
import com.popups.pupoo.ai.persistence.AiProgramCongestionTimeseriesRepository;
import com.popups.pupoo.ai.persistence.EventCongestionPolicyRepository;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiCongestionAggregationService {

    private static final int BUCKET_MINUTES = 5;
    private static final int DEFAULT_WAIT_BASELINE = 50;
    private static final int DEFAULT_TARGET_WAIT_MIN = 15;
    private static final BigDecimal ZERO_SCALE_2 = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

    private final AiCongestionAggregationQueryRepository aggregationQueryRepository;
    private final EventCongestionPolicyRepository eventCongestionPolicyRepository;
    private final AiEventCongestionTimeseriesRepository aiEventCongestionTimeseriesRepository;
    private final AiProgramCongestionTimeseriesRepository aiProgramCongestionTimeseriesRepository;

    @Transactional
    public BucketAggregationResult aggregateForBucket(LocalDateTime bucketTime) {
        LocalDateTime bucket = floorToFiveMinutes(requireDateTime(bucketTime, "bucketTime"));
        log.info("AI congestion aggregation started. bucket={}", bucket);

        int eventUpsertCount = aggregateEventBucket(bucket);
        int programUpsertCount = aggregateProgramBucket(bucket);

        log.info(
                "AI congestion aggregation finished. bucket={}, eventUpsertCount={}, programUpsertCount={}",
                bucket,
                eventUpsertCount,
                programUpsertCount
        );
        return new BucketAggregationResult(eventUpsertCount, programUpsertCount);
    }

    @Transactional
    public int aggregateEventBucket(LocalDateTime bucketTime) {
        LocalDateTime bucket = floorToFiveMinutes(requireDateTime(bucketTime, "bucketTime"));

        List<AiCongestionAggregationQueryRepository.EventTargetRow> targets =
                aggregationQueryRepository.findEventTargets(bucket);
        if (targets.isEmpty()) {
            return 0;
        }

        List<Long> eventIds = targets.stream()
                .map(AiCongestionAggregationQueryRepository.EventTargetRow::eventId)
                .toList();

        LocalDateTime bucketEnd = bucket.plusMinutes(BUCKET_MINUTES);
        Map<Long, AiCongestionAggregationQueryRepository.EventQrLogCountRow> eventLogMap =
                aggregationQueryRepository.findEventQrLogCounts(bucket, bucketEnd).stream()
                        .collect(Collectors.toMap(
                                AiCongestionAggregationQueryRepository.EventQrLogCountRow::eventId,
                                Function.identity(),
                                (left, right) -> left
                        ));

        Map<Long, Integer> activeApplyCountMap =
                aggregationQueryRepository.findEventActiveApplyCounts().stream()
                        .collect(Collectors.toMap(
                                AiCongestionAggregationQueryRepository.EventActiveApplyCountRow::eventId,
                                AiCongestionAggregationQueryRepository.EventActiveApplyCountRow::activeApplyCount,
                                (left, right) -> left
                        ));

        Map<Long, AiCongestionAggregationQueryRepository.EventWaitAggregateRow> eventWaitMap =
                aggregationQueryRepository.findEventWaitAggregates().stream()
                        .collect(Collectors.toMap(
                                AiCongestionAggregationQueryRepository.EventWaitAggregateRow::eventId,
                                Function.identity(),
                                (left, right) -> left
                        ));

        Map<Long, Integer> runningProgramCountMap =
                aggregationQueryRepository.findRunningProgramCounts(bucket).stream()
                        .collect(Collectors.toMap(
                                AiCongestionAggregationQueryRepository.EventRunningProgramCountRow::eventId,
                                AiCongestionAggregationQueryRepository.EventRunningProgramCountRow::runningProgramCount,
                                (left, right) -> left
                        ));

        Map<Long, EventCongestionPolicy> policyMap =
                eventCongestionPolicyRepository.findAllByEventIdIn(eventIds).stream()
                        .collect(Collectors.toMap(
                                EventCongestionPolicy::getEventId,
                                Function.identity(),
                                (left, right) -> left
                        ));

        Map<Long, AiEventCongestionTimeseries> existingMap =
                aiEventCongestionTimeseriesRepository.findByTimestampMinuteAndEventIdIn(bucket, eventIds).stream()
                        .collect(Collectors.toMap(
                                AiEventCongestionTimeseries::getEventId,
                                Function.identity(),
                                (left, right) -> left
                        ));

        byte hourOfDay = (byte) bucket.getHour();
        byte dayOfWeek = (byte) bucket.getDayOfWeek().getValue();

        List<AiEventCongestionTimeseries> upserts = new ArrayList<>(targets.size());
        for (AiCongestionAggregationQueryRepository.EventTargetRow target : targets) {
            int progressMinute = calculateProgressMinute(target.startAt(), bucket);
            if (progressMinute < 0) {
                continue;
            }

            long eventId = target.eventId();

            AiCongestionAggregationQueryRepository.EventQrLogCountRow logCountRow = eventLogMap.get(eventId);
            int checkins = logCountRow == null ? 0 : Math.max(logCountRow.checkins(), 0);
            int checkouts = logCountRow == null ? 0 : Math.max(logCountRow.checkouts(), 0);

            int activeApplyCount = Math.max(activeApplyCountMap.getOrDefault(eventId, 0), 0);

            AiCongestionAggregationQueryRepository.EventWaitAggregateRow waitAggregateRow = eventWaitMap.get(eventId);
            int totalWaitCount = waitAggregateRow == null ? 0 : Math.max(waitAggregateRow.totalWaitCount(), 0);
            BigDecimal avgWaitMin = waitAggregateRow == null
                    ? ZERO_SCALE_2
                    : normalizeScale2(waitAggregateRow.avgWaitMin());

            int runningProgramCount = Math.max(runningProgramCountMap.getOrDefault(eventId, 0), 0);

            BigDecimal congestionScore = calculateEventCongestionScore(
                    activeApplyCount,
                    totalWaitCount,
                    avgWaitMin,
                    policyMap.get(eventId)
            );

            AiEventCongestionTimeseries entity = existingMap.get(eventId);
            if (entity == null) {
                entity = AiEventCongestionTimeseries.builder()
                        .eventId(eventId)
                        .timestampMinute(bucket)
                        .build();
            }

            entity.applySnapshot(
                    checkins,
                    checkouts,
                    activeApplyCount,
                    totalWaitCount,
                    avgWaitMin,
                    runningProgramCount,
                    progressMinute,
                    hourOfDay,
                    dayOfWeek,
                    congestionScore
            );
            upserts.add(entity);
        }

        if (!upserts.isEmpty()) {
            aiEventCongestionTimeseriesRepository.saveAll(upserts);
        }
        return upserts.size();
    }

    @Transactional
    public int aggregateProgramBucket(LocalDateTime bucketTime) {
        LocalDateTime bucket = floorToFiveMinutes(requireDateTime(bucketTime, "bucketTime"));
        List<AiCongestionAggregationQueryRepository.ProgramTargetRow> targets =
                aggregationQueryRepository.findProgramTargets(bucket);
        if (targets.isEmpty()) {
            return 0;
        }

        List<Long> programIds = targets.stream()
                .map(AiCongestionAggregationQueryRepository.ProgramTargetRow::programId)
                .toList();

        LocalDateTime bucketEnd = bucket.plusMinutes(BUCKET_MINUTES);
        Map<Long, AiCongestionAggregationQueryRepository.BoothQrLogCountRow> boothLogMap =
                aggregationQueryRepository.findBoothQrLogCounts(bucket, bucketEnd).stream()
                        .collect(Collectors.toMap(
                                AiCongestionAggregationQueryRepository.BoothQrLogCountRow::boothId,
                                Function.identity(),
                                (left, right) -> left
                        ));

        Map<Long, Integer> activeApplyCountMap =
                aggregationQueryRepository.findProgramActiveApplyCounts().stream()
                        .collect(Collectors.toMap(
                                AiCongestionAggregationQueryRepository.ProgramActiveApplyCountRow::programId,
                                AiCongestionAggregationQueryRepository.ProgramActiveApplyCountRow::activeApplyCount,
                                (left, right) -> left
                        ));

        Map<Long, AiCongestionAggregationQueryRepository.ProgramWaitRow> waitMap =
                aggregationQueryRepository.findProgramWaits().stream()
                        .collect(Collectors.toMap(
                                AiCongestionAggregationQueryRepository.ProgramWaitRow::programId,
                                Function.identity(),
                                (left, right) -> left
                        ));

        Map<Long, AiProgramCongestionTimeseries> existingMap =
                aiProgramCongestionTimeseriesRepository.findByTimestampMinuteAndProgramIdIn(bucket, programIds).stream()
                        .collect(Collectors.toMap(
                                AiProgramCongestionTimeseries::getProgramId,
                                Function.identity(),
                                (left, right) -> left
                        ));

        byte hourOfDay = (byte) bucket.getHour();
        byte dayOfWeek = (byte) bucket.getDayOfWeek().getValue();

        List<AiProgramCongestionTimeseries> upserts = new ArrayList<>(targets.size());
        for (AiCongestionAggregationQueryRepository.ProgramTargetRow target : targets) {
            int progressMinute = calculateProgressMinute(target.startAt(), bucket);
            if (progressMinute < 0) {
                continue;
            }

            long programId = target.programId();
            int activeApplyCount = Math.max(activeApplyCountMap.getOrDefault(programId, 0), 0);

            AiCongestionAggregationQueryRepository.ProgramWaitRow waitRow = waitMap.get(programId);
            int waitCount = waitRow == null ? 0 : Math.max(waitRow.waitCount(), 0);
            int waitMin = waitRow == null || waitRow.waitMin() == null ? 0 : Math.max(waitRow.waitMin(), 0);

            int checkins = 0;
            int checkouts = 0;
            if (target.boothId() != null) {
                AiCongestionAggregationQueryRepository.BoothQrLogCountRow boothLog = boothLogMap.get(target.boothId());
                if (boothLog != null) {
                    checkins = Math.max(boothLog.checkins(), 0);
                    checkouts = Math.max(boothLog.checkouts(), 0);
                }
            }

            BigDecimal congestionScore = calculateProgramCongestionScore(
                    checkins,
                    activeApplyCount,
                    waitCount,
                    target.capacity()
            );

            AiProgramCongestionTimeseries entity = existingMap.get(programId);
            if (entity == null) {
                entity = AiProgramCongestionTimeseries.builder()
                        .eventId(target.eventId())
                        .programId(programId)
                        .timestampMinute(bucket)
                        .build();
            }

            entity.applySnapshot(
                    checkins,
                    checkouts,
                    activeApplyCount,
                    waitCount,
                    waitMin,
                    progressMinute,
                    hourOfDay,
                    dayOfWeek,
                    congestionScore
            );
            upserts.add(entity);
        }

        if (!upserts.isEmpty()) {
            aiProgramCongestionTimeseriesRepository.saveAll(upserts);
        }
        return upserts.size();
    }

    public AiCongestionBackfillResponse backfillEventRange(LocalDateTime from, LocalDateTime to) {
        Range range = resolveRange(from, to);
        log.info("AI congestion event backfill started. from={}, to={}", range.from(), range.to());

        int bucketCount = 0;
        int eventUpsertCount = 0;
        LocalDateTime cursor = range.from();
        while (!cursor.isAfter(range.to())) {
            eventUpsertCount += aggregateEventBucket(cursor);
            bucketCount++;
            cursor = cursor.plusMinutes(BUCKET_MINUTES);
        }

        log.info(
                "AI congestion event backfill finished. from={}, to={}, bucketCount={}, eventUpsertCount={}",
                range.from(),
                range.to(),
                bucketCount,
                eventUpsertCount
        );
        return new AiCongestionBackfillResponse(bucketCount, eventUpsertCount, 0);
    }

    public AiCongestionBackfillResponse backfillProgramRange(LocalDateTime from, LocalDateTime to) {
        Range range = resolveRange(from, to);
        log.info("AI congestion program backfill started. from={}, to={}", range.from(), range.to());

        int bucketCount = 0;
        int programUpsertCount = 0;
        LocalDateTime cursor = range.from();
        while (!cursor.isAfter(range.to())) {
            programUpsertCount += aggregateProgramBucket(cursor);
            bucketCount++;
            cursor = cursor.plusMinutes(BUCKET_MINUTES);
        }

        log.info(
                "AI congestion program backfill finished. from={}, to={}, bucketCount={}, programUpsertCount={}",
                range.from(),
                range.to(),
                bucketCount,
                programUpsertCount
        );
        return new AiCongestionBackfillResponse(bucketCount, 0, programUpsertCount);
    }

    public AiCongestionBackfillResponse backfillAllRange(LocalDateTime from, LocalDateTime to) {
        Range range = resolveRange(from, to);
        log.info("AI congestion backfill started. from={}, to={}", range.from(), range.to());

        int bucketCount = 0;
        int eventUpsertCount = 0;
        int programUpsertCount = 0;

        LocalDateTime cursor = range.from();
        while (!cursor.isAfter(range.to())) {
            BucketAggregationResult result = aggregateForBucket(cursor);
            eventUpsertCount += result.eventUpsertCount();
            programUpsertCount += result.programUpsertCount();
            bucketCount++;
            cursor = cursor.plusMinutes(BUCKET_MINUTES);
        }

        log.info(
                "AI congestion backfill finished. from={}, to={}, bucketCount={}, eventUpsertCount={}, programUpsertCount={}",
                range.from(),
                range.to(),
                bucketCount,
                eventUpsertCount,
                programUpsertCount
        );
        return new AiCongestionBackfillResponse(bucketCount, eventUpsertCount, programUpsertCount);
    }

    public LocalDateTime floorToFiveMinutes(LocalDateTime dateTime) {
        LocalDateTime normalized = requireDateTime(dateTime, "dateTime");
        int floorMinute = (normalized.getMinute() / BUCKET_MINUTES) * BUCKET_MINUTES;
        return normalized
                .withMinute(floorMinute)
                .withSecond(0)
                .withNano(0);
    }

    private Range resolveRange(LocalDateTime from, LocalDateTime to) {
        LocalDateTime fromAt = floorToFiveMinutes(requireDateTime(from, "from"));
        LocalDateTime toAt = floorToFiveMinutes(requireDateTime(to, "to"));
        if (fromAt.isAfter(toAt)) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }
        return new Range(fromAt, toAt);
    }

    private LocalDateTime requireDateTime(LocalDateTime value, String fieldName) {
        if (value == null) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }
        return value;
    }

    private int calculateProgressMinute(LocalDateTime startAt, LocalDateTime bucketTime) {
        if (startAt == null) {
            return -1;
        }
        long minute = ChronoUnit.MINUTES.between(startAt, bucketTime);
        if (minute < 0L) {
            return -1;
        }
        return (int) Math.min(minute, Integer.MAX_VALUE);
    }

    private BigDecimal calculateEventCongestionScore(
            int activeApplyCount,
            int totalWaitCount,
            BigDecimal avgWaitMin,
            EventCongestionPolicy policy
    ) {
        int capacityBaseline = resolveEventCapacityBaseline(policy, activeApplyCount);
        int waitBaseline = resolvePositive(policy == null ? null : policy.getWaitBaseline(), DEFAULT_WAIT_BASELINE);
        int targetWaitMin = resolvePositive(policy == null ? null : policy.getTargetWaitMin(), DEFAULT_TARGET_WAIT_MIN);

        double eventEntryRate = divide(activeApplyCount, capacityBaseline);
        double waitPressure = divide(totalWaitCount, waitBaseline);
        double waitTimeRate = divide(avgWaitMin.doubleValue(), targetWaitMin);

        double scoreRaw = (eventEntryRate * 0.35)
                + (waitPressure * 0.40)
                + (waitTimeRate * 0.25);

        return clampScore(scoreRaw * 100.0);
    }

    private BigDecimal calculateProgramCongestionScore(
            int checkins1m,
            int activeApplyCount,
            int waitCount,
            Integer programCapacity
    ) {
        int fallbackCapacity = Math.max(activeApplyCount + waitCount, 1);
        int capacityBase = resolvePositive(programCapacity, fallbackCapacity);

        double checkinRate = divide(checkins1m, capacityBase);
        double waitRate = divide(waitCount, capacityBase);
        double applyRate = divide(activeApplyCount, capacityBase);

        double scoreRaw = (checkinRate * 0.50)
                + (waitRate * 0.30)
                + (applyRate * 0.20);

        return clampScore(scoreRaw * 100.0);
    }

    private int resolveEventCapacityBaseline(EventCongestionPolicy policy, int activeApplyCount) {
        int fallback = Math.max(activeApplyCount, 1);
        if (policy == null) {
            return fallback;
        }
        return resolvePositive(policy.getCapacityBaseline(), fallback);
    }

    private int resolvePositive(Integer value, int fallback) {
        if (value == null || value <= 0) {
            return fallback;
        }
        return value;
    }

    private BigDecimal normalizeScale2(BigDecimal value) {
        if (value == null) {
            return ZERO_SCALE_2;
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private double divide(double numerator, double denominator) {
        if (denominator <= 0.0) {
            return 0.0;
        }
        return numerator / denominator;
    }

    private BigDecimal clampScore(double score) {
        double clamped = Math.max(0.0, Math.min(100.0, score));
        return BigDecimal.valueOf(clamped).setScale(2, RoundingMode.HALF_UP);
    }

    private record Range(LocalDateTime from, LocalDateTime to) {
    }

    public record BucketAggregationResult(int eventUpsertCount, int programUpsertCount) {
    }
}
