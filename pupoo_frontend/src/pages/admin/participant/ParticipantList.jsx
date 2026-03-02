/**
 * ParticipantList — 참가자(회원) 목록 관리 (DB 연동)
 *
 * ★ 핵심 구조:
 *   참가자 = 회원가입한 유저가 행사에 신청한 사람
 *   users 테이블 ←→ event_apply 테이블 ←→ social_account 테이블
 *
 * ★ 연동 포인트 (회원가입 팀원 코드와 자동 연결):
 *   1. 유저가 홈에서 회원가입 → users 테이블에 INSERT (팀원 담당)
 *   2. 카카오 가입이면 social_account에도 INSERT (팀원 담당)
 *   3. 유저가 행사 신청 → event_apply에 INSERT
 *   4. 이 페이지는 event_apply + users + social_account를 조인해서 보여줌
 *   → 팀원이 회원가입 완성하면 여기서 자동으로 보임!
 *
 * VIEW 1: 행사 선택 카드
 * VIEW 2: 선택된 행사의 참가자(회원) 테이블
 *
 * API:
 *   GET    /api/admin/dashboard/events                          — 행사 목록
 *   GET    /api/admin/dashboard/events/{eventId}/registrations  — 참가자 목록
 *   PATCH  /api/admin/dashboard/registrations/{applyId}/status  — 상태 변경
 *   DELETE /api/admin/dashboard/registrations/{applyId}         — 삭제
 *   POST   /api/admin/dashboard/registrations/bulk-delete       — 일괄 삭제
 */
import { useState, useEffect } from "react";
import {
  X,
  Trash2,
  Search,
  Check,
  ChevronLeft,
  AlertTriangle,
  Users,
  Clock,
  UserCheck,
  CalendarDays,
  MapPin,
  ArrowRight,
  Clipboard,
  Mail,
  Phone,
  Shield,
} from "lucide-react";
import ds, { statusMap } from "../shared/designTokens";
import { Pill } from "../shared/Components";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { getToken } from "../../../api/noticeApi";

/* ── 스타일 ── */
const styles = `
@keyframes toastIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes rowFadeOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-30px)}}
@keyframes spin{to{transform:rotate(360deg)}}
.row-removing{animation:rowFadeOut .3s ease forwards}
`;

/* ── 공통 UI ── */
function Checkbox({ checked, onChange, size = 18 }) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onChange?.();
      }}
      style={{
        width: size,
        height: size,
        borderRadius: 5,
        border: checked ? "none" : "1.8px solid #CBD5E1",
        background: checked ? ds.brand : "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all .15s ease",
        flexShrink: 0,
      }}
    >
      {checked && <Check size={size - 6} color="#fff" strokeWidth={3} />}
    </div>
  );
}

function Toast({ msg, type = "success", onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  const bg = type === "success" ? "#10B981" : "#EF4444";
  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 9999,
        background: bg,
        color: "#fff",
        padding: "12px 22px",
        borderRadius: 10,
        fontSize: 13.5,
        fontWeight: 600,
        fontFamily: ds.ff,
        boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
        animation: "toastIn .25s ease",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {type === "success" ? "✓" : "✕"} {msg}
    </div>
  );
}

