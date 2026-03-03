import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import { userApi } from "../../../../features/user/api/userApi";
import { tokenStore } from "../../../../app/http/tokenStore";
import { useAuth } from "../AuthProvider";
import { resolveErrorMessage, toFieldMessageMap } from "../../../../features/shared/forms/formError";

const STEP = {
  INIT: "INIT",
  FORM: "FORM",
  OTP: "OTP",
};

const normalizeDigits = (s) => (s || "").replace(/[^0-9]/g, "");

export default function KakaoJoin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const didInitRef = useRef(false);

  const kakaoSession = useMemo(
    () => ({
      providerUid: sessionStorage.getItem("kakao_provider_uid") ?? "",
      email: sessionStorage.getItem("kakao_email") ?? "",
      nickname: sessionStorage.getItem("kakao_nickname") ?? "",
    }),
    [],
  );

  const [providerUid] = useState(kakaoSession.providerUid);
  const [email, setEmail] = useState(kakaoSession.email);
  const [nickname, setNickname] = useState(kakaoSession.nickname);
  const [phone, setPhone] = useState("");
  const [petProfile, setPetProfile] = useState({
    animalType: "DOG",
    petWeight: "M",
  });

  const [step, setStep] = useState(STEP.INIT);
  const [signupKey, setSignupKey] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [nicknameError, setNicknameError] = useState("");

  const [tempPassword] = useState(() => {
    const key = "kakao_temp_password";
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;

    const rand = `${crypto.randomUUID()}-${Math.random().toString(36).slice(2)}`;
    const pwd = rand.replace(/-/g, "").slice(0, 16) + "aA1!";
    sessionStorage.setItem(key, pwd);
    return pwd;
  });

  const hasKakaoEmail = !!(kakaoSession.email || "").trim();
  const emailTrim = (email || "").trim();
  const nickTrim = (nickname || "").trim() || "kakao_user";
  const phoneDigits = normalizeDigits(phone);

  const canSendOtp =
    !loading &&
    step === STEP.FORM &&
    !!providerUid &&
    phoneDigits.length >= 10;

  const canVerify =
    !loading &&
    step === STEP.OTP &&
    !!signupKey &&
    phoneDigits.length >= 10 &&
    (otpCode || "").trim().length >= 4;

  useEffect(() => {
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
    setFieldErrors({});
    setNicknameError("");
    setLoading(true);

    try {
      const available = await userApi.checkNickname(nickTrim);
      if (!available) {
        setNicknameError("이미 사용 중인 닉네임입니다.");
        return;
      }

      const res = await authApi.signupStart({
        signupType: "SOCIAL",
        socialProvider: "KAKAO",
        socialProviderUid: providerUid,
        email: emailTrim || undefined,
        password: tempPassword,
        nickname: nickTrim,
        phone: phoneDigits,
      });

      const key = res?.signupKey;
      if (!key) {
        setError("회원가입 세션 생성에 실패했습니다. 다시 시도해 주세요.");
        return;
      }

      setSignupKey(key);
      setStep(STEP.OTP);

      if (res?.devOtp) {
        setOtpCode(String(res.devOtp));
      }
    } catch (e) {
      setFieldErrors(toFieldMessageMap(e));
      setError(resolveErrorMessage(e, "OTP 발송에 실패했습니다."));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndComplete = async () => {
    if (!canVerify) return;

    setError("");
    setFieldErrors({});
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
      setFieldErrors(toFieldMessageMap(e));
      setError(resolveErrorMessage(e, "가입 처리에 실패했습니다."));
    } finally {
      setLoading(false);
    }
  };

  if (step === STEP.INIT) {
    return <div style={{ padding: 24 }}>카카오 인증 정보를 확인 중입니다.</div>;
  }

  return (
    <div style={{ maxWidth: 520, margin: "60px auto", padding: 20 }}>
      <h2 style={{ textAlign: "center" }}>카카오 회원가입</h2>

      {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

      <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
        (소셜 가입 전용) 카카오 UID: {providerUid || "(없음)"}
      </div>

      {step === STEP.FORM && (
        <div style={{ marginTop: 16 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 (선택)"
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
          {fieldErrors.email ? (
            <div style={{ marginTop: -6, marginBottom: 8, color: "#a00", fontSize: 12 }}>
              {fieldErrors.email}
            </div>
          ) : null}

          <input
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setNicknameError("");
            }}
            onBlur={async () => {
              const value = (nickname || "").trim() || "kakao_user";
              try {
                const available = await userApi.checkNickname(value);
                setNicknameError(available ? "" : "이미 사용 중인 닉네임입니다.");
              } catch (e) {
                setNicknameError(resolveErrorMessage(e, "닉네임 중복 확인에 실패했습니다."));
              }
            }}
            placeholder="닉네임 (선택)"
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
          {fieldErrors.nickname ? (
            <div style={{ marginTop: -6, marginBottom: 8, color: "#a00", fontSize: 12 }}>
              {fieldErrors.nickname}
            </div>
          ) : null}
          {nicknameError ? (
            <div style={{ marginTop: -6, marginBottom: 8, color: "#a00", fontSize: 12 }}>
              {nicknameError}
            </div>
          ) : null}

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="휴대폰 번호 (OTP 발송)"
            disabled={loading}
            style={{
              width: "100%",
              height: 44,
              padding: "0 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
            }}
          />
          {fieldErrors.phone ? (
            <div style={{ marginTop: 6, color: "#a00", fontSize: 12 }}>{fieldErrors.phone}</div>
          ) : null}

          <div style={{ marginTop: 6, marginBottom: 10, fontSize: 12, color: "#666" }}>
            이메일은 선택 입력입니다. 휴대폰 OTP 인증만으로 가입할 수 있습니다.
          </div>

          <div
            style={{
              border: "1px solid #eee",
              borderRadius: 10,
              padding: 12,
              marginBottom: 10,
              background: "#fafafa",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              반려동물 기본 정보(선택)
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <select
                value={petProfile.animalType}
                onChange={(e) =>
                  setPetProfile((prev) => ({ ...prev, animalType: e.target.value }))
                }
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  padding: "0 10px",
                  background: "#fff",
                }}
              >
                <option value="DOG">강아지 (DOG)</option>
                <option value="CAT">고양이 (CAT)</option>
                <option value="OTHER">기타 (OTHER)</option>
              </select>
              <select
                value={petProfile.petWeight}
                onChange={(e) =>
                  setPetProfile((prev) => ({ ...prev, petWeight: e.target.value }))
                }
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  padding: "0 10px",
                  background: "#fff",
                }}
              >
                <option value="XS">XS (0~5kg)</option>
                <option value="S">S (5~10kg)</option>
                <option value="M">M (10~20kg)</option>
                <option value="L">L (20~35kg)</option>
                <option value="XL">XL (35kg+)</option>
              </select>
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: "#666" }}>
              가입 완료 후 마이페이지에서 실제 반려동물 정보를 등록/수정할 수 있습니다.
            </div>
          </div>

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
            {loading ? "처리 중..." : "가입 시작 (OTP 발송)"}
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

      {step === STEP.OTP && (
        <>
          <div style={{ marginTop: 12 }}>
            <input
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
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
            {fieldErrors.otpCode ? (
              <div style={{ marginTop: 6, color: "#a00", fontSize: 12 }}>{fieldErrors.otpCode}</div>
            ) : null}
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
            {loading ? "처리 중..." : "OTP 인증 및 가입 완료"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep(STEP.FORM);
              setSignupKey("");
              setOtpCode("");
              setError("");
              setFieldErrors({});
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
