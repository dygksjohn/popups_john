import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

const navItems = [
  {
    label: "행사",
    children: [
      { name: "현재 진행 행사", path: "/event/current" },
      { name: "예정 행사", path: "/event/upcoming" },
      { name: "종료 행사", path: "/event/ended" },
      { name: "행사 사전등록", path: "/event/preregister" },
      { name: "행사 상세", path: "/event/detail" },
    ],
  },
  {
    label: "프로그램",
    children: [
      { name: "체험존", path: "/program/experience" },
      { name: "세션/강연", path: "/program/session" },
      { name: "부스 안내", path: "/program/booth" },
      { name: "콘테스트", path: "/program/contest" },
      { name: "프로그램 일정", path: "/program/schedule" },
    ],
  },
  {
    label: "참가/신청",
    children: [
      { name: "참가 신청", path: "/apply" },
      { name: "신청 내역", path: "/apply/history" },
      { name: "결제내역", path: "/apply/payment" },
      { name: "QR 체크인", path: "/apply/qr" },
    ],
  },
  {
    label: "실시간 현황",
    children: [
      { name: "체크인 현황", path: "/realtime/checkin" },
      { name: "대기 현황", path: "/realtime/waiting" },
      { name: "투표 현황", path: "/realtime/vote" },
    ],
  },
  {
    label: "커뮤니티",
    children: [
      { name: "자유게시판", path: "/community/free" },
      { name: "행사후기", path: "/community/review" },
      { name: "갤러리", path: "/community/gallery" },
    ],
  },
  {
    label: "안내",
    children: [
      { name: "플랫폼소개", path: "/info/intro" },
      { name: "공지사항", path: "/info/notice" },
      { name: "FAQ", path: "/info/faq" },
      { name: "1:1문의", path: "/info/inquiry" },
      { name: "오시는길", path: "/info/directions" },
    ],
  },
];

export default function SiteHeader() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isWhiteHeader = open || !isHome || scrolled;
  const textColor = isWhiteHeader ? "text-black" : "text-white";
  const hoverColor = isWhiteHeader ? "hover:text-gray-600" : "hover:opacity-80";

  const MENU_WIDTH = "w-[780px]";

  return (
    <>
      <header
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className={`fixed top-0 left-0 w-full z-[99999] transition-all duration-300 ${
          isWhiteHeader ? "bg-white" : "bg-transparent"
        }`}
      >
        <div className="relative flex items-center justify-between h-16 px-10">
          <Link to="/" className="flex items-center">
            <img
              src={isWhiteHeader ? "/logo_blue.png" : "/logo_white.png"}
              alt="pupoo logo"
              className="h-[24px]"
            />
          </Link>

          <nav
            className={`absolute left-1/2 -translate-x-1/2 hidden lg:block ${MENU_WIDTH}`}
          >
            <div className="grid grid-cols-6 justify-items-center">
              {navItems.map((item) => (
                <span
                  key={item.label}
                  className={`${textColor} text-sm font-medium transition ${hoverColor}`}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </nav>

          <div className="flex items-center gap-5">
            <Link
              to="/admin"
              className={`flex items-center gap-2 text-sm font-medium transition ${textColor} ${hoverColor}`}
            >
              {/* 세련된 라인형 대시보드 아이콘 */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 13h6V4H4v9zm10 7h6V4h-6v16zM4 20h6v-5H4v5z"
                />
              </svg>
              관리자
            </Link>

            <Link
              to="/login"
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition ${
                isWhiteHeader
                  ? "bg-black text-white hover:bg-gray-800"
                  : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
              }`}
            >
              참여하기
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <div
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className={`fixed top-16 left-0 w-full transition-all duration-300 overflow-hidden z-[99998] ${
          open ? "h-64 opacity-100 bg-white" : "h-0 opacity-0"
        }`}
      >
        <div className="relative px-10">
          <div className={`mx-auto ${MENU_WIDTH} pt-6 pb-6`}>
            <div className="grid grid-cols-6 justify-items-center">
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-3 text-center"
                >
                  {item.children.map((child) => (
                    <Link
                      key={child.path}
                      to={child.path}
                      className="text-sm text-gray-800 hover:text-black transition"
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
