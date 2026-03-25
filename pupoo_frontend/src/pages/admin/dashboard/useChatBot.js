import { useState, useCallback, useRef } from "react";
import { buildRequestUrl } from "../../../shared/config/requestUrl";

/* ============================================================
   useChatBot - AI logic hook
   ============================================================ */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const TOKEN_KEY = "pupoo_admin_token";

async function getBotReply(history, userMessage) {
  const url = buildRequestUrl(API_BASE_URL, "/api/chatbot/chat");
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
    throw new Error("AI 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해 주세요.");
  }

  const text = await res.text();
  if (!res.ok) {
    throw new Error("AI 서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
  }

  try {
    const data = JSON.parse(text);
    return data?.data?.reply || "응답을 받지 못했습니다.";
  } catch {
    throw new Error(`[파싱 실패] ${text.slice(0, 200)}`);
  }
}

export function useChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "bot",
      text: "반가워요. 무엇을 도와드릴까요?",
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
