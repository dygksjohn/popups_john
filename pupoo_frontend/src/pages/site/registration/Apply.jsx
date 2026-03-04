﻿import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, ClipboardList, ChevronRight, MapPin } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { eventApi } from "../../../app/http/eventApi";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { tokenStore } from "../../../app/http/tokenStore";

const SERVICE_CATEGORIES = [
  { label: "행사 참가 신청", path: "/registration/apply" },
  { label: "신청 내역 조회", path: "/registration/applyhistory" },
  { label: "결제 내역", path: "/registration/paymenthistory" },
  { label: "QR 체크인", path: "/registration/qrcheckin" },
];

const SUBTITLE_MAP = {
  "/registration/apply": "행사에 참가 신청하세요",
  "/registration/applyhistory": "나의 행사 참가 신청 이력을 확인하세요",
  "/registration/paymenthistory": "결제 완료된 내역을 확인하세요",
  "/registration/qrcheckin": "내 QR 코드를 확인하세요",
};

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .reg-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #F5F6FA;
    min-height: 100vh;
  }
  .reg-root *, .reg-root *::before, .reg-root *::after { box-sizing: border-box; font-family: inherit; }
  .reg-container { max-width: 860px; margin: 0 auto; padding: 28px 20px 80px; }

  .reg-card {
    background: #fff; border: 1px solid #EBEBEB; border-radius: 16px;
    padding: 24px; margin-bottom: 12px;
  }
  .reg-card-scroll { display: flex; flex-direction: column; }

  .reg-card-title {
    font-size: 15px; font-weight: 700; color: #111827;
    margin: 0; display: flex; align-items: center; gap: 9px;
  }
  .reg-card-title-icon {
    width: 28px; height: 28px; border-radius: 8px;
    background: #EEF2FF; display: flex; align-items: center; justify-content: center; color: #1B50D9;
  }

  .reg-card-head {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #F3F4F6;
    position: sticky;
    top: 0;
    z-index: 5;
    background: #fff;
  }
  .reg-status-filters { display: flex; gap: 6px; }
  .reg-status-btn {
    height: 30px; padding: 0 12px; border-radius: 999px;
    border: 1.5px solid #E5E7EB; background: #fff;
    font-size: 12px; font-weight: 700; color: #6B7280; cursor: pointer;
  }
  .reg-status-btn.active { border-color: #1B50D9; color: #1B50D9; background: #EEF2FF; }
  .reg-search-input {
    height: 32px;
    min-width: 220px;
    padding: 0 12px;
    border-radius: 10px;
    border: 1.5px solid #E5E7EB;
    background: #fff;
    color: #111827;
    font-size: 12.5px;
    outline: none;
  }
  .reg-search-input:focus {
    border-color: #1B50D9;
    box-shadow: 0 0 0 3px rgba(27,80,217,0.1);
  }

  .reg-event-scroll {
    overflow-y: auto;
    padding-right: 4px;
    max-height: 760px;
  }
  .reg-event-list { display: flex; flex-direction: column; gap: 10px; }
  .reg-event-item {
    border: 1.5px solid #EBEBEB; border-radius: 12px; padding: 16px;
    cursor: pointer; transition: all 0.15s;
    display: flex; align-items: center; gap: 14px;
  }
  .reg-event-item.selected { border-color: #1B50D9; background: #F5F8FF; }
  .reg-event-item:hover:not(.selected) { border-color: #C7D2FA; }

  .reg-event-radio {
    width: 20px; height: 20px; border-radius: 50%; border: 2px solid #D1D5DB;
    flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  }
  .reg-event-item.selected .reg-event-radio { border-color: #1B50D9; }
  .reg-event-radio-dot { width: 10px; height: 10px; border-radius: 50%; background: #1B50D9; opacity: 0; }
  .reg-event-item.selected .reg-event-radio-dot { opacity: 1; }

  .reg-event-info { flex: 1; min-width: 0; }
  .reg-event-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; }
  .reg-event-name { font-size: 14px; font-weight: 700; color: #111827; }
  .reg-event-meta { font-size: 12.5px; color: #6B7280; margin-top: 4px; display: flex; align-items: center; gap: 5px; }

  .reg-event-badge {
    padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 700;
    flex-shrink: 0;
  }
  .reg-event-badge.ONGOING { background: #DCFCE7; color: #166534; }
  .reg-event-badge.PLANNED { background: #DBEAFE; color: #1D4ED8; }

  .reg-event-price {
    margin-left: auto;
    margin-right: 10px;
    font-size: 13px;
    font-weight: 800;
    color: #111827;
    white-space: nowrap;
  }

  .reg-event-action { margin-left: auto; flex-shrink: 0; }

  .reg-btn {
    padding: 11px 24px; border-radius: 10px; font-size: 14px; font-weight: 700;
    cursor: pointer; border: none; transition: all 0.15s;
    display: flex; align-items: center; gap: 6px;
  }
  .reg-btn-primary { background: #1B50D9; color: #fff; }
  .reg-btn-primary:hover { background: #1640B8; }
  .reg-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .reg-btn-outline { border: 1.5px solid #D1D5DB; background: #fff; color: #374151; }
  .reg-btn-outline:hover { border-color: #9CA3AF; }
  .reg-btn-history {
    background: #FFFFFF;
    border: 1.5px solid #D1D5DB;
    color: #6B7280;
  }

  .reg-msg { font-size: 13px; margin-top: 12px; }
  .reg-msg.error { color: #B91C1C; }
  .reg-msg.ok { color: #166534; }

  .reg-empty {
    text-align: center; padding: 40px 20px; border: 1px dashed #D1D5DB;
    border-radius: 12px; color: #6B7280; font-size: 14px;
  }

  @media (max-width: 720px) {
    .reg-container { padding: 20px 16px 64px; }
    .reg-event-scroll { max-height: 520px; }
    .reg-search-input { min-width: 150px; }
  }
`;

function formatDate(value) {
  if (!value) return "일정 미정";
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "일정 미정";
  return `${m[1]}.${m[2]}.${m[3]}`;
}

function normalizeDateKeyword(value) {
  return String(value || "").trim().replace(/\./g, "-");
}

function formatPrice(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "무료";
  return `${amount.toLocaleString()}원`;
}

export default function Apply() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = "/registration/apply";

  const [events, setEvents] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ONGOING");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [registrationStatusByEvent, setRegistrationStatusByEvent] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await eventApi.getEvents({ page: 0, size: 100, sort: "startAt,asc" });
        const rows = res?.data?.data?.content ?? [];
        const available = rows
          .filter((e) => e?.status === "ONGOING" || e?.status === "PLANNED")
          .sort((a, b) => {
            const aTime = a?.endAt ? new Date(a.endAt).getTime() : Number.POSITIVE_INFINITY;
            const bTime = b?.endAt ? new Date(b.endAt).getTime() : Number.POSITIVE_INFINITY;
            return aTime - bTime;
          });

        if (!mounted) return;
        setEvents(available);

        const ongoing = available.find((e) => e.status === "ONGOING");
        const planned = available.find((e) => e.status === "PLANNED");
        setSelectedEventId((ongoing ?? planned ?? available[0])?.eventId ?? null);

        if (tokenStore.getAccess()) {
          const regRes = await axiosInstance.get("/api/users/me/event-registrations", {
            params: { page: 0, size: 200, sort: "appliedAt,desc" },
          });
          const regRows = regRes?.data?.data?.content ?? [];
          const map = {};
          for (const row of regRows) {
            if (!row?.eventId || map[row.eventId]) continue;
            map[row.eventId] = row.status;
          }
          if (mounted) setRegistrationStatusByEvent(map);
        }
      } catch (e) {
        if (!mounted) return;
        const message =
          e?.response?.data?.error?.message ||
          e?.response?.data?.message ||
          "행사 목록을 불러오지 못했습니다.";
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    const keywordRaw = searchKeyword.trim();
    const keyword = keywordRaw.toLowerCase();
    const keywordDate = normalizeDateKeyword(keywordRaw);
    return events.filter((e) => {
      if (e?.status !== statusFilter) return false;
      if (!keyword) return true;
      const name = String(e?.eventName || "").toLowerCase();
      const location = String(e?.location || "").toLowerCase();
      const startDate = String(e?.startAt || "").slice(0, 10);
      const endDate = String(e?.endAt || "").slice(0, 10);
      return (
        name.includes(keyword) ||
        location.includes(keyword) ||
        startDate.includes(keywordDate) ||
        endDate.includes(keywordDate)
      );
    });
  }, [events, statusFilter, searchKeyword]);

  useEffect(() => {
    if (!filteredEvents.some((e) => Number(e.eventId) === Number(selectedEventId))) {
      setSelectedEventId(filteredEvents[0]?.eventId ?? null);
    }
  }, [filteredEvents, selectedEventId]);

  const handleApply = async (targetEventId = selectedEventId) => {
    if (!targetEventId || submitting) return;

    if (!tokenStore.getAccess()) {
      navigate("/auth/login", {
        state: { from: `${location.pathname}${location.search}` },
      });
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    const targetEvent = events.find((e) => Number(e.eventId) === Number(targetEventId)) || null;
    const amount = Number(targetEvent?.baseFee ?? 0);
    const params = new URLSearchParams({
      eventId: String(targetEventId),
      amount: String(Number.isFinite(amount) ? amount : 0),
      title: targetEvent?.eventName || "",
      returnUrl: location?.pathname || "/",
    });

    try {
      await axiosInstance.post("/api/event-registrations", {
        eventId: Number(targetEventId),
      });
      navigate(`/payment/checkout?${params.toString()}`);
    } catch (e) {
      if (e?.response?.status === 409) {
        navigate(`/payment/checkout?${params.toString()}`);
      } else if (e?.response?.status === 401) {
        navigate("/auth/login", {
          state: { from: `${location.pathname}${location.search}` },
        });
      } else {
        const message =
          e?.response?.data?.error?.message ||
          e?.response?.data?.message ||
          "참가 신청에 실패했습니다.";
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reg-root">
      <style>{styles}</style>

      <PageHeader
        title="행사 참가 신청"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
      />

      <main className="reg-container">
        <section className="reg-card reg-card-scroll">
          <div className="reg-card-head">
            <h3 className="reg-card-title">
              <span className="reg-card-title-icon">
                <ClipboardList size={14} />
              </span>
              행사 선택
            </h3>
            <div className="reg-status-filters">
              <button
                type="button"
                className={`reg-status-btn${statusFilter === "ONGOING" ? " active" : ""}`}
                onClick={() => setStatusFilter("ONGOING")}
              >
                ONGOING
              </button>
              <button
                type="button"
                className={`reg-status-btn${statusFilter === "PLANNED" ? " active" : ""}`}
                onClick={() => setStatusFilter("PLANNED")}
              >
                PLANNED
              </button>
            </div>
            <input
              className="reg-search-input"
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="행사명/장소 검색"
            />
          </div>

          <div className="reg-event-scroll">
            {loading ? (
              <div className="reg-empty">행사 목록을 불러오는 중...</div>
            ) : filteredEvents.length === 0 ? (
              <div className="reg-empty">선택한 상태의 신청 가능 행사가 없습니다.</div>
            ) : (
              <div className="reg-event-list">
                {filteredEvents.map((ev) => {
                  const selected = Number(ev.eventId) === Number(selectedEventId);
                  const registrationStatus = String(registrationStatusByEvent[ev.eventId] || "").toUpperCase();
                  const isApproved = registrationStatus === "APPROVED" || registrationStatus === "승인완료";
                  return (
                    <div
                      key={ev.eventId}
                      className={`reg-event-item${selected ? " selected" : ""}`}
                      onClick={() => setSelectedEventId(ev.eventId)}
                    >
                      <div className="reg-event-radio">
                        <div className="reg-event-radio-dot" />
                      </div>
                      <div className="reg-event-info">
                        <div className="reg-event-title-row">
                          <div className={`reg-event-badge ${ev.status || ""}`}>{ev.status || "-"}</div>
                          <div className="reg-event-name">{ev.eventName}</div>
                        </div>
                        <div className="reg-event-meta">
                          <CalendarDays size={13} /> {formatDate(ev.startAt)} ~ {formatDate(ev.endAt)}
                        </div>
                        <div className="reg-event-meta">
                          <MapPin size={13} /> {ev.location || "장소 미정"}
                        </div>
                      </div>
                      <div className="reg-event-price">{formatPrice(ev.baseFee)}</div>
                      {isApproved ? (
                        <button
                          className="reg-btn reg-btn-history reg-event-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/registration/applyhistory");
                          }}
                          type="button"
                        >
                          신청내역조회
                        </button>
                      ) : (
                        <button
                          className="reg-btn reg-btn-primary reg-event-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApply(ev.eventId);
                          }}
                          disabled={submitting}
                          type="button"
                        >
                          {submitting ? "신청 중..." : "참가 신청"}
                          <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {error ? <div className="reg-msg error">{error}</div> : null}
        {success ? <div className="reg-msg ok">{success}</div> : null}
      </main>
    </div>
  );
}
