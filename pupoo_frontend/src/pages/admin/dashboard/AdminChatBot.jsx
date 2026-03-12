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
function DogCharacter({ onClick }) {
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
    setHovered(true);
    // 멈추기
    if (lottieRef.current) lottieRef.current.pause();
    // 말풍선
    clearTimeout(bubbleTimerRef.current);
    setBubbleAnim("bubblePop");
    setBubble("누리랑 얘기해요! 💬");
  };

  const handleMouseLeave = () => {
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
        bottom: 12,
        right: 14,
        zIndex: 10000,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 말풍선 */}
      {bubble && (
        <div
          style={{
            position: "absolute",
            bottom: 164,
            left: 20,
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
            fontSize: 12.5,
            fontWeight: 600,
            fontFamily: ds.ff,
            padding: "7px 14px",
            borderRadius: 14,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
            whiteSpace: "nowrap",
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
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.12))",
          transition: "transform 0.3s ease",
          transform: hovered ? "scaleX(-1) scale(1.1)" : "scaleX(-1)",
        }}
      >
        {animData ? (
          <Lottie
            lottieRef={lottieRef}
            animationData={animData}
            loop
            autoplay
            style={{ width: 210, height: 210 }}
          />
        ) : (
          <div style={{ width: 210, height: 210 }} />
        )}
      </div>

      {/* ── 채팅 받침대 ── */}
      <div style={{
        marginTop: -28,
        background: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
        borderRadius: 14,
        padding: "7px 18px 8px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        boxShadow: "0 4px 16px rgba(255,107,107,0.35), 0 1px 3px rgba(0,0,0,0.1)",
        position: "relative",
        transition: "transform .2s, box-shadow .2s",
        transform: hovered ? "scale(1.05)" : "scale(1)",
      }}>
        {/* 녹화 스타일 깜박이는 초록 점 */}
        <div style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#4ADE80",
          boxShadow: "0 0 6px rgba(74,222,128,0.7)",
          animation: "recBlink 1.5s ease-in-out infinite",
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#fff",
          fontFamily: ds.ff,
          letterSpacing: -0.2,
        }}>
          AI 채팅
        </span>
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

function Bubble({ msg, isLast }) {
  const isBot = msg.role === "bot";
  return (
    <div className="cb-msg" style={{ display: "flex", flexDirection: isBot ? "row" : "row-reverse", alignItems: "flex-end", gap: 8, marginBottom: 6 }}>
      {isBot && <BotAvatar size={28} />}
      <div style={{ maxWidth: "76%", display: "flex", flexDirection: "column", alignItems: isBot ? "flex-start" : "flex-end", gap: 2 }}>
        <div style={{
          padding: "10px 14px",
          borderRadius: isBot ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
          background: isBot ? "#fff" : "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
          color: isBot ? "#374151" : "#fff",
          fontSize: 13.5, lineHeight: 1.65, wordBreak: "break-word",
          boxShadow: isBot ? "0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)" : "0 3px 14px rgba(255,107,107,0.25)",
        }}>
          {msg.text}
        </div>
        <span style={{ fontSize: 10, color: "#B0B0B0", padding: "0 4px", opacity: isLast ? 1 : 0 }}>
          {fmt(msg.ts)}
        </span>
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="cb-msg" style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 6 }}>
      <BotAvatar size={28} />
      <div style={{
        padding: "11px 18px", borderRadius: "4px 16px 16px 16px",
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

function Welcome({ onSelect }) {
  const items = [
    { icon: "\uD83D\uDCC8", label: "행사 현황 알려줘", sub: "진행 중인 행사 요약" },
    { icon: "\uD83D\uDEA8", label: "최근 신고 내역", sub: "접수된 신고 확인" },
    { icon: "\uD83D\uDC65", label: "오늘 참가자 수", sub: "체크인 현황 조회" },
    { icon: "\uD83D\uDCB3", label: "결제 현황 알려줘", sub: "매출 및 결제 내역" },
  ];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 20px 16px", overflow: "auto", background: "#fff" }}>
      <div style={{ animation: "softBounce 2.5s ease-in-out infinite" }}>
        <BotAvatar size={56} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#1F2937", marginTop: 14, letterSpacing: -0.5 }}>안녕하세요! 누리예요~ 🐶</div>
      <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4, textAlign: "center", lineHeight: 1.5 }}>뭐든 편하게 물어봐요! 누리가 척척 도와줄게요~</div>
      <div style={{ width: "100%", marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it) => (
          <button key={it.label} onClick={() => onSelect(it.label)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 14px", borderRadius: 14,
              border: "1px solid #F0F0F0", background: "#FAFAFA",
              cursor: "pointer", fontFamily: ds.ff, textAlign: "left", transition: "all .18s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#FFF5F5"; e.currentTarget.style.borderColor = "#FECACA"; e.currentTarget.style.transform = "translateX(4px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#FAFAFA"; e.currentTarget.style.borderColor = "#F0F0F0"; e.currentTarget.style.transform = "translateX(0)"; }}
          >
            <span style={{ fontSize: 20 }}>{it.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{it.label}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{it.sub}</div>
            </div>
          </button>
        ))}
      </div>
      <div style={{ marginTop: "auto", paddingTop: 16, fontSize: 10.5, color: "#D1D5DB" }}>Powered by Amazon Nova</div>
    </div>
  );
}

