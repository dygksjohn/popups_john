import { useState, useEffect, useRef } from "react";
import {
  MapPin,
  MoreHorizontal,
  Plus,
  X,
  Pencil,
  Trash2,
  Eye,
  ChevronDown,
  CalendarDays,
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  Calendar,
  Check,
  ArrowRight,
} from "lucide-react";
import ds, { cardStyle, statusMap } from "../shared/designTokens";
import { Pill, DataTable, Td } from "../shared/Components";
import DATA from "../shared/data";

/* ═══════════════════════════════════════════
   전역 스타일
   ═══════════════════════════════════════════ */
const styles = `
@keyframes toastIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes rowFadeOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-30px)}}
.row-removing{animation:rowFadeOut .3s ease forwards}
.em-date-input::-webkit-calendar-picker-indicator{opacity:0;position:absolute;inset:0;width:100%;cursor:pointer}
`;

/* ═══════════════════════════════════════════
   체크박스
   ═══════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════
   미니 프로그레스 바
   ═══════════════════════════════════════════ */
function MiniProgress({ value, max }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  const color = pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : ds.brand;
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 100 }}
    >
      <div
        style={{
          flex: 1,
          height: 5,
          borderRadius: 3,
          background: "#F1F5F9",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 3,
            background: color,
            transition: "width .3s ease",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color,
          minWidth: 32,
          textAlign: "right",
        }}
      >
        {pct}%
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   토스트
   ═══════════════════════════════════════════ */
function Toast({ msg, type = "success", onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  const bg =
    type === "success" ? "#10B981" : type === "error" ? "#EF4444" : "#F59E0B";
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
      {type === "success" ? "✓" : type === "error" ? "✕" : "!"} {msg}
    </div>
  );
}

/* ═══════════════════════════════════════════
   모달 오버레이
   ═══════════════════════════════════════════ */
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
          width: 500,
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

/* ═══════════════════════════════════════════
   확인 모달
   ═══════════════════════════════════════════ */
function ConfirmModal({ title, msg, onConfirm, onCancel, danger }) {
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
          {danger && (
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
          )}
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
              background: danger ? "#EF4444" : ds.brand,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: ds.ff,
            }}
          >
            {danger ? "삭제" : "확인"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/* ═══════════════════════════════════════════
   입력 필드
   ═══════════════════════════════════════════ */
function Field({ label, children, required }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#64748B",
          marginBottom: 7,
          display: "block",
          letterSpacing: 0.2,
        }}
      >
        {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}
const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 9,
  border: "1.5px solid #E2E8F0",
  fontSize: 13.5,
  fontFamily: ds.ff,
  color: ds.ink,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color .15s, box-shadow .15s",
  background: "#fff",
};
const inputFocus = (e) => {
  e.target.style.borderColor = ds.brand;
  e.target.style.boxShadow = `0 0 0 3px ${ds.brand}15`;
};
const inputBlur = (e) => {
  e.target.style.borderColor = "#E2E8F0";
  e.target.style.boxShadow = "none";
};

/* ═══════════════════════════════════════════
   등록폼 날짜 (시작~종료 드롭다운)
   ═══════════════════════════════════════════ */
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const daysIn = (y, m) => new Date(y, m, 0).getDate();

function DatePick({ label, year, month, day, onChange }) {
  const days = daysIn(year, month);
  const selBase = {
    ...inputStyle,
    appearance: "none",
    paddingRight: 26,
    cursor: "pointer",
    padding: "9px 26px 9px 10px",
    fontSize: 13,
    textAlign: "center",
    borderRadius: 8,
  };
  const Wrap = ({ children, flex }) => (
    <div style={{ position: "relative", flex: flex || 1 }}>
      {children}
      <ChevronDown
        size={12}
        color="#94A3B8"
        style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          color: "#94A3B8",
          fontWeight: 600,
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Calendar size={11} /> {label}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <Wrap flex={1.3}>
          <select
            value={year}
            onChange={(e) => {
              const ny = +e.target.value;
              onChange(ny, month, Math.min(day, daysIn(ny, month)));
            }}
            style={selBase}
          >
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
        </Wrap>
        <Wrap>
          <select
            value={month}
            onChange={(e) => {
              const nm = +e.target.value;
              onChange(year, nm, Math.min(day, daysIn(year, nm)));
            }}
            style={selBase}
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}월
              </option>
            ))}
          </select>
        </Wrap>
        <Wrap>
          <select
            value={day}
            onChange={(e) => onChange(year, month, +e.target.value)}
            style={selBase}
          >
            {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}일
              </option>
            ))}
          </select>
        </Wrap>
      </div>
    </div>
  );
}

