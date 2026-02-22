import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { CreditCard, Banknote, CheckCircle2, Receipt } from "lucide-react";
import { SERVICE_CATEGORIES, SUBTITLE_MAP } from "./Apply";

/* ─────────────────────────────────────────────
   카드사 / 결제수단 SVG 아이콘
───────────────────────────────────────────── */

// KB국민카드
const KBCardSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#FFB800" />
    <text
      x="14"
      y="19"
      textAnchor="middle"
      fontSize="11"
      fontWeight="800"
      fill="#3C1A00"
      fontFamily="Arial,sans-serif"
    >
      KB
    </text>
  </svg>
);

// 신한카드
const ShinhanCardSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#0046FF" />
    <path
      d="M9 14.5C9 12 11.5 10 14 10C16.5 10 18 11.5 18 11.5"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M19 13.5C19 16 16.5 18 14 18C11.5 18 10 16.5 10 16.5"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// 삼성카드
const SamsungCardSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#1428A0" />
    <text
      x="14"
      y="19"
      textAnchor="middle"
      fontSize="7.5"
      fontWeight="700"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      SAMSUNG
    </text>
  </svg>
);

// 현대카드
const HyundaiCardSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#1A1A1A" />
    <text
      x="14"
      y="19"
      textAnchor="middle"
      fontSize="9"
      fontWeight="700"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      HYUNDAI
    </text>
  </svg>
);

// 롯데카드
const LotteCardSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#ED1C24" />
    <text
      x="14"
      y="19"
      textAnchor="middle"
      fontSize="9"
      fontWeight="800"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      LOTTE
    </text>
  </svg>
);

// 하나카드
const HanaCardSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#009B77" />
    <text
      x="14"
      y="19"
      textAnchor="middle"
      fontSize="9"
      fontWeight="700"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      HANA
    </text>
  </svg>
);

// 우리카드
const WooriCardSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#0068B7" />
    <text
      x="14"
      y="19"
      textAnchor="middle"
      fontSize="9"
      fontWeight="700"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      WOORI
    </text>
  </svg>
);

// NH농협카드
const NHCardSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#00843D" />
    <text
      x="14"
      y="17"
      textAnchor="middle"
      fontSize="10"
      fontWeight="800"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      NH
    </text>
  </svg>
);

// IBK기업은행카드
const IBKCardSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#005BAC" />
    <text
      x="14"
      y="19"
      textAnchor="middle"
      fontSize="10"
      fontWeight="800"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      IBK
    </text>
  </svg>
);

// BC카드
const BCCardSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#EF3E23" />
    <text
      x="14"
      y="19"
      textAnchor="middle"
      fontSize="11"
      fontWeight="800"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      BC
    </text>
  </svg>
);

// 카카오페이
const KakaoPaySVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#FEE500" />
    <path
      d="M14 7C10.134 7 7 9.686 7 12.994C7 15.073 8.256 16.912 10.196 18.01L9.4 21L12.768 18.818C13.168 18.873 13.58 18.9 14 18.9C17.866 18.9 21 16.214 21 12.906C21 9.598 17.866 7 14 7Z"
      fill="#3A1D1D"
    />
  </svg>
);

// 네이버페이
const NaverPaySVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#03C75A" />
    <path d="M9 8H12.2L15.1 13.2V8H19V20H15.8L12.9 14.8V20H9V8Z" fill="white" />
  </svg>
);

// 토스페이
const TossPaySVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#0064FF" />
    <text
      x="14"
      y="19"
      textAnchor="middle"
      fontSize="9"
      fontWeight="700"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      toss
    </text>
  </svg>
);

// 페이코
const PaycoSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#FF4B12" />
    <text
      x="14"
      y="19"
      textAnchor="middle"
      fontSize="8"
      fontWeight="700"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      PAYCO
    </text>
  </svg>
);

// 삼성페이
const SamsungPaySVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#1428A0" />
    <text
      x="14"
      y="16"
      textAnchor="middle"
      fontSize="6"
      fontWeight="700"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      SAMSUNG
    </text>
    <text
      x="14"
      y="22"
      textAnchor="middle"
      fontSize="7"
      fontWeight="700"
      fill="white"
      fontFamily="Arial,sans-serif"
    >
      Pay
    </text>
  </svg>
);

