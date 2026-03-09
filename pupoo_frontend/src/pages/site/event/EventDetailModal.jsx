import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { eventApi } from "../../../app/http/eventApi";
import { programApi } from "../../../app/http/programApi";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { getEventImage } from "../../admin/shared/eventImageStore";
import { tokenStore } from "../../../app/http/tokenStore";
import { normalizeEventTitle } from "../../../shared/utils/eventDisplay";
import { loadKakaoMapScript } from "../../../shared/utils/kakaoMapScript";
import {
  X,
  MapPin,
  Clock,
  Calendar,
  Users,
  ChevronRight,
  Phone,
  Mail,
  ExternalLink,
  Zap,
  Share2,
  Bookmark,
  CheckCircle,
  AlertCircle,
  Navigation,
  Train,
  Car,
  Building2,
  Mic2,
  Award,
  Download,
  CreditCard,
} from "lucide-react";

/* styles */
const modalStyles = `
  /* Overlay */
  .evm-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.45);
    backdrop-filter: blur(6px);
    display: flex; align-items: flex-start; justify-content: center;
    padding: 32px 16px;
    overflow-y: auto;
    opacity: 0;
    transition: opacity 0.25s ease;
  }
  .evm-overlay.open { opacity: 1; }

  /* Modal body */
  .evm-modal {
    width: 100%; max-width: 1040px;
    background: #fff; border-radius: 18px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.18);
    transform: translateY(24px) scale(0.97);
    transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
    overflow: hidden;
    margin: auto 0;
    max-height: calc(100vh - 64px);
    display: flex;
    flex-direction: row;
  }
  .evm-overlay.open .evm-modal {
    transform: translateY(0) scale(1);
  }

  /* Left poster panel */
  .evm-poster-panel {
    width: 400px;
    flex-shrink: 0;
    background: #f3f4f6;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }
  .evm-poster-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .evm-poster-fallback {
    width: 100%; height: 100%;
    background: linear-gradient(135deg, #1a4fd6 0%, #6366f1 100%);
    display: flex; align-items: center; justify-content: center;
    font-size: 80px;
  }
  .evm-poster-overlay {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%);
    padding: 24px 20px 20px;
  }
  .evm-poster-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(239,68,68,0.9); color: #fff;
    padding: 3px 10px; border-radius: 100px;
    font-size: 11px; font-weight: 700;
    margin-bottom: 6px; backdrop-filter: blur(4px);
  }
  .evm-poster-badge .ev-live-dot {
    width: 6px; height: 6px; border-radius: 50%; background: #fff;
    animation: ev-pulse 1.4s ease-in-out infinite;
  }
  .evm-poster-category {
    font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.85);
    margin-bottom: 2px;
  }

  /* Right content panel */
  .evm-right-panel {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 64px);
  }
  .evm-right-header {
    padding: 20px 28px 0;
    flex-shrink: 0;
  }
  .evm-right-title {
    font-size: 22px; font-weight: 800; color: #111827;
    line-height: 1.3; margin: 0 0 4px;
  }
  .evm-right-sub {
    font-size: 12px; color: #9ca3af; font-weight: 500;
    margin-bottom: 16px;
  }
  .evm-topbar-right {
    position: absolute; top: 14px; right: 14px;
    display: flex; gap: 8px; z-index: 2;
  }

  .evm-body-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .evm-icon-btn {
    width: 34px; height: 34px; border-radius: 50%;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    color: #6b7280; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s;
  }
  .evm-icon-btn:hover { background: #e5e7eb; color: #111827; }

  /* Content */
  .evm-content { padding: 20px 28px 32px; }

  /* Quick info bar */
  .evm-quick-info {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 12px; margin-bottom: 28px;
  }
  .evm-qi-item {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px;
    background: #f8f9fc; border-radius: 10px;
  }
  .evm-qi-icon {
    width: 36px; height: 36px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .evm-qi-label { font-size: 11px; color: #9ca3af; font-weight: 500; }
  .evm-qi-value { font-size: 13px; color: #111827; font-weight: 700; }

  /* Section */
  .evm-section { margin-bottom: 28px; }
  .evm-section-header {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 14px; padding-bottom: 10px;
    border-bottom: 2px solid #f1f3f5;
  }
  .evm-section-header.has-action { justify-content: space-between; }
  .evm-section-title-wrap { display: flex; align-items: center; gap: 8px; }
  .evm-section-title {
    font-size: 15px; font-weight: 800; color: #111827;
  }
  .evm-section-icon {
    width: 28px; height: 28px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  /* Description */
  .evm-desc {
    font-size: 14px; color: #374151; line-height: 1.7;
  }

  /* Program guide */
  .evm-guide-grid {
    --evm-guide-row-height: 72px;
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 12px;
  }
  .evm-guide-panel {
    border: 1px solid #e9ecef;
    border-radius: 12px;
    background: #fff;
    overflow: hidden;
  }
  .evm-guide-panel-head {
    height: 48px;
    padding: 0 14px;
    border-bottom: 1px solid #f1f3f5;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .evm-guide-panel-title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 700;
    color: #111827;
  }
  .evm-guide-pill {
    font-size: 11px;
    font-weight: 700;
    color: #6b7280;
    background: #f3f4f6;
    padding: 3px 10px;
    border-radius: 999px;
  }
  .evm-guide-day-list,
  .evm-guide-program-scroll {
    max-height: calc(var(--evm-guide-row-height) * 5 + 8px * 4 + 16px);
    overflow-y: auto;
    padding: 8px;
  }
  .evm-guide-day-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .evm-guide-day-item {
    min-height: var(--evm-guide-row-height);
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    background: #fff;
    transition: all 0.15s;
    width: 100%;
    text-align: left;
    font-family: inherit;
  }
  .evm-guide-day-item:hover { border-color: #90b3ff; }
  .evm-guide-day-item.active {
    border-color: #1a4fd6;
    background: #f5f8ff;
    box-shadow: 0 0 0 2px rgba(26,79,214,0.08) inset;
  }
  .evm-guide-date-chip {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: #f3f4f6;
    color: #111827;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-weight: 800;
  }
  .evm-guide-day-item.active .evm-guide-date-chip {
    background: #1a4fd6;
    color: #fff;
  }
  .evm-guide-date-day { font-size: 18px; line-height: 1; }
  .evm-guide-date-week { font-size: 9px; opacity: 0.85; margin-top: 2px; }
  .evm-guide-day-info { flex: 1; min-width: 0; }
  .evm-guide-day-title {
    font-size: 14px;
    font-weight: 700;
    color: #111827;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .evm-guide-day-sub { margin-top: 4px; font-size: 12px; color: #9ca3af; }
  .evm-guide-day-count {
    font-size: 11px;
    font-weight: 700;
    color: #1a4fd6;
    background: #eff4ff;
    border-radius: 999px;
    padding: 3px 9px;
    flex-shrink: 0;
  }
  .evm-guide-program-group { margin-bottom: 10px; }
  .evm-guide-program-group:last-child { margin-bottom: 0; }
  .evm-guide-period {
    display: inline-flex;
    padding: 3px 10px;
    border-radius: 999px;
    background: #eff4ff;
    color: #1a4fd6;
    font-size: 11px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  .evm-guide-program-list { display: flex; flex-direction: column; gap: 8px; }
  .evm-guide-program-item {
    min-height: var(--evm-guide-row-height);
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 12px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: #fff;
  }
  .evm-guide-program-item.clickable {
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  }
  .evm-guide-program-item.clickable:hover {
    border-color: #90b3ff;
    background: #f8fbff;
    box-shadow: 0 2px 10px rgba(26,79,214,0.1);
  }
  .evm-guide-program-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-top: 5px;
    flex-shrink: 0;
  }
  .evm-guide-program-dot.done { background: #9ca3af; }
  .evm-guide-program-dot.live { background: #10b981; }
  .evm-guide-program-dot.upcoming { background: #1a4fd6; }
  .evm-guide-program-body { flex: 1; min-width: 0; }
  .evm-guide-program-name {
    font-size: 13.5px;
    font-weight: 700;
    color: #111827;
    line-height: 1.35;
  }
  .evm-guide-program-meta {
    margin-top: 5px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    font-size: 12px;
    color: #9ca3af;
  }
  .evm-guide-program-meta-item { display: inline-flex; align-items: center; gap: 4px; }
  .evm-guide-program-status {
    font-size: 11px;
    font-weight: 700;
    color: #6b7280;
    background: #f3f4f6;
    border-radius: 999px;
    padding: 3px 10px;
    flex-shrink: 0;
  }
  .evm-guide-empty {
    min-height: var(--evm-guide-row-height);
    border: 1px dashed #d1d5db;
    border-radius: 10px;
    color: #9ca3af;
    font-size: 12.5px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fafbfc;
  }

  /* Speakers */
  .evm-speakers { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .evm-speaker-card {
    display: flex; gap: 12px; padding: 14px 16px;
    background: #f8f9fc; border-radius: 12px;
    border: 1px solid #f1f3f5;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .evm-speaker-card:hover {
    border-color: #dde4f0; box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  }
  .evm-speaker-avatar {
    width: 44px; height: 44px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 14px; font-weight: 800; flex-shrink: 0;
    letter-spacing: -0.5px;
  }
  .evm-speaker-name { font-size: 13.5px; font-weight: 700; color: #111827; }
  .evm-speaker-role { font-size: 11.5px; color: #6b7280; margin-top: 1px; }
  .evm-speaker-topic { font-size: 11px; color: #1a4fd6; font-weight: 600; margin-top: 4px; }

  /* Participants bar */
  .evm-participants-bar {
    background: #f8f9fc; border-radius: 12px; padding: 18px 20px;
  }
  .evm-part-header {
    display: flex; justify-content: space-between; align-items: baseline;
    margin-bottom: 10px;
  }
  .evm-part-count {
    font-size: 28px; font-weight: 800; color: #111827;
  }
  .evm-part-count span { font-size: 14px; font-weight: 500; color: #9ca3af; }
  .evm-part-pct {
    font-size: 14px; font-weight: 700; color: #1a4fd6;
  }
  .evm-part-track {
    height: 8px; background: #e5e7eb; border-radius: 100px;
    overflow: hidden; margin-bottom: 10px;
  }
  .evm-part-fill {
    height: 100%; border-radius: 100px;
    background: linear-gradient(90deg, #1a4fd6, #6366f1);
    transition: width 0.6s cubic-bezier(0.16,1,0.3,1);
  }
  .evm-part-note {
    font-size: 12px; color: #9ca3af;
  }
  .evm-part-note strong { color: #ef4444; font-weight: 700; }

  /* Location */
  .evm-map-placeholder {
    height: 180px; border-radius: 12px; overflow: hidden;
    background: #e5e7eb; margin-bottom: 14px;
    position: relative;
  }
  .evm-map-placeholder iframe {
    width: 100%; height: 100%; border: 0;
  }
  .evm-map-placeholder-inner {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 6px;
    color: #9ca3af; font-size: 13px;
    background: linear-gradient(135deg, #f0f4ff 0%, #f8f9fc 100%);
  }
  .evm-address {
    display: flex; align-items: center; gap: 8px;
    font-size: 13.5px; color: #374151; font-weight: 600;
    margin-bottom: 14px;
  }
  .evm-map-links {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }
  .evm-map-link {
    height: 32px;
    padding: 0 12px;
    border-radius: 8px;
    border: 1px solid #dbe1ea;
    background: #fff;
    color: #1f2937;
    text-decoration: none;
    font-size: 12px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: all 0.15s ease;
  }
  .evm-map-link:hover {
    border-color: #1a4fd6;
    color: #1a4fd6;
    background: #f8fbff;
  }
  .evm-map-organizer {
    font-size: 13px;
    color: #374151;
    margin-bottom: 14px;
  }
  .evm-transport { display: flex; flex-direction: column; gap: 8px; }
  .evm-transport-row {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 13px; color: #4b5563; line-height: 1.5;
  }
  .evm-transport-icon {
    width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }

  /* Files */
  .evm-files { display: flex; flex-direction: column; gap: 8px; }
  .evm-file-row {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; background: #f8f9fc; border-radius: 9px;
    cursor: pointer; transition: background 0.15s;
  }
  .evm-file-row:hover { background: #eff4ff; }
  .evm-file-name { font-size: 13px; font-weight: 600; color: #111827; flex: 1; }
  .evm-file-size { font-size: 11px; color: #9ca3af; }

  /* Contact */
  .evm-contact-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .evm-contact-item {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px; background: #f8f9fc; border-radius: 10px;
  }
  .evm-contact-icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: #eff4ff; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .evm-contact-label { font-size: 11px; color: #9ca3af; }
  .evm-contact-value { font-size: 13px; color: #111827; font-weight: 600; }

  /* CTA */
  .evm-cta-bar {
    background: #fff; border-top: 1px solid #e9ecef;
    padding: 16px 28px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    flex-shrink: 0;
  }
  .evm-cta-price-label { font-size: 11px; color: #9ca3af; }
  .evm-cta-price { font-size: 16px; font-weight: 800; color: #111827; }
  .evm-cta-actions { display: flex; gap: 8px; }
  .evm-btn-secondary {
    height: 42px; padding: 0 18px; border-radius: 10px;
    border: 1px solid #e2e8f0; background: #fff;
    font-size: 13px; font-weight: 600; color: #374151;
    cursor: pointer; font-family: inherit;
    display: flex; align-items: center; gap: 6px;
    transition: all 0.15s;
  }
  .evm-btn-secondary:hover { background: #f8f9fc; }
  .evm-btn-primary {
    height: 42px; padding: 0 28px; border-radius: 10px;
    border: none; background: #1a4fd6; color: #fff;
    font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit;
    display: flex; align-items: center; gap: 6px;
    transition: all 0.15s;
    box-shadow: 0 2px 12px rgba(26,79,214,0.25);
  }
  .evm-btn-primary:hover { background: #1541b0; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(26,79,214,0.35); }
  .evm-inline-link-btn {
    height: 30px; padding: 0 11px;
    border: 1px solid #dbe1ea; border-radius: 8px;
    background: #fff; color: #1f2937;
    font-size: 12px; font-weight: 600;
    display: inline-flex; align-items: center; gap: 4px;
    cursor: pointer; font-family: inherit;
    transition: all 0.15s ease;
  }
  .evm-inline-link-btn:hover {
    border-color: #1a4fd6; color: #1a4fd6; background: #f8fbff;
  }

  /* Responsive */
  @media (max-width: 860px) {
    .evm-modal { flex-direction: column; max-width: 780px; max-height: calc(100vh - 24px); }
    .evm-poster-panel { width: 100%; height: 260px; }
    .evm-right-panel { max-height: none; }
    .evm-quick-info { grid-template-columns: 1fr; }
    .evm-speakers { grid-template-columns: 1fr; }
    .evm-contact-grid { grid-template-columns: 1fr; }
    .evm-right-title { font-size: 20px; }
    .evm-content { padding: 20px 18px 28px; }
    .evm-cta-bar { padding: 14px 18px; }
    .evm-guide-grid { grid-template-columns: 1fr; }
  }
`;

