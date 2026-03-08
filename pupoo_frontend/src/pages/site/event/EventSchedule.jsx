import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Clock3, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { eventApi } from "../../../app/http/eventApi";
import { normalizeEventTitle } from "../../../shared/utils/eventDisplay";

const EVENT_CATEGORIES = [
  { label: "현재 진행 행사", path: "/event/current" },
  { label: "예정 행사", path: "/event/upcoming" },
  { label: "종료 행사", path: "/event/closed" },
  { label: "행사 일정 안내", path: "/event/eventschedule" },
];

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const DAY_MS = 24 * 60 * 60 * 1000;
const STATUS_META = {
  ONGOING: { label: "진행 중", bar: "#14b8a6", soft: "#ccfbf1", text: "#0f766e" },
  UPCOMING: { label: "예정", bar: "#3b82f6", soft: "#dbeafe", text: "#1d4ed8" },
  ENDED: { label: "종료", bar: "#94a3b8", soft: "#e5e7eb", text: "#475569" },
};
const ACTIVE_PALETTE = [
  { bar: "#93c5fd", soft: "#dbeafe", text: "#1e3a8a" },
  { bar: "#99f6e4", soft: "#ccfbf1", text: "#115e59" },
  { bar: "#fdba74", soft: "#ffedd5", text: "#9a3412" },
  { bar: "#fda4af", soft: "#fee2e2", text: "#9f1239" },
  { bar: "#c4b5fd", soft: "#ede9fe", text: "#5b21b6" },
  { bar: "#f9a8d4", soft: "#fce7f3", text: "#9d174d" },
  { bar: "#86efac", soft: "#dcfce7", text: "#166534" },
  { bar: "#fde68a", soft: "#fef3c7", text: "#92400e" },
];

const styles = `
  .event-month-root {
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(59, 130, 246, 0.12), transparent 24%),
      linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
  }
  .event-month-wrap {
    width: min(1380px, calc(100% - 44px));
    margin: 0 auto;
    padding: 34px 0 72px;
    font-family: "Noto Sans KR", sans-serif;
  }
  .event-month-toolbar {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }
  .event-month-copy {
    display: grid;
    gap: 6px;
  }
  .event-month-copy strong {
    font-size: 28px;
    line-height: 1.2;
    color: #0f172a;
    font-weight: 900;
  }
  .event-month-copy span {
    font-size: 13px;
    line-height: 1.6;
    color: #64748b;
  }
  .event-month-select-wrap {
    position: relative;
    min-width: 180px;
  }
  .event-month-select {
    width: 100%;
    height: 42px;
    border-radius: 14px;
    border: 1px solid #cbd5e1;
    background: rgba(255, 255, 255, 0.92);
    color: #0f172a;
    font-size: 14px;
    font-weight: 800;
    padding: 0 40px 0 14px;
    appearance: none;
    cursor: pointer;
  }
  .event-month-select-icon {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%) rotate(90deg);
    color: #64748b;
    pointer-events: none;
  }
  .event-month-card {
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(203, 213, 225, 0.92);
    border-radius: 28px;
    box-shadow: 0 26px 60px rgba(15, 23, 42, 0.06);
    overflow: hidden;
  }
  .event-month-head {
    padding: 24px 26px 18px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .event-month-head strong {
    font-size: 30px;
    line-height: 1.1;
    color: #0f172a;
    font-weight: 900;
  }
  .event-month-head span {
    margin-top: 6px;
    font-size: 13px;
    color: #64748b;
    line-height: 1.6;
  }
  .event-month-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 92px;
    height: 38px;
    padding: 0 14px;
    border-radius: 999px;
    background: #eff6ff;
    color: #2563eb;
    font-size: 13px;
    font-weight: 900;
  }
  .event-month-grid-wrap {
    padding: 20px 24px 0;
    overflow-x: auto;
  }
  .event-month-grid {
    min-width: 930px;
  }
  .event-month-weekdays,
  .event-month-day-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 10px;
  }
  .event-month-weekdays {
    margin-bottom: 8px;
  }
  .event-month-weekday {
    padding: 0 8px 8px;
    font-size: 12px;
    color: #64748b;
    font-weight: 800;
  }
  .event-month-week {
    margin-bottom: 14px;
  }
  .event-month-day {
    min-height: 76px;
    border-radius: 18px;
    border: 1px solid #dbe5f1;
    background: #f8fbff;
    padding: 10px 10px 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .event-month-day.outside {
    background: #f8fafc;
    color: #94a3b8;
    opacity: 0.72;
  }
  .event-month-day.today {
    border-color: #60a5fa;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.12);
  }
  .event-month-day-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .event-month-day-number {
    font-size: 20px;
    color: #0f172a;
    font-weight: 900;
  }
  .event-month-day-marker {
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    border-radius: 999px;
    background: #eff6ff;
    color: #2563eb;
    font-size: 11px;
    font-weight: 900;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .event-month-bars {
    position: relative;
  }
  .event-month-bar {
    position: absolute;
    height: 36px;
    border: none;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    color: #0f172a;
    font-size: 12px;
    font-weight: 900;
    cursor: pointer;
    overflow: hidden;
    box-shadow: 0 10px 20px rgba(15, 23, 42, 0.10);
  }
  .event-month-bar-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .event-month-list {
    padding: 0 24px 24px;
    display: grid;
    gap: 12px;
  }
  .event-month-list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 18px;
    border-radius: 18px;
    background: #fff;
    border: 1px solid #e2e8f0;
  }
  .event-month-list-main {
    min-width: 0;
    display: grid;
    gap: 8px;
  }
  .event-month-list-top {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .event-month-badge {
    display: inline-flex;
    align-items: center;
    height: 26px;
    padding: 0 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 900;
    flex-shrink: 0;
  }
  .event-month-list-title {
    color: #0f172a;
    font-size: 15px;
    font-weight: 900;
    line-height: 1.45;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .event-month-list-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    color: #64748b;
    font-size: 12px;
  }
  .event-month-list-meta span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .event-month-link {
    height: 38px;
    padding: 0 14px;
    border-radius: 12px;
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #0f172a;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
  }
  .event-month-empty {
    padding: 24px;
    color: #64748b;
    font-size: 14px;
    line-height: 1.7;
  }
  @media (max-width: 720px) {
    .event-month-wrap {
      width: min(100%, calc(100% - 24px));
      padding: 22px 0 54px;
    }
    .event-month-copy strong,
    .event-month-head strong {
      font-size: 22px;
    }
    .event-month-list-item {
      align-items: flex-start;
      flex-direction: column;
    }
  }
`;