// 애플페이
const ApplePaySVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#000000" />
    <path
      d="M14.8 8.2C15.3 7.6 15.6 6.8 15.5 6C14.8 6.05 14 6.45 13.5 7.05C13.05 7.6 12.7 8.4 12.85 9.15C13.6 9.2 14.3 8.8 14.8 8.2Z"
      fill="white"
    />
    <path
      d="M17.15 13.75C17.15 11.55 18.85 10.55 18.9 10.5C17.85 8.95 16.2 8.75 15.6 8.7C14.2 8.55 12.9 9.5 12.2 9.5C11.5 9.5 10.4 8.7 9.2 8.75C7.7 8.8 6.3 9.6 5.55 10.9C4 13.5 5.1 17.35 6.6 19.45C7.35 20.5 8.2 21.65 9.4 21.6C10.55 21.55 11 20.85 12.4 20.85C13.8 20.85 14.2 21.6 15.45 21.55C16.65 21.5 17.4 20.5 18.15 19.45C18.65 18.75 18.9 18.05 18.95 18C18.9 17.95 17.15 17.3 17.15 13.75Z"
      fill="white"
    />
  </svg>
);

// 계좌이체
const BankTransferSVG = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="6" fill="#F3F4F6" />
    <rect x="7" y="12" width="14" height="2" rx="1" fill="#6B7280" />
    <rect x="7" y="16" width="14" height="2" rx="1" fill="#6B7280" />
    <path d="M14 7L9 11H19L14 7Z" fill="#6B7280" />
  </svg>
);

