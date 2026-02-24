import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users, UserCheck, TrendingUp, Star } from "lucide-react";
import ds, { cardStyle } from "../shared/designTokens";
import { Bar2, ChartTip } from "../shared/Components";
import DATA from "../shared/data";

/* ── KPI 카드 ── */
function KpiCard({ icon: I, label, value, sub, color, bg }) {
  return (
    <div
      style={{
        ...cardStyle,
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <I size={20} color={color} strokeWidth={2} />
      </div>
      <div>
        <div
          style={{
            fontSize: 11.5,
            color: ds.ink4,
            fontWeight: 600,
            marginBottom: 3,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: ds.ink }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: ds.ink4, marginTop: 2 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ParticipantStats() {
  const stats = DATA.participantStats;

  return (
    <div>
      {/* KPI 요약 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <KpiCard
          icon={Users}
          label="총 등록 참가자"
          value={stats.totalRegistered.toLocaleString()}
          color={ds.brand}
          bg={ds.brandSoft}
        />
        <KpiCard
          icon={UserCheck}
          label="체크인 완료"
          value={stats.totalCheckedIn.toLocaleString()}
          sub={`체크인율 ${stats.checkinRate}%`}
          color={ds.green}
          bg={ds.greenSoft}
        />
        <KpiCard
          icon={TrendingUp}
          label="체크인율"
          value={`${stats.checkinRate}%`}
          color={ds.violet}
          bg={ds.violetSoft}
        />
        <KpiCard
          icon={Star}
          label="평균 만족도"
          value={`${stats.avgSatisfaction}/5.0`}
          color={ds.amber}
          bg={ds.amberSoft}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* 월별 참가자 추이 */}
        <div style={cardStyle}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: ds.ink,
              marginBottom: 14,
            }}
          >
            월별 참가자 추이
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.monthlyTrend} barSize={28}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={ds.lineSoft}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: ds.ink4 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: ds.ink4 }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <Tooltip content={<ChartTip />} />
              <Bar
                dataKey="participants"
                fill={ds.brand}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 행사별 참여율 */}
        <div style={cardStyle}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: ds.ink,
              marginBottom: 14,
            }}
          >
            행사별 참여율
          </div>
          {stats.byEvent.map((ev) => (
            <div key={ev.name} style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{ fontSize: 12.5, fontWeight: 600, color: ds.ink2 }}
                >
                  {ev.name}
                </span>
                <span style={{ fontSize: 11, color: ds.ink4 }}>
                  {ev.checkedIn}/{ev.registered} ({ev.rate}%)
                </span>
              </div>
              <Bar2
                pct={ev.rate}
                color={
                  ev.rate >= 85 ? ds.green : ev.rate >= 75 ? ds.brand : ds.amber
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
