import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import { tokenStore } from "../../../../app/http/tokenStore";
import { useAuth } from "../AuthProvider";

const STEP = {
  INIT: "INIT",
  FORM: "FORM",
  OTP: "OTP",
};

const normalizeDigits = (s) => (s || "").replace(/[^0-9]/g, "");

export default function KakaoJoin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // ✅ StrictMode 2회 실행 방지
  const didInitRef = useRef(false);

  // ✅ 콜백에서 세션에 저장해 둔 카카오 정보
  const kakaoSession = useMemo(() => {
    return {
      providerUid: sessionStorage.getItem("kakao_provider_uid") ?? "",
      email: sessionStorage.getItem("kakao_email") ?? "",
      nickname: sessionStorage.getItem("kakao_nickname") ?? "",
    };
  }, []);

  // 입력값(신규회원)
  const [providerUid] = useState(kakaoSession.providerUid);
  const [email, setEmail] = useState(kakaoSession.email);
  const [nickname, setNickname] = useState(kakaoSession.nickname);
  const [phone, setPhone] = useState("");

  // 플로우 상태
  const [step, setStep] = useState(STEP.INIT);

  const [signupKey, setSignupKey] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ 소셜 가입용 임시 비밀번호(사용자 입력 X)
  // - 백엔드가 SOCIAL도 password 필수라서 자동 생성해서 보낸다.
  const [tempPassword] = useState(() => {
    const key = "kakao_temp_password";
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;

    // 간단/충분히 랜덤한 임시 비밀번호 생성(최소 12자)
    const rand = `${crypto.randomUUID()}-${Math.random().toString(36).slice(2)}`;
    const pwd = rand.replace(/-/g, "").slice(0, 16) + "aA1!";
    sessionStorage.setItem(key, pwd);
    return pwd;
  });

  // ✅ 카카오 이메일이 있으면 수정 불가(정책 A)
  const hasKakaoEmail = !!(kakaoSession.email || "").trim();

  // ✅ 버튼 활성화 조건(정책 A: 이메일 필수)
  const emailTrim = (email || "").trim();
  const nickTrim = (nickname || "").trim() || "kakao_user";
  const phoneDigits = normalizeDigits(phone);

  const canSendOtp =
    !loading &&
    step === STEP.FORM &&
    !!providerUid &&
    !!emailTrim && // ✅ 정책 A: 이메일 필수
    phoneDigits.length >= 10;

  const canVerify =
    !loading &&
    step === STEP.OTP &&
    !!signupKey &&
    phoneDigits.length >= 10 &&
    (otpCode || "").trim().length >= 4;

  /**
   * ✅ 페이지 진입 시 신규회원 전용 진입 검증
   * - providerUid 없으면 잘못된 진입(새로고침/직접 접근) -> 로그인으로 복귀
   */
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    if (!providerUid) {
      navigate("/auth/login", { replace: true });
      return;
    }

    setStep(STEP.FORM);
  }, [navigate, providerUid]);

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
        password: tempPassword,
        nickname: nickTrim,
        phone: phoneDigits,
      });

      const key = res?.data?.signupKey;

      if (!key) {
        console.error("signupStart response =", res);
        setError("signupKey가 없습니다. 응답 구조 확인 필요");
        return;
      }

      setSignupKey(key);
      setStep(STEP.OTP);

      if (res?.data?.devOtp) {
        setOtpCode(String(res.data.devOtp));
      }
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

      tokenStore.setAccess(accessToken);
      login();

      sessionStorage.removeItem("kakao_temp_password");
      sessionStorage.removeItem("kakao_provider_uid");
      sessionStorage.removeItem("kakao_email");
      sessionStorage.removeItem("kakao_nickname");

      navigate("/", { replace: true });
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message ?? e?.message ?? "가입 실패");
    } finally {
      setLoading(false);
    }
  };

  // ───────── UI ─────────
  if (step === STEP.INIT) {
    return <div style={{ padding: 24 }}>카카오 인증 확인 중...</div>;
  }

  return (
    <div style={{ maxWidth: 520, margin: "60px auto", padding: 20 }}>
      <h2 style={{ textAlign: "center" }}>카카오 회원가입</h2>

      {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

      <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
        (신규 회원 전용) 카카오 UID: {providerUid || "(없음)"}
      </div>

      {/* FORM */}
      {step === STEP.FORM && (
        <div style={{ marginTop: 16 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일을 입력하세요(필수)"
            disabled={loading || hasKakaoEmail}
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

          {!emailTrim && (
            <div style={{ marginTop: 6, fontSize: 12, color: "#a00" }}>
              이메일은 필수입니다. 카카오에서 이메일을 못 받은 경우 직접
              입력해주세요.
            </div>
          )}

          <button
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
            {loading ? "처리중..." : "가입 시작(OTP 발송)"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/auth/login")}
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
            로그인으로 돌아가기
          </button>
        </div>
      )}

      {/* OTP */}
      {step === STEP.OTP && (
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
              OTP가 발송되었습니다. 인증번호를 입력하면 가입이 완료됩니다.
            </div>
          </div>

          <button
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
              setStep(STEP.FORM);
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
