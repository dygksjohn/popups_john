import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, QrCode, Inbox, CalendarDays, MapPin, Clock, Search } from "lucide-react";
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
  APPROVED: { label: "승인 완료", bg: "#E6F7F2", color: "#02A17E", border: "#CCF0E4" },
  CANCELLED: { label: "신청 취소", bg: "#fef2f2", color: "#ef4444", border: "#fecaca" },
  REJECTED: { label: "승인 거절", bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" },
};

const FILTERS = [
  { key: "all", label: "전체" },
  { key: "APPROVED", label: "승인" },
  { key: "APPLIED", label: "대기" },
  { key: "CANCELLED", label: "취소" },
  { key: "REJECTED", label: "거절" },
];

const REFUND_PENDING_META = {
  label: "환불 대기",
  bg: "#fff7ed",
  color: "#ca8a04",
  border: "#fed7aa",
};

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
  .ah-summary-dot.dot-blue { background: #02A17E; }
  .ah-summary-dot.dot-amber { background: #ca8a04; }
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
  .ah-toolbar-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ah-search-wrap {
    position: relative;
    width: 260px;
  }
  .ah-search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
  }
  .ah-search-input {
    width: 100%;
    height: 38px;
    border-radius: 12px;
    border: 1.5px solid #e2e8f0;
    padding: 0 12px 0 36px;
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
    background: #fff;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .ah-search-input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
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
    background: linear-gradient(135deg, #02A17E 0%, #3DBFA0 100%);
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
  .ah-qr-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
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
    .ah-toolbar-right { width: 100%; flex-direction: column; align-items: stretch; }
    .ah-search-wrap { width: 100%; }
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
  const [query, setQuery] = useState("");
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
        const [regRes, paymentsRes, refundsRes] = await Promise.all([
          axiosInstance.get("/api/users/me/event-registrations", {
            params: { page: 0, size: 200, sort: "appliedAt,desc" },
          }),
          axiosInstance.get("/api/payments/my", {
            params: { page: 0, size: 200, sort: "requestedAt,desc" },
          }),
          axiosInstance.get("/api/refunds/my", {
            params: { page: 0, size: 200, sort: "requestedAt,desc" },
          }),
        ]);

        const rawItems = regRes?.data?.data?.content ?? [];
        const payments = paymentsRes?.data?.data?.content ?? [];
        const refunds = refundsRes?.data?.data?.content ?? [];
        const refundByPaymentId = new Map(
          refunds
            .filter((r) => r?.paymentId != null)
            .map((r) => [Number(r.paymentId), r]),
        );
        const refundRequestedEventIds = new Set(
          payments
            .filter((p) => {
              const refund = refundByPaymentId.get(Number(p?.paymentId));
              return String(refund?.status || "").toUpperCase() === "REQUESTED";
            })
            .map((p) => Number(p?.eventId))
            .filter(Number.isFinite),
        );
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
            isRefundPending: refundRequestedEventIds.has(Number(item.eventId)),
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
    if (filter === "APPLIED") {
      return records.filter((r) => r.status === "APPLIED" || r.isRefundPending);
    }
    if (filter === "APPROVED") {
      return records.filter((r) => r.status === "APPROVED" && !r.isRefundPending);
    }
    return records.filter((r) => r.status === filter);
  }, [filter, records]);

  const searched = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter((r) => {
      const name = String(r?.eventName || "").toLowerCase();
      const location = String(r?.location || "").toLowerCase();
      return name.includes(q) || location.includes(q);
    });
  }, [filtered, query]);

  const counts = useMemo(() => {
    const total = records.length;
    const approved = records.filter(
      (r) => r.status === "APPROVED" && !r.isRefundPending,
    ).length;
    const pending = records.filter(
      (r) => r.status === "APPLIED" || r.isRefundPending,
    ).length;
    const cancelled = records.filter(
      (r) => r.status === "CANCELLED" || r.status === "REJECTED",
    ).length;
    return { total, approved, pending, cancelled };
  }, [records]);

  return (
    <div className="ah-root">
      <style>{styles}</style>

      <PageHeader
        title="신청 내역 조회"
        icon={<ClipboardList size={40} strokeWidth={1.8} style={{ color: "#2EB893" }} />}
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
              <div className="ah-summary-label">승인</div>
              <div className="ah-summary-val">{counts.approved}</div>
            </div>
          </div>
          <div className="ah-summary-card">
            <div className="ah-summary-dot dot-amber" />
            <div className="ah-summary-text">
              <div className="ah-summary-label">대기</div>
              <div className="ah-summary-val">{counts.pending}</div>
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
            {!loading && <span className="ah-count"><strong>{searched.length}</strong>건</span>}
          </div>
          <div className="ah-toolbar-right">
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
            <div className="ah-search-wrap">
              <Search size={15} className="ah-search-icon" />
              <input
                className="ah-search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="검색"
              />
            </div>
          </div>
        </div>

        {/* 리스트 */}
        {loading ? (
          <PageLoading />
        ) : (error || searched.length === 0) ? (
          <div className="ah-empty">
            <Inbox size={48} strokeWidth={1.2} />
            <span>{error || "신청 내역이 없습니다."}</span>
          </div>
        ) : (
          <div className="ah-list">
            {searched.map((record) => {
              const meta = record.isRefundPending
                ? REFUND_PENDING_META
                : (STATUS_META[record.status] || { label: record.status, bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" });
              return (
                <div
                  key={record.id}
                  className="ah-card"
                  onClick={() => navigate(`/program/current`)}
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
                      disabled={Boolean(record.isRefundPending)}
                      onClick={() => {
                        if (record.isRefundPending) return;
                        navigate(`/registration/qrcheckin?eventId=${record.eventId}`);
                      }}
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
