import { useState } from "react";
import {
  ClipboardList,
  CheckCircle2,
  FlagTriangleRight,
  XCircle,
  Calendar,
  Ticket,
  CreditCard,
  FileText,
  QrCode,
  X,
  MapPin,
  Download,
  MessageSquare,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import { SERVICE_CATEGORIES, SUBTITLE_MAP } from "./Apply";

const RECORDS = [
  {
    id: "REG-2026-003847",
    event: "2026 봄 반려동물 페스티벌 - Day 1",
    date: "2026.04.12 (토)",
    time: "10:00~18:00",
    ticket: "일반 입장",
    qty: 2,
    amount: "30,000원",
    status: "confirmed",
    applied: "2026.03.12",
    location: "서울 올림픽공원 체조경기장",
    person: "홍길동",
  },
  {
    id: "REG-2025-009123",
    event: "2025 가을 펫 엑스포",
    date: "2025.09.21 (일)",
    time: "10:00~17:00",
    ticket: "VIP 패키지",
    qty: 1,
    amount: "35,000원",
    status: "done",
    applied: "2025.09.01",
    location: "COEX 홀 A",
    person: "홍길동",
  },
  {
    id: "REG-2025-004210",
    event: "2025 봄 반려동물 페스티벌",
    date: "2025.04.10 (목)",
    time: "10:00~18:00",
    ticket: "가족 패키지",
    qty: 1,
    amount: "45,000원",
    status: "cancelled",
    applied: "2025.03.22",
    location: "서울 올림픽공원 체조경기장",
    person: "홍길동",
  },
];

const QR_MATRIX = [
  [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1],
  [0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0],
  [1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1],
  [0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0],
  [1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0],
  [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
  [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1],
];

const STATUS_MAP = {
  confirmed: {
    label: "신청 완료",
    bgColor: "#ecfdf5",
    textColor: "#059669",
    dotColor: "#059669",
    dotShadow: "#dcfce7",
  },
  done: {
    label: "행사 종료",
    bgColor: "#f3f4f6",
    textColor: "#6b7280",
    dotColor: "#d1d5db",
    dotShadow: "transparent",
  },
  cancelled: {
    label: "신청 취소",
    bgColor: "#fef2f2",
    textColor: "#dc2626",
    dotColor: "#ef4444",
    dotShadow: "#fee2e2",
  },
};

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
  .hist-root { box-sizing: border-box; font-family: 'Pretendard Variable','Pretendard',-apple-system,sans-serif; background: #f8f9fc; min-height: 100vh; }
  .hist-root *, .hist-root *::before, .hist-root *::after { box-sizing: border-box; font-family: inherit; }
  .hist-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }
  .hist-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .hist-stat { background: #fff; border: 1px solid #e9ecef; border-radius: 12px; padding: 18px 20px; display: flex; align-items: center; gap: 14px; }
  .hist-stat-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .hist-stat-icon.blue  { background: #eff4ff; color: #1a4fd6; }
  .hist-stat-icon.green { background: #ecfdf5; color: #059669; }
  .hist-stat-icon.amber { background: #fffbeb; color: #d97706; }
  .hist-stat-icon.red   { background: #fef2f2; color: #dc2626; }
  .hist-stat-value { font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.5px; line-height: 1.1; }
  .hist-stat-label { font-size: 12px; color: #9ca3af; margin-top: 2px; }
  .hist-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .hist-title { font-size: 16px; font-weight: 700; color: #111827; }
  .hist-sub   { font-size: 13px; color: #9ca3af; margin-top: 2px; }
  .hist-filter-bar { display: flex; gap: 8px; margin-bottom: 14px; }
  .hist-filter-btn { padding: 7px 16px; border-radius: 100px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1.5px solid #e9ecef; background: #fff; color: #6b7280; font-family: inherit; transition: all 0.15s; }
  .hist-filter-btn:hover { border-color: #c7d7fb; color: #1a4fd6; }
  .hist-filter-btn.active { background: #eff4ff; border-color: #1a4fd6; color: #1a4fd6; }
  .hist-list { display: flex; flex-direction: column; gap: 12px; }
  .hist-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; overflow: hidden; transition: box-shadow 0.15s; }
  .hist-card:hover { box-shadow: 0 4px 18px rgba(0,0,0,0.06); }
  .hist-card-top { padding: 20px 24px 16px; display: flex; gap: 14px; align-items: flex-start; }
  .hist-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
  .hist-card-main { flex: 1; min-width: 0; }
  .hist-event-name { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 4px; }
  .hist-reg-id { font-size: 12px; color: #9ca3af; font-family: 'Courier New', monospace; }
  .hist-status-badge { padding: 4px 11px; border-radius: 100px; font-size: 11px; font-weight: 700; flex-shrink: 0; }
  .hist-card-meta { display: flex; flex-wrap: wrap; gap: 18px; padding: 13px 24px; background: #fafbfc; border-top: 1px solid #f1f3f5; font-size: 13px; color: #4b5563; }
  .hist-card-meta-item { display: flex; align-items: center; gap: 5px; }
  .hist-card-actions { padding: 13px 24px; border-top: 1px solid #f1f3f5; display: flex; gap: 8px; }
  .hist-btn { padding: 7px 16px; font-size: 12.5px; font-weight: 600; border-radius: 7px; cursor: pointer; font-family: inherit; transition: all 0.15s; display: flex; align-items: center; gap: 5px; }
  .hist-btn-outline { border: 1.5px solid #e2e8f0; background: #fff; color: #374151; }
  .hist-btn-outline:hover { border-color: #9ca3af; }
  .hist-btn-primary { border: none; background: #1a4fd6; color: #fff; }
  .hist-btn-primary:hover { background: #1640b0; }
  .hist-empty { text-align: center; padding: 52px 24px; }
  .hist-empty-icon  { display: flex; justify-content: center; margin-bottom: 14px; color: #d1d5db; }
  .hist-empty-title { font-size: 16px; font-weight: 700; color: #374151; margin-bottom: 6px; }
  .hist-empty-desc  { font-size: 14px; color: #9ca3af; }

  /* ── QR 모달 ── */
  .qr-overlay {
    position: fixed; inset: 0; z-index: 10000;
    background: rgba(0,0,0,0.52);
    backdrop-filter: blur(5px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: qr-fade 0.18s ease;
  }
  @keyframes qr-fade { from { opacity: 0; } to { opacity: 1; } }

  .qr-modal {
    background: #fff; border-radius: 22px;
    width: 100%; max-width: 390px;
    box-shadow: 0 28px 70px rgba(0,0,0,0.22);
    overflow: hidden;
    animation: qr-up 0.24s cubic-bezier(0.34,1.5,0.64,1);
  }
  @keyframes qr-up {
    from { transform: translateY(32px) scale(0.96); opacity: 0; }
    to   { transform: translateY(0) scale(1); opacity: 1; }
  }

  .qr-modal-header {
    padding: 20px 22px 0;
    display: flex; align-items: center; justify-content: space-between;
  }
  .qr-modal-title { font-size: 15px; font-weight: 700; color: #111827; }
  .qr-modal-close {
    width: 32px; height: 32px; border-radius: 8px;
    border: 1px solid #e9ecef; background: #f9fafb;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #6b7280; transition: all 0.15s;
  }
  .qr-modal-close:hover { background: #f3f4f6; color: #111827; }

  .qr-modal-body { padding: 18px 22px 22px; text-align: center; }
  .qr-modal-qr-wrap {
    width: 192px; height: 192px; margin: 0 auto 14px;
    background: #fff; border: 1.5px solid #e9ecef; border-radius: 16px;
    padding: 13px; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 22px rgba(0,0,0,0.08);
  }
  .qr-modal-code { font-size: 13.5px; font-weight: 700; color: #1a4fd6; font-family: 'Courier New', monospace; letter-spacing: 0.06em; margin-bottom: 3px; }
  .qr-modal-event { font-size: 13.5px; color: #111827; font-weight: 600; margin-bottom: 2px; }
  .qr-modal-person { font-size: 12px; color: #9ca3af; margin-bottom: 14px; }
  .qr-modal-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 13px; border-radius: 100px; margin-bottom: 16px;
    font-size: 12px; font-weight: 700; background: #ecfdf5; color: #059669;
  }
  .qr-modal-info {
    background: #f8faff; border: 1px solid #dbeafe; border-radius: 11px;
    padding: 12px 15px; text-align: left; display: flex; flex-direction: column; gap: 8px;
    margin-bottom: 18px;
  }
  .qr-modal-info-row { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #4b5563; }
  .qr-modal-info-row svg { color: #93c5fd; flex-shrink: 0; }
  .qr-modal-info-val { font-weight: 600; color: #111827; }
  .qr-modal-actions { display: flex; gap: 8px; }
  .qr-modal-btn {
    flex: 1; padding: 11px 0; font-size: 13px; font-weight: 600;
    border-radius: 9px; cursor: pointer; font-family: inherit; transition: all 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .qr-modal-btn-outline { border: 1.5px solid #e2e8f0; background: #fff; color: #374151; }
  .qr-modal-btn-outline:hover { border-color: #9ca3af; }
  .qr-modal-btn-sms-sent { border: 1.5px solid #059669; background: #ecfdf5; color: #059669; }
  .qr-modal-btn-primary { border: none; background: #1a4fd6; color: #fff; }
  .qr-modal-btn-primary:hover { background: #1640b0; }

  @media (max-width: 768px) { .hist-stats { grid-template-columns: 1fr 1fr; } .hist-container { padding: 20px 16px 48px; } }
`;

/* ── QR 모달 컴포넌트 ── */
function QRModal({ record, onClose }) {
  const [smsSent, setSmsSent] = useState(false);

  const handleSendSMS = () => {
    const msg = encodeURIComponent(
      `[${record.event}]\n신청번호: ${record.id}\n행사일: ${record.date} ${record.time}\n장소: ${record.location}\n티켓: ${record.ticket} × ${record.qty}\n\n본 문자를 행사 당일 입구에서 제시해 주세요.`,
    );
    const sep = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? "&" : "?";
    window.location.href = `sms:${sep}body=${msg}`;
    setSmsSent(true);
    setTimeout(() => setSmsSent(false), 3000);
  };

  return (
    <div
      className="qr-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="qr-modal">
        <div className="qr-modal-header">
          <div className="qr-modal-title">QR 코드</div>
          <button className="qr-modal-close" onClick={onClose}>
            <X size={15} />
          </button>
        </div>
        <div className="qr-modal-body">
          <div className="qr-modal-qr-wrap">
            <svg
              viewBox="0 0 21 21"
              style={{ width: "100%", height: "100%" }}
              xmlns="http://www.w3.org/2000/svg"
            >
              {QR_MATRIX.map((row, ri) =>
                row.map((cell, ci) =>
                  cell ? (
                    <rect
                      key={`${ri}-${ci}`}
                      x={ci}
                      y={ri}
                      width="1"
                      height="1"
                      fill="#111827"
                      rx="0.12"
                    />
                  ) : null,
                ),
              )}
            </svg>
          </div>

          <div className="qr-modal-code">{record.id}</div>
          <div className="qr-modal-event">{record.event}</div>
          <div className="qr-modal-person">
            {record.person} · {record.ticket} × {record.qty}
          </div>

          <div>
            <span className="qr-modal-badge">
              <CheckCircle2 size={12} /> 입장 가능
            </span>
          </div>

          <div className="qr-modal-info">
            <div className="qr-modal-info-row">
              <Calendar size={13} />
              <span className="qr-modal-info-val">
                {record.date} {record.time}
              </span>
            </div>
            <div className="qr-modal-info-row">
              <MapPin size={13} />
              <span className="qr-modal-info-val">{record.location}</span>
            </div>
            <div className="qr-modal-info-row">
              <Ticket size={13} />
              <span className="qr-modal-info-val">
                {record.ticket} × {record.qty}
              </span>
            </div>
          </div>

          <div className="qr-modal-actions">
            <button
              className={`qr-modal-btn ${smsSent ? "qr-modal-btn-sms-sent" : "qr-modal-btn-outline"}`}
              onClick={handleSendSMS}
            >
              <MessageSquare size={13} />
              {smsSent ? "발송됨!" : "문자 받기"}
            </button>
            <button className="qr-modal-btn qr-modal-btn-primary">
              <Download size={13} />
              이미지 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 메인 컴포넌트 ── */
export default function ApplyHistory({ onNavigate, isLoggedIn = false }) {
  const [filter, setFilter] = useState("all");
  const [qrRecord, setQrRecord] = useState(null);

  const filtered =
    filter === "all" ? RECORDS : RECORDS.filter((r) => r.status === filter);

  const stats = [
    {
      icon: <ClipboardList size={20} />,
      label: "전체 신청",
      value: `${RECORDS.length}건`,
      cls: "blue",
    },
    {
      icon: <CheckCircle2 size={20} />,
      label: "신청 완료",
      value: `${RECORDS.filter((r) => r.status === "confirmed").length}건`,
      cls: "green",
    },
    {
      icon: <FlagTriangleRight size={20} />,
      label: "종료된 행사",
      value: `${RECORDS.filter((r) => r.status === "done").length}건`,
      cls: "amber",
    },
    {
      icon: <XCircle size={20} />,
      label: "취소 내역",
      value: `${RECORDS.filter((r) => r.status === "cancelled").length}건`,
      cls: "red",
    },
  ];

  const FILTERS = [
    { key: "all", label: "전체" },
    { key: "confirmed", label: "신청 완료" },
    { key: "done", label: "행사 종료" },
    { key: "cancelled", label: "취소" },
  ];

  const currentPath = "/registration/applyhistory";

  return (
    <div className="hist-root">
      <style>{styles}</style>

      {qrRecord && (
        <QRModal record={qrRecord} onClose={() => setQrRecord(null)} />
      )}

      <PageHeader
        title="참가신청"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={onNavigate}
      />

      <main className="hist-container">
        <div className="hist-stats">
          {stats.map((s) => (
            <div key={s.label} className="hist-stat">
              <div className={`hist-stat-icon ${s.cls}`}>{s.icon}</div>
              <div>
                <div className="hist-stat-value">{s.value}</div>
                <div className="hist-stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="hist-toolbar">
          <div>
            <div className="hist-title">신청 내역</div>
            <div className="hist-sub">총 {filtered.length}건</div>
          </div>
        </div>

        <div className="hist-filter-bar">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`hist-filter-btn${filter === f.key ? " active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="hist-list">
          {filtered.length === 0 ? (
            <div className="hist-card">
              <div className="hist-empty">
                <div className="hist-empty-icon">
                  <FileText size={40} />
                </div>
                <div className="hist-empty-title">내역이 없습니다</div>
                <div className="hist-empty-desc">
                  선택하신 조건의 신청 내역이 없어요
                </div>
              </div>
            </div>
          ) : (
            filtered.map((r) => {
              const s = STATUS_MAP[r.status];
              return (
                <div key={r.id} className="hist-card">
                  <div className="hist-card-top">
                    <div
                      className="hist-dot"
                      style={{
                        background: s.dotColor,
                        boxShadow:
                          s.dotShadow !== "transparent"
                            ? `0 0 0 3px ${s.dotShadow}`
                            : "none",
                      }}
                    />
                    <div className="hist-card-main">
                      <div className="hist-event-name">{r.event}</div>
                      <div className="hist-reg-id">{r.id}</div>
                    </div>
                    <span
                      className="hist-status-badge"
                      style={{ background: s.bgColor, color: s.textColor }}
                    >
                      {s.label}
                    </span>
                  </div>

                  <div className="hist-card-meta">
                    <span className="hist-card-meta-item">
                      <Calendar size={13} color="#6b7280" /> 행사일 {r.date}
                    </span>
                    <span className="hist-card-meta-item">
                      <Ticket size={13} color="#6b7280" /> {r.ticket} × {r.qty}
                    </span>
                    <span className="hist-card-meta-item">
                      <CreditCard size={13} color="#6b7280" /> {r.amount}
                    </span>
                    <span className="hist-card-meta-item">
                      <FileText size={13} color="#6b7280" /> 신청일 {r.applied}
                    </span>
                  </div>

                  {r.status === "confirmed" && (
                    <div className="hist-card-actions">
                      <button className="hist-btn hist-btn-outline">
                        <XCircle size={13} />
                        취소 신청
                      </button>
                      <button
                        className="hist-btn hist-btn-primary"
                        onClick={() => setQrRecord(r)}
                      >
                        <QrCode size={13} />
                        QR 코드 보기
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
