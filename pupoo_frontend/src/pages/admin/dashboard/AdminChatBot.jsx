import { useEffect, useRef, useState, useCallback } from "react";
import { X, Send, RotateCcw, Minus } from "lucide-react";
import Lottie from "lottie-react";
import ds from "../shared/designTokens";
import { useChatBot } from "./useChatBot";

/* ============================================================
   AdminChatBot — 프리미엄 플로팅 챗봇 + 캐릭터 애니메이션
   ============================================================ */

const chatStyles = `
@keyframes chatSlideUp {
  from { opacity: 0; transform: translateY(24px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes msgPop {
  from { opacity: 0; transform: translateY(10px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes dotWave {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.25; }
  30%           { transform: translateY(-6px); opacity: 1; }
}
@keyframes softBounce {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25%      { transform: translateY(-4px) rotate(-2deg); }
  75%      { transform: translateY(-2px) rotate(2deg); }
}
@keyframes popIn {
  from { transform: scale(0.4) translateY(10px); opacity: 0; }
  to   { transform: scale(1) translateY(0); opacity: 1; }
}
@keyframes bubblePop {
  0%   { transform: scale(0) translateY(4px); opacity: 0; }
  60%  { transform: scale(1.1) translateY(0); opacity: 1; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
@keyframes bubbleOut {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 0; transform: scale(0.8) translateY(-4px); }
}

/* 캐릭터 애니메이션들 */
@keyframes dogIdle {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-2px); }
}
@keyframes dogWag {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  15%      { transform: translateY(-3px) rotate(-3deg); }
  30%      { transform: translateY(0) rotate(3deg); }
  45%      { transform: translateY(-3px) rotate(-3deg); }
  60%      { transform: translateY(0) rotate(3deg); }
  75%      { transform: translateY(-2px) rotate(-2deg); }
}
@keyframes dogJump {
  0%   { transform: translateY(0) scale(1, 1); }
  20%  { transform: translateY(2px) scale(1.05, 0.92); }
  50%  { transform: translateY(-18px) scale(0.95, 1.08); }
  70%  { transform: translateY(-18px) scale(0.95, 1.08); }
  85%  { transform: translateY(2px) scale(1.06, 0.9); }
  100% { transform: translateY(0) scale(1, 1); }
}
@keyframes dogBark {
  0%   { transform: translateY(0) scale(1); }
  12%  { transform: translateY(-4px) scale(1.05); }
  24%  { transform: translateY(0) scale(1); }
  36%  { transform: translateY(-4px) scale(1.05); }
  48%  { transform: translateY(0) scale(1); }
  100% { transform: translateY(0) scale(1); }
}
@keyframes dogSleep {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(1px) rotate(2deg); }
}
@keyframes dogLook {
  0%, 100% { transform: translateX(0); }
  25%      { transform: translateX(-4px); }
  75%      { transform: translateX(4px); }
}
@keyframes tailWag {
  0%, 100% { transform: rotate(-10deg); }
  50%      { transform: rotate(25deg); }
}
@keyframes earFlop {
  0%, 100% { transform: rotate(0deg); }
  40%      { transform: rotate(-8deg); }
  60%      { transform: rotate(5deg); }
}
@keyframes zzz {
  0%   { opacity: 0; transform: translate(0, 0) scale(0.6); }
  30%  { opacity: 1; transform: translate(-4px, -8px) scale(0.8); }
  70%  { opacity: 1; transform: translate(-8px, -16px) scale(1); }
  100% { opacity: 0; transform: translate(-12px, -24px) scale(1.1); }
}
@keyframes blink {
  0%, 42%, 46%, 100% { transform: scaleY(1); }
  44% { transform: scaleY(0.1); }
}

@keyframes recBlink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.2; }
}
.cb-msg    { animation: msgPop .3s cubic-bezier(.34,1.4,.64,1); }
.cb-panel::-webkit-scrollbar { width: 4px; }
.cb-panel::-webkit-scrollbar-track { background: transparent; }
.cb-panel::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
`;

const fmt = (d) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/* ── 상태별 메시지 ── */
const STATE_BUBBLES = {
  bark: ["멍멍!", "왈왈!", "멍!"],
  wag: ["반가워요!", "좋은 하루!", "도와줄까요?"],
  jump: ["신난다!", "야호!"],
  look: ["뭐 하고 있어요?", "궁금한 거 있어요?"],
  sleep: ["zzZ..."],
};

/* ══════════════════════════════════════════════
   인터랙티브 강아지 캐릭터 (Lottie 애니메이션)
   - 평소: 걸어다니는 애니메이션
   - hover: 멈추고 말풍선 ("클릭해봐요!")
   - leave: 다시 걷기
   ══════════════════════════════════════════════ */
