import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, QrCode, Inbox, CalendarDays, MapPin, Clock } from "lucide-react";
import PageHeader from "../components/PageHeader";
import PageLoading from "../components/PageLoading";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { eventApi } from "../../../app/http/eventApi";
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

const STATUS_META = {
  APPLIED: { label: "신청 완료", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  APPROVED: { label: "승인 완료", bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  CANCELLED: { label: "신청 취소", bg: "#fef2f2", color: "#ef4444", border: "#fecaca" },
  REJECTED: { label: "승인 거절", bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" },
};

const FILTERS = [
  { key: "all", label: "전체" },
  { key: "APPLIED", label: "신청" },
  { key: "APPROVED", label: "승인" },
  { key: "CANCELLED", label: "취소" },
  { key: "REJECTED", label: "거절" },
];

const styles = `
  .ah-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #fff;
    min-height: 100vh;
    color: #111;
  }
  .ah-root *, .ah-root *::before, .ah-root *::after { box-sizing: border-box; font-family: inherit; }
  .ah-wrap {
    width: min(1400px, calc(100% - 48px));
    margin: 0 auto;
    padding: 0 0 80px;
  }

  /* ── 상단 요약 (카카오 st) ── */
  .ah-summary {
    display: flex;
    gap: 0;
    margin: 32px 0;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    overflow: hidden;
  }
  .ah-summary-card {
    flex: 1;
    padding: 24px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    border-right: 1px solid #e5e7eb;
  }
  .ah-summary-card:last-child { border-right: none; }
  .ah-summary-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    background: #d1d5db;
  }
  .ah-summary-dot.dot-blue { background: #2563eb; }
  .ah-summary-dot.dot-red { background: #ef4444; }
  .ah-summary-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .ah-summary-label {
    font-size: 13px;
    font-weight: 500;
    color: #888;
  }
  .ah-summary-val {
    font-size: 24px;
    font-weight: 800;
    color: #222;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  /* ── 필터 + 건수 (한 줄) ── */
  .ah-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    gap: 12px;
  }
  .ah-toolbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .ah-toolbar-title {
    font-size: 18px;
    font-weight: 800;
    color: #111;
  }
  .ah-count {
    font-size: 14px;
    color: #9ca3af;
    font-weight: 600;
    white-space: nowrap;
  }
  .ah-count strong {
    color: #111;
    font-weight: 800;
  }
  .ah-filters {
    display: inline-flex;
    background: #f3f4f6;
    border-radius: 999px;
    padding: 4px;
    gap: 4px;
  }
  .ah-filter {
    border: 1px solid transparent;
    background: transparent;
    color: #9ca3af;
    padding: 8px 20px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s ease;
  }
  .ah-filter:hover { color: #374151; }
  .ah-filter.active {
    background: #1f2937;
    border-color: transparent;
    color: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  }

  /* ── 카드 리스트 ── */
  .ah-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .ah-card {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 28px 32px;
    border: 1px solid #f0f0f0;
    border-radius: 16px;
    background: #fff;
    transition: all 0.15s;
    cursor: pointer;
  }
  .ah-card:hover {
    background: #f9fafb;
  }
  .ah-card-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 80px;
    flex-shrink: 0;
    gap: 4px;
  }
  .ah-status-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  .ah-status-label {
    font-size: 14px;
    font-weight: 700;
  }
  .ah-card-body {
    flex: 1;
    min-width: 0;
  }
  .ah-card-title {
    font-size: 19px;
    font-weight: 800;
    color: #111;
    margin-bottom: 12px;
    line-height: 1.3;
  }
  .ah-card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }
  .ah-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
    color: #6b7280;
    font-weight: 500;
  }
  .ah-meta-item svg {
    color: #9ca3af;
    flex-shrink: 0;
  }
  .ah-card-actions {
    display: flex;
    flex-shrink: 0;
  }
  .ah-qr-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 14px 28px;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, #3b6df5 0%, #6c63ff 100%);
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s;
    white-space: nowrap;
    box-shadow: 0 4px 14px rgba(59, 109, 245, 0.25);
  }
  .ah-qr-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(59, 109, 245, 0.35);
  }
  .ah-qr-btn:active {
    transform: translateY(0);
  }
  .ah-qr-btn svg {
    flex-shrink: 0;
  }

  /* ── 빈 상태 ── */
  .ah-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 80px 20px;
    gap: 12px;
    color: #d1d5db;
  }
  .ah-empty span {
    font-size: 15px;
    color: #9ca3af;
    font-weight: 500;
  }

  @media (max-width: 768px) {
    .ah-summary { flex-direction: column; }
    .ah-summary-card { border-right: none; border-bottom: 1px solid #e5e7eb; }
    .ah-summary-card:last-child { border-bottom: none; }
    .ah-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 14px;
    }
    .ah-card-status {
      flex-direction: row;
      width: auto;
      gap: 8px;
    }
    .ah-card-actions {
      width: 100%;
    }
    .ah-qr-btn { width: 100%; justify-content: center; }
    .ah-toolbar { flex-direction: column; align-items: flex-start; gap: 10px; }
    .ah-filter { padding: 7px 14px; font-size: 12px; }
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

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export default function ApplyHistory() {
  const navigate = useNavigate();
  const currentPath = "/registration/applyhistory";
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchHistory = async () => {
      if (!tokenStore.getAccess()) {
        setRecords([]);
        setLoading(false);
        setError("로그인이 필요합니다.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const res = await axiosInstance.get("/api/users/me/event-registrations", {
          params: { page: 0, size: 200, sort: "appliedAt,desc" },
        });

        const rawItems = res?.data?.data?.content ?? [];
        const eventIds = [...new Set(rawItems.map((item) => item.eventId).filter(Boolean))];

        const eventResults = await Promise.all(
          eventIds.map(async (eventId) => {
            try {
              const detail = await eventApi.getEventDetail(eventId);
              return [eventId, detail?.data?.data ?? null];
            } catch {
              return [eventId, null];
            }
          }),
        );

        const eventMap = new Map(eventResults);

        const mapped = rawItems.map((item) => {
          const detail = eventMap.get(item.eventId) || {};
          return {
            id: item.applyId,
            eventId: item.eventId,
            eventName: detail.eventName || `행사 #${item.eventId}`,
            status: item.status,
            appliedAt: item.appliedAt,
            startAt: detail.startAt,
            endAt: detail.endAt,
            location: detail.location || "장소 미정",
          };
        });

        if (!mounted) return;
        setRecords(mapped);
      } catch (e) {
        if (!mounted) return;
        setError(
          e?.response?.data?.error?.message ||
          e?.response?.data?.message ||
          "신청 내역을 불러오지 못했습니다."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchHistory();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return records;
    return records.filter((r) => r.status === filter);
  }, [filter, records]);

  const counts = useMemo(() => {
    const c = (s) => records.filter((r) => r.status === s).length;
    return { total: records.length, approved: c("APPLIED") + c("APPROVED"), cancelled: c("CANCELLED") + c("REJECTED") };
  }, [records]);

  return (
    <div className="ah-root">
      <style>{styles}</style>

      <PageHeader
        title="신청 내역 조회"
        icon={<ClipboardList size={40} strokeWidth={1.8} style={{ color: "#4F6AFF" }} />}
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
      />

      <div className="ah-wrap">
        {/* 요약 */}
        <div className="ah-summary">
          <div className="ah-summary-card">
            <div className="ah-summary-dot" />
            <div className="ah-summary-text">
              <div className="ah-summary-label">전체 신청</div>
              <div className="ah-summary-val">{counts.total}</div>
            </div>
          </div>
          <div className="ah-summary-card">
            <div className="ah-summary-dot dot-blue" />
            <div className="ah-summary-text">
              <div className="ah-summary-label">승인 / 신청</div>
              <div className="ah-summary-val">{counts.approved}</div>
            </div>
          </div>
          <div className="ah-summary-card">
            <div className="ah-summary-dot dot-red" />
            <div className="ah-summary-text">
              <div className="ah-summary-label">취소 / 거절</div>
              <div className="ah-summary-val">{counts.cancelled}</div>
            </div>
          </div>
        </div>

        {/* 필터 + 건수 */}
        <div className="ah-toolbar">
          <div className="ah-toolbar-left">
            <span className="ah-toolbar-title">신청 내역</span>
            {!loading && <span className="ah-count"><strong>{filtered.length}</strong>건</span>}
          </div>
          <div className="ah-filters">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`ah-filter${filter === f.key ? " active" : ""}`}
                onClick={() => setFilter(f.key)}
                type="button"
              >{f.label}</button>
            ))}
          </div>
        </div>

        {/* 리스트 */}
        {loading ? (
          <PageLoading />
        ) : (error || filtered.length === 0) ? (
          <div className="ah-empty">
            <Inbox size={48} strokeWidth={1.2} />
            <span>{error || "신청 내역이 없습니다."}</span>
          </div>
        ) : (
          <div className="ah-list">
            {filtered.map((record) => {
              const meta = STATUS_META[record.status] || { label: record.status, bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" };
              return (
                <div
                  key={record.id}
                  className="ah-card"
                  onClick={() => navigate(`/program/all/${record.eventId}`)}
                >
                  {/* 상태 */}
                  <div className="ah-card-status">
                    <div className="ah-status-dot" style={{ background: meta.color }} />
                    <span className="ah-status-label" style={{ color: meta.color }}>{meta.label}</span>
                  </div>

                  {/* 본문 */}
                  <div className="ah-card-body">
                    <div className="ah-card-title">{record.eventName}</div>
                    <div className="ah-card-meta">
                      <span className="ah-meta-item">
                        <CalendarDays size={14} />
                        {formatDate(record.startAt)} ~ {formatDate(record.endAt)}
                      </span>
                      <span className="ah-meta-item">
                        <MapPin size={14} />
                        {record.location}
                      </span>
                      <span className="ah-meta-item">
                        <Clock size={14} />
                        신청 {formatDateTime(record.appliedAt)}
                      </span>
                    </div>
                  </div>

                  {/* 액션 */}
                  <div className="ah-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="ah-qr-btn"
                      type="button"
                      onClick={() => navigate(`/registration/qrcheckin?eventId=${record.eventId}`)}
                    >
                      <QrCode size={18} /> QR 체크인
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
