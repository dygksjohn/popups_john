import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  Receipt,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
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
  .pay-root {
    box-sizing: border-box;
    min-height: 100vh;
    background: #f5f7fb;
    color: #0f172a;
    font-family: "Pretendard Variable", "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .pay-root *, .pay-root *::before, .pay-root *::after {
    box-sizing: border-box;
    font-family: inherit;
  }
  .pay-container {
    width: min(920px, calc(100% - 40px));
    margin: 0 auto;
    padding: 28px 0 72px;
  }
  .pay-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 20px;
  }
  .pay-stat {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 18px;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.05);
  }
  .pay-stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
  }
  .pay-stat-icon.blue { background: #dbeafe; color: #1d4ed8; }
  .pay-stat-icon.green { background: #dcfce7; color: #15803d; }
  .pay-stat-icon.amber { background: #fef3c7; color: #b45309; }
  .pay-stat-value {
    font-size: 28px;
    font-weight: 800;
    line-height: 1;
  }
  .pay-stat-label {
    margin-top: 8px;
    font-size: 12px;
    color: #64748b;
    font-weight: 700;
  }
  .pay-toolbar {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }
  .pay-title {
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
  }
  .pay-sub {
    margin-top: 6px;
    font-size: 13px;
    color: #64748b;
  }
  .pay-list {
    display: grid;
    gap: 12px;
  }
  .pay-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.05);
    overflow: hidden;
  }
  .pay-card-body {
    padding: 18px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .pay-card-main {
    display: grid;
    gap: 8px;
    min-width: 0;
    flex: 1;
  }
  .pay-card-method {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #64748b;
    font-weight: 700;
  }
  .pay-card-event {
    font-size: 16px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.45;
  }
  .pay-card-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    font-size: 12px;
    color: #64748b;
  }
  .pay-card-side {
    text-align: right;
    display: grid;
    gap: 6px;
    min-width: 160px;
  }
  .pay-card-amount {
    font-size: 20px;
    font-weight: 800;
    color: #1d4ed8;
  }
  .pay-card-footer {
    padding: 14px 20px;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }
  .pay-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 30px;
    padding: 0 12px;
    border-radius: 999px;
    background: #dcfce7;
    color: #15803d;
    font-size: 12px;
    font-weight: 800;
  }
  .pay-footer-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .pay-btn {
    height: 36px;
    padding: 0 14px;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #475569;
    font-size: 12px;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
  }
  .pay-btn.refund {
    border-color: #fecaca;
    background: #fff1f2;
    color: #b91c1c;
  }
  .pay-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .pay-error {
    margin-bottom: 14px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid #fecaca;
    background: #fef2f2;
    color: #b91c1c;
    font-size: 13px;
    font-weight: 700;
  }
  .pay-empty {
    padding: 28px 18px;
    text-align: center;
    background: #fff;
    border: 1px dashed #cbd5e1;
    border-radius: 16px;
    color: #64748b;
    font-size: 13px;
  }
  .pay-total-card {
    margin-top: 16px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 18px;
    padding: 18px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .pay-total-label {
    font-size: 14px;
    font-weight: 800;
    color: #1e3a8a;
  }
  .pay-total-amount {
    font-size: 26px;
    font-weight: 800;
    color: #1d4ed8;
  }
  @media (max-width: 768px) {
    .pay-stats {
      grid-template-columns: 1fr;
    }
    .pay-container {
      width: min(100%, calc(100% - 28px));
      padding: 20px 0 60px;
    }
    .pay-card-body,
    .pay-card-footer,
    .pay-total-card {
      align-items: flex-start;
    }
    .pay-card-side {
      min-width: 0;
      text-align: left;
    }
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
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(
    date.getDate(),
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
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
    case "KAKAOPAY":
      return "카카오페이";
    case "CARD":
      return "카드 결제";
    case "BANK":
      return "계좌 이체";
    default:
      return paymentMethod || "기타 결제";
  }
}

function getStatusMeta(payment) {
  const refundStatus = String(payment?.refund?.status || "").toUpperCase();
  if (refundStatus === "REQUESTED") {
    return { label: "환불 요청", style: { background: "#fef3c7", color: "#b45309" } };
  }
  if (refundStatus === "APPROVED") {
    return { label: "환불 승인", style: { background: "#dbeafe", color: "#1d4ed8" } };
  }
  if (refundStatus === "REJECTED") {
    return { label: "환불 거절", style: { background: "#fee2e2", color: "#b91c1c" } };
  }
  if (refundStatus === "REFUNDED") {
    return { label: "환불 완료", style: { background: "#e5e7eb", color: "#374151" } };
  }

  switch (String(payment?.status || "").toUpperCase()) {
    case "APPROVED":
      return { label: "결제 완료", style: undefined };
    case "REQUESTED":
      return { label: "결제 요청", style: { background: "#e0f2fe", color: "#0369a1" } };
    case "FAILED":
      return { label: "결제 실패", style: { background: "#fee2e2", color: "#b91c1c" } };
    case "CANCELLED":
      return { label: "취소됨", style: { background: "#fee2e2", color: "#b91c1c" } };
    case "REFUNDED":
      return { label: "환불 완료", style: { background: "#e5e7eb", color: "#374151" } };
    default:
      return { label: payment?.status || "-", style: { background: "#e5e7eb", color: "#475569" } };
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
        axiosInstance.get("/api/payments/my", {
          params: { page: 0, size: 20, sort: "requestedAt,desc" },
        }),
        axiosInstance.get("/api/refunds/my", {
          params: { page: 0, size: 200, sort: "requestedAt,desc" },
        }),
      ]);

      setPayments(paymentsRes?.data?.data?.content ?? []);
      setRefunds(refundsRes?.data?.data?.content ?? []);
    } catch (err) {
      const message =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        "결제 내역을 불러오지 못했습니다.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const refundIndex = useMemo(
    () =>
      refunds.reduce((acc, refund) => {
        if (refund?.paymentId != null) {
          acc[String(refund.paymentId)] = refund;
        }
        return acc;
      }, {}),
    [refunds],
  );

  const paymentRows = useMemo(
    () =>
      payments.map((payment) => ({
        ...payment,
        refund: refundIndex[String(payment?.paymentId)] || null,
      })),
    [payments, refundIndex],
  );

  const stats = useMemo(() => {
    const approvedRows = paymentRows.filter((item) => item.status === "APPROVED" && !item.refund);
    return {
      totalCount: paymentRows.length,
      approvedCount: approvedRows.length,
      totalAmount: approvedRows.reduce((sum, item) => sum + toNumberAmount(item.amount), 0),
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
      if (!reason) {
        window.alert("환불 사유를 입력해주세요.");
        return;
      }
    }

    setRefundingId(paymentId);
    try {
      await axiosInstance.post("/api/refunds", {
        paymentId,
        refundAmount: toNumberAmount(payment?.amount),
        reason,
      });
      await loadHistory();
      window.alert(autoRefund ? "환불이 완료되었습니다." : "환불 요청이 접수되었습니다.");
    } catch (err) {
      const message =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        "환불 처리 중 오류가 발생했습니다.";
      window.alert(message);
    } finally {
      setRefundingId(null);
    }
  };

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
        <div className="pay-stats">
          {[
            {
              icon: <CreditCard size={18} />,
              label: "전체 결제 건수",
              value: `${stats.totalCount}건`,
              cls: "blue",
            },
            {
              icon: <Banknote size={18} />,
              label: "유효 결제 금액",
              value: formatAmount(stats.totalAmount),
              cls: "green",
            },
            {
              icon: <CheckCircle2 size={18} />,
              label: "결제 완료",
              value: `${stats.approvedCount}건`,
              cls: "amber",
            },
          ].map((item) => (
            <div key={item.label} className="pay-stat">
              <div className={`pay-stat-icon ${item.cls}`}>{item.icon}</div>
              <div className="pay-stat-value">{item.value}</div>
              <div className="pay-stat-label">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="pay-toolbar">
          <div>
            <div className="pay-title">결제 및 환불 상태</div>
            <div className="pay-sub">
              {loading
                ? "불러오는 중..."
                : `총 ${stats.totalCount}건, 유효 결제 금액 ${formatAmount(stats.totalAmount)}`}
            </div>
          </div>
        </div>

        {error ? <div className="pay-error">{error}</div> : null}

        {!loading && !error && paymentRows.length === 0 ? (
          <div className="pay-empty">결제 내역이 없습니다.</div>
        ) : null}

        <div className="pay-list">
          {paymentRows.map((payment) => {
            const statusMeta = getStatusMeta(payment);
            const canRefund = payment.status === "APPROVED" && !payment.refund;
            const refundLabel = isAutoRefundEligible(payment) ? "환불하기" : "환불 신청";

            return (
              <div key={payment.paymentId || payment.orderNo} className="pay-card">
                <div className="pay-card-body">
                  <div className="pay-card-main">
                    <div className="pay-card-method">
                      <CreditCard size={14} />
                      {methodLabelOf(payment.paymentMethod)}
                    </div>
                    <div className="pay-card-event">{payment.eventTitle || "행사 결제"}</div>
                    <div className="pay-card-meta">
                      <span>결제 번호 {payment.orderNo || `PAY-${payment.paymentId}`}</span>
                      <span>결제일 {formatDateTime(payment.requestedAt)}</span>
                      {payment.eventStartAt ? (
                        <span>행사 시작 {formatDateTime(payment.eventStartAt)}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="pay-card-side">
                    <div className="pay-card-amount">{formatAmount(payment.amount)}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {payment.refund?.reason ? `환불 사유: ${payment.refund.reason}` : "-"}
                    </div>
                  </div>
                </div>
                <div className="pay-card-footer">
                  <span className="pay-status-badge" style={statusMeta.style}>
                    <CheckCircle2 size={12} />
                    {statusMeta.label}
                  </span>
                  <div className="pay-footer-actions">
                    <button
                      type="button"
                      className="pay-btn"
                      onClick={() => window.alert("영수증 기능은 추후 연결 예정입니다.")}
                    >
                      <Receipt size={13} />
                      영수증
                    </button>
                    {canRefund ? (
                      <button
                        type="button"
                        className="pay-btn refund"
                        onClick={() => handleRefund(payment)}
                        disabled={refundingId === payment.paymentId}
                      >
                        {refundingId === payment.paymentId ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            처리 중...
                          </>
                        ) : (
                          refundLabel
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pay-total-card">
          <div className="pay-total-label">현재 유효 결제 금액</div>
          <div className="pay-total-amount">{formatAmount(stats.totalAmount)}</div>
        </div>
      </main>
    </div>
  );
}
