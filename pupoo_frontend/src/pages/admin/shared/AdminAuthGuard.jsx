import { useState, useEffect, useCallback } from "react";
import { authApi, unwrap, setToken } from "../../../api/noticeApi";
import ds from "./designTokens";

const TOKEN_KEY = "pupoo_admin_token";

/* ── 테스트용 기본 계정 (Tab 키로 자동입력) ── */
const DEFAULT_ID = "admin@pupoo.com";
const DEFAULT_PW = "admin1234";

/**
 * 대시보드 레이아웃에서 children을 감싸면 끝.
 *
 * - 토큰 없으면 → 로그인 모달 표시
 * - 401 응답 오면 → 자동으로 로그인 모달 다시 표시
 * - 한 번 로그인하면 → 다른 페이지 이동해도 다시 안 뜸
 * - 기존 로그인 페이지(AdminLogin)로 들어왔으면 안 뜸
 */
export default function AdminAuthGuard({ children }) {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem(TOKEN_KEY));

  /* 401 이벤트 수신 — interceptor에서 dispatch */
  useEffect(() => {
    const handler = () => {
      localStorage.removeItem(TOKEN_KEY);
      setAuthed(false);
    };
    window.addEventListener("auth:required", handler);
    return () => window.removeEventListener("auth:required", handler);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setAuthed(true);
  }, []);

  if (!authed) {
    return <LoginModal onSuccess={handleLoginSuccess} />;
  }

  return children;
}

/* ═══════════════════════════════════════════════
   로그인 모달
   ═══════════════════════════════════════════════ */
function LoginModal({ onSuccess }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  /* Tab 키 → 비어있으면 기본 계정 자동입력 */
  const handleKeyDown = (e) => {
    if (e.key === "Tab" && !id && !pw) {
      e.preventDefault();
      setId(DEFAULT_ID);
      setPw(DEFAULT_PW);
    }
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  /* 기존 AdminLogin.jsx와 동일한 로그인 로직 */
  const handleLogin = async () => {
    if (!id || !pw) {
      setErr("아이디와 비밀번호를 입력해주세요.");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      const res = await authApi.login(id, pw);
      const data = unwrap(res);
      const token = data?.accessToken || data?.token;

      if (!token) {
        setErr("토큰을 받지 못했습니다.");
        return;
      }

      setToken(token);
      onSuccess();
    } catch (e) {
      console.error("[AdminAuthGuard Login error]", e);
      setErr("관리자 계정 정보가 올바르지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: ds.ff,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "40px 36px 32px",
          width: 380,
          boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
        }}
        onKeyDown={handleKeyDown}
      >
        {/* 로고 / 타이틀 */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: `${ds.brand}12`,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <span style={{ fontSize: 24 }}>🐾</span>
          </div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: ds.ink,
              margin: "0 0 6px",
            }}
          >
            Pupoo 관리자
          </h2>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>
            대시보드에 접속하려면 로그인이 필요합니다
          </p>
        </div>

        {/* 에러 메시지 */}
        {err && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 12.5,
              color: "#DC2626",
              fontWeight: 600,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {err}
          </div>
        )}

        {/* 아이디 */}
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#64748B",
              marginBottom: 6,
              display: "block",
            }}
          >
            아이디
          </label>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="admin@pupoo.com"
            autoFocus
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: 10,
              border: "1.5px solid #E2E8F0",
              fontSize: 14,
              fontFamily: ds.ff,
              color: ds.ink,
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color .15s, box-shadow .15s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = ds.brand;
              e.target.style.boxShadow = `0 0 0 3px ${ds.brand}15`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#E2E8F0";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* 비밀번호 */}
        <div style={{ marginBottom: 22 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#64748B",
              marginBottom: 6,
              display: "block",
            }}
          >
            비밀번호
          </label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="비밀번호"
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: 10,
              border: "1.5px solid #E2E8F0",
              fontSize: 14,
              fontFamily: ds.ff,
              color: ds.ink,
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color .15s, box-shadow .15s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = ds.brand;
              e.target.style.boxShadow = `0 0 0 3px ${ds.brand}15`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#E2E8F0";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* 로그인 버튼 */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 10,
            border: "none",
            background: loading ? "#94A3B8" : ds.brand,
            color: "#fff",
            fontSize: 14.5,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: ds.ff,
            transition: "background .15s",
          }}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>

        {/* Tab 힌트 */}
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "#CBD5E1",
            marginTop: 16,
            marginBottom: 0,
          }}
        >
          빈 칸에서 Tab 키 → 테스트 계정 자동입력
        </p>
      </div>
    </div>
  );
}