function Overlay({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 5000,
        background: "rgba(0,0,0,0.32)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn .15s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          width: 520,
          maxHeight: "85vh",
          overflow: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
          animation: "slideUp .2s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ConfirmModal({ title, msg, onConfirm, onCancel }) {
  return (
    <Overlay onClose={onCancel}>
      <div style={{ padding: "28px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "#FEF2F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertTriangle size={18} color="#EF4444" />
          </div>
          <h3
            style={{ fontSize: 16, fontWeight: 800, color: ds.ink, margin: 0 }}
          >
            {title}
          </h3>
        </div>
        <p
          style={{
            fontSize: 13.5,
            color: "#64748B",
            lineHeight: 1.6,
            whiteSpace: "pre-line",
            margin: "0 0 24px",
          }}
        >
          {msg}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: "1px solid #E2E8F0",
              background: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: ds.ff,
              color: "#64748B",
            }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: "none",
              background: "#EF4444",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: ds.ff,
            }}
          >
            삭제
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "14px 16px",
        border: "1px solid #F1F5F9",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: `${color}10`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={color} strokeWidth={2.2} />
      </div>
      <div>
        <div
          style={{
            fontSize: 10.5,
            color: "#94A3B8",
            fontWeight: 600,
            marginBottom: 1,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: ds.ink,
            letterSpacing: -0.5,
          }}
        >
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 1 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 상태 매핑 ── */
const REG_STATUS = {
  APPLIED: { l: "대기", c: "#D97706", bg: "#FFFBEB" },
  APPROVED: { l: "승인", c: "#059669", bg: "#ECFDF5" },
  CANCELLED: { l: "취소", c: "#EF4444", bg: "#FEF2F2" },
  REJECTED: { l: "거절", c: "#94A3B8", bg: "#F1F5F9" },
};

/* ── 가입 유형 매핑 ── */
const SIGNUP_TYPE = {
  NORMAL: { l: "일반", c: "#64748B", bg: "#F1F5F9" },
  KAKAO: { l: "카카오", c: "#3C1E1E", bg: "#FEE500" },
  NAVER: { l: "네이버", c: "#fff", bg: "#03C75A" },
  APPLE: { l: "애플", c: "#fff", bg: "#000000" },
};

/* ── 유틸 ── */
const authHeaders = () => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};
const calcStatus = (s, e) => {
  if (!s && !e) return "pending";
  const now = new Date();
  const st = s ? new Date(s.includes("T") ? s : s + "T00:00:00+09:00") : null;
  const en = e ? new Date(e.includes("T") ? e : e + "T23:59:59+09:00") : null;
  if (en && now > en) return "ended";
  if (st && now < st) return "pending";
  return "active";
};
const fmtDate = (dt) => {
  if (!dt) return "—";
  const d = new Date(dt);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const fmtDateShort = (dt) => {
  if (!dt) return "—";
  const d = new Date(dt);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};

/* ═══════════════════════════════════════════
   상세 모달
   ═══════════════════════════════════════════ */
function DetailModal({ item, onClose, onStatusChange, onDelete }) {
  const st = REG_STATUS[item.status] || REG_STATUS.APPLIED;
  const sg = SIGNUP_TYPE[item.signupType] || SIGNUP_TYPE.NORMAL;

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: "28px" }}>
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3
            style={{ fontSize: 16, fontWeight: 800, color: ds.ink, margin: 0 }}
          >
            참가자 상세
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: "none",
              background: "#F1F5F9",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} color="#94A3B8" />
          </button>
        </div>

        {/* 프로필 */}
        <div
          style={{
            background: "#F8FAFC",
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: `${ds.brand}10`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 800,
                color: ds.brand,
                flexShrink: 0,
              }}
            >
              {(item.nickname || "?")[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: ds.ink }}>
                {item.nickname}
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                #{item.applyId} · User #{item.userId}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Pill color={st.c} bg={st.bg}>
                {st.l}
              </Pill>
              <Pill color={sg.c} bg={sg.bg}>
                {sg.l}
              </Pill>
            </div>
          </div>

          {/* 상세 정보 */}
          {[
            { icon: Mail, l: "이메일", v: item.email || "—" },
            { icon: Phone, l: "연락처", v: item.phone || "—" },
            {
              icon: CalendarDays,
              l: "회원가입일",
              v: fmtDateShort(item.userCreatedAt),
            },
            {
              icon: CalendarDays,
              l: "행사 신청일",
              v: fmtDate(item.appliedAt),
            },
            { icon: Shield, l: "계정 상태", v: item.userStatus || "—" },
          ].map((r) => (
            <div
              key={r.l}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 0",
                borderBottom: "1px solid #E2E8F0",
              }}
            >
              <r.icon size={13} color="#94A3B8" style={{ flexShrink: 0 }} />
              <span
                style={{
                  fontSize: 13,
                  color: "#64748B",
                  fontWeight: 500,
                  width: 80,
                  flexShrink: 0,
                }}
              >
                {r.l}
              </span>
              <span style={{ fontSize: 13, color: ds.ink, fontWeight: 600 }}>
                {r.v}
              </span>
            </div>
          ))}
        </div>

        {/* 상태 변경 버튼 */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#64748B",
              marginBottom: 8,
            }}
          >
            신청 상태 변경
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {item.status !== "APPROVED" && (
              <button
                onClick={() => {
                  onStatusChange(item.applyId, "APPROVED");
                  onClose();
                }}
                style={{
                  padding: "7px 14px",
                  borderRadius: 7,
                  border: "1px solid #D1FAE5",
                  background: "#ECFDF5",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#059669",
                  cursor: "pointer",
                  fontFamily: ds.ff,
                }}
              >
                승인
              </button>
            )}
            {item.status === "APPLIED" && (
              <button
                onClick={() => {
                  onStatusChange(item.applyId, "REJECTED");
                  onClose();
                }}
                style={{
                  padding: "7px 14px",
                  borderRadius: 7,
                  border: "1px solid #E2E8F0",
                  background: "#F8FAFC",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#64748B",
                  cursor: "pointer",
                  fontFamily: ds.ff,
                }}
              >
                거절
              </button>
            )}
            {(item.status === "APPLIED" || item.status === "APPROVED") && (
              <button
                onClick={() => {
                  onStatusChange(item.applyId, "CANCELLED");
                  onClose();
                }}
                style={{
                  padding: "7px 14px",
                  borderRadius: 7,
                  border: "1px solid #FECACA",
                  background: "#FEF2F2",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#DC2626",
                  cursor: "pointer",
                  fontFamily: ds.ff,
                }}
              >
                취소
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={() => {
              onClose();
              onDelete(item);
            }}
            style={{
              padding: "9px 16px",
              borderRadius: 8,
              border: "1px solid #FECACA",
              background: "#FEF2F2",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: ds.ff,
              color: "#DC2626",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Trash2 size={13} /> 삭제
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/* ═══════════════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════════════ */
export default function ParticipantList({ subTab = "list" }) {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState(new Set());
  const [removing, setRemoving] = useState(null);
  const showToast = (msg, type = "success") => setToast({ msg, type });

  /* ── 행사 목록 로드 ── */
  const loadEvents = async () => {
    try {
      const res = await axiosInstance.get("/api/admin/dashboard/events", {
        headers: authHeaders(),
      });
      const list = res.data?.data || res.data || [];
      setEvents(
        list.map((e) => ({
          ...e,
          status: calcStatus(
            e.startAt || e.date?.split("~")[0]?.trim(),
            e.endAt || e.date?.split("~")[1]?.trim(),
          ),
        })),
      );
    } catch (err) {
      console.error("행사 로드 실패:", err);
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  /* ── 참가자 목록 로드 ── */
  const loadParticipants = async (eventId) => {
    setLoadingParticipants(true);
    try {
      const res = await axiosInstance.get(
        `/api/admin/dashboard/events/${eventId}/registrations`,
        { headers: authHeaders() },
      );
      const list = res.data?.data || res.data || [];
      setParticipants(list);
    } catch (err) {
      console.error("참가자 로드 실패:", err);
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const selectEvent = (ev) => {
    setSelectedEvent(ev);
    setSelected(new Set());
    setSearch("");
    setStatusFilter("ALL");
    const eid = ev.eventId || ev.id?.replace("EV-", "");
    loadParticipants(eid);
  };

  const goBack = () => {
    setSelectedEvent(null);
    setParticipants([]);
    setSelected(new Set());
    setSearch("");
    setStatusFilter("ALL");
  };

  /* ── 상태 변경 ── */
  const handleStatusChange = async (applyId, newStatus) => {
    try {
      await axiosInstance.patch(
        `/api/admin/dashboard/registrations/${applyId}/status?status=${newStatus}`,
        {},
        { headers: authHeaders() },
      );
      const eid = selectedEvent.eventId || selectedEvent.id?.replace("EV-", "");
      await loadParticipants(eid);
      showToast("상태가 변경되었습니다.");
    } catch (err) {
      showToast("상태 변경에 실패했습니다.", "error");
    }
  };

  /* ── 삭제 ── */
  const handleDelete = async () => {
    const item = modal.item;
    setModal(null);
    setRemoving(item.applyId);
    try {
      await axiosInstance.delete(
        `/api/admin/dashboard/registrations/${item.applyId}`,
        { headers: authHeaders() },
      );
      const eid = selectedEvent.eventId || selectedEvent.id?.replace("EV-", "");
      setTimeout(async () => {
        await loadParticipants(eid);
        setRemoving(null);
        showToast("참가자가 삭제되었습니다.");
      }, 300);
    } catch (err) {
      setRemoving(null);
      showToast("삭제에 실패했습니다.", "error");
    }
  };

  /* ── 일괄 삭제 ── */
  const handleBulkDelete = async () => {
    const ids = [...selected];
    setModal(null);
    try {
      await axiosInstance.post(
        "/api/admin/dashboard/registrations/bulk-delete",
        { applyIds: ids },
        { headers: authHeaders() },
      );
      const eid = selectedEvent.eventId || selectedEvent.id?.replace("EV-", "");
      await loadParticipants(eid);
      setSelected(new Set());
      showToast(`${ids.length}건 삭제되었습니다.`);
    } catch (err) {
      showToast("일괄 삭제 실패", "error");
    }
  };

  /* ── 필터 ── */
  const filtered = participants.filter((p) => {
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (p.nickname || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q) ||
        (p.phone || "").includes(q) ||
        String(p.applyId).includes(q)
      );
    }
    return true;
  });

  const total = participants.length;
  const approved = participants.filter((p) => p.status === "APPROVED").length;
  const applied = participants.filter((p) => p.status === "APPLIED").length;

  const isAllSelected =
    filtered.length > 0 && filtered.every((r) => selected.has(r.applyId));
  const hasSelected = selected.size > 0;
  const toggleAll = () => {
    if (isAllSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.applyId)));
  };
  const toggleOne = (id) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  /* ═══════════════════════════════════════════
     렌더링
     ═══════════════════════════════════════════ */
  return (
    <div>
      <style>{styles}</style>

      {/* ═══════ VIEW 1: 행사 선택 ═══════ */}
      {!selectedEvent && (
        <>
          <div style={{ marginBottom: 20 }}>
            <h3
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: ds.ink,
                margin: "0 0 6px",
              }}
            >
              참가자 관리
            </h3>
            <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>
              참가자를 관리할 행사를 선택하세요
            </p>
          </div>

          {loadingEvents ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "80px 0",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: `3px solid ${ds.brand}20`,
                  borderTopColor: ds.brand,
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              <div
                style={{
                  fontSize: 13,
                  color: "#94A3B8",
                  fontWeight: 600,
                  marginTop: 14,
                }}
              >
                행사 목록 로딩 중...
              </div>
            </div>
          ) : events.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "80px 0",
              }}
            >
              <CalendarDays size={42} color="#CBD5E1" strokeWidth={1.5} />
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#94A3B8",
                  marginTop: 14,
                }}
              >
                등록된 행사가 없습니다
              </div>
              <div style={{ fontSize: 13, color: "#CBD5E1", marginTop: 4 }}>
                먼저 행사 관리에서 행사를 등록해주세요
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 14,
              }}
            >
              {events.map((ev) => {
                const st = statusMap[ev.status] || statusMap.pending;
                return (
                  <div
                    key={ev.eventId || ev.id}
                    onClick={() => selectEvent(ev)}
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      border: "1px solid #F1F5F9",
                      padding: "20px",
                      cursor: "pointer",
                      transition: "all .2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = ds.brand;
                      e.currentTarget.style.boxShadow = `0 4px 20px ${ds.brand}12`;
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#F1F5F9";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 12,
                      }}
                    >
                      <Pill color={st.c} bg={st.bg}>
                        {st.l}
                      </Pill>
                      <ArrowRight size={16} color="#CBD5E1" />
                    </div>
                    <h4
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: ds.ink,
                        margin: "0 0 8px",
                        lineHeight: 1.3,
                      }}
                    >
                      {ev.name || ev.eventName}
                    </h4>
                    {ev.date && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          color: "#94A3B8",
                          marginBottom: 4,
                        }}
                      >
                        <CalendarDays size={12} /> {ev.date}
                      </div>
                    )}
                    {ev.location && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          color: "#94A3B8",
                        }}
                      >
                        <MapPin size={12} /> {ev.location}
                      </div>
                    )}
                    <div
                      style={{
                        marginTop: 14,
                        paddingTop: 12,
                        borderTop: "1px solid #F1F5F9",
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#fff",
                          background: ds.brand,
                          padding: "6px 16px",
                          borderRadius: 8,
                        }}
                      >
                        <Users size={13} /> 참가자 관리하기
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══════ VIEW 2: 참가자 테이블 ═══════ */}
      {selectedEvent && (
        <>
          {/* 헤더 */}
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={goBack}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #E2E8F0",
                background: "#fff",
                fontSize: 12.5,
                fontWeight: 600,
                color: "#64748B",
                cursor: "pointer",
                fontFamily: ds.ff,
                marginBottom: 12,
                transition: "all .15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = ds.brand;
                e.currentTarget.style.color = ds.brand;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E2E8F0";
                e.currentTarget.style.color = "#64748B";
              }}
            >
              <ChevronLeft size={14} /> 행사 목록으로
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: ds.ink,
                  margin: 0,
                }}
              >
                {selectedEvent.name || selectedEvent.eventName}
              </h3>
              <Pill
                color={(statusMap[selectedEvent.status] || statusMap.pending).c}
                bg={(statusMap[selectedEvent.status] || statusMap.pending).bg}
              >
                {(statusMap[selectedEvent.status] || statusMap.pending).l}
              </Pill>
            </div>
            {selectedEvent.date && (
              <p
                style={{
                  fontSize: 12.5,
                  color: "#94A3B8",
                  margin: "4px 0 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <CalendarDays size={12} /> {selectedEvent.date}
                {selectedEvent.location && (
                  <>
                    <span style={{ margin: "0 6px" }}>·</span>
                    <MapPin size={12} /> {selectedEvent.location}
                  </>
                )}
              </p>
            )}
          </div>

          {/* 통계 카드 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <StatCard
              icon={Users}
              label="전체 참가자"
              value={total}
              color={ds.brand}
            />
            <StatCard
              icon={UserCheck}
              label="승인 완료"
              value={approved}
              color="#10B981"
            />
            <StatCard
              icon={Clock}
              label="대기 중"
              value={applied}
              color="#F59E0B"
            />
            <StatCard
              icon={Clipboard}
              label="취소/거절"
              value={total - approved - applied}
              color="#EF4444"
            />
          </div>

          {/* 테이블 */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #F1F5F9",
              overflow: "hidden",
            }}
          >
            {/* 테이블 헤더 */}
            <div
              style={{
                padding: "12px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #F1F5F9",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: ds.ink }}>
                  참가자 목록
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "#94A3B8",
                    background: "#F1F5F9",
                    padding: "2px 8px",
                    borderRadius: 5,
                  }}
                >
                  {filtered.length}
                </span>
                {hasSelected && (
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: ds.brand,
                      background: `${ds.brand}0C`,
                      padding: "4px 10px",
                      borderRadius: 6,
                    }}
                  >
                    {selected.size}건 선택됨
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {/* 상태 필터 */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 7,
                    border: "1px solid #E2E8F0",
                    fontSize: 12,
                    fontFamily: ds.ff,
                    color: ds.ink,
                    outline: "none",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <option value="ALL">전체 상태</option>
                  <option value="APPLIED">대기</option>
                  <option value="APPROVED">승인</option>
                  <option value="CANCELLED">취소</option>
                  <option value="REJECTED">거절</option>
                </select>
                {/* 검색 */}
                <div style={{ position: "relative" }}>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="이름/이메일/연락처"
                    style={{
                      width: 170,
                      padding: "6px 12px 6px 30px",
                      borderRadius: 7,
                      border: "1px solid #E2E8F0",
                      fontSize: 12.5,
                      fontFamily: ds.ff,
                      color: ds.ink,
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = ds.brand)}
                    onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
                  />
                  <Search
                    size={13}
                    color="#94A3B8"
                    style={{
                      position: "absolute",
                      left: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                </div>
                {hasSelected && (
                  <button
                    onClick={() => setModal({ type: "bulkDelete" })}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "6px 12px",
                      borderRadius: 7,
                      border: "1px solid #FECACA",
                      background: "#FEF2F2",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#DC2626",
                      cursor: "pointer",
                      fontFamily: ds.ff,
                    }}
                  >
                    <Trash2 size={12} /> 선택 삭제
                  </button>
                )}
              </div>
            </div>

            {/* 테이블 본체 */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <th style={{ width: 44, padding: "10px 14px" }}>
                    <Checkbox checked={isAllSelected} onChange={toggleAll} />
                  </th>
                  {[
                    { label: "참가자(회원)", w: "25%" },
                    { label: "연락처", w: "15%" },
                    { label: "가입유형", w: 80 },
                    { label: "신청일", w: "15%" },
                    { label: "상태", w: 70 },
                    { label: "", w: 150 },
                  ].map((c, i) => (
                    <th
                      key={i}
                      style={{
                        padding: "10px 14px",
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: "#94A3B8",
                        textAlign: "left",
                        ...(c.w ? { width: c.w } : {}),
                      }}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingParticipants ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ padding: "60px 0", textAlign: "center" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            border: `3px solid ${ds.brand}20`,
                            borderTopColor: ds.brand,
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                        <span
                          style={{
                            fontSize: 13,
                            color: "#94A3B8",
                            fontWeight: 600,
                          }}
                        >
                          참가자 로딩 중...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ padding: "60px 0", textAlign: "center" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <Users size={36} color="#CBD5E1" strokeWidth={1.5} />
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#94A3B8",
                            marginTop: 12,
                          }}
                        >
                          참가자가 없습니다
                        </div>
                        <div
                          style={{
                            fontSize: 12.5,
                            color: "#CBD5E1",
                            marginTop: 4,
                          }}
                        >
                          아직 이 행사에 신청한 회원이 없습니다
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const st = REG_STATUS[r.status] || REG_STATUS.APPLIED;
                    const sg = SIGNUP_TYPE[r.signupType] || SIGNUP_TYPE.NORMAL;
                    const isRemoving = removing === r.applyId;
                    const isChecked = selected.has(r.applyId);
                    return (
                      <tr
                        key={r.applyId}
                        className={isRemoving ? "row-removing" : ""}
                        onClick={() => setModal({ type: "detail", item: r })}
                        style={{
                          borderBottom: "1px solid #F8FAFC",
                          cursor: "pointer",
                          transition: "background .1s",
                          background: isChecked
                            ? `${ds.brand}06`
                            : "transparent",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = isChecked
                            ? `${ds.brand}0A`
                            : "#F4F6F8")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = isChecked
                            ? `${ds.brand}06`
                            : "transparent")
                        }
                      >
                        <td style={{ width: 44, padding: "11px 14px" }}>
                          <Checkbox
                            checked={isChecked}
                            onChange={() => toggleOne(r.applyId)}
                          />
                        </td>

                        {/* 참가자(회원) */}
                        <td style={{ padding: "11px 14px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 9,
                                background: `${ds.brand}10`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 13,
                                fontWeight: 800,
                                color: ds.brand,
                                flexShrink: 0,
                              }}
                            >
                              {(r.nickname || "?")[0]}
                            </div>
                            <div>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: ds.ink,
                                }}
                              >
                                {r.nickname}
                              </div>
                              <div style={{ fontSize: 11, color: "#94A3B8" }}>
                                {r.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 연락처 */}
                        <td
                          style={{
                            padding: "11px 14px",
                            fontSize: 12.5,
                            color: "#475569",
                          }}
                        >
                          {r.phone || "—"}
                        </td>

                        {/* 가입유형 */}
                        <td style={{ padding: "11px 14px" }}>
                          <Pill color={sg.c} bg={sg.bg}>
                            {sg.l}
                          </Pill>
                        </td>

                        {/* 신청일 */}
                        <td
                          style={{
                            padding: "11px 14px",
                            fontSize: 12.5,
                            color: "#475569",
                          }}
                        >
                          {fmtDateShort(r.appliedAt)}
                        </td>

                        {/* 상태 */}
                        <td style={{ padding: "11px 14px" }}>
                          <Pill color={st.c} bg={st.bg}>
                            {st.l}
                          </Pill>
                        </td>

                        {/* 액션 */}
                        <td style={{ padding: "11px 10px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setModal({ type: "detail", item: r });
                              }}
                              style={{
                                padding: "4px 9px",
                                borderRadius: 6,
                                border: "1px solid #E2E8F0",
                                background: "#fff",
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#64748B",
                                cursor: "pointer",
                                fontFamily: ds.ff,
                              }}
                            >
                              상세
                            </button>
                            {r.status === "APPLIED" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(r.applyId, "APPROVED");
                                }}
                                style={{
                                  padding: "4px 9px",
                                  borderRadius: 6,
                                  border: "1px solid #D1FAE5",
                                  background: "#ECFDF5",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: "#059669",
                                  cursor: "pointer",
                                  fontFamily: ds.ff,
                                }}
                              >
                                승인
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setModal({ type: "delete", item: r });
                              }}
                              style={{
                                padding: "4px 9px",
                                borderRadius: 6,
                                border: "1px solid #FECACA60",
                                background: "#FEF2F208",
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#DC2626",
                                cursor: "pointer",
                                fontFamily: ds.ff,
                              }}
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ═══════ 모달들 ═══════ */}
      {modal?.type === "detail" && (
        <DetailModal
          item={modal.item}
          onClose={() => setModal(null)}
          onStatusChange={handleStatusChange}
          onDelete={(item) => setModal({ type: "delete", item })}
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmModal
          title="참가자 삭제"
          msg={`"${modal.item.nickname}" 참가자를 삭제하시겠습니까?\n(행사 신청 기록만 삭제되고, 회원 계정은 유지됩니다)`}
          onConfirm={handleDelete}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.type === "bulkDelete" && (
        <ConfirmModal
          title="선택 삭제"
          msg={`선택한 ${selected.size}건의 행사 신청 기록을 삭제하시겠습니까?\n(회원 계정은 유지됩니다)`}
          onConfirm={handleBulkDelete}
          onCancel={() => setModal(null)}
        />
      )}
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