function formatDate(value) {
  if (!value) return "일정 미정";
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "일정 미정";
  return `${m[1]}.${m[2]}.${m[3]}`;
}

function formatTime(startAt, endAt) {
  const pick = (v) => {
    if (!v) return "";
    const m = String(v).match(/(\d{2}):(\d{2})/);
    return m ? `${m[1]}:${m[2]}` : "";
  };
  const a = pick(startAt);
  const b = pick(endAt);
  if (a && b) return `${a} ~ ${b}`;
  if (a || b) return a || b;
  return "시간 미정";
}

function normalizeFee(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toDateKey(value) {
  if (!value) return null;
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function toDateFromKey(key) {
  if (!key) return null;
  const d = new Date(`${key}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateKeyLabel(key) {
  if (!key) return "일정 미정";
  return key.replaceAll("-", ".");
}

function weekdayShortKey(key) {
  const d = toDateFromKey(key);
  if (!d) return "-";
  return ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
}

function buildDateKeys(startAt, endAt, scheduleList) {
  const startKey = toDateKey(startAt);
  const endKey = toDateKey(endAt);
  const bySchedule = (Array.isArray(scheduleList) ? scheduleList : [])
    .map((item) => toDateKey(item?.dateKey ?? item?.startAt ?? item?.date ?? item?.day))
    .filter(Boolean);

  if (bySchedule.length > 0) return [...new Set(bySchedule)].sort();

  if (startKey && endKey) {
    const result = [];
    let cursor = toDateFromKey(startKey);
    const end = toDateFromKey(endKey);
    if (cursor && end) {
      while (cursor.getTime() <= end.getTime()) {
        const y = cursor.getFullYear();
        const m = String(cursor.getMonth() + 1).padStart(2, "0");
        const d = String(cursor.getDate()).padStart(2, "0");
        result.push(`${y}-${m}-${d}`);
        cursor.setDate(cursor.getDate() + 1);
      }
      if (result.length > 0) return result;
    }
  }

  if (startKey) return [startKey];
  return [];
}

function normalizeScheduleItem(item, idx, fallbackDateKey) {
  const startAt = item?.startAt ?? item?.startDateTime ?? null;
  const endAt = item?.endAt ?? item?.endDateTime ?? null;
  const rawProgramId = item?.programId ?? item?.id ?? item?.program_id;
  const programId = Number(rawProgramId);
  const timeText =
    item?.time ??
    (startAt || endAt ? formatTime(startAt, endAt) : "시간 미정");
  const dateKey = toDateKey(startAt ?? item?.date ?? item?.day) ?? fallbackDateKey;
  const title =
    item?.programTitle ?? item?.programName ?? item?.title ?? item?.name ?? `프로그램 ${idx + 1}`;
  const place =
    item?.location ??
    item?.place ??
    item?.zone ??
    item?.boothName ??
    (item?.boothId ? `부스 ${item.boothId}` : "장소 미정");
  const rawStatus = String(item?.status ?? "").toUpperCase();
  const status =
    rawStatus.includes("DONE") || rawStatus.includes("END")
      ? "done"
      : rawStatus.includes("LIVE") || rawStatus.includes("ONGOING")
        ? "live"
        : "upcoming";

  const minuteMatch = String(timeText).match(/(\d{1,2}):(\d{2})/);
  const minutes = minuteMatch
    ? Number(minuteMatch[1]) * 60 + Number(minuteMatch[2])
    : null;
  const period =
    minutes === null ? "오후" : minutes < 12 * 60 ? "오전" : minutes < 18 * 60 ? "오후" : "저녁";

  return {
    id: Number.isFinite(programId) ? programId : `${title}-${idx}`,
    programId: Number.isFinite(programId) ? programId : null,
    dateKey,
    title,
    timeText,
    place,
    status,
    period,
  };
}


/* ── 샘플 강아지 이미지 (외부 무료 이미지) ── */
const DOG_SAMPLES = [
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=600&h=900&fit=crop",
];
function getDogImage(eventId) {
  const idx = typeof eventId === "number" ? eventId : 0;
  return DOG_SAMPLES[Math.abs(idx) % DOG_SAMPLES.length];
}

const TRANSPORT_LINE_CANDIDATES = [
  "1호선",
  "2호선",
  "3호선",
  "4호선",
  "5호선",
  "6호선",
  "7호선",
  "8호선",
  "9호선",
  "신분당선",
  "수인분당선",
  "경의중앙선",
];

const LOCATION_TRANSPORT_PRESETS = [
  {
    keywords: ["코엑스", "영동대로"],
    subway: "2호선 삼성역 5번 출구 도보 100m",
    bus: "코엑스 동문 정류소: 143, 146, 301, 341, 360",
    car: "코엑스 주차장 (서울 강남구 영동대로 513) / 기본 30분 2,400원, 1일 최대 60,000원",
  },
  {
    keywords: ["킨텍스"],
    subway: "GTX-A 킨텍스역 1번 출구 도보 100m",
    bus: "킨텍스 제1전시장 정류소: 039, 082, 9700, M7646",
    car: "킨텍스 제1전시장 주차장 (경기 고양시 일산서구 킨텍스로 217-60) / 기본 20분 1,200원",
  },
  {
    keywords: ["대전컨벤션센터", "도룡동"],
    subway: "대전 1호선 정부청사역 도보 100m",
    bus: "대전컨벤션센터 정류소: 705, 911, 918",
    car: "대전컨벤션센터 주차장 (대전 유성구 엑스포로 107) / 기본 30분 1,000원",
  },
];

function hashLocationText(text) {
  const source = String(text || "");
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function cleanAddressToken(token) {
  return String(token || "")
    .replace(/[()]/g, "")
    .replace(/[0-9-]/g, "")
    .replace(/(특별자치도|특별자치시|특별시|광역시|자치시|도|시|군|구|읍|면|동|리|대로|로|길)$/g, "")
    .trim();
}

function pickAddressAnchor(locationText) {
  const text = String(locationText || "").trim();
  if (!text || text === "장소 미정") return "행사장";

  const parts = text.split(/\s+/).filter(Boolean);
  const reversed = [...parts].reverse();
  const placeToken = reversed.find(
    (part) => /[가-힣A-Za-z]/.test(part) && !/^[0-9-]+$/.test(part),
  );
  const areaToken = parts.find((part) => /(구|군|시|읍|면|동)$/.test(part));
  const anchor = cleanAddressToken(placeToken) || cleanAddressToken(areaToken) || "행사장";
  return anchor.length > 10 ? anchor.slice(0, 10) : anchor;
}

function buildTransportGuideFromLocation(locationText) {
  const location = String(locationText || "").trim();
  if (!location || location === "장소 미정") {
    return {
      subway: "정보 없음",
      bus: "정보 없음",
      car: "정보 없음",
    };
  }

  const preset = LOCATION_TRANSPORT_PRESETS.find((item) =>
    item.keywords.some((keyword) => location.includes(keyword)),
  );
  if (preset) {
    return {
      subway: preset.subway,
      bus: preset.bus,
      car: preset.car,
    };
  }

  const seed = hashLocationText(location);
  const anchor = pickAddressAnchor(location);
  const line = TRANSPORT_LINE_CANDIDATES[seed % TRANSPORT_LINE_CANDIDATES.length];
  const stationName = anchor.endsWith("역") ? anchor : `${anchor}역`;
  const stopName = `${anchor}입구 정류소`;
  const busNumbers = [
    String(100 + (seed % 700)),
    String(200 + ((seed * 3) % 600)),
    String(300 + ((seed * 7) % 500)),
  ];
  const parkingName = `${anchor} 공영주차장`;
  const baseFee = 2000 + (seed % 4) * 500;
  const addFee = 500 + (seed % 3) * 100;

  return {
    subway: `${line} ${stationName} 도보 100m`,
    bus: `${stopName}: ${busNumbers.join(", ")}`,
    car: `${parkingName} (${location}) / 기본 30분 ${baseFee.toLocaleString()}원, 추가 10분 ${addFee.toLocaleString()}원`,
  };
}


function formatDistanceLabel(distanceValue) {
  const distance = Number(distanceValue || 0);
  if (!Number.isFinite(distance) || distance <= 0) return "거리 정보 없음";
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(distance >= 10000 ? 0 : 1)}km`;
  }
  return `${Math.round(distance)}m`;
}

function joinGuideParts(parts) {
  return parts.filter(Boolean).join(" · ");
}

function getKakaoServices() {
  const kakao = window.kakao;
  if (!kakao?.maps?.services) {
    throw new Error("Kakao map services unavailable");
  }
  return kakao;
}

function addressSearchKakao(kakao, query) {
  return new Promise((resolve, reject) => {
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(query, (result, status) => {
      if (status === kakao.maps.services.Status.OK && Array.isArray(result) && result[0]) {
        resolve(result[0]);
        return;
      }
      reject(new Error(`addressSearch failed: ${status}`));
    });
  });
}

function keywordSearchKakao(kakao, query, options = {}) {
  return new Promise((resolve, reject) => {
    const places = new kakao.maps.services.Places();
    places.keywordSearch(
      query,
      (result, status) => {
        if (status === kakao.maps.services.Status.OK && Array.isArray(result)) {
          resolve(result);
          return;
        }
        if (status === kakao.maps.services.Status.ZERO_RESULT) {
          resolve([]);
          return;
        }
        reject(new Error(`keywordSearch failed: ${status}`));
      },
      options,
    );
  });
}

function categorySearchKakao(kakao, categoryCode, options = {}) {
  return new Promise((resolve, reject) => {
    const places = new kakao.maps.services.Places();
    places.categorySearch(
      categoryCode,
      (result, status) => {
        if (status === kakao.maps.services.Status.OK && Array.isArray(result)) {
          resolve(result);
          return;
        }
        if (status === kakao.maps.services.Status.ZERO_RESULT) {
          resolve([]);
          return;
        }
        reject(new Error(`categorySearch failed: ${status}`));
      },
      options,
    );
  });
}

async function resolveLocationOrigin(locationText) {
  const kakao = getKakaoServices();

  try {
    const addressResult = await addressSearchKakao(kakao, locationText);
    return {
      x: Number(addressResult.x),
      y: Number(addressResult.y),
    };
  } catch (addressError) {
    const keywordResults = await keywordSearchKakao(kakao, locationText, { size: 1 });
    const place = Array.isArray(keywordResults) ? keywordResults[0] : null;
    if (!place) throw addressError;

    return {
      x: Number(place.x),
      y: Number(place.y),
    };
  }
}

function pickNearestPlace(list) {
  return Array.isArray(list) && list.length > 0 ? list[0] : null;
}

function buildNearbyGuide(place, emptyMessage, unavailableMessage) {
  if (!place) return emptyMessage;

  return joinGuideParts([
    `${place.place_name} 도보 ${formatDistanceLabel(place.distance)}`,
    place.road_address_name || place.address_name || "",
    unavailableMessage,
  ]);
}

async function fetchActualTransportGuide(locationText) {
  const kakao = getKakaoServices();
  const origin = await resolveLocationOrigin(locationText);
  const nearbyOptions = {
    x: origin.x,
    y: origin.y,
    radius: 2000,
    sort: kakao.maps.services.SortBy.DISTANCE,
    size: 5,
  };

  const [subwayResults, busResults, parkingResults] = await Promise.all([
    categorySearchKakao(kakao, "SW8", nearbyOptions),
    keywordSearchKakao(kakao, "버스정류장", { ...nearbyOptions, radius: 1500 }),
    categorySearchKakao(kakao, "PK6", nearbyOptions),
  ]);

  return {
    subway: buildNearbyGuide(
      pickNearestPlace(subwayResults),
      "주변 지하철역 정보를 찾지 못했습니다.",
      "",
    ),
    bus: buildNearbyGuide(
      pickNearestPlace(busResults),
      "주변 버스정류장 정보를 찾지 못했습니다.",
      "노선 정보는 지도 상세에서 확인",
    ),
    car: buildNearbyGuide(
      pickNearestPlace(parkingResults),
      "주변 주차장 정보를 찾지 못했습니다.",
      "요금 정보는 지도 상세에서 확인",
    ),
  };
}

export default function EventDetailModal({ event, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [detailLoading, setDetailLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);
  const [programList, setProgramList] = useState([]);
  const [regStatus, setRegStatus] = useState("");
  const [applyId, setApplyId] = useState(null);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regLoaded, setRegLoaded] = useState(true);
  const [selectedDateKey, setSelectedDateKey] = useState("");
  const [transportInfo, setTransportInfo] = useState({
    loading: true,
    subway: "",
    bus: "",
    car: "",
  });
  const overlayRef = useRef(null);

  const modalEventId = Number(event?.eventId ?? event?.id);
  const hasToken = !!tokenStore.getAccess();
  const RegistrationStatus = Object.freeze({
    APPLIED: "APPLIED",
    CANCELLED: "CANCELLED",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
  });

  useEffect(() => {
    requestAnimationFrame(() => setIsOpen(true));
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!Number.isFinite(modalEventId)) {
      setRegLoaded(true);
      setDetail(null);
      setError("이벤트 정보를 불러올 수 없습니다.");
      setDetailLoading(false);
      return () => {
        mounted = false;
      };
    }

    const fetchDetailAndRegistration = async () => {
      setDetailLoading(true);
      setError("");
      setRegError("");
      setProgramList([]);
      try {
        const res = await eventApi.getEventDetail(modalEventId);
        const data = res.data.data;
        if (mounted) setDetail(data);
        try {
          const programRes = await programApi.getAllProgramsByEvent({
            eventId: modalEventId,
            sort: "startAt,asc",
          });
          if (mounted && Array.isArray(programRes)) {
            const filtered = programRes.filter(
              (item) => Number(item?.eventId) === modalEventId,
            );
            setProgramList(filtered.length > 0 ? filtered : programRes);
          }
        } catch (programError) {
          console.error(programError);
          if (mounted) setProgramList([]);
        }
        if (hasToken) {
          try {
            await fetchMyRegistrations();
          } catch (e) {
            if (e?.response?.status === 401) {
              if (mounted) setRegError("로그인이 필요합니다.");
            }
          }
        }
      } catch (e) {
        const msg =
          e?.response?.data?.message || e?.message || "Failed to load detail.";
        if (mounted) setError(msg);
      } finally {
        if (mounted) setDetailLoading(false);
      }
    };

    fetchDetailAndRegistration();
    return () => {
      mounted = false;
    };
  }, [modalEventId]);

  useEffect(() => {
    let cancelled = false;
    const locationText = String(detail?.location || event?.location || "").trim();

    if (!locationText || locationText === "장소 미정") {
      setTransportInfo({
        loading: false,
        subway: "주변 지하철역 정보를 확인할 수 없습니다.",
        bus: "주변 버스정류장 정보를 확인할 수 없습니다.",
        car: "주변 주차장 정보를 확인할 수 없습니다.",
      });
      return () => {
        cancelled = true;
      };
    }

    const appKey = import.meta.env.VITE_KAKAO_MAP_KEY;
    if (!appKey) {
      setTransportInfo({
        loading: false,
        subway: "카카오 지도 설정이 필요합니다.",
        bus: "카카오 지도 설정이 필요합니다.",
        car: "카카오 지도 설정이 필요합니다.",
      });
      return () => {
        cancelled = true;
      };
    }

    setTransportInfo((prev) => ({ ...prev, loading: true }));

    loadKakaoMapScript(appKey)
      .then(() => fetchActualTransportGuide(locationText))
      .then((next) => {
        if (!cancelled) {
          setTransportInfo({
            loading: false,
            subway: next.subway,
            bus: next.bus,
            car: next.car,
          });
        }
      })
      .catch((transportError) => {
        console.error("[EventDetailModal] transport lookup failed:", transportError);
        if (!cancelled) {
          setTransportInfo({
            loading: false,
            subway: "실제 주변 지하철역 정보를 불러오지 못했습니다.",
            bus: "실제 주변 버스정류장 정보를 불러오지 못했습니다.",
            car: "실제 주변 주차장 정보를 불러오지 못했습니다.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [detail?.location, event?.location]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 280);
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) handleClose();
  };

  const redirectToLogin = () => {
    navigate("/auth/login", {
      state: {
        from: `${location?.pathname || "/"}${location?.search || ""}`,
      },
    });
  };

  const fetchMyRegistrations = async () => {
    if (!hasToken || !Number.isFinite(modalEventId)) {
      setRegLoaded(true);
      return;
    }
    setRegLoading(true);
    setRegLoaded(false);
    try {
      const regRes = await axiosInstance.get(
        "/api/users/me/event-registrations",
        { params: { page: 0, size: 50 } },
      );
      const regContent = regRes.data.data.content;
      const regList = Array.isArray(regContent) ? regContent : [];
      const matched = regList.find(
        (r) => Number(r?.eventId) === modalEventId,
      );
      if (matched) {
        setApplyId(matched?.applyId ?? null);
        setRegStatus(matched?.status ?? "");
      } else {
        setApplyId(null);
        setRegStatus("");
      }
      console.log(
        "[reg] modalEventId",
        modalEventId,
        "len",
        regList.length,
        "matched",
        matched ?? null,
      );
    } finally {
      setRegLoading(false);
      setRegLoaded(true);
    }
  };

  const desc = detail?.description || "설명 없음";
  const loc = detail?.location || event?.location || "장소 미정";
  const organizerName = detail?.organizer || event?.organizer || "정보 없음";
  const organizerPhone =
    detail?.organizerPhone || event?.organizerPhone || detail?.contact?.phone || "정보 없음";
  const organizerEmail =
    detail?.organizerEmail || event?.organizerEmail || detail?.contact?.email || "정보 없음";
  const transportLoadingText = "주변 정보를 불러오는 중...";
  const transportFallbackText = "주변 정보를 확인할 수 없습니다.";
  const subwayGuide = transportInfo.loading ? transportLoadingText : transportInfo.subway || transportFallbackText;
  const busGuide = transportInfo.loading ? transportLoadingText : transportInfo.bus || transportFallbackText;
  const carGuide = transportInfo.loading ? transportLoadingText : transportInfo.car || transportFallbackText;
  const hasValidLocation = Boolean(loc && loc !== "장소 미정");
  const encodedLocation = hasValidLocation ? encodeURIComponent(loc) : "";
  const mapEmbedUrl = hasValidLocation
    ? `https://maps.google.com/maps?q=${encodedLocation}&z=15&output=embed`
    : "";
  const kakaoMapUrl = hasValidLocation
    ? `https://map.kakao.com/?q=${encodedLocation}`
    : "";
  const naverMapUrl = hasValidLocation
    ? `https://map.naver.com/v5/search/${encodedLocation}`
    : "";
  const rawFee = detail?.baseFee ?? event?.baseFee;
  const fee = normalizeFee(rawFee);
  const displayTitle = normalizeEventTitle(detail?.eventName || event?.title, detail || event || {});
  const dateLabel = detail?.startAt ? formatDate(detail.startAt) : "일정 미정";
  const timeLabel =
    detail?.startAt || detail?.endAt
      ? formatTime(detail?.startAt, detail?.endAt)
      : "시간 미정";
  const statusLabel = detail?.status || "-";
  const roundLabel =
    detail?.roundNo !== undefined && detail?.roundNo !== null
      ? String(detail.roundNo)
      : "-";

  const safeParticipants = event?.participants ?? 0;
  const safeCapacity = event?.capacity || 1;
  const pct = Math.round((safeParticipants / safeCapacity) * 100);
  const remaining = safeCapacity - safeParticipants;
  const canCancel =
    regStatus === RegistrationStatus.APPLIED ||
    regStatus === RegistrationStatus.APPROVED;
  const canApply = !regStatus || regStatus === RegistrationStatus.CANCELLED;

  const fallbackDateKey = toDateKey(detail?.startAt);
  const normalizedPrograms = (
    programList.length > 0 ? programList : detail?.schedule || []
  ).map((item, idx) => normalizeScheduleItem(item, idx, fallbackDateKey));

  const dateKeys = buildDateKeys(detail?.startAt, detail?.endAt, normalizedPrograms);
  const dayList = dateKeys.map((key, idx) => {
    const count = normalizedPrograms.filter((p) => p.dateKey === key).length;
    return {
      key,
      index: idx + 1,
      label: formatDateKeyLabel(key),
      weekday: weekdayShortKey(key),
      count,
    };
  });

  const effectiveDateKey =
    (selectedDateKey && dayList.some((d) => d.key === selectedDateKey)
      ? selectedDateKey
      : dayList.find((d) => d.count > 0)?.key || dayList[0]?.key) || "";
  const selectedPrograms = normalizedPrograms.filter(
    (item) => item.dateKey === effectiveDateKey,
  );
  const periods = ["오전", "오후", "저녁"];
  const programGroups = periods.map((period) => ({
    period,
    items: selectedPrograms.filter((item) => item.period === period),
  }));
  const totalProgramCount = normalizedPrograms.length;

  const handleViewAllPrograms = () => {
    const target = Number.isFinite(modalEventId)
      ? `/program/all/${modalEventId}`
      : "/program/all";
    navigate(target);
  };

  const handleViewProgramDetail = (programId) => {
    if (!Number.isFinite(Number(programId))) return;
    navigate(`/program/detail?programId=${Number(programId)}`);
  };

  const copyTextFallback = (text) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    textarea.remove();
    return copied;
  };

  const handleShare = async () => {
    const currentUrl = window.location.href;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        copyTextFallback(currentUrl);
      }
    } catch {
      copyTextFallback(currentUrl);
    }
    window.alert("현재 url이 복사되었습니다");
  };

  const handleApply = async () => {
    if (!Number.isFinite(modalEventId) || regLoading) return;
    if (!hasToken) {
      setRegError("로그인이 필요합니다.");
      redirectToLogin();
      return;
    }
    setRegLoading(true);
    setRegError("");
    try {
      const res = await axiosInstance.post("/api/event-registrations", {
        eventId: modalEventId,
      });
      const data = res.data.data;
      const newApplyId =
        data?.applyId ?? data?.eventRegistrationId ?? data?.id ?? null;
      setApplyId(newApplyId);
      setRegStatus(data?.status ?? RegistrationStatus.APPLIED);
      if (hasToken) {
        await fetchMyRegistrations();
      }
      if (fee > 0) {
        const params = new URLSearchParams({
          eventId: String(modalEventId),
          amount: String(fee),
          title: displayTitle || "",
          returnUrl: location?.pathname || "/",
        });
        navigate(`/payment/checkout?${params.toString()}`);
      }
    } catch (e) {
      if (e?.response?.status === 409) {
        setRegError("이미 신청이 완료되었습니다.");
        setRegStatus(RegistrationStatus.APPLIED);
        if (hasToken) {
          try {
            await fetchMyRegistrations();
          } catch (err) {
            if (err?.response?.status === 401) {
              setRegError("로그인이 필요합니다.");
              redirectToLogin();
            }
          }
        }
        if (fee > 0) {
          const params = new URLSearchParams({
            eventId: String(modalEventId),
            amount: String(fee),
              title: displayTitle || "",
            returnUrl: location?.pathname || "/",
          });
          navigate(`/payment/checkout?${params.toString()}`);
        }
      } else if (e?.response?.status === 401) {
        setRegError("로그인이 필요합니다.");
        redirectToLogin();
      } else {
        console.error(e);
        setRegError("참가 신청에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setRegLoading(false);
    }
  };

  const handleCancel = async () => {
    if (regLoading) return;
    if (!applyId) {
      setRegError("신청 정보를 찾을 수 없습니다.");
      return;
    }
    if (!hasToken) {
      setRegError("로그인이 필요합니다.");
      redirectToLogin();
      return;
    }
    const confirmed = window.confirm("확인을 누르시면 결제가 취소됩니다.");
    if (!confirmed) return;

    setRegLoading(true);
    setRegError("");
    try {
      await axiosInstance.delete(`/api/event-registrations/${applyId}`);
      setRegStatus(RegistrationStatus.CANCELLED);
      if (hasToken) {
        await fetchMyRegistrations();
      }
    } catch (e) {
      if (e?.response?.status === 401) {
        setRegError("로그인이 필요합니다.");
        redirectToLogin();
      } else {
        console.error(e);
        const msg =
          e?.response?.data?.error?.message ||
          e?.response?.data?.message ||
          "취소에 실패했습니다. 잠시 후 다시 시도해 주세요.";
        setRegError(msg);
      }
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <>
      <style>{modalStyles}</style>
      <div
        ref={overlayRef}
        className={`evm-overlay ${isOpen ? "open" : ""}`}
        onClick={handleOverlayClick}
      >
        <div className="evm-modal">
          {/* Left — poster */}
          <div className="evm-poster-panel">
            <img
              className="evm-poster-img"
            src={event.image || getEventImage(modalEventId) || detail?.imageUrl || getDogImage(modalEventId)}
              alt={event.title}
              onError={(e) => { e.target.onerror = null; e.target.src = getDogImage(modalEventId ?? 0); }}
            />
            <div className="evm-poster-overlay">
              {statusLabel === "ONGOING" ? (
                <div className="evm-poster-badge">
                  <div className="ev-live-dot" />
                  LIVE
                </div>
              ) : statusLabel === "UPCOMING" ? (
                <div className="evm-poster-badge" style={{ background: "rgba(26,79,214,0.9)" }}>
                  UPCOMING
                </div>
              ) : statusLabel === "ENDED" || statusLabel === "CLOSED" ? (
                <div className="evm-poster-badge" style={{ background: "rgba(107,114,128,0.9)" }}>
                  종료
                </div>
              ) : (
                <div className="evm-poster-badge">
                  <div className="ev-live-dot" />
                  LIVE
                </div>
              )}
              <div className="evm-poster-category">{event.category}</div>
            </div>
          </div>

          {/* Right — content */}
          <div className="evm-right-panel" style={{ position: "relative" }}>
            <div className="evm-topbar-right">
              <button className="evm-icon-btn" title="공유" onClick={handleShare}>
                <Share2 size={15} />
              </button>
              <button className="evm-icon-btn" title="북마크">
                <Bookmark size={15} />
              </button>
              <button
                className="evm-icon-btn"
                onClick={handleClose}
                title="닫기"
              >
                <X size={17} />
              </button>
            </div>

            <div className="evm-right-header">
              <h2 className="evm-right-title">{displayTitle}</h2>
              <div className="evm-right-sub">
                {dateLabel} · {timeLabel} · {loc}
              </div>
            </div>

          <div className="evm-body-scroll">
          {/* Body */}
          <div className="evm-content">
            {detailLoading && (
              <div className="evm-desc">Loading...</div>
            )}
            {!detailLoading && error && (
              <div className="evm-desc">{error}</div>
            )}

            {/* Quick info */}
            <div className="evm-quick-info">
              <div className="evm-qi-item">
                <div className="evm-qi-icon" style={{ background: "#eff4ff" }}>
                  <Calendar size={17} color="#1a4fd6" />
                </div>
                <div>
                  <div className="evm-qi-label">일시</div>
                  <div className="evm-qi-value">{dateLabel}</div>
                </div>
              </div>
              <div className="evm-qi-item">
                <div className="evm-qi-icon" style={{ background: "#fef3c7" }}>
                  <Clock size={17} color="#f59e0b" />
                </div>
                <div>
                  <div className="evm-qi-label">시간</div>
                  <div className="evm-qi-value">{timeLabel}</div>
                </div>
              </div>
              <div className="evm-qi-item">
                <div className="evm-qi-icon" style={{ background: "#ecfdf5" }}>
                  <MapPin size={17} color="#10b981" />
                </div>
                <div>
                  <div className="evm-qi-label">장소</div>
                  <div className="evm-qi-value">{loc}</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="evm-section">
              <div className="evm-section-header">
                <div
                  className="evm-section-icon"
                  style={{ background: "#eff4ff" }}
                >
                  <Building2 size={15} color="#1a4fd6" />
                </div>
                <div className="evm-section-title">행사 소개</div>
              </div>
              <div className="evm-desc">{desc}</div>
            </div>

            {/* Program Guide */}
            <div className="evm-section">
              <div className="evm-section-header has-action">
                <div className="evm-section-title-wrap">
                  <div
                    className="evm-section-icon"
                    style={{ background: "#fef3c7" }}
                  >
                    <Clock size={15} color="#f59e0b" />
                  </div>
                  <div className="evm-section-title">프로그램 안내</div>
                </div>
                <button
                  type="button"
                  className="evm-inline-link-btn"
                  onClick={handleViewAllPrograms}
                >
                  전체 프로그램 조회
                  <ChevronRight size={13} />
                </button>
              </div>
              <div className="evm-guide-grid">
                <div className="evm-guide-panel">
                  <div className="evm-guide-panel-head">
                    <div className="evm-guide-panel-title">
                      <Calendar size={14} color="#f59e0b" />
                      일자 선택
                    </div>
                    <span className="evm-guide-pill">
                      총 {dayList.length}일 {totalProgramCount}개 프로그램
                    </span>
                  </div>
                  <div className="evm-guide-day-list">
                    {dayList.length === 0 ? (
                      <div className="evm-guide-empty">선택 가능한 일자가 없습니다.</div>
                    ) : (
                      dayList.map((day) => (
                        <button
                          key={day.key}
                          type="button"
                          className={`evm-guide-day-item${effectiveDateKey === day.key ? " active" : ""}`}
                          onClick={() => setSelectedDateKey(day.key)}
                        >
                          <div className="evm-guide-date-chip">
                            <div className="evm-guide-date-day">{day.key.slice(8, 10)}</div>
                            <div className="evm-guide-date-week">{day.weekday}</div>
                          </div>
                          <div className="evm-guide-day-info">
                            <div className="evm-guide-day-title">
                              {day.index}일차 · {day.label}
                            </div>
                            <div className="evm-guide-day-sub">{day.count}개 프로그램</div>
                          </div>
                          <span className="evm-guide-day-count">{day.count}개</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
                <div className="evm-guide-panel">
                  <div className="evm-guide-panel-head">
                    <div className="evm-guide-panel-title">
                      <Clock size={14} color="#f59e0b" />
                      {effectiveDateKey
                        ? `${dayList.find((d) => d.key === effectiveDateKey)?.index ?? 1}일차 · ${formatDateKeyLabel(effectiveDateKey)} 일정`
                        : "일정"}
                    </div>
                    <span className="evm-guide-pill">{selectedPrograms.length}개 프로그램</span>
                  </div>
                  <div className="evm-guide-program-scroll">
                    {programGroups.every((group) => group.items.length === 0) ? (
                      <div className="evm-guide-empty">등록된 프로그램이 없습니다.</div>
                    ) : (
                      programGroups.map((group) => (
                        <div key={group.period} className="evm-guide-program-group">
                          <div className="evm-guide-period">{group.period}</div>
                          {group.items.length > 0 && (
                            <div className="evm-guide-program-list">
                              {group.items.map((item) => (
                                <div
                                  key={item.id}
                                  className={`evm-guide-program-item${item.programId ? " clickable" : ""}`}
                                  role={item.programId ? "button" : undefined}
                                  tabIndex={item.programId ? 0 : undefined}
                                  onClick={
                                    item.programId
                                      ? () => handleViewProgramDetail(item.programId)
                                      : undefined
                                  }
                                  onKeyDown={
                                    item.programId
                                      ? (e) => {
                                          if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            handleViewProgramDetail(item.programId);
                                          }
                                        }
                                      : undefined
                                  }
                                >
                                  <div className={`evm-guide-program-dot ${item.status}`} />
                                  <div className="evm-guide-program-body">
                                    <div className="evm-guide-program-name">{item.title}</div>
                                    <div className="evm-guide-program-meta">
                                      <span className="evm-guide-program-meta-item">
                                        <Clock size={12} /> {item.timeText}
                                      </span>
                                      <span className="evm-guide-program-meta-item">
                                        <MapPin size={12} /> {item.place}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="evm-guide-program-status">
                                    {item.status === "done"
                                      ? "완료"
                                      : item.status === "live"
                                        ? "진행 중"
                                        : "예정"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Speakers */}
            {detail?.speakers && detail.speakers.length > 0 && (
              <div className="evm-section">
                <div className="evm-section-header">
                  <div
                    className="evm-section-icon"
                    style={{ background: "#fce7f3" }}
                  >
                    <Mic2 size={15} color="#e11d48" />
                  </div>
                  <div className="evm-section-title">연사 정보</div>
                </div>
                <div className="evm-speakers">
                  {detail.speakers.map((sp, i) => (
                    <div className="evm-speaker-card" key={i}>
                      <div
                        className="evm-speaker-avatar"
                        style={{ background: sp.color }}
                      >
                        {sp.avatar}
                      </div>
                      <div>
                        <div className="evm-speaker-name">{sp.name}</div>
                        <div className="evm-speaker-role">{sp.role}</div>
                        <div className="evm-speaker-topic">{sp.topic}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Participation */}
            <div className="evm-section">
              <div className="evm-section-header">
                <div
                  className="evm-section-icon"
                  style={{ background: "#ecfdf5" }}
                >
                  <Users size={15} color="#10b981" />
                </div>
                <div className="evm-section-title">참가 현황</div>
              </div>
              <div className="evm-participants-bar">
                <div className="evm-part-header">
                  <div className="evm-part-count">
                    {(safeParticipants ?? 0).toLocaleString()}
                    <span> / {(safeCapacity ?? 0).toLocaleString()}명</span>
                  </div>
                  <div className="evm-part-pct">{pct}%</div>
                </div>
                <div className="evm-part-track">
                  <div className="evm-part-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="evm-part-note">
                  {remaining > 0 ? (
                    <>
                      잔여 <strong>{(remaining ?? 0).toLocaleString()}명</strong> 있음
                    </>
                  ) : (
                    <>
                      <strong>마감</strong> 대기자 등록 가능
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Location & Transport */}
            <div className="evm-section">
              <div className="evm-section-header">
                <div
                  className="evm-section-icon"
                  style={{ background: "#f3e8ff" }}
                >
                  <Navigation size={15} color="#8b5cf6" />
                </div>
                <div className="evm-section-title">위치 및 교통 안내</div>
              </div>

              <div className="evm-map-placeholder">
                {hasValidLocation ? (
                  <iframe
                    title="행사 위치 지도"
                    src={mapEmbedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="evm-map-placeholder-inner">
                    <MapPin size={28} />
                    주소 정보가 없습니다.
                  </div>
                )}
              </div>

              <div className="evm-address">
                <MapPin size={14} color="#1a4fd6" />
                {loc}
              </div>
              {hasValidLocation && (
                <div className="evm-map-links">
                  <a
                    className="evm-map-link"
                    href={kakaoMapUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    카카오맵
                    <ExternalLink size={12} />
                  </a>
                  <a
                    className="evm-map-link"
                    href={naverMapUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    네이버맵
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
              <div className="evm-map-organizer">
                주최: <strong>{organizerName}</strong>
              </div>

              <div className="evm-transport">
                <div className="evm-transport-row">
                  <div
                    className="evm-transport-icon"
                    style={{ background: "#eff4ff" }}
                  >
                    <Train size={14} color="#1a4fd6" />
                  </div>
                  <div>
                    <strong style={{ fontSize: "12px" }}>지하철</strong>
                    <br />
                    {subwayGuide}
                  </div>
                </div>
                <div className="evm-transport-row">
                  <div
                    className="evm-transport-icon"
                    style={{ background: "#ecfdf5" }}
                  >
                    <Navigation size={14} color="#10b981" />
                  </div>
                  <div>
                    <strong style={{ fontSize: "12px" }}>버스</strong>
                    <br />
                    {busGuide}
                  </div>
                </div>
                <div className="evm-transport-row">
                  <div
                    className="evm-transport-icon"
                    style={{ background: "#fef3c7" }}
                  >
                    <Car size={14} color="#f59e0b" />
                  </div>
                  <div>
                    <strong style={{ fontSize: "12px" }}>자동차</strong>
                    <br />
                    {carGuide}
                  </div>
                </div>
              </div>
            </div>

            {/* Files */}
            {detail?.files && detail.files.length > 0 && (
              <div className="evm-section">
                <div className="evm-section-header">
                  <div
                    className="evm-section-icon"
                    style={{ background: "#fff7ed" }}
                  >
                    <Download size={15} color="#ea580c" />
                  </div>
                  <div className="evm-section-title">관련 자료</div>
                </div>
                <div className="evm-files">
                  {detail.files.map((f, i) => (
                    <div className="evm-file-row" key={i}>
                      <Download size={14} color="#6b7280" />
                      <div className="evm-file-name">{f.name}</div>
                      <div className="evm-file-size">{f.size}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact / Organizer */}
            <div className="evm-section">
              <div className="evm-section-header">
                <div
                  className="evm-section-icon"
                  style={{ background: "#f0fdf4" }}
                >
                  <Phone size={15} color="#16a34a" />
                </div>
                <div className="evm-section-title">주최 및 문의</div>
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#374151",
                  marginBottom: "12px",
                }}
              >
                주최: <strong>{organizerName}</strong>
              </div>
              <div className="evm-contact-grid">
                <div className="evm-contact-item">
                  <div className="evm-contact-icon">
                    <Phone size={14} color="#1a4fd6" />
                  </div>
                  <div>
                    <div className="evm-contact-label">전화</div>
                    <div className="evm-contact-value">
                      {organizerPhone}
                    </div>
                  </div>
                </div>
                <div className="evm-contact-item">
                  <div className="evm-contact-icon">
                    <Mail size={14} color="#1a4fd6" />
                  </div>
                  <div>
                    <div className="evm-contact-label">이메일</div>
                    <div className="evm-contact-value">
                      {organizerEmail}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Sticky CTA */}
          <div className="evm-cta-bar">
            <div>
              <div className="evm-cta-price-label">참가비</div>
              <div className="evm-cta-price">
                {fee === null
                  ? "정보 없음"
                  : fee === 0
                    ? "무료"
                    : `${fee.toLocaleString()}원`}
              </div>
              {regError && (
                <div style={{ fontSize: "12px", color: "#b91c1c", marginTop: 4 }}>
                  {regError}
                </div>
              )}
            </div>
            <div className="evm-cta-actions">
              <button className="evm-btn-secondary" onClick={handleShare}>
                <ExternalLink size={14} />
                공유
              </button>
              {regLoading ? (
                <button
                  className="evm-btn-primary"
                  disabled={detailLoading || regLoading}
                >
                  로딩중
                </button>
              ) : canApply ? (
                <button
                  className="evm-btn-primary"
                  onClick={handleApply}
                  disabled={detailLoading || regLoading}
                >
                  <Zap size={14} />
                  참가 신청
                </button>
              ) : canCancel ? (
                <button
                  className="evm-btn-primary"
                  style={{
                    background: "#10b981",
                    boxShadow: "0 2px 12px rgba(16,185,129,0.25)",
                  }}
                  onClick={handleCancel}
                  disabled={detailLoading || regLoading}
                >
                  <CheckCircle size={14} />
                  신청 취소
                </button>
              ) : null}
            </div>
          </div>
          {/* /evm-cta-bar */}

          </div>
          {/* /evm-right-panel */}
        </div>
        {/* /evm-modal */}
      </div>
      {/* /evm-overlay */}
    </>
  );
}
