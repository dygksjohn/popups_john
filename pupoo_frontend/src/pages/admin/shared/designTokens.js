/* ═══════════════════════════════════════════════
   디자인 토큰 — 전역 import
   ═══════════════════════════════════════════════ */
const ds = {
  bg: "#F5F5F9",
  card: "#FFFFFF",
  sidebar: "#111119",
  sideHover: "rgba(255,255,255,0.05)",
  sideActive: "rgba(255,255,255,0.09)",

  brand: "#4361EE",
  brandSoft: "#EBF0FF",
  brandDark: "#3451D1",
  green: "#22C55E",
  greenSoft: "#ECFDF5",
  red: "#EF4444",
  redSoft: "#FEF2F2",
  amber: "#F59E0B",
  amberSoft: "#FFFBEB",
  violet: "#8B5CF6",
  violetSoft: "#F3EFFE",
  sky: "#0EA5E9",
  skySoft: "#F0F9FF",

  ink: "#0F1017",
  ink2: "#3A3A4A",
  ink3: "#6B6B80",
  ink4: "#9D9DB0",
  inkW: "#FFFFFF",
  inkWD: "rgba(255,255,255,0.65)",
  inkWG: "rgba(255,255,255,0.38)",

  line: "#EBEBF0",
  lineSoft: "#F4F4F8",
  lineD: "rgba(255,255,255,0.07)",

  sh: "0 1px 3px rgba(0,0,0,0.03)",
  sh2: "0 4px 20px rgba(0,0,0,0.06)",
  sh3: "0 16px 48px rgba(0,0,0,0.1)",

  r: 14,
  rs: 8,
  rx: 18,
  ff: "'DM Sans', 'Pretendard Variable', -apple-system, 'Noto Sans KR', sans-serif",
};

export default ds;

/* 공통 카드 스타일 */
export const cardStyle = {
  background: ds.card,
  borderRadius: ds.r,
  padding: 22,
  border: `1px solid ${ds.line}`,
};

/* 상태 맵 */
export const statusMap = {
  active: { l: "진행중", c: "#059669", bg: ds.greenSoft },
  pending: { l: "대기", c: "#D97706", bg: ds.amberSoft },
  ended: { l: "종료", c: ds.ink4, bg: ds.lineSoft },
  archived: { l: "보관", c: ds.ink4, bg: ds.lineSoft },
  approved: { l: "승인", c: "#059669", bg: ds.greenSoft },
  cancelled: { l: "취소", c: ds.red, bg: ds.redSoft },
  paid: { l: "결제완료", c: "#059669", bg: ds.greenSoft },
  unpaid: { l: "미결제", c: "#D97706", bg: ds.amberSoft },
  refunded: { l: "환불", c: ds.red, bg: ds.redSoft },
  sent: { l: "발송완료", c: "#059669", bg: ds.greenSoft },
  draft: { l: "임시저장", c: "#D97706", bg: ds.amberSoft },
};

/* 혼잡도 계산 */
export const cong = (p) =>
  p >= 80
    ? { c: ds.red, bg: ds.redSoft, t: "혼잡" }
    : p >= 50
      ? { c: ds.amber, bg: ds.amberSoft, t: "보통" }
      : { c: ds.green, bg: ds.greenSoft, t: "여유" };
