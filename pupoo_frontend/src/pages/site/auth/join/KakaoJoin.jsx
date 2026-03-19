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

  // 기능: callback 직후 초기 진입 검증은 StrictMode 중복 실행 없이 한 번만 처리한다.
  const didInitRef = useRef(false);

  // 기능: callback 단계에서 저장한 카카오 식별 정보를 가입 폼 초기값으로 복원한다.
  const kakaoSession = useMemo(() => {
    return {
      providerUid: sessionStorage.getItem("kakao_provider_uid") ?? "",
      email: sessionStorage.getItem("kakao_email") ?? "",
      nickname: sessionStorage.getItem("kakao_nickname") ?? "",
    };
  }, []);

  // 기능: 신규회원이 추가 입력해야 하는 필드만 별도 상태로 관리한다.
  const [providerUid] = useState(kakaoSession.providerUid);
  const [email, setEmail] = useState(kakaoSession.email);
  const [nickname, setNickname] = useState(kakaoSession.nickname);
  const [phone, setPhone] = useState("");

  // 기능: 카카오 가입 화면은 초기 검증 -> 정보 입력 -> OTP 확인 3단계로 나뉜다.
  const [step, setStep] = useState(STEP.INIT);

  const [signupKey, setSignupKey] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [devOtpHint, setDevOtpHint] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 기능: 소셜 가입에서도 password 필수 API 조건을 맞추기 위해 임시 비밀번호를 내부에서만 생성한다.
  const [tempPassword] = useState(() => {
    const key = "kakao_temp_password";
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;

    const rand = `${crypto.randomUUID()}-${Math.random().toString(36).slice(2)}`;
    const pwd = rand.replace(/-/g, "").slice(0, 16) + "aA1!";
    sessionStorage.setItem(key, pwd);
    return pwd;
  });

  // 기능: 카카오에서 이메일이 내려온 경우 동일 값으로 가입을 이어가도록 입력을 잠근다.
  const hasKakaoEmail = !!(kakaoSession.email || "").trim();

  // 기능: 단계별 버튼 활성화 조건을 한곳에서 계산해 잘못된 요청을 막는다.
  const emailTrim = (email || "").trim();
  const nickTrim = (nickname || "").trim() || "kakao_user";
  const phoneDigits = normalizeDigits(phone);

  const canSendOtp =
    !loading &&
    step === STEP.FORM &&
    !!providerUid &&
    !!emailTrim &&
    phoneDigits.length >= 10;

  const canVerify =
    !loading &&
    step === STEP.OTP &&
    !!signupKey &&
    phoneDigits.length >= 10 &&
    (otpCode || "").trim().length >= 4;

  useEffect(() => {
    // 기능: providerUid가 없는 비정상 진입은 로그인 화면으로 되돌린다.
    if (didInitRef.current) return;
    didInitRef.current = true;

    if (!providerUid) {
      navigate("/auth/login", { replace: true });
      return;
    }

    setStep(STEP.FORM);
  }, [navigate, providerUid]);

  const sendOtp = async () => {
    if (!canSendOtp) return;

    setError("");
    setLoading(true);

    try {
      // 기능: 카카오 신규회원 가입은 기본 정보 저장과 OTP 발송을 signupStart 한 번으로 시작한다.
      // 설명: 이 단계 성공이 곧 가입 완료는 아니며, 응답으로 받은 signupKey가 다음 OTP 검증 단계의 기준이 된다.
      // 흐름: 이메일과 전화 입력 -> signupStart 호출 -> signupKey 저장 -> OTP 단계 전환.
      const res = await authApi.signupStart({
        signupType: "SOCIAL",
        socialProvider: "KAKAO",
        socialProviderUid: providerUid,
        email: emailTrim,
        password: tempPassword,
        nickname: nickTrim,
        phone: phoneDigits,
      });

      const key = res?.signupKey;

      if (!key) {
        console.error("signupStart response =", res);
        setError("signupKey가 없습니다. 응답 구조 확인 필요");
        return;
      }

      setSignupKey(key);
      setStep(STEP.OTP);

      if (res?.devOtp) {
        // 기능: 개발 환경 보조 OTP는 확인용으로만 저장한다.
        setDevOtpHint(String(res.devOtp));
      }
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message ?? e?.message ?? "OTP 발송 실패");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndComplete = async () => {
    if (!canVerify) return;

    setError("");
    setLoading(true);

    try {
      // 기능: 카카오 가입은 OTP 검증 성공 직후 signupComplete까지 이어서 호출한다.
      // 설명: 이 화면에서는 별도 완료 플래그를 두지 않고, verify 성공 여부를 바로 가입 완료 조건으로 사용한다.
      // 흐름: OTP 입력 -> verify-otp 성공 -> signupComplete 호출 -> access token 저장 후 로그인.
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

      // 기능: 가입 완료 후 카카오 가입 중간 상태를 정리해 다음 로그인 흐름과 섞이지 않게 한다.
      sessionStorage.removeItem("kakao_temp_password");
      sessionStorage.removeItem("kakao_provider_uid");
      sessionStorage.removeItem("kakao_email");
      sessionStorage.removeItem("kakao_nickname");
      sessionStorage.removeItem("post_login_redirect");

      navigate("/", { replace: true });
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message ?? e?.message ?? "가입 실패");
    } finally {
      setLoading(false);
    }
  };

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

      {/* 기능: FORM 단계는 추가 정보 입력과 OTP 발송 시작 버튼을 보여준다. */}
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

      {/* 기능: OTP 단계는 signupKey를 유지한 채 인증번호 확인과 가입 완료를 한 번에 처리한다. */}
      {step === STEP.OTP && (
        <>
          <div style={{ marginTop: 12 }}>
            {devOtpHint ? (
              <div style={{ marginBottom: 8, fontSize: 12, color: "#666" }}>
                개발 환경 확인용 OTP: <b>{devOtpHint}</b>
              </div>
            ) : null}
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
