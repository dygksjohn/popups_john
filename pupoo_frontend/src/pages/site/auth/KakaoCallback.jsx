import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "./api/authApi";

export default function KakaoCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (!code) {
        alert("카카오 인증 code가 없습니다.");
        navigate("/auth/join/joinselect");
        return;
      }

      try {
        // ✅ authApi는 unwrap된 "data"를 바로 반환함
        const data = await authApi.kakaoExchange({ code });

        // ✅ 방어 로직(여기서 죽지 않게)
        if (!data || !data.providerUid) {
          console.error("kakaoExchange response =", data);
          alert("카카오 인증 응답이 비정상입니다. (providerUid 없음)");
          navigate("/auth/join/joinselect");
          return;
        }

        sessionStorage.setItem("kakao_provider_uid", data.providerUid);
        sessionStorage.setItem("kakao_email", data.email ?? "");
        sessionStorage.setItem("kakao_nickname", data.nickname ?? "");

        navigate("/auth/join/kakao");
      } catch (e) {
        console.error(e);
        alert(
          e?.response?.data?.message ?? e?.message ?? "카카오 인증 처리 실패",
        );
        navigate("/auth/join/joinselect");
      }
    };

    run();
  }, [navigate]);

  return <div style={{ padding: 24 }}>카카오 로그인 처리중...</div>;
}