function DogCharacter({ onClick, mobile = false, rightStyle, shiftTransition }) {
  const [hovered, setHovered] = useState(false);
  const [bubble, setBubble] = useState(null);
  const [bubbleAnim, setBubbleAnim] = useState("bubblePop");
  const [animData, setAnimData] = useState(null);
  const lottieRef = useRef(null);
  const bubbleTimerRef = useRef(null);
  const idleBubbleRef = useRef(null);

  // Lottie JSON 로드
  useEffect(() => {
    fetch("/dog-lottie.json")
      .then((r) => r.json())
      .then(setAnimData)
      .catch(() => {});
  }, []);

  // 가끔 혼자 말풍선 띄우기 (걷는 중에)
  useEffect(() => {
    const msgs = [
      "안녕! 나는 누리야~ 🐾",
      "누리가 도와줄까요? 멍! 🐶",
      "심심한데 얘기할까요? 왈왈!",
      "오늘 행사는 잘 되고 있어요~?",
      "뭐든 물어봐도 돼요! 누리가 척척! ✨",
      "누리한테 맡겨주세요~ 💪",
      "같이 일하면 더 빠르죠! 헤헤 ⚡",
      "혹시 궁금한 거 없어요~? 🐕",
      "클릭하면 누리랑 대화할 수 있어요!",
      "누리 여기 있어요~ 불러주세요! 🙋",
      "행사 관리? 누리가 최고라구요! 🏆",
      "멍멍! 오늘도 힘내세요~! 💛",
    ];
    const tick = () => {
      if (!hovered) {
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        setBubbleAnim("bubblePop");
        setBubble(msg);
        clearTimeout(bubbleTimerRef.current);
        bubbleTimerRef.current = setTimeout(() => {
          setBubbleAnim("bubbleOut");
          setTimeout(() => setBubble(null), 300);
        }, 2000);
      }
      idleBubbleRef.current = setTimeout(tick, 5000 + Math.random() * 4000);
    };
    idleBubbleRef.current = setTimeout(tick, 3000 + Math.random() * 3000);
    return () => {
      clearTimeout(idleBubbleRef.current);
      clearTimeout(bubbleTimerRef.current);
    };
  }, [hovered]);

  const handleMouseEnter = () => {
    if (mobile) return;
    setHovered(true);
    // 멈추기
    if (lottieRef.current) lottieRef.current.pause();
    // 말풍선
    clearTimeout(bubbleTimerRef.current);
    setBubbleAnim("bubblePop");
    setBubble("누리랑 얘기해요! 💬");
  };

  const handleMouseLeave = () => {
    if (mobile) return;
    setHovered(false);
    // 다시 걷기
    if (lottieRef.current) lottieRef.current.play();
    // 말풍선 사라지기
    setBubbleAnim("bubbleOut");
    bubbleTimerRef.current = setTimeout(() => setBubble(null), 300);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: mobile ? "calc(env(safe-area-inset-bottom, 0px) + 76px)" : 12,
        right:
          rightStyle ??
          (mobile ? "calc(10px + var(--admin-board-panel-offset, 0px))" : "calc(14px + var(--admin-board-panel-offset, 0px))"),
        zIndex: 10000,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transition: shiftTransition,
      }}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 말풍선 */}
      {!mobile && bubble && (
        <div
          style={{
            position: "absolute",
            bottom: mobile ? 84 : 164,
            left: mobile ? 2 : 20,
            animation: `${bubbleAnim} 0.35s cubic-bezier(.34,1.4,.64,1) forwards`,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{
            background: "#fff",
            color: "#374151",
            fontSize: mobile ? 10.5 : 12.5,
            fontWeight: 600,
            fontFamily: ds.ff,
            padding: mobile ? "5px 10px" : "7px 14px",
            borderRadius: 14,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
            maxWidth: mobile ? 118 : 180,
            textAlign: "center",
            wordBreak: "keep-all",
            lineHeight: 1.4,
          }}>
            {bubble}
          </div>
          {/* 가운데 꼬리 삼각형 */}
          <div style={{
            width: 0, height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "7px solid #fff",
            marginTop: -1,
            filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.06))",
          }} />
        </div>
      )}

      {/* 캐릭터 본체 — Lottie 애니메이션 (좌우 반전 = 반대쪽으로 걷기) */}
      <div
        style={{
          width: mobile ? 78 : 180,
          height: mobile ? 78 : 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          filter: mobile ? "drop-shadow(0 3px 10px rgba(0,0,0,0.1))" : "drop-shadow(0 4px 14px rgba(0,0,0,0.12))",
          transition: "transform 0.3s ease",
          transform: hovered ? "scaleX(-1) scale(1.1)" : "scaleX(-1)",
          opacity: mobile ? 0.92 : 1,
        }}
      >
        {animData ? (
          <Lottie
            lottieRef={lottieRef}
            animationData={animData}
            loop
            autoplay
            style={{
              width: mobile ? 92 : 210,
              height: mobile ? 92 : 210,
            }}
          />
        ) : (
          <div style={{ width: mobile ? 92 : 210, height: mobile ? 92 : 210 }} />
        )}
      </div>

      {/* ── 채팅 받침대 ── */}
      <div style={{
        marginTop: mobile ? -10 : -28,
        background: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
        borderRadius: 14,
        padding: mobile ? "4px 9px 5px" : "7px 18px 8px",
        display: "flex",
        alignItems: "center",
        gap: mobile ? 6 : 8,
        boxShadow: mobile ? "0 3px 10px rgba(255,107,107,0.22), 0 1px 2px rgba(0,0,0,0.08)" : "0 4px 16px rgba(255,107,107,0.35), 0 1px 3px rgba(0,0,0,0.1)",
        position: "relative",
        transition: "transform .2s, box-shadow .2s",
        transform: hovered ? "scale(1.05)" : "scale(1)",
      }}>
        {/* 녹화 스타일 깜박이는 초록 점 */}
        <div style={{
          width: mobile ? 6 : 8,
          height: mobile ? 6 : 8,
          borderRadius: "50%",
          background: "#4ADE80",
          boxShadow: "0 0 6px rgba(74,222,128,0.7)",
          animation: "recBlink 1.5s ease-in-out infinite",
          flexShrink: 0,
        }} />
        {!mobile ? (
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
            fontFamily: ds.ff,
            letterSpacing: -0.2,
          }}>
            AI 멍비서
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   채팅 패널 내부 컴포넌트
   ══════════════════════════════════════════════ */

