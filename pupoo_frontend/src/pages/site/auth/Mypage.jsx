import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mypageApi } from "./api/mypageApi";
import { notificationApi } from "../../../app/http/notificationApi";
import { reviewApi } from "../../../app/http/reviewApi";
import { eventApi } from "../../../app/http/eventApi";

const styles = `
  .mp-root {
    box-sizing: border-box;
    font-family: "Pretendard Variable", "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #f5f7fb;
    min-height: 100vh;
    color: #0f172a;
  }
  .mp-root *, .mp-root *::before, .mp-root *::after {
    box-sizing: border-box;
    font-family: inherit;
  }
  .mp-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 108px 20px 64px;
  }
  .mp-header {
    margin-bottom: 18px;
  }
  .mp-title {
    margin: 0;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.03em;
  }
  .mp-subtitle {
    margin: 8px 0 0;
    font-size: 14px;
    color: #64748b;
  }
  .mp-tabs {
    margin-top: 18px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .mp-tab {
    border: 1px solid #dbe2ef;
    border-radius: 999px;
    background: #fff;
    color: #334155;
    font-size: 13px;
    font-weight: 600;
    padding: 7px 14px;
    cursor: pointer;
  }
  .mp-tab.active {
    background: #1d4ed8;
    border-color: #1d4ed8;
    color: #fff;
  }
  .mp-tab-badge {
    margin-left: 6px;
    background: #ef4444;
    color: #fff;
    border-radius: 999px;
    padding: 1px 6px;
    font-size: 11px;
    font-weight: 700;
  }
  .mp-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  }
  .mp-profile {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 22px;
  }
  .mp-profile-left {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }
  .mp-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1d4ed8, #2563eb);
    color: #fff;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }
  .mp-name {
    font-size: 18px;
    font-weight: 800;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 260px;
  }
  .mp-email {
    margin-top: 4px;
    color: #64748b;
    font-size: 13px;
  }
  .mp-joined {
    margin-top: 6px;
    font-size: 12px;
    color: #475569;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 999px;
    display: inline-flex;
    padding: 4px 10px;
  }
  .mp-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .mp-btn {
    border-radius: 10px;
    border: 1px solid #dbe2ef;
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }
  .mp-btn.primary {
    border-color: #1d4ed8;
    background: #1d4ed8;
    color: #fff;
  }
  .mp-btn.ghost {
    background: #fff;
    color: #334155;
  }
  .mp-grid4 {
    margin-top: 14px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }
  .mp-stat {
    padding: 16px;
  }
  .mp-stat-label {
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
  }
  .mp-stat-value {
    margin-top: 8px;
    font-size: 30px;
    line-height: 1;
    font-weight: 800;
    letter-spacing: -0.03em;
  }
  .mp-stat-unit {
    margin-left: 4px;
    color: #64748b;
    font-size: 14px;
    font-weight: 600;
  }
  .mp-grid2 {
    margin-top: 14px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .mp-section {
    padding: 16px;
  }
  .mp-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
  }
  .mp-section-title {
    margin: 0;
    font-size: 15px;
    font-weight: 800;
  }
  .mp-count {
    font-size: 12px;
    color: #475569;
    background: #f1f5f9;
    border-radius: 999px;
    padding: 4px 10px;
    border: 1px solid #e2e8f0;
  }
  .mp-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .mp-item {
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 12px;
    background: #fff;
  }
  .mp-item.clickable {
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .mp-item.clickable:hover {
    border-color: #bfdbfe;
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.12);
  }
  .mp-item-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .mp-item-title {
    font-size: 14px;
    font-weight: 700;
    color: #111827;
  }
  .mp-item-meta {
    margin-top: 6px;
    font-size: 12px;
    color: #6b7280;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .mp-badge {
    padding: 3px 9px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    border: 1px solid transparent;
  }
  .mp-badge.applied {
    background: #eff6ff;
    color: #1d4ed8;
    border-color: #bfdbfe;
  }
  .mp-badge.approved {
    background: #ecfdf3;
    color: #047857;
    border-color: #a7f3d0;
  }
  .mp-badge.cancelled {
    background: #fef2f2;
    color: #b91c1c;
    border-color: #fecaca;
  }
  .mp-badge.rejected {
    background: #f8fafc;
    color: #475569;
    border-color: #e2e8f0;
  }
  .mp-noti-title {
    font-size: 13px;
    font-weight: 700;
    color: #1e293b;
  }
  .mp-noti-content {
    margin-top: 4px;
    font-size: 12px;
    color: #64748b;
    line-height: 1.45;
    white-space: pre-wrap;
  }
  .mp-noti-time {
    margin-top: 6px;
    font-size: 11px;
    color: #94a3b8;
  }
  .mp-empty {
    padding: 20px 12px;
    text-align: center;
    color: #94a3b8;
    font-size: 13px;
    border: 1px dashed #dbe2ef;
    border-radius: 10px;
    background: #fafcff;
  }
  .mp-danger {
    margin: 10px 0;
    color: #b91c1c;
    font-size: 13px;
  }
  .mp-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.55);
    z-index: 2500;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .mp-modal {
    width: min(560px, 100%);
    background: #fff;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.3);
    padding: 18px;
  }
  .mp-modal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .mp-modal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 800;
  }
  .mp-close {
    border: 1px solid #dbe2ef;
    border-radius: 8px;
    background: #fff;
    width: 32px;
    height: 32px;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
  }
  .mp-field {
    margin-top: 10px;
  }
  .mp-label {
    font-size: 12px;
    color: #64748b;
    font-weight: 700;
    margin-bottom: 6px;
    display: block;
  }
  .mp-select {
    width: 100%;
    height: 40px;
    border: 1px solid #dbe2ef;
    border-radius: 10px;
    padding: 0 10px;
    font-size: 14px;
    color: #0f172a;
    background: #fff;
  }
  .mp-qr-box {
    margin-top: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 14px;
    background: #f8fafc;
    text-align: center;
  }
  .mp-qr-image {
    width: 180px;
    height: 180px;
    object-fit: contain;
    background: #fff;
    border: 1px solid #dbe2ef;
    border-radius: 10px;
    padding: 10px;
  }
  .mp-qr-meta {
    margin-top: 10px;
    font-size: 12px;
    color: #475569;
    line-height: 1.7;
  }
  .mp-modal-actions {
    margin-top: 14px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  @media (max-width: 900px) {
    .mp-grid4 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .mp-grid2 {
      grid-template-columns: 1fr;
    }
    .mp-profile {
      flex-direction: column;
      align-items: flex-start;
    }
    .mp-actions {
      justify-content: flex-start;
    }
  }
`;

