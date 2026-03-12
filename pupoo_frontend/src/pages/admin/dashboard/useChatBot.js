import { useState, useCallback, useRef } from "react";
import { buildRequestUrl } from "../../../shared/config/requestUrl";

/* ============================================================
   useChatBot - AI logic hook
   ============================================================ */

const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || "";
const TOKEN_KEY = "pupoo_admin_token";

async function getBotReply(history, userMessage) {
  const url = buildRequestUrl(AI_BASE_URL, "/internal/chatbot/chat");
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
    throw new Error("AI ??? ??? ? ????. ??? ?? ??? ??? ???.");
  }

  const text = await res.text();
  if (!res.ok) {
    throw new Error("AI ???? ??? ??????. ?? ? ?? ??? ???.");
  }

  try {
    const data = JSON.parse(text);
    return data?.data?.reply || "??? ?? ?????.";
  } catch {
    throw new Error(`[?? ??] ${text.slice(0, 200)}`);
  }
}

export function useChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "bot",
      text: "????. ??? ???????",
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
              "???? ??? ??????. ?? ? ?? ??? ???.",
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
        text: "??? ????????. ??? ???????",
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
