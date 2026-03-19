import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authApi } from "./api/authApi";
import { tokenStore } from "../../../app/http/tokenStore";
import { useAuth } from "./AuthProvider";

// 기능: 공통 SNS 버튼 모양과 hover 상태를 재사용한다.
const SocialButton = ({ onClick, style, children }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: "100%",
        padding: "10px 16px",
        borderRadius: 8,
        border: "none",
        cursor: "pointer",
        fontSize: 14,
        fontFamily: "'Noto Sans KR', sans-serif",
        fontWeight: 500,
        transition: "filter 0.15s, box-shadow 0.15s",
        filter: hovered ? "brightness(0.93)" : "brightness(1)",
        ...style,
      }}
    >
      {children}
    </button>
  );
};

// 기능: 로그인 화면에서 사용하는 SNS 아이콘을 로컬 컴포넌트로 고정한다.
const KakaoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path
      fill="#3C1E1E"
      d="M12 3C6.48 3 2 6.48 2 10.5c0 2.73 1.82 5.14 4.52 6.49-.2.74-.73 2.68-.84 3.11-.13.52.19.51.4.37.16-.11 2.67-1.8 3.75-2.54.39.06.79.09 1.17.09 5.52 0 10-3.48 10-7.5S17.52 3 12 3z"
    />
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
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
  <svg width="18" height="18" viewBox="0 0 384 512">
    <path
      fill="currentColor"
      d="M318.7 268.5c-.3-63.1 51.5-93.4 53.9-94.9-29.4-42.9-75.2-48.8-91.5-49.5-38.9-3.9-76 22.9-95.8 22.9-19.8 0-50.3-22.3-82.7-21.7-42.6.6-81.9 24.8-103.9 63.1-44.3 76.7-11.4 190 31.8 252.4 21.1 30.6 46.2 64.9 79.2 63.6 31.7-1.3 43.7-20.5 82-20.5s49.2 20.5 82.7 19.9c34.2-.6 55.8-31.1 76.7-61.8 24.3-35.6 34.3-70 34.9-71.8-.8-.4-66.9-25.7-67.2-101.8zM251.3 81.6c17.5-21.2 29.4-50.6 26.2-79.6-25.2 1-55.6 16.8-73.6 38-16.2 18.7-30.4 48.6-26.6 77.3 28.1 2.2 56.5-14.3 74-35.7z"
    />
  </svg>
);

// 기능: 로그인 좌측 안내 패널의 배경 장식을 렌더링한다.
const FloatingShape = ({ style }) => (
  <div
    style={{
      position: "absolute",
      borderRadius: 12,
      opacity: 0.18,
      background: "rgba(255,255,255,0.9)",
      ...style,
    }}
  />
);

