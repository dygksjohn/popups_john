import { useState, useEffect } from "react";
import {
  MapPin,
  Users,
  Activity,
  Zap,
  BarChart3,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import ds from "../shared/designTokens";
import DATA from "../shared/data";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { getToken } from "../../../api/noticeApi";

const authHeaders = () => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

/* ── 커스텀 차트 툴팁 ── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #F1F5F9",
        borderRadius: 8,
        padding: "8px 12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        fontSize: 12,
      }}
    >
      <div style={{ fontWeight: 700, color: ds.ink, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ color: "#64748B" }}>{payload[0].value}%</div>
    </div>
  );
}

/* ── 스탯 카드 ── */
function StatCard({ icon: I, label, value, sub }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #F1F5F9",
        padding: 16,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: "#F8FAFC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <I size={16} color="#64748B" />
      </div>
      <div>
        <div
          style={{
            fontSize: 11,
            color: "#94A3B8",
            fontWeight: 600,
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: ds.ink }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 1 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 미니 프로그레스 바 ── */
function MiniProgress({ pct }) {
  const color = pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : ds.brand;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{ flex: 1, height: 4, borderRadius: 2, background: "#F1F5F9" }}
      >
        <div
          style={{
            width: `${Math.min(pct, 100)}%`,
            height: "100%",
            borderRadius: 2,
            background: color,
            transition: "width .3s",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color,
          minWidth: 32,
          textAlign: "right",
        }}
      >
        {pct}%
      </span>
    </div>
  );
}

export default function PastEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  /* ── DB에서 지난 행사 로드 ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get(
          "/api/admin/dashboard/past-events",
          { headers: authHeaders() },
        );
        const list = res.data?.data || res.data || [];
        if (list.length > 0) {
          setEvents(list);
          setSelectedId(list[0].id || list[0].eventId);
        } else {
          setEvents([]);
        }
      } catch (err) {
        console.error("[PastEvents] API 로드 실패, mock 데이터 사용:", err);
        const fallback = DATA.pastEvents || [];
        setEvents(fallback);
        if (fallback.length > 0) setSelectedId(fallback[0].id);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const ev = selectedId
    ? events.find((e) => (e.id || e.eventId) === selectedId) || events[0]
    : events[0];

  /* ── 로딩 ── */
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "80px 0",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            border: `3px solid ${ds.brand}20`,
            borderTopColor: ds.brand,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <div
          style={{
            fontSize: 13,
            color: "#94A3B8",
            fontWeight: 600,
            marginTop: 14,
          }}
        >
          지난 행사 로딩 중...
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  /* ── 빈 상태 ── */
  if (events.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "80px 0",
        }}
      >
        <CalendarDays size={42} color="#CBD5E1" strokeWidth={1.5} />
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#94A3B8",
            marginTop: 14,
          }}
        >
          종료된 행사가 없습니다
        </div>
        <div style={{ fontSize: 13, color: "#CBD5E1", marginTop: 4 }}>
          행사가 종료되면 여기에 표시됩니다
        </div>
      </div>
    );
  }

  if (!ev) return null;

  const totalParticipants = events.reduce(
    (a, b) => a + (b.participants || 0),
    0,
  );
  const avgZoneUsage = Math.round(
    events.reduce((a, b) => a + (b.zoneUsage || 0), 0) / events.length,
  );
  const avgEventRate = Math.round(
    events.reduce((a, b) => a + (b.eventRate || 0), 0) / events.length,
  );
  const avgCongestion = Math.round(
    events.reduce((a, b) => a + (b.avgCongestion || 0), 0) / events.length,
  );
  const capacityPct =
    ev.capacity > 0
      ? Math.round(((ev.participants || 0) / ev.capacity) * 100)
      : 0;

  return (
    <div>
      {/* KPI */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <StatCard
          icon={Users}
          label="총 참가자 수"
          value={totalParticipants.toLocaleString()}
          sub={`지난 ${events.length}개 행사 합산`}
        />
        <StatCard
          icon={Activity}
          label="평균 체험 이용률"
          value={`${avgZoneUsage}%`}
          sub="체험존 평균"
        />
        <StatCard
          icon={Zap}
          label="평균 이벤트 참여율"
          value={`${avgEventRate}%`}
          sub="이벤트 참여 평균"
        />
        <StatCard
          icon={BarChart3}
          label="평균 혼잡도"
          value={`${avgCongestion}%`}
          sub="평균 피크 시간대"
        />
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 14 }}
      >
        {/* 테이블 */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #F1F5F9",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderBottom: "1px solid #F1F5F9",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 800, color: ds.ink }}>
              지난 행사 목록
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8" }}>
              {events.length}건
            </span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                {[
                  "행사명",
                  "일자",
                  "장소",
                  "참가자",
                  "이용률",
                  "참여율",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 14px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "#94A3B8",
                      textAlign:
                        h === "참가자" || h === "이용률" || h === "참여율"
                          ? "right"
                          : "left",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((r) => {
                const rid = r.id || r.eventId;
                const active = (ev.id || ev.eventId) === rid;
                return (
                  <tr
                    key={rid}
                    onClick={() => setSelectedId(rid)}
                    style={{
                      borderBottom: "1px solid #F8FAFC",
                      cursor: "pointer",
                      transition: "background .1s",
                      background: active ? `${ds.brand}04` : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = "#F4F6F8";
                    }}
                    onMouseLeave={(e) => {
                      if (!active)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <td style={{ padding: "11px 14px" }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: active ? ds.brand : ds.ink,
                        }}
                      >
                        {r.name}
                      </div>
                      <div style={{ fontSize: 10.5, color: "#94A3B8" }}>
                        {r.id || `PE-${r.eventId}`}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "11px 14px",
                        fontSize: 12.5,
                        color: "#475569",
                      }}
                    >
                      {r.date}
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 12.5,
                          color: "#475569",
                        }}
                      >
                        <MapPin size={11} color="#94A3B8" />
                        {r.location}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "11px 14px",
                        fontSize: 13,
                        fontWeight: 700,
                        color: ds.ink,
                        textAlign: "right",
                      }}
                    >
                      {(r.participants || 0).toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: "11px 14px",
                        fontSize: 12.5,
                        color: "#475569",
                        textAlign: "right",
                      }}
                    >
                      {r.zoneUsage || 0}%
                    </td>
                    <td
                      style={{
                        padding: "11px 14px",
                        fontSize: 12.5,
                        color: "#475569",
                        textAlign: "right",
                      }}
                    >
                      {r.eventRate || 0}%
                    </td>
                    <td style={{ padding: "11px 14px", width: 28 }}>
                      {active && <ChevronRight size={14} color={ds.brand} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 우측 상세 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #F1F5F9",
              padding: 20,
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: ds.ink,
                marginBottom: 3,
              }}
            >
              {ev.name}
            </div>
            <div style={{ fontSize: 11.5, color: "#94A3B8", marginBottom: 18 }}>
              {ev.date} · {ev.location}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginBottom: 18,
              }}
            >
              {[
                { l: "참가자", v: (ev.participants || 0).toLocaleString() },
                { l: "수용 인원", v: (ev.capacity || 0).toLocaleString() },
                { l: "체험 이용률", v: `${ev.zoneUsage || 0}%` },
                { l: "이벤트 참여율", v: `${ev.eventRate || 0}%` },
              ].map((s) => (
                <div
                  key={s.l}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "#F8FAFC",
                  }}
                >
                  <div
                    style={{ fontSize: 10, color: "#94A3B8", marginBottom: 3 }}
                  >
                    {s.l}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: ds.ink }}>
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 4 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: "#94A3B8",
                  marginBottom: 6,
                }}
              >
                <span>수용률</span>
                <span style={{ fontWeight: 700 }}>{capacityPct}%</span>
              </div>
              <MiniProgress pct={capacityPct} />
            </div>
          </div>

          {/* 혼잡도 차트 */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #F1F5F9",
              padding: 20,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: ds.ink,
                marginBottom: 16,
              }}
            >
              시간대별 혼잡도
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={DATA.pastHourlyCongestion}>
                <defs>
                  <linearGradient id="gCong" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#94A3B8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F1F5F9"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 100]}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#64748B"
                  strokeWidth={2}
                  fill="url(#gCong)"
                  dot={{
                    r: 3,
                    fill: "#64748B",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
