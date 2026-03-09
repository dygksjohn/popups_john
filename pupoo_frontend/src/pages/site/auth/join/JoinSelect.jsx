import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { tokenStore } from "../../../../app/http/tokenStore";

/* ───────────────── ICONS ───────────────── */

const KakaoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.748 1.67 5.16 4.2 6.624L5.1 21l4.62-2.4A11.4 11.4 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 48 48">
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303C33.677 32.91 29.243 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.061 0 5.854 1.154 7.97 3.042l5.657-5.657C34.046 6.053 29.27 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
    />
    <path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.061 0 5.854 1.154 7.97 3.042l5.657-5.657C34.046 6.053 29.27 4 24 4c-7.732 0-14.41 4.386-17.694 10.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.184 0 9.88-1.977 13.409-5.193l-6.191-5.238C29.211 35.091 26.715 36 24 36c-5.217 0-9.645-3.063-11.273-7.484l-6.525 5.03C9.435 39.556 16.216 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303c-1.056 2.89-3.207 5.259-6.085 6.57l.003-.002 6.191 5.238C36.973 37.342 44 31.245 44 24c0-1.341-.138-2.65-.389-3.917z"
    />
  </svg>
);

const AppleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83" />
  </svg>
);

const PenIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

/* ───────────────── PROVIDERS ───────────────── */

const socialProviders = [
  {
    id: "kakao",
    label: "카카오로 계속하기",
    bg: "#FEE500",
    color: "#191919",
    hoverBg: "#e6cf00",
    border: "none",
    icon: KakaoIcon,
  },
  {
    id: "google",
    label: "구글로 계속하기",
    bg: "#FFFFFF",
    color: "#202124",
    hoverBg: "#F3F4F6",
    border: "1.5px solid #DADCE0",
    icon: GoogleIcon,
  },
  {
    id: "apple",
    label: "애플로 계속하기",
    bg: "#000000",
    color: "#ffffff",
    hoverBg: "#222222",
    border: "none",
    icon: AppleIcon,
  },
];

/* ───────────────── MAIN ───────────────── */

export default function JoinSelect() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);

  // 🔥 여기로 이동 (handle 함수보다 위에!)
  const defaultKakaoRedirectUri = `${window.location.origin}/auth/kakao/callback`;
  const KAKAO_REST_KEY = import.meta.env.VITE_KAKAO_REST_KEY;
  const KAKAO_REDIRECT_URI =
    import.meta.env.VITE_KAKAO_REDIRECT_URI ||
    defaultKakaoRedirectUri;

  const handleKakaoContinue = () => {
    tokenStore.clear(); // ✅ 이전 로그인 토큰 제거 (중요)
    console.log("KAKAO_REST_KEY?", !!KAKAO_REST_KEY);
    console.log("KAKAO_REDIRECT_URI =", KAKAO_REDIRECT_URI);
    sessionStorage.removeItem("kakao_auth_code");
    sessionStorage.removeItem("kakao_oauth_code_guard");
    sessionStorage.removeItem("kakao_provider_uid");
    sessionStorage.removeItem("kakao_email");
    sessionStorage.removeItem("kakao_nickname");

    if (!KAKAO_REST_KEY) {
      alert("VITE_KAKAO_REST_KEY가 설정되지 않았습니다.");
      return;
    }

    const params = new URLSearchParams({
      response_type: "code",
      client_id: KAKAO_REST_KEY,
      redirect_uri: KAKAO_REDIRECT_URI,
      through_account: "true",
      prompt: "login",
    });

    const authorizeUrl = `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
    const kakaoLoginUrl = `https://accounts.kakao.com/login/?login_type=normal&continue=${encodeURIComponent(authorizeUrl)}`;
    window.location.href = kakaoLoginUrl;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f6fa",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 24,
          padding: 40,
          width: "100%",
          maxWidth: 440,
          boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <img
            src="/logo_blue.png"
            alt="logo"
            style={{ width: 120, display: "block" }}
          />
        </div>

        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
          이메일로 회원가입하거나
          <br />
          기존 소셜 계정으로 빠르게 가입하세요.
        </p>

        <button
          onClick={() => {
            console.log(
              "AUTHTOKEN",
              localStorage.getItem("pupoo_access_token"),
            );

            navigate("/auth/join/joinnormal");
          }}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 12,
            border: "1.5px solid #dde1e9",
            background: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <PenIcon />
          일반 회원가입
        </button>

        <div style={{ height: 1, background: "#e8eaed", margin: "16px 0" }} />

        {socialProviders.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => {
                if (p.id === "kakao") return handleKakaoContinue();
                alert("준비 중");
              }}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                width: "100%",
                height: 52,
                borderRadius: 12,
                border: p.border || "none",
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 600,
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                background: hovered === p.id ? p.hoverBg : p.bg,
                color: p.color,
              }}
            >
              <Icon />
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
