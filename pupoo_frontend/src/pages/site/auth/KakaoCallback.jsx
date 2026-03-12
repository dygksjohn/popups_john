import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authApi } from "./api/authApi";
import { tokenStore } from "../../../app/http/tokenStore";
import { useAuth } from "./AuthProvider";

const KAKAO_CODE_GUARD_KEY = "kakao_oauth_code_guard";

const isDuplicateCode = (code) => {
  try {
    const raw = sessionStorage.getItem(KAKAO_CODE_GUARD_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const lastCode = parsed?.code;
    const ts = Number(parsed?.ts || 0);
    // StrictMode/중복 렌더 구간에서만 막고, 일정 시간이 지나면 다시 허용
    return lastCode === code && Date.now() - ts < 60_000;
  } catch {
    return false;
  }
};

const markCodeGuard = (code) => {
  sessionStorage.setItem(
    KAKAO_CODE_GUARD_KEY,
    JSON.stringify({ code, ts: Date.now() }),
  );
};

const clearCodeGuard = (code) => {
  try {
    const raw = sessionStorage.getItem(KAKAO_CODE_GUARD_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.code === code) {
      sessionStorage.removeItem(KAKAO_CODE_GUARD_KEY);
    }
  } catch {
    sessionStorage.removeItem(KAKAO_CODE_GUARD_KEY);
  }
};

export default function KakaoCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const redirectUri =
    import.meta.env.VITE_KAKAO_REDIRECT_URI ||
    `${window.location.origin}/auth/kakao/callback`;
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
        navigate("/auth/login", {
          replace: true,
          state: { error: "카카오 인증이 취소/실패했습니다." },
        });
        return;
      }

      if (!code) {
        navigate("/auth/login", {
          replace: true,
          state: { error: "카카오 인증 code가 없습니다." },
        });
        return;
      }

      // 개발 StrictMode에서 callback effect가 중복 실행되어
      // 같은 인가코드(code)로 로그인 API가 2회 호출되는 문제를 방지한다.
      if (isDuplicateCode(code)) {
        return;
      }
      markCodeGuard(code);

      // ✅ 이전 카카오 가입 세션 값 초기화(꼬임 방지)
      sessionStorage.removeItem("kakao_provider_uid");
      sessionStorage.removeItem("kakao_email");
      sessionStorage.removeItem("kakao_nickname");

      try {
        const data = await authApi.kakaoLogin({ code, redirectUri });
        console.log("KAKAO RESPONSE", data);

        if (!data || typeof data.newUser !== "boolean") {
          navigate("/auth/login", {
            replace: true,
            state: { error: "카카오 로그인 응답이 비정상입니다." },
          });
          return;
        }

        // ✅ 기존회원: 즉시 로그인
        if (!data.newUser) {
          console.log("EXISTING USER BRANCH");

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

        // ✅ 신규회원: 카카오 가입 페이지로 이동 (정책 A: 이메일이 없으면 KakaoJoin에서 직접 입력)
        console.log("NEW USER BRANCH");

        const uid = data.socialProviderUid ?? "";
        if (!uid) {
          navigate("/auth/login", {
            replace: true,
            state: { error: "카카오 UID가 없습니다." },
          });
          return;
        }

        sessionStorage.setItem("kakao_provider_uid", uid);
        sessionStorage.setItem("kakao_email", data.email ?? "");
        sessionStorage.setItem("kakao_nickname", data.nickname ?? "");

        navigate("/auth/join/kakao", { replace: true });
      } catch (e) {
        clearCodeGuard(code);
        navigate("/auth/login", {
          replace: true,
          state: {
            error:
              e?.response?.data?.message ?? e?.message ?? "카카오 처리 실패",
          },
        });
      }
    };

    run();
  }, [location.search, navigate, login]);

  return <div style={{ padding: 24 }}>카카오 로그인 처리중...</div>;
}
