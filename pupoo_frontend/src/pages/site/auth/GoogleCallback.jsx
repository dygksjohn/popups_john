import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authApi } from "./api/authApi";
import { tokenStore } from "../../../app/http/tokenStore";
import { useAuth } from "./AuthProvider";

const GOOGLE_CODE_GUARD_KEY = "google_oauth_code_guard";

const isDuplicateCode = (code) => {
  try {
    const raw = sessionStorage.getItem(GOOGLE_CODE_GUARD_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed?.code === code && Date.now() - Number(parsed?.ts || 0) < 60_000;
  } catch {
    return false;
  }
};

const markCodeGuard = (code) => {
  sessionStorage.setItem(GOOGLE_CODE_GUARD_KEY, JSON.stringify({ code, ts: Date.now() }));
};

const clearCodeGuard = (code) => {
  try {
    const raw = sessionStorage.getItem(GOOGLE_CODE_GUARD_KEY);
    if (!raw) return;
    if (JSON.parse(raw)?.code === code) sessionStorage.removeItem(GOOGLE_CODE_GUARD_KEY);
  } catch {
    sessionStorage.removeItem(GOOGLE_CODE_GUARD_KEY);
  }
};

export default function GoogleCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const redirectUri =
    import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
    `${window.location.origin}/auth/google/callback`;

  const resolvePostLoginRedirect = () => {
    const target = sessionStorage.getItem("post_login_redirect") || "/";
    return target.startsWith("/auth/") ? "/" : target;
  };

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get("code");
      const error = params.get("error");

      if (error) {
        navigate("/auth/login", { replace: true, state: { error: "구글 인증이 취소/실패했습니다." } });
        return;
      }
      if (!code) {
        navigate("/auth/login", { replace: true, state: { error: "구글 인증 code가 없습니다." } });
        return;
      }
      if (isDuplicateCode(code)) return;
      markCodeGuard(code);

      sessionStorage.removeItem("google_provider_uid");
      sessionStorage.removeItem("google_email");
      sessionStorage.removeItem("google_nickname");

      try {
        const data = await authApi.googleLogin({ code, redirectUri });

        if (!data || typeof data.newUser !== "boolean") {
          navigate("/auth/login", { replace: true, state: { error: "구글 로그인 응답이 비정상입니다." } });
          return;
        }

        // 기존 회원: 즉시 로그인
        if (!data.newUser) {
          const accessToken = data.accessToken;
          if (!accessToken) {
            navigate("/auth/login", { replace: true, state: { error: "accessToken이 없습니다." } });
            return;
          }
          tokenStore.setAccess(accessToken);
          login();
          const redirectTo = resolvePostLoginRedirect();
          sessionStorage.removeItem("post_login_redirect");
          navigate(redirectTo, { replace: true });
          return;
        }

        // 신규 회원: 구글 가입 페이지로 이동
        const uid = data.socialProviderUid ?? "";
        if (!uid) {
          navigate("/auth/login", { replace: true, state: { error: "구글 UID가 없습니다." } });
          return;
        }
        sessionStorage.setItem("google_provider_uid", uid);
        sessionStorage.setItem("google_email", data.email ?? "");
        sessionStorage.setItem("google_nickname", data.nickname ?? "");
        navigate("/auth/join/google", { replace: true });
      } catch (e) {
        clearCodeGuard(code);
        navigate("/auth/login", {
          replace: true,
          state: { error: e?.response?.data?.message ?? e?.message ?? "구글 처리 실패" },
        });
      }
    };

    run();
  }, [location.search, navigate, login]);

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "linear-gradient(135deg, #f8faf5 0%, #f0f4e8 50%, #e8edd9 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      zIndex: 99999, fontFamily: "'Pretendard Variable', 'Pretendard', -apple-system, sans-serif",
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 24,
        background: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 24, position: "relative",
      }}>
        <div style={{
          width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#90C450",
          borderRadius: "50%", animation: "gcb-spin .8s cubic-bezier(.4,0,.2,1) infinite",
        }} />
        <div style={{
          position: "absolute", inset: -4, borderRadius: 28,
          border: "2px solid transparent", borderTopColor: "rgba(144,196,80,0.2)",
          animation: "gcb-spin 2s linear infinite",
        }} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 }}>Google 로그인</div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 14, color: "#9ca3af" }}>계정을 확인하고 있어요</span>
        <span style={{ display: "inline-flex", gap: 3, marginLeft: 2 }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#90C450", animation: "gcb-dot 1.2s ease-in-out infinite" }} />
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#90C450", animation: "gcb-dot 1.2s ease-in-out 0.2s infinite" }} />
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#90C450", animation: "gcb-dot 1.2s ease-in-out 0.4s infinite" }} />
        </span>
      </div>
      <style>{`
        @keyframes gcb-spin { to { transform: rotate(360deg); } }
        @keyframes gcb-dot { 0%,80%,100% { opacity:.3; transform:scale(.8); } 40% { opacity:1; transform:scale(1.2); } }
      `}</style>
    </div>
  );
}