function Chips({ onSelect }) {
  const list = [
    { emoji: "\uD83D\uDCCB", text: "행사 현황" },
    { emoji: "\uD83D\uDC65", text: "참가자 수" },
    { emoji: "\uD83D\uDCB3", text: "결제 현황" },
  ];
  return (
    <div style={{ display: "flex", gap: 6, padding: "6px 14px 4px", background: "#FAFAFA", borderTop: "1px solid #F3F3F3" }}>
      {list.map((c) => (
        <button key={c.text} onClick={() => onSelect(c.text)}
          style={{
            padding: "5px 11px", borderRadius: 20,
            border: "1px solid #ECECEC", background: "#fff",
            color: "#777", fontSize: 11.5, cursor: "pointer",
            fontFamily: ds.ff, transition: "all .12s",
            display: "flex", alignItems: "center", gap: 4,
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

function InputBar({ inputRef, input, setInput, onSend, isTyping, handleKey }) {
  const active = input.trim() && !isTyping;
  return (
    <div style={{ padding: "8px 12px 12px", background: "#fff" }}>
      <div style={{
        display: "flex", alignItems: "flex-end", gap: 8,
        background: "#F7F7F8", border: "1.5px solid #EBEBEB",
        borderRadius: 16, padding: "6px 6px 6px 16px", transition: "border-color .2s, box-shadow .2s",
      }}
        onFocusCapture={(e) => { e.currentTarget.style.borderColor = "#FF6B6B"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,107,107,0.08)"; }}
        onBlurCapture={(e) => { e.currentTarget.style.borderColor = "#EBEBEB"; e.currentTarget.style.boxShadow = "none"; }}
      >
        <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="무엇이든 물어보세요..." rows={1}
          style={{
            flex: 1, border: "none", outline: "none", background: "transparent", resize: "none",
            fontFamily: ds.ff, fontSize: 13.5, color: "#1F2937", lineHeight: 1.5, maxHeight: 80, overflowY: "auto", padding: "4px 0",
          }}
          onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px"; }}
        />
        <button onClick={onSend} disabled={!active}
          style={{
            width: 36, height: 36, borderRadius: 12, border: "none",
            background: active ? "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)" : "#E5E7EB",
            cursor: active ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "all .2s",
            boxShadow: active ? "0 3px 12px rgba(255,107,107,0.35)" : "none",
            transform: active ? "scale(1)" : "scale(0.95)",
          }}
        >
          <Send size={15} color={active ? "#fff" : "#B0B0B0"} strokeWidth={2.2} />
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
    isTyping, sendMessage, clearMessages,
  } = useChatBot();

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const [hasChats, setHasChats] = useState(false);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 140); }, [isOpen]);
  useEffect(() => { if (messages.some((m) => m.role === "user")) setHasChats(true); }, [messages]);

  const [closing, setClosing] = useState(false);
  const handleToggleClose = () => {
    toggle();
    setClosing(true);
    setTimeout(() => setClosing(false), 1000);
  };

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const handleClear = () => { clearMessages(); setHasChats(false); };
  const isLastInGroup = (i) => i === messages.length - 1 || messages[i + 1]?.role !== messages[i].role;

  return (
    <>
      <style>{chatStyles}</style>

      {/* ── 채팅 패널 ── */}
      {isOpen && (
        <div style={{
          position: "fixed", bottom: 96, right: 28,
          width: 380, height: 560, borderRadius: 24, background: "#fff",
          boxShadow: "0 25px 60px rgba(0,0,0,0.18), 0 6px 20px rgba(0,0,0,0.08)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          zIndex: 9999, animation: "chatSlideUp .32s cubic-bezier(.34,1.2,.64,1)", fontFamily: ds.ff,
        }}>
          {/* 헤더 */}
          <div style={{
            padding: "16px 16px 14px",
            background: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
            <div style={{ position: "absolute", bottom: -30, left: 40, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
              <MiniDogLottie size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>멍비서 누리</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#A7F3D0", boxShadow: "0 0 6px rgba(167,243,208,0.6)" }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>응답 가능</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[{ Icon: RotateCcw, s: 13, fn: handleClear }, { Icon: Minus, s: 15, fn: close }].map(({ Icon, s, fn }, i) => (
                  <button key={i} onClick={fn}
                    style={{
                      width: 30, height: 30, borderRadius: 10, border: "none",
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
            <Welcome onSelect={(q) => sendMessage(q)} />
          ) : (
            <>
              <div className="cb-panel" style={{ flex: 1, overflowY: "auto", padding: "16px 14px 6px", background: "#F9FAFB" }}>
                {messages.map((msg, i) => (
                  <Bubble key={msg.id} msg={msg} isLast={isLastInGroup(i)} />
                ))}
                {isTyping && <Typing />}
                <div ref={bottomRef} />
              </div>
              <Chips onSelect={(q) => sendMessage(q)} />
            </>
          )}

          <InputBar inputRef={inputRef} input={input} setInput={setInput} onSend={() => sendMessage()} isTyping={isTyping} handleKey={handleKey} />
        </div>
      )}

      {/* ── 캐릭터 or 닫기 버튼 ── */}
      {isOpen ? (
        <button
          onClick={toggle}
          style={{
            position: "fixed", bottom: 28, right: 28,
            width: 56, height: 56, borderRadius: "50%", border: "none",
            background: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 10000, transition: "all .2s",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <X size={22} color="#9CA3AF" strokeWidth={2.2} />
        </button>
      ) : (
        <DogCharacter onClick={toggle} />
      )}
    </>
  );
}
