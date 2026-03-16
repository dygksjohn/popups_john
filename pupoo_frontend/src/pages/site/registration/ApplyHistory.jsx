import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, QrCode, ChevronRight, Inbox } from "lucide-react";
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
  APPLIED: { label: "신청 완료", bg: "#f0fdf4", color: "#16a34a" },
  APPROVED: { label: "승인 완료", bg: "#eff6ff", color: "#3b82f6" },
  CANCELLED: { label: "신청 취소", bg: "#fef2f2", color: "#ef4444" },
  REJECTED: { label: "승인 거절", bg: "#f5f5f5", color: "#999" },
};

const FILTERS = [
  { key: "all", label: "전체" },
  { key: "APPROVED", label: "승인" },
  { key: "CANCELLED", label: "취소" },
  { key: "REJECTED", label: "거절" },
];

const styles = `
  .ah-root {
    box-sizing: border-box;
    font-family: inherit;
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

  /* ── 상단 요약 ── */
  .ah-summary {
    display: flex;
    align-items: stretch;
    gap: 0;
    margin: 32px 0;
    border: 1px solid #f0f0f0;
    border-radius: 16px;
    overflow: hidden;
  }
  .ah-summary-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 28px 0;
    gap: 6px;
  }
  .ah-summary-item + .ah-summary-item { border-left: 1px solid #f0f0f0; }
  .ah-summary-val {
    font-size: 26px;
    font-weight: 800;
    color: #111;
    letter-spacing: -0.03em;
  }
  .ah-summary-val.green { color: #16a34a; }
  .ah-summary-val.red { color: #ef4444; }
  .ah-summary-label {
    font-size: 12px;
    font-weight: 500;
    color: #aaa;
  }

  /* ── 필터 탭 ── */
  .ah-filters {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
  }
  .ah-filter {
    padding: 8px 20px;
    border-radius: 999px;
    border: 1px solid #e5e7eb;
    background: #fff;
    font-size: 13px;
    font-weight: 600;
    color: #9ca3af;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
  }
  .ah-filter:hover { border-color: #d1d5db; color: #6b7280; }
  .ah-filter.active { background: #111; color: #fff; border-color: #111; }

  /* ── 섹션 ── */
  .ah-section {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .ah-section-title {
    font-size: 16px;
    font-weight: 800;
    color: #111;
  }
  .ah-section-count {
    font-size: 13px;
    color: #bbb;
  }

  /* ── 테이블 ── */
  .ah-table {
    width: 100%;
    border-collapse: collapse;
  }
  .ah-table thead th {
    padding: 12px 0;
    font-size: 12px;
    font-weight: 600;
    color: #bbb;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
  }
  .ah-table thead th:last-child { text-align: right; }
  .ah-table tbody tr {
    transition: background 0.1s;
  }
  .ah-table tbody tr:hover { background: #fafafa; }
  .ah-table td {
    padding: 18px 0;
    font-size: 14px;
    color: #111;
    border-bottom: 1px solid #f7f7f7;
    vertical-align: middle;
  }
  .ah-table td:last-child { text-align: right; }
  .ah-td-name {
    font-weight: 700;
    color: #111;
  }
  .ah-td-sub {
    font-size: 12px;
    color: #bbb;
    margin-top: 2px;
  }
  .ah-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
  }
  .ah-actions {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .ah-icon-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid #eee;
    background: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #bbb;
    transition: all 0.15s;
  }
  .ah-icon-btn:hover { border-color: #ccc; color: #666; background: #fafafa; }

  /* ── 빈 상태 ── */
  .ah-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 80px 20px;
    gap: 10px;
    color: #d1d5db;
  }
  .ah-empty span {
    font-size: 14px;
    color: #aaa;
  }

  @media (max-width: 768px) {
    .ah-table thead { display: none; }
    .ah-table, .ah-table tbody, .ah-table tr, .ah-table td {
      display: block;
      width: 100%;
    }
    .ah-table tr {
      padding: 16px 0;
      border-bottom: 1px solid #f5f5f5;
    }
    .ah-table td {
      padding: 3px 0;
      border: none;
      text-align: left !important;
    }
    .ah-summary-val { font-size: 20px; }
    .ah-summary-item { padding: 20px 0; }
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
        <div className="ah-summary">
          <div className="ah-summary-item">
            <div className="ah-summary-val">{counts.total}</div>
            <div className="ah-summary-label">전체 신청</div>
          </div>
          <div className="ah-summary-item">
            <div className="ah-summary-val green">{counts.approved}</div>
            <div className="ah-summary-label">승인 / 신청</div>
          </div>
          <div className="ah-summary-item">
            <div className="ah-summary-val red">{counts.cancelled}</div>
            <div className="ah-summary-label">취소 / 거절</div>
          </div>
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

        <div className="ah-section">
          <span className="ah-section-title">신청 내역</span>
          <span className="ah-section-count">{loading ? "" : `${filtered.length}건`}</span>
        </div>

        {loading ? (
          <PageLoading />
        ) : (error || filtered.length === 0) ? (
          <div className="ah-empty">
            <Inbox size={44} strokeWidth={1.2} />
            <span>{error || "신청 내역이 없습니다."}</span>
          </div>
        ) : (
          <table className="ah-table">
            <thead>
              <tr>
                <th>행사명</th>
                <th>일정</th>
                <th>장소</th>
                <th>신청일</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => {
                const meta = STATUS_META[record.status] || { label: record.status, bg: "#f5f5f5", color: "#999" };
                return (
                  <tr key={record.id}>
                    <td><span className="ah-td-name">{record.eventName}</span></td>
                    <td style={{ color: "#888", fontSize: 13 }}>{formatDate(record.startAt)} ~ {formatDate(record.endAt)}</td>
                    <td style={{ color: "#888", fontSize: 13 }}>{record.location}</td>
                    <td style={{ color: "#888", fontSize: 13 }}>{formatDateTime(record.appliedAt)}</td>
                    <td><span className="ah-badge" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span></td>
                    <td>
                      <div className="ah-actions">
                        <button className="ah-icon-btn" type="button" onClick={() => navigate(`/registration/qrcheckin?eventId=${record.eventId}`)} title="QR 체크인">
                          <QrCode size={15} />
                        </button>
                        <button className="ah-icon-btn" type="button" onClick={() => navigate(`/program/all/${record.eventId}`)} title="상세">
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
