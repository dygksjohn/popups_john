import { useState } from "react";
import PageHeader from "../components/PageHeader";
import {
  Smartphone,
  Hash,
  Calendar,
  MapPin,
  Ticket,
  ShieldCheck,
  MessageSquare,
  Download,
  CheckCircle2,
  QrCode,
  Info,
} from "lucide-react";
import { SERVICE_CATEGORIES, SUBTITLE_MAP } from "./Apply";

/* ─────────────────────────────────────────────
   QR 패턴 (장식용)
───────────────────────────────────────────── */
const QR_MATRIX = [
  [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
];

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .qr-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .qr-root *, .qr-root *::before, .qr-root *::after { box-sizing: border-box; font-family: inherit; }
  .qr-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  .qr-section-title { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 4px; }
  .qr-section-sub   { font-size: 13px; color: #9ca3af; margin-bottom: 16px; }

  .qr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  .qr-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 28px 26px;
  }
  .qr-card-title {
    font-size: 15px; font-weight: 700; color: #111827;
    margin-bottom: 20px; padding-bottom: 15px;
    border-bottom: 1px solid #f1f3f5;
    display: flex; align-items: center; gap: 8px;
  }
  .qr-card-title-icon {
    width: 24px; height: 24px; border-radius: 6px;
    background: #eff4ff; display: flex; align-items: center; justify-content: center; color: #1a4fd6;
  }

  .qr-display-wrap { text-align: center; }
  .qr-box {
    width: 180px; height: 180px; margin: 0 auto 14px;
    background: #fff; border: 1.5px solid #e9ecef; border-radius: 14px;
    padding: 12px; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
  .qr-svg { width: 100%; height: 100%; }
  .qr-code-num {
    font-size: 13px; font-weight: 700; color: #1a4fd6;
    font-family: 'Courier New', monospace; letter-spacing: 0.06em; margin-bottom: 4px;
  }
  .qr-event-name { font-size: 12.5px; color: #6b7280; margin-bottom: 4px; }
  .qr-person-name { font-size: 12px; color: #9ca3af; margin-bottom: 20px; }

  .qr-ticket-info {
    background: #f8faff; border: 1px solid #dbeafe; border-radius: 9px; padding: 13px 16px;
    margin-bottom: 16px; display: flex; flex-direction: column; gap: 7px;
  }
  .qr-ticket-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #4b5563; }
  .qr-ticket-row-label { display: flex; align-items: center; gap: 5px; color: #9ca3af; }
  .qr-ticket-row span:last-child { font-weight: 600; color: #111827; }

  .qr-btn-row { display: flex; gap: 8px; }
  .qr-btn {
    flex: 1; padding: 10px 0; font-size: 13px; font-weight: 600;
    border-radius: 8px; cursor: pointer; font-family: inherit; transition: all 0.15s;
    text-align: center; display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .qr-btn-outline { border: 1.5px solid #e2e8f0; background: #fff; color: #374151; }
  .qr-btn-outline:hover { border-color: #9ca3af; }
  .qr-btn-primary { border: none; background: #1a4fd6; color: #fff; }
  .qr-btn-primary:hover { background: #1640b0; }

  .qr-label { font-size: 12.5px; font-weight: 600; color: #374151; margin-bottom: 6px; display: block; }
  .qr-input {
    width: 100%; height: 40px; padding: 0 13px;
    border: 1px solid #e2e8f0; border-radius: 7px;
    font-size: 13.5px; color: #111827; outline: none;
    font-family: 'Courier New', monospace; background: #fff;
    letter-spacing: 0.06em; transition: border-color 0.15s;
    margin-bottom: 10px;
  }
  .qr-input:focus { border-color: #1a4fd6; box-shadow: 0 0 0 3px rgba(26,79,214,0.08); }
  .qr-input::placeholder { font-family: 'Pretendard Variable', sans-serif; letter-spacing: 0; color: #c1c8d4; }

  .qr-submit-btn {
    width: 100%; padding: 11px 0; font-size: 14px; font-weight: 600;
    background: #1a4fd6; color: #fff; border: none; border-radius: 8px;
    cursor: pointer; font-family: inherit; transition: background 0.15s; margin-bottom: 14px;
    display: flex; align-items: center; justify-content: center; gap: 7px;
  }
  .qr-submit-btn:hover { background: #1640b0; }
  .qr-submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .qr-result-ok {
    padding: 14px 16px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 9px;
  }
  .qr-result-ok-title { font-size: 14px; font-weight: 700; color: #059669; margin-bottom: 5px; display: flex; align-items: center; gap: 6px; }
  .qr-result-ok-body { font-size: 13px; color: #065f46; }

  .qr-status-ok { display: flex; align-items: center; gap: 5px; color: #059669 !important; font-weight: 600; }

  .qr-notice {
    margin-top: 22px; padding-top: 20px; border-top: 1px solid #f1f3f5;
  }
  .qr-notice-title { font-size: 12.5px; font-weight: 700; color: #374151; margin-bottom: 8px; display: flex; align-items: center; gap: 5px; }
  .qr-notice-item { font-size: 12.5px; color: #9ca3af; line-height: 1.8; }

  @media (max-width: 768px) {
    .qr-grid { grid-template-columns: 1fr; }
    .qr-container { padding: 20px 16px 48px; }
  }
`;

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function QRCheckin({ onNavigate }) {
  const currentPath = "/registration/qr";
  const [code, setCode] = useState("");
  const [checked, setChecked] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  const handleCheckin = () => {
    if (code.trim()) setChecked(true);
  };

  const handleSendSMS = () => {
    // 등록된 전화번호로 QR 코드 번호를 문자 앱에 자동 입력
    const phoneNumber = "01012345678"; // 신청 시 등록한 번호
    const message = encodeURIComponent(
      "[2026 봄 반려동물 페스티벌]\n신청번호: REG-2026-003847\n행사일: 2026.04.12 (토) 10:00~18:00\n장소: 서울 올림픽공원 체조경기장\n티켓: 일반 입장 × 2\n\n본 문자를 행사 당일 입구에서 제시해 주세요.",
    );
    // iOS / Android 모두 호환되는 sms: 프로토콜
    const smsUrl = `sms:${phoneNumber}${/iPhone|iPad|iPod/i.test(navigator.userAgent) ? "&" : "?"}body=${message}`;
    window.location.href = smsUrl;
    setSmsSent(true);
    setTimeout(() => setSmsSent(false), 3000);
  };

  return (
    <div className="qr-root">
      <style>{styles}</style>

      <PageHeader
        title="QR 체크인"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={onNavigate}
      />

      <main className="qr-container">
        <div className="qr-section-title">QR 체크인</div>
        <div className="qr-section-sub">
          행사 당일 QR 코드를 제시하거나 신청번호를 직접 입력하세요
        </div>

        <div className="qr-grid">
          {/* ── 왼쪽: 나의 QR 코드 ── */}
          <div className="qr-card">
            <div className="qr-card-title">
              <div className="qr-card-title-icon">
                <Smartphone size={14} />
              </div>
              나의 QR 코드
            </div>

            <div className="qr-display-wrap">
              <div className="qr-box">
                <svg
                  className="qr-svg"
                  viewBox="0 0 21 7"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {QR_MATRIX.map((row, ri) =>
                    row.map((cell, ci) =>
                      cell === 1 ? (
                        <rect
                          key={`${ri}-${ci}`}
                          x={ci}
                          y={ri}
                          width="1"
                          height="1"
                          fill="#111827"
                          rx="0.1"
                        />
                      ) : null,
                    ),
                  )}
                </svg>
              </div>

              <div className="qr-code-num">REG-2026-003847</div>
              <div className="qr-event-name">
                2026 봄 반려동물 페스티벌 - Day 1
              </div>
              <div className="qr-person-name">홍길동 · 일반 입장</div>
            </div>

            {/* 티켓 요약 */}
            <div className="qr-ticket-info">
              <div className="qr-ticket-row">
                <span className="qr-ticket-row-label">
                  <Calendar size={13} /> 행사일
                </span>
                <span>2026.04.12 (토) 10:00~18:00</span>
              </div>
              <div className="qr-ticket-row">
                <span className="qr-ticket-row-label">
                  <MapPin size={13} /> 장소
                </span>
                <span>서울 올림픽공원 체조경기장</span>
              </div>
              <div className="qr-ticket-row">
                <span className="qr-ticket-row-label">
                  <Ticket size={13} /> 티켓
                </span>
                <span>일반 입장 × 2</span>
              </div>
              <div className="qr-ticket-row">
                <span className="qr-ticket-row-label">
                  <ShieldCheck size={13} /> 상태
                </span>
                <span className="qr-status-ok">
                  <CheckCircle2 size={13} /> 입장 가능
                </span>
              </div>
            </div>

            <div className="qr-btn-row">
              <button
                className={`qr-btn ${smsSent ? "qr-btn-sent" : "qr-btn-outline"}`}
                onClick={handleSendSMS}
                style={
                  smsSent
                    ? {
                        borderColor: "#059669",
                        color: "#059669",
                        background: "#ecfdf5",
                      }
                    : {}
                }
              >
                <MessageSquare size={13} />
                {smsSent ? "발송됨!" : "문자 받기"}
              </button>
              <button className="qr-btn qr-btn-primary">
                <Download size={13} />
                이미지 저장
              </button>
            </div>
          </div>

          {/* ── 오른쪽: 신청번호 체크인 ── */}
          <div className="qr-card">
            <div className="qr-card-title">
              <div className="qr-card-title-icon">
                <Hash size={14} />
              </div>
              신청번호 체크인
            </div>

            <div
              style={{
                fontSize: 13,
                color: "#6b7280",
                marginBottom: 18,
                lineHeight: 1.6,
              }}
            >
              신청 확인 이메일에 포함된 신청번호를 입력하시면 바로 체크인됩니다.
            </div>

            <label className="qr-label">신청번호</label>
            <input
              className="qr-input"
              placeholder="REG-XXXX-XXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCheckin()}
            />

            <button
              className="qr-submit-btn"
              disabled={!code.trim()}
              onClick={handleCheckin}
            >
              <QrCode size={15} />
              체크인 확인
            </button>

            {checked && (
              <div className="qr-result-ok">
                <div className="qr-result-ok-title">
                  <CheckCircle2 size={16} color="#059669" />
                  체크인이 완료되었습니다!
                </div>
                <div className="qr-result-ok-body">
                  2026 봄 반려동물 페스티벌 - Day 1<br />
                  홍길동님 · 일반 입장 × 2<br />
                  <span
                    style={{
                      fontSize: 11.5,
                      color: "#059669",
                      marginTop: 4,
                      display: "block",
                    }}
                  >
                    입장 처리 시각: {new Date().toLocaleTimeString("ko-KR")}
                  </span>
                </div>
              </div>
            )}

            <div className="qr-notice">
              <div className="qr-notice-title">
                <Info size={13} color="#9ca3af" />
                안내사항
              </div>
              <div className="qr-notice-item">
                · QR 코드는 행사 시작 1시간 전부터 유효합니다
                <br />
                · 1회 스캔 후 재사용이 불가합니다
                <br />
                · 본인 확인을 위해 신분증을 지참해 주세요
                <br />· 문의: 02-1234-5678 (평일 09:00~18:00)
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
