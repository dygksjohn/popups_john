import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import { tokenStore } from "../../../../app/http/tokenStore";
import { useAuth } from "../AuthProvider";

export default function KakaoJoin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // ✅ StrictMode 2회 실행 방지
  const didInitRef = useRef(false);

  // 세션에 저장된 카카오 정보(콜백/이전 플로우에서 저장해 둔 값)
  const kakaoSession = useMemo(() => {
    return {
      providerUid: sessionStorage.getItem("kakao_provider_uid") ?? "",
      email: sessionStorage.getItem("kakao_email") ?? "",
      nickname: sessionStorage.getItem("kakao_nickname") ?? "",
      authCode: sessionStorage.getItem("kakao_auth_code") ?? "", // callback에서 저장
    };
  }, []);

  // 입력값(신규회원)
  const [providerUid, setProviderUid] = useState(kakaoSession.providerUid);
  const [email, setEmail] = useState(kakaoSession.email);
  const [nickname, setNickname] = useState(kakaoSession.nickname);
  const [phone, setPhone] = useState("");

  // ✅ 기존회원 처리용 (자동로그인 금지, 버튼으로 로그인)
  const [existingAccessToken, setExistingAccessToken] = useState("");

  // 플로우 상태
  // INIT: code 체크/서버판별 중
  // EXISTING: 기존회원 안내 + 로그인 버튼
  // FORM: 신규회원 정보 입력(OTP 발송)
  // OTP: OTP 입력 후 가입완료
  const [step, setStep] = useState("INIT");

  const [signupKey, setSignupKey] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizeDigits = (s) => (s || "").replace(/[^0-9]/g, "");

  /**
   * ✅ 페이지 진입 시: authCode로 기존/신규 판별
   * - authCode가 없으면 joinselect로 되돌림(잘못된 진입/새로고침)
   * - 기존회원이면: EXISTING 단계로 전환(자동 로그인/홈 이동 금지)
   * - 신규회원이면: FORM 단계로 전환 + providerUid/email/nickname 세팅
   */
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    // ✅ 콜백에서 신규로 판단된 경우에만 여기로 오므로
    // providerUid 없으면 잘못된 진입
    if (!providerUid) {
      navigate("/auth/join/joinselect", { replace: true });
      return;
    }

    setStep("FORM");
  }, [navigate, providerUid]);

  // ✅ 버튼 활성화 조건(신규회원)
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

  // ✅ 기존회원 로그인 버튼
  const doLoginExisting = () => {
    if (!existingAccessToken) return;
    tokenStore.setAccess(existingAccessToken);
    login();
    navigate("/", { replace: true });
  };

  // 1) 신규회원: OTP 발송 (signup/start)
  const sendOtp = async () => {
    if (!canSendOtp) return;

    setError("");

    setLoading(true);

    const emailToUse =
      kakao.email && kakao.email.trim()
        ? kakao.email.trim()
        : `${kakao.providerUid}@kakao.local`;

    try {
      const res = await authApi.signupStart({
        signupType: "SOCIAL",
        socialProvider: "KAKAO",

        socialProviderUid: providerUid,
        email: emailTrim,
        nickname: nickTrim,
        phone: phoneDigits, // 백엔드 포맷이 하이픈 요구면 여기 변환 필요
      });

      const key = res?.signupKey;
      if (!key) {
        console.error("signupStart response =", res);

        setError("signupKey가 없습니다. 응답 구조 확인 필요");
        return;
      }

      setSignupKey(key);
      setStep("OTP");

      // 개발환경 OTP 노출 시 자동 채우기(옵션)
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

  // ───────── UI ─────────
  if (step === "INIT") {
    return <div style={{ padding: 24 }}>카카오 인증 확인 중...</div>;
  }

  return (
    <div style={{ maxWidth: 520, margin: "60px auto", padding: 20 }}>
      <h2 style={{ textAlign: "center" }}>카카오 회원가입</h2>

      {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

      {/* ✅ 기존회원: 여기서 자동로그인 하지 말고 버튼으로 */}
      {step === "EXISTING" && (
        <>
          <div style={{ marginTop: 12, fontSize: 14, color: "#555" }}>
            <div>이미 가입된 카카오 계정입니다.</div>
            <div style={{ marginTop: 6, fontSize: 12, color: "#777" }}>
              로그인 버튼을 누르면 로그인됩니다.
            </div>
          </div>

          <button
            onClick={doLoginExisting}
            disabled={loading || !existingAccessToken}
            style={{
              width: "100%",
              height: 48,
              marginTop: 14,
              background: "#FEE500",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              cursor:
                loading || !existingAccessToken ? "not-allowed" : "pointer",
            }}
          >
            로그인
          </button>

          <button
            onClick={() => navigate("/auth/login")}
            disabled={loading}
            style={{
              width: "100%",
              height: 44,
              marginTop: 10,
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: 10,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            일반 로그인으로 이동
          </button>
        </>
      )}

      {/* ✅ 신규회원: FORM/OTP */}
      {step !== "EXISTING" && (
        <>
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
                  카카오 UID가 없습니다. “카카오로 계속하기”부터 다시
                  진행해주세요.
                </div>
              )}

              {!emailTrim && (
                <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
                  카카오에서 이메일을 못 받은 경우, 이메일을 직접 입력해야
                  합니다.
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
                  OTP가 발송되었습니다. 인증번호를 입력하면 즉시 가입이
                  완료됩니다.
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
        </>
      )}
    </div>
  );
}