function toDate(value) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return startOfDay(next);
}

function startOfWeek(date) {
  const base = startOfDay(date);
  return addDays(base, -base.getDay());
}

function sameDay(left, right) {
  if (!left || !right) return false;
  return startOfDay(left).getTime() === startOfDay(right).getTime();
}

function daysBetween(start, end) {
  return Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / DAY_MS);
}

function formatMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(monthStart) {
  return `${monthStart.getFullYear()}년 ${monthStart.getMonth() + 1}월`;
}

function formatRange(startAt, endAt) {
  const start = toDate(startAt);
  const end = toDate(endAt) || start;
  if (!start) return "일정 미정";

  const startText = `${start.getFullYear()}.${String(start.getMonth() + 1).padStart(2, "0")}.${String(start.getDate()).padStart(2, "0")}`;
  if (!end || sameDay(start, end)) return startText;
  const endText = `${end.getFullYear()}.${String(end.getMonth() + 1).padStart(2, "0")}.${String(end.getDate()).padStart(2, "0")}`;
  return `${startText} - ${endText}`;
}

function toStatus(status, startAt, endAt) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "OPEN" || normalized === "ONGOING" || normalized === "CURRENT") return "ONGOING";
  if (normalized === "UPCOMING" || normalized === "SCHEDULED") return "UPCOMING";
  if (normalized === "CLOSED" || normalized === "ENDED") return "ENDED";

  const today = startOfDay(new Date()).getTime();
  const start = startOfDay(toDate(startAt) || new Date()).getTime();
  const end = startOfDay(toDate(endAt) || toDate(startAt) || new Date()).getTime();
  if (start <= today && end >= today) return "ONGOING";
  if (start > today) return "UPCOMING";
  return "ENDED";
}