function MiniDogLottie({ size = 28 }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch("/dog-lottie.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(140deg, #FF6B6B 0%, #FF8E53 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, boxShadow: "0 2px 8px rgba(255,107,107,0.25)",
      overflow: "hidden",
    }}>
      {data ? (
        <Lottie animationData={data} loop autoplay style={{ width: size * 1.4, height: size * 1.4 }} />
      ) : (
        <span style={{ fontSize: size * 0.5 }}>🐕</span>
      )}
    </div>
  );
}

function BotAvatar({ size = 28 }) {
  return <MiniDogLottie size={size} />;
}

function executeLabel(confirmation) {
  const executeType = confirmation?.executeType || confirmation?.type;
  const labels = {
    SAVE_NOTICE: "공지 저장",
    SEND_NOTIFICATION_DRAFT: "저장된 초안 발송",
    SEND_EVENT_NOTIFICATION: "이벤트 알림 발송",
    SEND_BROADCAST_NOTIFICATION: "전체 알림 발송",
  };
  return labels[executeType] || "확인 후 실행";
}

function executeActionLabel(confirmation) {
  const actionKey = confirmation?.actionKey;
  const executeType = confirmation?.executeType || confirmation?.type;
  const actionLabels = {
    notice_create: "공지 저장",
    notice_update: "공지 수정 저장",
    notice_hide: "공지 숨김",
    notification_draft_delete: "알림 초안 삭제",
    notification_draft_send: "저장된 초안 발송",
    notification_event_send: "이벤트 알림 발송",
    notification_broadcast_send: "전체 알림 발송",
  };
  const executeLabels = {
    SAVE_NOTICE: "공지 저장",
    SEND_NOTIFICATION_DRAFT: "저장된 초안 발송",
    SEND_EVENT_NOTIFICATION: "이벤트 알림 발송",
    SEND_BROADCAST_NOTIFICATION: "전체 알림 발송",
  };
  return actionLabels[actionKey] || executeLabels[executeType] || "확인 후 실행";
}

function buildActionPayloadSummary(actionKey, payload) {
  if (!payload) return [];
  const summaries = [];

  if (actionKey?.startsWith("notice")) {
    if (payload.noticeId) summaries.push(`공지 ID ${payload.noticeId}`);
    if (payload.status) summaries.push(`상태 ${payload.status}`);
  }
  if (actionKey?.startsWith("notification")) {
    if (payload.notificationId) summaries.push(`알림 ID ${payload.notificationId}`);
    if (payload.eventId) summaries.push(`행사 ID ${payload.eventId}`);
    if (payload.targetType) summaries.push(`대상 ${payload.targetType}`);
    if (payload.targetId != null) summaries.push(`대상 ID ${payload.targetId}`);
  }
  if (payload.title) summaries.push(`제목 ${payload.title}`);

  return summaries;
}

function summaryTitle(summaryType) {
  const titles = {
    congestion: "혼잡도 요약",
    applicants: "신청자 수 요약",
    refund: "환불 현황 요약",
    notices: "공지 운영 현황",
    notifications: "알림 운영 현황",
  };
  return titles[summaryType] || "요약";
}

function renderSummaryGrid(items, summaryType, mobile = false) {
  if (!items?.length) return null;
  return (
    <div
      style={{
        marginTop: 8,
        width: "100%",
        display: "grid",
        gridTemplateColumns: mobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
        gap: 8,
      }}
    >
      {items.map((item) => (
        <div
          key={`${summaryType}-${item.label}`}
          style={{
            background: "#F9FAFB",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            padding: "10px 12px",
          }}
        >
          <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>{item.label}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1F2937" }}>
            {item.value}
            {item.meta != null ? ` / ${item.meta}` : ""}
          </div>
        </div>
      ))}
    </div>
  );
}

