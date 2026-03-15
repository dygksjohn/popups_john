import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import {
  Smartphone,
  Calendar,
  MapPin,
  ShieldCheck,
  MessageSquare,
  Download,
  CheckCircle2,
  Info,
  Clock,
  RefreshCw,
} from "lucide-react";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { eventApi } from "../../../app/http/eventApi";
import { tokenStore } from "../../../app/http/tokenStore";
import { normalizeEventTitle } from "../../../shared/utils/eventDisplay";

const QR_MATRIX = [
  [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1],
  [0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0],
  [1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1],
  [0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0],
  [1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0],
  [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
  [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1],
];

const SERVICE_CATEGORIES = [
  { label: "행사 참가 신청", path: "/registration/apply" },
  { label: "신청 내역 조회", path: "/registration/applyhistory" },
  { label: "결제 내역", path: "/registration/paymenthistory" },
  { label: "QR 체크인", path: "/registration/qrcheckin" },
];

const SUBTITLE_MAP = {
  "/registration/apply": "행사에 참가 신청하세요",
  "/registration/applyhistory": "신청한 행사 참가 내역을 확인하세요",
  "/registration/paymenthistory": "결제 완료 내역을 확인하세요",
  "/registration/qrcheckin": "내 QR 코드를 확인하세요",
};

const STATUS_META = {
  ISSUED: { label: "발급됨 (비활성)", color: "#B45309", bg: "#FEF3C7", canEnter: false },
  ACTIVE: { label: "활성", color: "#15803D", bg: "#DCFCE7", canEnter: true },
  EXPIRED: { label: "만료", color: "#6B7280", bg: "#F3F4F6", canEnter: false },
};

const REGISTRATION_STATUS_LABEL = {
  APPLIED: "신청완료",
  APPROVED: "승인완료",
  CANCELLED: "신청취소",
  REJECTED: "승인거절",
};

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .qr-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #F5F6FA; min-height: 100vh;
  }
  .qr-root *, .qr-root *::before, .qr-root *::after { box-sizing: border-box; font-family: inherit; }
  .qr-container { max-width: 860px; margin: 0 auto; padding: 28px 20px 80px; }

  .qr-page-title { font-size: 17px; font-weight: 800; color: #111827; margin-bottom: 4px; letter-spacing: -0.3px; }
  .qr-page-sub { font-size: 13px; color: #9CA3AF; margin-bottom: 20px; }

  .qr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .qr-card {
    background: #fff; border: 1px solid #EBEBEB; border-radius: 16px; padding: 24px;
  }
  .qr-card-title {
    font-size: 14px; font-weight: 800; color: #111827;
    margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #F3F4F6;
    display: flex; align-items: center; gap: 9px;
  }
  .qr-card-title-icon {
    width: 28px; height: 28px; border-radius: 8px;
    background: #EEF2FF; display: flex; align-items: center; justify-content: center; color: #1B50D9;
  }

  .qr-display-wrap { text-align: center; }
  .qr-box {
    width: 176px; height: 176px; margin: 0 auto 14px;
    background: #fff; border: 1.5px solid #EBEBEB; border-radius: 16px;
    padding: 14px; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 16px rgba(0,0,0,0.06);
    overflow: hidden;
  }
  .qr-svg { width: 100%; height: 100%; }
  .qr-img { width: 100%; height: 100%; object-fit: contain; }
  .qr-code-num {
    font-size: 13px; font-weight: 800; color: #1B50D9;
    font-family: 'Courier New', monospace; letter-spacing: 0.06em; margin-bottom: 3px;
  }
  .qr-event-name { font-size: 12.5px; color: #6B7280; }

  .qr-ticket-info {
    background: #F5F8FF; border: 1.5px solid #DBEAFE; border-radius: 12px;
    padding: 14px 16px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 8px;
  }
  .qr-ticket-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; gap: 8px; }
  .qr-ticket-label { display: flex; align-items: center; gap: 6px; color: #9CA3AF; white-space: nowrap; }
  .qr-ticket-val { font-weight: 700; color: #111827; text-align: right; word-break: break-all; }
  .qr-status-ok { display: flex; align-items: center; gap: 5px; font-weight: 700; font-size: 13px; }

  .qr-btn-row { display: flex; gap: 8px; }
  .qr-btn {
    flex: 1; padding: 10px 0; font-size: 13px; font-weight: 700;
    border-radius: 10px; cursor: pointer; transition: all 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .qr-btn-outline { border: 1.5px solid #EBEBEB; background: #fff; color: #374151; }
  .qr-btn-outline:hover { border-color: #9CA3AF; }
  .qr-btn-primary { border: none; background: #1B50D9; color: #fff; }
  .qr-btn-primary:hover { background: #1640B8; }
  .qr-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .qr-field { margin-bottom: 14px; }
  .qr-label { font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 7px; display: block; letter-spacing: 0.01em; }
  .qr-select {
    width: 100%; height: 42px; padding: 0 14px;
    border: 1.5px solid #EBEBEB; border-radius: 10px;
    font-size: 14px; color: #111827; outline: none;
    background: #fff;
  }
  .qr-select:focus { border-color: #1B50D9; box-shadow: 0 0 0 3px rgba(27,80,217,0.1); }

  .qr-result-ok {
    padding: 14px 16px; background: #DCFCE7; border: 1.5px solid #86EFAC; border-radius: 12px;
  }
  .qr-result-title { font-size: 14px; font-weight: 800; color: #15803D; margin-bottom: 5px; display: flex; align-items: center; gap: 6px; }
  .qr-result-body { font-size: 13px; color: #166534; line-height: 1.6; }

  .qr-notice { margin-top: 22px; padding-top: 18px; border-top: 1px solid #F3F4F6; }
  .qr-notice-title { font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 10px; display: flex; align-items: center; gap: 5px; }
  .qr-notice-item { font-size: 12.5px; color: #9CA3AF; line-height: 2; display: flex; align-items: flex-start; gap: 6px; }
  .qr-notice-dot { width: 3px; height: 3px; border-radius: 50%; background: #D1D5DB; flex-shrink: 0; margin-top: 9px; }
  .qr-error { color: #B91C1C; font-size: 13px; margin-top: 8px; }

  @media (max-width: 680px) {
    .qr-grid { grid-template-columns: 1fr; }
    .qr-container { padding: 20px 16px 64px; }
  }
`;

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
}

function formatDateRange(startAt, endAt) {
  if (!startAt && !endAt) return "일정 정보 없음";
  const start = formatDateTime(startAt);
  const end = formatDateTime(endAt);
  return `${start} ~ ${end}`;
}

function formatRegistrationStatus(status) {
  const key = String(status || "").toUpperCase();
  return REGISTRATION_STATUS_LABEL[key] || String(status || "-");
}

function getDownloadFilename(contentDisposition, fallback) {
  const value = String(contentDisposition || "");
  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }
  const basicMatch = value.match(/filename=\"?([^\";]+)\"?/i);
  return basicMatch?.[1] || fallback;
}

export default function QRCheckin() {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const queryEventId = Number(query.get("eventId"));

  const currentPath = "/registration/qrcheckin";
  const [registrations, setRegistrations] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [eventDetail, setEventDetail] = useState(null);
  const [eventNameById, setEventNameById] = useState({});
  const [qrInfo, setQrInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingQr, setLoadingQr] = useState(false);
  const [error, setError] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [useImage, setUseImage] = useState(true);

  const registrationMap = useMemo(() => {
    return new Map(registrations.map((item) => [item.eventId, item]));
  }, [registrations]);

  useEffect(() => {
    let mounted = true;

    const fetchRegistrations = async () => {
      if (!tokenStore.getAccess()) {
        const goLogin = window.confirm("로그인이 필요한 서비스입니다.\n로그인 페이지로 이동하시겠습니까?");
        if (goLogin) {
          navigate("/auth/login", { state: { from: location.pathname + location.search } });
        } else {
          navigate(-1);
        }
        return;
      }

      setLoading(true);
      setError("");

      try {
        const res = await axiosInstance.get("/api/users/me/event-registrations", {
          params: { page: 0, size: 200, sort: "appliedAt,desc" },
        });

        const rows = res?.data?.data?.content ?? [];
        const dedup = [];
        const seen = new Set();

        for (const row of rows) {
          if (!row?.eventId || seen.has(row.eventId)) continue;
          seen.add(row.eventId);
          dedup.push(row);
        }

        const approvedOnly = dedup.filter((r) => {
          const status = String(r?.status || "").toUpperCase();
          return status === "APPROVED" || status === "승인완료";
        });

        if (!mounted) return;
        setRegistrations(approvedOnly);

        const fallback = approvedOnly[0] || null;
        const selected = Number.isFinite(queryEventId) && approvedOnly.some((r) => r.eventId === queryEventId)
          ? queryEventId
          : fallback?.eventId ?? null;

        setSelectedEventId(selected);
      } catch (e) {
        if (!mounted) return;
        const message = e?.response?.data?.error?.message || "신청 이벤트 목록을 불러오지 못했습니다.";
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRegistrations();
    return () => {
      mounted = false;
    };
  }, [navigate, queryEventId]);

  useEffect(() => {
    let mounted = true;

    const fetchEventNames = async () => {
      if (!registrations.length) {
        setEventNameById({});
        return;
      }

      const entries = await Promise.all(
        registrations.map(async (item) => {
          try {
            const eventRes = await eventApi.getEventDetail(item.eventId);
            return [
              item.eventId,
              normalizeEventTitle(eventRes?.data?.data?.eventName, eventRes?.data?.data || {}) ||
                `이벤트 #${item.eventId}`,
            ];
          } catch {
            return [item.eventId, `이벤트 #${item.eventId}`];
          }
        }),
      );

      if (mounted) {
        setEventNameById(Object.fromEntries(entries));
      }
    };

    fetchEventNames();
    return () => {
      mounted = false;
    };
  }, [registrations]);

  const loadQr = async (eventId) => {
    if (!eventId) return;

    setLoadingQr(true);
    setError("");
    setUseImage(true);

    try {
      const [qrRes, eventRes] = await Promise.all([
        axiosInstance.get("/api/qr/me", { params: { eventId } }),
        eventApi.getEventDetail(eventId),
      ]);

      setQrInfo(qrRes?.data?.data ?? null);
      setEventDetail(eventRes?.data?.data ?? null);
    } catch (e) {
      const message = e?.response?.data?.error?.message || "QR 정보를 불러오지 못했습니다.";
      setError(message);
    } finally {
      setLoadingQr(false);
    }
  };

  useEffect(() => {
    if (!selectedEventId) {
      setQrInfo(null);
      setEventDetail(null);
      return;
    }
    loadQr(selectedEventId);
  }, [selectedEventId]);

  const statusMeta = STATUS_META[qrInfo?.qrStatus] || {
    label: "확인 필요",
    color: "#6B7280",
    bg: "#F3F4F6",
    canEnter: false,
  };

  const selectedRegistration = selectedEventId ? registrationMap.get(selectedEventId) : null;

  const handleSendSMS = async () => {
    if (!qrInfo || !eventDetail) return;

    const smsMessage =
      `[${normalizeEventTitle(eventDetail?.eventName, eventDetail || {}) || "이벤트"}]\n` +
      `QR 번호: QR-${qrInfo.qrId}\n` +
      `행사일: ${formatDateRange(eventDetail.startAt, eventDetail.endAt)}\n` +
      `장소: ${eventDetail.location || "-"}\n` +
      `상태: ${statusMeta.label}`;

    setSmsSending(true);
    setError("");
    try {
      const res = await axiosInstance.post("/api/qr/me/sms-test", {
        eventId: selectedEventId,
        phone: "LOCAL-TEST",
        message: smsMessage,
      });
      console.info("[QR SMS TEST]", res?.data?.data);
      setSmsSent(true);
      setTimeout(() => setSmsSent(false), 3000);
    } catch (e) {
      const message = e?.response?.data?.error?.message || "문자 테스트 요청에 실패했습니다.";
      setError(message);
    } finally {
      setSmsSending(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedEventId) return;

    setDownloading(true);
    setError("");

    try {
      const response = await axiosInstance.get("/api/qr/me/download", {
        params: { eventId: selectedEventId },
        responseType: "blob",
      });
      const filename = getDownloadFilename(
        response?.headers?.["content-disposition"],
        `qr-${qrInfo?.qrId ?? "code"}.png`,
      );
      const objectUrl = URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (e) {
      const message = e?.response?.data?.error?.message || "QR 이미지를 저장하지 못했습니다.";
      setError(message);
    } finally {
      setDownloading(false);
    }
  };

  const notices = [
    "QR 코드는 행사 시작 1시간 전부터 활성화됩니다.",
    "이벤트별로 1인 1QR 정책이 적용됩니다.",
    "행사 종료 후 QR은 자동 만료됩니다.",
    "문제 발생 시 운영팀에 문의해 주세요.",
  ];

  return (
    <div className="qr-root">
      <style>{styles}</style>

      <PageHeader
        title="QR 체크인"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
      />

      <main className="qr-container">
        <div className="qr-page-title">QR 발급/조회</div>
        <div className="qr-page-sub">신청한 이벤트를 선택하면 QR을 조회하고, 없으면 자동 발급됩니다.</div>

        <div className="qr-grid">
          <div className="qr-card">
              <div className="qr-card-title">
                <div className="qr-card-title-icon">
                  <Smartphone size={14} />
                </div>
                내 QR 정보
              </div>

            <div className="qr-display-wrap">
              <div className="qr-box">
                {qrInfo?.originalUrl && useImage ? (
                  <img
                    className="qr-img"
                    src={qrInfo.originalUrl}
                    alt="QR 코드"
                    onError={() => setUseImage(false)}
                  />
                ) : (
                  <svg className="qr-svg" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                    {QR_MATRIX.map((row, ri) =>
                      row.map((cell, ci) =>
                        cell === 1 ? (
                          <rect key={`${ri}-${ci}`} x={ci} y={ri} width="1" height="1" fill="#111827" rx="0.08" />
                        ) : null,
                      ),
                    )}
                  </svg>
                )}
              </div>
              <div className="qr-code-num">{qrInfo?.qrId ? `QR-${qrInfo.qrId}` : "QR-"}</div>
              <div className="qr-event-name">
                {normalizeEventTitle(eventDetail?.eventName, eventDetail || {}) || "이벤트를 선택해 주세요"}
              </div>
            </div>

            <div className="qr-ticket-info">
              <div className="qr-ticket-row">
                <span className="qr-ticket-label">
                  <Calendar size={13} /> 행사일
                </span>
                <span className="qr-ticket-val">{formatDateRange(eventDetail?.startAt, eventDetail?.endAt)}</span>
              </div>
              <div className="qr-ticket-row">
                <span className="qr-ticket-label">
                  <MapPin size={13} /> 장소
                </span>
                <span className="qr-ticket-val">{eventDetail?.location || "-"}</span>
              </div>
              <div className="qr-ticket-row">
                <span className="qr-ticket-label">
                  <Clock size={13} /> 활성 시작
                </span>
                <span className="qr-ticket-val">{formatDateTime(qrInfo?.activeFrom)}</span>
              </div>
              <div className="qr-ticket-row">
                <span className="qr-ticket-label">
                  <ShieldCheck size={13} /> 상태
                </span>
                <span className="qr-status-ok" style={{ color: statusMeta.color, background: statusMeta.bg, padding: "4px 10px", borderRadius: 999 }}>
                  <CheckCircle2 size={13} /> {statusMeta.label}
                </span>
              </div>
            </div>

            <div className="qr-btn-row">
              <button className="qr-btn qr-btn-outline" onClick={handleSendSMS} disabled={!qrInfo || smsSending}>
                <MessageSquare size={13} />
                {smsSending ? "요청 중..."
                  : smsSent
                    ? "발송됨"
                    : "문자 받기"}
              </button>
              <button className="qr-btn qr-btn-primary" onClick={handleDownload} disabled={!selectedEventId || downloading}>
                <Download size={13} />
                {downloading ? "저장 중..." : "이미지 저장"}
              </button>
            </div>
          </div>

          <div className="qr-card">
              <div className="qr-card-title">
                <div className="qr-card-title-icon">
                  <RefreshCw size={14} />
                </div>
                이벤트 선택
              </div>

            <div className="qr-field">
              <label className="qr-label">신청한 이벤트</label>
              <select
                className="qr-select"
                value={selectedEventId ?? ""}
                onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : null)}
                disabled={loading || registrations.length === 0}
              >
                {registrations.length === 0 ? (
                  <option value="">승인완료된 이벤트가 없습니다</option>
                ) : (
                  registrations.map((item) => (
                    <option key={item.applyId ?? item.eventId} value={item.eventId}>
                      {(eventNameById[item.eventId] || `이벤트 #${item.eventId}`)} ({formatRegistrationStatus(item.status)})
                    </option>
                  ))
                )}
              </select>
            </div>

            <button
              className="qr-btn qr-btn-primary"
              style={{ width: "100%", marginBottom: 16 }}
              onClick={() => loadQr(selectedEventId)}
              disabled={!selectedEventId || loadingQr}
            >
              <RefreshCw size={15} />
              {loadingQr ? "조회 중..." : "QR 발급/조회"}
            </button>

            {selectedRegistration && (
              <div className="qr-result-ok">
              <div className="qr-result-title">
                  <CheckCircle2 size={16} /> 신청 상태: {formatRegistrationStatus(selectedRegistration.status)}
                </div>
                <div className="qr-result-body">
                  신청일: {formatDateTime(selectedRegistration.appliedAt)}
                  <br />
                  만료 시각: {formatDateTime(qrInfo?.expiredAt)}
                </div>
              </div>
            )}

            {error ? <div className="qr-error">{error}</div> : null}

            <div className="qr-notice">
              <div className="qr-notice-title">
                <Info size={13} color="#9CA3AF" /> 안내사항
              </div>
              {notices.map((n, i) => (
                <div key={i} className="qr-notice-item">
                  <div className="qr-notice-dot" />
                  {n}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

