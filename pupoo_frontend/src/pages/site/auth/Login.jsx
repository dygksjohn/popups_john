import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authApi } from "./api/authApi";
import { tokenStore } from "../../../app/http/tokenStore";
import { useAuth } from "./AuthProvider";
import { NaverBrandMark } from "../../../shared/ui/NaverBrandMark";

// ?? Social button (reusable) ??????????????????????????????????????????????????
const SocialButton = ({ onClick, style, children, compact = false }) => {
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
        gap: compact ? 8 : 10,
        width: "100%",
        height: compact ? 48 : 54,
        padding: compact ? "0 16px" : "0 20px",
        borderRadius: compact ? 10 : 12,
        border: "none",
        cursor: "pointer",
        fontSize: compact ? 14 : 16,
        fontFamily: "'Noto Sans KR', sans-serif",
        fontWeight: 600,
        transition: "filter 0.15s, box-shadow 0.15s",
        filter: hovered ? "brightness(0.93)" : "brightness(1)",
        ...style,
      }}
    >
      {children}
    </button>
  );
};

// ?? SVG icons ?????????????????????????????????????????????????????????????????
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

// ?? Animated geometric shapes for the left panel ?????????????????????????????
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

// ?? Main LoginPage component ??????????????????????????????????????????????????
const LoginPage = ({ leftBgImage = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const defaultKakaoRedirectUri = `${window.location.origin}/auth/kakao/callback`;
  const KAKAO_REST_KEY = import.meta.env.VITE_KAKAO_REST_KEY;
  const KAKAO_REDIRECT_URI =
    import.meta.env.VITE_KAKAO_REDIRECT_URI || defaultKakaoRedirectUri;
  const defaultNaverRedirectUri = `${window.location.origin}/naver/callback`;
  const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID;
  const NAVER_REDIRECT_URI =
    import.meta.env.VITE_NAVER_REDIRECT_URI || defaultNaverRedirectUri;
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

    // Redirect priority after login success
    // 1. from passed by ProtectedRoute
    // 2. previous visited route
    // 3. default home
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

  const handleNaverLogin = () => {
    if (!NAVER_CLIENT_ID || !NAVER_REDIRECT_URI) {
      console.error("Naver env missing");
      return;
    }

    const redirectTo = resolvePostLoginRedirect();
    sessionStorage.setItem("post_login_redirect", redirectTo);

    const state = `${crypto.randomUUID()}${Date.now()}`;
    sessionStorage.setItem("naver_oauth_state", state);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: NAVER_CLIENT_ID,
      redirect_uri: NAVER_REDIRECT_URI,
      state,
    });
    window.location.href = `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
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
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1440 : window.innerWidth,
  );

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

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const syncViewport = () => setViewportWidth(window.innerWidth);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;

  const handleGoogleLogin = () => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`;
    if (!GOOGLE_CLIENT_ID) { setToast("VITE_GOOGLE_CLIENT_ID가 설정되지 않았습니다."); return; }
    const redirectTo = resolvePostLoginRedirect();
    sessionStorage.setItem("post_login_redirect", redirectTo);
    const params = new URLSearchParams({
      response_type: "code", client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      scope: "openid email profile", prompt: "select_account",
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

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
    padding: isMobile ? "12px 14px" : "13px 16px",
    borderRadius: 8,
    border: `1.5px solid ${focusedField === fieldName ? "#90C450" : "#E2E8F0"}`,
    fontSize: isMobile ? 13.5 : 14,
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
      {/* Google Fonts */}

      {/* ?? Page wrapper ?? */}
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile
            ? "calc(var(--pupoo-site-header-offset, 112px) + 16px) 10px 16px"
            : isTablet
              ? "18px 14px"
              : "24px 16px",
          background: "#f8f9fc",
        }}
      >
        <div style={{ width: "100%", maxWidth: isTablet ? 760 : 860 }}>
          {/* ?? Card ?? */}
          <div
            className="login-card card-enter"
            style={{
              display: "flex",
              flexDirection: "row",
              borderRadius: isMobile ? 16 : 20,
              overflow: "hidden",
              boxShadow: isMobile
                ? "0 8px 32px rgba(74,100,180,0.12)"
                : "0 20px 60px rgba(74,100,180,0.18), 0 4px 16px rgba(0,0,0,0.08)",
              minHeight: isMobile ? "auto" : 500,
              marginTop: isMobile ? 0 : isTablet ? 60 : 100,
            }}
          >
            {/* Left panel — desktop/tablet only */}
            {!isMobile && (
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
                padding: isTablet ? "30px 24px" : "40px 36px",
                background: leftBgImage
                  ? `url(${leftBgImage}) center/cover no-repeat`
                  : "linear-gradient(145deg, #a8d96a 0%, #90C450 35%, #7ab33e 65%, #6fa834 100%)",
                borderRadius: "20px 0 0 20px",
              }}
            >
              <FloatingShape
                style={{
                  width: 140, height: 140, top: 40, right: -30, borderRadius: 24,
                  background: "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.05))",
                  backdropFilter: "blur(2px)", border: "1px solid rgba(255,255,255,0.2)",
                }}
                className="shape-a"
              />
              <FloatingShape
                style={{
                  width: 90, height: 90, top: 100, left: 20, borderRadius: 18,
                  background: "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.04))",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
                className="shape-b"
              />
              <FloatingShape
                style={{
                  width: 60, height: 60, bottom: 160, right: 40, borderRadius: 12,
                  background: "linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.06))",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
                className="shape-c"
              />
              <FloatingShape
                style={{
                  width: 200, height: 200, bottom: -60, right: -60, borderRadius: 36,
                  background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02))",
                  border: "1px solid rgba(255,255,255,0.1)", transform: "rotate(20deg)", opacity: 0.5,
                }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(40,55,160,0.55) 0%, transparent 60%)", pointerEvents: "none" }} />
              <div style={{ position: "relative", zIndex: 2 }}>
                <h1 style={{ color: "#FFFFFF", fontSize: isTablet ? 22 : 26, fontWeight: 700, lineHeight: 1.45, letterSpacing: "-0.5px", marginBottom: 12, textShadow: "0 2px 12px rgba(0,0,30,0.25)" }}>
                  지금 로그인하고<br />푸푸와 함께 반려생활을<br />더 편하게 시작하세요
                </h1>
                <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 12, fontWeight: 400, lineHeight: 1.6, letterSpacing: "0.2px" }}>
                  행사 신청부터 참여 기록, 알림까지<br />한 번에 관리할 수 있어요
                </p>
              </div>
            </div>
            )}

            {/* Right panel */}
            <div
              className="right-panel"
              style={{
                flex: 1,
                background: "#FFFFFF",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: isMobile ? "28px 24px 24px" : isTablet ? "30px 24px" : "44px 40px",
                borderRadius: isMobile ? 16 : "0 20px 20px 0",
              }}
            >
              {/* 모바일 전용 브랜드 헤더 */}
              {isMobile && (
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div style={{ fontSize: 13, color: "#a0aec0", fontWeight: 500, marginBottom: 6 }}>🐾 Pupoo</div>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "#1a1a1a", marginBottom: 4 }}>반갑습니다</div>
                  <div style={{ fontSize: 13, color: "#9ca3af", fontWeight: 400 }}>행사 신청부터 참여 기록까지 한번에</div>
                </div>
              )}
              {/* Title — desktop/tablet only */}
              {!isMobile && (
              <div style={{ marginBottom: 32 }}>
                <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: "#1a1a1a" }}>로그인</span>
              </div>
              )}

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
              <div style={{ marginBottom: isMobile ? 14 : 16 }}>
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
                  marginBottom: isMobile ? 16 : 20,
                  fontSize: isMobile ? 12.5 : 13,
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
                    accentColor: "#90C450",
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
                  padding: isMobile ? "12px" : "13px",
                  borderRadius: 8,
                  border: "none",
                  background:
                    "linear-gradient(90deg, #90C450 0%, #7ab33e 100%)",
                  color: "#fff",
                  fontSize: isMobile ? 14 : 15,
                  fontWeight: 600,
                  fontFamily: "'Noto Sans KR', sans-serif",
                  cursor: "pointer",
                  letterSpacing: "1px",
                  transition: "filter 0.2s, transform 0.15s",
                  boxShadow: "0 4px 14px rgba(74,130,232,0.35)",
                  marginBottom: isMobile ? 14 : 16,
                }}
              >
                로그인
              </button>

              {/* ??? Sign-up / Find password links ??? */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  flexWrap: isMobile ? "wrap" : "nowrap",
                  gap: 0,
                  marginBottom: isMobile ? 18 : 24,
                }}
              >
                <a
                  href="/auth/join/joinselect"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/auth/join/joinselect");
                  }}
                  style={{
                    fontSize: isMobile ? 12.5 : 13,
                    color: "#718096",
                    textDecoration: "none",
                    padding: isMobile ? "0 10px" : "0 14px",
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
                    fontSize: isMobile ? 12.5 : 13,
                    color: "#718096",
                    textDecoration: "none",
                    padding: isMobile ? "0 10px" : "0 14px",
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
                  gap: isMobile ? 8 : 10,
                  marginBottom: isMobile ? 14 : 16,
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

              {/* Social buttons */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <SocialButton
                  onClick={handleKakaoLogin}
                  compact={isMobile}
                  style={{ background: "#FEE500", color: "#3C1E1E" }}
                >
                  <KakaoIcon />
                  <span>카카오로 로그인</span>
                </SocialButton>

                {/* Google */}
                <SocialButton
                  onClick={handleGoogleLogin}
                  compact={isMobile}
                  style={{
                    background: "#FFFFFF",
                    color: "#3C4043",
                    border: "1.5px solid #DADCE0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    cursor: "pointer",
                  }}
                >
                  <GoogleIcon />
                  <span>Google로 로그인</span>
                </SocialButton>

                {/* Naver */}
                <SocialButton
                  onClick={handleNaverLogin}
                  compact={isMobile}
                  style={{
                    background: "#03C75A",
                    color: "#FFFFFF",
                    boxShadow: "0 6px 16px rgba(3,199,90,0.22)",
                  }}
                >
                  <NaverBrandMark
                    size={isMobile ? 18 : 20}
                    rounded={4}
                    background="#FFFFFF"
                    color="#03C75A"
                  />
                  <span>naver로 로그인</span>
                </SocialButton>
              </div>
            </div>
          </div>

          {/* ?? Footer ?? */}
          <div
            style={{
              textAlign: "center",
              marginTop: 24,
              fontSize: isMobile ? 11.5 : 12,
              color: "#A0AEC0",
              lineHeight: 1.7,
              padding: isMobile ? "0 8px" : 0,
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
          position: "fixed", bottom: isMobile ? "calc(env(safe-area-inset-bottom, 0px) + 16px)" : 40, left: "50%", transform: "translateX(-50%)",
          background: "#fff", color: "#333", fontSize: isMobile ? 13 : 14, fontWeight: 600,
          padding: isMobile ? "12px 20px" : "14px 32px", borderRadius: 14, border: "1px solid #e8e8e8",
          boxShadow: "0 8px 32px rgba(0,0,0,.12)", zIndex: 9999,
          animation: "login-toast-in .3s ease, login-toast-out .3s ease 2s forwards",
          width: isMobile ? "min(calc(100vw - 24px), 320px)" : "auto",
          textAlign: "center",
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