/* ─────────────────────────────────────────────
   METHOD_ICON MAP
───────────────────────────────────────────── */
const METHOD_ICON = {
  kb: <KBCardSVG />,
  shinhan: <ShinhanCardSVG />,
  samsung_card: <SamsungCardSVG />,
  hyundai: <HyundaiCardSVG />,
  lotte: <LotteCardSVG />,
  hana: <HanaCardSVG />,
  woori: <WooriCardSVG />,
  nh: <NHCardSVG />,
  ibk: <IBKCardSVG />,
  bc: <BCCardSVG />,
  kakao: <KakaoPaySVG />,
  naver: <NaverPaySVG />,
  toss: <TossPaySVG />,
  payco: <PaycoSVG />,
  samsung_pay: <SamsungPaySVG />,
  apple_pay: <ApplePaySVG />,
  bank: <BankTransferSVG />,
};

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const PAYMENTS = [
  {
    id: "PAY-20260312-001",
    event: "2026 봄 반려동물 페스티벌 - Day 1",
    method: "KB국민카드 ****1234",
    methodType: "kb",
    amount: 30000,
    date: "2026.03.12",
    time: "14:23",
    status: "완료",
  },
  {
    id: "PAY-20250901-007",
    event: "2025 가을 펫 엑스포",
    method: "카카오페이",
    methodType: "kakao",
    amount: 35000,
    date: "2025.09.01",
    time: "09:11",
    status: "완료",
  },
  {
    id: "PAY-20250322-003",
    event: "2025 봄 반려동물 페스티벌",
    method: "네이버페이",
    methodType: "naver",
    amount: 45000,
    date: "2025.03.22",
    time: "11:45",
    status: "완료",
  },
];

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .pay-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .pay-root *, .pay-root *::before, .pay-root *::after { box-sizing: border-box; font-family: inherit; }
  .pay-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  .pay-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  .pay-stat {
    background: #fff; border: 1px solid #e9ecef; border-radius: 12px;
    padding: 18px 20px; display: flex; align-items: center; gap: 14px;
  }
  .pay-stat-icon {
    width: 42px; height: 42px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .pay-stat-icon.blue  { background: #eff4ff; color: #1a4fd6; }
  .pay-stat-icon.green { background: #ecfdf5; color: #059669; }
  .pay-stat-icon.amber { background: #fffbeb; color: #d97706; }
  .pay-stat-value { font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.5px; line-height: 1.1; }
  .pay-stat-label { font-size: 12px; color: #9ca3af; margin-top: 2px; }

  .pay-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .pay-title { font-size: 16px; font-weight: 700; color: #111827; }
  .pay-sub   { font-size: 13px; color: #9ca3af; margin-top: 2px; }

  .pay-table-wrap {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px; overflow: hidden;
  }
  .pay-table { width: 100%; border-collapse: collapse; }
  .pay-table thead tr { background: #f9fafb; }
  .pay-table th {
    padding: 13px 20px; font-size: 11.5px; font-weight: 700; color: #9ca3af;
    text-align: left; border-bottom: 1px solid #e9ecef;
    letter-spacing: 0.4px; text-transform: uppercase; white-space: nowrap;
  }
  .pay-table td {
    padding: 17px 20px; font-size: 13.5px; color: #4b5563;
    border-bottom: 1px solid #f1f3f5; vertical-align: middle;
  }
  .pay-table tbody tr:last-child td { border-bottom: none; }
  .pay-table tbody tr:hover td { background: #fafbff; }

  .pay-id { font-size: 11.5px; color: #9ca3af; font-family: 'Courier New', monospace; }
  .pay-event { font-size: 14px; font-weight: 600; color: #111827; }
  .pay-method-row { display: flex; align-items: center; gap: 8px; }
  .pay-amount { font-size: 15px; font-weight: 800; color: #1a4fd6; }
  .pay-date-main { font-size: 13px; font-weight: 500; color: #374151; }
  .pay-date-time { font-size: 11.5px; color: #9ca3af; margin-top: 2px; }
  .pay-status-badge {
    padding: 3px 10px; border-radius: 100px;
    font-size: 11px; font-weight: 600;
    background: #ecfdf5; color: #059669; white-space: nowrap;
    display: inline-flex; align-items: center; gap: 4px;
  }

  .pay-footer {
    padding: 16px 20px; background: #f9fafb; border-top: 1px solid #e9ecef;
    display: flex; justify-content: flex-end; align-items: center; gap: 12px;
  }
  .pay-footer-label { font-size: 13px; color: #6b7280; font-weight: 600; }
  .pay-footer-amount { font-size: 17px; font-weight: 800; color: #1a4fd6; }

  @media (max-width: 768px) {
    .pay-stats { grid-template-columns: 1fr; }
    .pay-container { padding: 20px 16px 48px; }
    .pay-table th, .pay-table td { padding: 12px 14px; }
  }
`;

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function PaymentHistory({ onNavigate }) {
  const currentPath = "/registration/payment";
  const totalAmount = PAYMENTS.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="pay-root">
      <style>{styles}</style>

      <PageHeader
        title="참가신청"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={onNavigate}
      />

      <main className="pay-container">
        {/* 통계 카드 */}
        <div className="pay-stats">
          {[
            {
              icon: <CreditCard size={20} />,
              label: "총 결제 횟수",
              value: `${PAYMENTS.length}회`,
              cls: "blue",
            },
            {
              icon: <Banknote size={20} />,
              label: "누적 결제 금액",
              value: `${totalAmount.toLocaleString()}원`,
              cls: "green",
            },
            {
              icon: <CheckCircle2 size={20} />,
              label: "결제 완료",
              value: `${PAYMENTS.length}건`,
              cls: "amber",
            },
          ].map((s) => (
            <div key={s.label} className="pay-stat">
              <div className={`pay-stat-icon ${s.cls}`}>{s.icon}</div>
              <div>
                <div className="pay-stat-value">{s.value}</div>
                <div className="pay-stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 툴바 */}
        <div className="pay-toolbar">
          <div>
            <div className="pay-title">결제 내역</div>
            <div className="pay-sub">
              총 {PAYMENTS.length}건 · ₩{totalAmount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* 테이블 */}
        <div className="pay-table-wrap">
          <table className="pay-table">
            <thead>
              <tr>
                {[
                  "결제번호",
                  "행사명",
                  "결제 수단",
                  "금액",
                  "결제 일시",
                  "상태",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PAYMENTS.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="pay-id">{p.id}</div>
                  </td>
                  <td>
                    <div className="pay-event">{p.event}</div>
                  </td>
                  <td>
                    <div className="pay-method-row">
                      {METHOD_ICON[p.methodType] || <BankTransferSVG />}
                      <span style={{ fontSize: 13 }}>{p.method}</span>
                    </div>
                  </td>
                  <td>
                    <div className="pay-amount">
                      ₩ {p.amount.toLocaleString()}
                    </div>
                  </td>
                  <td>
                    <div className="pay-date-main">{p.date}</div>
                    <div className="pay-date-time">{p.time}</div>
                  </td>
                  <td>
                    <span className="pay-status-badge">
                      <CheckCircle2 size={11} />
                      결제 완료
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 합계 */}
          <div className="pay-footer">
            <span className="pay-footer-label">합계</span>
            <span className="pay-footer-amount">
              ₩ {totalAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
