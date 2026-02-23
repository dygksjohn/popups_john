import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "./api/authApi";

export default function KakaoCallback() {
  const navigate = useNavigate();
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const run = async () => {
      const code = new URLSearchParams(window.location.search).get("code");

      if (!code) {
        console.error("Kakao callback: code 없음", window.location.href);
        navigate("/auth/join/joinselect", { replace: true });
        return;
      }

      try {
        const data = await authApi.kakaoExchange({ code });
        const { providerUid, email, nickname } = data || {};

        if (!providerUid) {
          console.error("Kakao exchange 성공했는데 providerUid 없음", data);
          navigate("/auth/join/joinselect", { replace: true });
          return;
        }

        // ✅ KakaoJoin이 기대하는 키로 저장
        sessionStorage.setItem("kakao_provider_uid", providerUid);
        sessionStorage.setItem("kakao_email", email ?? "");
        sessionStorage.setItem("kakao_nickname", nickname ?? "");

        navigate("/auth/join/kakao", { replace: true });
      } catch (e) {
        console.error("exchange 실패", e);
        navigate("/auth/join/joinselect", { replace: true });
      }
    };

    run();
  }, [navigate]);

  return <div style={{ padding: 24 }}>카카오 로그인 처리중...</div>;
}