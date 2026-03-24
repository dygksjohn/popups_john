import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { buildRequestUrl } from "../../../shared/config/requestUrl";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const TOKEN_KEY = "pupoo_admin_token";
const NOTICE_DRAFT_KEY = "pupoo_admin_chatbot_notice_draft";
const NOTIFICATION_DRAFT_KEY = "pupoo_admin_chatbot_notification_draft";
const NOTICE_SYNC_EVENT = "pupoo-admin-chatbot-sync-notice";
const NOTIFICATION_SYNC_EVENT = "pupoo-admin-chatbot-sync-notification";

function readJsonStorage(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJsonStorage(key, value) {
  try {
    if (value == null) {
      sessionStorage.removeItem(key);
      return;
    }
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage failures
  }
}

function resolveCurrentPage(pathname) {
  if (pathname.startsWith("/admin/board/notice")) return "notice";
  if (pathname.startsWith("/admin/event")) return "eventManage";
  if (pathname.startsWith("/admin/participant/alert")) return "alertManage";
  if (pathname.startsWith("/admin/refunds")) return "refundManage";
  if (pathname.startsWith("/admin/dashboard")) return "dashboard";
  return "";
}

async function requestChat({ history, userMessage, context, confirmation }) {
  const url = buildRequestUrl(API_BASE_URL, "/api/chatbot/chat");
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: userMessage,
        history: history.map((message) => ({
          role: message.role === "bot" ? "assistant" : "user",
          content: message.text,
        })),
        context,
        confirmation,
      }),
    });
  } catch {
    throw new Error("AI 서버에 연결할 수 없습니다. 서버 실행 상태를 확인해 주세요.");
  }

  const rawText = await response.text();
  let payload;
  try {
    payload = JSON.parse(rawText);
  } catch {
    throw new Error(`[응답 파싱 실패] ${rawText.slice(0, 200)}`);
  }

  if (!response.ok || payload?.success === false) {
    const error = new Error(
      payload?.data?.message ||
        payload?.error?.message ||
        "AI 서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    );
    error.messageType = payload?.data?.messageType || "error";
    error.status = response.status;
    error.code = payload?.code || null;
    throw error;
  }

  return payload?.data || { message: "응답을 받지 못했습니다.", messageType: "default", actions: [] };
}

function enrichBotMessage(baseMessage, response) {
  const actions = response?.actions || [];
  const summaryAction = actions.find((action) => action?.type === "SHOW_SUMMARY");
  const confirmAction = actions.find((action) => action?.type === "CONFIRM_EXECUTE");
  const prefillAction = actions.find((action) => action?.type === "PREFILL_FORM");

  return {
    ...baseMessage,
    messageType: response?.messageType || "default",
    summary: summaryAction?.payload || null,
    confirmation: confirmAction?.payload || null,
    executionInfo: prefillAction?.payload?.execution || null,
  };
}

