import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { tokenStore } from "../../../app/http/tokenStore";
import {
  CreditCard,
  Banknote,
  CheckCircle2,
  Receipt,
} from "lucide-react";

export const SERVICE_CATEGORIES = [
  { label: "행사 참가 신청", path: "/registration/apply" },
  { label: "신청 내역 조회", path: "/registration/applyhistory" },
  { label: "결제 내역", path: "/registration/paymenthistory" },
  { label: "QR 체크인", path: "/registration/qrcheckin" },
];

export const SUBTITLE_MAP = {
  "/registration/apply": "행사에 참가 신청하세요",
  "/registration/applyhistory": "나의 행사 참가 신청 이력을 확인하세요",
  "/registration/paymenthistory": "결제 완료된 내역을 확인하세요",
  "/registration/qrcheckin": "내 QR 코드를 확인하세요",
};

/* ─────────────────────────────────────────────
   카드사 / 결제수단 SVG 아이콘 (기존 유지)
───────────────────────────────────────────── */
const KBCardSVG = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="6" fill="#FFB800" />
    <text x="14" y="19" textAnchor="middle" fontSize="11" fontWeight="800" fill="#3C1A00" fontFamily="Arial,sans-serif">
      KB
    </text>
  </svg>
);
const ShinhanCardSVG = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="6" fill="#0046FF" />
    <path d="M9 14.5C9 12 11.5 10 14 10C16.5 10 18 11.5 18 11.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <path d="M19 13.5C19 16 16.5 18 14 18C11.5 18 10 16.5 10 16.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const SamsungCardSVG = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="6" fill="#1428A0" />
    <text x="14" y="19" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="white" fontFamily="Arial,sans-serif">
      SAMSUNG
    </text>
  </svg>
);
const HyundaiCardSVG = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="6" fill="#1A1A1A" />
    <text x="14" y="19" textAnchor="middle" fontSize="9" fontWeight="700" fill="white" fontFamily="Arial,sans-serif">
      HYUNDAI
    </text>
  </svg>
);
const LotteCardSVG = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="6" fill="#ED1C24" />
    <text x="14" y="19" textAnchor="middle" fontSize="9" fontWeight="800" fill="white" fontFamily="Arial,sans-serif">
      LOTTE
    </text>
  </svg>
);
const HanaCardSVG = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="6" fill="#009B77" />
    <text x="14" y="19" textAnchor="middle" fontSize="9" fontWeight="700" fill="white" fontFamily="Arial,sans-serif">
      HANA
    </text>
  </svg>
);
const WooriCardSVG = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="6" fill="#0068B7" />
    <text x="14" y="19" textAnchor="middle" fontSize="9" fontWeight="700" fill="white" fontFamily="Arial,sans-serif">
      WOORI
    </text>
  </svg>
);
const NHCardSVG = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="6" fill="#00843D" />
    <text x="14" y="17" textAnchor="middle" fontSize="10" fontWeight="800" fill="white" fontFamily="Arial,sans-serif">
      NH
    </text>
  </svg>
);
const IBKCardSVG = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="6" fill="#005BAC" />
    <text x="14" y="19" textAnchor="middle" fontSize="10" fontWeight="800" fill="white" fontFamily="Arial,sans-serif">
      IBK
    </text>
  </svg>
);
const BCCardSVG = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="6" fill="#EF3E23" />
    <text x="14" y="19" textAnchor="middle" fontSize="11" fontWeight="800" fill="white" fontFamily="Arial,sans-serif">
      BC
    </text>
  </svg>
);
const KakaoPaySVG = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="6" fill="#FEE500" />
    <path
      d="M14 7C10.134 7 7 9.686 7 12.994C7 15.073 8.256 16.912 10.196 18.01L9.4 21L12.768 18.818C13.168 18.873 13.58 18.9 14 18.9C17.866 18.9 21 16.214 21 12.906C21 9.598 17.866 7 14 7Z"
      fill="#3A1D1D"
    />
  </svg>
);
const NaverPaySVG = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="6" fill="#03C75A" />
    <path d="M9 8H12.2L15.1 13.2V8H19V20H15.8L12.9 14.8V20H9V8Z" fill="white" />
  </svg>
);
const TossPaySVG = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="6" fill="#0064FF" />
    <text x="14" y="19" textAnchor="middle" fontSize="9" fontWeight="800" fill="white" fontFamily="Arial,sans-serif">
      TOSS
    </text>
  </svg>
);
const PaycoSVG = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="6" fill="#FF0000" />
    <text x="14" y="19" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="white" fontFamily="Arial,sans-serif">
      PAYCO
    </text>
  </svg>
);
const SamsungPaySVG = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="6" fill="#1428A0" />
    <text x="14" y="16" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="white" fontFamily="Arial,sans-serif">
      SAMSUNG
    </text>
    <text x="14" y="22" textAnchor="middle" fontSize="7" fontWeight="800" fill="white" fontFamily="Arial,sans-serif">
      Pay
    </text>
  </svg>
);
const ApplePaySVG = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
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
const BankTransferSVG = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="6" fill="#F3F4F6" />
    <rect x="7" y="12" width="14" height="2" rx="1" fill="#6B7280" />
    <rect x="7" y="16" width="14" height="2" rx="1" fill="#6B7280" />
    <path d="M14 7L9 11H19L14 7Z" fill="#6B7280" />
  </svg>
);

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
   STYLES
