import { tokenStore } from "../../../app/http/tokenStore";

const NOTIFICATION_STREAM_PATH = "/api/notifications/stream";
const DEFAULT_NOTIFICATION_EVENTS = [
  "notification-received",
  "notification",
];

export function connectNotificationStream({
  onOpen,
  onNotification,
  onError,
  eventNames = DEFAULT_NOTIFICATION_EVENTS,
} = {}) {
  if (typeof window === "undefined" || typeof EventSource === "undefined") {
    return {
      close() {},
    };
  }

  const streamUrl = buildNotificationStreamUrl();
  const source = new EventSource(streamUrl, {
    withCredentials: true,
  });

  const handleNotification = (event) => {
    onNotification?.(event);
  };

  source.onopen = (event) => {
    onOpen?.(event);
  };

  source.onmessage = handleNotification;
  eventNames.forEach((eventName) => {
    source.addEventListener(eventName, handleNotification);
  });

  source.onerror = (event) => {
    onError?.(event);
  };

  return {
    close() {
      source.close();
    },
  };
}

function buildNotificationStreamUrl() {
  const accessToken = tokenStore.getAccessToken();
  if (!accessToken) {
    return NOTIFICATION_STREAM_PATH;
  }

  const params = new URLSearchParams({
    access_token: accessToken,
  });
  return `${NOTIFICATION_STREAM_PATH}?${params.toString()}`;
}
