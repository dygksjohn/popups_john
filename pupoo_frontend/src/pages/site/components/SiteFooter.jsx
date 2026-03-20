import React from "react";
import { Link } from "react-router-dom";
const NAV_LINKS = [
  { label: "개인정보처리방침", to: "/policy/privacypolicy" },
  { label: "전자금융거래 기본약관", to: "/policy/eftterms" },
  { label: "이용약관", to: "/policy/termsofservice" },
  { label: "이용안내", to: "/policy/serviceguide" },
  { label: "회사소개", to: "/policy/aboutus" },
];

const Footer = () => {
  return (
    <footer className="w-full relative z-[1000] isolate pointer-events-auto" style={{ backgroundColor: "#2a2a2a" }}>
      <div className="max-w-[1712px] mx-auto px-3 md:px-6 lg:px-10">
        {/* ── 상단: 로고 | 네비게이션 | SNS 아이콘 ── */}
        <div className="flex flex-col items-start gap-4 py-5 border-b border-[#3a3a3a] md:gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-0 lg:py-8">
          {/* 로고 */}
          <Link to="/" className="flex-shrink-0">
            <img
              src="/logo_white.png"
              alt="Pupoo"
              style={{ height: 20, width: "auto", display: "block", opacity: 0.9 }}
            />
          </Link>

          {/* 네비게이션 */}
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-[#8a8a8a] text-[12px] md:text-sm font-medium tracking-[0.04em] whitespace-nowrap transition-colors duration-200 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* SNS 아이콘 */}
          <div className="flex items-center gap-3 lg:gap-5 flex-shrink-0">
            {/* YouTube */}
            <a href="https://www.youtube.com/channel/UCmKrFZb9Dts6PyA6Wmc_zYA" target="_blank" rel="noopener noreferrer" className="block opacity-80 hover:opacity-100 transition-opacity duration-200">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                <path d="M23.498 6.186a2.994 2.994 0 0 0-2.112-2.12C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.386.52A2.994 2.994 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a2.994 2.994 0 0 0 2.112 2.12c1.881.52 9.386.52 9.386.52s7.505 0 9.386-.52a2.994 2.994 0 0 0 2.112-2.12C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.546 15.568V8.432L15.818 12l-6.272 3.568z" />
              </svg>
            </a>
            {/* X (Twitter) */}
            <a href="https://x.com/pupoo_company" target="_blank" rel="noopener noreferrer" className="block opacity-80 hover:opacity-100 transition-opacity duration-200">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            {/* Instagram */}
            <a href="https://www.instagram.com/pupoo_company/" target="_blank" rel="noopener noreferrer" className="block opacity-80 hover:opacity-100 transition-opacity duration-200">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.088 4.088 0 0 1 1.523.99 4.088 4.088 0 0 1 .99 1.524c.163.46.349 1.26.403 2.43.058 1.265.07 1.645.07 4.849s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.43a4.088 4.088 0 0 1-.99 1.523 4.088 4.088 0 0 1-1.524.99c-.46.163-1.26.349-2.43.403-1.265.058-1.645.07-4.849.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.403a4.088 4.088 0 0 1-1.523-.99 4.088 4.088 0 0 1-.99-1.524c-.163-.46-.349-1.26-.403-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.43a4.088 4.088 0 0 1 .99-1.523A4.088 4.088 0 0 1 5.15 2.207c.46-.163 1.26-.349 2.43-.403C8.845 2.175 9.225 2.163 12 2.163zm0-2.163C8.741 0 8.333.014 7.053.072 5.775.13 4.902.333 4.14.63a6.21 6.21 0 0 0-2.245 1.462A6.21 6.21 0 0 0 .433 4.337C.136 5.1-.067 5.973-.125 7.25-.183 8.53-.197 8.939-.197 12.197s.014 3.668.072 4.948c.058 1.277.261 2.15.558 2.913a6.21 6.21 0 0 0 1.462 2.245 6.21 6.21 0 0 0 2.245 1.462c.763.297 1.636.5 2.913.558C8.333 24.383 8.741 24.397 12 24.397s3.668-.014 4.948-.072c1.277-.058 2.15-.261 2.913-.558a6.21 6.21 0 0 0 2.245-1.462 6.21 6.21 0 0 0 1.462-2.245c.297-.763.5-1.636.558-2.913.058-1.28.072-1.688.072-4.948s-.014-3.668-.072-4.948c-.058-1.277-.261-2.15-.558-2.913a6.21 6.21 0 0 0-1.462-2.245A6.21 6.21 0 0 0 19.86.63C19.1.333 18.225.13 16.948.072 15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
              </svg>
            </a>
          </div>
        </div>

        {/* ── 하단: 저작권 + 회사정보 (좌) ── */}
        <div className="flex items-start justify-between py-5 lg:py-8">
          <div className="text-[#666] text-[11px] sm:text-sm leading-relaxed space-y-1">
            <div>© {new Date().getFullYear()} pupoo. All rights reserved.</div>
            <div>(주)푸푸컴퍼니 서울특별시 서초구 강남대로 405 통영빌딩 8층</div>
            <div>본 서비스는 프로젝트용으로 제작되었습니다. 대표이사 : 홍길동</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
