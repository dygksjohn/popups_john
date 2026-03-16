const LEVEL_LABEL_MAP = {
  1: "여유",
  2: "원활",
  3: "보통",
  4: "인기",
  5: "매우 인기",
};

const LEVEL_TONE_MAP = {
  1: { color: "#047857", bg: "#ecfdf5", border: "#a7f3d0" },
  2: { color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  3: { color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  4: { color: "#c2410c", bg: "#fff7ed", border: "#fdba74" },
  5: { color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function resolveLevel(score, level) {
  const explicitLevel = Number(level);
  if ([1, 2, 3, 4, 5].includes(explicitLevel)) return explicitLevel;

  const normalizedScore = clamp(Math.round(toNumber(score, 0)), 0, 100);
  if (normalizedScore >= 81) return 5;
  if (normalizedScore >= 61) return 4;
  if (normalizedScore >= 41) return 3;
  if (normalizedScore >= 21) return 2;
  return 1;
}

export function getLevelMeta(score, level) {
  const resolved = resolveLevel(score, level);
  return {
    level: resolved,
    label: LEVEL_LABEL_MAP[resolved] ?? LEVEL_LABEL_MAP[1],
    tone: LEVEL_TONE_MAP[resolved] ?? LEVEL_TONE_MAP[1],
  };
}

export function normalizePrediction(payload) {
  if (!payload || typeof payload !== "object") return null;

  const avgScore = clamp(toNumber(payload.predictedAvgScore, 0), 0, 100);
  const peakScore = clamp(toNumber(payload.predictedPeakScore, avgScore), 0, 100);
  const waitMinutes = Math.max(0, Math.round(toNumber(payload.predictedWaitMinutes, 0)));
  const confidence = clamp(toNumber(payload.confidence, 0), 0, 1);
  const levelMeta = getLevelMeta(peakScore, payload.predictedLevel);

  const timeline = Array.isArray(payload.timeline)
    ? payload.timeline
        .map((point) => {
          const score = clamp(toNumber(point?.score, 0), 0, 100);
          const pointLevel = getLevelMeta(score, point?.predictedLevel);
          return {
            time: point?.time ?? point?.timestamp ?? null,
            score,
            level: pointLevel.level,
            label: pointLevel.label,
            tone: pointLevel.tone,
          };
        })
        .filter((point) => point.time)
    : [];

  return {
    targetType: String(payload.targetType ?? ""),
    eventId: payload.eventId ?? null,
    programId: payload.programId ?? null,
    baseTime: payload.baseTime ?? null,
    avgScore,
    peakScore,
    level: levelMeta.level,
    levelLabel: levelMeta.label,
    levelTone: levelMeta.tone,
    waitMinutes,
    confidence,
    fallbackUsed: Boolean(payload.fallbackUsed),
    timeline,
  };
}

export function normalizeRecommendation(payload) {
  if (!payload || typeof payload !== "object") return null;

  const recommendations = Array.isArray(payload.recommendations)
    ? payload.recommendations.map((item) => {
        const score = clamp(toNumber(item?.predictedScore, 0), 0, 100);
        const levelMeta = getLevelMeta(score, item?.predictedLevel);
        return {
          programId: item?.programId ?? null,
          title: item?.title ?? "Untitled",
          category: item?.category ?? null,
          target: item?.target ?? null,
          zone: item?.zone ?? null,
          startAt: item?.startAt ?? null,
          endAt: item?.endAt ?? null,
          score,
          level: levelMeta.level,
          levelLabel: levelMeta.label,
          levelTone: levelMeta.tone,
          waitMinutes: Math.max(0, Math.round(toNumber(item?.predictedWaitMinutes, 0))),
          reason: item?.reason ?? "",
        };
      })
    : [];

  return {
    eventId: payload.eventId ?? null,
    programId: payload.programId ?? null,
    thresholdScore: clamp(toNumber(payload.thresholdScore, 75), 0, 100),
    fallbackUsed: Boolean(payload.fallbackUsed),
    message: String(payload.message ?? ""),
    recommendations,
  };
}

export function formatKoreanTime(value) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

