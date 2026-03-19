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
    // 기능: 같은 인가 코드로 callback effect가 중복 실행되는 상황만 짧게 막는다.
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

  // 기능: 카카오 로그인 성공 후에도 사용자가 원래 가려던 화면으로 복귀시킨다.
  const resolvePostLoginRedirect = () => {
    const target = sessionStorage.getItem("post_login_redirect") || "/";
    return target.startsWith("/auth/") ? "/" : target;
  };

  useEffect(() => {
    // 기능: 카카오 callback 페이지는 인가 코드를 받아 기존회원 로그인과 신규회원 가입 분기를 처리한다.
    // 설명: callback 진입 한 번으로 토큰 저장 또는 가입용 세션 저장까지 끝내고, 이후 화면을 각각 다른 페이지로 보낸다.
    // 흐름: code 확인 -> kakaoLogin API 호출 -> 기존회원은 로그인 완료, 신규회원은 가입 폼 이동.
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

      if (isDuplicateCode(code)) {
        return;
      }
      markCodeGuard(code);

      // 기능: 새 카카오 callback을 시작할 때 이전 가입 중간 상태를 먼저 비운다.
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

        // 기능: 기존회원이면 access token 저장 후 일반 로그인과 같은 상태를 만든다.
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

        // 기능: 신규회원이면 callback에서 받은 식별자만 저장하고 가입 화면으로 넘긴다.
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