function hashSeed(value) {
  const text = String(value || "");
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function resolveEventAccent(eventId, statusLabel, title) {
  const statusMeta = STATUS_META[statusLabel] || STATUS_META.UPCOMING;
  if (statusLabel === "ENDED") return statusMeta;
  const palette = ACTIVE_PALETTE[hashSeed(`${eventId || 0}:${title || ""}`) % ACTIVE_PALETTE.length];
  return {
    label: statusMeta.label,
    bar: palette.bar,
    soft: palette.soft,
    text: palette.text,
  };
}

function buildMonthOptions(events, currentMonthKey) {
  const monthKeys = new Set([currentMonthKey]);

  events.forEach((event) => {
    let cursor = new Date(event.startDate.getFullYear(), event.startDate.getMonth(), 1);
    const endMonth = new Date(event.endDate.getFullYear(), event.endDate.getMonth(), 1);
    while (cursor.getTime() <= endMonth.getTime()) {
      monthKeys.add(formatMonthKey(cursor));
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
  });

  return Array.from(monthKeys).sort((left, right) => right.localeCompare(left));
}

function buildMonthModel(events, monthKey) {
  const [year, month] = String(monthKey).split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = addDays(startOfWeek(monthEnd), 6);
  const monthEvents = events
    .filter((event) => event.startDate.getTime() <= monthEnd.getTime() && event.endDate.getTime() >= monthStart.getTime())
    .sort((left, right) => left.startDate.getTime() - right.startDate.getTime());

  const weeks = [];
  for (let cursor = gridStart; cursor.getTime() <= gridEnd.getTime(); cursor = addDays(cursor, 7)) {
    const days = Array.from({ length: 7 }, (_, index) => addDays(cursor, index));
    const weekStart = days[0];
    const weekEnd = days[6];
    const visibleEvents = monthEvents.filter(
      (event) => event.startDate.getTime() <= weekEnd.getTime() && event.endDate.getTime() >= weekStart.getTime(),
    );
    const laneLastEnds = [];
    const segments = visibleEvents.map((event) => {
      const visibleStart = new Date(Math.max(event.startDate.getTime(), weekStart.getTime(), monthStart.getTime()));
      const visibleEnd = new Date(Math.min(event.endDate.getTime(), weekEnd.getTime(), monthEnd.getTime()));
      const startCol = daysBetween(weekStart, visibleStart);
      const endCol = daysBetween(weekStart, visibleEnd);
      let lane = laneLastEnds.findIndex((lastEnd) => lastEnd < startCol);
      if (lane === -1) lane = laneLastEnds.length;
      laneLastEnds[lane] = endCol;
      return {
        ...event,
        startCol,
        span: endCol - startCol + 1,
        lane,
        startsHere: sameDay(visibleStart, event.startDate),
        endsHere: sameDay(visibleEnd, event.endDate),
      };
    });

    weeks.push({
      key: cursor.toISOString(),
      days,
      segments,
      laneCount: segments.length ? Math.max(...segments.map((segment) => segment.lane)) + 1 : 0,
    });
  }

  return { monthStart, monthEvents, weeks };
}

export default function EventSchedule() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentMonthKey = formatMonthKey(new Date());
  const [selectedMonthKey, setSelectedMonthKey] = useState(currentMonthKey);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await eventApi.getEvents({ page: 0, size: 200, sort: "startAt,asc" });
        if (!mounted) return;

        const rows = Array.isArray(res?.data?.data?.content) ? res.data.data.content : [];
        const mapped = rows
          .map((row) => {
            const startDate = startOfDay(toDate(row?.startAt) || new Date());
            const rawEnd = toDate(row?.endAt) || toDate(row?.startAt) || new Date();
            const endDate = startOfDay(rawEnd);
            const statusLabel = toStatus(row?.status, row?.startAt, row?.endAt);
            return {
              eventId: row?.eventId,
              eventName: normalizeEventTitle(row?.eventName, row),
              location: row?.location || "장소 미정",
              organizer: row?.organizer || "주최 정보 없음",
              description: row?.description || "",
              startAt: row?.startAt || null,
              endAt: row?.endAt || row?.startAt || null,
              startDate,
              endDate: endDate.getTime() >= startDate.getTime() ? endDate : startDate,
              statusLabel,
              accent: resolveEventAccent(row?.eventId, statusLabel, row?.eventName),
            };
          })
          .sort((left, right) => left.startDate.getTime() - right.startDate.getTime());

        setEvents(mapped);
      } catch (err) {
        if (!mounted) return;
        setEvents([]);
        setError(err?.response?.data?.message || err?.message || "행사 일정을 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const monthOptions = useMemo(() => buildMonthOptions(events, currentMonthKey), [currentMonthKey, events]);
  const monthModel = useMemo(() => buildMonthModel(events, selectedMonthKey), [events, selectedMonthKey]);
  const today = startOfDay(new Date());

  return (
    <div className="event-month-root">
      <style>{styles}</style>
      <PageHeader
        title="행사 일정 안내"
        subtitle="조회할 월을 선택하면 해당 월 일정만 달력에 표시됩니다."
        categories={EVENT_CATEGORIES}
      />

      <main className="event-month-wrap">
        <section className="event-month-toolbar">
          <div className="event-month-copy">
            <strong>월별 행사 일정표</strong>
          </div>

          <div className="event-month-select-wrap">
            <select
              className="event-month-select"
              value={selectedMonthKey}
              onChange={(event) => setSelectedMonthKey(event.target.value)}
            >
              {monthOptions.map((monthKey) => (
                <option key={monthKey} value={monthKey}>
                  {monthKey}
                </option>
              ))}
            </select>
            <ChevronRight size={16} className="event-month-select-icon" />
          </div>
        </section>

        <section className="event-month-card">
          <div className="event-month-head">
            <div>
              <strong>{formatMonthLabel(monthModel.monthStart)}</strong>
            </div>
            <div className="event-month-count">{monthModel.monthEvents.length}개 일정</div>
          </div>

          {loading ? (
            <div className="event-month-empty">행사 일정을 불러오는 중입니다.</div>
          ) : error ? (
            <div className="event-month-empty">{error}</div>
          ) : (
            <>
              <div className="event-month-grid-wrap">
                <div className="event-month-grid">
                  <div className="event-month-weekdays">
                    {WEEKDAY_LABELS.map((label) => (
                      <div key={label} className="event-month-weekday">{label}</div>
                    ))}
                  </div>

                  {monthModel.weeks.map((week) => (
                    <div key={week.key} className="event-month-week">
                      <div className="event-month-day-grid">
                        {week.days.map((day) => {
                          const outside = day.getMonth() !== monthModel.monthStart.getMonth();
                          const markerCount = monthModel.monthEvents.filter(
                            (eventItem) => sameDay(day, eventItem.startDate) || sameDay(day, eventItem.endDate),
                          ).length;
                          return (
                            <div
                              key={day.toISOString()}
                              className={`event-month-day${outside ? " outside" : ""}${sameDay(day, today) ? " today" : ""}`}
                            >
                              <div className="event-month-day-top">
                                <span className="event-month-day-number">{day.getDate()}</span>
                                {markerCount ? <span className="event-month-day-marker">{markerCount}</span> : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="event-month-bars" style={{ height: `${Math.max(week.laneCount, 1) * 40}px` }}>
                        {week.segments.map((segment) => {
                          const meta = segment.accent || STATUS_META[segment.statusLabel] || STATUS_META.UPCOMING;
                          return (
                            <button
                              key={`${segment.eventId}-${segment.lane}-${week.key}`}
                              type="button"
                              className="event-month-bar"
                              title={`${segment.eventName} (${formatRange(segment.startAt, segment.endAt)})`}
                              onClick={() => navigate(`/program/all/${segment.eventId}`)}
                              style={{
                                left: `calc(${(segment.startCol / 7) * 100}% + 4px)`,
                                width: `calc(${(segment.span / 7) * 100}% - 8px)`,
                                top: `${segment.lane * 40}px`,
                                background: meta.bar,
                                color: meta.text,
                                borderRadius: `${segment.startsHere ? 12 : 4}px ${segment.endsHere ? 12 : 4}px ${segment.endsHere ? 12 : 4}px ${segment.startsHere ? 12 : 4}px`,
                              }}
                            >
                              {!segment.startsHere ? <span>...</span> : null}
                              <span className="event-month-bar-text">{segment.eventName}</span>
                              {!segment.endsHere ? <span>...</span> : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {monthModel.monthEvents.length === 0 ? (
                <div className="event-month-empty">선택한 월에는 등록된 행사가 없습니다.</div>
              ) : (
                <div className="event-month-list">
                  {monthModel.monthEvents.map((eventItem) => {
                    const meta = eventItem.accent || STATUS_META[eventItem.statusLabel] || STATUS_META.UPCOMING;
                    return (
                      <div key={eventItem.eventId} className="event-month-list-item">
                        <div className="event-month-list-main">
                          <div className="event-month-list-top">
                            <span className="event-month-badge" style={{ background: meta.soft, color: meta.text }}>
                              {meta.label}
                            </span>
                            <div className="event-month-list-title">{eventItem.eventName}</div>
                          </div>
                          <div className="event-month-list-meta">
                            <span><CalendarDays size={13} />{formatRange(eventItem.startAt, eventItem.endAt)}</span>
                            <span><MapPin size={13} />{eventItem.location}</span>
                            <span><Clock3 size={13} />{eventItem.description || eventItem.organizer}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="event-month-link"
                          onClick={() => navigate(`/program/all/${eventItem.eventId}`)}
                        >
                          관련 프로그램 이동
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
