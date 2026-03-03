import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Receipt } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { tokenStore } from "../../../app/http/tokenStore";
import { useAuth } from "../auth/AuthProvider";

export const SERVICE_CATEGORIES = [
  { label: "행사 참가 신청", path: "/registration/apply" },
  { label: "신청 내역 조회", path: "/registration/applyhistory" },
  { label: "결제 내역", path: "/registration/paymenthistory" },
  { label: "QR 체크인", path: "/registration/qrcheckin" },
];

export const SUBTITLE_MAP = {
  "/registration/apply": "행사 참가를 신청할 수 있습니다.",
  "/registration/applyhistory": "내 신청 내역을 조회할 수 있습니다.",
  "/registration/paymenthistory": "결제 완료 및 환불 내역을 확인할 수 있습니다.",
  "/registration/qrcheckin": "내 QR 코드를 확인할 수 있습니다.",
};

const statusLabel = {
  REQUESTED: "결제 요청",
  APPROVED: "결제 완료",
  CANCELLED: "결제 취소",
  FAILED: "결제 실패",
  REFUNDED: "환불 완료",
};

const methodLabel = {
  CARD: "카드",
  KAKAOPAY: "카카오페이",
  BANK: "계좌이체",
};

function toAmount(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toDateText(value) {
  if (!value) return "-";
  const [d, t] = String(value).split("T");
  if (!d) return "-";
  return `${d.replaceAll("-", ".")} ${t ? t.slice(0, 5) : ""}`.trim();
}

export default function PaymentHistory({ onNavigate }) {
  const navigate = useNavigate();
  const currentPath = "/registration/paymenthistory";
  const { isAuthed, isBootstrapped } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payments, setPayments] = useState([]);
  const [refundingId, setRefundingId] = useState(null);

  useEffect(() => {
    if (!isBootstrapped) return;

    if (!isAuthed || !tokenStore.getAccess()) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      setPayments([]);
      return;
    }

    const fetchPayments = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axiosInstance.get("/api/payments/my", {
          params: { page: 0, size: 20, sort: "requestedAt,desc" },
        });
        const pageData = res?.data?.data;
        const list = pageData?.content ?? [];
        setPayments(Array.isArray(list) ? list : []);
      } catch (e) {
        const msg =
          e?.response?.data?.error?.message ||
          e?.response?.data?.message ||
          "결제 내역을 불러오지 못했습니다.";
        setError(msg);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [isAuthed, isBootstrapped]);

  const stats = useMemo(() => {
    const totalCount = payments.length;
    const approved = payments.filter((p) => p?.status === "APPROVED");
    const approvedAmount = approved.reduce((acc, p) => acc + toAmount(p?.amount), 0);
    return {
      totalCount,
      approvedCount: approved.length,
      approvedAmount,
    };
  }, [payments]);

  const handleRefund = async (payment) => {
    const paymentId = payment?.paymentId;
    if (!paymentId || payment?.status !== "APPROVED" || refundingId) return;

    const ok = window.confirm("정말 환불하시겠습니까?\n환불 시 결제 상태가 취소로 변경됩니다.");
    if (!ok) return;

    setRefundingId(paymentId);
    try {
      const res = await axiosInstance.post(`/api/payments/${paymentId}/cancel`);
      const changedStatus = res?.data?.data?.status || "CANCELLED";
      setPayments((prev) =>
        prev.map((row) =>
          row?.paymentId === paymentId ? { ...row, status: changedStatus } : row,
        ),
      );
      window.alert("환불이 완료되었습니다.");
    } catch (e) {
      const msg =
        e?.response?.data?.error?.message ||
        e?.response?.data?.message ||
        "환불 처리 중 오류가 발생했습니다.";
      window.alert(msg);
    } finally {
      setRefundingId(null);
    }
  };

  return (
    <div style={{ background: "#f5f6fa", minHeight: "100vh" }}>
      <PageHeader
        title="결제 내역"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={onNavigate}
      />

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "20px 16px 80px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <StatCard label="총 결제 건수" value={`${stats.totalCount}건`} />
          <StatCard label="결제 완료 건수" value={`${stats.approvedCount}건`} />
          <StatCard label="결제 완료 금액" value={`${stats.approvedAmount.toLocaleString()}원`} />
        </div>

        {!isBootstrapped && <PanelMessage text="세션 확인 중입니다..." />}

        {isBootstrapped && !isAuthed && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 24,
              textAlign: "center",
            }}
          >
            <div style={{ color: "#64748b", marginBottom: 12 }}>
              로그인 후 결제 내역을 확인할 수 있습니다.
            </div>
            <button
              type="button"
              onClick={() => navigate("/auth/login", { state: { from: currentPath } })}
              style={{
                height: 40,
                borderRadius: 8,
                border: "none",
                background: "#1a4fd6",
                color: "#fff",
                fontWeight: 700,
                padding: "0 16px",
                cursor: "pointer",
              }}
            >
              로그인
            </button>
          </div>
        )}

        {isBootstrapped && isAuthed && loading && <PanelMessage text="결제 내역을 불러오는 중입니다..." />}

        {isBootstrapped && isAuthed && !loading && error && <PanelMessage text={error} error />}

        {isBootstrapped && isAuthed && !loading && !error && payments.length === 0 && (
          <PanelMessage text="결제 내역이 없습니다." />
        )}

        {isBootstrapped && isAuthed && !loading && !error && payments.length > 0 && (
          <div style={{ display: "grid", gap: 10 }}>
            {payments.map((item) => (
              <article
                key={item.paymentId}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#111827",
                        marginBottom: 4,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.eventTitle || "행사명 없음"}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>주문번호: {item.orderNo || "-"}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      결제수단: {methodLabel[item.paymentMethod] || item.paymentMethod || "-"}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>결제일시: {toDateText(item.requestedAt)}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#1a4fd6" }}>
                      {toAmount(item.amount).toLocaleString()}원
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#047857",
                        background: "#ecfdf5",
                        borderRadius: 999,
                        padding: "4px 10px",
                        display: "inline-block",
                      }}
                    >
                      {statusLabel[item.status] || item.status || "-"}
                    </div>
                  </div>
                </div>

                {item.status === "APPROVED" && (
                  <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => handleRefund(item)}
                      disabled={refundingId === item.paymentId}
                      style={{
                        padding: "7px 12px",
                        borderRadius: 8,
                        border: "1px solid #fca5a5",
                        background: "#fef2f2",
                        color: "#dc2626",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: refundingId === item.paymentId ? "not-allowed" : "pointer",
                        opacity: refundingId === item.paymentId ? 0.6 : 1,
                      }}
                    >
                      {refundingId === item.paymentId ? "처리 중..." : "환불하기"}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div style={{ display: "inline-flex", marginBottom: 8, color: "#1a4fd6" }}>
        <CreditCard size={16} />
      </div>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 800, color: "#111827" }}>{value}</div>
    </div>
  );
}

function PanelMessage({ text, error = false }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 24,
        color: error ? "#b91c1c" : "#64748b",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Receipt size={16} />
      <span>{text}</span>
    </div>
  );
}
