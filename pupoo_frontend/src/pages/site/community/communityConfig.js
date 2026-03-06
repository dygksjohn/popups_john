export const COMMUNITY_CATEGORIES = [
  { label: "공지사항", path: "/community/notice" },
  { label: "자유게시판", path: "/community/freeboard" },
  { label: "정보게시판", path: "/community/info" },
  { label: "행사후기", path: "/community/review" },
  { label: "질문/답변", path: "/community/qna" },
  { label: "자주묻는질문", path: "/community/faq" },
];

const BADGE_BASE_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "3px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1,
  flexShrink: 0,
};

export const BOARD_BADGES = {
  NOTICE: {
    text: "공지",
    color: "#DC2626",
    background: "#FEE2E2",
  },
  FREEBOARD: {
    text: "자유",
    color: "#2563EB",
    background: "#DBEAFE",
  },
  REVIEW: {
    text: "후기",
    color: "#16A34A",
    background: "#DCFCE7",
  },
  QNA: {
    text: "QNA",
    color: "#D97706",
    background: "#FEF3C7",
  },
  FAQ: {
    text: "FAQ",
    color: "#9333EA",
    background: "#F3E8FF",
  },
  INFO: {
    text: "정보",
    color: "#0369A1",
    background: "#E0F2FE",
  },
};

export const NOTICE_SCOPE_BADGES = {
  GLOBAL: {
    label: "전체 공지",
    compactLabel: "전체",
    color: "#1d4ed8",
    background: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  EVENT: {
    label: "행사 공지",
    compactLabel: "행사",
    color: "#b45309",
    background: "#fff7ed",
    borderColor: "#fdba74",
  },
};

export function getBoardBadge(type) {
  const badge = BOARD_BADGES[type] || BOARD_BADGES.INFO;
  return {
    text: badge.text,
    style: {
      ...BADGE_BASE_STYLE,
      color: badge.color,
      background: badge.background,
    },
  };
}

export function getNoticeScopeBadge(scope) {
  const normalized = String(scope || "").toUpperCase();
  if (normalized === "EVENT") {
    return NOTICE_SCOPE_BADGES.EVENT;
  }
  return NOTICE_SCOPE_BADGES.GLOBAL;
}