───────────────────────────────────────────── */
const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .pay-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #F5F6FA; min-height: 100vh;
  }
  .pay-root *, .pay-root *::before, .pay-root *::after { box-sizing: border-box; font-family: inherit; }
  .pay-container { max-width: 860px; margin: 0 auto; padding: 28px 20px 80px; }

  /* Stats */
  .pay-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px; }
  .pay-stat {
    background: #fff; border: 1px solid #EBEBEB; border-radius: 16px;
    padding: 20px 18px; display: flex; flex-direction: column; gap: 4px;
  }
  .pay-stat-icon-wrap {
    width: 38px; height: 38px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; margin-bottom: 8px;
  }
  .pay-stat-icon-wrap.blue  { background: #EEF2FF; color: #1B50D9; }
  .pay-stat-icon-wrap.green { background: #DCFCE7; color: #15803D; }
  .pay-stat-icon-wrap.amber { background: #FEF3C7; color: #B45309; }
  .pay-stat-value { font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.8px; line-height: 1; }
  .pay-stat-label { font-size: 12px; color: #9CA3AF; font-weight: 500; margin-top: 3px; }

  /* Toolbar */
  .pay-toolbar { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 16px; }
  .pay-title { font-size: 17px; font-weight: 800; color: #111827; letter-spacing: -0.3px; }
  .pay-sub { font-size: 13px; color: #9CA3AF; margin-top: 3px; }

  /* List */
  .pay-list { display: flex; flex-direction: column; gap: 10px; }

  /* Card */
  .pay-card {
    background: #fff; border: 1px solid #EBEBEB; border-radius: 16px;
    overflow: hidden; transition: box-shadow 0.2s;
  }
  .pay-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); }
  .pay-card-body { padding: 18px 20px; display: flex; align-items: center; gap: 16px; }
  .pay-card-method { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .pay-card-method-name { font-size: 13.5px; color: #374151; font-weight: 500; white-space: nowrap; }
  .pay-card-info { flex: 1; min-width: 0; }
  .pay-card-event { font-size: 14px; font-weight: 700; color: #111827; line-height: 1.4; }
  .pay-card-id { font-size: 11px; color: #C9CDD4; font-family: 'Courier New', monospace; margin-top: 3px; }
  .pay-card-right { text-align: right; flex-shrink: 0; }
  .pay-card-amount { font-size: 17px; font-weight: 800; color: #1B50D9; letter-spacing: -0.5px; }
  .pay-card-date { font-size: 12px; color: #9CA3AF; margin-top: 3px; }

  .pay-card-footer {
    padding: 12px 20px; background: #FAFAFA; border-top: 1px solid #F3F4F6;
    display: flex; align-items: center; justify-content: space-between;
  }
  .pay-status-badge {
    padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700;
    background: #DCFCE7; color: #15803D;
    display: inline-flex; align-items: center; gap: 5px;
  }
  .pay-receipt-btn {
    padding: 6px 14px; font-size: 12px; font-weight: 600;
    border: 1.5px solid #EBEBEB; border-radius: 8px; background: #fff;
    color: #6B7280; cursor: pointer; font-family: inherit; transition: all 0.15s;
    display: flex; align-items: center; gap: 5px;
  }
  .pay-receipt-btn:hover { border-color: #9CA3AF; color: #374151; }

  /* Total row */
  .pay-total-card {
    background: #EEF2FF; border: 1.5px solid #C7D2FA; border-radius: 16px;
    padding: 18px 20px; display: flex; align-items: center; justify-content: space-between;
    margin-top: 16px;
  }
  .pay-total-label { font-size: 14px; font-weight: 700; color: #374151; }
  .pay-total-amount { font-size: 22px; font-weight: 800; color: #1B50D9; letter-spacing: -0.8px; }

  @media (max-width: 640px) {
    .pay-stats { grid-template-columns: 1fr; }
    .pay-container { padding: 20px 16px 64px; }
  }
`;

/* ─────────────────────────────────────────────
   helpers
───────────────────────────────────────────── */

// 백엔드 PaymentProvider/Status -> UI 매핑
const statusLabel = {
  REQUESTED: "결제 요청",
  APPROVED: "결제 완료",
  FAILED: "결제 실패",
  CANCELLED: "취소됨",
  REFUNDED: "환불 완료",
};

// 결제수단 -> methodType(아이콘)
function methodTypeOf(paymentMethod) {
  // 백엔드 enum 기준: KAKAOPAY/CARD/BANK/OTHER...
  switch (paymentMethod) {
    case "KAKAOPAY":
      return "kakao";
    case "CARD":
      return "kb"; // 카드사는 정보가 없으니 기본 아이콘(필요시 변경)
    case "BANK":
      return "bank";
    default:
      return "bank";
  }
}

function methodLabelOf(paymentMethod) {
  switch (paymentMethod) {
    case "KAKAOPAY":
      return "카카오페이";
    case "CARD":
      return "카드";
    case "BANK":
      return "계좌이체";
    default:
      return paymentMethod || "기타";
  }
}

function formatDateTime(isoLike) {
  if (!isoLike) return { date: "-", time: "-" };
  // 예: 2026-02-27T01:15:56 (LocalDateTime 문자열)
  const [d, t] = String(isoLike).split("T");
  if (!d) return { date: "-", time: "-" };
  const date = d.replaceAll("-", ".");
  const time = t ? t.slice(0, 5) : "-";
  return { date, time };
}

function toNumberAmount(amount) {
  const n = Number(amount);
  return Number.isFinite(n) ? n : 0;
}

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function PaymentHistory({ onNavigate }) {
  const currentPath = "/registration/paymenthistory";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payments, setPayments] = useState([]);

  // pagination (원하면 추후 더 확장)
  const page = 0;
  const size = 20;

  const stats = useMemo(() => {
    const totalCount = payments.length;
    const approved = payments.filter((p) => p.status === "APPROVED");
    const approvedCount = approved.length;
    const totalAmount = approved.reduce((acc, p) => acc + toNumberAmount(p.amount), 0);
    return { totalCount, approvedCount, totalAmount };
  }, [payments]);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!tokenStore.getAccess()) {
        setError("로그인이 필요합니다.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const res = await axiosInstance.get("/api/payments/my", {
          params: { page, size, sort: "requestedAt,desc" },
        });

        const pageData = res?.data?.data;
        const list = pageData?.content ?? [];
        setPayments(list);
      } catch (e) {
        const msg =
          e?.response?.data?.error?.message ||
          e?.response?.data?.message ||
          "결제 내역을 불러오지 못했습니다.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  return (
    <div className="pay-root">
      <style>{styles}</style>

      <PageHeader
        title="결제 내역"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={onNavigate}
      />

      <main className="pay-container">
        {/* Stats */}
        <div className="pay-stats">
          {[
            {
              icon: <CreditCard size={18} />,
              label: "총 결제 횟수",
              value: `${stats.totalCount}회`,
              cls: "blue",
            },
            {
              icon: <Banknote size={18} />,
              label: "누적 결제 금액",
              value: `${stats.totalAmount.toLocaleString()}원`,
              cls: "green",
            },
            {
              icon: <CheckCircle2 size={18} />,
              label: "결제 완료",
              value: `${stats.approvedCount}건`,
              cls: "amber",
            },
          ].map((s) => (
            <div key={s.label} className="pay-stat">
              <div className={`pay-stat-icon-wrap ${s.cls}`}>{s.icon}</div>
              <div className="pay-stat-value">{s.value}</div>
              <div className="pay-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="pay-toolbar">
          <div>
            <div className="pay-title">결제 내역</div>
            <div className="pay-sub">
              {loading ? "불러오는 중..." : `총 ${stats.totalCount}건 · ₩${stats.totalAmount.toLocaleString()}`}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ color: "#b91c1c", marginBottom: 12 }}>
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && payments.length === 0 && (
          <div style={{ color: "#6b7280" }}>
            결제 내역이 없습니다.
          </div>
        )}

        {/* List */}
        <div className="pay-list">
          {payments.map((p) => {
            const methodType = methodTypeOf(p.paymentMethod);
            const methodLabel = methodLabelOf(p.paymentMethod);
            const amount = toNumberAmount(p.amount);
            const { date, time } = formatDateTime(p.requestedAt);

            // 표시용 id: orderNo가 있으면 orderNo, 없으면 paymentId 기반
            const displayId = p.orderNo || `PAY-${p.paymentId}`;

            const isApproved = p.status === "APPROVED";

            return (
              <div key={p.paymentId ?? displayId} className="pay-card">
                <div className="pay-card-body">
                  <div className="pay-card-method">
                    {METHOD_ICON[methodType] || <BankTransferSVG />}
                    <span className="pay-card-method-name">{methodLabel}</span>
                  </div>

                  <div className="pay-card-info">
                    {/* event명이 PaymentResponse에 없으니 일단 표시 보류.
                        필요하면 PaymentResponse에 eventTitle을 추가하는 걸 추천 */}
                    <div className="pay-card-event">
                      {p.eventTitle || "이벤트 결제"}
                    </div>                    
                  </div>

                  <div className="pay-card-right">
                    <div className="pay-card-amount">₩{amount.toLocaleString()}</div>
                    <div className="pay-card-date">
                      {date} {time}
                    </div>
                  </div>
                </div>

                <div className="pay-card-footer">
                  <span
                    className="pay-status-badge"
                    style={
                      isApproved
                        ? undefined
                        : {
                            background: "#FEE2E2",
                            color: "#B91C1C",
                          }
                    }
                  >
                    <CheckCircle2 size={11} /> {statusLabel[p.status] || p.status}
                  </span>

                  <button
                    className="pay-receipt-btn"
                    onClick={() => {
                      // 영수증 기능은 PG/백에서 추가 구현 필요
                      window.alert("영수증 기능은 추후 연결 예정입니다.");
                    }}
                  >
                    <Receipt size={12} /> 영수증
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="pay-total-card">
          <div className="pay-total-label">총 결제 금액</div>
          <div className="pay-total-amount">₩ {stats.totalAmount.toLocaleString()}</div>
        </div>
      </main>
    </div>
  );
}