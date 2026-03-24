import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { tokenStore } from "../../../../app/http/tokenStore";
import { NaverBrandMark } from "../../../../shared/ui/NaverBrandMark";

const KakaoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.748 1.67 5.16 4.2 6.624L5.1 21l4.62-2.4A11.4 11.4 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.677 32.91 29.243 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.061 0 5.854 1.154 7.97 3.042l5.657-5.657C34.046 6.053 29.27 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.061 0 5.854 1.154 7.97 3.042l5.657-5.657C34.046 6.053 29.27 4 24 4c-7.732 0-14.41 4.386-17.694 10.691z" />
    <path fill="#4CAF50" d="M24 44c5.184 0 9.88-1.977 13.409-5.193l-6.191-5.238C29.211 35.091 26.715 36 24 36c-5.217 0-9.645-3.063-11.273-7.484l-6.525 5.03C9.435 39.556 16.216 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.056 2.89-3.207 5.259-6.085 6.57l.003-.002 6.191 5.238C36.973 37.342 44 31.245 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
);

const socialProviders = [
  { id: "kakao", label: "카카오", bg: "#FEE500", color: "#191919", hoverBg: "#e6cf00", icon: KakaoIcon, ready: true },
  { id: "google", label: "구글", bg: "#fff", color: "#202124", hoverBg: "#f3f4f6", border: "1px solid #ddd", icon: GoogleIcon, ready: false },
  { id: "naver", label: "네이버 아이디", bg: "#03C75A", color: "#fff", hoverBg: "#02b350", icon: null, ready: true },
];

const css = `
  .js-outer {
    min-height: calc(100vh - 140px);
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f6fa;
    padding: 92px 0 0;
    font-family: 'Pretendard','Apple SD Gothic Neo','Noto Sans KR',sans-serif;
  }
  .js-card {
    background: #fff;
    border-radius: 20px;
    padding: 36px 36px 32px;
    width: 100%;
    max-width: 440px;
    box-shadow: 0 4px 24px rgba(0,0,0,.06);
    text-align: center;
    position: relative;
  }
  .js-desc {
    font-size: 14px;
    color: #999;
    margin-bottom: 28px;
    line-height: 1.5;
  }
  .js-btn {
    width: 100%;
    height: 54px;
    border-radius: 12px;
    border: none;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: background .15s, box-shadow .15s;
  }
  .js-btn:active { transform: scale(0.98); }
  .js-btn-normal {
    background: #6c5ce7;
    border: none;
    color: #fff;
    margin-bottom: 14px;
    font-size: 16px;
    height: 56px;
    box-shadow: 0 3px 16px rgba(108,92,231,.3);
  }
  .js-btn-normal:hover { background: #5a4bd6; box-shadow: 0 4px 20px rgba(108,92,231,.4); }
  .js-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 4px 0 16px;
    font-size: 12px;
    color: #bbb;
  }
  .js-divider::before, .js-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #eee;
  }
  .js-social-row { display: flex; flex-direction: column; gap: 8px; }
  .js-social-btn.coming-soon {
    opacity: 0.35;
    cursor: pointer;
    filter: grayscale(0.7);
  }
  .js-social-btn.coming-soon:hover { opacity: 0.5; }
  .js-login-link {
    margin-top: 20px;
    font-size: 13px;
    color: #aaa;
  }
  .js-login-link a {
    color: #6c5ce7;
    font-weight: 600;
    text-decoration: none;
    margin-left: 4px;
  }
  .js-login-link a:hover { text-decoration: underline; }
  .js-toast {
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    color: #333;
    font-size: 14px;
    font-weight: 600;
    padding: 14px 32px;
    border-radius: 14px;
    border: 1px solid #e8e8e8;
    box-shadow: 0 8px 32px rgba(0,0,0,.12);
    animation: js-toast-in .3s ease, js-toast-out .3s ease 2s forwards;
    z-index: 9999;
  }
  @keyframes js-toast-in {
    from { opacity: 0; transform: translateX(-50%) translateY(16px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes js-toast-out {
    from { opacity: 1; }
    to { opacity: 0; transform: translateX(-50%) translateY(16px); }
  }
`;

