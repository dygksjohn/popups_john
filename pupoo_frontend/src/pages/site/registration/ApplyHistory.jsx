import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileText,
  MapPin,
  XCircle,
  Clock3,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
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
  APPLIED: {
    label: "신청 완료",
    bg: "#DCFCE7",
    color: "#15803D",
    dot: "#16A34A",
  },
  APPROVED: {
    label: "승인 완료",
    bg: "#DBEAFE",
    color: "#1D4ED8",
    dot: "#2563EB",
  },
  CANCELLED: {
    label: "신청 취소",
    bg: "#FEE2E2",
    color: "#DC2626",
    dot: "#EF4444",
  },
  REJECTED: {
    label: "승인 거절",
    bg: "#F3F4F6",
    color: "#6B7280",
    dot: "#9CA3AF",
  },
};

const FILTERS = [
  { key: "all", label: "전체" },
  { key: "APPROVED", label: "승인 완료" },
  { key: "CANCELLED", label: "신청 취소" },
  { key: "REJECTED", label: "승인 거절" },
];

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .hist-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #F5F6FA;
    min-height: 100vh;
  }
  .hist-root *, .hist-root *::before, .hist-root *::after { box-sizing: border-box; font-family: inherit; }
  .hist-container { max-width: 860px; margin: 0 auto; padding: 28px 20px 80px; }

  .hist-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 24px; }
  .hist-stat {
    background: #fff; border: 1px solid #EBEBEB; border-radius: 16px;
    padding: 18px 16px; display: flex; flex-direction: column; gap: 4px;
  }
  .hist-stat-icon-wrap {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; margin-bottom: 6px;
  }
  .hist-stat-icon-wrap.blue  { background: #EEF2FF; color: #1B50D9; }
  .hist-stat-icon-wrap.green { background: #DCFCE7; color: #15803D; }
  .hist-stat-icon-wrap.amber { background: #FEF3C7; color: #B45309; }
  .hist-stat-icon-wrap.red   { background: #FEE2E2; color: #DC2626; }
  .hist-stat-value { font-size: 24px; font-weight: 800; color: #111827; letter-spacing: -1px; line-height: 1; }
  .hist-stat-label { font-size: 12px; color: #9CA3AF; font-weight: 500; margin-top: 2px; }

  .hist-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .hist-title { font-size: 17px; font-weight: 800; color: #111827; letter-spacing: -0.3px; }
  .hist-sub { font-size: 13px; color: #9CA3AF; margin-top: 3px; }

  .hist-filter-bar { display: flex; gap: 7px; margin-bottom: 16px; flex-wrap: wrap; }
  .hist-filter-btn {
    padding: 7px 16px; border-radius: 100px; font-size: 13px; font-weight: 600;
    cursor: pointer; border: 1.5px solid #EBEBEB; background: #fff; color: #6B7280;
    transition: all 0.15s;
  }
  .hist-filter-btn:hover { border-color: #C7D2FA; color: #1B50D9; }
  .hist-filter-btn.active { background: #EEF2FF; border-color: #1B50D9; color: #1B50D9; }

  .hist-list { display: flex; flex-direction: column; gap: 10px; }

  .hist-card {
    background: #fff; border: 1px solid #EBEBEB; border-radius: 16px;
    overflow: hidden; transition: box-shadow 0.2s;
  }
  .hist-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); }

  .hist-card-top {
    padding: 18px 20px 14px;
    display: flex; gap: 12px; align-items: flex-start;
  }
  .hist-dot { width: 9px; height: 9px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
  .hist-card-main { flex: 1; min-width: 0; }
  .hist-event-name { font-size: 15px; font-weight: 700; color: #111827; line-height: 1.4; }
  .hist-status-badge {
    padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700;
    flex-shrink: 0; letter-spacing: 0.02em;
  }

  .hist-card-meta {
    display: flex; flex-wrap: wrap; gap: 16px;
    padding: 13px 20px; background: #FAFAFA; border-top: 1px solid #F3F4F6;
    font-size: 13px; color: #6B7280;
  }
  .hist-meta-item { display: flex; align-items: center; gap: 5px; }

  .hist-btn {
    padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: 10px;
    cursor: pointer; transition: all 0.15s;
    display: flex; align-items: center; gap: 6px;
  }
  .hist-btn-outline { border: 1.5px solid #EBEBEB; background: #fff; color: #374151; }
  .hist-btn-outline:hover { border-color: #9CA3AF; }
  .hist-btn-primary { border: none; background: #1B50D9; color: #fff; }
  .hist-btn-primary:hover { background: #1640B8; }
  .hist-top-actions { margin-left: auto; display: flex; gap: 8px; align-self: center; }
  .hist-top-action { white-space: nowrap; }

  .hist-empty { text-align: center; padding: 60px 24px; background: #fff; border: 1px solid #EBEBEB; border-radius: 16px; }
  .hist-empty-icon { display: flex; justify-content: center; margin-bottom: 16px; color: #E5E7EB; }
  .hist-empty-title { font-size: 16px; font-weight: 700; color: #374151; margin-bottom: 6px; }
  .hist-empty-desc { font-size: 14px; color: #9CA3AF; }

  @media (max-width: 640px) {
    .hist-stats { grid-template-columns: repeat(2, 1fr); }
    .hist-container { padding: 20px 16px 64px; }
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

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

function formatDateRange(startAt, endAt) {
  if (!startAt && !endAt) return "일정 정보 없음";
  const start = formatDate(startAt);
  const end = formatDate(endAt);
  return `${start} ~ ${end}`;
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
          params: {
            page: 0,
            size: 200,
            sort: "appliedAt,desc",
          },
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
            location: detail.location || "장소 정보 없음",
          };
        });

        if (!mounted) return;
        setRecords(mapped);
      } catch (e) {
        if (!mounted) return;
        const message =
          e?.response?.data?.error?.message ||
          e?.response?.data?.message ||
          "신청 내역을 불러오지 못했습니다.";
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchHistory();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return records;
    return records.filter((record) => record.status === filter);
  }, [filter, records]);

  const stats = useMemo(() => {
    const count = (status) => records.filter((r) => r.status === status).length;
    return [
      {
        icon: <ClipboardList size={18} />,
        label: "전체 신청",
        value: `${records.length}`,
        cls: "blue",
      },
      {
        icon: <CheckCircle2 size={18} />,
        label: "신청/승인",
        value: `${count("APPLIED") + count("APPROVED")}`,
        cls: "green",
      },
      {
        icon: <Clock3 size={18} />,
        label: "승인 대기",
        value: `${count("APPLIED")}`,
        cls: "amber",
      },
      {
        icon: <XCircle size={18} />,
        label: "취소/거절",
        value: `${count("CANCELLED") + count("REJECTED")}`,
        cls: "red",
      },
    ];
  }, [records]);

  return (
    <div className="hist-root">
      <style>{styles}</style>

      <PageHeader
        title="신청 내역 조회"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
      />

      <main className="hist-container">
        <div className="hist-stats">
          {stats.map((s) => (
            <div key={s.label} className="hist-stat">
              <div className={`hist-stat-icon-wrap ${s.cls}`}>{s.icon}</div>
              <div className="hist-stat-value">{s.value}</div>
              <div className="hist-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="hist-toolbar">
          <div>
            <div className="hist-title">신청 내역</div>
            <div className="hist-sub">
              {loading ? "불러오는 중..." : `총 ${filtered.length}건`}
            </div>
          </div>
        </div>

        <div className="hist-filter-bar">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`hist-filter-btn${filter === f.key ? " active" : ""}`}
              onClick={() => setFilter(f.key)}
              type="button"
            >
              {f.label}
            </button>
          ))}
        </div>

        {error ? <div style={{ marginBottom: 12, color: "#b91c1c" }}>{error}</div> : null}

        <div className="hist-list">
          {!loading && filtered.length === 0 ? (
            <div className="hist-empty">
              <div className="hist-empty-icon">
                <FileText size={48} />
              </div>
              <div className="hist-empty-title">신청 내역이 없습니다</div>
              <div className="hist-empty-desc">선택한 조건에 해당하는 신청 기록이 없습니다.</div>
            </div>
          ) : (
            filtered.map((record) => {
              const statusMeta = STATUS_META[record.status] || {
                label: record.status,
                bg: "#F3F4F6",
                color: "#6B7280",
                dot: "#9CA3AF",
              };

              return (
                <div key={record.id} className="hist-card">
                  <div className="hist-card-top">
                    <div className="hist-dot" style={{ background: statusMeta.dot }} />
                    <div className="hist-card-main">
                      <div className="hist-event-name">{record.eventName}</div>
                      <span
                        className="hist-status-badge"
                        style={{
                          background: statusMeta.bg,
                          color: statusMeta.color,
                          marginTop: 6,
                          display: "inline-flex",
                        }}
                      >
                        {statusMeta.label}
                      </span>
                    </div>
                    <div className="hist-top-actions">
                      <button
                        type="button"
                        className="hist-btn hist-btn-primary hist-top-action"
                        onClick={() =>
                          navigate(`/registration/qrcheckin?eventId=${record.eventId}`)
                        }
                      >
                        QR 발급/조회
                      </button>
                      <button
                        type="button"
                        className="hist-btn hist-btn-outline hist-top-action"
                        onClick={() => navigate(`/program/all/${record.eventId}`)}
                      >
                        상세보기
                      </button>
                    </div>
                  </div>

                  <div className="hist-card-meta">
                    <span className="hist-meta-item">
                      <Calendar size={13} /> {formatDateRange(record.startAt, record.endAt)}
                    </span>
                    <span className="hist-meta-item">
                      <FileText size={13} /> 신청일 {formatDateTime(record.appliedAt)}
                    </span>
                    <span className="hist-meta-item">
                      <MapPin size={13} /> {record.location}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
