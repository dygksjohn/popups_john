import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, Loader2, Inbox } from "lucide-react";
import PageHeader from "../components/PageHeader";
import PageLoading from "../components/PageLoading";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { tokenStore } from "../../../app/http/tokenStore";

export const SERVICE_CATEGORIES = [
  { label: "행사 참가 신청", path: "/registration/apply" },
  { label: "신청 내역 조회", path: "/registration/applyhistory" },
  { label: "결제 내역", path: "/registration/paymenthistory" },
  { label: "QR 체크인", path: "/registration/qrcheckin" },
];

export const SUBTITLE_MAP = {
  "/registration/apply": "행사 참가 신청 현황을 확인할 수 있습니다.",
  "/registration/applyhistory": "행사 신청 이력을 확인할 수 있습니다.",
  "/registration/paymenthistory": "결제와 환불 처리 상태를 확인할 수 있습니다.",
  "/registration/qrcheckin": "행사 입장용 QR 코드를 확인할 수 있습니다.",
};

const styles = `
  .ph-root {
    box-sizing: border-box;
    font-family: inherit;
    background: #fff;
    min-height: 100vh;
    color: #111;
  }
  .ph-root *, .ph-root *::before, .ph-root *::after { box-sizing: border-box; font-family: inherit; }
  .ph-wrap {
    width: min(1400px, calc(100% - 48px));
    margin: 0 auto;
    padding: 0 0 80px;
  }

  /* ── 상단 요약 ── */
  .ph-summary {
    display: flex;
    align-items: stretch;
    gap: 0;
    margin: 32px 0;
    border: 1px solid #f0f0f0;
    border-radius: 16px;
    overflow: hidden;
  }
  .ph-summary-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 28px 0;
    gap: 6px;
  }
  .ph-summary-item + .ph-summary-item { border-left: 1px solid #f0f0f0; }
  .ph-summary-val {
    font-size: 26px;
    font-weight: 800;
    color: #111;
    letter-spacing: -0.03em;
  }
  .ph-summary-val.green { color: #16a34a; }
  .ph-summary-val.blue { color: #3b82f6; }
  .ph-summary-label {
    font-size: 12px;
    font-weight: 500;
    color: #aaa;
  }

  /* ── 섹션 ── */
  .ph-section {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .ph-section-title {
    font-size: 16px;
    font-weight: 800;
    color: #111;
  }
  .ph-section-count {
    font-size: 13px;
    color: #bbb;
  }

  /* ── 테이블 ── */
  .ph-table {
    width: 100%;
    border-collapse: collapse;
  }
  .ph-table thead th {
    padding: 12px 0;
    font-size: 12px;
    font-weight: 600;
    color: #bbb;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
  }
  .ph-table thead th:last-child { text-align: right; }
  .ph-table tbody tr {
    transition: background 0.1s;
  }
  .ph-table tbody tr:hover { background: #fafafa; }
  .ph-table td {
    padding: 18px 0;
    font-size: 14px;
    color: #111;
    border-bottom: 1px solid #f7f7f7;
    vertical-align: middle;
  }
  .ph-table td:last-child { text-align: right; }
  .ph-td-name {
    font-weight: 700;
    color: #111;
  }
  .ph-td-sub {
    font-size: 12px;
    color: #bbb;
    margin-top: 2px;
  }
  .ph-td-amount {
    font-size: 15px;
    font-weight: 800;
    color: #111;
    letter-spacing: -0.02em;
  }
  .ph-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
  }
  .ph-refund-btn {
    padding: 6px 14px;
    border-radius: 8px;
    border: none;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    background: #fef2f2;
    color: #ef4444;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: background 0.15s;
  }
  .ph-refund-btn:hover { background: #fee2e2; }
  .ph-refund-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── 합계 ── */
  .ph-total {
    margin-top: 20px;
    padding: 20px 0;
    border-top: 2px solid #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .ph-total-label {
    font-size: 14px;
    font-weight: 600;
    color: #999;
  }
  .ph-total-amount {
    font-size: 22px;
    font-weight: 800;
    color: #111;
    letter-spacing: -0.03em;
  }

  /* ── 빈 상태 / 에러 ── */
  .ph-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 80px 20px;
    gap: 10px;
    color: #d1d5db;
  }
  .ph-empty span {
    font-size: 14px;
    color: #aaa;
  }
  .ph-error {
    text-align: center;
    padding: 40px 20px;
    background: #fef2f2;
    color: #dc2626;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 16px;
  }

  @media (max-width: 768px) {
    .ph-table thead { display: none; }
    .ph-table, .ph-table tbody, .ph-table tr, .ph-table td {
      display: block;
      width: 100%;
    }
    .ph-table tr {
      padding: 16px 0;
      border-bottom: 1px solid #f5f5f5;
    }
    .ph-table td {
      padding: 3px 0;
      border: none;
      text-align: left !important;
    }
    .ph-summary-val { font-size: 20px; }
    .ph-summary-item { padding: 20px 0; }
  }
`;

