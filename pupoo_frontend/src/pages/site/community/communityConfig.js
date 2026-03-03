export const COMMUNITY_CATEGORIES = [
  { label: "공지사항", path: "/community/notice" },
  { label: "정보게시판", path: "/community/info" },
  { label: "자유게시판", path: "/community/freeboard" },
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
    color: "#1D4ED8",
    background: "#DBEAFE",
  },
  REVIEW: {
    text: "후기",
    color: "#047857",
    background: "#D1FAE5",
  },
  QNA: {
    text: "QNA",
    color: "#C2410C",
    background: "#FFEDD5",
  },
  FAQ: {
    text: "FAQ",
    color: "#6D28D9",
    background: "#EDE9FE",
  },
  INFO: {
    text: "정보",
    color: "#0F766E",
    background: "#CCFBF1",
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