const LoginPage = ({ leftBgImage = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const defaultKakaoRedirectUri = `${window.location.origin}/auth/kakao/callback`;
  const KAKAO_REST_KEY = import.meta.env.VITE_KAKAO_REST_KEY;
  const KAKAO_REDIRECT_URI =
    import.meta.env.VITE_KAKAO_REDIRECT_URI || defaultKakaoRedirectUri;
  // 기능: 로그인 성공 후 돌아갈 목적지를 인증 화면이 아닌 경로로 정리한다.
  // 설명: 보호 라우트에서 튕겨온 경로와 세션에 저장한 redirect 후보를 우선 사용하고, 인증 화면이면 홈으로 보정한다.
  const resolvePostLoginRedirect = () => {
    const target =
      location.state?.from ||
      sessionStorage.getItem("post_login_redirect") ||
      "/";
    return target.startsWith("/auth/") ? "/" : target;
  };

  const handleKakaoLogin = () => {
    if (!KAKAO_REST_KEY || !KAKAO_REDIRECT_URI) {
      console.error("Kakao env missing");
      return;
    }

    // 기능: 카카오 인증 전 현재 사용자가 돌아와야 할 화면을 sessionStorage에 보관한다.
    // 설명: 외부 OAuth 페이지를 거치면 react state가 사라질 수 있어 브라우저 저장소에 redirect 목적지를 백업한다.
    const redirectTo = resolvePostLoginRedirect();
    sessionStorage.setItem("post_login_redirect", redirectTo);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: KAKAO_REST_KEY,
      redirect_uri: KAKAO_REDIRECT_URI,
      through_account: "true",
      prompt: "login",
    });
    window.location.href = `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
  };

  useEffect(() => {
    document.body.classList.add("light-header");

    return () => {
      document.body.classList.remove("light-header");
    };
  }, []);

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const externalError = location.state?.error || "";

  useEffect(() => {
    if (externalError) {
      setError(externalError);
    }
  }, [externalError]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2300);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSocialClick = (name) => {
    setToast(`${name} 로그인은 곧 지원될 예정이에요`);
  };

  const handleLogin = async () => {
    if (loading) return;

    setError("");

    const email = (userId || "").trim();
    if (!email.trim()) return setError("이메일을 입력하세요.");
    if (!password) return setError("비밀번호를 입력하세요.");

    setLoading(true);
    try {
      // 기능: 일반 로그인 성공 시 access token 저장 후 즉시 보호 화면 접근을 연다.
      // 설명: authApi.login은 실제 로그인 API 호출만 담당하고, 화면 이동과 토큰 저장은 여기서 마무리한다.
      // 흐름: 입력 검증 -> login API 호출 -> tokenStore 저장 -> redirect 경로 이동.
      const res = await authApi.login({ email, password });
      const accessToken = res?.accessToken;

      if (!accessToken) {
          throw new Error("로그인 응답에 accessToken이 없습니다.");
      }

      tokenStore.setAccess(accessToken);
        login();
      const redirectTo = resolvePostLoginRedirect();
      sessionStorage.removeItem("post_login_redirect");
      navigate(redirectTo, { replace: true });
    } catch (e) {
        setError(e?.response?.data?.message ?? "로그인에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin();
    }
  };

  const inputStyle = (fieldName) => ({
    width: "100%",
    padding: "13px 16px",
    borderRadius: 8,
    border: `1.5px solid ${focusedField === fieldName ? "#4A90E2" : "#E2E8F0"}`,
    fontSize: 14,
    fontFamily: "'Noto Sans KR', sans-serif",
    color: "#2D3748",
    background: "#FAFBFD",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow:
      focusedField === fieldName ? "0 0 0 3px rgba(74,144,226,0.12)" : "none",
  });

  return (
    <>
      {/* 기능: 로그인 화면은 좌측 안내 패널과 우측 입력 패널로 나뉜다. */}
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
          background: "linear-gradient(135deg, #EEF2F9 0%, #E3EAF6 100%)",
        }}
      >
        <div style={{ width: "100%", maxWidth: 860 }}>
          <div
            className="login-card card-enter"
            style={{
              display: "flex",
              flexDirection: "row",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow:
                "0 20px 60px rgba(74,100,180,0.18), 0 4px 16px rgba(0,0,0,0.08)",
              minHeight: 500,
              marginTop: 100,
            }}
          >
            {/* 기능: 좌측 패널은 서비스 소개와 로그인 유도 메시지를 보여준다. */}
            <div
              className="left-panel"
              style={{
                width: "48%",
                minWidth: 260,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                padding: "40px 36px",
                background: leftBgImage
                  ? `url(${leftBgImage}) center/cover no-repeat`
                  : "linear-gradient(145deg, #6B8CFF 0%, #4B6FE5 35%, #3A55CC 65%, #5B35CC 100%)",
                borderRadius: "20px 0 0 20px",
              }}
            >
              <FloatingShape
                style={{
                  width: 140,
                  height: 140,
                  top: 40,
                  right: -30,
                  borderRadius: 24,
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.05))",
                  backdropFilter: "blur(2px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
                className="shape-a"
              />
              <FloatingShape
                style={{
                  width: 90,
                  height: 90,
                  top: 100,
                  left: 20,
                  borderRadius: 18,
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.04))",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
                className="shape-b"
              />
              <FloatingShape
                style={{
                  width: 60,
                  height: 60,
                  bottom: 160,
                  right: 40,
                  borderRadius: 12,
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.06))",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
                className="shape-c"
              />
              <FloatingShape
                style={{
                  width: 200,
                  height: 200,
                  bottom: -60,
                  right: -60,
                  borderRadius: 36,
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02))",
                  border: "1px solid rgba(255,255,255,0.1)",
                  transform: "rotate(20deg)",
                  opacity: 0.5,
                }}
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(40,55,160,0.55) 0%, transparent 60%)",
                  pointerEvents: "none",
                }}
              />

              <div style={{ position: "relative", zIndex: 2 }}>
                <h1
                  style={{
                    color: "#FFFFFF",
                    fontSize: 26,
                    fontWeight: 700,
                    lineHeight: 1.45,
                    letterSpacing: "-0.5px",
                    marginBottom: 12,
                    textShadow: "0 2px 12px rgba(0,0,30,0.25)",
                  }}
                >
                  지금 로그인하고
                  <br />
                  푸푸와 함께 반려생활을
                  <br />
                  더 편하게 시작하세요
                </h1>
                <p
                  style={{
                    color: "rgba(255,255,255,0.78)",
                    fontSize: 12,
                    fontWeight: 400,
                    lineHeight: 1.6,
                    letterSpacing: "0.2px",
                  }}
                >
                  행사 신청부터 참여 기록, 알림까지
                  <br />
                  한 번에 관리할 수 있어요
                </p>
              </div>
            </div>

            {/* 기능: 우측 패널은 실제 로그인 입력과 인증 진입 동작을 담당한다. */}
            <div
              className="right-panel"
              style={{
                flex: 1,
                background: "#FFFFFF",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "44px 40px",
                borderRadius: "0 20px 20px 0",
              }}
            >
              {/* Title */}
              <div style={{ marginBottom: 32 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: "#1a1a1a" }}>로그인</span>
                </div>
              </div>

              {/* ??? ID input ??? */}
              <div style={{ marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="이메일을 입력하세요"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onFocus={() => setFocusedField("id")}
                  onBlur={() => setFocusedField(null)}
                  style={inputStyle("id")}
                  onKeyDown={handleKeyDown}
                />
              </div>

              {/* ??? Password input ??? */}
              <div style={{ marginBottom: 16 }}>
                <input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("pw")}
                  onBlur={() => setFocusedField(null)}
                  style={inputStyle("pw")}
                  onKeyDown={handleKeyDown}
                />
              </div>

              {/* ??? Remember me ??? */}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  marginBottom: 20,
                  fontSize: 13,
                  color: "#4A5568",
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    width: 16,
                    height: 16,
                    accentColor: "#4A90E2",
                    cursor: "pointer",
                  }}
                />
                아이디 저장
              </label>

              {/* ??? Login button ??? */}
              <button
                className="login-btn"
                onClick={handleLogin}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: 8,
                  border: "none",
                  background:
                    "linear-gradient(90deg, #5591F5 0%, #4A82E8 100%)",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: "'Noto Sans KR', sans-serif",
                  cursor: "pointer",
                  letterSpacing: "1px",
                  transition: "filter 0.2s, transform 0.15s",
                  boxShadow: "0 4px 14px rgba(74,130,232,0.35)",
                  marginBottom: 16,
                }}
              >
                로그인
              </button>

              {/* ??? Sign-up / Find password links ??? */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 0,
                  marginBottom: 24,
                }}
              >
                <a
                  href="/auth/join/joinselect"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/auth/join/joinselect");
                  }}
                  style={{
                    fontSize: 13,
                    color: "#718096",
                    textDecoration: "none",
                    padding: "0 14px",
                    borderRight: "1px solid #CBD5E0",
                  }}
                >
                  회원가입하기
                </a>
                <a
                  href="/auth/find-password"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/auth/find-password");
                  }}
                  style={{
                    fontSize: 13,
                    color: "#718096",
                    textDecoration: "none",
                    padding: "0 14px",
                  }}
                >
                  비밀번호 찾기
                </a>
              </div>

              {/* ??? Divider ??? */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <div style={{ flex: 1, height: 1, background: "#E8EDF5" }} />
                <span
                  style={{
                    fontSize: 11,
                    color: "#A0AEC0",
                    whiteSpace: "nowrap",
                  }}
                >
                  SNS 계정으로 로그인
                </span>
                <div style={{ flex: 1, height: 1, background: "#E8EDF5" }} />
              </div>

              {/* 기능: 카카오 로그인은 실제 OAuth로 연결하고, 나머지는 준비 상태만 안내한다. */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <SocialButton
                  onClick={handleKakaoLogin}
                  style={{ background: "#FEE500", color: "#3C1E1E" }}
                >
                  <KakaoIcon />
                  <span>카카오로 로그인</span>
                </SocialButton>

                {/* Google */}
                <SocialButton
                  onClick={() => handleSocialClick("Google")}
                  style={{
                    background: "#FFFFFF",
                    color: "#3C4043",
                    border: "1.5px solid #DADCE0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    opacity: 0.35,
                    filter: "grayscale(0.7)",
                    cursor: "pointer",
                  }}
                >
                  <GoogleIcon />
                  <span>Google로 로그인</span>
                </SocialButton>

                {/* Apple */}
                <SocialButton
                  onClick={() => handleSocialClick("Apple")}
                  style={{
                    background: "#000000",
                    color: "#FFFFFF",
                    opacity: 0.35,
                    filter: "grayscale(0.7)",
                    cursor: "pointer",
                  }}
                >
                  <AppleIcon />
                  <span>Apple로 로그인</span>
                </SocialButton>
              </div>
            </div>
          </div>

          {/* ?? Footer ?? */}
          <div
            style={{
              textAlign: "center",
              marginTop: 24,
              fontSize: 12,
              color: "#A0AEC0",
              lineHeight: 1.7,
            }}
          >
              <strong style={{ color: "#718096" }}>
                멤버십 문의는 아래 연락처로 문의해 주세요.
              </strong>
            <br />
            dogcat@imqa.io / Tel : 02-123-1234
          </div>
        </div>
      </div>

      {toast && (
        <div style={{
          position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)",
          background: "#fff", color: "#333", fontSize: 14, fontWeight: 600,
          padding: "14px 32px", borderRadius: 14, border: "1px solid #e8e8e8",
          boxShadow: "0 8px 32px rgba(0,0,0,.12)", zIndex: 9999,
          animation: "login-toast-in .3s ease, login-toast-out .3s ease 2s forwards",
        }}>{toast}</div>
      )}

      <style>{`
        @keyframes login-toast-in { from { opacity:0; transform:translateX(-50%) translateY(16px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        @keyframes login-toast-out { from { opacity:1; } to { opacity:0; transform:translateX(-50%) translateY(16px); } }
      `}</style>
    </>
  );
};

export default LoginPage;
