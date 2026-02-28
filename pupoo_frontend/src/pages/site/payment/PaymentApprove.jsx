import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { tokenStore } from "../../../app/http/tokenStore";

export default function PaymentApprove() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const paymentId = searchParams.get("paymentId");
  const pgToken = searchParams.get("pg_token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ 중복 실행 방지 (React StrictMode / 리렌더 방어)
  const didRunRef = useRef(false);

  const approveOnce = useCallback(async () => {
    if (!paymentId || !pgToken) {
      setError("결제 승인 정보가 없습니다.");
      setLoading(false);
      return;
    }

    // 로그인 세션 없으면 로그인으로 보내고, 돌아오면 다시 실행
    if (!tokenStore.getAccess()) {
      navigate("/auth/login", {
        state: { from: `/payment/approve?paymentId=${paymentId}&pg_token=${pgToken}` },
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

      // ✅ 성공: 결제 내역으로 이동
      navigate("/registration/paymenthistory", { replace: true });
    } catch (e) {
      // 서버 표준 에러 포맷 최대한 흡수
      const msg =
        e?.response?.data?.error?.message ||
        e?.response?.data?.message ||
        e?.message ||
        "결제 승인에 실패했습니다.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [navigate, paymentId, pgToken]);

  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;
    approveOnce();
  }, [approveOnce]);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
        결제 승인 처리
      </div>

      {/* 진행 중 */}
      {loading && (
        <div style={{ color: "#374151" }}>
          결제 승인 처리 중...
        </div>
      )}

      {/* 실패 */}
      {!loading && error && (
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

      {/* paymentId/pgToken 없음 */}
      {!loading && !error && (!paymentId || !pgToken) && (
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