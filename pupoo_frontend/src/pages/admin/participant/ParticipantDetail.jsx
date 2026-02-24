import { Phone, Mail, PawPrint, Calendar, UserCheck, CreditCard, Edit3, Trash2, Check, X, RefreshCw, Clock } from "lucide-react";
import ds, { cardStyle, statusMap } from "../shared/designTokens";
import { Pill, ActionBtn } from "../shared/Components";
import DATA from "../shared/data";

export default function ParticipantDetail() {
  const p = DATA.participants[0];
  const st = statusMap[p.status];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
      {/* 좌측 상세 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${ds.brandSoft}, ${ds.violetSoft})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: ds.brand }}>{p.name[0]}</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: ds.ink }}>{p.name}</div>
                <div style={{ fontSize: 12, color: ds.ink4, marginTop: 2 }}>{p.id} · {p.event}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <ActionBtn icon={Edit3} label="수정" />
              <ActionBtn icon={Trash2} label="삭제" color={ds.red} bg={ds.redSoft} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { icon: Phone, label: "연락처", value: p.phone },
              { icon: Mail, label: "이메일", value: p.email },
              { icon: PawPrint, label: "반려견", value: `${p.petName} (${p.petBreed})` },
              { icon: Calendar, label: "등록일", value: p.regDate },
              { icon: UserCheck, label: "체크인", value: p.checkedIn ? `${p.checkinTime} 완료` : "미체크인" },
              { icon: CreditCard, label: "결제", value: `${p.amount.toLocaleString()}원 (${p.payMethod})` },
            ].map(item => (
              <div key={item.label} style={{ padding: 14, borderRadius: ds.rs, background: ds.bg, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <item.icon size={15} color={ds.ink4} style={{ marginTop: 1, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 10.5, color: ds.ink4, marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: ds.ink }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 행사 신청 관리 */}
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, color: ds.ink, marginBottom: 14 }}>행사 신청 관리</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: ds.ink2 }}>현재 상태:</span>
            <Pill color={st.c} bg={st.bg}>{st.l}</Pill>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <ActionBtn icon={Check} label="신청 승인" color="#059669" bg={ds.greenSoft} />
            <ActionBtn icon={X} label="반려" color={ds.red} bg={ds.redSoft} />
            <ActionBtn icon={RefreshCw} label="취소" color={ds.ink3} bg={ds.lineSoft} />
            <ActionBtn icon={Clock} label="대기자 관리" color={ds.amber} bg={ds.amberSoft} />
          </div>
        </div>
      </div>

      {/* 우측 패널 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, color: ds.ink, marginBottom: 14 }}>참여 이력</div>
          {DATA.sessionParticipation.filter(s => s.participant === p.name).length > 0
            ? DATA.sessionParticipation.filter(s => s.participant === p.name).map(s => (
              <div key={s.id} style={{ padding: "10px 0", borderBottom: `1px solid ${ds.lineSoft}` }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: ds.ink }}>{s.session}</div>
                <div style={{ fontSize: 11, color: ds.ink4, marginTop: 2 }}>{s.pet} · {s.result}</div>
              </div>
            ))
            : <div style={{ fontSize: 12, color: ds.ink4, padding: 20, textAlign: "center" }}>참여 이력이 없습니다</div>
          }
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, color: ds.ink, marginBottom: 14 }}>결제 정보</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { l: "결제 금액", v: `${p.amount.toLocaleString()}원` },
              { l: "결제 수단", v: p.payMethod },
              { l: "결제 상태", v: statusMap[p.payStatus]?.l || p.payStatus },
            ].map(item => (
              <div key={item.l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${ds.lineSoft}` }}>
                <span style={{ fontSize: 12, color: ds.ink4 }}>{item.l}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: ds.ink }}>{item.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
