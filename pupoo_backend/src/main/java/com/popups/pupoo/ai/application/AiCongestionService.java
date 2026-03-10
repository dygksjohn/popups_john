package com.popups.pupoo.ai.application;

import com.popups.pupoo.ai.client.AiInferenceClient;
import com.popups.pupoo.ai.domain.enums.AiPredictionSourceType;
import com.popups.pupoo.ai.domain.enums.AiPredictionTargetType;
import com.popups.pupoo.ai.domain.model.AiPredictionLog;
import com.popups.pupoo.ai.dto.AiCongestionPredictionResponse;
import com.popups.pupoo.ai.dto.AiEventPredictionRequest;
import com.popups.pupoo.ai.dto.AiProgramPredictionRequest;
import com.popups.pupoo.ai.dto.AiProgramRecommendationItemResponse;
import com.popups.pupoo.ai.dto.AiProgramRecommendationRequest;
import com.popups.pupoo.ai.dto.AiProgramRecommendationResponse;
import com.popups.pupoo.ai.dto.AiRecommendationProgramInput;
import com.popups.pupoo.ai.dto.AiTimelinePoint;
import com.popups.pupoo.ai.persistence.AiPredictionLogRepository;
import com.popups.pupoo.booth.domain.model.Booth;
import com.popups.pupoo.booth.domain.model.BoothWait;
import com.popups.pupoo.booth.persistence.BoothRepository;
import com.popups.pupoo.booth.persistence.BoothWaitRepository;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.event.domain.enums.RegistrationStatus;
import com.popups.pupoo.event.domain.model.Event;
import com.popups.pupoo.event.persistence.EventRegistrationRepository;
import com.popups.pupoo.event.persistence.EventRepository;
import com.popups.pupoo.program.apply.domain.enums.ApplyStatus;
import com.popups.pupoo.program.apply.persistence.ProgramApplyRepository;
import com.popups.pupoo.program.domain.model.ExperienceWait;
import com.popups.pupoo.program.domain.model.Program;
import com.popups.pupoo.program.persistence.ExperienceWaitRepository;
import com.popups.pupoo.program.persistence.ProgramRepository;
import com.popups.pupoo.qr.persistence.QrCheckinRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

@Service
public class AiCongestionService {

    private static final Logger log = LoggerFactory.getLogger(AiCongestionService.class);
    private static final double RECOMMEND_THRESHOLD = 75.0;
    private static final String MODEL_VERSION_AI = "mock-v1";
    private static final String MODEL_VERSION_FALLBACK = "rule-v1";
    private static final Set<ApplyStatus> PROGRAM_ACTIVE_STATUSES = EnumSet.of(
            ApplyStatus.APPLIED,
            ApplyStatus.WAITING,
            ApplyStatus.APPROVED
    );

    private final EventRepository eventRepository;
    private final ProgramRepository programRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final QrCheckinRepository qrCheckinRepository;
    private final ProgramApplyRepository programApplyRepository;
    private final ExperienceWaitRepository experienceWaitRepository;
    private final BoothRepository boothRepository;
    private final BoothWaitRepository boothWaitRepository;
    private final AiInferenceClient aiInferenceClient;
    private final AiPredictionLogRepository aiPredictionLogRepository;

    public AiCongestionService(
            EventRepository eventRepository,
            ProgramRepository programRepository,
            EventRegistrationRepository eventRegistrationRepository,
            QrCheckinRepository qrCheckinRepository,
            ProgramApplyRepository programApplyRepository,
            ExperienceWaitRepository experienceWaitRepository,
            BoothRepository boothRepository,
            BoothWaitRepository boothWaitRepository,
            AiInferenceClient aiInferenceClient,
            AiPredictionLogRepository aiPredictionLogRepository
    ) {
        this.eventRepository = eventRepository;
        this.programRepository = programRepository;
        this.eventRegistrationRepository = eventRegistrationRepository;
        this.qrCheckinRepository = qrCheckinRepository;
        this.programApplyRepository = programApplyRepository;
        this.experienceWaitRepository = experienceWaitRepository;
        this.boothRepository = boothRepository;
        this.boothWaitRepository = boothWaitRepository;
        this.aiInferenceClient = aiInferenceClient;
        this.aiPredictionLogRepository = aiPredictionLogRepository;
    }

