import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authApi } from "./api/authApi";
import { tokenStore } from "../../../app/http/tokenStore";
import { useAuth } from "./AuthProvider";
import { NaverBrandMark } from "../../../shared/ui/NaverBrandMark";

const NAVER_CODE_GUARD_KEY = "naver_oauth_code_guard";
const NAVER_STATE_KEY = "naver_oauth_state";

const isDuplicateCode = (code) => {
  try {
    const raw = sessionStorage.getItem(NAVER_CODE_GUARD_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const lastCode = parsed?.code;
    const ts = Number(parsed?.ts || 0);
    return lastCode === code && Date.now() - ts < 60_000;
  } catch {
    return false;
  }
};

const markCodeGuard = (code) => {
  sessionStorage.setItem(
    NAVER_CODE_GUARD_KEY,
    JSON.stringify({ code, ts: Date.now() }),
  );
};

const clearCodeGuard = (code) => {
  try {
    const raw = sessionStorage.getItem(NAVER_CODE_GUARD_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.code === code) {
      sessionStorage.removeItem(NAVER_CODE_GUARD_KEY);
    }
  } catch {
    sessionStorage.removeItem(NAVER_CODE_GUARD_KEY);
  }
};

export default function NaverCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const redirectUri = `${window.location.origin}/naver/callback`;

  const resolvePostLoginRedirect = () => {
    const target = sessionStorage.getItem("post_login_redirect") || "/";
    return target.startsWith("/auth/") ? "/" : target;
  };

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get("code");
      const state = params.get("state");
      const error = params.get("error");
      const storedState = sessionStorage.getItem(NAVER_STATE_KEY);

      if (error) {
        navigate("/auth/login", {
          replace: true,
          state: { error: "네이버 인증이 취소되었거나 실패했습니다." },
        });
        return;
      }

      if (!code) {
        navigate("/auth/login", {
          replace: true,
          state: { error: "네이버 인증 code가 없습니다." },
        });
        return;
      }

      if (!state || !storedState || state !== storedState) {
        navigate("/auth/login", {
          replace: true,
          state: { error: "네이버 인증 상태값이 올바르지 않습니다." },
        });
        return;
      }

      if (isDuplicateCode(code)) {
        return;
      }
      markCodeGuard(code);

      sessionStorage.removeItem("naver_provider_uid");
      sessionStorage.removeItem("naver_email");
      sessionStorage.removeItem("naver_nickname");

      try {
        const data = await authApi.naverLogin({ code, state, redirectUri });
        sessionStorage.removeItem(NAVER_STATE_KEY);

        if (!data || typeof data.newUser !== "boolean") {
          navigate("/auth/login", {
            replace: true,
            state: { error: "네이버 로그인 응답이 비정상입니다." },
          });
          return;
        }

        if (!data.newUser) {
          const accessToken = data.accessToken;
          if (!accessToken) {
            navigate("/auth/login", {
              replace: true,
              state: { error: "accessToken이 없습니다." },
            });
            return;
          }

          tokenStore.setAccess(accessToken);
          login();

          const redirectTo = resolvePostLoginRedirect();
          sessionStorage.removeItem("post_login_redirect");
          navigate(redirectTo, { replace: true });
          return;
        }

        const uid = data.socialProviderUid ?? "";
        if (!uid) {
          navigate("/auth/login", {
            replace: true,
            state: { error: "네이버 UID가 없습니다." },
          });
          return;
        }

        sessionStorage.setItem("naver_provider_uid", uid);
        sessionStorage.setItem("naver_email", data.email ?? "");
        sessionStorage.setItem("naver_nickname", data.nickname ?? "");

        tokenStore.clear();
        navigate("/auth/join/naver", { replace: true });
      } catch (e) {
        clearCodeGuard(code);
        sessionStorage.removeItem(NAVER_STATE_KEY);
        navigate("/auth/login", {
          replace: true,
          state: {
            error:
              e?.response?.data?.message ?? e?.message ?? "네이버 처리 실패",
          },
        });
      }
    };

    run();
  }, [location.search, navigate, login, redirectUri]);

  return (
    <div
      style={{
        minHeight: "50vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: 24,
      }}
    >
      <NaverBrandMark size={56} rounded={16} />
      <div style={{ fontSize: 16, fontWeight: 700, color: "#191919" }}>
        네이버 로그인 처리중...
      </div>
    </div>
  );
}
