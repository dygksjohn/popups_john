import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authApi } from "./api/authApi";
import { tokenStore } from "../../../app/http/tokenStore";
import { useAuth } from "./AuthProvider";

export default function KakaoCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const didRunRef = useRef(false);

  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;

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

      try {
        const data = await authApi.kakaoLogin({ code });
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
          if (!data.accessToken) {
            navigate("/auth/login", {
              replace: true,
              state: { error: "accessToken이 없습니다." },
            });
            return;
          }
          console.log("SETTING TOKEN", data.accessToken);

          tokenStore.setAccess(data.accessToken);
          login();
          console.log(
            "AFTER LOGIN isAuthed?",
            localStorage.getItem("pupoo_access_token"),
          );

          const redirectTo =
            sessionStorage.getItem("post_login_redirect") || "/";
          sessionStorage.removeItem("post_login_redirect");
          navigate(redirectTo, { replace: true });
          return;
        }

        // ✅ 신규회원: 가입 페이지로 이동(세션 저장)
        console.log("NEW USER BRANCH");
        const uid = data.socialProviderUid ?? "";
        sessionStorage.setItem("kakao_provider_uid", uid);
        sessionStorage.setItem("kakao_email", data.email ?? "");
        sessionStorage.setItem("kakao_nickname", data.nickname ?? "");

        navigate("/auth/join/kakao", {
          replace: true,
          state: {
            signupType: "SOCIAL",
            socialProvider: "KAKAO",
            socialProviderUid: uid,
            email: data.email ?? "",
            nickname: data.nickname ?? "",
          },
        });
      } catch (e) {
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
