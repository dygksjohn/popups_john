import { useState } from "react";
import { MapPin } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import ds, { cardStyle } from "../shared/designTokens";
import { Bar2, ChartTip, DataTable, TRow, Td, MiniStat } from "../shared/Components";
import DATA from "../shared/data";

export default function PastEvents() {
  const [selected, setSelected] = useState(null);
  const ev = selected ? DATA.pastEvents.find(e => e.id === selected) : DATA.pastEvents[0];

  return (
    <div>
      {/* KPI 요약 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
        <MiniStat label="총 참가자 수" value={DATA.pastEvents.reduce((a, b) => a + b.participants, 0).toLocaleString()} sub="지난 5개 행사 합산" color={ds.brand} />
        <MiniStat label="평균 체험 이용률" value={`${Math.round(DATA.pastEvents.reduce((a, b) => a + b.zoneUsage, 0) / DATA.pastEvents.length)}%`} sub="체험존 평균" color={ds.green} />
        <MiniStat label="평균 이벤트 참여율" value={`${Math.round(DATA.pastEvents.reduce((a, b) => a + b.eventRate, 0) / DATA.pastEvents.length)}%`} sub="이벤트 참여 평균" color={ds.violet} />
        <MiniStat label="평균 혼잡도" value={`${Math.round(DATA.pastEvents.reduce((a, b) => a + b.avgCongestion, 0) / DATA.pastEvents.length)}%`} sub="평균 피크 시간대" color={ds.amber} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 14 }}>
        {/* 목록 테이블 */}
        <DataTable title="지난 행사 목록" count={DATA.pastEvents.length}
          columns={[{ label: "ID" }, { label: "행사명" }, { label: "일자" }, { label: "장소" }, { label: "참가자", align: "right" }, { label: "이용률", align: "right" }, { label: "참여율", align: "right" }]}
          rows={DATA.pastEvents}
          renderRow={r => (
            <TRow key={r.id}>
              <Td mono>{r.id}</Td>
              <Td bold><span style={{ cursor: "pointer", color: ds.brand }} onClick={() => setSelected(r.id)}>{r.name}</span></Td>
              <Td>{r.date}</Td>
              <Td><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><MapPin size={12} />{r.location}</span></Td>
              <Td align="right" bold>{r.participants.toLocaleString()}</Td>
              <Td align="right">{r.zoneUsage}%</Td>
              <Td align="right">{r.eventRate}%</Td>
            </TRow>
          )}
        />

        {/* 우측 상세 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 700, color: ds.ink, marginBottom: 4 }}>{ev.name}</div>
            <div style={{ fontSize: 11, color: ds.ink4, marginBottom: 16 }}>{ev.date} · {ev.location}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { l: "참가자", v: ev.participants.toLocaleString(), c: ds.brand },
                { l: "수용 인원", v: ev.capacity.toLocaleString(), c: ds.ink3 },
                { l: "체험 이용률", v: `${ev.zoneUsage}%`, c: ds.green },
                { l: "이벤트 참여율", v: `${ev.eventRate}%`, c: ds.violet },
              ].map(s => (
                <div key={s.l} style={{ padding: 12, borderRadius: ds.rs, background: ds.bg }}>
                  <div style={{ fontSize: 10.5, color: ds.ink4, marginBottom: 4 }}>{s.l}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: s.c }}>{s.v}</div>
                </div>
              ))}
            </div>
            <Bar2 pct={Math.round(ev.participants / ev.capacity * 100)} color={ds.brand} h={6} />
            <div style={{ fontSize: 11, color: ds.ink4, marginTop: 6, textAlign: "right" }}>수용률 {Math.round(ev.participants / ev.capacity * 100)}%</div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 700, color: ds.ink, marginBottom: 14 }}>시간대별 혼잡도</div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={DATA.pastHourlyCongestion}>
                <defs><linearGradient id="gCong" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ds.amber} stopOpacity={0.2} /><stop offset="100%" stopColor={ds.amber} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={ds.lineSoft} vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: ds.ink4 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: ds.ink4 }} axisLine={false} tickLine={false} width={28} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="value" stroke={ds.amber} strokeWidth={2} fill="url(#gCong)" dot={{ r: 3, fill: ds.amber, stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
