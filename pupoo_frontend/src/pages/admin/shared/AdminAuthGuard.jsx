import { useState, useEffect, useCallback, useRef } from "react";
import ds from "./designTokens";
import {
  authApi,
  unwrap,
  setToken,
  getToken,
  clearToken,
  adminNoticeApi,
} from "../../../api/noticeApi";
import { axiosInstance } from "../../../app/http/axiosInstance";
import ds from "./designTokens";

/* ── 테스트용 기본 계정 (Tab 키로 자동입력) ── */
const DEFAULT_ID = "admin@pupoo.com";
const DEFAULT_PW = "admin1234";

/**
 * ★ 핵심 동작 ★
 *
 * 1. 마운트 시 localStorage에 토큰이 있는지 확인
 * 2. 토큰이 있으면 → 실제 API 호출로 유효성 검증
 * 3. 토큰 없거나 검증 실패(401) → 대시보드 blur + 로그인 모달
 * 4. 사용 중 401 발생 → 자동으로 blur + 로그인 모달 재표시
 * 5. 로그인 성공 → blur 해제, 정상 렌더링
 */
export default function AdminAuthGuard({ children }) {
  const [authed, setAuthed] = useState(false); // ★ 기본 false — 검증 후 true
  const [checking, setChecking] = useState(true); // 초기 토큰 검증 중
  const interceptorId = useRef(null);

  /* ── 마운트 시 토큰 유효성 검증 ── */
  useEffect(() => {
    validateToken();
    setupInterceptor();

    return () => {
      // cleanup: interceptor 제거
      if (interceptorId.current !== null) {
        axiosInstance.interceptors.response.eject(interceptorId.current);
      }
    };
  }, []);

  /* 토큰이 있으면 실제 API 호출로 검증 */
  const validateToken = async () => {
    const token = getToken();

    if (!token) {
      setAuthed(false);
      setChecking(false);
      return;
    }

    try {
      // 가벼운 admin API 호출로 토큰 유효성 확인
      await adminNoticeApi.list(1, 1);
      setAuthed(true);
    } catch (err) {
      const status = err?.response?.status;
      console.warn("[AdminAuthGuard] 토큰 검증 실패:", status);
      clearToken();
      setAuthed(false);
    } finally {
      setChecking(false);
    }
  };

  /* 401 응답 감지 인터셉터 (사용 중 토큰 만료 대응) */
  const setupInterceptor = () => {
    interceptorId.current = axiosInstance.interceptors.response.use(
      (res) => res,
      (err) => {
        const status = err?.response?.status;
        const url = err?.config?.url || "";

        // admin API에서 401 → 로그인 모달 표시
        if (status === 401 && url.includes("/api/admin")) {
          clearToken();
          setAuthed(false);
        }

        return Promise.reject(err);
      },
    );
  };

  const handleLoginSuccess = useCallback(() => {
    setAuthed(true);
  }, []);

  /* ── 초기 검증 중: 로딩 표시 ── */
  if (checking) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: ds.bg,
          fontFamily: ds.ff,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: `3px solid ${ds.line}`,
              borderTopColor: ds.brand,
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 14px",
            }}
          />
          <p style={{ fontSize: 13, color: ds.ink4, margin: 0 }}>
            인증 확인 중...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* ── 대시보드 콘텐츠: 항상 렌더링, 미인증 시 블러 ── */}
      <div
        style={{
          width: "100%",
          height: "100%",
          filter: authed ? "none" : "blur(8px) saturate(0.6)",
          pointerEvents: authed ? "auto" : "none",
          userSelect: authed ? "auto" : "none",
          transition: "filter 0.5s ease",
        }}
      >
        {children}
      </div>

      {/* ── 미인증 시 오버레이 + 로그인 모달 ── */}
      {!authed && <LoginOverlay onSuccess={handleLoginSuccess} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   오버레이 + 로그인 모달
   ═══════════════════════════════════════════════ */
function LoginOverlay({ onSuccess }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  /* 마운트 시 fade-in 애니메이션 */
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

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

  /* 로그인 로직 */
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
        background: visible ? "rgba(15, 16, 23, 0.5)" : "rgba(15, 16, 23, 0)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: ds.ff,
        transition: "background 0.5s ease",
      }}
    >
      {/* 모달 카드 */}
      <div
        style={{
          background: ds.card,
          borderRadius: 24,
          padding: "44px 40px 36px",
          width: 400,
          maxWidth: "90vw",
          boxShadow: "0 32px 80px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.12)",
          transform: visible
            ? "translateY(0) scale(1)"
            : "translateY(30px) scale(0.96)",
          opacity: visible ? 1 : 0,
          transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onKeyDown={handleKeyDown}
      >
        {/* 로고 / 타이틀 */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: ds.brandSoft,
              border: `1.5px solid ${ds.brand}20`,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 26 }}>🐾</span>
          </div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: ds.ink,
              margin: "0 0 8px",
              letterSpacing: -0.3,
            }}
          >
            Pupoo 관리자
          </h2>
          <p
            style={{
              fontSize: 13.5,
              color: ds.ink4,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            대시보드에 접속하려면 로그인이 필요합니다
          </p>
        </div>

        {/* 에러 메시지 */}
        {err && (
          <div
            style={{
              background: ds.redSoft,
              border: `1px solid ${ds.red}33`,
              borderRadius: 12,
              padding: "10px 14px",
              fontSize: 12.5,
              color: ds.red,
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
              color: ds.ink3,
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
              padding: "12px 14px",
              borderRadius: 12,
              border: `1.5px solid ${ds.line}`,
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
              e.target.style.borderColor = ds.line;
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* 비밀번호 */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: ds.ink3,
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
              padding: "12px 14px",
              borderRadius: 12,
              border: `1.5px solid ${ds.line}`,
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
              e.target.style.borderColor = ds.line;
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
            padding: "13px 0",
            borderRadius: 12,
            border: "none",
            background: loading ? ds.ink4 : ds.brand,
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: ds.ff,
            transition: "background .15s, transform .1s",
          }}
          onMouseDown={(e) => {
            if (!loading) e.currentTarget.style.transform = "scale(0.98)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>

        {/* Tab 힌트 */}
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: ds.ink4,
            marginTop: 18,
            marginBottom: 0,
          }}
        >
          빈 칸에서 Tab 키 → 테스트 계정 자동입력
        </p>
      </div>
    </div>
  );
}
