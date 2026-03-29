import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, RotateCcw, Send, Sparkles, X } from "lucide-react";
import Lottie from "lottie-react";
import dogLottie from "../../../../public/dog-lottie.json";
import { useSiteChatBot } from "./useSiteChatBot";

const FF = "'Pretendard Variable', 'Pretendard', -apple-system, sans-serif";
const ACCENT = "#90C450";
const ACCENT_GRADIENT = `linear-gradient(135deg, #90C450 0%, #7BC043 100%)`;
const DARK = "#111827";
const DARK_SURFACE = "#1F2937";
const DARK_BORDER = "#374151";

const chatStyles = `
@keyframes scb-slideUp {
  from { opacity: 0; transform: translateY(18px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes scb-msgPop {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes scb-dotWave {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.25; }
  30% { transform: translateY(-5px); opacity: 1; }
}
.scb-msg { animation: scb-msgPop .24s ease-out; }
.scb-panel::-webkit-scrollbar { width: 4px; }
.scb-panel::-webkit-scrollbar-track { background: transparent; }
.scb-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 999px; transition: background .2s; }
.scb-panel::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
.scb-panel { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.12) transparent; }
`;

function fmt(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function Avatar({ small = false }) {
  const size = small ? 28 : 42;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: ACCENT_GRADIENT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 20px rgba(144,196,80,0.24)",
        fontSize: small ? 15 : 22,
        flexShrink: 0,
      }}
    >
      🐶
    </div>
  );
}

function Bubble({ msg, isLast, mobile = false }) {
  const isBot = msg.role === "bot";
  return (
    <div className="scb-msg" style={{ display: "flex", flexDirection: isBot ? "row" : "row-reverse", alignItems: "flex-end", gap: 8, marginBottom: 8 }}>
      {isBot ? <Avatar small /> : null}
      <div style={{ maxWidth: mobile ? "86%" : "78%", display: "flex", flexDirection: "column", alignItems: isBot ? "flex-start" : "flex-end", gap: 2 }}>
        <div
          style={{
            padding: mobile ? "10px 12px" : "11px 14px",
            borderRadius: isBot ? "6px 16px 16px 16px" : "16px 6px 16px 16px",
            background: isBot ? DARK_SURFACE : ACCENT_GRADIENT,
            color: isBot ? "#e5e7eb" : "#fff",
            fontSize: mobile ? 12.5 : 13.5,
            lineHeight: 1.65,
            wordBreak: "keep-all",
            whiteSpace: "pre-line",
            boxShadow: isBot
              ? "none"
              : "0 3px 12px rgba(144,196,80,0.22)",
          }}
        >
          {msg.text}
        </div>
        <span style={{ fontSize: 10, color: "#B0B0B0", padding: "0 4px", opacity: isLast ? 1 : 0 }}>{fmt(msg.ts)}</span>
      </div>
    </div>
  );
}

