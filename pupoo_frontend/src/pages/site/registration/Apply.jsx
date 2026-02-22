import { useState } from "react";
import PageHeader from "../components/PageHeader";
import {
  CalendarDays,
  Ticket,
  User,
  PawPrint,
  ClipboardList,
  CreditCard,
  CheckCircle2,
  Minus,
  Plus,
  Check,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .reg-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .reg-root *, .reg-root *::before, .reg-root *::after { box-sizing: border-box; font-family: inherit; }

  .reg-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  /* Step indicator */
  .reg-steps {
    display: flex; align-items: center; justify-content: center;
    gap: 0; margin-bottom: 32px;
  }
  .reg-step { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .reg-step-circle {
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700;
    background: #e9ecef; color: #9ca3af; transition: all 0.2s;
  }
  .reg-step.active .reg-step-circle { background: #1a4fd6; color: #fff; }
  .reg-step.done .reg-step-circle { background: #10b981; color: #fff; }
  .reg-step-label { font-size: 13px; color: #9ca3af; font-weight: 500; }
  .reg-step.active .reg-step-label { color: #1a4fd6; font-weight: 600; }
  .reg-step.done .reg-step-label { color: #10b981; }
  .reg-step-line { width: 80px; height: 1px; background: #e2e8f0; margin: 0 8px; margin-bottom: 22px; }
  .reg-step-line.done { background: #10b981; }

  /* Card */
  .reg-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 28px 32px; margin-bottom: 16px; }
  .reg-card-title {
    font-size: 17px; font-weight: 700; color: #111827;
    margin: 0 0 20px; padding-bottom: 15px;
    border-bottom: 1px solid #f1f3f5;
    display: flex; align-items: center; gap: 8px;
  }
  .reg-card-title-icon {
    width: 24px; height: 24px; border-radius: 6px;
    background: #eff4ff; display: flex; align-items: center; justify-content: center;
  }

  /* Event selector */
  .reg-event-list { display: flex; flex-direction: column; gap: 10px; }
  .reg-event-item {
    border: 1.5px solid #e9ecef; border-radius: 10px; padding: 16px 18px;
    cursor: pointer; transition: all 0.15s;
    display: flex; align-items: center; gap: 15px;
  }
  .reg-event-item.selected { border-color: #1a4fd6; background: #f5f8ff; }
  .reg-event-item:hover:not(.selected) { border-color: #c7d7fb; background: #fafbff; }
  .reg-event-radio {
    width: 18px; height: 18px; border-radius: 50%; border: 2px solid #d1d5db;
    flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.15s;
  }
  .reg-event-item.selected .reg-event-radio { border-color: #1a4fd6; }
  .reg-event-radio-dot { width: 8px; height: 8px; border-radius: 50%; background: #1a4fd6; opacity: 0; transition: opacity 0.15s; }
  .reg-event-item.selected .reg-event-radio-dot { opacity: 1; }
  .reg-event-info { flex: 1; }
  .reg-event-name { font-size: 15px; font-weight: 600; color: #111827; }
  .reg-event-meta { font-size: 13px; color: #6b7280; margin-top: 3px; }
  .reg-event-badge { padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; background: #ecfdf5; color: #059669; }
  .reg-event-badge.almost { background: #fff7ed; color: #d97706; }

  /* Form */
  .reg-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .reg-form-group { display: flex; flex-direction: column; gap: 6px; }
  .reg-form-group.full { grid-column: 1 / -1; }
  .reg-label { font-size: 12.5px; font-weight: 600; color: #374151; }
  .reg-label span { color: #ef4444; margin-left: 2px; }
  .reg-input {
    height: 40px; padding: 0 13px; border: 1px solid #e2e8f0; border-radius: 7px;
    font-size: 13.5px; color: #111827; outline: none; transition: border-color 0.15s;
    font-family: inherit; background: #fff;
  }
  .reg-input:focus { border-color: #1a4fd6; box-shadow: 0 0 0 3px rgba(26,79,214,0.08); }
  .reg-select {
    height: 40px; padding: 0 13px; border: 1px solid #e2e8f0; border-radius: 7px;
    font-size: 13.5px; color: #111827; outline: none; font-family: inherit; background: #fff;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 13px center;
  }
  .reg-select:focus { border-color: #1a4fd6; }

  /* Ticket */
  .reg-ticket-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .reg-ticket { border: 1.5px solid #e9ecef; border-radius: 10px; padding: 15px 16px; cursor: pointer; transition: all 0.15s; text-align: center; }
  .reg-ticket.selected { border-color: #1a4fd6; background: #f5f8ff; }
  .reg-ticket:hover:not(.selected) { border-color: #c7d7fb; }
  .reg-ticket-name { font-size: 13px; font-weight: 600; color: #111827; }
  .reg-ticket-price { font-size: 17px; font-weight: 700; color: #1a4fd6; margin-top: 4px; }
  .reg-ticket-desc { font-size: 11px; color: #9ca3af; margin-top: 3px; }

  /* Counter */
  .reg-counter { display: flex; align-items: center; gap: 13px; }
  .reg-counter-btn {
    width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff;
    font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center;
    color: #374151; transition: all 0.15s; font-family: inherit;
  }
  .reg-counter-btn:hover { border-color: #1a4fd6; color: #1a4fd6; }
  .reg-counter-num { font-size: 16px; font-weight: 600; color: #111827; min-width: 24px; text-align: center; }

  /* Agreement */
  .reg-agree-list { display: flex; flex-direction: column; gap: 10px; }
  .reg-agree-item { display: flex; align-items: flex-start; gap: 10px; padding: 13px 15px; border: 1px solid #e9ecef; border-radius: 8px; cursor: pointer; }
  .reg-checkbox {
    width: 18px; height: 18px; border-radius: 4px; border: 1.5px solid #d1d5db;
    flex-shrink: 0; margin-top: 1px; display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; background: #fff;
  }
  .reg-checkbox.checked { background: #1a4fd6; border-color: #1a4fd6; }
  .reg-agree-text { font-size: 13px; color: #374151; line-height: 1.5; }
  .reg-agree-required { font-size: 11px; color: #ef4444; font-weight: 600; margin-right: 4px; }

  /* Summary */
  .reg-summary { background: #f8faff; border: 1px solid #dbeafe; border-radius: 10px; padding: 18px 20px; }
  .reg-summary-row { display: flex; justify-content: space-between; font-size: 13px; color: #4b5563; padding: 5px 0; }
  .reg-summary-total { display: flex; justify-content: space-between; align-items: center; font-size: 16px; font-weight: 700; color: #111827; padding-top: 13px; margin-top: 8px; border-top: 1px solid #dbeafe; }
  .reg-summary-price { color: #1a4fd6; }

  /* Buttons */
  .reg-btn-row { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
  .reg-btn { padding: 11px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; font-family: inherit; display: flex; align-items: center; gap: 6px; }
  .reg-btn-ghost { background: #fff; border: 1px solid #e2e8f0; color: #6b7280; }
  .reg-btn-ghost:hover { border-color: #9ca3af; color: #374151; }
  .reg-btn-primary { background: #1a4fd6; color: #fff; }
  .reg-btn-primary:hover { background: #1640b0; }

  /* Success */
  .reg-success { text-align: center; padding: 48px 24px; }
  .reg-success-icon { width: 64px; height: 64px; border-radius: 50%; background: #ecfdf5; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #10b981; }
  .reg-success-title { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 8px; }
  .reg-success-desc { font-size: 15px; color: #6b7280; line-height: 1.6; }
  .reg-success-num { display: inline-block; margin-top: 16px; background: #f5f8ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 10px 24px; font-size: 18px; font-weight: 700; color: #1a4fd6; letter-spacing: 0.1em; }

  @media (max-width: 640px) {
    .reg-form-grid { grid-template-columns: 1fr; }
    .reg-ticket-grid { grid-template-columns: 1fr; }
    .reg-container { padding: 20px 16px 48px; }
  }
`;

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */

export const SERVICE_CATEGORIES = [
  { label: "행사 참가 신청", path: "/registration/apply" },
  { label: "신청 내역 조회", path: "/registration/applyhistory" },
  { label: "결제 내역", path: "/registration/paymenthistory" },
  { label: "QR 체크인", path: "/registration/qrcheckin" },
];

export const SUBTITLE_MAP = {
  "/registration/apply": "행사에 참가 신청하세요",
  "/registration/history": "나의 행사 참가 신청 이력을 확인하세요",
  "/registration/payment": "결제 완료된 내역을 확인하세요",
  "/registration/qr": "행사 당일 QR 코드를 제시하거나 신청번호를 입력하세요",
};

const EVENTS = [
  {
    id: 1,
    name: "2026 봄 반려동물 페스티벌 - Day 1",
    date: "2026.04.12 (토) 10:00~18:00",
    location: "서울 올림픽공원 체조경기장",
    status: "available",
  },
  {
    id: 2,
    name: "2026 봄 반려동물 페스티벌 - Day 2",
    date: "2026.04.13 (일) 10:00~17:00",
    location: "서울 올림픽공원 체조경기장",
    remaining: 23,
    status: "almost",
  },
];

const TICKETS = [
  {
    id: "general",
    name: "일반 입장",
    price: "15,000원",
    raw: 15000,
    desc: "기본 행사 입장",
  },
  {
    id: "vip",
    name: "VIP 패키지",
    price: "35,000원",
    raw: 35000,
    desc: "굿즈 + 우선 입장",
  },
  {
    id: "family",
    name: "가족 패키지",
    price: "45,000원",
    raw: 45000,
    desc: "성인2 + 아동1",
  },
];

const STEPS = ["행사 선택", "정보 입력", "약관 동의", "결제 완료"];

/* ─────────────────────────────────────────────
   행사 참가 신청 폼
───────────────────────────────────────────── */
function ApplyForm() {
  const [step, setStep] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState("general");
  const [count, setCount] = useState(1);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    pet: "",
    breed: "",
    birthYear: "",
  });
  const [agrees, setAgrees] = useState([false, false, false]);

  const ticket = TICKETS.find((t) => t.id === selectedTicket);
  const total = ((ticket?.raw ?? 0) * count).toLocaleString();

  const toggleAgree = (i) => {
    const n = [...agrees];
    n[i] = !n[i];
    setAgrees(n);
  };

  return (
    <>
      {/* Step indicator */}
      <div className="reg-steps">
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: "contents" }}>
            <div
              className={`reg-step${step === i ? " active" : ""}${step > i ? " done" : ""}`}
            >
              <div className="reg-step-circle">
                {step > i ? <Check size={16} /> : i + 1}
              </div>
              <div className="reg-step-label">{s}</div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`reg-step-line${step > i ? " done" : ""}`} />
            )}
          </div>
        ))}
      </div>

      {/* STEP 0 — 행사 선택 */}
      {step === 0 && (
        <>
          <div className="reg-card">
            <div className="reg-card-title">
              <div className="reg-card-title-icon">
                <CalendarDays size={14} color="#1a4fd6" />
              </div>
              참가할 행사를 선택하세요
            </div>
            <div className="reg-event-list">
              {EVENTS.map((ev) => (
                <div
                  key={ev.id}
                  className={`reg-event-item${selectedEvent === ev.id ? " selected" : ""}`}
                  onClick={() => setSelectedEvent(ev.id)}
                >
                  <div className="reg-event-radio">
                    <div className="reg-event-radio-dot" />
                  </div>
                  <div className="reg-event-info">
                    <div className="reg-event-name">{ev.name}</div>
                    <div className="reg-event-meta">
                      {ev.date} · {ev.location}
                    </div>
                  </div>
                  <span
                    className={`reg-event-badge${ev.status === "almost" ? " almost" : ""}`}
                  >
                    {ev.status === "almost"
                      ? `잔여 ${ev.remaining}석`
                      : "참가 가능"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="reg-card">
            <div className="reg-card-title">
              <div className="reg-card-title-icon">
                <Ticket size={14} color="#1a4fd6" />
              </div>
              티켓 종류
            </div>
            <div className="reg-ticket-grid">
              {TICKETS.map((t) => (
                <div
                  key={t.id}
                  className={`reg-ticket${selectedTicket === t.id ? " selected" : ""}`}
                  onClick={() => setSelectedTicket(t.id)}
                >
                  <div className="reg-ticket-name">{t.name}</div>
                  <div className="reg-ticket-price">{t.price}</div>
                  <div className="reg-ticket-desc">{t.desc}</div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 20,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                참가 인원
              </span>
              <div className="reg-counter">
                <button
                  className="reg-counter-btn"
                  onClick={() => setCount((c) => Math.max(1, c - 1))}
                >
                  <Minus size={14} />
                </button>
                <span className="reg-counter-num">{count}</span>
                <button
                  className="reg-counter-btn"
                  onClick={() => setCount((c) => Math.min(10, c + 1))}
                >
                  <Plus size={14} />
                </button>
              </div>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>최대 10매</span>
            </div>
          </div>

          <div className="reg-btn-row">
            <button
              className="reg-btn reg-btn-primary"
              style={{ opacity: selectedEvent ? 1 : 0.4 }}
              onClick={() => selectedEvent && setStep(1)}
            >
              다음 단계
              <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}

      {/* STEP 1 — 정보 입력 */}
      {step === 1 && (
        <>
          <div className="reg-card">
            <div className="reg-card-title">
              <div className="reg-card-title-icon">
                <User size={14} color="#1a4fd6" />
              </div>
              신청자 정보
            </div>
            <div className="reg-form-grid">
              <div className="reg-form-group">
                <label className="reg-label">
                  이름 <span>*</span>
                </label>
                <input
                  className="reg-input"
                  placeholder="홍길동"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="reg-form-group">
                <label className="reg-label">
                  연락처 <span>*</span>
                </label>
                <input
                  className="reg-input"
                  placeholder="010-0000-0000"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>
              <div className="reg-form-group full">
                <label className="reg-label">
                  이메일 <span>*</span>
                </label>
                <input
                  className="reg-input"
                  placeholder="example@email.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="reg-card">
            <div className="reg-card-title">
              <div className="reg-card-title-icon">
                <PawPrint size={14} color="#1a4fd6" />
              </div>
              반려동물 정보 (선택)
            </div>
            <div className="reg-form-grid">
              <div className="reg-form-group">
                <label className="reg-label">반려동물 이름</label>
                <input
                  className="reg-input"
                  placeholder="예) 코코"
                  value={form.pet}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, pet: e.target.value }))
                  }
                />
              </div>
              <div className="reg-form-group">
                <label className="reg-label">견종 / 품종</label>
                <input
                  className="reg-input"
                  placeholder="예) 골든 리트리버"
                  value={form.breed}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, breed: e.target.value }))
                  }
                />
              </div>
              <div className="reg-form-group">
                <label className="reg-label">출생 연도</label>
                <select
                  className="reg-select"
                  value={form.birthYear}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, birthYear: e.target.value }))
                  }
                >
                  <option value="">선택</option>
                  {Array.from({ length: 15 }, (_, i) => 2025 - i).map((y) => (
                    <option key={y} value={y}>
                      {y}년
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="reg-btn-row">
            <button
              className="reg-btn reg-btn-ghost"
              onClick={() => setStep(0)}
            >
              <ChevronLeft size={16} />
              이전
            </button>
            <button
              className="reg-btn reg-btn-primary"
              onClick={() => setStep(2)}
            >
              다음 단계
              <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}

      {/* STEP 2 — 약관 동의 */}
      {step === 2 && (
        <>
          <div className="reg-card">
            <div className="reg-card-title">
              <div className="reg-card-title-icon">
                <ClipboardList size={14} color="#1a4fd6" />
              </div>
              약관 동의
            </div>
            <div className="reg-agree-list">
              {[
                {
                  text: "개인정보 수집 및 이용에 동의합니다. 수집 항목: 이름, 연락처, 이메일 / 이용목적: 행사 참가 신청 및 안내",
                  required: true,
                },
                {
                  text: "행사 참가 시 촬영된 사진 및 영상이 홍보 자료로 활용될 수 있음에 동의합니다.",
                  required: true,
                },
                {
                  text: "행사 관련 마케팅 및 이벤트 정보 수신에 동의합니다. (선택)",
                  required: false,
                },
              ].map((a, i) => (
                <div
                  key={i}
                  className="reg-agree-item"
                  onClick={() => toggleAgree(i)}
                >
                  <div className={`reg-checkbox${agrees[i] ? " checked" : ""}`}>
                    {agrees[i] && <Check size={11} color="#fff" />}
                  </div>
                  <div className="reg-agree-text">
                    {a.required ? (
                      <span className="reg-agree-required">[필수]</span>
                    ) : (
                      <span
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          marginRight: 4,
                        }}
                      >
                        [선택]
                      </span>
                    )}
                    {a.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="reg-card">
            <div className="reg-card-title">
              <div className="reg-card-title-icon">
                <CreditCard size={14} color="#1a4fd6" />
              </div>
              결제 내역 확인
            </div>
            <div className="reg-summary">
              <div className="reg-summary-row">
                <span>행사명</span>
                <span>{EVENTS.find((e) => e.id === selectedEvent)?.name}</span>
              </div>
              <div className="reg-summary-row">
                <span>티켓 종류</span>
                <span>{ticket?.name}</span>
              </div>
              <div className="reg-summary-row">
                <span>수량</span>
                <span>{count}매</span>
              </div>
              <div className="reg-summary-row">
                <span>단가</span>
                <span>{ticket?.price}</span>
              </div>
              <div className="reg-summary-total">
                <span>최종 결제 금액</span>
                <span className="reg-summary-price">₩ {total}</span>
              </div>
            </div>
          </div>

          <div className="reg-btn-row">
            <button
              className="reg-btn reg-btn-ghost"
              onClick={() => setStep(1)}
            >
              <ChevronLeft size={16} />
              이전
            </button>
            <button
              className="reg-btn reg-btn-primary"
              style={{ opacity: agrees[0] && agrees[1] ? 1 : 0.4 }}
              onClick={() => {
                if (agrees[0] && agrees[1]) setStep(3);
              }}
            >
              결제하기
              <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}

      {/* STEP 3 — 완료 */}
      {step === 3 && (
        <div className="reg-card">
          <div className="reg-success">
            <div className="reg-success-icon">
              <CheckCircle2 size={32} color="#10b981" />
            </div>
            <div className="reg-success-title">신청이 완료되었습니다!</div>
            <div className="reg-success-desc">
              입력하신 이메일로 신청 확인서가 발송되었습니다.
              <br />
              행사 당일 QR 코드를 지참하여 입장하세요.
            </div>
            <div className="reg-success-num">REG-2026-003847</div>
            <div
              style={{
                marginTop: 24,
                display: "flex",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <button
                className="reg-btn reg-btn-ghost"
                onClick={() => setStep(0)}
              >
                추가 신청
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────
   신청 내역 조회
───────────────────────────────────────────── */
function RegistrationHistory() {
  const records = [
    {
      id: "REG-2026-003847",
      event: "2026 봄 반려동물 페스티벌 - Day 1",
      date: "2026.04.12",
      ticket: "일반 입장 × 2",
      amount: "30,000원",
      status: "confirmed",
    },
    {
      id: "REG-2025-009123",
      event: "2025 가을 펫 엑스포",
      date: "2025.09.21",
      ticket: "VIP 패키지 × 1",
      amount: "35,000원",
      status: "done",
    },
  ];
  const S = {
    confirmed: { bg: "#ecfdf5", color: "#059669", label: "신청 완료" },
    done: { bg: "#f3f4f6", color: "#6b7280", label: "종료됨" },
  };

  return (
    <>
      {records.map((r) => (
        <div
          key={r.id}
          style={{
            background: "#fff",
            border: "1px solid #e9ecef",
            borderRadius: 10,
            padding: "18px 20px",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                {r.event}
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>
                {r.id}
              </div>
            </div>
            <span
              style={{
                padding: "3px 10px",
                borderRadius: 100,
                fontSize: 11,
                fontWeight: 600,
                background: S[r.status].bg,
                color: S[r.status].color,
              }}
            >
              {S[r.status].label}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 20,
              fontSize: 12.5,
              color: "#4b5563",
              alignItems: "center",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <CalendarDays size={13} color="#6b7280" /> {r.date}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Ticket size={13} color="#6b7280" /> {r.ticket}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <CreditCard size={13} color="#6b7280" /> {r.amount}
            </span>
          </div>
          {r.status === "confirmed" && (
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: "1px solid #f1f3f5",
                display: "flex",
                gap: 8,
              }}
            >
              <button
                style={{
                  padding: "6px 15px",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  background: "#fff",
                  cursor: "pointer",
                  color: "#374151",
                  fontFamily: "inherit",
                }}
              >
                취소 신청
              </button>
              <button
                style={{
                  padding: "6px 15px",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 6,
                  background: "#1a4fd6",
                  cursor: "pointer",
                  color: "#fff",
                  fontFamily: "inherit",
                }}
              >
                QR 코드 보기
              </button>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

/* ─────────────────────────────────────────────
   결제 내역
───────────────────────────────────────────── */
function PaymentHistory() {
  const payments = [
    {
      id: "PAY-20260312-001",
      event: "2026 봄 반려동물 페스티벌 - Day 1",
      method: "신용카드 (KB국민 ****1234)",
      amount: "30,000원",
      date: "2026.03.12 14:23",
    },
    {
      id: "PAY-20250901-007",
      event: "2025 가을 펫 엑스포",
      method: "카카오페이",
      amount: "35,000원",
      date: "2025.09.01 09:11",
    },
  ];
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e9ecef",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f9fafb" }}>
            {["결제번호", "행사명", "결제 수단", "금액", "일시", "상태"].map(
              (h) => (
                <th
                  key={h}
                  style={{
                    padding: "13px 16px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#6b7280",
                    textAlign: "left",
                    borderBottom: "1px solid #e9ecef",
                  }}
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {payments.map((p, i) => (
            <tr
              key={p.id}
              style={{
                borderBottom:
                  i < payments.length - 1 ? "1px solid #f1f3f5" : "none",
              }}
            >
              <td
                style={{ padding: "15px 16px", fontSize: 12, color: "#9ca3af" }}
              >
                {p.id}
              </td>
              <td
                style={{
                  padding: "15px 16px",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#111827",
                }}
              >
                {p.event}
              </td>
              <td
                style={{
                  padding: "15px 16px",
                  fontSize: 12.5,
                  color: "#4b5563",
                }}
              >
                {p.method}
              </td>
              <td
                style={{
                  padding: "15px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1a4fd6",
                }}
              >
                {p.amount}
              </td>
              <td
                style={{ padding: "15px 16px", fontSize: 12, color: "#6b7280" }}
              >
                {p.date}
              </td>
              <td style={{ padding: "15px 16px" }}>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: 100,
                    fontSize: 11,
                    fontWeight: 600,
                    background: "#ecfdf5",
                    color: "#059669",
                  }}
                >
                  결제 완료
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────────────────────────────────────────
   QR 체크인
───────────────────────────────────────────── */
function QRCheckin() {
  const [code, setCode] = useState("");
  const [checked, setChecked] = useState(false);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e9ecef",
          borderRadius: 12,
          padding: "28px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#111827",
            marginBottom: 20,
          }}
        >
          나의 QR 코드
        </div>
        <div
          style={{
            width: 140,
            height: 140,
            margin: "0 auto 16px",
            background: "linear-gradient(135deg, #f5f8ff 0%, #eff4ff 100%)",
            borderRadius: 12,
            border: "1px solid #dbeafe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ color: "#1a4fd6" }}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="3"
                y="3"
                width="7"
                height="7"
                rx="1"
                stroke="#1a4fd6"
                strokeWidth="2"
              />
              <rect
                x="14"
                y="3"
                width="7"
                height="7"
                rx="1"
                stroke="#1a4fd6"
                strokeWidth="2"
              />
              <rect
                x="3"
                y="14"
                width="7"
                height="7"
                rx="1"
                stroke="#1a4fd6"
                strokeWidth="2"
              />
              <rect x="5" y="5" width="3" height="3" fill="#1a4fd6" />
              <rect x="16" y="5" width="3" height="3" fill="#1a4fd6" />
              <rect x="5" y="16" width="3" height="3" fill="#1a4fd6" />
              <path
                d="M14 14h2v2h-2zM18 14h3v2h-3zM14 18h2v3h-2zM18 18h3v3h-3z"
                fill="#1a4fd6"
              />
            </svg>
          </div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>REG-2026-003847</div>
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
          2026 봄 반려동물 페스티벌 - Day 1
        </div>
        <button
          style={{
            padding: "8px 20px",
            background: "#1a4fd6",
            color: "#fff",
            border: "none",
            borderRadius: 7,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          QR 화면 확대
        </button>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e9ecef",
          borderRadius: 12,
          padding: "28px 24px",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#111827",
            marginBottom: 8,
          }}
        >
          신청번호로 체크인
        </div>
        <div style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 14 }}>
          신청 확인 이메일에 포함된 번호를 입력하세요
        </div>
        <input
          className="reg-input"
          style={{ width: "100%", marginBottom: 10 }}
          placeholder="REG-XXXX-XXXXXX"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button
          style={{
            width: "100%",
            padding: "10px",
            background: "#1a4fd6",
            color: "#fff",
            border: "none",
            borderRadius: 7,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
          onClick={() => code && setChecked(true)}
        >
          체크인 확인
        </button>
        {checked && (
          <div
            style={{
              marginTop: 14,
              padding: "13px 15px",
              background: "#ecfdf5",
              borderRadius: 8,
              border: "1px solid #a7f3d0",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#059669",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <CheckCircle2 size={14} color="#059669" /> 체크인 완료!
            </div>
            <div style={{ fontSize: 12, color: "#065f46", marginTop: 4 }}>
              2026 봄 반려동물 페스티벌 - Day 1 | 홍길동님
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function EventRegistration() {
  const [currentPath, setCurrentPath] = useState("/registration/apply");

  const renderContent = () => {
    switch (currentPath) {
      case "/registration/apply":
        return <ApplyForm />;
      case "/registration/history":
        return <RegistrationHistory />;
      case "/registration/payment":
        return <PaymentHistory />;
      case "/registration/qr":
        return <QRCheckin />;
      default:
        return <ApplyForm />;
    }
  };

  return (
    <div className="reg-root">
      <style>{styles}</style>

      <PageHeader
        title="행사 참가 신청"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={setCurrentPath}
      />

      <main className="reg-container">{renderContent()}</main>
    </div>
  );
}