function DateRangeInput({ startDate, endDate, onStartChange, onEndChange }) {
  const parse = (str, fb) => {
    if (!str) return fb;
    const p = str.replace(/[-.\/]/g, ".").split(".");
    return {
      y: parseInt(p[0]) || 2026,
      m: parseInt(p[1]) || 1,
      d: parseInt(p[2]) || 1,
    };
  };
  const fmt = (y, m, d) =>
    `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}`;
  const s = parse(startDate, { y: 2026, m: 1, d: 1 });
  const e = parse(endDate, { y: 2026, m: 2, d: 1 });
  return (
    <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 14 }}>
      <DatePick
        label="시작일"
        year={s.y}
        month={s.m}
        day={s.d}
        onChange={(y, m, d) => onStartChange(fmt(y, m, d))}
      />
      <div
        style={{
          textAlign: "center",
          fontSize: 13,
          color: "#94A3B8",
          fontWeight: 700,
          padding: "8px 0",
          letterSpacing: 4,
        }}
      >
        ~
      </div>
      <DatePick
        label="종료일"
        year={e.y}
        month={e.m}
        day={e.d}
        onChange={(y, m, d) => onEndChange(fmt(y, m, d))}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════
   인라인 날짜 필터 (시작 날짜 → 끝나는 날짜)
   ═══════════════════════════════════════════ */