export function useChatBot() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "bot",
      text: "관리자 작업을 도와드릴게요. 이동, 요약, 초안 생성, 저장이나 발송 실행이 필요하면 말씀해 주세요.",
      ts: new Date(),
      messageType: "default",
      summary: null,
      confirmation: null,
      executionInfo: null,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [noticeDraft, setNoticeDraft] = useState(() => readJsonStorage(NOTICE_DRAFT_KEY));
  const [notificationDraft, setNotificationDraft] = useState(() => readJsonStorage(NOTIFICATION_DRAFT_KEY));
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const idRef = useRef(2);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncNoticeDraft = (event) => {
      const detail = event?.detail;
      setNoticeDraft(detail ?? readJsonStorage(NOTICE_DRAFT_KEY));
    };
    const syncNotificationDraft = (event) => {
      const detail = event?.detail;
      setNotificationDraft(detail ?? readJsonStorage(NOTIFICATION_DRAFT_KEY));
    };

    window.addEventListener(NOTICE_SYNC_EVENT, syncNoticeDraft);
    window.addEventListener(NOTIFICATION_SYNC_EVENT, syncNotificationDraft);
    return () => {
      window.removeEventListener(NOTICE_SYNC_EVENT, syncNoticeDraft);
      window.removeEventListener(NOTIFICATION_SYNC_EVENT, syncNotificationDraft);
    };
  }, []);

  const currentContext = useMemo(
    () => ({
      currentPage: resolveCurrentPage(location.pathname),
      route: location.pathname,
      noticeDraft: noticeDraft?.formData || noticeDraft || null,
      noticeExecution: noticeDraft?.execution || null,
      notificationDraft: notificationDraft?.formData || notificationDraft || null,
      notificationExecution: notificationDraft?.execution || null,
    }),
    [location.pathname, noticeDraft, notificationDraft],
  );

  const toggle = useCallback(() => setIsOpen((value) => !value), []);
  const close = useCallback(() => setIsOpen(false), []);

  const applyActions = useCallback(
    (actions) => {
      actions.forEach((action) => {
        if (action?.type === "NAVIGATE" && action?.payload?.route) {
          navigate(action.payload.route);
        }

        if (action?.type === "PREFILL_FORM") {
          const formType = action?.payload?.formType;
          const route = action?.payload?.route;
          const storedPayload = {
            formData: action?.payload?.formData || {},
            execution: action?.payload?.execution || null,
          };

          if (formType === "notice") {
            setNoticeDraft(storedPayload);
            writeJsonStorage(NOTICE_DRAFT_KEY, storedPayload);
            if (route) navigate(route);
            window.dispatchEvent(
              new CustomEvent("pupoo-admin-chatbot-prefill-notice", {
                detail: storedPayload,
              }),
            );
          }

          if (formType === "notification") {
            setNotificationDraft(storedPayload);
            writeJsonStorage(NOTIFICATION_DRAFT_KEY, storedPayload);
            if (route) navigate(route);
            window.dispatchEvent(
              new CustomEvent("pupoo-admin-chatbot-prefill-notification", {
                detail: storedPayload,
              }),
            );
          }
        }

        if (action?.type === "CONFIRM_EXECUTE") {
          setPendingConfirmation(action.payload || null);
        }
      });
    },
    [navigate],
  );

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = String(text || input).trim();
      if (!trimmed || isTyping) return;

      const userMessage = {
        id: idRef.current++,
        role: "user",
        text: trimmed,
        ts: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsTyping(true);

      try {
        const response = await requestChat({
          history: messages,
          userMessage: trimmed,
          context: currentContext,
          confirmation: null,
        });
        setPendingConfirmation(null);
        applyActions(response.actions || []);
        setMessages((prev) => [
          ...prev,
          enrichBotMessage(
            {
              id: idRef.current++,
              role: "bot",
              text: response.message || "응답을 받지 못했습니다.",
              ts: new Date(),
            },
            response,
          ),
        ]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: idRef.current++,
            role: "bot",
            text: error?.message || "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
            ts: new Date(),
            messageType: error?.messageType || "error",
            summary: null,
            confirmation: null,
            executionInfo: null,
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [applyActions, currentContext, input, isTyping, messages],
  );

  const confirmExecute = useCallback(async () => {
    if (!pendingConfirmation || isTyping) return;

    const userMessage = {
      id: idRef.current++,
      role: "user",
      text: "확인",
      ts: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await requestChat({
        history: messages,
        userMessage: "확인",
        context: currentContext,
        confirmation: pendingConfirmation,
      });
      setPendingConfirmation(null);
      applyActions(response.actions || []);
      setMessages((prev) => [
        ...prev,
        enrichBotMessage(
          {
            id: idRef.current++,
            role: "bot",
            text: response.message || "처리를 완료했습니다.",
            ts: new Date(),
          },
          response,
        ),
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: idRef.current++,
          role: "bot",
          text: error?.message || "실행 처리 중 오류가 발생했습니다.",
          ts: new Date(),
            messageType: error?.messageType || "error",
            summary: null,
            confirmation: null,
            executionInfo: null,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [applyActions, currentContext, isTyping, messages, pendingConfirmation]);

  const clearMessages = useCallback(() => {
    setPendingConfirmation(null);
    setMessages([
      {
        id: idRef.current++,
        role: "bot",
        text: "대화를 초기화했습니다. 필요한 작업을 말씀해 주세요.",
        ts: new Date(),
        messageType: "default",
        summary: null,
        confirmation: null,
        executionInfo: null,
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
    confirmExecute,
  };
}
