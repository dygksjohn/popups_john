import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import { tokenStore } from "../../../../app/http/tokenStore";
import { useAuth } from "../AuthProvider";

export default function KakaoJoin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // ✅ StrictMode 2회 실행 방지(초기 가드 1회만)
  const didInitRef = useRef(false);

  // ✅ state 우선, 없으면 sessionStorage fallback
  const kakaoSession = useMemo(() => {
    const st = location.state || {};
    return {
      providerUid:
        st.socialProviderUid ??
        sessionStorage.getItem("kakao_provider_uid") ??
        "",
      email: st.email ?? sessionStorage.getItem("kakao_email") ?? "",
      nickname: st.nickname ?? sessionStorage.getItem("kakao_nickname") ?? "",
    };
  }, [location.state]);

  // ✅ 입력값(신규회원)
  const [providerUid] = useState(kakaoSession.providerUid);
  const [email, setEmail] = useState(kakaoSession.email);
  const [nickname, setNickname] = useState(kakaoSession.nickname);
  const [phone, setPhone] = useState("");

  // ✅ 플로우 상태: FORM -> OTP
  const [step, setStep] = useState("FORM");
  const [signupKey, setSignupKey] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizeDigits = (s) => (s || "").replace(/[^0-9]/g, "");

  // ✅ 진입 가드: providerUid 없으면 잘못된 접근
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    if (!providerUid) {
      navigate("/auth/join/joinselect", { replace: true });
      return;
    }

    setStep("FORM");
  }, [navigate, providerUid]);

  // ✅ 버튼 활성화 조건
  const emailTrim = (email || "").trim();
  const nickTrim = (nickname || "").trim() || "kakao_user";
  const phoneDigits = normalizeDigits(phone);

  const canSendOtp =
    !loading &&
    step === "FORM" &&
    !!providerUid &&
    !!emailTrim &&
    phoneDigits.length >= 10;

  const canVerify =
    !loading &&
    step === "OTP" &&
    !!signupKey &&
    phoneDigits.length >= 10 &&
    (otpCode || "").trim().length >= 4;

  // 1) 신규회원: OTP 발송 (signup/start)
  const sendOtp = async () => {
    if (!canSendOtp) return;

    setError("");
    setLoading(true);

    try {
      const res = await authApi.signupStart({
        signupType: "SOCIAL",
        socialProvider: "KAKAO",
        socialProviderUid: providerUid,
        email: emailTrim,
        nickname: nickTrim,
        phone: phoneDigits, // 백엔드가 하이픈 요구하면 변환 필요
      });

      const key = res?.signupKey;
      if (!key) {
        console.error("signupStart response =", res);
        setError("signupKey가 없습니다. 응답 구조 확인 필요");
        return;
      }

      setSignupKey(key);
      setStep("OTP");

      // devOtp 내려주는 경우 자동 채움(옵션)
      if (res?.devOtp) setOtpCode(String(res.devOtp));
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message ?? e?.message ?? "OTP 발송 실패");
    } finally {
      setLoading(false);
    }
  };

  // 2) 신규회원: OTP 검증 + 가입 완료(자동 로그인)
  const verifyOtpAndComplete = async () => {
    if (!canVerify) return;

    setError("");
    setLoading(true);

    try {
      await authApi.signupVerifyOtp({
        signupKey,
        phone: phoneDigits,
        otpCode: (otpCode || "").trim(),
      });

      const res = await authApi.signupComplete({ signupKey });

      const accessToken = res?.accessToken;
      if (!accessToken) {
        console.error("signupComplete response =", res);
        setError("회원가입 완료 응답에 accessToken이 없습니다.");
        return;
      }

      // ✅ 가입 완료 후 카카오 세션 정리
      sessionStorage.removeItem("kakao_provider_uid");
      sessionStorage.removeItem("kakao_email");
      sessionStorage.removeItem("kakao_nickname");

      tokenStore.setAccess(accessToken);
      login();
      navigate("/", { replace: true });
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message ?? e?.message ?? "가입 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "60px auto", padding: 20 }}>
      <h2 style={{ textAlign: "center" }}>카카오 회원가입</h2>

      {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

      <div style={{ marginTop: 12, fontSize: 14, color: "#555" }}>
        <div>카카오 UID: {providerUid || "(없음)"}</div>
      </div>

      {/* FORM */}
      {step === "FORM" && (
        <div style={{ marginTop: 16 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일을 입력하세요"
            disabled={loading}
            style={{
              width: "100%",
              height: 44,
              padding: "0 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              marginBottom: 10,
            }}
          />

          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임(선택)"
            disabled={loading}
            style={{
              width: "100%",
              height: 44,
              padding: "0 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              marginBottom: 10,
            }}
          />

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="휴대폰 번호(OTP 발송)"
            disabled={loading}
            style={{
              width: "100%",
              height: 44,
              padding: "0 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
            }}
          />

          {!providerUid && (
            <div style={{ marginTop: 10, fontSize: 12, color: "#a00" }}>
              카카오 UID가 없습니다. “카카오로 계속하기”부터 다시 진행해주세요.
            </div>
          )}

          {!emailTrim && (
            <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
              카카오에서 이메일을 못 받은 경우, 이메일을 직접 입력해야 합니다.
            </div>
          )}

          <button
            type="button"
            onClick={sendOtp}
            disabled={!canSendOtp}
            style={{
              width: "100%",
              height: 48,
              marginTop: 14,
              borderRadius: 10,
              border: "none",
              background: canSendOtp ? "#FEE500" : "#f3f3f3",
              color: canSendOtp ? "#191919" : "#999",
              fontWeight: 700,
              cursor: canSendOtp ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "처리중..." : "OTP 보내기"}
          </button>
        </div>
      )}

      {/* OTP */}
      {step === "OTP" && (
        <>
          <div style={{ marginTop: 12 }}>
            <input
              value={otpCode}
              onChange={(e) =>
                setOtpCode(e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="인증번호 6자리"
              maxLength={6}
              inputMode="numeric"
              disabled={loading}
              style={{
                width: "100%",
                height: 44,
                padding: "0 12px",
                borderRadius: 10,
                border: "1px solid #ddd",
              }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
              OTP가 발송되었습니다. 인증번호를 입력하면 즉시 가입이 완료됩니다.
            </div>
          </div>

          <button
            type="button"
            onClick={verifyOtpAndComplete}
            disabled={!canVerify}
            style={{
              width: "100%",
              height: 48,
              marginTop: 14,
              borderRadius: 10,
              border: "none",
              background: canVerify ? "#1a9ac9" : "#f3f3f3",
              color: canVerify ? "#fff" : "#999",
              fontWeight: 700,
              cursor: canVerify ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "처리중..." : "OTP 인증 & 가입완료"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("FORM");
              setSignupKey("");
              setOtpCode("");
              setError("");
            }}
            disabled={loading}
            style={{
              width: "100%",
              height: 44,
              marginTop: 10,
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fff",
              color: "#333",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            다시 입력하기
          </button>
        </>
      )}
    </div>
  );
}
