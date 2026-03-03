import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { tokenStore } from "../../../app/http/tokenStore";

const paymentMethods = [
  { label: "카카오페이", value: "KAKAOPAY" },
  { label: "카드", value: "CARD" },
  { label: "계좌이체", value: "BANK" },
];

function normalizeAmount(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [method, setMethod] = useState("KAKAOPAY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const state = location.state || {};
  const eventId = useMemo(() => {
    const raw = searchParams.get("eventId") ?? state.eventId;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [searchParams, state.eventId]);

  const amount = useMemo(() => {
    const raw = searchParams.get("amount") ?? state.amount;
    return normalizeAmount(raw);
  }, [searchParams, state.amount]);

  const title = useMemo(() => {
    return searchParams.get("title") ?? state.title ?? "결제";
  }, [searchParams, state.title]);

  const returnUrl = useMemo(() => {
    return searchParams.get("returnUrl") ?? state.returnUrl ?? "/";
  }, [searchParams, state.returnUrl]);

  const handlePay = async () => {
    if (!tokenStore.getAccess()) {
      window.alert("로그인이 필요합니다.");
      navigate("/auth/login", { state: { from: location } });
      return;
    }
    if (!eventId || amount <= 0) {
      setError("결제 정보를 확인할 수 없습니다.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.post(`/api/events/${eventId}/payments`, {
        amount,
        paymentMethod: method,
      });
      const ready = res.data.data;
      const redirectUrl = ready?.redirectPcUrl || ready?.redirectMobileUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        setError("결제 준비에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } catch (e) {
      if (e?.response?.status === 409) {
        setError("이미 진행 중인 결제가 있습니다. 결제 내역에서 확인해 주세요.");
      } else {
        setError("결제 준비에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
        결제하기
      </div>
      <div style={{ color: "#6b7280", marginBottom: 24 }}>
        {title}
      </div>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          background: "#fafafa",
        }}
      >
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
          결제 금액
        </div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>
          {amount.toLocaleString()}원
        </div>
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
        결제 수단
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {paymentMethods.map((m) => (
          <button
            key={m.value}
            onClick={() => setMethod(m.value)}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 10,
              border:
                method === m.value
                  ? "2px solid #1a4fd6"
                  : "1px solid #e5e7eb",
              background: method === m.value ? "#eff4ff" : "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div>
      )}

      {error && (
        <div style={{ marginBottom: 16 }}>
          <a href="/registration/paymenthistory" style={{ color: "#1a4fd6" }}>
            결제 내역으로 이동
          </a>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => navigate(returnUrl)}
          style={{
            height: 46,
            padding: "0 18px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          뒤로
        </button>
        <button
          onClick={handlePay}
          disabled={loading}
          style={{
            flex: 1,
            height: 46,
            borderRadius: 10,
            border: "none",
            background: "#1a4fd6",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "결제 준비 중..." : "결제하기"}
        </button>
      </div>
    </div>
  );
}
