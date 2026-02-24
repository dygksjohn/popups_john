import { useEffect, useRef } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { authApi } from "./api/authApi";
import { tokenStore } from "../../../app/http/tokenStore";
import { useAuth } from "./AuthProvider";

export default function KakaoCallback() {
  const location = useLocation();
  const navigate = useNavigate();

  const { login } = useAuth();
  const didRunRef = useRef(false);

  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;

    const run = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get("code");
      const error = params.get("error");

      if (error || !code) {
        navigate("/auth/join/joinselect", { replace: true });
        return;
      }

      // ✅ 이전 잔여 세션 정리(꼬임 방지)
      sessionStorage.removeItem("kakao_provider_uid");
      sessionStorage.removeItem("kakao_email");
      sessionStorage.removeItem("kakao_nickname");

      try {
        const data = await authApi.kakaoLogin({ code });

        if (!data || typeof data.newUser !== "boolean") {
          navigate("/auth/join/joinselect", { replace: true });
          return;
        }

        // ✅ 기존회원 -> 바로 로그인
        if (!data.newUser) {
          if (!data.accessToken) {
            navigate("/auth/login", { replace: true });
            return;
          }
          tokenStore.setAccess(data.accessToken);
          login();
          navigate("/", { replace: true });
          return;
        }

        // ✅ 신규회원 -> 카카오 회원가입 페이지로
        const uid = data.socialProviderUid ?? "";
        sessionStorage.setItem("kakao_provider_uid", uid);
        sessionStorage.setItem("kakao_email", data.email ?? "");
        sessionStorage.setItem("kakao_nickname", data.nickname ?? "");

        navigate("/auth/join/kakao", { replace: true });
      } catch (e) {
        navigate("/auth/join/joinselect", { replace: true });
      }
    };

    run();
  }, [location.search, navigate, login]);

  return <div style={{ padding: 24 }}>카카오 로그인 처리중...</div>;
}