function toNumberAmount(amount) {
  const value = Number(amount);
  return Number.isFinite(value) ? value : 0;
}

function formatAmount(amount) {
  return `₩${toNumberAmount(amount).toLocaleString("ko-KR")}`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isAutoRefundEligible(payment) {
  const startAt = parseDate(payment?.eventStartAt);
  if (!startAt) return true;
  return Date.now() < startAt.getTime();
}

function methodLabelOf(paymentMethod) {
  switch (String(paymentMethod || "").toUpperCase()) {
    case "KAKAOPAY": return "카카오페이";
    case "CARD": return "카드";
    case "BANK": return "계좌이체";
    default: return paymentMethod || "기타";
  }
}

function getStatusMeta(payment) {
  const refundStatus = String(payment?.refund?.status || "").toUpperCase();
  if (refundStatus === "REQUESTED") return { label: "환불 요청", bg: "#fefce8", color: "#ca8a04" };
  if (refundStatus === "APPROVED") return { label: "환불 승인", bg: "#eff6ff", color: "#3b82f6" };
  if (refundStatus === "REJECTED") return { label: "환불 거절", bg: "#fef2f2", color: "#ef4444" };
  if (refundStatus === "REFUNDED") return { label: "환불 완료", bg: "#f5f5f5", color: "#999" };

  switch (String(payment?.status || "").toUpperCase()) {
    case "APPROVED": return { label: "결제 완료", bg: "#f0fdf4", color: "#16a34a" };
    case "REQUESTED": return { label: "결제 요청", bg: "#eff6ff", color: "#3b82f6" };
    case "FAILED": return { label: "결제 실패", bg: "#fef2f2", color: "#ef4444" };
    case "CANCELLED": return { label: "취소됨", bg: "#fef2f2", color: "#ef4444" };
    case "REFUNDED": return { label: "환불 완료", bg: "#f5f5f5", color: "#999" };
    default: return { label: payment?.status || "-", bg: "#f5f5f5", color: "#999" };
  }
}

export default function PaymentHistory({ onNavigate }) {
  const currentPath = "/registration/paymenthistory";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [refundingId, setRefundingId] = useState(null);

  const loadHistory = useCallback(async () => {
    if (!tokenStore.getAccess()) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [paymentsRes, refundsRes] = await Promise.all([
        axiosInstance.get("/api/payments/my", { params: { page: 0, size: 20, sort: "requestedAt,desc" } }),
        axiosInstance.get("/api/refunds/my", { params: { page: 0, size: 200, sort: "requestedAt,desc" } }),
      ]);
      setPayments(paymentsRes?.data?.data?.content ?? []);
      setRefunds(refundsRes?.data?.data?.content ?? []);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.response?.data?.message || "결제 내역을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const refundIndex = useMemo(
    () => refunds.reduce((acc, r) => { if (r?.paymentId != null) acc[String(r.paymentId)] = r; return acc; }, {}),
    [refunds],
  );

  const paymentRows = useMemo(
    () => payments.map((p) => ({ ...p, refund: refundIndex[String(p?.paymentId)] || null })),
    [payments, refundIndex],
  );

  const stats = useMemo(() => {
    const approved = paymentRows.filter((p) => p.status === "APPROVED" && !p.refund);
    return {
      total: paymentRows.length,
      approved: approved.length,
      amount: approved.reduce((s, p) => s + toNumberAmount(p.amount), 0),
    };
  }, [paymentRows]);

  const handleRefund = async (payment) => {
    const paymentId = payment?.paymentId;
    if (!paymentId || payment?.status !== "APPROVED" || payment?.refund || refundingId) return;

    const autoRefund = isAutoRefundEligible(payment);
    const confirmed = window.confirm(
      autoRefund
        ? "행사 시작 전 환불은 자동으로 처리됩니다. 환불하시겠습니까?"
        : "행사 시작 후 환불은 관리자 승인이 필요합니다. 환불을 신청하시겠습니까?",
    );
    if (!confirmed) return;

    let reason = autoRefund ? "행사 시작 전 자동 환불 요청" : "";
    if (!autoRefund) {
      const input = window.prompt("환불 사유를 입력해주세요.", "개인 사정");
      if (input == null) return;
      reason = String(input || "").trim();
      if (!reason) { window.alert("환불 사유를 입력해주세요."); return; }
    }

    setRefundingId(paymentId);
    try {
      await axiosInstance.post("/api/refunds", { paymentId, refundAmount: toNumberAmount(payment?.amount), reason });
      await loadHistory();
      window.alert(autoRefund ? "환불이 완료되었습니다." : "환불 요청이 접수되었습니다.");
    } catch (err) {
      window.alert(err?.response?.data?.error?.message || err?.response?.data?.message || "환불 처리 중 오류가 발생했습니다.");
    } finally {
      setRefundingId(null);
    }
  };

  return (
    <div className="ph-root">
      <style>{styles}</style>

      <PageHeader
        title="결제 내역"
        icon={<CreditCard size={40} strokeWidth={1.8} style={{ color: "#4F6AFF" }} />}
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={onNavigate}
      />

      <div className="ph-wrap">
        <div className="ph-summary">
          <div className="ph-summary-item">
            <div className="ph-summary-val">{stats.total}</div>
            <div className="ph-summary-label">전체 결제</div>
          </div>
          <div className="ph-summary-item">
            <div className="ph-summary-val green">{stats.approved}</div>
            <div className="ph-summary-label">결제 완료</div>
          </div>
          <div className="ph-summary-item">
            <div className="ph-summary-val blue">{formatAmount(stats.amount)}</div>
            <div className="ph-summary-label">유효 금액</div>
          </div>
        </div>

        <div className="ph-section">
          <span className="ph-section-title">결제 내역</span>
          <span className="ph-section-count">{loading ? "" : `${stats.total}건`}</span>
        </div>

        {loading ? (
          <PageLoading />
        ) : (error || paymentRows.length === 0) ? (
          <div className="ph-empty">
            <Inbox size={44} strokeWidth={1.2} />
            <span>{error || "결제 내역이 없습니다."}</span>
          </div>
        ) : (
          <table className="ph-table">
            <thead>
              <tr>
                <th>행사명</th>
                <th>결제수단</th>
                <th>결제일시</th>
                <th>주문번호</th>
                <th>상태</th>
                <th>금액</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paymentRows.map((payment) => {
                const meta = getStatusMeta(payment);
                const canRefund = payment.status === "APPROVED" && !payment.refund;
                const refundLabel = isAutoRefundEligible(payment) ? "환불" : "환불 신청";

                return (
                  <tr key={payment.paymentId || payment.orderNo}>
                    <td><span className="ph-td-name">{payment.eventTitle || "행사 결제"}</span></td>
                    <td style={{ color: "#888", fontSize: 13 }}>{methodLabelOf(payment.paymentMethod)}</td>
                    <td style={{ color: "#888", fontSize: 13 }}>{formatDateTime(payment.requestedAt)}</td>
                    <td style={{ color: "#888", fontSize: 13 }}>{payment.orderNo || `PAY-${payment.paymentId}`}</td>
                    <td><span className="ph-badge" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span></td>
                    <td><span className="ph-td-amount">{formatAmount(payment.amount)}</span></td>
                    <td>
                      {canRefund ? (
                        <button
                          type="button"
                          className="ph-refund-btn"
                          onClick={() => handleRefund(payment)}
                          disabled={refundingId === payment.paymentId}
                        >
                          {refundingId === payment.paymentId ? <><Loader2 size={12} /> 처리 중</> : refundLabel}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {paymentRows.length > 0 && (
          <div className="ph-total">
            <span className="ph-total-label">유효 결제 금액</span>
            <span className="ph-total-amount">{formatAmount(stats.amount)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