function SummaryCard({ summary, mobile = false }) {
  if (!summary?.items?.length) return null;
  return (
    <div
      style={{
        marginTop: 8,
        width: "100%",
        display: "grid",
        gridTemplateColumns: mobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
        gap: 8,
      }}
    >
      {summary.items.map((item) => (
        <div
          key={`${summary.summaryType}-${item.label}`}
          style={{
            background: "#F9FAFB",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            padding: "10px 12px",
          }}
        >
          <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>{item.label}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1F2937" }}>
            {item.value}
            {item.meta != null ? ` · ${item.meta}` : ""}
          </div>
        </div>
      ))}
    </div>
  );
}

function UnsupportedCard({ messageType, executionInfo, mobile = false }) {
  if (messageType !== "unsupported" && !executionInfo) return null;

  const supported = executionInfo?.supported;
  const reason =
    executionInfo?.reason ||
    (supported === false ? "현재 요청한 동작은 backend 계약 기준으로 실행할 수 없습니다." : null);

  return (
    <div
      style={{
        marginTop: 8,
        width: "100%",
        padding: mobile ? "10px 12px" : "12px 14px",
        borderRadius: 12,
        background: "#FEF2F2",
        border: "1px solid #FECACA",
      }}
    >
      <div style={{ fontSize: 11.5, color: "#B91C1C", fontWeight: 700, marginBottom: 6 }}>
        미지원 또는 제한 사항
      </div>
      <div style={{ fontSize: 12.5, color: "#7F1D1D", lineHeight: 1.55 }}>
        {reason || "현재 요청은 안내만 가능하며 실행 버튼은 제공되지 않습니다."}
      </div>
    </div>
  );
}

function ConfirmCard({ confirmation, onConfirm, mobile = false }) {
  if (!confirmation) return null;
  return (
    <div
      style={{
        marginTop: 8,
        width: "100%",
        padding: mobile ? "10px 12px" : "12px 14px",
        borderRadius: 12,
        background: "#FFF7ED",
        border: "1px solid #FED7AA",
      }}
    >
      <div style={{ fontSize: 11.5, color: "#9A3412", fontWeight: 700, marginBottom: 8 }}>
        확인 후 실행
      </div>
      <button
        type="button"
        onClick={onConfirm}
        style={{
          width: "100%",
          border: "none",
          borderRadius: 10,
          background: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
          color: "#fff",
          padding: "10px 12px",
          fontSize: 12.5,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: ds.ff,
        }}
      >
        확인하고 실행
      </button>
    </div>
  );
}

function ActionSummaryCard({ summary, mobile = false }) {
  if (!summary?.items?.length && !summary?.sections?.length) return null;

  return (
    <div
      style={{
        marginTop: 8,
        width: "100%",
        padding: mobile ? "10px 12px" : "12px 14px",
        borderRadius: 14,
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        display: "grid",
        gap: 10,
      }}
    >
      <div>
        <div style={{ fontSize: 11.5, color: "#6B7280", fontWeight: 700, marginBottom: 4 }}>
          {summaryTitle(summary.summaryType)}
        </div>
        <div style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.55 }}>
          {summary.summaryType === "applicants"
            ? "행사 신청과 프로그램 신청 현황을 함께 정리했습니다."
            : "운영 현황을 바로 확인할 수 있도록 주요 수치를 정리했습니다."}
        </div>
      </div>
      {renderSummaryGrid(summary.items, summary.summaryType, mobile)}
      {summary?.sections?.length
        ? summary.sections.map((section) => (
            <div
              key={section.key}
              style={{
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                padding: "12px",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                {section.title}
              </div>
              {renderSummaryGrid(section.items, `${summary.summaryType}-${section.key}`, mobile)}
            </div>
          ))
        : null}
    </div>
  );
}

function ActionUnsupportedCard({ messageType, executionInfo, mobile = false }) {
  const isUnsupported = messageType === "unsupported" || executionInfo?.supported === false;
  if (!isUnsupported) return null;

  return (
    <div
      style={{
        marginTop: 8,
        width: "100%",
        padding: mobile ? "10px 12px" : "12px 14px",
        borderRadius: 12,
        background: "#FEF2F2",
        border: "1px solid #FECACA",
      }}
    >
      <div style={{ fontSize: 11.5, color: "#B91C1C", fontWeight: 700, marginBottom: 6 }}>
        현재 지원되지 않는 기능
      </div>
      <div style={{ fontSize: 12.5, color: "#7F1D1D", lineHeight: 1.55 }}>
        {executionInfo?.reason || "해당 기능은 현재 지원되지 않습니다."}
      </div>
    </div>
  );
}