export default function JoinSelect() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2300);
    return () => clearTimeout(t);
  }, [toast]);

  const defaultKakaoRedirectUri = `${window.location.origin}/auth/kakao/callback`;
  const KAKAO_REST_KEY = import.meta.env.VITE_KAKAO_REST_KEY;
  const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI || defaultKakaoRedirectUri;
  const defaultNaverRedirectUri = `${window.location.origin}/naver/callback`;
  const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID;
  const NAVER_REDIRECT_URI = import.meta.env.VITE_NAVER_REDIRECT_URI || defaultNaverRedirectUri;

  const handleKakaoContinue = () => {
    tokenStore.clear();
    sessionStorage.removeItem("kakao_auth_code");
    sessionStorage.removeItem("kakao_oauth_code_guard");
    sessionStorage.removeItem("kakao_provider_uid");
    sessionStorage.removeItem("kakao_email");
    sessionStorage.removeItem("kakao_nickname");
    if (!KAKAO_REST_KEY) {
      alert("VITE_KAKAO_REST_KEY가 설정되지 않았습니다.");
      return;
    }
    const params = new URLSearchParams({
      response_type: "code",
      client_id: KAKAO_REST_KEY,
      redirect_uri: KAKAO_REDIRECT_URI,
      through_account: "true",
      prompt: "login",
    });
    const authorizeUrl = `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
    window.location.href = `https://accounts.kakao.com/login/?login_type=normal&continue=${encodeURIComponent(authorizeUrl)}`;
  };

  const handleNaverContinue = () => {
    tokenStore.clear();
    sessionStorage.removeItem("naver_provider_uid");
    sessionStorage.removeItem("naver_email");
    sessionStorage.removeItem("naver_nickname");
    if (!NAVER_CLIENT_ID) {
      alert("VITE_NAVER_CLIENT_ID가 설정되지 않았습니다.");
      return;
    }
    const state = `${crypto.randomUUID()}${Date.now()}`;
    sessionStorage.setItem("naver_oauth_state", state);
    const params = new URLSearchParams({
      response_type: "code",
      client_id: NAVER_CLIENT_ID,
      redirect_uri: NAVER_REDIRECT_URI,
      state,
    });
    window.location.href = `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
  };

  const handleSocialClick = (provider) => {
    if (provider.id === "kakao") return handleKakaoContinue();
    if (provider.id === "naver") return handleNaverContinue();
    setToast(`${provider.label} 로그인은 곧 지원될 예정이에요`);
  };

  return (
    <>
      <style>{css}</style>
      <div className="js-outer">
        <div className="js-card">
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: "#1a1a1a", marginBottom: 24 }}>
            회원가입
          </div>
          <p className="js-desc">반려생활과 연결되는 계정 경험, 지금 시작해 보세요.</p>

          <button className="js-btn js-btn-normal" onClick={() => navigate("/auth/join/joinnormal")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 4L12 13 2 4" />
            </svg>
            이메일로 시작하기
          </button>

          <div className="js-divider">또는</div>

          <div className="js-social-row">
            {socialProviders.map((provider) => {
              const Icon = provider.icon;
              return (
                <button
                  key={provider.id}
                  className={`js-btn js-social-btn${provider.ready ? "" : " coming-soon"}`}
                  onClick={() => handleSocialClick(provider)}
                  onMouseEnter={() => provider.ready && setHovered(provider.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: hovered === provider.id ? provider.hoverBg : provider.bg,
                    color: provider.color,
                    border: provider.border || "none",
                  }}
                >
                  {provider.id === "naver" ? (
                    <NaverBrandMark
                      size={20}
                      rounded={4}
                      background="#FFFFFF"
                      color="#03C75A"
                    />
                  ) : (
                    <Icon />
                  )}
                  {provider.id === "naver"
                    ? "네이버로 계속하기"
                    : `${provider.label}로 계속하기`}
                </button>
              );
            })}
          </div>

          <div className="js-login-link">
            이미 계정이 있으신가요?<a href="/auth/login">로그인</a>
          </div>
        </div>
      </div>

      {toast && <div className="js-toast">{toast}</div>}
    </>
  );
}