function Typing({ mobile = false }) {
  return (
    <div className="scb-msg" style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 8 }}>
      <Avatar small />
      <div
        style={{
          padding: mobile ? "10px 14px" : "11px 18px",
          borderRadius: "6px 16px 16px 16px",
          background: DARK_SURFACE,
          boxShadow: "none",
          display: "flex",
          gap: 5,
          alignItems: "center",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: ACCENT_GRADIENT,
              animation: "scb-dotWave 1.4s ease infinite",
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function QuickActionsSection({ actions, onSelect, mobile = false }) {
  return (
    <div style={{ width: "100%", display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ fontSize: mobile ? 15 : 16, fontWeight: 700, color: "#f3f4f6", textAlign: "left" }}>
          푸리가 도와드릴 수 있어요
        </div>
        <div style={{ fontSize: mobile ? 11.5 : 12, color: "#9CA3AF", lineHeight: 1.5, textAlign: "left" }}>
          궁금한 걸 바로 눌러도 되고, 자유롭게 물어봐도 돼요.
        </div>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => onSelect(action)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 4,
              padding: mobile ? "11px 12px" : "12px 14px",
              borderRadius: 14,
              border: `1px solid ${DARK_BORDER}`,
              background: DARK_SURFACE,
              cursor: "pointer",
              textAlign: "left",
              fontFamily: FF,
            }}
          >
            <div style={{ fontSize: mobile ? 12.5 : 13, fontWeight: 700, color: ACCENT }}>{action.label}</div>
            <div style={{ fontSize: mobile ? 10.5 : 11.5, color: "#9CA3AF", lineHeight: 1.5 }}>{action.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ShortcutStrip({ actions, onSelect, mobile = false }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        padding: mobile ? "8px 10px 4px" : "8px 14px 4px",
        background: DARK,
        borderTop: `1px solid ${DARK_BORDER}`,
        overflowX: "auto",
      }}
    >
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => onSelect(action)}
          style={{
            padding: mobile ? "6px 10px" : "7px 12px",
            borderRadius: 999,
            border: `1px solid ${DARK_BORDER}`,
            background: DARK_SURFACE,
            color: "#9CA3AF",
            fontSize: mobile ? 11 : 11.5,
            cursor: "pointer",
            fontFamily: FF,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

function InputBar({ inputRef, input, setInput, onSend, isTyping, handleKey, mobile = false }) {
  const active = input.trim() && !isTyping;
  return (
    <div style={{ padding: mobile ? "8px 10px calc(env(safe-area-inset-bottom, 0px) + 10px)" : "10px 12px 12px", background: DARK }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          background: DARK_SURFACE,
          border: `1px solid ${DARK_BORDER}`,
          borderRadius: 16,
          padding: mobile ? "5px 5px 5px 12px" : "6px 6px 6px 16px",
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="푸리에게 궁금한 걸 물어보세요"
          rows={1}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            resize: "none",
            fontFamily: FF,
            fontSize: mobile ? 13 : 13.5,
            color: "#e5e7eb",
            lineHeight: 1.5,
            maxHeight: 96,
            overflowY: "auto",
            padding: "4px 0",
          }}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
          }}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!active}
          style={{
            width: mobile ? 36 : 38,
            height: mobile ? 36 : 38,
            borderRadius: 12,
            border: "none",
            background: active ? ACCENT_GRADIENT : DARK_BORDER,
            cursor: active ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: active ? "0 6px 16px rgba(144,196,80,0.26)" : "none",
          }}
        >
          <Send size={15} color={active ? "#fff" : "#9CA3AF"} />
        </button>
      </div>
    </div>
  );
}

function Welcome({ actions, onSelect, mobile = false }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: mobile ? "22px 14px 14px" : "28px 20px 20px", overflow: "auto", background: DARK }}>
      <Avatar />
      <div style={{ fontSize: mobile ? 18 : 20, fontWeight: 700, color: "#f3f4f6", marginTop: 14, letterSpacing: -0.4 }}>
        안녕하세요, 푸리예요 🐾
      </div>
      <div style={{ fontSize: mobile ? 12.5 : 13, color: "#9CA3AF", marginTop: 6, textAlign: "center", lineHeight: 1.6 }}>
        행사, 로그인, 결제, 환불 등 뭐든 물어봐 주세요!
      </div>
      <div style={{ width: "100%", marginTop: 18 }}>
        <QuickActionsSection actions={actions} onSelect={onSelect} mobile={mobile} />
      </div>
    </div>
  );
}

