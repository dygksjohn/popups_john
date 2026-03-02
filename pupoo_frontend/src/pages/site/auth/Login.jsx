import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi } from "./api/authApi";
import { tokenStore } from "../../../app/http/tokenStore";
import { useAuth } from "./AuthProvider";

const panel = {
  card: {
    width: "100%",
    maxWidth: 920,
    minHeight: 560,
    borderRadius: 20,
    overflow: "hidden",
    display: "grid",
    gridTemplateColumns: "42% 58%",
    background: "#fff",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
  },
  left: {
    position: "relative",
    padding: "44px 36px",
    background:
      "linear-gradient(145deg, #5b7ef7 0%, #4f71e8 35%, #3f5fd0 70%, #3048aa 100%)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  right: {
    padding: "44px 42px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    background: "#fff",
  },
};

function resolveFrom(location) {
  const from = location.state?.from;
  if (typeof from === "string" && from.trim()) {
    return from.startsWith("/auth/login") ? "/" : from;
  }
  if (from && typeof from === "object" && typeof from.pathname === "string") {
    const search = typeof from.search === "string" ? from.search : "";
    const hash = typeof from.hash === "string" ? from.hash : "";
    const target = `${from.pathname}${search}${hash}`;
    return target.startsWith("/auth/login") ? "/" : target;
  }
  const remembered = sessionStorage.getItem("post_login_redirect");
  if (remembered && remembered !== "[object Object]") {
    return remembered.startsWith("/auth/login") ? "/" : remembered;
  }
  return "/";
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#3C1E1E"
        d="M12 3C6.48 3 2 6.48 2 10.5c0 2.73 1.82 5.14 4.52 6.49-.2.74-.73 2.68-.84 3.11-.13.52.19.51.4.37.16-.11 2.67-1.8 3.75-2.54.39.06.79.09 1.17.09 5.52 0 10-3.48 10-7.5S17.52 3 12 3z"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.677 32.91 29.243 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.061 0 5.854 1.154 7.97 3.042l5.657-5.657C34.046 6.053 29.27 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.061 0 5.854 1.154 7.97 3.042l5.657-5.657C34.046 6.053 29.27 4 24 4c-7.732 0-14.41 4.386-17.694 10.691z" />
      <path fill="#4CAF50" d="M24 44c5.184 0 9.88-1.977 13.409-5.193l-6.191-5.238C29.211 35.091 26.715 36 24 36c-5.217 0-9.645-3.063-11.273-7.484l-6.525 5.03C9.435 39.556 16.216 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.056 2.89-3.207 5.259-6.085 6.57l.003-.002 6.191 5.238C36.973 37.342 44 31.245 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

function SocialButton({ onClick, children, style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid transparent",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        transition: "filter 0.15s ease",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthed, isBootstrapped } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(
    () => !loading && email.trim().length > 0 && password.length > 0,
    [email, password, loading],
  );

  useEffect(() => {
    document.body.classList.add("light-header");
    return () => document.body.classList.remove("light-header");
  }, []);

  useEffect(() => {
    if (!isBootstrapped || !isAuthed) return;
    navigate(resolveFrom(location), { replace: true });
  }, [isAuthed, isBootstrapped, location, navigate]);

  const handleKakaoLogin = () => {
    const restKey = import.meta.env.VITE_KAKAO_REST_KEY;
    const redirectUri = import.meta.env.VITE_KAKAO_REDIRECT_URI;
    if (!restKey || !redirectUri) {
      setError("카카오 로그인 설정이 누락되었습니다.");
      return;
    }

    const redirectTo = resolveFrom(location);
    sessionStorage.setItem("post_login_redirect", redirectTo);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: restKey,
      redirect_uri: redirectUri,
    });

    window.location.href = `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
  };

  const handleLogin = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    try {
      const data = await authApi.login({
        email: email.trim(),
        password,
      });

      if (!data?.accessToken) {
        throw new Error("로그인 응답에 accessToken이 없습니다.");
      }

      tokenStore.setAccess(data.accessToken, data);
      login();

      const redirectTo = resolveFrom(location);
      sessionStorage.removeItem("post_login_redirect");
      navigate(redirectTo, { replace: true });
    } catch (e) {
      setError(e?.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px 16px",
        background: "linear-gradient(135deg, #edf2f8 0%, #e2e8f2 100%)",
      }}
    >
      <div style={panel.card}>
        <section style={panel.left}>
          <div>
            <img
              src="/logo_white.png"
              alt="PUPOO"
              style={{ height: 24, width: "auto", objectFit: "contain" }}
            />
          </div>
          <div>
            <h1 style={{ fontSize: 28, lineHeight: 1.4, margin: 0, fontWeight: 700 }}>
              로그인하고
              <br />
              다양한 프로그램과
              <br />
              참여 기능을 이용해보세요
            </h1>
            <p style={{ marginTop: 14, opacity: 0.86, fontSize: 13, lineHeight: 1.6 }}>
              Mobile Performance
              <br />
              Management Solution
            </p>
          </div>
        </section>

        <section style={panel.right}>
          <div style={{ marginBottom: 26 }}>
            <img
              src="/logo_blue.png"
              alt="PUPOO"
              style={{ height: 38, width: "auto", objectFit: "contain" }}
            />
          </div>

          <input
            type="email"
            placeholder="이메일을 입력하세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{
              width: "100%",
              height: 46,
              borderRadius: 8,
              border: "1.5px solid #dce3ef",
              background: "#f8fbff",
              padding: "0 14px",
              marginBottom: 10,
              outline: "none",
              fontSize: 14,
            }}
          />
          <input
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{
              width: "100%",
              height: 46,
              borderRadius: 8,
              border: "1.5px solid #dce3ef",
              background: "#f8fbff",
              padding: "0 14px",
              marginBottom: 12,
              outline: "none",
              fontSize: 14,
            }}
          />

          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span style={{ fontSize: 13, color: "#475569" }}>아이디 저장</span>
          </label>

          {error && (
            <div style={{ fontSize: 13, color: "#dc2626", marginBottom: 10 }}>
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleLogin}
            disabled={!canSubmit}
            style={{
              width: "100%",
              height: 46,
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(90deg, #5591f5 0%, #4a82e8 100%)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: canSubmit ? "pointer" : "not-allowed",
              opacity: canSubmit ? 1 : 0.55,
              marginBottom: 14,
            }}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>

          <div style={{ display: "flex", justifyContent: "center", fontSize: 13, marginBottom: 18 }}>
            <button
              type="button"
              onClick={() => navigate("/auth/join/joinselect")}
              style={{
                border: "none",
                background: "transparent",
                color: "#64748b",
                padding: "0 12px",
                borderRight: "1px solid #d7dce5",
                cursor: "pointer",
              }}
            >
              회원가입하기
            </button>
            <button
              type="button"
              onClick={() => window.alert("비밀번호 찾기 기능은 준비 중입니다.")}
              style={{
                border: "none",
                background: "transparent",
                color: "#64748b",
                padding: "0 12px",
                cursor: "pointer",
              }}
            >
              비밀번호 찾기
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: "#e5eaf2" }} />
            <span style={{ fontSize: 11, color: "#94a3b8" }}>SNS 계정으로 로그인</span>
            <div style={{ flex: 1, height: 1, background: "#e5eaf2" }} />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <SocialButton
              onClick={handleKakaoLogin}
              style={{ background: "#FEE500", color: "#3C1E1E" }}
            >
              <KakaoIcon />
              <span>카카오로 로그인</span>
            </SocialButton>
            <SocialButton
              onClick={() => window.alert("Google 로그인은 준비 중입니다.")}
              style={{
                background: "#fff",
                color: "#334155",
                borderColor: "#d7dde8",
              }}
            >
              <GoogleIcon />
              <span>Google로 로그인</span>
            </SocialButton>
          </div>
        </section>
      </div>
    </div>
  );
}