function DateFilterInline({ startDate, endDate, onStartChange, onEndChange }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: "1px solid #E2E8F0",
        borderRadius: 8,
        background: "#fff",
        overflow: "hidden",
        height: 32,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 10px",
          position: "relative",
          height: "100%",
        }}
      >
        <span
          style={{
            fontSize: 11.5,
            color: "#94A3B8",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          시작 날짜
        </span>
        <Calendar size={13} color="#94A3B8" />
        <input
          type="date"
          className="em-date-input"
          value={startDate}
          onChange={(e) => {
            onStartChange(e.target.value);
            if (e.target.value > endDate && endDate)
              onEndChange(e.target.value);
          }}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            cursor: "pointer",
            width: "100%",
          }}
        />
      </div>
      <div
        style={{
          width: 28,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderLeft: "1px solid #E2E8F0",
          borderRight: "1px solid #E2E8F0",
          background: "#F8FAFC",
          flexShrink: 0,
        }}
      >
        <ArrowRight size={12} color="#94A3B8" strokeWidth={2} />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 10px",
          position: "relative",
          height: "100%",
        }}
      >
        <span
          style={{
            fontSize: 11.5,
            color: "#94A3B8",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          끝나는 날짜
        </span>
        <Calendar size={13} color="#94A3B8" />
        <input
          type="date"
          className="em-date-input"
          value={endDate}
          onChange={(e) => {
            onEndChange(e.target.value);
            if (e.target.value < startDate && startDate)
              onStartChange(e.target.value);
          }}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            cursor: "pointer",
            width: "100%",
          }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   슬라이드 패널 (등록 / 수정)
   ═══════════════════════════════════════════ */
function SlidePanel({ item, onSave, onClose, isEdit }) {
  const parseExisting = (dateStr) => {
    if (!dateStr) return { start: "2026.01.01", end: "2026.02.01" };
    if (dateStr.includes("~")) {
      const [s, e] = dateStr.split("~").map((x) => x.trim());
      return { start: s, end: e };
    }
    return { start: dateStr, end: dateStr };
  };
  const existing = item
    ? parseExisting(item.date)
    : { start: "2026.01.01", end: "2026.02.01" };

  const [form, setForm] = useState(
    item
      ? { ...item, dateStart: existing.start, dateEnd: existing.end }
      : {
          name: "",
          dateStart: "2026.01.01",
          dateEnd: "2026.02.01",
          location: "",
          status: "pending",
          participants: 0,
          capacity: 500,
          description: "",
        },
  );
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const [err, setErr] = useState("");

  const handleSave = () => {
    if (!form.name || !form.location) {
      setErr("행사명, 장소는 필수입니다.");
      return;
    }
    const dateStr =
      form.dateStart === form.dateEnd
        ? form.dateStart
        : `${form.dateStart} ~ ${form.dateEnd}`;
    const { dateStart, dateEnd, ...rest } = form;
    onSave({ ...rest, date: dateStr });
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 4999,
          background: "rgba(0,0,0,0.15)",
          animation: "fadeIn .15s ease",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 5000,
          width: 440,
          background: "#fff",
          boxShadow: "-4px 0 30px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          animation: "slideIn .25s cubic-bezier(.22,1,.36,1)",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #F1F5F9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: ds.ink,
                margin: 0,
              }}
            >
              {isEdit ? "행사 수정" : "새 행사 등록"}
            </h3>
            <p style={{ fontSize: 11.5, color: "#94A3B8", margin: "3px 0 0" }}>
              {isEdit ? "행사 정보를 수정합니다" : "새로운 행사를 등록합니다"}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "1px solid #E2E8F0",
              background: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} color="#94A3B8" />
          </button>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
          {err && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 9,
                padding: "10px 14px",
                fontSize: 12.5,
                color: "#DC2626",
                marginBottom: 18,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertTriangle size={14} /> {err}
            </div>
          )}
          <Field label="행사명" required>
            <input
              style={inputStyle}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              onFocus={inputFocus}
              onBlur={inputBlur}
              placeholder="예: 반려견 페스티벌"
            />
          </Field>
          <Field label="장소" required>
            <input
              style={inputStyle}
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              onFocus={inputFocus}
              onBlur={inputBlur}
              placeholder="올림픽 공원"
            />
          </Field>
          <Field label="행사 일정" required>
            <DateRangeInput
              startDate={form.dateStart}
              endDate={form.dateEnd}
              onStartChange={(v) => set("dateStart", v)}
              onEndChange={(v) => set("dateEnd", v)}
            />
          </Field>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="참가 정원">
              <input
                type="number"
                style={inputStyle}
                value={form.capacity || ""}
                onChange={(e) => set("capacity", +e.target.value)}
                onFocus={inputFocus}
                onBlur={inputBlur}
                placeholder="500"
              />
            </Field>
            <Field label="상태">
              <div style={{ position: "relative" }}>
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                  style={{
                    ...inputStyle,
                    appearance: "none",
                    paddingRight: 32,
                    cursor: "pointer",
                  }}
                >
                  <option value="pending">대기</option>
                  <option value="active">진행중</option>
                  <option value="ended">종료</option>
                </select>
                <ChevronDown
                  size={14}
                  color="#94A3B8"
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </Field>
          </div>
          <Field label="설명">
            <textarea
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              value={form.description || ""}
              onChange={(e) => set("description", e.target.value)}
              onFocus={inputFocus}
              onBlur={inputBlur}
              placeholder="행사에 대한 간단한 설명"
            />
          </Field>
        </div>
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #F1F5F9",
            display: "flex",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 9,
              border: "1px solid #E2E8F0",
              background: "#fff",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: ds.ff,
              color: "#64748B",
            }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 9,
              border: "none",
              background: ds.brand,
              color: "#fff",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: ds.ff,
            }}
          >
            {isEdit ? "수정 완료" : "등록하기"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   상세 모달
   ═══════════════════════════════════════════ */
function DetailModal({ item, onClose, onEdit, onDelete }) {
  const st = statusMap[item.status];
  const pct =
    item.capacity > 0
      ? Math.round((item.participants / item.capacity) * 100)
      : 0;
  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: "28px" }}>
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
            행사 상세
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
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#94A3B8",
                fontFamily: "monospace",
              }}
            >
              {item.id}
            </span>
            <Pill color={st.c} bg={st.bg}>
              {st.l}
            </Pill>
          </div>
          <h4
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: ds.ink,
              margin: "0 0 14px",
            }}
          >
            {item.name}
          </h4>
          {[
            { l: "일정", v: item.date },
            { l: "장소", v: item.location },
            {
              l: "참가자 수",
              v: `${item.participants} / ${item.capacity || 500}명 (${pct}%)`,
            },
          ].map((r) => (
            <div
              key={r.l}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "9px 0",
                borderBottom: "1px solid #E2E8F0",
              }}
            >
              <span style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>
                {r.l}
              </span>
              <span style={{ fontSize: 13, color: ds.ink, fontWeight: 600 }}>
                {r.v}
              </span>
            </div>
          ))}
          {item.description && (
            <div style={{ marginTop: 14 }}>
              <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600 }}>
                설명
              </span>
              <p
                style={{
                  fontSize: 13,
                  color: "#475569",
                  lineHeight: 1.6,
                  marginTop: 6,
                }}
              >
                {item.description}
              </p>
            </div>
          )}
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
          <button
            onClick={() => {
              onClose();
              onEdit(item);
            }}
            style={{
              padding: "9px 16px",
              borderRadius: 8,
              border: "none",
              background: ds.brand,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: ds.ff,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Pencil size={13} /> 수정하기
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/* ═══════════════════════════════════════════
   더보기 드롭다운
   ═══════════════════════════════════════════ */
function ActionMenu({ onEdit, onDelete, onDetail }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        style={{
          background: open ? "#F1F5F9" : "none",
          border: "none",
          cursor: "pointer",
          padding: 5,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background .1s",
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.background = "#F1F5F9";
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = "none";
        }}
      >
        <MoreHorizontal size={15} color="#94A3B8" />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: 4,
            zIndex: 100,
            background: "#fff",
            borderRadius: 10,
            border: "1px solid #E2E8F0",
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
            minWidth: 130,
            overflow: "hidden",
            animation: "fadeIn .1s ease",
          }}
        >
          {[
            { label: "상세보기", icon: Eye, color: "#475569", fn: onDetail },
            { label: "수정하기", icon: Pencil, color: ds.brand, fn: onEdit },
            { label: "삭제", icon: Trash2, color: "#EF4444", fn: onDelete },
          ].map((a) => (
            <button
              key={a.label}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                a.fn();
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 14px",
                border: "none",
                background: "none",
                fontSize: 12.5,
                fontWeight: 600,
                color: a.color,
                cursor: "pointer",
                fontFamily: ds.ff,
                transition: "background .1s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#F8FAFC")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <a.icon size={13} /> {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   요약 통계 카드
   ═══════════════════════════════════════════ */
function StatCard({ icon: Icon, label, value, color }) {
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
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════════════ */
export default function EventManage({ subTab = "all" }) {
  const [items, setItems] = useState(() =>
    DATA.events.map((e) => ({
      ...e,
      capacity: e.capacity || 500,
      _visible: true,
    })),
  );
  const [modal, setModal] = useState(null);
  const [panel, setPanel] = useState(null);
  const [toast, setToast] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const normalizeDate = (str) => {
    if (!str) return null;
    return str.replace(/\./g, "-").split("~")[0].trim();
  };

  const filterFn =
    {
      all: () => true,
      active: (e) => e.status === "active",
      ended: (e) => e.status === "ended",
      new: (e) => e.status === "pending",
    }[subTab] || (() => true);

  const rows = items
    .filter((e) => e._visible)
    .filter(filterFn)
    .filter((e) => {
      if (!dateFrom && !dateTo) return true;
      const d = normalizeDate(e.date);
      if (!d) return true;
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    });

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const vis = items.filter((e) => e._visible);
  const totalEvents = vis.length;
  const activeEvents = vis.filter((e) => e.status === "active").length;
  const totalParticipants = vis.reduce((a, b) => a + b.participants, 0);
  const pendingEvents = vis.filter((e) => e.status === "pending").length;

  const isAllSelected =
    rows.length > 0 && rows.every((r) => selected.has(r.id));
  const hasSelected = selected.size > 0;
  const toggleAll = () => {
    if (isAllSelected) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  };
  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = (form) => {
    const newId = `EV-${String(items.length + 1).padStart(3, "0")}`;
    setItems((prev) => [
      { ...form, id: newId, participants: 0, _visible: true },
      ...prev,
    ]);
    setPanel(null);
    showToast("새 행사가 등록되었습니다.");
  };
  const handleUpdate = (form) => {
    setItems((prev) =>
      prev.map((e) => (e.id === form.id ? { ...e, ...form } : e)),
    );
    setPanel(null);
    showToast("행사 정보가 수정되었습니다.");
  };
  const handleDelete = () => {
    const id = modal.item.id;
    setModal(null);
    setRemoving(id);
    setTimeout(() => {
      setItems((prev) =>
        prev.map((e) => (e.id === id ? { ...e, _visible: false } : e)),
      );
      setRemoving(null);
      setSelected((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      showToast("행사가 삭제되었습니다.");
    }, 300);
  };
  const handleBulkDelete = () => {
    const ids = new Set(selected);
    setModal(null);
    setItems((prev) =>
      prev.map((e) => (ids.has(e.id) ? { ...e, _visible: false } : e)),
    );
    setSelected(new Set());
    showToast(`${ids.size}건의 행사가 삭제되었습니다.`);
  };
  const handleDeleteAll = () => {
    setModal(null);
    const ids = new Set(rows.map((r) => r.id));
    setItems((prev) =>
      prev.map((e) => (ids.has(e.id) ? { ...e, _visible: false } : e)),
    );
    setSelected(new Set());
    showToast(`${ids.size}건의 행사가 삭제되었습니다.`);
  };

  const cols = [
    { label: "", w: 44 },
    { label: "행사명", w: "30%" },
    { label: "일정", w: 160 },
    { label: "장소", w: 120 },
    { label: "참가율", align: "center", w: 120 },
    { label: "상태", w: 72 },
    { label: "", w: 150 },
  ];

  return (
    <div>
      <style>{styles}</style>

      {/* ── 상단 통계 ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <StatCard
          icon={CalendarDays}
          label="전체 행사"
          value={totalEvents}
          color={ds.brand}
        />
        <StatCard
          icon={TrendingUp}
          label="진행 중"
          value={activeEvents}
          color="#10B981"
        />
        <StatCard
          icon={Users}
          label="총 참가자"
          value={totalParticipants.toLocaleString()}
          color="#8B5CF6"
        />
        <StatCard
          icon={Clock}
          label="대기 중"
          value={pendingEvents}
          color="#F59E0B"
        />
      </div>

      {/* ── 테이블 카드 (헤더에 필터·버튼 통합) ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #F1F5F9",
          overflow: "hidden",
        }}
      >
        {/* 테이블 헤더 바 */}
        <div
          style={{
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          {/* 좌: 제목 + 건수 + 날짜필터 */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: ds.ink }}>
              행사 목록
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
              {rows.length}
            </span>
            <div
              style={{
                width: 1,
                height: 16,
                background: "#E2E8F0",
                margin: "0 2px",
              }}
            />
            <DateFilterInline
              startDate={dateFrom}
              endDate={dateTo}
              onStartChange={setDateFrom}
              onEndChange={setDateTo}
            />
          </div>

          {/* 우: 삭제 + 등록 */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
                  animation: "fadeIn .15s ease",
                }}
              >
                <Trash2 size={12} /> 선택 삭제 ({selected.size})
              </button>
            )}
            {hasSelected && rows.length > 0 && (
              <button
                onClick={() => setModal({ type: "deleteAll" })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 12px",
                  borderRadius: 7,
                  border: "1px solid #E2E8F0",
                  background: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#64748B",
                  cursor: "pointer",
                  fontFamily: ds.ff,
                  transition: "all .1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#FECACA";
                  e.currentTarget.style.color = "#DC2626";
                  e.currentTarget.style.background = "#FEF2F2";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.color = "#64748B";
                  e.currentTarget.style.background = "#fff";
                }}
              >
                <Trash2 size={12} /> 전체 삭제
              </button>
            )}
            <button
              onClick={() => setPanel({ type: "create" })}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 14px",
                borderRadius: 7,
                border: "none",
                background: ds.brand,
                color: "#fff",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: ds.ff,
                transition: "transform .1s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-1px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <Plus size={13} strokeWidth={2.5} /> 행사 등록
            </button>
          </div>
        </div>

        {/* 테이블 헤드 */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
              <th style={{ width: 44, padding: "10px 14px" }}>
                <Checkbox checked={isAllSelected} onChange={toggleAll} />
              </th>
              {cols.slice(1).map((c, i) => (
                <th
                  key={i}
                  style={{
                    padding: "10px 14px",
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "#94A3B8",
                    textAlign: c.align || "left",
                    textTransform: "uppercase",
                    letterSpacing: 0.3,
                    ...(c.w ? { width: c.w } : {}),
                  }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const st = statusMap[r.status];
              const isRemoving = removing === r.id;
              const isChecked = selected.has(r.id);
              return (
                <tr
                  key={r.id}
                  className={isRemoving ? "row-removing" : ""}
                  onClick={() => setModal({ type: "detail", item: r })}
                  style={{
                    borderBottom: "1px solid #F8FAFC",
                    cursor: "pointer",
                    transition: "background .1s",
                    background: isChecked ? `${ds.brand}06` : "transparent",
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
                      onChange={() => toggleOne(r.id)}
                    />
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <div
                      style={{ fontSize: 13, fontWeight: 700, color: ds.ink }}
                    >
                      {r.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#94A3B8",
                        fontFamily: "monospace",
                        marginTop: 1,
                      }}
                    >
                      {r.id}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "11px 14px",
                      fontSize: 13,
                      color: "#475569",
                    }}
                  >
                    {r.date}
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 13,
                        color: "#64748B",
                      }}
                    >
                      <MapPin size={12} color="#94A3B8" />
                      {r.location}
                    </span>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <MiniProgress
                      value={r.participants}
                      max={r.capacity || 500}
                    />
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <Pill color={st.c} bg={st.bg}>
                      {st.l}
                    </Pill>
                  </td>
                  <td style={{ padding: "11px 10px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 3 }}
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
                          transition: "all .12s",
                          lineHeight: 1.2,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#F1F5F9";
                          e.currentTarget.style.borderColor = "#CBD5E1";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#fff";
                          e.currentTarget.style.borderColor = "#E2E8F0";
                        }}
                      >
                        상세
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPanel({ type: "edit", item: r });
                        }}
                        style={{
                          padding: "4px 9px",
                          borderRadius: 6,
                          border: `1px solid ${ds.brand}25`,
                          background: `${ds.brand}06`,
                          fontSize: 11,
                          fontWeight: 600,
                          color: ds.brand,
                          cursor: "pointer",
                          fontFamily: ds.ff,
                          transition: "all .12s",
                          lineHeight: 1.2,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `${ds.brand}12`;
                          e.currentTarget.style.borderColor = `${ds.brand}40`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = `${ds.brand}06`;
                          e.currentTarget.style.borderColor = `${ds.brand}25`;
                        }}
                      >
                        수정
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModal({ type: "delete", item: r });
                        }}
                        style={{
                          padding: "4px 9px",
                          borderRadius: 6,
                          border: "1px solid #FECACA50",
                          background: "#FEF2F208",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#EF4444",
                          cursor: "pointer",
                          fontFamily: ds.ff,
                          transition: "all .12s",
                          lineHeight: 1.2,
                          opacity: 0.7,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#FEF2F2";
                          e.currentTarget.style.borderColor = "#FECACA";
                          e.currentTarget.style.opacity = "1";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#FEF2F208";
                          e.currentTarget.style.borderColor = "#FECACA50";
                          e.currentTarget.style.opacity = "0.7";
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 빈 상태 */}
        {rows.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <CalendarDays
              size={36}
              color="#CBD5E1"
              style={{ marginBottom: 12 }}
            />
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#64748B",
                marginBottom: 4,
              }}
            >
              등록된 행사가 없습니다
            </div>
            <div style={{ fontSize: 12.5, color: "#94A3B8" }}>
              새 행사를 등록해보세요
            </div>
          </div>
        )}
      </div>

      {/* 슬라이드 패널 */}
      {panel?.type === "create" && (
        <SlidePanel onSave={handleCreate} onClose={() => setPanel(null)} />
      )}
      {panel?.type === "edit" && (
        <SlidePanel
          item={panel.item}
          isEdit
          onSave={handleUpdate}
          onClose={() => setPanel(null)}
        />
      )}

      {/* 모달 */}
      {modal?.type === "detail" && (
        <DetailModal
          item={modal.item}
          onClose={() => setModal(null)}
          onEdit={(item) => {
            setModal(null);
            setPanel({ type: "edit", item });
          }}
          onDelete={(item) => setModal({ type: "delete", item })}
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmModal
          title="행사 삭제"
          msg={`"${modal.item.name}" 행사를 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`}
          danger
          onConfirm={handleDelete}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.type === "bulkDelete" && (
        <ConfirmModal
          title="선택 행사 삭제"
          msg={`선택한 ${selected.size}건의 행사를 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`}
          danger
          onConfirm={handleBulkDelete}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.type === "deleteAll" && (
        <ConfirmModal
          title="전체 행사 삭제"
          msg={`현재 필터의 ${rows.length}건 행사를 모두 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`}
          danger
          onConfirm={handleDeleteAll}
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
