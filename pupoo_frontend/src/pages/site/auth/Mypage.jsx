import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mypageApi } from "./api/mypageApi";
import {
  notificationApi,
  emitNotificationUnreadCount,
} from "../../../app/http/notificationApi";
import { reviewApi } from "../../../app/http/reviewApi";
import { eventApi } from "../../../app/http/eventApi";
import { interestApi } from "../../../app/http/interestApi";
import {
  BellOff, PawPrint, QrCode, CalendarDays, Star, CheckCircle2, Circle,
  PartyPopper, Presentation, Compass, Store, Trophy, Megaphone,
  Cookie, Bath, Scissors, Puzzle, Shirt, HeartPulse,
  GraduationCap, Footprints, Pill, Watch, MoreHorizontal,
} from "lucide-react";

const styles = `
  .mp-root {
    box-sizing: border-box;
    font-family: "Pretendard Variable", "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #f7f8fa;
    min-height: 100vh;
    color: #1a1a1a;
  }
  .mp-root *, .mp-root *::before, .mp-root *::after {
    box-sizing: border-box;
    font-family: inherit;
  }
  .mp-container {
    width: min(1400px, calc(100% - 40px));
    margin: 0 auto;
    padding: 100px 0 64px;
  }
  .mp-layout {
    display: flex;
    gap: 28px;
    align-items: flex-start;
  }
  /* ── Sidebar ── */
  .mp-sidebar {
    width: 260px;
    flex-shrink: 0;
    position: sticky;
    top: 100px;
  }
  .mp-sidebar-card {
    background: #fff;
    border: none;
    border-radius: 16px;
    padding: 28px 22px 22px;
    box-shadow: 0 1px 8px rgba(0,0,0,.04);
  }
  .mp-sidebar-top {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding-bottom: 18px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 16px;
  }
  .mp-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, #5b9bf7, #7eb8ff);
    color: #fff;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
    margin-bottom: 12px;
  }
  .mp-name {
    font-size: 17px;
    font-weight: 800;
    color: #1a1a1a;
    margin-bottom: 3px;
  }
  .mp-email {
    color: #aaa;
    font-size: 12px;
    margin-bottom: 8px;
    word-break: break-all;
  }
  .mp-joined {
    font-size: 11px;
    color: #888;
    background: #f3f4f6;
    border-radius: 999px;
    display: inline-flex;
    padding: 3px 10px;
    font-weight: 500;
  }
  .mp-sidebar-stats {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 16px;
  }
  .mp-sidebar-stat {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .mp-sidebar-stat-label {
    font-size: 13px;
    color: #999;
    font-weight: 500;
  }
  .mp-sidebar-stat-value {
    font-size: 13px;
    font-weight: 800;
    color: #1a1a1a;
  }
  .mp-sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 16px;
  }
  .mp-sidebar-nav-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: 10px;
    border: none;
    background: none;
    font-size: 14px;
    font-weight: 600;
    color: #888;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: background 0.12s, color 0.12s;
  }
  .mp-sidebar-nav-item:hover {
    background: #f5f6f8;
    color: #555;
  }
  .mp-sidebar-nav-item.active {
    background: #eef4ff;
    color: #5b9bf7;
    font-weight: 700;
  }
  .mp-sidebar-nav-arrow {
    font-size: 12px; color: #ccc; transition: color .12s;
  }
  .mp-sidebar-nav-item.active .mp-sidebar-nav-arrow { color: #5b9bf7; }
  .mp-sidebar-nav-item:hover .mp-sidebar-nav-arrow { color: #999; }
  .mp-sidebar-nav-badge {
    background: #ef4444;
    color: #fff;
    border-radius: 999px;
    padding: 1px 7px;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.4;
    margin-right: 4px;
  }
  .mp-sidebar-actions {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .mp-sidebar-btn {
    width: 100%;
    padding: 10px 0;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    text-align: center;
    transition: background .15s;
  }
  .mp-sidebar-btn.primary {
    border: none;
    background: #5b9bf7;
    color: #fff;
  }
  .mp-sidebar-btn.primary:hover { background: #4a8de6; }
  .mp-sidebar-btn.ghost {
    border: 1px solid #e8eaed;
    background: #fff;
    color: #666;
  }
  .mp-sidebar-btn.ghost:hover { background: #f5f6f8; }
  /* ── Main ── */
  .mp-main {
    flex: 1;
    min-width: 0;
  }
  .mp-page-title {
    margin: 0 0 4px;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #1a1a1a;
  }
  .mp-page-subtitle {
    margin: 0 0 24px;
    font-size: 13px;
    color: #bbb;
  }
  .mp-card {
    background: #fff;
    border: none;
    border-radius: 16px;
    box-shadow: 0 1px 8px rgba(0,0,0,.04);
    display: flex; flex-direction: column;
  }
  .mp-stat-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
    margin-bottom: 20px;
  }
  .mp-stat-row .mp-stat-cell {
    padding: 22px 16px;
    text-align: center;
    position: relative;
  }
  .mp-stat-row .mp-stat-cell:not(:last-child)::after {
    content: '';
    position: absolute;
    right: 0;
    top: 24%;
    height: 52%;
    width: 1px;
    background: #eee;
  }
  .mp-stat-value {
    font-size: 28px;
    line-height: 1;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #1a1a1a;
    margin-bottom: 6px;
  }
  .mp-stat-label {
    color: #bbb;
    font-size: 12px;
    font-weight: 500;
  }
  .mp-stat-unit {
    margin-left: 2px;
    color: #bbb;
    font-size: 13px;
    font-weight: 600;
  }
  .mp-section {
    margin-bottom: 0;
  }
  .mp-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 14px;
  }
  .mp-section-title {
    margin: 0;
    font-size: 16px;
    font-weight: 800;
    color: #1a1a1a;
  }
  .mp-count {
    font-size: 12px;
    color: #bbb;
    font-weight: 500;
  }
  .mp-more-link {
    font-size: 12px; color: #5b9bf7; font-weight: 600;
    cursor: pointer; border: none; background: none; padding: 0;
    transition: color .12s;
  }
  .mp-more-link:hover { color: #4a8de6; }
  .mp-section-inner {
    padding: 20px;
    display: flex; flex-direction: column; flex: 1;
  }
  .mp-grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 20px;
  }

  /* ── Mini Calendar ── */
  .mp-cal-nav {
    background: none; border: 1px solid #e5e7eb; border-radius: 6px;
    width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
    font-size: 14px; color: #666; cursor: pointer; transition: background .12s;
  }
  .mp-cal-nav:hover { background: #f3f4f6; }
  .mp-cal-today {
    background: none; border: 1px solid #e5e7eb; border-radius: 6px;
    padding: 2px 10px; font-size: 12px; font-weight: 600; color: #555;
    cursor: pointer; transition: background .12s;
  }
  .mp-cal-today:hover { background: #f3f4f6; }
  .mp-cal { margin-top: 12px; }
  .mp-cal-header {
    display: grid; grid-template-columns: repeat(7, 1fr);
    text-align: center; font-size: 12px; font-weight: 600; color: #999;
    margin-bottom: 4px;
  }
  .mp-cal-dow { padding: 4px 0; }
  .mp-cal-body {
    display: grid; grid-template-columns: repeat(7, 1fr); text-align: center;
  }
  .mp-cal-cell {
    padding: 6px 0; font-size: 13px; color: #444; border-radius: 8px;
    cursor: pointer; transition: background .12s; position: relative;
  }
  .mp-cal-cell.empty { cursor: default; }
  .mp-cal-cell:not(.empty):hover { background: #f3f4f6; }
  .mp-cal-cell.today { font-weight: 800; color: #5b9bf7; }
  .mp-cal-cell.selected { background: #5b9bf7; color: #fff; font-weight: 700; }
  .mp-cal-cell.selected:hover { background: #4a8de6; }
  .mp-cal-cell.has-event::after {
    content: ''; position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%);
    width: 4px; height: 4px; border-radius: 50%; background: #5b9bf7;
  }
  .mp-cal-cell.selected.has-event::after { background: #fff; }
  .mp-cal-events {
    margin-top: 12px; border-top: 1px solid #f0f0f0; padding-top: 10px;
    display: flex; flex-direction: column; gap: 6px;
  }
  .mp-cal-event-item {
    display: flex; align-items: center; gap: 10px; font-size: 12.5px;
    padding: 6px 0;
  }
  .mp-cal-event-item + .mp-cal-event-item {
    border-top: 1px solid #f3f3f3;
  }
  .mp-cal-event-time {
    color: #5b9bf7; font-size: 12px; font-weight: 700; flex-shrink: 0;
    min-width: 38px;
  }
  .mp-cal-event-info { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; }
  .mp-cal-event-name { font-weight: 600; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .mp-cal-event-loc { font-size: 11px; color: #aaa; flex-shrink: 0; }
  .mp-cal-event-status {
    font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 10px;
    background: #eef4ff; color: #5b9bf7; flex-shrink: 0;
  }

  .mp-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
    min-height: 120px;
  }
  .mp-item {
    border: none;
    border-radius: 16px;
    padding: 20px 22px;
    background: #f4f6f8;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .mp-item.clickable {
    cursor: pointer;
  }
  .mp-item.clickable:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  }
  .mp-item.mp-item-main {
    background: linear-gradient(135deg, #5b9bf7 0%, #7eb8ff 100%);
    color: #fff;
  }
  .mp-item.mp-item-main .mp-item-title { color: #fff; font-size: 16px; }
  .mp-item.mp-item-main .mp-item-meta { color: rgba(255,255,255,0.75); }
  .mp-item.mp-item-main .mp-badge { background: rgba(255,255,255,0.25); color: #fff; border-color: transparent; }
  .mp-item-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .mp-item-title {
    font-size: 15px;
    font-weight: 800;
    color: #1a1a1a;
    line-height: 1.4;
  }
  .mp-item-meta {
    margin-top: 8px;
    font-size: 12.5px;
    color: #999;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    line-height: 1.5;
  }
  .mp-badge {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    border: none;
    letter-spacing: -0.2px;
  }
  .mp-badge.applied {
    background: #CCF0E4;
    color: #1e40af;
  }
  .mp-badge.approved {
    background: #d1fae5;
    color: #065f46;
  }
  .mp-badge.cancelled {
    background: #fee2e2;
    color: #991b1b;
  }
  .mp-badge.rejected {
    background: #f1f5f9;
    color: #64748b;
  }
  .mp-badge.refund-requested {
    background: #ffedd5;
    color: #9a3412;
  }
  .mp-badge.refund-approved {
    background: #CCF0E4;
    color: #1e40af;
  }
  .mp-badge.refund-rejected {
    background: #fee2e2;
    color: #991b1b;
  }
  .mp-badge.refunded {
    background: #f1f5f9;
    color: #64748b;
  }
  .mp-noti-title {
    font-size: 13px;
    font-weight: 700;
    color: #1e293b;
  }
  .mp-noti-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }
  .mp-noti-delete {
    border: none;
    background: #f3f4f6;
    color: #9ca3af;
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s, color 0.15s;
  }
  .mp-noti-delete:hover:not(:disabled) {
    background: #fee2e2;
    color: #dc2626;
  }
  .mp-noti-delete:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .mp-noti-content {
    margin-top: 4px;
    font-size: 12px;
    color: #9ca3af;
    line-height: 1.45;
    white-space: pre-wrap;
  }
  .mp-noti-time {
    margin-top: 6px;
    font-size: 11px;
    color: #cbd5e1;
  }

  /* ── Subscription card grid ── */
  .mp-sub-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .mp-sub-card {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 22px 10px 16px; border-radius: 14px;
    border: 1.5px solid #e8e8e8; background: #fff;
    cursor: pointer; transition: all .25s ease;
    text-align: center; position: relative; gap: 8px;
  }
  .mp-sub-card:hover { border-color: #c0c0c0; transform: translateY(-1px); }
  .mp-sub-card.active {
    background: #eef4ff; border-color: #5b9bf7;
  }
  .mp-sub-card.active:hover { border-color: #4a8de6; }
  .mp-sub-card:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
  .mp-sub-card-icon {
    color: #bbb; transition: all .25s ease;
    display: flex; align-items: center; justify-content: center;
  }
  .mp-sub-card.active .mp-sub-card-icon {
    color: #5b9bf7;
  }
  .mp-sub-card-label {
    font-size: 14px; font-weight: 300; color: #bbb;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    transition: color .2s; max-width: 100%;
  }
  .mp-sub-card.active .mp-sub-card-label { color: #2a2a2a; font-weight: 700; }
  .mp-sub-card-check {
    position: absolute; top: 8px; right: 8px;
    color: #d0d0d0; transition: all .25s ease;
  }
  .mp-sub-card.active .mp-sub-card-check {
    color: #5b9bf7;
  }

  .mp-subscription-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .mp-channel-btn {
    border: none;
    border-radius: 8px;
    background: #f3f4f6;
    color: #aaa;
    font-size: 11px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 12px;
    cursor: pointer;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    transition: background .15s, color .15s;
  }
  .mp-channel-btn.active {
    color: #fff;
    background: #5b9bf7;
    font-weight: 700;
  }
  .mp-channel-btn:not(.active):hover {
    background: #e8eaed;
  }
  .mp-channel-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .mp-subscription-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .mp-subscription-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .mp-subscription-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .mp-subscription-btn {
    border: none;
    background: #CCF0E4;
    color: #1e40af;
    font-size: 12px;
    font-weight: 700;
    padding: 5px 12px;
    border-radius: 6px;
    cursor: pointer;
    white-space: nowrap;
    transition: background .15s;
  }
  .mp-subscription-btn:hover { background: #CCF0E4; }
  .mp-subscription-btn.warn {
    background: #fee2e2;
    color: #dc2626;
  }
  .mp-subscription-btn.warn:hover { background: #fecaca; }
  .mp-subscription-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .mp-btn {
    border-radius: 8px;
    border: none;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition: background .15s, transform .1s;
  }
  .mp-btn:active { transform: scale(0.97); }
  .mp-btn.primary {
    background: #5b9bf7;
    color: #fff;
  }
  .mp-btn.primary:hover { background: #4a8de6; }
  .mp-btn.ghost {
    background: #f3f4f6;
    color: #555;
  }
  .mp-btn.ghost:hover { background: #e8eaed; }
  .mp-empty {
    padding: 36px 12px 32px;
    text-align: center;
    color: #bbb;
    font-size: 13px;
    border-radius: 12px;
    background: #f9fafb;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
    width: 100%; flex: 1;
  }
  .mp-empty-icon {
    display: flex; align-items: center; justify-content: center;
  }
  .mp-empty-icon svg { color: #bbb; }
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

  @media (max-width: 1023px) {
    .mp-container {
      width: calc(100% - 32px);
      padding: 88px 0 48px;
    }
    .mp-layout {
      flex-direction: column;
    }
    .mp-sidebar {
      width: 100%;
      position: static;
    }
    .mp-sidebar-card {
      padding: 22px 18px 18px;
    }
    .mp-stat-row {
      grid-template-columns: repeat(2, 1fr);
    }
    .mp-grid2 {
      grid-template-columns: 1fr;
    }
    .mp-sub-grid {
      grid-template-columns: repeat(3, 1fr);
    }
    .mp-section-inner {
      padding: 18px;
    }
  }
  @media (max-width: 767px) {
    .mp-container {
      width: calc(100% - 24px);
      padding: 84px 0 36px;
    }
    .mp-page-title {
      font-size: 21px;
    }
    .mp-sidebar-top {
      flex-direction: row;
      align-items: center;
      text-align: left;
      gap: 12px;
    }
    .mp-avatar {
      margin-bottom: 0;
    }
    .mp-stat-row {
      grid-template-columns: 1fr;
    }
    .mp-stat-row .mp-stat-cell {
      padding: 18px 14px;
    }
    .mp-stat-row .mp-stat-cell:not(:last-child)::after {
      display: none;
    }
    .mp-item {
      padding: 16px 16px;
    }
    .mp-item-top,
    .mp-subscription-head,
    .mp-subscription-actions,
    .mp-modal-actions {
      flex-direction: column;
      align-items: stretch;
    }
    .mp-sub-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .mp-section-inner {
      padding: 16px;
    }
    .mp-modal-backdrop {
      padding: 12px;
    }
    .mp-modal {
      padding: 14px;
    }
  }
  @media (max-width: 560px) {
    .mp-sub-grid {
      grid-template-columns: 1fr;
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

const REFUND_STATUS_LABEL = {
  REQUESTED: "환불 요청",
  APPROVED: "환불 승인",
  REJECTED: "환불 거절",
  REFUNDED: "환불 완료",
};

const PET_BREED_LABEL = {
  DOG: "강아지",
  CAT: "고양이",
  OTHER: "기타",
};

const PET_WEIGHT_LABEL = {
  XS: "초소형",
  S: "소형",
  M: "중형",
  L: "대형",
  XL: "초대형",
};

const INTEREST_NAME_LABEL = {
  EVENT: "행사",
  SESSION: "세션",
  EXPERIENCE: "체험",
  BOOTH: "부스",
  CONTEST: "콘테스트",
  NOTICE: "공지",
  SNACK: "간식",
  BATH_SUPPLIES: "목욕용품",
  GROOMING: "미용",
  TOY: "장난감",
  CLOTHING: "의류",
  HEALTH: "건강",
  TRAINING: "훈련",
  WALK: "산책",
  SUPPLEMENTS: "영양제",
  ACCESSORIES: "액세서리",
  OTHERS: "기타",
};

const INTEREST_ICON = {
  EVENT: PartyPopper,
  SESSION: Presentation,
  EXPERIENCE: Compass,
  BOOTH: Store,
  CONTEST: Trophy,
  NOTICE: Megaphone,
  SNACK: Cookie,
  BATH_SUPPLIES: Bath,
  GROOMING: Scissors,
  TOY: Puzzle,
  CLOTHING: Shirt,
  HEALTH: HeartPulse,
  TRAINING: GraduationCap,
  WALK: Footprints,
  SUPPLEMENTS: Pill,
  ACCESSORIES: Watch,
  OTHERS: MoreHorizontal,
};

const SUBSCRIPTION_CHANNEL_OPTIONS = [
  { key: "allowInapp", label: "앱" },
  { key: "allowEmail", label: "이메일" },
  { key: "allowSms", label: "문자" },
];

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
  if (key === "REFUND_REQUESTED") return "refund-requested";
  if (key === "REFUND_APPROVED") return "refund-approved";
  if (key === "REFUND_REJECTED") return "refund-rejected";
  if (key === "REFUNDED") return "refunded";
  return "rejected";
}

function toInitial(name, email) {
  const source = String(name || "").trim() || String(email || "").trim() || "U";
  return source[0].toUpperCase();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatPetBreed(value) {
  const key = String(value || "").toUpperCase();
  return PET_BREED_LABEL[key] || value || "-";
}

function formatPetWeight(value) {
  const key = String(value || "").toUpperCase();
  return PET_WEIGHT_LABEL[key] || value || "-";
}

function interestLabel(name) {
  return INTEREST_NAME_LABEL[String(name || "").toUpperCase()] || String(name || "기타");
}

function resolveChannelOptions(source, draft) {
  return {
    allowInapp: draft?.allowInapp ?? source?.allowInapp ?? true,
    allowEmail: draft?.allowEmail ?? source?.allowEmail ?? false,
    allowSms: draft?.allowSms ?? source?.allowSms ?? false,
  };
}

function buildRefundMap(rows) {
  return safeArray(rows).reduce((acc, row) => {
    const applyId = row?.eventApplyId;
    if (applyId == null) return acc;
    acc[String(applyId)] = row;
    return acc;
  }, {});
}

function resolveRegistrationStatus(item, refundMap) {
  const refund = refundMap[String(item?.applyId)];
  const refundStatus = String(refund?.status || "").toUpperCase();

  if (refundStatus && REFUND_STATUS_LABEL[refundStatus]) {
    return {
      badgeStatus: refundStatus === "REFUNDED" ? "REFUNDED" : `REFUND_${refundStatus}`,
      label: REFUND_STATUS_LABEL[refundStatus],
    };
  }

  const status = String(item?.status || "").toUpperCase();
  return {
    badgeStatus: status,
    label: REG_STATUS_LABEL[status] || status || "-",
  };
}

export default function MyPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calSelected, setCalSelected] = useState(now.getDate());

  const [profile, setProfile] = useState(null);
  const [pets, setPets] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [eventMap, setEventMap] = useState({});
  const [participations, setParticipations] = useState([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deletingInboxIds, setDeletingInboxIds] = useState([]);
  const [interests, setInterests] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionError, setSubscriptionError] = useState("");
  const [subscriptionSavingMap, setSubscriptionSavingMap] = useState({});
  const [channelDraftMap, setChannelDraftMap] = useState({});

  const [qrEventId, setQrEventId] = useState("");

  const refreshSubscriptions = useCallback(async () => {
    const rows = await interestApi.getMySubscriptions(false);
    setSubscriptions(safeArray(rows));
  }, []);

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
        petsRes,
        regRes,
        refundRes,
        visitRes,
        inboxRes,
        unreadRes,
        interestsRes,
        subscriptionsRes,
      ] = await Promise.allSettled([
        mypageApi.getMe(),
        mypageApi.getMyPets(),
        mypageApi.getMyEventRegistrations({ page: 0, size: 200 }),
        mypageApi.getMyRefunds({ page: 0, size: 200 }),
        mypageApi.getMyBoothVisitsGroupedByEvent(),
        notificationApi.getInbox(0, 20),
        notificationApi.getUnreadCount(),
        interestApi.listAll(),
        interestApi.getMySubscriptions(false),
      ]);

      if (!mounted) return;

      const me = meRes.status === "fulfilled" ? meRes.value : null;
      const petRows = safeArray(petsRes.status === "fulfilled" ? petsRes.value : []).sort((a, b) => {
        return Number(a?.petId || 0) - Number(b?.petId || 0);
      });
      const regPage = regRes.status === "fulfilled" ? regRes.value : null;
      const refundPage = refundRes.status === "fulfilled" ? refundRes.value : null;
      const visitGroups = visitRes.status === "fulfilled" ? visitRes.value : [];
      const inboxData = inboxRes.status === "fulfilled" ? inboxRes.value : null;
      const unread = unreadRes.status === "fulfilled" ? Number(unreadRes.value) || 0 : 0;
      const interestRows = interestsRes.status === "fulfilled" ? safeArray(interestsRes.value) : [];
      const subscriptionRows =
        subscriptionsRes.status === "fulfilled"
          ? safeArray(subscriptionsRes.value)
          : [];

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

      setPets(petRows);

      const regRows = safeArray(regPage?.content).sort((a, b) => {
        const aa = new Date(a?.appliedAt || 0).getTime();
        const bb = new Date(b?.appliedAt || 0).getTime();
        return bb - aa;
      });
      setRegistrations(regRows);
      setRefunds(safeArray(refundPage?.content));

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
      setInterests(interestRows);
      setSubscriptions(subscriptionRows);
      if (
        interestsRes.status === "rejected" ||
        subscriptionsRes.status === "rejected"
      ) {
        setSubscriptionError("구독 정보를 일부 불러오지 못했습니다.");
      } else {
        setSubscriptionError("");
      }

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
        return row?.eventId && s === "APPROVED";
      });
      if (firstQrEvent?.eventId) {
        setQrEventId(String(firstQrEvent.eventId));
      }

      if (
        meRes.status === "rejected" ||
        regRes.status === "rejected" ||
        refundRes.status === "rejected"
      ) {
        setError("일부 데이터를 불러오지 못했습니다. 다시 시도해 주세요.");
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

  const refundMap = useMemo(() => buildRefundMap(refunds), [refunds]);

  const qrCandidates = useMemo(
    () =>
      registrations.filter((item) => {
        const status = String(item?.status || "").toUpperCase();
        return item?.eventId && status === "APPROVED";
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
        refundStatus: refundMap[String(item?.applyId)]?.status || null,
        eventName: item?.eventName || detail?.eventName || "행사 정보 없음",
        location: detail?.location || "장소 정보 없음",
        startAt: detail?.startAt,
      };
    });
  }, [eventMap, refundMap, registrations]);

  // Calendar events derived from registrations (real DB data)
  const calEvents = useMemo(() => {
    const events = [];
    registrations.forEach((item) => {
      const detail = eventMap[String(item?.eventId)] || {};
      const status = String(item?.status || "").toUpperCase();
      const startAt = detail?.startAt;
      const endAt = detail?.endAt;
      if (!startAt) return;

      // Add event start date
      const d = new Date(startAt);
      if (Number.isNaN(d.getTime())) return;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      const hh = String(d.getHours()).padStart(2,"0");
      const mm = String(d.getMinutes()).padStart(2,"0");
      const evName = item?.eventName || detail?.eventName || "행사";
      const statusLabel = status === "APPROVED" ? "승인" : status === "APPLIED" ? "신청" : status === "CANCELLED" ? "취소" : "";
      events.push({
        date: dateStr,
        name: evName,
        time: `${hh}:${mm}`,
        status: statusLabel,
        location: detail?.location || "",
      });

      // If multi-day event, add end date too
      if (endAt) {
        const d2 = new Date(endAt);
        if (!Number.isNaN(d2.getTime())) {
          const dateStr2 = `${d2.getFullYear()}-${String(d2.getMonth()+1).padStart(2,"0")}-${String(d2.getDate()).padStart(2,"0")}`;
          if (dateStr2 !== dateStr) {
            events.push({
              date: dateStr2,
              name: `${evName} (마감)`,
              time: `${String(d2.getHours()).padStart(2,"0")}:${String(d2.getMinutes()).padStart(2,"0")}`,
              status: statusLabel,
              location: detail?.location || "",
            });
          }
        }
      }
    });
    return events;
  }, [registrations, eventMap]);

  const participationRows = useMemo(() => {
    return participations.map((item) => {
      const detail = eventMap[String(item?.eventId)] || {};
      return {
        ...item,
        eventName: item?.eventName || detail?.eventName || "행사 정보 없음",
        location: detail?.location || "장소 정보 없음",
      };
    });
  }, [participations, eventMap]);

  const activeSubscriptions = useMemo(
    () =>
      subscriptions.filter(
        (row) => String(row?.status || "").toUpperCase() === "ACTIVE",
      ),
    [subscriptions],
  );

  const activeSubscriptionMap = useMemo(() => {
    const map = new Map();
    activeSubscriptions.forEach((row) => {
      const interestId = Number(row?.interestId);
      if (Number.isFinite(interestId)) {
        map.set(interestId, row);
      }
    });
    return map;
  }, [activeSubscriptions]);

  const availableInterests = useMemo(
    () =>
      interests.filter((row) => {
        const interestId = Number(row?.interestId);
        const isActive = row?.isActive !== false;
        return Number.isFinite(interestId) && isActive && !activeSubscriptionMap.has(interestId);
      }),
    [interests, activeSubscriptionMap],
  );

  const getChannelOptions = useCallback(
    (interestId, source) =>
      resolveChannelOptions(source, channelDraftMap[interestId]),
    [channelDraftMap],
  );

  const setChannelOptions = useCallback((interestId, source, updater) => {
    setChannelDraftMap((prev) => {
      const base = resolveChannelOptions(source, prev[interestId]);
      const next =
        typeof updater === "function" ? updater(base) : updater;
      return {
        ...prev,
        [interestId]: next,
      };
    });
  }, []);

  const openQrCheckin = () => {
    const nextEventId = qrEventId || String(qrCandidates[0]?.eventId || "");
    navigate(
      nextEventId
        ? `/registration/qrcheckin?eventId=${nextEventId}`
        : "/registration/qrcheckin",
    );
  };

  const moveToEventPage = (eventId) => {
    if (!eventId) return;
    navigate(`/program/current`);
  };

  const handleDeleteNotification = useCallback(
    async (inboxId) => {
      if (inboxId == null || deletingInboxIds.includes(inboxId)) return;

      setDeletingInboxIds((prev) => [...prev, inboxId]);
      setError("");

      try {
        await notificationApi.click(inboxId);
        setNotifications((prev) =>
          prev.filter((item) => Number(item?.inboxId) !== Number(inboxId)),
        );
        setUnreadCount((prev) => {
          const next = Math.max(0, (Number(prev) || 0) - 1);
          emitNotificationUnreadCount(next);
          return next;
        });
      } catch (e) {
        setError(e?.message || "알림 삭제에 실패했습니다.");
      } finally {
        setDeletingInboxIds((prev) => prev.filter((id) => id !== inboxId));
      }
    },
    [deletingInboxIds],
  );

  const setSubscriptionSaving = useCallback((interestId, saving) => {
    setSubscriptionSavingMap((prev) => ({
      ...prev,
      [interestId]: saving,
    }));
  }, []);

  const handleSubscribeInterest = useCallback(
    async (interestId, source) => {
      if (interestId == null) return;
      const channelOptions = getChannelOptions(interestId, source);
      setSubscriptionSaving(interestId, true);
      setSubscriptionError("");
      try {
        await interestApi.subscribe({
          interestId,
          ...channelOptions,
        });
        await refreshSubscriptions();
      } catch (e) {
        setSubscriptionError(
          e?.response?.data?.message ||
            e?.message ||
            "구독 처리에 실패했습니다.",
        );
      } finally {
        setSubscriptionSaving(interestId, false);
      }
    },
    [getChannelOptions, refreshSubscriptions, setSubscriptionSaving],
  );

  const handleUnsubscribeInterest = useCallback(
    async (interestId) => {
      if (interestId == null) return;
      setSubscriptionSaving(interestId, true);
      setSubscriptionError("");
      try {
        await interestApi.unsubscribe(interestId);
        await refreshSubscriptions();
      } catch (e) {
        setSubscriptionError(
          e?.response?.data?.message ||
            e?.message ||
            "구독 해지에 실패했습니다.",
        );
      } finally {
        setSubscriptionSaving(interestId, false);
      }
    },
    [refreshSubscriptions, setSubscriptionSaving],
  );

  const handleToggleSubscriptionChannel = useCallback(
    async (row, channelKey) => {
      const interestId = Number(row?.interestId);
      if (!Number.isFinite(interestId) || !channelKey) return;

      const currentOptions = getChannelOptions(interestId, row);
      const nextOptions = {
        ...currentOptions,
        [channelKey]: !currentOptions[channelKey],
      };

      setChannelOptions(interestId, row, nextOptions);
      setSubscriptionSaving(interestId, true);
      setSubscriptionError("");

      try {
        await interestApi.updateChannels({
          interestId,
          ...nextOptions,
        });
        await refreshSubscriptions();
      } catch (e) {
        setChannelOptions(interestId, row, currentOptions);
        setSubscriptionError(
          e?.response?.data?.message ||
            e?.message ||
            "알림 채널 변경에 실패했습니다.",
        );
      } finally {
        setSubscriptionSaving(interestId, false);
      }
    },
    [
      getChannelOptions,
      refreshSubscriptions,
      setChannelOptions,
      setSubscriptionSaving,
    ],
  );

  const renderRegistrationItem = (item, clickable = false, isMain = false) => {
    const detail = eventMap[String(item?.eventId)] || {};
    const { badgeStatus, label } = resolveRegistrationStatus(item, refundMap);

    return (
      <div
        className={`mp-item${clickable ? " clickable" : ""}${isMain ? " mp-item-main" : ""}`}
        key={`${item?.applyId}-${item?.eventId}`}
        onClick={clickable ? () => moveToEventPage(item?.eventId) : undefined}
      >
        <div className="mp-item-top">
          <div className="mp-item-title">{item?.eventName || detail?.eventName || "행사 정보 없음"}</div>
          <span className={`mp-badge ${statusClass(badgeStatus)}`}>{label}</span>
        </div>
        <div className="mp-item-meta">
          <span>신청일 {fmtDateTime(item?.appliedAt)}</span>
          <span>일정 {fmtDate(detail?.startAt)}</span>
          <span>{detail?.location || "장소 정보 없음"}</span>
        </div>
      </div>
    );
  };

  const renderNotificationItem = (noti, withAbsoluteTime = false) => {
    const inboxId = noti?.inboxId;
    const isDeleting = deletingInboxIds.includes(inboxId);

    return (
      <div className="mp-item" key={inboxId || `${noti?.title}-${noti?.receivedAt}`}>
        <div className="mp-noti-header">
          <div className="mp-noti-title">{noti?.title || "알림"}</div>
          <button
            type="button"
            className="mp-noti-delete"
            onClick={() => handleDeleteNotification(inboxId)}
            disabled={isDeleting}
          >
            {isDeleting ? "삭제 중" : "삭제"}
          </button>
        </div>
        <div className="mp-noti-content">{noti?.content || "-"}</div>
        <div className="mp-noti-time">
          {withAbsoluteTime
            ? `수신 ${fmtDateTime(noti?.receivedAt)}`
            : fmtRelative(noti?.receivedAt)}
        </div>
      </div>
    );
  };

  return (
    <div className="mp-root">
      <style>{styles}</style>

      <main className="mp-container">
        <div className="mp-layout">
          {/* ── Sidebar ── */}
          <aside className="mp-sidebar">
            <div className="mp-sidebar-card">
              <div className="mp-sidebar-top">
                <div className="mp-avatar">{toInitial(profile?.nickname, profile?.email)}</div>
                <div className="mp-name">{profile?.nickname || "회원"}</div>
                <div className="mp-email">{profile?.email || "-"}</div>
                <div className="mp-joined">가입일 {fmtDate(profile?.createdAt)}</div>
              </div>

              <div className="mp-sidebar-stats">
                <div className="mp-sidebar-stat">
                  <span className="mp-sidebar-stat-label">신청 행사</span>
                  <span className="mp-sidebar-stat-value">{loading ? "-" : statRequested}</span>
                </div>
                <div className="mp-sidebar-stat">
                  <span className="mp-sidebar-stat-label">참여 완료</span>
                  <span className="mp-sidebar-stat-value">{loading ? "-" : statCompleted}</span>
                </div>
                <div className="mp-sidebar-stat">
                  <span className="mp-sidebar-stat-label">작성 후기</span>
                  <span className="mp-sidebar-stat-value">{loading ? "-" : reviewCount}</span>
                </div>
                <div className="mp-sidebar-stat">
                  <span className="mp-sidebar-stat-label">QR 체크인</span>
                  <span className="mp-sidebar-stat-value">{loading ? "-" : statQrUsed}</span>
                </div>
              </div>

              <div className="mp-sidebar-nav">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`mp-sidebar-nav-item${activeTab === tab.key ? " active" : ""}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <span>{tab.label}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {tab.key === "notifications" && unreadCount > 0 ? (
                        <span className="mp-sidebar-nav-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
                      ) : null}
                      <span className="mp-sidebar-nav-arrow">›</span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="mp-sidebar-actions">
                <button
                  type="button"
                  className="mp-sidebar-btn primary"
                  onClick={() => navigate("/mypage/profile")}
                >
                  회원정보 수정
                </button>
                <button type="button" className="mp-sidebar-btn ghost" onClick={openQrCheckin}>
                  QR 체크인
                </button>
              </div>
            </div>
          </aside>

          {/* ── Main ── */}
          <div className="mp-main">
            <h1 className="mp-page-title">마이페이지</h1>
            <p className="mp-page-subtitle">나의 활동을 한눈에 확인하세요</p>

            {error ? <div className="mp-danger">{error}</div> : null}

            {activeTab === "overview" ? (
              <>
                {/* Stats row */}
                <div className="mp-card mp-stat-row">
                  <div className="mp-stat-cell">
                    <div className="mp-stat-value">{loading ? "-" : statRequested}</div>
                    <div className="mp-stat-label">신청 행사</div>
                  </div>
                  <div className="mp-stat-cell">
                    <div className="mp-stat-value">{loading ? "-" : statCompleted}</div>
                    <div className="mp-stat-label">참여 완료</div>
                  </div>
                  <div className="mp-stat-cell">
                    <div className="mp-stat-value">{loading ? "-" : reviewCount}</div>
                    <div className="mp-stat-label">작성 후기</div>
                  </div>
                  <div className="mp-stat-cell">
                    <div className="mp-stat-value">{loading ? "-" : statQrUsed}</div>
                    <div className="mp-stat-label">QR 체크인</div>
                  </div>
                </div>

                {/* 2x2 Grid: 최근 신청 행사 / 나의 일정 / 최근 알림 / 반려동물 */}
                <div className="mp-grid2">
                  {/* 최근 신청 행사 */}
                  <div className="mp-card mp-section">
                    <div className="mp-section-inner">
                      <div className="mp-section-head">
                        <h3 className="mp-section-title">최근 신청 행사</h3>
                        <button type="button" className="mp-more-link" onClick={() => setActiveTab("events")}>더보기 ›</button>
                      </div>
                      <div className="mp-list">
                        {recentRegistrations.length === 0 ? (
                          <div className="mp-empty">
                            <div className="mp-empty-icon"><CalendarDays size={26} strokeWidth={1.5} /></div>
                            <span>신청한 행사가 없습니다</span>
                          </div>
                        ) : (
                          recentRegistrations.map((item, idx) => renderRegistrationItem(item, true, idx === 0))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 나의 일정 */}
                  <div className="mp-card mp-section">
                    <div className="mp-section-inner">
                      <div className="mp-section-head">
                        <h3 className="mp-section-title">{calYear}년 {calMonth + 1}월 나의 일정</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button type="button" className="mp-cal-nav" onClick={() => { const d = new Date(calYear, calMonth - 1, 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }}>‹</button>
                          <button type="button" className="mp-cal-today" onClick={() => { const t = new Date(); setCalYear(t.getFullYear()); setCalMonth(t.getMonth()); setCalSelected(t.getDate()); }}>오늘</button>
                          <button type="button" className="mp-cal-nav" onClick={() => { const d = new Date(calYear, calMonth + 1, 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }}>›</button>
                        </div>
                      </div>
                      <div className="mp-cal">
                        <div className="mp-cal-header">
                          {["월","화","수","목","금","토","일"].map(d => <div key={d} className="mp-cal-dow">{d}</div>)}
                        </div>
                        <div className="mp-cal-body">
                          {(() => {
                            const first = new Date(calYear, calMonth, 1);
                            const lastDate = new Date(calYear, calMonth + 1, 0).getDate();
                            const startDay = (first.getDay() + 6) % 7;
                            const cells = [];
                            for (let i = 0; i < startDay; i++) cells.push(<div key={`e-${i}`} className="mp-cal-cell empty" />);
                            for (let d = 1; d <= lastDate; d++) {
                              const dateStr = `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                              const hasEvent = calEvents.some(ev => ev.date === dateStr);
                              const isToday = d === new Date().getDate() && calMonth === new Date().getMonth() && calYear === new Date().getFullYear();
                              const isSel = d === calSelected;
                              cells.push(
                                <div key={d} className={`mp-cal-cell${isToday ? " today" : ""}${isSel ? " selected" : ""}${hasEvent ? " has-event" : ""}`} onClick={() => setCalSelected(d)}>
                                  {d}
                                </div>
                              );
                            }
                            return cells;
                          })()}
                        </div>
                      </div>
                      <div className="mp-cal-events">
                        {(() => {
                          const dateStr = `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(calSelected).padStart(2,"0")}`;
                          const dayEvents = calEvents.filter(ev => ev.date === dateStr);
                          if (dayEvents.length === 0) return (
                            <div style={{ padding: "10px 0", textAlign: "center", fontSize: 12, color: "#ccc" }}>선택한 날짜에 일정이 없습니다</div>
                          );
                          return dayEvents.map((ev, i) => (
                            <div key={i} className="mp-cal-event-item">
                              <span className="mp-cal-event-time">{ev.time}</span>
                              <div className="mp-cal-event-info">
                                <span className="mp-cal-event-name">{ev.name}</span>
                                {ev.location && <span className="mp-cal-event-loc">{ev.location}</span>}
                              </div>
                              {ev.status && <span className="mp-cal-event-status">{ev.status}</span>}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* 최근 알림 */}
                  <div className="mp-card mp-section">
                    <div className="mp-section-inner">
                      <div className="mp-section-head">
                        <h3 className="mp-section-title">최근 알림</h3>
                        <button type="button" className="mp-more-link" onClick={() => setActiveTab("notifications")}>더보기 ›</button>
                      </div>
                      <div className="mp-list">
                        {notifications.slice(0, 4).length === 0 ? (
                          <div className="mp-empty">
                            <div className="mp-empty-icon"><BellOff size={26} strokeWidth={1.5} /></div>
                            <span>수신한 알림이 없습니다</span>
                          </div>
                        ) : (
                          notifications
                            .slice(0, 4)
                            .map((noti) => renderNotificationItem(noti))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 반려동물 관리 */}
                  <div className="mp-card mp-section">
                    <div className="mp-section-inner">
                      <div className="mp-section-head">
                        <h3 className="mp-section-title">반려동물</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="mp-count">{pets.length}마리</span>
                          <button type="button" className="mp-btn primary" style={{ padding: "5px 10px", fontSize: 11, borderRadius: 6 }} onClick={() => navigate("/mypage/pets/new")}>+ 등록</button>
                        </div>
                      </div>
                      <div className="mp-list">
                        {pets.length === 0 ? (
                          <div className="mp-empty">
                            <div className="mp-empty-icon"><PawPrint size={26} strokeWidth={1.5} /></div>
                            <span>등록된 반려동물이 없습니다</span>
                          </div>
                        ) : (
                          pets.slice(0, 3).map((pet) => (
                            <div className="mp-item" key={`pet-${pet?.petId}`} style={{ padding: "14px 16px" }}>
                              <div className="mp-item-top">
                                <div className="mp-item-title" style={{ fontSize: 14 }}>{pet?.petName || "이름 없음"}</div>
                                <button type="button" className="mp-btn ghost" style={{ padding: "4px 8px", fontSize: 11, borderRadius: 6 }} onClick={() => navigate(`/mypage/pets/${pet?.petId}/edit`)}>수정</button>
                              </div>
                              <div className="mp-item-meta" style={{ fontSize: 11.5 }}>
                                <span>{formatPetBreed(pet?.petBreed)}</span>
                                <span>{pet?.petAge ?? "-"}살</span>
                                <span>{formatPetWeight(pet?.petWeight)}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 관심 구독 */}
                {interests.length > 0 && (
                  <div className="mp-card" style={{ marginBottom: 20 }}>
                    <div className="mp-section-inner">
                      <div className="mp-section-head">
                        <h3 className="mp-section-title">관심 구독</h3>
                        <span className="mp-count">{activeSubscriptions.length}개 구독 중</span>
                      </div>
                      <div className="mp-sub-grid">
                        {interests.filter(r => r?.isActive !== false).map((row) => {
                          const interestId = Number(row?.interestId);
                          const isSubscribed = activeSubscriptionMap.has(interestId);
                          const saving = !!subscriptionSavingMap[interestId];
                          return (
                            <button
                              key={interestId}
                              type="button"
                              className={`mp-sub-card${isSubscribed ? " active" : ""}`}
                              disabled={saving}
                              onClick={() => isSubscribed ? handleUnsubscribeInterest(interestId) : handleSubscribeInterest(interestId, row)}
                            >
                              <span className="mp-sub-card-check">
                                {isSubscribed
                                  ? <CheckCircle2 size={18} strokeWidth={2.2} />
                                  : <Circle size={18} strokeWidth={1.5} />}
                              </span>
                              <span className="mp-sub-card-icon">
                                {(() => {
                                  const IconComp = INTEREST_ICON[String(row?.interestName || "").toUpperCase()] || Star;
                                  return <IconComp size={38} strokeWidth={1.5} />;
                                })()}
                              </span>
                              <span className="mp-sub-card-label">
                                {interestLabel(row?.interestName)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

              </>
            ) : null}

            {activeTab === "events" ? (
              <div className="mp-card mp-section">
                <div className="mp-section-inner">
                  <div className="mp-section-head">
                    <h3 className="mp-section-title">신청 행사 목록</h3>
                    <span className="mp-count">총 {registrations.length}건</span>
                  </div>
                  <div className="mp-list">
                    {registrations.length === 0 ? (
                      <div className="mp-empty">
                        <div className="mp-empty-icon"><CalendarDays size={26} strokeWidth={1.5} /></div>
                        <span>신청 이력이 없습니다</span>
                      </div>
                    ) : (
                      registrations.map((item) => renderRegistrationItem(item))
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === "history" ? (
              <div className="mp-card mp-section">
                <div className="mp-section-inner">
                  <div className="mp-section-head">
                    <h3 className="mp-section-title">참여 완료 이력</h3>
                    <span className="mp-count">총 {participationRows.length}건</span>
                  </div>
                  <div className="mp-list">
                    {participationRows.length === 0 ? (
                      <div className="mp-empty">
                        <div className="mp-empty-icon"><QrCode size={26} strokeWidth={1.5} /></div>
                        <span>참여 이력이 없습니다</span>
                      </div>
                    ) : (
                      participationRows.map((row) => (
                        <div className="mp-item" key={`history-${row.eventId}`}>
                          <div className="mp-item-top">
                            <div className="mp-item-title">{row.eventName}</div>
                            <span className="mp-badge approved">참여 완료</span>
                          </div>
                          <div className="mp-item-meta">
                            <span>{row.location}</span>
                            <span>방문 {row.totalVisits}회</span>
                            <span>부스 {row.boothCount}개</span>
                            <span>최근 방문 {fmtDateTime(row.lastVisitedAt)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === "notifications" ? (
              <div className="mp-card mp-section">
                <div className="mp-section-inner">
                  <div className="mp-section-head">
                    <h3 className="mp-section-title">수신 알림 목록</h3>
                    <span className="mp-count">총 {notifications.length}건</span>
                  </div>
                  <div className="mp-list">
                    {notifications.length === 0 ? (
                      <div className="mp-empty">
                        <div className="mp-empty-icon"><BellOff size={26} strokeWidth={1.5} /></div>
                        <span>수신한 알림이 없습니다</span>
                      </div>
                    ) : (
                      notifications.map((noti) =>
                        renderNotificationItem(noti, true),
                      )
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>

    </div>
  );
}
