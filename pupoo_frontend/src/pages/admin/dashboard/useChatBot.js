import { useState, useCallback, useRef } from "react";
import { getToken } from "../../../api/noticeApi";

/* ============================================================
   useChatBot — AI 로직 분리용 훅
   ✅ AI 교체 포인트: getBotReply 함수만 수정하면 됩니다.
   ============================================================ */

// 개발: Vite proxy → AI 서버(8000), 배포: Spring Boot 프록시 → AI 서버
const AI_BASE_URL = "";
const TOKEN_KEY = "pupoo_admin_token";

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
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: userMessage,
        history: history.map((m) => ({
          role: m.role === "bot" ? "assistant" : "user",
          content: m.text,
        })),
      }),
    });
  } catch (fetchErr) {
    throw new Error(
      "AI 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해 주세요."
    );
  }

  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      "AI 서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
    );
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
      text: "반가워요~! 멍비서 누리예요! 🐶 뭐든 편하게 물어봐요, 누리가 척척 도와줄게요~!",
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
        text: "다시 만나서 반가워요~! 🐶 뭐든 물어봐요, 누리가 여기 있을게요!",
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
