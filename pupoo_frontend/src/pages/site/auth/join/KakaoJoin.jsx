import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";

export default function KakaoJoin() {
  const navigate = useNavigate();

  const kakao = useMemo(() => {
    return {
      providerUid: sessionStorage.getItem("kakao_provider_uid") ?? "",
      email: sessionStorage.getItem("kakao_email") ?? "",
      nickname: sessionStorage.getItem("kakao_nickname") ?? "",
    };
  }, []);

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startSocialSignup = async () => {
    setError("");

    if (!kakao.providerUid) {
      setError("카카오 정보가 없습니다. 다시 시도해주세요.");
      return;
    }

    const normalized = phone.replace(/[^0-9]/g, "");
    if (normalized.length < 10) {
      setError("휴대폰 번호를 입력해주세요.");
      return;
    }

    const emailToUse =
      kakao.email && kakao.email.trim()
        ? kakao.email.trim()
        : `${kakao.providerUid}@kakao.local`;

    try {
      setLoading(true);

      const res = await authApi.signupStart({
        signupType: "SOCIAL",
        socialProvider: "KAKAO",
        socialProviderUid: kakao.providerUid,
        email: emailToUse,
        nickname: kakao.nickname || "kakao_user",
        phone: normalized,
      });

      const signupKey = res?.signupKey;
      const devOtp = res?.devOtp;
      const otpCooldownSeconds = res?.otpCooldownSeconds;

      if (!signupKey) {
        setError("signupKey가 없습니다. 응답 구조 확인 필요");
        return;
      }

      sessionStorage.setItem(
        "kakao_signup_ctx",
        JSON.stringify({ signupKey, phone: normalized, devOtp,})
      );

      navigate("/auth/join/kakao/otp", {
        state: { signupKey, phone: normalized, devOtp, otpCooldownSeconds },
        replace: true,
      });
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message ?? e?.message ?? "OTP 발송 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 440, margin: "60px auto", padding: 20 }}>
      <h2>카카오 회원가입</h2>

      <div style={{ marginTop: 12, fontSize: 14, color: "#555" }}>
        <div>이메일: {kakao.email || "(없음)"}</div>
        <div>닉네임: {kakao.nickname || "(없음)"}</div>
      </div>

      <div style={{ marginTop: 20 }}>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="휴대폰 번호(OTP 발송)"
          style={{
            width: "100%",
            height: 44,
            padding: "0 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
          }}
        />
      </div>

      {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

      <button
        onClick={startSocialSignup}
        disabled={loading}
        style={{
          width: "100%",
          height: 48,
          marginTop: 14,
          borderRadius: 10,
          border: "none",
          background: "#FEE500",
          color: "#191919",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {loading ? "처리중..." : "OTP 보내기"}
      </button>
    </div>
  );
}
