// file: src/pages/site/auth/join/KakaoOtp.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import { tokenStore } from "../../../../app/http/tokenStore";
import { useAuth } from "../AuthProvider"; // 

export default function KakaoOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // 기능: 라우터 state가 사라져도 카카오 가입 OTP 단계가 이어지도록 sessionStorage 백업을 읽는다.
  const ctx = useMemo(() => {
    const s = location.state || {};
    const fallback = JSON.parse(sessionStorage.getItem("kakao_signup_ctx") || "{}");

    return {
      signupKey: s.signupKey || fallback.signupKey || "",
      phone: s.phone || fallback.phone || "",
      devOtp: s.devOtp || fallback.devOtp || "",
    };
  }, [location.state]);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 기능: signupKey 없이 진입한 경우에는 가입 세션이 없는 비정상 상태로 본다.
  useEffect(() => {
    if (!ctx.signupKey) {
      setError("signupKey가 없습니다. 카카오 가입을 다시 시작해주세요.");
    }
  }, [ctx.signupKey]);

  const normalizeOtp = (v) => v.replace(/[^0-9]/g, "");

  const handleVerifyAndComplete = async () => {
    setError("");

    if (!ctx.signupKey) {
      setError("signupKey가 없습니다. 다시 시도해주세요.");
      return;
    }

    const otpNum = normalizeOtp(otp);
    if (otpNum.length < 4) {
      setError("OTP를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);

      // 기능: OTP 검증과 가입 완료를 순서대로 묶어 카카오 가입을 마무리한다.
      // 설명: signupKey와 phone이 모두 유효해야 하며, verify 성공 전에는 access token을 저장하지 않는다.
      const phoneToUse = (ctx.phone || "").replace(/[^0-9]/g, "");

      if (phoneToUse.length < 10) {
      setError("휴대폰 정보가 없습니다. OTP를 다시 발송해주세요.");
      return;
      }

      await authApi.signupVerifyOtp({
      signupKey: ctx.signupKey,
      phone: phoneToUse,
      otpCode: otpNum,
      });

      const completeRes = await authApi.signupComplete({
        signupKey: ctx.signupKey,
      });

      const accessToken = completeRes?.accessToken;
      if (!accessToken) {
        setError("accessToken이 없습니다. 응답 구조 확인 필요");
        return;
      }

      tokenStore.setAccess(accessToken);
      login();

      // 기능: 가입 완료 후 카카오 가입용 임시 세션 데이터를 정리한다.
      sessionStorage.removeItem("kakao_signup_ctx");

      navigate("/", { replace: true });
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message ?? e?.message ?? "OTP 인증 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 440, margin: "60px auto", padding: 20 }}>
      <h2>휴대폰 인증(카카오)</h2>

      <div style={{ marginTop: 12, fontSize: 14, color: "#555" }}>
        <div>휴대폰: {ctx.phone || "(없음)"}</div>
        {ctx.devOtp ? (
          <div style={{ marginTop: 6 }}>
            devOtp(개발용): <b>{ctx.devOtp}</b>
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 18 }}>
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="OTP 입력"
          style={{
            width: "100%",
            height: 44,
            padding: "0 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
          }}
        />
      </div>

      {error ? <p style={{ color: "red", marginTop: 10 }}>{error}</p> : null}

      <button
        onClick={handleVerifyAndComplete}
        disabled={loading || !ctx.signupKey}
        style={{
          width: "100%",
          height: 48,
          marginTop: 14,
          borderRadius: 10,
          border: "none",
          background: "#4A90E2",
          color: "white",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {loading ? "처리중..." : "OTP 검증 후 가입 완료"}
      </button>

      <button
        onClick={() => navigate("/auth/join/joinselect", { replace: true })}
        style={{
          width: "100%",
          height: 44,
          marginTop: 10,
          borderRadius: 10,
          border: "1px solid #ddd",
          background: "white",
          cursor: "pointer",
        }}
      >
        처음으로
      </button>
    </div>
  );
}