    public AiCongestionPredictionResponse predictEvent(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EVENT_NOT_FOUND));
        LocalDateTime baseTime = LocalDateTime.now();
        List<Program> programs = programRepository.findByEventId(eventId, Pageable.unpaged()).getContent();

        int entryCount = countEventEntryCount(eventId);
        int activeApplyCount = countEventActiveApplies(eventId);
        int runningProgramCount = (int) programs.stream().filter(this::isRunningNow).count();
        int totalProgramCount = programs.size();
        WaitAggregate waitAggregate = collectEventWaitMetrics(eventId, programs);

        AiEventPredictionRequest request = new AiEventPredictionRequest(
                event.getEventId(),
                baseTime,
                event.getStartAt(),
                event.getEndAt(),
                entryCount,
                activeApplyCount,
                runningProgramCount,
                totalProgramCount,
                waitAggregate.totalWaitCount(),
                waitAggregate.averageWaitMinutes()
        );

        AiCongestionPredictionResponse response = aiInferenceClient.predictEvent(request)
                .orElseGet(() -> fallbackEventPrediction(event, baseTime, request));
        savePredictionLog(response);
        return response;
    }

    public AiCongestionPredictionResponse predictProgram(Long programId) {
        return predictProgramInternal(programId, true);
    }

    private AiCongestionPredictionResponse predictProgramInternal(Long programId, boolean persistLog) {
        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROGRAM_NOT_FOUND));
        LocalDateTime baseTime = LocalDateTime.now();
        WaitAggregate waitAggregate = collectProgramWaitMetrics(programId);
        int activeApplyCount = countProgramActiveApplies(programId);
        int checkinCount = countProgramCheckins(programId);

        AiProgramPredictionRequest request = new AiProgramPredictionRequest(
                program.getEventId(),
                program.getProgramId(),
                baseTime,
                program.getStartAt(),
                program.getEndAt(),
                activeApplyCount,
                checkinCount,
                waitAggregate.totalWaitCount(),
                waitAggregate.averageWaitMinutes(),
                toUpperText(program.getCategory() == null ? null : program.getCategory().name()),
                null,
                resolveProgramZone(program)
        );

        AiCongestionPredictionResponse response = aiInferenceClient.predictProgram(request)
                .orElseGet(() -> fallbackProgramPrediction(program, baseTime, request));
        if (persistLog) {
            savePredictionLog(response);
        }
        return response;
    }

    public AiProgramRecommendationResponse recommendProgram(Long programId) {
        Program currentProgram = programRepository.findById(programId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROGRAM_NOT_FOUND));
        AiCongestionPredictionResponse currentPrediction = predictProgramInternal(programId, false);
        LocalDateTime baseTime = LocalDateTime.now();

        AiRecommendationProgramInput currentInput = new AiRecommendationProgramInput(
                currentProgram.getProgramId(),
                currentProgram.getEventId(),
                currentProgram.getProgramTitle(),
                toUpperText(currentProgram.getCategory() == null ? null : currentProgram.getCategory().name()),
                null,
                resolveProgramZone(currentProgram),
                currentProgram.getStartAt(),
                currentProgram.getEndAt(),
                currentPrediction.predictedPeakScore(),
                currentPrediction.predictedWaitMinutes()
        );

        if (currentInput.predictedScore() < RECOMMEND_THRESHOLD) {
            return new AiProgramRecommendationResponse(
                    currentProgram.getEventId(),
                    currentProgram.getProgramId(),
                    RECOMMEND_THRESHOLD,
                    false,
                    "혼잡도가 임계치 미만입니다.",
                    List.of()
            );
        }

        List<AiRecommendationProgramInput> candidates = buildCandidateInputs(currentProgram);
        AiProgramRecommendationRequest request = new AiProgramRecommendationRequest(
                currentProgram.getEventId(),
                currentProgram.getProgramId(),
                baseTime,
                RECOMMEND_THRESHOLD,
                currentInput,
                candidates
        );

        return aiInferenceClient.recommendPrograms(request)
                .orElseGet(() -> fallbackRecommendation(request));
    }

    public List<AiCongestionPredictionResponse> predictProgramsByEvent(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EVENT_NOT_FOUND));
        List<Program> programs = programRepository.findByEventId(event.getEventId(), Pageable.unpaged()).getContent();
        List<AiCongestionPredictionResponse> result = new ArrayList<>();
        for (Program program : programs) {
            result.add(predictProgram(program.getProgramId()));
        }
        return result;
    }

    private List<AiRecommendationProgramInput> buildCandidateInputs(Program currentProgram) {
        List<Program> programs = programRepository
                .findByEventId(currentProgram.getEventId(), Pageable.unpaged())
                .getContent();
        List<AiRecommendationProgramInput> candidates = new ArrayList<>();

        for (Program candidate : programs) {
            if (candidate.getProgramId().equals(currentProgram.getProgramId())) {
                continue;
            }
            WaitAggregate waitAggregate = collectProgramWaitMetrics(candidate.getProgramId());
            int activeApplyCount = countProgramActiveApplies(candidate.getProgramId());
            int checkinCount = countProgramCheckins(candidate.getProgramId());
            double score = estimateProgramBaseScore(
                    activeApplyCount,
                    checkinCount,
                    waitAggregate.totalWaitCount(),
                    waitAggregate.averageWaitMinutes()
            );
            candidates.add(new AiRecommendationProgramInput(
                    candidate.getProgramId(),
                    candidate.getEventId(),
                    candidate.getProgramTitle(),
                    toUpperText(candidate.getCategory() == null ? null : candidate.getCategory().name()),
                    null,
                    resolveProgramZone(candidate),
                    candidate.getStartAt(),
                    candidate.getEndAt(),
                    score,
                    waitFromScore(score)
            ));
        }
        return candidates;
    }

    private AiProgramRecommendationResponse fallbackRecommendation(AiProgramRecommendationRequest request) {
        AiRecommendationProgramInput current = request.currentProgram();
        List<AiRecommendationProgramInput> filtered = request.candidates().stream()
                .filter(candidate -> !candidate.programId().equals(current.programId()))
                .filter(candidate -> candidate.endAt().isAfter(request.baseTime().plusMinutes(5)))
                .filter(candidate -> candidate.predictedScore() < current.predictedScore())
                .filter(candidate -> candidate.predictedScore() < request.thresholdScore())
                .sorted(buildRecommendationComparator(current, request.baseTime()))
                .limit(3)
                .toList();

        if (filtered.isEmpty()) {
            return new AiProgramRecommendationResponse(
                    request.eventId(),
                    request.programId(),
                    request.thresholdScore(),
                    true,
                    "추천 후보가 없습니다. 예상 대기시간 " + current.predictedWaitMinutes() + "분",
                    List.of()
            );
        }

        List<AiProgramRecommendationItemResponse> items = filtered.stream()
                .map(candidate -> new AiProgramRecommendationItemResponse(
                        candidate.programId(),
                        candidate.eventId(),
                        candidate.title(),
                        candidate.category(),
                        candidate.target(),
                        candidate.zone(),
                        candidate.startAt(),
                        candidate.endAt(),
                        clampScore(candidate.predictedScore()),
                        levelFromScore(candidate.predictedScore()),
                        candidate.predictedWaitMinutes(),
                        buildReason(candidate, current)
                ))
                .toList();

        return new AiProgramRecommendationResponse(
                request.eventId(),
                request.programId(),
                request.thresholdScore(),
                true,
                "대체 프로그램 추천 결과입니다.",
                items
        );
    }

    private Comparator<AiRecommendationProgramInput> buildRecommendationComparator(
            AiRecommendationProgramInput current,
            LocalDateTime baseTime
    ) {
        return Comparator
                .comparing((AiRecommendationProgramInput candidate) -> isSameText(candidate.category(), current.category()))
                .reversed()
                .thenComparing(candidate -> isTimeFit(candidate, baseTime), Comparator.reverseOrder())
                .thenComparing(candidate -> isSameText(candidate.target(), current.target()), Comparator.reverseOrder())
                .thenComparing(candidate -> isSameText(candidate.zone(), current.zone()), Comparator.reverseOrder())
                .thenComparingDouble(AiRecommendationProgramInput::predictedScore)
                .thenComparingInt(AiRecommendationProgramInput::predictedWaitMinutes)
                .thenComparing(AiRecommendationProgramInput::startAt);
    }

    private String buildReason(AiRecommendationProgramInput candidate, AiRecommendationProgramInput current) {
        List<String> parts = new ArrayList<>();
        if (isSameText(candidate.category(), current.category())) {
            parts.add("동일 카테고리");
        }
        if (isSameText(candidate.zone(), current.zone())) {
            parts.add("동일 구역");
        }
        parts.add("혼잡도 낮음");
        return String.join(", ", parts);
    }

    private boolean isTimeFit(AiRecommendationProgramInput candidate, LocalDateTime baseTime) {
        boolean startSoon = !candidate.startAt().isBefore(baseTime) && !candidate.startAt().isAfter(baseTime.plusMinutes(30));
        boolean runningNow = !candidate.startAt().isAfter(baseTime) && !candidate.endAt().isBefore(baseTime);
        return startSoon || runningNow;
    }

    private boolean isSameText(String left, String right) {
        if (left == null || right == null) {
            return false;
        }
        return left.equalsIgnoreCase(right);
    }

    private AiCongestionPredictionResponse fallbackEventPrediction(
            Event event,
            LocalDateTime baseTime,
            AiEventPredictionRequest request
    ) {
        double baseScore = estimateEventBaseScore(
                request.entryCount(),
                request.activeApplyCount(),
                request.runningProgramCount(),
                request.totalProgramCount(),
                request.totalWaitCount(),
                request.averageWaitMinutes()
        );
        List<AiTimelinePoint> timeline = buildTimeline(event.getStartAt(), event.getEndAt(), baseScore);
        return buildPredictionResponse("EVENT", event.getEventId(), null, baseTime, timeline, baseScore, true);
    }

    private AiCongestionPredictionResponse fallbackProgramPrediction(
            Program program,
            LocalDateTime baseTime,
            AiProgramPredictionRequest request
    ) {
        double baseScore = estimateProgramBaseScore(
                request.activeApplyCount(),
                request.checkinCount(),
                request.waitCount(),
                request.waitMinutes()
        );
        LocalDateTime horizonStart = baseTime.isAfter(program.getStartAt()) ? baseTime : program.getStartAt();
        List<AiTimelinePoint> timeline = buildTimeline(horizonStart, program.getEndAt(), baseScore);
        return buildPredictionResponse("PROGRAM", program.getEventId(), program.getProgramId(), baseTime, timeline, baseScore, true);
    }

    private AiCongestionPredictionResponse buildPredictionResponse(
            String targetType,
            Long eventId,
            Long programId,
            LocalDateTime baseTime,
            List<AiTimelinePoint> timeline,
            double baseScore,
            boolean fallbackUsed
    ) {
        List<Double> scores = timeline.stream().map(AiTimelinePoint::score).toList();
        double avgScore = scores.isEmpty()
                ? clampScore(baseScore)
                : clampScore(scores.stream().mapToDouble(Double::doubleValue).average().orElse(baseScore));
        double peakScore = scores.isEmpty()
                ? clampScore(baseScore)
                : clampScore(scores.stream().mapToDouble(Double::doubleValue).max().orElse(baseScore));

        return new AiCongestionPredictionResponse(
                targetType,
                eventId,
                programId,
                baseTime,
                avgScore,
                peakScore,
                levelFromScore(peakScore),
                waitFromScore(avgScore),
                0.62,
                fallbackUsed,
                timeline
        );
    }

    private List<AiTimelinePoint> buildTimeline(LocalDateTime startAt, LocalDateTime endAt, double baseScore) {
        if (endAt.isBefore(startAt)) {
            return List.of();
        }

        List<LocalDateTime> points = buildTimePoints(startAt, endAt);
        if (points.isEmpty()) {
            return List.of();
        }

        int denominator = Math.max(1, points.size() - 1);
        List<AiTimelinePoint> timeline = new ArrayList<>();
        for (int index = 0; index < points.size(); index++) {
            double progress = (double) index / denominator;
            double wave = Math.sin(progress * Math.PI * 2.0) * 5.5;
            double trend = (progress - 0.5) * 7.0;
            double score = clampScore(baseScore + wave + trend);
            timeline.add(new AiTimelinePoint(
                    points.get(index),
                    score,
                    levelFromScore(score),
                    waitFromScore(score)
            ));
        }
        return timeline;
    }

    private List<LocalDateTime> buildTimePoints(LocalDateTime startAt, LocalDateTime endAt) {
        List<LocalDateTime> points = new ArrayList<>();
        LocalDateTime current = alignToFive(startAt);
        if (current.isBefore(startAt)) {
            current = current.plusMinutes(5);
        }

        while (!current.isAfter(endAt)) {
            points.add(current);
            current = current.plusMinutes(5);
        }

        LocalDateTime endPoint = endAt.withSecond(0).withNano(0);
        if (points.isEmpty() || points.get(points.size() - 1).isBefore(endPoint)) {
            points.add(endPoint);
        }
        return points;
    }

    private LocalDateTime alignToFive(LocalDateTime dateTime) {
        int alignedMinute = (dateTime.getMinute() / 5) * 5;
        return dateTime
                .withMinute(alignedMinute)
                .withSecond(0)
                .withNano(0);
    }

    private WaitAggregate collectEventWaitMetrics(Long eventId, List<Program> programs) {
        int totalWaitCount = 0;
        int waitMinuteCount = 0;
        double waitMinuteSum = 0.0;

        List<Booth> booths = boothRepository.findEventBooths(eventId, null, null, Pageable.unpaged()).getContent();
        for (Booth booth : booths) {
            Optional<BoothWait> wait = boothWaitRepository.findByBoothId(booth.getBoothId());
            if (wait.isEmpty()) {
                continue;
            }
            int count = safeInt(wait.get().getWaitCount());
            int waitMin = safeInt(wait.get().getWaitMin());
            totalWaitCount += count;
            if (waitMin > 0) {
                waitMinuteSum += waitMin;
                waitMinuteCount++;
            }
        }

        for (Program program : programs) {
            Optional<ExperienceWait> wait = experienceWaitRepository.findByProgramId(program.getProgramId());
            if (wait.isEmpty()) {
                continue;
            }
            int count = safeInt(wait.get().getWaitCount());
            int waitMin = safeInt(wait.get().getWaitMin());
            totalWaitCount += count;
            if (waitMin > 0) {
                waitMinuteSum += waitMin;
                waitMinuteCount++;
            }
        }

        double averageWait = waitMinuteCount == 0 ? 0.0 : waitMinuteSum / waitMinuteCount;
        return new WaitAggregate(totalWaitCount, roundOneDecimal(averageWait));
    }

    private WaitAggregate collectProgramWaitMetrics(Long programId) {
        Optional<ExperienceWait> wait = experienceWaitRepository.findByProgramId(programId);
        if (wait.isEmpty()) {
            return new WaitAggregate(0, 0.0);
        }

        return new WaitAggregate(
                safeInt(wait.get().getWaitCount()),
                safeInt(wait.get().getWaitMin())
        );
    }

    private boolean isRunningNow(Program program) {
        LocalDateTime now = LocalDateTime.now();
        return (program.getStartAt().isBefore(now) || program.getStartAt().isEqual(now))
                && (program.getEndAt().isAfter(now) || program.getEndAt().isEqual(now));
    }

    private int countEventActiveApplies(Long eventId) {
        long applied = eventRegistrationRepository.countByEventIdAndStatus(eventId, RegistrationStatus.APPLIED);
        long approved = eventRegistrationRepository.countByEventIdAndStatus(eventId, RegistrationStatus.APPROVED);
        return Math.toIntExact(applied + approved);
    }

    private int countEventEntryCount(Long eventId) {
        long checkins = qrCheckinRepository.countByQrCode_Event_EventId(eventId);
        return Math.toIntExact(checkins);
    }

    private int countProgramActiveApplies(Long programId) {
        long active = programApplyRepository.countByProgramIdAndStatusIn(programId, PROGRAM_ACTIVE_STATUSES);
        return Math.toIntExact(active);
    }

    private int countProgramCheckins(Long programId) {
        long checkedIn = programApplyRepository.countByProgramIdAndCheckedInAtIsNotNull(programId);
        return Math.toIntExact(checkedIn);
    }

    private String resolveProgramZone(Program program) {
        if (program.getBoothId() == null) {
            return null;
        }
        return boothRepository.findById(program.getBoothId())
                .map(booth -> booth.getZone() == null ? null : booth.getZone().name())
                .orElse(null);
    }

    private String toUpperText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.toUpperCase(Locale.ROOT);
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : Math.max(0, value);
    }

    private double estimateEventBaseScore(
            int entryCount,
            int activeApplyCount,
            int runningProgramCount,
            int totalProgramCount,
            int totalWaitCount,
            double averageWaitMinutes
    ) {
        double totalApplyBase = Math.max(activeApplyCount, 1);
        double entryRate = entryCount / totalApplyBase;
        double waitRate = totalWaitCount / totalApplyBase;
        double waitTimeRate = Math.min(averageWaitMinutes / 20.0, 1.5);
        double programOperationRate = runningProgramCount / (double) Math.max(totalProgramCount, 1);
        double waitDensityRate = Math.min((totalWaitCount / (double) Math.max(runningProgramCount, 1)) / 15.0, 1.5);

        double score = (entryRate * 0.30)
                + (waitRate * 0.35)
                + (waitTimeRate * 0.20)
                + (waitDensityRate * 0.25)
                - (programOperationRate * 0.10);

        return clampScore(Math.max(0.0, Math.min(1.0, score)) * 100.0);
    }

    private double estimateProgramBaseScore(
            int activeApplyCount,
            int checkinCount,
            int waitCount,
            double waitMinutes
    ) {
        double applyBase = Math.max(activeApplyCount, 1);
        double checkinRate = checkinCount / applyBase;
        double waitRate = waitCount / applyBase;
        double waitTimeRate = Math.min(waitMinutes / 15.0, 1.5);

        double score = (checkinRate * 0.30)
                + (waitRate * 0.40)
                + (waitTimeRate * 0.30);

        return clampScore(Math.max(0.0, Math.min(1.0, score)) * 100.0);
    }

    private double clampScore(double value) {
        return roundOneDecimal(Math.max(0.0, Math.min(100.0, value)));
    }

    private double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private int levelFromScore(double score) {
        if (score <= 24.0) {
            return 1;
        }
        if (score <= 49.0) {
            return 2;
        }
        if (score <= 74.0) {
            return 3;
        }
        return 4;
    }

    private int waitFromScore(double score) {
        return Math.max(0, (int) Math.round(score * 0.35));
    }

    private void savePredictionLog(AiCongestionPredictionResponse prediction) {
        try {
            AiPredictionLog entity = AiPredictionLog.builder()
                    .targetType(resolveTargetType(prediction))
                    .eventId(prediction.eventId())
                    .programId(prediction.programId())
                    .predictionBaseTime(prediction.baseTime())
                    .predictedAvgScore60m(toScoreDecimal(prediction.predictedAvgScore()))
                    .predictedPeakScore60m(toScoreDecimal(prediction.predictedPeakScore()))
                    .predictedLevel((byte) prediction.predictedLevel())
                    .modelVersion(prediction.fallbackUsed() ? MODEL_VERSION_FALLBACK : MODEL_VERSION_AI)
                    .sourceType(AiPredictionSourceType.REALTIME)
                    .build();
            aiPredictionLogRepository.save(entity);
        } catch (Exception exception) {
            // Prediction logging must not break user-facing APIs.
            log.warn(
                    "Failed to persist ai_prediction_logs. targetType={}, eventId={}, programId={}, baseTime={}",
                    prediction.targetType(),
                    prediction.eventId(),
                    prediction.programId(),
                    prediction.baseTime(),
                    exception
            );
        }
    }

    private AiPredictionTargetType resolveTargetType(AiCongestionPredictionResponse prediction) {
        String value = prediction.targetType();
        if ("EVENT".equalsIgnoreCase(value)) {
            return AiPredictionTargetType.EVENT;
        }
        if ("PROGRAM".equalsIgnoreCase(value)) {
            return AiPredictionTargetType.PROGRAM;
        }
        return prediction.programId() == null
                ? AiPredictionTargetType.EVENT
                : AiPredictionTargetType.PROGRAM;
    }

    private BigDecimal toScoreDecimal(double score) {
        return BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP);
    }

    private record WaitAggregate(int totalWaitCount, double averageWaitMinutes) {
    }
}
