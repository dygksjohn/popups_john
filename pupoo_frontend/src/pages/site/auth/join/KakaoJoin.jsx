import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import { tokenStore } from "../../../../app/http/tokenStore";
import { useAuth } from "../AuthProvider";
import { getSmsRequestErrorMessage, normalizeDigits, toKoreanPhoneE164 } from "../../../../features/auth/utils/smsAuth";

const STEP = {
  INIT: "INIT",
  FORM: "FORM",
  OTP: "OTP",
};

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
  const phoneE164 = toKoreanPhoneE164(phoneDigits);

  const canSendOtp =
    !loading &&
    step === STEP.FORM &&
    !!providerUid &&
    !!emailTrim && // ✅ 정책 A: 이메일 필수
    !!phoneE164;

  const canVerify =
    !loading &&
    step === STEP.OTP &&
    !!signupKey &&
    !!phoneE164 &&
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
        phone: phoneE164,
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
        setOtpCode(String(res.devOtp));
      }
    } catch (e) {
      console.error(e);
      return setError(getSmsRequestErrorMessage(e));
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
        phone: phoneE164,
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
      sessionStorage.removeItem("post_login_redirect");

      navigate("/", { replace: true });
    } catch (e) {
      console.error(e);
      return setError("인증번호를 확인해주세요.");
      setError(e?.response?.data?.message ?? e?.message ?? "가입 실패");
    } finally {
      setLoading(false);
    }
  };

  // ───────── styles ─────────
  const styles = `
    .kj-root {
      min-height: 100vh;
      background: #f6f6f6;
      font-family: 'JeonjuCraftGothic', 'Pretendard', -apple-system, sans-serif;
      padding: 0 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .kj-root *, .kj-root *::before, .kj-root *::after { box-sizing: border-box; font-family: inherit; }
    .kj-card {
      width: 100%;
      max-width: 520px;
      margin: 0 auto;
      background: #fff;
      border-radius: 28px;
      padding: 56px 48px 48px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.08);
    }
    .kj-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    .kj-kakao-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: #FEE500;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .kj-kakao-icon svg { display: block; width: 28px; height: 28px; }
    .kj-title {
      text-align: center;
      font-size: 28px;
      font-weight: 800;
      color: #191919;
      margin: 0 0 10px;
      letter-spacing: -0.5px;
    }
    .kj-subtitle {
      text-align: center;
      font-size: 16px;
      color: #999;
      font-weight: 400;
      margin: 0 0 36px;
    }
    .kj-step-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 36px;
    }
    .kj-step-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #e5e5e5;
      transition: all 0.2s;
    }
    .kj-step-dot.active {
      width: 36px;
      border-radius: 6px;
      background: #FEE500;
    }
    .kj-step-dot.done {
      background: #FEE500;
    }
    .kj-field {
      margin-bottom: 20px;
    }
    .kj-label {
      display: block;
      font-size: 15px;
      font-weight: 700;
      color: #333;
      margin-bottom: 10px;
    }
    .kj-input {
      width: 100%;
      height: 56px;
      padding: 0 20px;
      border-radius: 14px;
      border: 1.5px solid #e5e5e5;
      background: #fafafa;
      font-size: 16px;
      font-weight: 500;
      color: #191919;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .kj-input:focus { border-color: #FEE500; background: #fff; box-shadow: 0 0 0 3px rgba(254,229,0,0.15); }
    .kj-input:disabled { background: #f0f0f0; color: #999; }
    .kj-input::placeholder { color: #bbb; }
    .kj-hint {
      margin-top: 8px;
      font-size: 13px;
      color: #999;
      line-height: 1.5;
    }
    .kj-hint.error { color: #e54545; }
    .kj-error {
      background: #fff5f5;
      border: 1px solid #fecaca;
      border-radius: 14px;
      padding: 14px 18px;
      margin-bottom: 20px;
      font-size: 14px;
      color: #dc2626;
      font-weight: 500;
      line-height: 1.5;
    }
    .kj-btn-primary {
      width: 100%;
      height: 58px;
      border-radius: 14px;
      border: none;
      font-size: 17px;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.15s;
      margin-top: 12px;
      font-family: inherit;
      letter-spacing: -0.3px;
    }
    .kj-btn-primary.kakao {
      background: #FEE500;
      color: #191919;
    }
    .kj-btn-primary.kakao:hover:not(:disabled) {
      background: #f5dc00;
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(254,229,0,0.3);
    }
    .kj-btn-primary.confirm {
      background: #191919;
      color: #fff;
    }
    .kj-btn-primary.confirm:hover:not(:disabled) {
      background: #333;
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }
    .kj-btn-primary:disabled {
      background: #f0f0f0;
      color: #bbb;
      cursor: not-allowed;
    }
    .kj-btn-secondary {
      width: 100%;
      height: 54px;
      margin-top: 12px;
      border-radius: 14px;
      border: 1.5px solid #e5e5e5;
      background: #fff;
      font-size: 15px;
      font-weight: 600;
      color: #666;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
    }
    .kj-btn-secondary:hover:not(:disabled) { background: #fafafa; border-color: #ccc; }
    .kj-btn-secondary:disabled { color: #bbb; cursor: not-allowed; }
    .kj-otp-info {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px 20px;
      background: #fffde7;
      border-radius: 16px;
      margin-bottom: 24px;
      border: 1px solid #fff3b0;
    }
    .kj-otp-info-icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #FEE500;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .kj-otp-info-text {
      font-size: 15px;
      color: #666;
      line-height: 1.6;
    }
    .kj-otp-info-text strong { color: #191919; font-weight: 700; }
    .kj-divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 24px 0;
      color: #ccc;
      font-size: 13px;
    }
    .kj-divider::before, .kj-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #eee;
    }
    .kj-loading-init {
      text-align: center;
      padding: 80px 20px;
      color: #999;
      font-size: 17px;
    }
    @media (max-width: 480px) {
      .kj-card { padding: 44px 28px 36px; border-radius: 24px; max-width: 100%; }
      .kj-title { font-size: 24px; }
    }
  `;

  // ───────── UI ─────────
  if (step === STEP.INIT) {
    return (
      <>
        <style>{styles}</style>
        <div className="kj-root">
          <div className="kj-card">
            <div className="kj-loading-init">카카오 인증 확인 중...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="kj-root">
        <div className="kj-card">
          {/* 로고 */}
          <div className="kj-logo">
            <div className="kj-kakao-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.592 1.678 4.878 4.22 6.258-.186.694-.674 2.517-.771 2.906-.12.483.177.476.373.346.153-.102 2.438-1.653 3.42-2.322.244.022.492.033.758.033 5.523 0 10-3.477 10-7.722C22 6.477 17.523 3 12 3z" fill="#191919"/>
              </svg>
            </div>
          </div>

          <h1 className="kj-title">카카오 회원가입</h1>
          <p className="kj-subtitle">
            {step === STEP.FORM
              ? "추가 정보를 입력하면 가입이 완료됩니다"
              : "인증번호를 입력해주세요"}
          </p>

          {/* 스텝 인디케이터 */}
          <div className="kj-step-bar">
            <div className={`kj-step-dot ${step === STEP.FORM ? "active" : "done"}`} />
            <div className={`kj-step-dot ${step === STEP.OTP ? "active" : ""}`} />
          </div>

          {error && <div className="kj-error">{error}</div>}

          {/* FORM 스텝 */}
          {step === STEP.FORM && (
            <>
              <div className="kj-field">
                <label className="kj-label">이메일 {hasKakaoEmail && <span style={{ color: "#999", fontWeight: 400 }}>(카카오 연동)</span>}</label>
                <input
                  className="kj-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  disabled={loading || hasKakaoEmail}
                  type="email"
                />
                {!emailTrim && (
                  <div className="kj-hint error">
                    이메일은 필수입니다. 카카오에서 이메일을 받지 못한 경우 직접 입력해주세요.
                  </div>
                )}
              </div>

              <div className="kj-field">
                <label className="kj-label">닉네임 <span style={{ color: "#bbb", fontWeight: 400 }}>(선택)</span></label>
                <input
                  className="kj-input"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="사용할 닉네임"
                  disabled={loading}
                />
              </div>

              <div className="kj-field">
                <label className="kj-label">휴대폰 번호</label>
                <input
                  className="kj-input"
                  value={phone}
                  onChange={(e) => setPhone(normalizeDigits(e.target.value))}
                  placeholder="01012345678"
                  disabled={loading}
                  inputMode="tel"
                />
                <div className="kj-hint">본인 인증을 위한 인증번호가 발송됩니다</div>
              </div>

              <button
                className="kj-btn-primary kakao"
                onClick={sendOtp}
                disabled={!canSendOtp}
              >
                {loading ? "발송 중..." : "인증번호 받기"}
              </button>

              <button
                className="kj-btn-secondary"
                type="button"
                onClick={() => navigate("/auth/login")}
                disabled={loading}
              >
                로그인으로 돌아가기
              </button>
            </>
          )}

          {/* OTP 스텝 */}
          {step === STEP.OTP && (
            <>
              <div className="kj-otp-info">
                <div className="kj-otp-info-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                </div>
                <div className="kj-otp-info-text">
                  <strong>{phone || "입력한 번호"}</strong>로<br/>인증번호가 발송되었습니다
                </div>
              </div>

              <div className="kj-field">
                <label className="kj-label">인증번호</label>
                <input
                  className="kj-input"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="6자리 숫자 입력"
                  maxLength={6}
                  inputMode="numeric"
                  disabled={loading}
                  autoFocus
                  style={{ letterSpacing: "8px", textAlign: "center", fontSize: "22px", fontWeight: 700 }}
                />
              </div>

              <button
                className="kj-btn-primary confirm"
                onClick={verifyOtpAndComplete}
                disabled={!canVerify}
              >
                {loading ? "처리 중..." : "가입 완료"}
              </button>

              <button
                className="kj-btn-secondary"
                type="button"
                onClick={() => {
                  setStep(STEP.FORM);
                  setSignupKey("");
                  setOtpCode("");
                  setError("");
                }}
                disabled={loading}
              >
                다시 입력하기
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
