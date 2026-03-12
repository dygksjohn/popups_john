import { useState, useCallback, useRef } from "react";
import { getToken } from "../../../api/noticeApi";

/* ============================================================
   useChatBot — AI 로직 분리용 훅
   ✅ AI 교체 포인트: getBotReply 함수만 수정하면 됩니다.
   ============================================================ */

// Vite proxy를 통해 /internal → AI 서버로 전달 (CORS 우회)
const AI_BASE_URL = "";
const INTERNAL_TOKEN = "dev-internal-token";

/**
 * 백엔드 POST /internal/chatbot/chat 호출
 * @param {Array}  history     - 이전 대화 이력 (useChatBot messages 배열)
 * @param {string} userMessage - 현재 사용자 메시지
 * @returns {Promise<string>}  - AI 응답 텍스트
 */
async function getBotReply(history, userMessage) {
  const url = `${AI_BASE_URL}/internal/chatbot/chat`;
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
        history: history.map((m) => ({
          role: m.role === "bot" ? "assistant" : "user",
          content: m.text,
        })),
      }),
    });
  } catch (fetchErr) {
    throw new Error(`[연결 실패] ${url} → ${fetchErr.message}`);
  }

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`[${res.status}] ${text.slice(0, 200)}`);
  }

  try {
    const data = JSON.parse(text);
    return data?.data?.reply || "응답을 받지 못했습니다.";
  } catch {
    throw new Error(`[파싱 실패] ${text.slice(0, 200)}`);
  }
}

/* ============================================================ */

export function useChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "bot",
      text: "안녕하세요! 푸푸 도우미예요. 무엇이든 편하게 물어보세요! 😊",
      ts: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const idRef = useRef(2);

  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const close = useCallback(() => setIsOpen(false), []);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = (text || input).trim();
      if (!trimmed || isTyping) return;

      const userMsg = {
        id: idRef.current++,
        role: "user",
        text: trimmed,
        ts: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      try {
        const reply = await getBotReply(messages, trimmed);
        setMessages((prev) => [
          ...prev,
          { id: idRef.current++, role: "bot", text: reply, ts: new Date() },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: idRef.current++,
            role: "bot",
            text:
              err?.message ||
              "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
            ts: new Date(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [input, isTyping, messages],
  );

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: idRef.current++,
        role: "bot",
        text: "대화가 초기화되었습니다. 무엇을 도와드릴까요?",
        ts: new Date(),
      },
    ]);
  }, []);

  return {
    isOpen,
    toggle,
    close,
    messages,
    input,
    setInput,
    isTyping,
    sendMessage,
    clearMessages,
  };
}
