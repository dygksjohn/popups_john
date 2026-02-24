import { Flame, Zap, CheckCircle2, Trophy } from "lucide-react";
import ds, { cardStyle, cong } from "../shared/designTokens";
import { Pill, Bar2, IconBox, KpiCard } from "../shared/Components";
import DATA from "../shared/data";

export default function RealtimeData() {
  return (
    <div style={{ display: "flex", gap: 20 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
          {DATA.kpi.map(d => <KpiCard key={d.id} d={d} />)}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* 체험 존 */}
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 700, color: ds.ink, marginBottom: 14 }}>체험 존 현황</div>
            {DATA.zones.map(z => {
              const p = Math.round(z.cur / z.max * 100);
              const s = cong(p);
              return (
                <div key={z.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <IconBox icon={p >= 80 ? Flame : p >= 50 ? Zap : CheckCircle2} color={s.c} bg={s.bg} size={30} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: ds.ink2 }}>{z.name}</span>
                      <span style={{ fontSize: 11, color: ds.ink4 }}>{z.cur}/{z.max}</span>
                    </div>
                    <Bar2 pct={p} color={s.c} h={4} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 부스 혼잡도 */}
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 700, color: ds.ink, marginBottom: 14 }}>부스 혼잡도</div>
            {DATA.congestion.map(z => {
              const s = cong(z.pct);
              return (
                <div key={z.zone} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: ds.ink2 }}>{z.zone}</span>
                    <Pill color={s.c} bg={s.bg}>{z.pct}% · {s.t}</Pill>
                  </div>
                  <Bar2 pct={z.pct} color={s.c} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 우측 콘테스트 */}
      <div style={{ width: 260, flexShrink: 0 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, color: ds.ink, marginBottom: 14 }}>콘테스트 현황</div>
          {DATA.contests.map(c => (
            <div key={c.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${ds.lineSoft}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Trophy size={14} color={ds.violet} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: ds.ink }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: ds.ink4 }}>{c.teams}팀</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: ds.brand }}>{c.votes.toLocaleString()}<span style={{ fontSize: 10, color: ds.ink4, fontWeight: 400 }}> 표</span></div>
                <Pill color={c.live ? "#059669" : "#B45309"} bg={c.live ? ds.greenSoft : ds.amberSoft}>{c.live ? "LIVE" : "투표중"}</Pill>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