function ActionValidationCard({ messageType, executionInfo, mobile = false }) {
  if (messageType !== "validation") return null;
  const missingFields = executionInfo?.missingFields || [];
  const fieldLabels = {
    title: "제목",
    content: "내용",
    eventId: "행사 ID",
    targetType: "대상 유형",
    targetId: "대상 ID",
  };
  const fieldGuides = {
    title: "실행할 제목을 입력해 주세요.",
    content: "실행할 내용을 입력해 주세요.",
    eventId: "대상 행사 ID를 먼저 선택해 주세요.",
    targetType: "알림을 보낼 대상 유형을 선택해 주세요.",
    targetId: "알림을 보낼 대상 ID를 확인해 주세요.",
  };
  return (
    <div
      style={{
        marginTop: 8,
        width: "100%",
        padding: mobile ? "10px 12px" : "12px 14px",
        borderRadius: 12,
        background: "#FFF7ED",
        border: "1px solid #FED7AA",
      }}
    >
      <div style={{ fontSize: 11.5, color: "#9A3412", fontWeight: 700, marginBottom: 6 }}>
        추가 정보 필요
      </div>
      <div style={{ fontSize: 12.5, color: "#9A3412", lineHeight: 1.55 }}>
        {executionInfo?.reason || "실행 전에 채워야 할 정보가 있습니다. 안내된 화면이나 초안을 먼저 확인해 주세요."}
      </div>
      {missingFields.length ? (
        <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
          <div style={{ fontSize: 11.5, color: "#C2410C", lineHeight: 1.5 }}>
            누락 필드: {missingFields.map((field) => fieldLabels[field] || field).join(", ")}
          </div>
          {missingFields.map((field) => (
            <div key={field} style={{ fontSize: 11.5, color: "#9A3412", lineHeight: 1.5 }}>
              {(fieldLabels[field] || field)}: {fieldGuides[field] || "필수 값을 먼저 채워 주세요."}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ActionHintCard({ messageType, mobile = false }) {
  if (messageType !== "ambiguous" && messageType !== "low_confidence") return null;
  const title = messageType === "ambiguous" ? "의도 선택이 필요합니다" : "다시 입력이 필요합니다";
  const description =
    messageType === "ambiguous"
      ? "조회, 화면 이동, 초안 작성, 실행 요청 중 어떤 작업인지 한 번만 더 골라서 말씀해 주세요."
      : "의도는 가까웠지만 아직 충분히 명확하지 않습니다. 대상과 작업을 함께 적어 주시면 더 정확하게 처리할 수 있습니다.";
  return (
    <div
      style={{
        marginTop: 8,
        width: "100%",
        padding: mobile ? "10px 12px" : "12px 14px",
        borderRadius: 12,
        background: "#EFF6FF",
        border: "1px solid #BFDBFE",
      }}
    >
      <div style={{ fontSize: 11.5, color: "#1D4ED8", fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: "#1E3A8A", lineHeight: 1.55 }}>{description}</div>
    </div>
  );
}

function ActionConfirmCard({ confirmation, onConfirm, mobile = false }) {
  if (!confirmation) return null;
  const label = executeActionLabel(confirmation);
  const actionKey = confirmation?.actionKey;
  const descriptions = {
    SAVE_NOTICE: "현재 화면의 공지 초안을 backend 저장 계약에 맞춰 저장합니다.",
    SEND_NOTIFICATION_DRAFT: "저장된 알림 초안을 즉시 발송합니다.",
    SEND_EVENT_NOTIFICATION: "이벤트 대상 알림을 즉시 발송합니다.",
    SEND_BROADCAST_NOTIFICATION: "전체 대상 알림을 즉시 발송합니다.",
  };
  const executeType = confirmation?.executeType || confirmation?.type;
  const payload = confirmation?.payload || {};
  const payloadSummary = buildActionPayloadSummary(actionKey, payload);
  const actionDescriptions = {
    notice_create: "현재 공지 초안을 저장합니다.",
    notice_update: "현재 선택된 공지의 수정 내용을 저장합니다.",
    notice_hide: "현재 선택된 공지를 숨김 상태로 저장합니다.",
    notification_draft_delete: "현재 선택된 알림 초안을 삭제합니다.",
    notification_draft_send: "저장된 알림 초안을 즉시 발송합니다.",
    notification_event_send: "행사 대상을 기준으로 이벤트 알림을 즉시 발송합니다.",
    notification_broadcast_send: "전체 대상을 향한 알림을 즉시 발송합니다.",
  };
  return (
    <div
      style={{
        marginTop: 8,
        width: "100%",
        padding: mobile ? "10px 12px" : "12px 14px",
        borderRadius: 12,
        background: "#FFF7ED",
        border: "1px solid #FED7AA",
      }}
    >
      <div style={{ fontSize: 11.5, color: "#9A3412", fontWeight: 700, marginBottom: 8 }}>
        실행 확인
      </div>
      <div style={{ fontSize: 12.5, color: "#9A3412", lineHeight: 1.5, marginBottom: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
        <div>{actionDescriptions[actionKey] || descriptions[executeType] || "확인 후 바로 실행됩니다."}</div>
        {payloadSummary.length ? (
          <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
            {payloadSummary.map((item) => (
              <div key={item} style={{ fontSize: 11.5, color: "#9A3412", lineHeight: 1.45 }}>
                {item}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onConfirm}
        style={{
          width: "100%",
          border: "none",
          borderRadius: 10,
          background: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
          color: "#fff",
          padding: "10px 12px",
          fontSize: 12.5,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: ds.ff,
        }}
      >
        {label} 진행
      </button>
    </div>
  );
}

function Bubble({ msg, isLast, mobile = false, onConfirm }) {
  const isBot = msg.role === "bot";
  return (
    <div className="cb-msg" style={{ display: "flex", flexDirection: isBot ? "row" : "row-reverse", alignItems: "flex-end", gap: 8, marginBottom: 6 }}>
      {isBot && <BotAvatar size={mobile ? 24 : 28} />}
      <div style={{ maxWidth: mobile ? "82%" : "76%", display: "flex", flexDirection: "column", alignItems: isBot ? "flex-start" : "flex-end", gap: 2 }}>
        <div style={{
          padding: mobile ? "9px 12px" : "10px 14px",
          borderRadius: isBot ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
          background: isBot ? "#fff" : "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
          color: isBot ? "#374151" : "#fff",
          fontSize: mobile ? 12.5 : 13.5, lineHeight: mobile ? 1.6 : 1.65, wordBreak: "break-word",
          boxShadow: isBot ? "0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)" : "0 3px 14px rgba(255,107,107,0.25)",
        }}>
          {msg.text}
        </div>
        <span style={{ fontSize: 10, color: "#B0B0B0", padding: "0 4px", opacity: isLast ? 1 : 0 }}>
          {fmt(msg.ts)}
        </span>
        {isBot && <ActionSummaryCard summary={msg.summary} mobile={mobile} />}
        {isBot && <ActionHintCard messageType={msg.messageType} mobile={mobile} />}
        {isBot && <ActionValidationCard messageType={msg.messageType} executionInfo={msg.executionInfo} mobile={mobile} />}
        {isBot && <ActionUnsupportedCard messageType={msg.messageType} executionInfo={msg.executionInfo} mobile={mobile} />}
        {isBot && <ActionConfirmCard confirmation={msg.confirmation} onConfirm={onConfirm} mobile={mobile} />}
      </div>
    </div>
  );
}

function Typing({ mobile = false }) {
  return (
    <div className="cb-msg" style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 6 }}>
      <BotAvatar size={mobile ? 24 : 28} />
      <div style={{
        padding: mobile ? "10px 14px" : "11px 18px", borderRadius: "4px 16px 16px 16px",
        background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)",
        display: "flex", gap: 5, alignItems: "center",
      }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "linear-gradient(135deg, #FF6B6B, #FF8E53)",
            animation: `dotWave 1.4s ease infinite`, animationDelay: `${i * 0.18}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

function Welcome({ onSelect, mobile = false }) {
  const items = [
    { icon: "\uD83D\uDCC8", label: "행사 현황 알려줘", sub: "진행 중인 행사 요약" },
    { icon: "\uD83D\uDEA8", label: "최근 신고 내역", sub: "접수된 신고 확인" },
    { icon: "\uD83D\uDC65", label: "오늘 참가자 수", sub: "체크인 현황 조회" },
    { icon: "\uD83D\uDCB3", label: "결제 현황 알려줘", sub: "매출 및 결제 내역" },
  ];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: mobile ? "22px 14px 12px" : "28px 20px 16px", overflow: "auto", background: "#fff" }}>
      <div style={{ animation: "softBounce 2.5s ease-in-out infinite" }}>
        <BotAvatar size={mobile ? 46 : 56} />
      </div>
      <div style={{ fontSize: mobile ? 16 : 18, fontWeight: 700, color: "#1F2937", marginTop: mobile ? 12 : 14, letterSpacing: -0.5, textAlign: "center" }}>안녕하세요! 누리예요~ 🐶</div>
      <div style={{ fontSize: mobile ? 12.5 : 13, color: "#9CA3AF", marginTop: 4, textAlign: "center", lineHeight: 1.5 }}>뭐든 편하게 물어봐요! 누리가 척척 도와줄게요~</div>
      <div style={{ width: "100%", marginTop: mobile ? 16 : 20, display: "flex", flexDirection: "column", gap: mobile ? 7 : 8 }}>
        {items.map((it) => (
          <button key={it.label} onClick={() => onSelect(it.label)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: mobile ? "10px 12px" : "12px 14px", borderRadius: 14,
              border: "1px solid #F0F0F0", background: "#FAFAFA",
              cursor: "pointer", fontFamily: ds.ff, textAlign: "left", transition: "all .18s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#FFF5F5"; e.currentTarget.style.borderColor = "#FECACA"; e.currentTarget.style.transform = "translateX(4px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#FAFAFA"; e.currentTarget.style.borderColor = "#F0F0F0"; e.currentTarget.style.transform = "translateX(0)"; }}
          >
            <span style={{ fontSize: mobile ? 18 : 20 }}>{it.icon}</span>
            <div>
              <div style={{ fontSize: mobile ? 12.5 : 13, fontWeight: 600, color: "#374151" }}>{it.label}</div>
              <div style={{ fontSize: mobile ? 10.5 : 11, color: "#9CA3AF", marginTop: 1 }}>{it.sub}</div>
            </div>
          </button>
        ))}
      </div>
      <div style={{ marginTop: "auto", paddingTop: mobile ? 12 : 16, fontSize: 10.5, color: "#D1D5DB" }}>Powered by Amazon Nova</div>
    </div>
  );
}

function Chips({ onSelect, mobile = false }) {
  const list = [
    { emoji: "\uD83D\uDCCB", text: "행사 현황" },
    { emoji: "\uD83D\uDC65", text: "참가자 수" },
    { emoji: "\uD83D\uDCB3", text: "결제 현황" },
  ];
  return (
    <div style={{ display: "flex", gap: 6, padding: mobile ? "6px 10px 4px" : "6px 14px 4px", background: "#FAFAFA", borderTop: "1px solid #F3F3F3", overflowX: mobile ? "auto" : "visible", WebkitOverflowScrolling: mobile ? "touch" : "auto" }}>
      {list.map((c) => (
        <button key={c.text} onClick={() => onSelect(c.text)}
          style={{
            padding: mobile ? "5px 10px" : "5px 11px", borderRadius: 20,
            border: "1px solid #ECECEC", background: "#fff",
            color: "#777", fontSize: mobile ? 11 : 11.5, cursor: "pointer",
            fontFamily: ds.ff, transition: "all .12s",
            display: "flex", alignItems: "center", gap: 4,
            whiteSpace: "nowrap", flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#FFF5F5"; e.currentTarget.style.color = "#E8505B"; e.currentTarget.style.borderColor = "#FECACA"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#777"; e.currentTarget.style.borderColor = "#ECECEC"; }}
        >
          <span style={{ fontSize: 12 }}>{c.emoji}</span>{c.text}
        </button>
      ))}
    </div>
  );
}

function InputBar({ inputRef, input, setInput, onSend, isTyping, handleKey, mobile = false }) {
  const active = input.trim() && !isTyping;
  return (
    <div style={{ padding: mobile ? "6px 10px calc(env(safe-area-inset-bottom, 0px) + 10px)" : "8px 12px 12px", background: "#fff" }}>
      <div style={{
        display: "flex", alignItems: "flex-end", gap: 8,
        background: "#F7F7F8", border: "1.5px solid #EBEBEB",
        borderRadius: 16, padding: mobile ? "5px 5px 5px 12px" : "6px 6px 6px 16px", transition: "border-color .2s, box-shadow .2s",
      }}
        onFocusCapture={(e) => { e.currentTarget.style.borderColor = "#FF6B6B"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,107,107,0.08)"; }}
        onBlurCapture={(e) => { e.currentTarget.style.borderColor = "#EBEBEB"; e.currentTarget.style.boxShadow = "none"; }}
      >
        <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="무엇이든 물어보세요..." rows={1}
          style={{
            flex: 1, border: "none", outline: "none", background: "transparent", resize: "none",
            fontFamily: ds.ff, fontSize: mobile ? 13 : 13.5, color: "#1F2937", lineHeight: 1.5, maxHeight: mobile ? 72 : 80, overflowY: "auto", padding: "4px 0",
          }}
          onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, mobile ? 72 : 80) + "px"; }}
        />
        <button onClick={onSend} disabled={!active}
          style={{
            width: mobile ? 34 : 36, height: mobile ? 34 : 36, borderRadius: mobile ? 11 : 12, border: "none",
            background: active ? "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)" : "#E5E7EB",
            cursor: active ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "all .2s",
            boxShadow: active ? "0 3px 12px rgba(255,107,107,0.35)" : "none",
            transform: active ? "scale(1)" : "scale(0.95)",
          }}
        >
          <Send size={mobile ? 14 : 15} color={active ? "#fff" : "#B0B0B0"} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════════ */
export default function AdminChatBot() {
  const {
    isOpen, toggle, close,
    messages, input, setInput,
    isTyping, sendMessage, clearMessages, confirmExecute,
  } = useChatBot();

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const [hasChats, setHasChats] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const syncViewport = () => setIsMobile(window.innerWidth < 768);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 140); }, [isOpen]);
  useEffect(() => { if (messages.some((m) => m.role === "user")) setHasChats(true); }, [messages]);

  const [closing, setClosing] = useState(false);
  const handleToggleClose = () => {
    toggle();
    setClosing(true);
    setTimeout(() => setClosing(false), 1000);
  };

  const mobilePanelBottom = "calc(env(safe-area-inset-bottom, 0px) + 132px)";
  const mobileButtonBottom = "calc(env(safe-area-inset-bottom, 0px) + 84px)";
  /** 게시판 관리 작성/수정 슬라이드 패널 열릴 때 boardManage에서 --admin-board-panel-offset 설정 */
  const panelShift = "var(--admin-board-panel-offset, 0px)";
  const rightChatOpen = isMobile
    ? `calc(10px + ${panelShift})`
    : `calc(28px + ${panelShift})`;
  const rightFabClosed = isMobile
    ? `calc(10px + ${panelShift})`
    : `calc(14px + ${panelShift})`;
  const shiftTransition = "right 0.26s cubic-bezier(0.22, 1, 0.36, 1)";

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const handleClear = () => { clearMessages(); setHasChats(false); };
  const isLastInGroup = (i) => i === messages.length - 1 || messages[i + 1]?.role !== messages[i].role;

  return (
    <>
      <style>{chatStyles}</style>

      {/* ── 채팅 패널 ── */}
      {isOpen && (
        <div style={{
          position: "fixed", bottom: isMobile ? mobilePanelBottom : 96, right: rightChatOpen,
          width: isMobile ? "min(calc(100vw - 16px), 336px)" : 380,
          maxWidth: isMobile ? "calc(100vw - 16px)" : 380,
          height: isMobile ? "min(calc(100dvh - env(safe-area-inset-bottom, 0px) - 84px), 468px)" : 560,
          borderRadius: isMobile ? 20 : 24, background: "#fff",
          boxShadow: "0 25px 60px rgba(0,0,0,0.18), 0 6px 20px rgba(0,0,0,0.08)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          zIndex: 9999, animation: "chatSlideUp .32s cubic-bezier(.34,1.2,.64,1)", fontFamily: ds.ff,
          transition: shiftTransition,
        }}>
          {/* 헤더 */}
          <div style={{
            padding: isMobile ? "14px 14px 12px" : "16px 16px 14px",
            background: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: isMobile ? 64 : 80, height: isMobile ? 64 : 80, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
            <div style={{ position: "absolute", bottom: -30, left: 40, width: isMobile ? 44 : 60, height: isMobile ? 44 : 60, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 12, position: "relative" }}>
              <MiniDogLottie size={isMobile ? 30 : 40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, color: "#fff" }}>멍비서 누리</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#A7F3D0", boxShadow: "0 0 6px rgba(167,243,208,0.6)" }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>응답 가능</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[{ Icon: RotateCcw, s: 13, fn: handleClear }, { Icon: Minus, s: 15, fn: close }].map(({ Icon, s, fn }, i) => (
                  <button key={i} onClick={fn}
                    style={{
                      width: isMobile ? 28 : 30, height: isMobile ? 28 : 30, borderRadius: isMobile ? 9 : 10, border: "none",
                      background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      color: "rgba(255,255,255,0.75)", transition: "all .15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "rgba(255,255,255,0.75)"; }}
                  ><Icon size={s} /></button>
                ))}
              </div>
            </div>
          </div>

          {/* 본문 */}
          {!hasChats ? (
            <Welcome onSelect={(q) => sendMessage(q)} mobile={isMobile} />
          ) : (
            <>
              <div className="cb-panel" style={{ flex: 1, overflowY: "auto", padding: isMobile ? "14px 12px 6px" : "16px 14px 6px", background: "#F9FAFB" }}>
                {messages.map((msg, i) => (
                  <Bubble key={msg.id} msg={msg} isLast={isLastInGroup(i)} mobile={isMobile} onConfirm={confirmExecute} />
                ))}
                {isTyping && <Typing mobile={isMobile} />}
                <div ref={bottomRef} />
              </div>
              <Chips onSelect={(q) => sendMessage(q)} mobile={isMobile} />
            </>
          )}

          <InputBar inputRef={inputRef} input={input} setInput={setInput} onSend={() => sendMessage()} isTyping={isTyping} handleKey={handleKey} mobile={isMobile} />
        </div>
      )}

      {/* ── 캐릭터 or 닫기 버튼 ── */}
      {isOpen ? (
        <button
          onClick={toggle}
          style={{
            position: "fixed", bottom: isMobile ? mobileButtonBottom : 28, right: rightChatOpen,
            width: isMobile ? 48 : 56, height: isMobile ? 48 : 56, borderRadius: "50%", border: "none",
            background: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 10000, transition: `all .2s, ${shiftTransition}`,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <X size={isMobile ? 20 : 22} color="#9CA3AF" strokeWidth={2.2} />
        </button>
      ) : (
        <DogCharacter onClick={toggle} mobile={isMobile} rightStyle={rightFabClosed} shiftTransition={shiftTransition} />
      )}
    </>
  );
}
