import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { tokenStore } from "../../../app/http/tokenStore";
import { useAuth } from "../auth/AuthProvider";

export default function PaymentApprove() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthed, isBootstrapped } = useAuth();

  const paymentId = searchParams.get("paymentId");
  const pgToken = searchParams.get("pg_token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const didRunRef = useRef(false);

  const approveOnce = useCallback(async () => {
    if (!isBootstrapped) return;

    if (!paymentId || !pgToken) {
      setError("결제 승인 정보가 없습니다.");
      setLoading(false);
      return;
    }

    if (!isAuthed || !tokenStore.getAccess()) {
      navigate("/auth/login", {
        state: {
          from: `/payment/approve?paymentId=${paymentId}&pg_token=${pgToken}`,
        },
        replace: true,
      });
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axiosInstance.post(`/api/payments/${paymentId}/approve`, null, {
        params: { pg_token: pgToken },
      });
      navigate("/registration/paymenthistory", { replace: true });
    } catch (e) {
      const msg =
        e?.response?.data?.error?.message ||
        e?.response?.data?.message ||
        e?.message ||
        "결제 승인에 실패했습니다.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isAuthed, isBootstrapped, navigate, paymentId, pgToken]);

  useEffect(() => {
    if (!isBootstrapped) return;
    if (didRunRef.current) return;
    didRunRef.current = true;
    approveOnce();
  }, [approveOnce, isBootstrapped]);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
        결제 승인 처리
      </div>

      {!isBootstrapped && (
        <div style={{ color: "#374151" }}>세션 확인 중입니다...</div>
      )}

      {isBootstrapped && loading && (
        <div style={{ color: "#374151" }}>결제 승인 처리 중입니다...</div>
      )}

      {isBootstrapped && !loading && error && (
        <>
          <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={approveOnce}
              style={{
                height: 46,
                padding: "0 18px",
                borderRadius: 10,
                border: "none",
                background: "#1a4fd6",
                color: "#fff",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              다시 시도
            </button>
            <button
              onClick={() => navigate("/registration/paymenthistory")}
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
              결제 내역으로 이동
            </button>
          </div>
        </>
      )}

      {isBootstrapped && !loading && !error && (!paymentId || !pgToken) && (
        <>
          <div style={{ color: "#b91c1c", marginBottom: 12 }}>
            결제 승인 정보가 없습니다.
          </div>
          <button
            onClick={() => navigate("/registration/paymenthistory")}
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
            결제 내역으로 이동
          </button>
        </>
      )}
    </div>
  );
}