const TABS = [
  { key: "overview", label: "내 정보" },
  { key: "events", label: "신청 행사" },
  { key: "history", label: "참여 이력" },
  { key: "notifications", label: "알림" },
];

const REG_STATUS_LABEL = {
  APPLIED: "신청 완료",
  APPROVED: "승인 완료",
  CANCELLED: "취소",
  REJECTED: "거절",
};

function fmtDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function fmtDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}.${m}.${day} ${hh}:${mm}`;
}

function fmtRelative(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return "방금";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return fmtDateTime(value);
}

function statusClass(status) {
  const key = String(status || "").toUpperCase();
  if (key === "APPLIED") return "applied";
  if (key === "APPROVED") return "approved";
  if (key === "CANCELLED") return "cancelled";
  return "rejected";
}

function toInitial(name, email) {
  const source = String(name || "").trim() || String(email || "").trim() || "U";
  return source[0].toUpperCase();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function MyPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [eventMap, setEventMap] = useState({});
  const [participations, setParticipations] = useState([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrEventId, setQrEventId] = useState("");
  const [qrPayload, setQrPayload] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");

  const loadEventDetails = useCallback(async (ids) => {
    const eventIds = [...new Set(safeArray(ids).filter(Boolean))];
    if (eventIds.length === 0) return {};

    const results = await Promise.all(
      eventIds.map(async (eventId) => {
        try {
          const res = await eventApi.getEventDetail(eventId);
          return [String(eventId), res?.data?.data || null];
        } catch {
          return [String(eventId), null];
        }
      }),
    );

    return Object.fromEntries(results);
  }, []);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      setError("");

      const [
        meRes,
        regRes,
        visitRes,
        inboxRes,
        unreadRes,
      ] = await Promise.allSettled([
        mypageApi.getMe(),
        mypageApi.getMyEventRegistrations({ page: 0, size: 200 }),
        mypageApi.getMyBoothVisitsGroupedByEvent(),
        notificationApi.getInbox(0, 20),
        notificationApi.getUnreadCount(),
      ]);

      if (!mounted) return;

      const me = meRes.status === "fulfilled" ? meRes.value : null;
      const regPage = regRes.status === "fulfilled" ? regRes.value : null;
      const visitGroups = visitRes.status === "fulfilled" ? visitRes.value : [];
      const inboxData = inboxRes.status === "fulfilled" ? inboxRes.value : null;
      const unread = unreadRes.status === "fulfilled" ? Number(unreadRes.value) || 0 : 0;

      if (me) {
        setProfile({
          userId: me.userId,
          nickname: me.nickname || "회원",
          email: me.email || "-",
          createdAt: me.createdAt,
        });
      } else {
        setProfile({ userId: null, nickname: "회원", email: "-", createdAt: null });
      }

      const regRows = safeArray(regPage?.content).sort((a, b) => {
        const aa = new Date(a?.appliedAt || 0).getTime();
        const bb = new Date(b?.appliedAt || 0).getTime();
        return bb - aa;
      });
      setRegistrations(regRows);

      const mappedParticipations = safeArray(visitGroups)
        .map((group) => {
          const booths = safeArray(group?.booths);
          const totalVisits = booths.reduce((sum, booth) => sum + (Number(booth?.visitCount) || 0), 0);
          const lastVisitedAt = booths.reduce((latest, booth) => {
            const current = booth?.lastVisitedAt;
            if (!current) return latest;
            if (!latest) return current;
            return new Date(current).getTime() > new Date(latest).getTime() ? current : latest;
          }, null);

          return {
            eventId: group?.eventId,
            eventName: group?.eventName,
            boothCount: booths.length,
            totalVisits,
            lastVisitedAt,
          };
        })
        .filter((item) => item.eventId && item.totalVisits > 0)
        .sort((a, b) => {
          const aa = new Date(a?.lastVisitedAt || 0).getTime();
          const bb = new Date(b?.lastVisitedAt || 0).getTime();
          return bb - aa;
        });
      setParticipations(mappedParticipations);

      const eventIds = [
        ...regRows.map((row) => row?.eventId),
        ...mappedParticipations.map((row) => row?.eventId),
      ];
      const detailMap = await loadEventDetails(eventIds);
      if (!mounted) return;
      setEventMap(detailMap);

      const inboxItems = safeArray(inboxData?.items);
      setNotifications(inboxItems);
      setUnreadCount(unread || inboxItems.length);

      if (me?.userId != null) {
        try {
          const reviewPage = await reviewApi.list({
            page: 0,
            size: 1,
            searchType: "WRITER",
            keyword: String(me.userId),
          });
          if (!mounted) return;
          const total = Number(reviewPage?.totalElements);
          setReviewCount(Number.isFinite(total) ? total : safeArray(reviewPage?.content).length);
        } catch {
          if (!mounted) return;
          setReviewCount(0);
        }
      } else {
        setReviewCount(0);
      }

      const firstQrEvent = regRows.find((row) => {
        const s = String(row?.status || "").toUpperCase();
        return row?.eventId && (s === "APPLIED" || s === "APPROVED");
      });
      if (firstQrEvent?.eventId) {
        setQrEventId(String(firstQrEvent.eventId));
      }

      if (meRes.status === "rejected" || regRes.status === "rejected") {
        setError("일부 데이터를 불러오지 못했습니다. 다시 시도해주세요.");
      }

      setLoading(false);
    };

    run().catch(() => {
      if (!mounted) return;
      setError("마이페이지 데이터를 불러오는 중 오류가 발생했습니다.");
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [loadEventDetails]);

  const qrCandidates = useMemo(
    () =>
      registrations.filter((item) => {
        const status = String(item?.status || "").toUpperCase();
        return item?.eventId && (status === "APPLIED" || status === "APPROVED");
      }),
    [registrations],
  );

  const statRequested = registrations.length;
  const statCompleted = participations.length;
  const statQrUsed = participations.reduce(
    (sum, item) => sum + (Number(item?.totalVisits) || 0),
    0,
  );

  const recentRegistrations = useMemo(() => {
    return registrations.slice(0, 3).map((item) => {
      const detail = eventMap[String(item?.eventId)] || {};
      return {
        ...item,
        eventName: detail?.eventName || `행사 #${item?.eventId}`,
        location: detail?.location || "장소 정보 없음",
        startAt: detail?.startAt,
      };
    });
  }, [registrations, eventMap]);

  const participationRows = useMemo(() => {
    return participations.map((item) => {
      const detail = eventMap[String(item?.eventId)] || {};
      return {
        ...item,
        eventName: item?.eventName || detail?.eventName || `행사 #${item?.eventId}`,
        location: detail?.location || "장소 정보 없음",
      };
    });
  }, [participations, eventMap]);

  const issueQr = useCallback(async () => {
    if (!qrEventId) return;

    try {
      setQrLoading(true);
      setQrError("");
      const data = await mypageApi.issueMyQr(Number(qrEventId));
      setQrPayload(data || null);
    } catch (e) {
      setQrPayload(null);
      setQrError(e?.message || "QR 조회에 실패했습니다.");
    } finally {
      setQrLoading(false);
    }
  }, [qrEventId]);

  useEffect(() => {
    if (!qrModalOpen || !qrEventId) return;
    issueQr();
  }, [qrModalOpen, qrEventId, issueQr]);

  const openQrModal = () => {
    if (!qrEventId && qrCandidates[0]?.eventId) {
      setQrEventId(String(qrCandidates[0].eventId));
    }
    setQrError("");
    setQrPayload(null);
    setQrModalOpen(true);
  };

  const moveToEventPage = (eventId) => {
    if (!eventId) return;
    navigate(`/program/all/${eventId}`);
  };

  const renderRegistrationItem = (item, clickable = false) => {
    const detail = eventMap[String(item?.eventId)] || {};
    const status = String(item?.status || "").toUpperCase();
    const label = REG_STATUS_LABEL[status] || status || "-";

    return (
      <div
        className={`mp-item${clickable ? " clickable" : ""}`}
        key={`${item?.applyId}-${item?.eventId}`}
        onClick={clickable ? () => moveToEventPage(item?.eventId) : undefined}
      >
        <div className="mp-item-top">
          <div className="mp-item-title">{detail?.eventName || `행사 #${item?.eventId}`}</div>
          <span className={`mp-badge ${statusClass(status)}`}>{label}</span>
        </div>
        <div className="mp-item-meta">
          <span>신청일 {fmtDateTime(item?.appliedAt)}</span>
          <span>일정 {fmtDate(detail?.startAt)}</span>
          <span>{detail?.location || "장소 정보 없음"}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="mp-root">
      <style>{styles}</style>

      <main className="mp-container">
        <div className="mp-header">
          <h1 className="mp-title">마이페이지</h1>
          <p className="mp-subtitle">내 신청, 참여, 후기, 알림 정보를 실제 DB 데이터로 보여줍니다.</p>
          <div className="mp-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`mp-tab${activeTab === tab.key ? " active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {tab.key === "notifications" && unreadCount > 0 ? (
                  <span className="mp-tab-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {error ? <div className="mp-danger">{error}</div> : null}

        {activeTab === "overview" ? (
          <>
            <section className="mp-card mp-profile">
              <div className="mp-profile-left">
                <div className="mp-avatar">{toInitial(profile?.nickname, profile?.email)}</div>
                <div>
                  <div className="mp-name">{profile?.nickname || "회원"}</div>
                  <div className="mp-email">{profile?.email || "-"}</div>
                  <div className="mp-joined">가입일 {fmtDate(profile?.createdAt)}</div>
                </div>
              </div>
              <div className="mp-actions">
                <button
                  type="button"
                  className="mp-btn primary"
                  onClick={() => navigate("/mypage/profile")}
                >
                  회원정보 수정
                </button>
                <button type="button" className="mp-btn ghost" onClick={openQrModal}>
                  QR 코드
                </button>
              </div>
            </section>

            <section className="mp-grid4">
              <div className="mp-card mp-stat">
                <div className="mp-stat-label">신청 행사</div>
                <div className="mp-stat-value">{loading ? "-" : statRequested}<span className="mp-stat-unit">건</span></div>
              </div>
              <div className="mp-card mp-stat">
                <div className="mp-stat-label">참여 완료</div>
                <div className="mp-stat-value">{loading ? "-" : statCompleted}<span className="mp-stat-unit">건</span></div>
              </div>
              <div className="mp-card mp-stat">
                <div className="mp-stat-label">작성 후기</div>
                <div className="mp-stat-value">{loading ? "-" : reviewCount}<span className="mp-stat-unit">건</span></div>
              </div>
              <div className="mp-card mp-stat">
                <div className="mp-stat-label">QR 사용(스캔)</div>
                <div className="mp-stat-value">{loading ? "-" : statQrUsed}<span className="mp-stat-unit">회</span></div>
              </div>
            </section>

            <section className="mp-grid2">
              <div className="mp-card mp-section">
                <div className="mp-section-head">
                  <h3 className="mp-section-title">최근 신청 행사</h3>
                  <span className="mp-count">최신 3건</span>
                </div>
                <div className="mp-list">
                  {recentRegistrations.length === 0 ? (
                    <div className="mp-empty">신청한 행사가 없습니다.</div>
                  ) : (
                    recentRegistrations.map((item) => renderRegistrationItem(item, true))
                  )}
                </div>
              </div>

              <div className="mp-card mp-section">
                <div className="mp-section-head">
                  <h3 className="mp-section-title">최근 알림</h3>
                  <span className="mp-count">총 {notifications.length}건</span>
                </div>
                <div className="mp-list">
                  {notifications.slice(0, 4).length === 0 ? (
                    <div className="mp-empty">수신된 알림이 없습니다.</div>
                  ) : (
                    notifications.slice(0, 4).map((noti) => (
                      <div className="mp-item" key={noti?.inboxId || `${noti?.title}-${noti?.receivedAt}`}>
                        <div className="mp-noti-title">{noti?.title || "알림"}</div>
                        <div className="mp-noti-content">{noti?.content || "-"}</div>
                        <div className="mp-noti-time">{fmtRelative(noti?.receivedAt)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </>
        ) : null}

        {activeTab === "events" ? (
          <section className="mp-card mp-section">
            <div className="mp-section-head">
              <h3 className="mp-section-title">신청 행사 목록</h3>
              <span className="mp-count">총 {registrations.length}건</span>
            </div>
            <div className="mp-list">
              {registrations.length === 0 ? (
                <div className="mp-empty">신청 이력이 없습니다.</div>
              ) : (
                registrations.map((item) => renderRegistrationItem(item))
              )}
            </div>
          </section>
        ) : null}

        {activeTab === "history" ? (
          <section className="mp-card mp-section">
            <div className="mp-section-head">
              <h3 className="mp-section-title">참여 완료 이력</h3>
              <span className="mp-count">총 {participationRows.length}건</span>
            </div>
            <div className="mp-list">
              {participationRows.length === 0 ? (
                <div className="mp-empty">QR 스캔 기반 참여 이력이 없습니다.</div>
              ) : (
                participationRows.map((row) => (
                  <div className="mp-item" key={`history-${row.eventId}`}>
                    <div className="mp-item-top">
                      <div className="mp-item-title">{row.eventName}</div>
                      <span className="mp-badge approved">참여 완료</span>
                    </div>
                    <div className="mp-item-meta">
                      <span>{row.location}</span>
                      <span>스캔 {row.totalVisits}회</span>
                      <span>부스 {row.boothCount}개</span>
                      <span>최근 스캔 {fmtDateTime(row.lastVisitedAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        ) : null}

        {activeTab === "notifications" ? (
          <section className="mp-card mp-section">
            <div className="mp-section-head">
              <h3 className="mp-section-title">수신 알림 목록</h3>
              <span className="mp-count">총 {notifications.length}건</span>
            </div>
            <div className="mp-list">
              {notifications.length === 0 ? (
                <div className="mp-empty">수신된 알림이 없습니다.</div>
              ) : (
                notifications.map((noti) => (
                  <div className="mp-item" key={noti?.inboxId || `${noti?.title}-${noti?.receivedAt}`}>
                    <div className="mp-noti-title">{noti?.title || "알림"}</div>
                    <div className="mp-noti-content">{noti?.content || "-"}</div>
                    <div className="mp-noti-time">수신 {fmtDateTime(noti?.receivedAt)}</div>
                  </div>
                ))
              )}
            </div>
          </section>
        ) : null}
      </main>

      {qrModalOpen ? (
        <div className="mp-modal-backdrop" onClick={() => setQrModalOpen(false)}>
          <div className="mp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal-head">
              <h3 className="mp-modal-title">QR 코드</h3>
              <button type="button" className="mp-close" onClick={() => setQrModalOpen(false)}>
                ×
              </button>
            </div>

            <div className="mp-field">
              <label className="mp-label">QR 발급 행사 선택</label>
              <select
                className="mp-select"
                value={qrEventId}
                onChange={(e) => setQrEventId(e.target.value)}
                disabled={qrCandidates.length === 0}
              >
                {qrCandidates.length === 0 ? (
                  <option value="">QR 발급 가능한 신청 행사가 없습니다.</option>
                ) : (
                  qrCandidates.map((item) => {
                    const detail = eventMap[String(item?.eventId)] || {};
                    return (
                      <option key={`qr-${item?.applyId}-${item?.eventId}`} value={String(item?.eventId)}>
                        {detail?.eventName || `행사 #${item?.eventId}`}
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            <div className="mp-modal-actions">
              <button type="button" className="mp-btn ghost" onClick={() => setQrModalOpen(false)}>
                닫기
              </button>
              <button
                type="button"
                className="mp-btn primary"
                onClick={issueQr}
                disabled={!qrEventId || qrLoading}
              >
                {qrLoading ? "조회 중..." : "QR 조회"}
              </button>
            </div>

            {qrError ? <div className="mp-danger">{qrError}</div> : null}

            {qrPayload ? (
              <div className="mp-qr-box">
                {qrPayload?.originalUrl ? (
                  <img
                    className="mp-qr-image"
                    src={qrPayload.originalUrl}
                    alt="내 QR 코드"
                  />
                ) : null}
                <div className="mp-qr-meta">
                  <div>qrId: {qrPayload?.qrId || "-"}</div>
                  <div>eventId: {qrPayload?.eventId || "-"}</div>
                  <div>issuedAt: {fmtDateTime(qrPayload?.issuedAt)}</div>
                  <div>expiredAt: {fmtDateTime(qrPayload?.expiredAt)}</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