export default function SiteChatBot() {
  const {
    isOpen,
    toggle,
    close,
    messages,
    input,
    setInput,
    isTyping,
    quickActions,
    triggerQuickAction,
    sendMessage,
    clearMessages,
  } = useSiteChatBot();

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const [hasChats, setHasChats] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const sync = () => setIsMobile(window.innerWidth < 768);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 120);
  }, [isOpen]);

  useEffect(() => {
    if (messages.some((m) => m.role === "user")) setHasChats(true);
  }, [messages]);

  const welcomeActions = useMemo(() => quickActions.slice(0, 5), [quickActions]);
  const shortcutActions = useMemo(
    () => quickActions.filter((a) => a.category === "navigate").slice(0, 5),
    [quickActions],
  );

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <style>{chatStyles}</style>

      {isOpen ? (
        <div
          style={{
            position: "fixed",
            bottom: isMobile ? 80 : 96,
            right: isMobile ? 10 : 28,
            width: isMobile ? "min(calc(100vw - 16px), 336px)" : 390,
            maxWidth: isMobile ? "calc(100vw - 16px)" : 390,
            height: isMobile ? "min(calc(100dvh - 160px), 520px)" : 580,
            borderRadius: isMobile ? 20 : 24,
            background: DARK,
            boxShadow: "0 25px 60px rgba(0,0,0,0.4), 0 8px 22px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 9999,
            animation: "scb-slideUp .28s ease-out",
            fontFamily: FF,
          }}
        >
          {/* Header */}
          <div style={{ padding: isMobile ? "14px 14px 12px" : "16px 16px 14px", background: "#0a0a0a", color: "#fff", borderBottom: `1px solid ${DARK_BORDER}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar small />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700 }}>푸리</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <Sparkles size={12} />
                  <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.92)" }}>행사 안내 도우미</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" onClick={clearMessages} style={{ width: 30, height: 30, borderRadius: 10, border: "none", background: "rgba(255,255,255,0.18)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <RotateCcw size={14} />
                </button>
                <button type="button" onClick={close} style={{ width: 30, height: 30, borderRadius: 10, border: "none", background: "rgba(255,255,255,0.18)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Minus size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          {!hasChats ? (
            <Welcome actions={welcomeActions} onSelect={triggerQuickAction} mobile={isMobile} />
          ) : (
            <>
              <div className="scb-panel" style={{ flex: 1, overflowY: "auto", padding: isMobile ? "14px 12px 8px" : "16px 14px 8px", background: DARK }}>
                {messages.map((msg, i) => (
                  <Bubble
                    key={msg.id}
                    msg={msg}
                    isLast={i === messages.length - 1 || messages[i + 1]?.role !== msg.role}
                    mobile={isMobile}
                  />
                ))}
                {isTyping ? <Typing mobile={isMobile} /> : null}
                <div ref={bottomRef} />
              </div>
              <ShortcutStrip actions={shortcutActions} onSelect={triggerQuickAction} mobile={isMobile} />
            </>
          )}

          {/* Input */}
          <InputBar inputRef={inputRef} input={input} setInput={setInput} onSend={() => sendMessage()} isTyping={isTyping} handleKey={handleKey} mobile={isMobile} />
        </div>
      ) : null}

      {/* FAB Button */}
      {isOpen ? (
        <button
          type="button"
          onClick={toggle}
          style={{
            position: "fixed",
            bottom: isMobile ? 16 : 28,
            right: isMobile ? 10 : 28,
            width: isMobile ? 50 : 56,
            height: isMobile ? 50 : 56,
            borderRadius: "50%",
            border: "none",
            background: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            boxShadow: "0 10px 24px rgba(0,0,0,0.16)",
          }}
        >
          <X size={22} color="#9CA3AF" />
        </button>
      ) : (
        <button
          type="button"
          onClick={toggle}
          style={{
            position: "fixed",
            bottom: isMobile ? 16 : 20,
            right: isMobile ? 10 : 14,
            width: isMobile ? 56 : 64,
            height: isMobile ? 56 : 64,
            borderRadius: "50%",
            border: "none",
            background: ACCENT_GRADIENT,
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            boxShadow: "0 16px 32px rgba(144,196,80,0.28)",
          }}
        >
          <div
            style={{
              width: isMobile ? 52 : 60,
              height: isMobile ? 52 : 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              borderRadius: "50%",
            }}
          >
            <Lottie
              animationData={dogLottie}
              loop
              autoplay
              style={{
                width: isMobile ? 58 : 68,
                height: isMobile ? 58 : 68,
                transform: "scale(1.12)",
              }}
            />
          </div>
        </button>
      )}
    </>
  );
}
