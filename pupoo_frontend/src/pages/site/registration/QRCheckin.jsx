import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import PageLoading from "../components/PageLoading";
import {
  Calendar,
  MapPin,
  ShieldCheck,
  MessageSquare,
  Download,
  CheckCircle2,
  Info,
  Clock,
  RefreshCw,
  ChevronDown,
  Maximize2,
  Zap,
  Ticket,
  QrCode,
} from "lucide-react";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { eventApi } from "../../../app/http/eventApi";
import { tokenStore } from "../../../app/http/tokenStore";
import { normalizeEventTitle } from "../../../shared/utils/eventDisplay";

const QR_MATRIX = [
  [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,0,0,1,1,0,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,1,1,0,0,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0],
  [1,1,0,1,0,1,1,0,0,1,1,0,1,1,0,1,0,1,1,0,1],
  [0,1,1,0,1,0,0,0,1,0,0,0,1,0,1,1,1,0,0,1,0],
  [1,0,1,1,0,1,1,0,0,0,1,0,0,1,1,0,1,1,0,0,1],
  [0,0,0,1,0,0,0,0,1,1,0,1,1,0,0,0,0,1,0,1,0],
  [1,1,0,0,1,0,1,0,1,0,0,0,1,1,0,1,1,0,1,0,1],
  [0,0,0,0,0,0,0,0,1,1,0,1,0,0,1,0,0,0,1,0,0],
  [1,1,1,1,1,1,1,0,0,0,1,0,1,0,1,0,1,1,0,1,1],
  [1,0,0,0,0,0,1,0,1,0,0,1,0,1,0,1,0,0,1,0,0],
  [1,0,1,1,1,0,1,0,0,1,1,0,1,0,1,1,1,0,0,1,1],
  [1,0,1,1,1,0,1,0,1,0,0,0,1,0,0,0,0,0,1,0,0],
  [1,0,1,1,1,0,1,0,0,1,1,1,0,1,0,1,0,1,0,0,1],
  [1,0,0,0,0,0,1,0,1,0,1,0,1,0,0,0,1,0,1,1,0],
  [1,1,1,1,1,1,1,0,0,0,0,1,0,0,1,0,0,1,1,0,1],
];

const SERVICE_CATEGORIES = [
  { label: "행사 참가 신청", path: "/registration/apply" },
  { label: "신청 내역 조회", path: "/registration/applyhistory" },
  { label: "결제 내역", path: "/registration/paymenthistory" },
  { label: "QR 체크인", path: "/registration/qrcheckin" },
];

const SUBTITLE_MAP = {
  "/registration/apply": "행사에 참가 신청하세요",
  "/registration/applyhistory": "신청한 행사 참가 내역을 확인하세요",
  "/registration/paymenthistory": "결제 완료 내역을 확인하세요",
  "/registration/qrcheckin": "내 QR 코드를 확인하세요",
};

const STATUS_META = {
  ISSUED: { label: "발급됨 (비활성)", color: "#B45309", bg: "#FEF3C7", canEnter: false },
  ACTIVE: { label: "활성", color: "#15803D", bg: "#DCFCE7", canEnter: true },
  EXPIRED: { label: "만료", color: "#6B7280", bg: "#F3F4F6", canEnter: false },
};

const REGISTRATION_STATUS_LABEL = {
  APPLIED: "신청완료",
  APPROVED: "승인완료",
  CANCELLED: "신청취소",
  REJECTED: "승인거절",
};

/* ── Translate common backend errors to Korean ── */
function translateError(msg) {
  if (!msg) return "알 수 없는 오류가 발생했습니다.";
  const s = String(msg);
  if (/duplicate entry/i.test(s)) {
    if (/qr/i.test(s) || /qr_code/i.test(s)) return "이미 해당 행사에 대한 QR 코드가 발급되어 있습니다.";
    if (/email/i.test(s)) return "이미 사용 중인 이메일입니다.";
    if (/phone/i.test(s)) return "이미 등록된 전화번호입니다.";
    if (/nickname/i.test(s)) return "이미 사용 중인 닉네임입니다.";
    return "이미 등록된 데이터가 존재합니다. 중복된 항목을 확인해 주세요.";
  }
  if (/connection refused/i.test(s)) return "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.";
  if (/timeout/i.test(s)) return "요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.";
  if (/unauthorized|403|401/i.test(s)) return "권한이 없습니다. 다시 로그인해 주세요.";
  if (/not found|404/i.test(s)) return "요청한 정보를 찾을 수 없습니다.";
  if (/internal server/i.test(s)) return "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  return s;
}

const css = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .qr-page-bg {
    position: relative; min-height: 100vh; overflow: hidden;
    background: #fff;
  }
  .qr-page-content {
    position: relative;
  }
  .qr-root {
    box-sizing: border-box;
    font-family: inherit;
  }
  .qr-root *, .qr-root *::before, .qr-root *::after { box-sizing: border-box; font-family: inherit; }
  .qr-container { max-width: 960px; margin: 0 auto; padding: 28px 20px 80px; }

  /* ── Filter Bar ── */
  .qr-filter-bar {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 32px; flex-wrap: wrap;
  }
  .qr-filter-label {
    font-size: 14px; font-weight: 700; color: #374151;
    white-space: nowrap; flex-shrink: 0;
  }
  .qr-dropdown-wrap {
    position: relative; flex: 1; min-width: 200px;
  }
  .qr-dropdown-btn {
    width: 100%; height: 48px; padding: 0 42px 0 18px;
    border: 1.5px solid #eee; border-radius: 14px;
    background: #fff; color: #111;
    font-size: 14px; font-weight: 600; cursor: pointer;
    text-align: left; outline: none; font-family: inherit;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    display: flex; align-items: center;
    transition: border-color .15s, box-shadow .15s;
    box-shadow: 0 1px 4px rgba(0,0,0,.04);
  }
  .qr-dropdown-btn:hover { border-color: #ddd; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
  .qr-dropdown-btn:focus,
  .qr-dropdown-btn.open {
    border-color: #ddd; box-shadow: 0 2px 12px rgba(0,0,0,.08);
  }
  .qr-dropdown-btn:disabled { color: #9ca3af; background: #fafafa; cursor: not-allowed; }
  .qr-dropdown-btn .placeholder { color: #9ca3af; font-weight: 500; }
  .qr-dropdown-arrow {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    color: #bbb; pointer-events: none;
    transition: transform .2s;
  }
  .qr-dropdown-arrow.open { transform: translateY(-50%) rotate(180deg); }
  .qr-dropdown-list {
    position: absolute; top: calc(100% + 8px); left: 0; right: 0;
    background: #fff; border: 1px solid #f0f0f0; border-radius: 16px;
    box-shadow: 0 12px 40px rgba(0,0,0,.12);
    z-index: 100; overflow: hidden;
    animation: qr-dd-in .18s ease;
    max-height: 340px; overflow-y: auto;
    padding: 6px;
  }
  .qr-dropdown-item {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 16px; border-radius: 12px;
    cursor: pointer; transition: background .12s;
  }
  .qr-dropdown-item:hover { background: #f5f7fa; }
  .qr-dropdown-item.selected { background: #f3f4f6; }
  .qr-dd-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: #f3f4f6; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; color: #9ca3af; transition: all .12s;
  }
  .qr-dropdown-item.selected .qr-dd-icon { background: #eef0ff; color: #3b6df5; }
  .qr-dd-text { flex: 1; min-width: 0; }
  .qr-dd-title {
    font-size: 14px; font-weight: 500; color: #555;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .qr-dropdown-item.selected .qr-dd-title { font-weight: 700; color: #111; }
  .qr-dd-desc {
    font-size: 12px; color: #b0b5bd; margin-top: 2px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  @keyframes qr-dd-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

  .qr-btn-refresh {
    display: flex; align-items: center; gap: 5px;
    padding: 0 20px; height: 44px;
    border-radius: 999px; border: none;
    background: #4a7cf7; color: #fff;
    font-size: 13px; font-weight: 700;
    cursor: pointer; font-family: inherit;
    transition: background .15s; white-space: nowrap; flex-shrink: 0;
  }
  .qr-btn-refresh:hover { background: #3666e0; }
  .qr-btn-refresh:disabled { opacity: .5; cursor: not-allowed; }

  /* ── Ticket ── */
  .qr-ticket-wrap {
    filter: drop-shadow(0 4px 16px rgba(0,0,0,.06));
  }
  .qr-ticket {
    display: flex;
    background: #fff;
    overflow: visible; position: relative;
    min-height: 520px;
    border-radius: 20px;
    border: 1px solid #f0f0f0;
  }

  /* ── Punch holes left & right ── */
  .qr-punch {
    position: absolute; z-index: 5;
    width: 16px; height: 16px; border-radius: 50%;
    background: #f3f4f6;
    box-shadow: inset 0 0 1px rgba(0,0,0,.04);
  }
  .qr-punch.left { left: -8px; }
  .qr-punch.right { right: -8px; }

  /* Left — QR Side (13:17) */
  .qr-ticket-left {
    flex: 0 0 380px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 44px 32px; position: relative;
  }
  .qr-ticket-left::after {
    content: ''; position: absolute; right: 0; top: 28px; bottom: 28px;
    width: 1px; background: repeating-linear-gradient(to bottom, #dde3ee 0, #dde3ee 6px, transparent 6px, transparent 12px);
  }
  .qr-box {
    width: 240px; height: 240px;
    background: #fff; border: 2px solid #e8ecf4; border-radius: 18px;
    padding: 20px; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 20px rgba(59,109,245,.06);
    margin-bottom: 20px;
  }
  .qr-svg { width: 100%; height: 100%; }
  .qr-img { width: 100%; height: 100%; object-fit: contain; border-radius: 8px; }
  .qr-code-id {
    font-size: 20px; font-weight: 800; color: #3b6df5;
    font-family: 'Courier New', monospace; letter-spacing: 3px; margin-bottom: 6px;
  }

  .qr-left-title { font-size: 18px; font-weight: 800; color: #111; margin-bottom: 6px; }
  .qr-left-desc { font-size: 12.5px; color: #9ca3af; text-align: center; line-height: 1.6; max-width: 300px; margin-bottom: 20px; }
  .qr-safety-box {
    display: flex; align-items: center; gap: 10px;
    background: #f0f4ff; border-radius: 12px; padding: 12px 20px;
    margin-top: 16px;
  }
  .qr-safety-label { font-size: 11px; font-weight: 600; color: #6b7280; }
  .qr-safety-number { font-size: 22px; font-weight: 900; color: #3b6df5; letter-spacing: 3px; font-family: 'Courier New', monospace; }

  /* Timer with refresh icon */
  .qr-timer {
    display: flex; align-items: center; gap: 10px;
    margin-top: 16px; font-size: 13px; color: #9ca3af;
  }
  .qr-refresh-btn {
    width: 38px; height: 38px; border-radius: 50%;
    border: 1.5px solid #dde3ee; background: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all .2s; flex-shrink: 0;
    color: #3b6df5;
  }
  .qr-refresh-btn:hover { border-color: #3b6df5; background: #f0f4ff; }
  .qr-refresh-btn .refresh-icon { transition: transform .3s ease; }
  .qr-timer-text { font-size: 12.5px; color: #888; line-height: 1.4; }
  .qr-timer-text strong { font-weight: 800; color: #3b6df5; font-size: 14px; }
  .qr-timer-text.warning strong { color: #f59e0b; }
  .qr-timer-text.danger strong { color: #ef4444; }

  .qr-btn-enlarge {
    margin-top: 16px; padding: 8px 24px; border-radius: 10px;
    border: 1.5px solid #dde3ee; background: #fff; color: #374151;
    font-size: 13px; font-weight: 600; cursor: pointer;
    display: flex; align-items: center; gap: 6px;
    font-family: inherit; transition: all .15s;
  }
  .qr-btn-enlarge:hover { border-color: #3b6df5; color: #3b6df5; }

  /* Enlarge Modal */
  .qr-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.7);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999; animation: qr-fade-in .2s ease;
  }
  .qr-modal-card {
    background: #fff; border-radius: 24px; padding: 40px;
    max-width: 480px; width: 90%; text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,.3);
    animation: qr-scale-in .25s ease;
  }
  .qr-modal-title { font-size: 18px; font-weight: 800; color: #111; margin-bottom: 6px; }
  .qr-modal-desc { font-size: 13px; color: #9ca3af; margin-bottom: 24px; }
  .qr-modal-qr {
    width: 300px; height: 300px; margin: 0 auto 20px;
    background: #fff; border: 2px solid #e8ecf4; border-radius: 20px;
    padding: 20px; display: flex; align-items: center; justify-content: center;
  }
  .qr-modal-safety {
    display: inline-flex; align-items: center; gap: 10px;
    background: #f0f4ff; border-radius: 12px; padding: 12px 24px;
    margin-bottom: 20px;
  }
  .qr-modal-timer { font-size: 13px; color: #9ca3af; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .qr-modal-close {
    padding: 12px 40px; border-radius: 12px; border: none;
    background: #3b6df5; color: #fff; font-size: 15px; font-weight: 700;
    cursor: pointer; font-family: inherit; transition: background .15s;
  }
  .qr-modal-close:hover { background: #2b57d4; }
  @keyframes qr-fade-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes qr-scale-in { from { opacity: 0; transform: scale(.9); } to { opacity: 1; transform: scale(1); } }
  @keyframes qr-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .qr-refresh-btn.spinning .refresh-icon { animation: qr-spin .6s cubic-bezier(.4,0,.2,1); }

  /* Right — Info Side */
  .qr-ticket-right {
    flex: 1; padding: 44px 36px; display: flex; flex-direction: column;
    position: relative;
  }
  .qr-ticket-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 28px; padding-bottom: 20px;
    border-bottom: 2px solid #f0f2f7;
  }
  .qr-ticket-title { font-size: 22px; font-weight: 800; color: #111; letter-spacing: -.3px; }
  .qr-ticket-badge {
    display: flex; align-items: center; gap: 5px;
    font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 999px;
  }

  .qr-info-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 20px 32px;
    margin-bottom: 28px;
  }
  .qr-info-label {
    font-size: 11px; font-weight: 600; color: #9ca3af;
    text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px;
    display: flex; align-items: center; gap: 5px;
  }
  .qr-info-value { font-size: 15px; font-weight: 700; color: #111; word-break: break-all; }
  .qr-info-value.mono { font-family: 'Courier New', monospace; letter-spacing: .5px; }
  .qr-info-value.placeholder { color: #ccc; font-weight: 500; }

  /* ── Admission Card (입장 가능) — gradient glassmorphism ── */
  .qr-admission-card {
    position: relative; overflow: hidden;
    background: linear-gradient(135deg, #6c63ff 0%, #3b6df5 50%, #38b2ff 100%);
    border-radius: 16px; padding: 24px 28px;
    margin-bottom: 24px; color: #fff;
  }
  .qr-admission-card::before {
    content: ''; position: absolute; top: -30px; right: -30px;
    width: 120px; height: 120px; border-radius: 50%;
    background: rgba(255,255,255,.12);
  }
  .qr-admission-card::after {
    content: ''; position: absolute; bottom: -20px; left: 40%;
    width: 80px; height: 80px; border-radius: 50%;
    background: rgba(255,255,255,.08);
  }
  .qr-admission-top {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 10px; position: relative; z-index: 1;
  }
  .qr-admission-icon {
    width: 40px; height: 40px; border-radius: 12px;
    background: rgba(255,255,255,.2); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
  }
  .qr-admission-title {
    font-size: 18px; font-weight: 800; letter-spacing: -.3px;
  }
  .qr-admission-body {
    font-size: 13px; color: rgba(255,255,255,.85); line-height: 1.7;
    position: relative; z-index: 1;
  }
  .qr-admission-body strong { color: #fff; font-weight: 700; }

  /* ── Not available card ── */
  .qr-noadmit-card {
    background: #f9fafb; border: 1.5px dashed #e0e0e0; border-radius: 16px;
    padding: 24px 28px; margin-bottom: 24px;
    display: flex; align-items: center; gap: 14px; color: #999;
  }
  .qr-noadmit-icon {
    width: 40px; height: 40px; border-radius: 12px;
    background: #f3f4f6; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .qr-noadmit-text { font-size: 14px; font-weight: 600; color: #999; }
  .qr-noadmit-sub { font-size: 12px; color: #bbb; margin-top: 2px; }

  /* Buttons */
  .qr-action-row { display: flex; gap: 10px; margin-top: auto; }
  .qr-action-btn {
    flex: 1; height: 48px; border-radius: 12px; font-size: 14px; font-weight: 700;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px;
    transition: all .15s; font-family: inherit;
  }
  .qr-action-outline { border: 1.5px solid #e0e0e0; background: #fff; color: #374151; }
  .qr-action-outline:hover { border-color: #999; }
  .qr-action-primary { border: none; background: #3b6df5; color: #fff; }
  .qr-action-primary:hover { background: #2b57d4; }
  .qr-action-btn:disabled { opacity: .45; cursor: not-allowed; }

  /* ── Notice — redesigned ── */
  .qr-notice {
    margin-top: 32px; padding: 28px 32px;
    background: #f9fafb;
    border-radius: 20px; border: 1px solid #f0f0f0;
    box-shadow: 0 2px 12px rgba(0,0,0,.03);
  }
  .qr-notice-header {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 20px; padding-bottom: 16px;
    border-bottom: 1.5px solid #f0f0f0;
  }
  .qr-notice-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, #f0f4ff, #e8ecff);
    display: flex; align-items: center; justify-content: center;
  }
  .qr-notice-title {
    font-size: 16px; font-weight: 800; color: #111;
  }
  .qr-notice-list { list-style: none; padding: 0; margin: 0; }
  .qr-notice-item {
    font-size: 14.5px; color: #555; line-height: 1.8;
    display: flex; align-items: flex-start; gap: 12px;
    padding: 6px 0;
  }
  .qr-notice-bullet {
    width: 6px; height: 6px; border-radius: 50%;
    background: linear-gradient(135deg, #6c63ff, #3b6df5);
    flex-shrink: 0; margin-top: 10px;
  }

  /* ── Expired fade ── */
  .qr-ticket.expired {
    opacity: .45; filter: grayscale(.3);
    transition: opacity .5s ease, filter .5s ease;
    pointer-events: none;
  }
  .qr-ticket.expired .qr-refresh-btn {
    pointer-events: auto; opacity: 1;
  }
  .qr-expired-overlay {
    position: absolute; inset: 0; z-index: 10;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: rgba(255,255,255,.6); backdrop-filter: blur(2px);
    border-radius: 20px; pointer-events: auto;
  }
  .qr-expired-text {
    font-size: 16px; font-weight: 700; color: #666; margin-bottom: 12px;
  }
  .qr-expired-refresh {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 28px; border-radius: 999px; border: none;
    background: #3b6df5; color: #fff; font-size: 14px; font-weight: 700;
    cursor: pointer; font-family: inherit; transition: background .15s;
  }
  .qr-expired-refresh:hover { background: #2b57d4; }

  /* ── Error banner ── */
  .qr-error-banner {
    display: flex; align-items: flex-start; gap: 10px;
    margin-top: 12px; padding: 14px 18px;
    background: #fef2f2; border: 1px solid #fecaca;
    border-radius: 12px; font-size: 13px; color: #991b1b;
    line-height: 1.6;
  }
  .qr-error-banner svg { flex-shrink: 0; margin-top: 1px; }

  @media (max-width: 780px) {
    .qr-ticket { flex-direction: column; min-height: auto; border-radius: 16px; }
    .qr-ticket-left { flex: none; padding: 32px 24px; }
    .qr-ticket-left::after { display: none; }
    .qr-punch { display: none; }
    .qr-ticket-right { padding: 28px 24px; }
    .qr-box { width: 200px; height: 200px; }
    .qr-info-grid { grid-template-columns: 1fr; gap: 14px; }
    .qr-filter-bar { gap: 8px; }
    .qr-dropdown-btn { height: 42px; font-size: 13px; border-radius: 10px; }
    .qr-btn-refresh { height: 42px; font-size: 12px; padding: 0 14px; }
    .qr-notice { padding: 20px 20px; }
    .qr-notice-item { font-size: 13px; }
    .qr-admission-card { padding: 20px 22px; }
  }
`;

const PUNCH_COUNT = 18;

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

function formatDateRange(startAt, endAt) {
  if (!startAt && !endAt) return "일정 정보 없음";
  return `${formatDateTime(startAt)} ~ ${formatDateTime(endAt)}`;
}

function formatRegistrationStatus(status) {
  const key = String(status || "").toUpperCase();
  return REGISTRATION_STATUS_LABEL[key] || String(status || "-");
}

function getDownloadFilename(contentDisposition, fallback) {
  const value = String(contentDisposition || "");
  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const basicMatch = value.match(/filename=\"?([^\";]+)\"?/i);
  return basicMatch?.[1] || fallback;
}

function PunchHoles({ side }) {
  const holes = [];
  for (let i = 0; i < PUNCH_COUNT; i++) {
    const pct = ((i + 1) / (PUNCH_COUNT + 1)) * 100;
    holes.push(
      <div key={i} className={`qr-punch ${side}`} style={{ top: `${pct}%`, marginTop: -8 }} />
    );
  }
  return <>{holes}</>;
}

export default function QRCheckin() {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const queryEventId = Number(query.get("eventId"));

  const currentPath = "/registration/qrcheckin";
  const [registrations, setRegistrations] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [eventDetail, setEventDetail] = useState(null);
  const [eventNameById, setEventNameById] = useState({});
  const [qrInfo, setQrInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingQr, setLoadingQr] = useState(false);
  const [error, setError] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [useImage, setUseImage] = useState(true);
  const [showEnlarge, setShowEnlarge] = useState(false);
  const [countdown, setCountdown] = useState(180);
  const [expired, setExpired] = useState(false);
  const [ddOpen, setDdOpen] = useState(false);
  const timerRef = useRef(null);
  const ddRef = useRef(null);

  const registrationMap = useMemo(() => new Map(registrations.map((item) => [item.eventId, item])), [registrations]);

  const safetyNumber = useMemo(() => {
    if (qrInfo?.safetyNumber) return qrInfo.safetyNumber;
    if (qrInfo?.personalSafetyNumber) return qrInfo.personalSafetyNumber;
    const KO = ["가","나","다","라","마","바","사","아","자","차","카","타","파","하","거","너","더","러","머","버","서","어","저","허","고","노","도","로","모","보","소","오","조","호","구","누","두","루","무","부","수","우","주","후"];
    const seed = qrInfo?.qrId ?? 0;
    const d1 = ((seed * 7 + 3) % 90) + 10;
    const k1 = KO[(seed * 13 + 5) % KO.length];
    const d2 = ((seed * 11 + 7) % 90) + 10;
    const k2 = KO[(seed * 17 + 11) % KO.length];
    return `${d1}${k1}${d2}${k2}`;
  }, [qrInfo]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ddRef.current && !ddRef.current.contains(e.target)) setDdOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ── Countdown: always ticks, resets on new QR load ── */
  useEffect(() => {
    setCountdown(180); setExpired(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [qrInfo]);

  useEffect(() => {
    let mounted = true;
    const fetchRegistrations = async () => {
      if (!tokenStore.getAccess()) {
        const goLogin = window.confirm("로그인이 필요한 서비스입니다.\n로그인 페이지로 이동하시겠습니까?");
        if (goLogin) navigate("/auth/login", { state: { from: location.pathname + location.search } });
        else navigate(-1);
        return;
      }
      setLoading(true); setError("");
      try {
        const res = await axiosInstance.get("/api/users/me/event-registrations", { params: { page: 0, size: 200, sort: "appliedAt,desc" } });
        const rows = res?.data?.data?.content ?? [];
        const dedup = []; const seen = new Set();
        for (const row of rows) { if (!row?.eventId || seen.has(row.eventId)) continue; seen.add(row.eventId); dedup.push(row); }
        const approvedOnly = dedup.filter((r) => { const s = String(r?.status || "").toUpperCase(); return s === "APPROVED" || s === "승인완료"; });
        if (!mounted) return;
        setRegistrations(approvedOnly);
        const fallback = approvedOnly[0] || null;
        const selected = Number.isFinite(queryEventId) && approvedOnly.some((r) => r.eventId === queryEventId) ? queryEventId : fallback?.eventId ?? null;
        setSelectedEventId(selected);
      } catch (e) {
        if (!mounted) return;
        setError(translateError(e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || ""));
      } finally { if (mounted) setLoading(false); }
    };
    fetchRegistrations();
    return () => { mounted = false; };
  }, [navigate, queryEventId]);

  useEffect(() => {
    let mounted = true;
    const fetchEventNames = async () => {
      if (!registrations.length) { setEventNameById({}); return; }
      const entries = await Promise.all(
        registrations.map(async (item) => {
          try {
            const eventRes = await eventApi.getEventDetail(item.eventId);
            return [item.eventId, normalizeEventTitle(eventRes?.data?.data?.eventName, eventRes?.data?.data || {}) || `이벤트 #${item.eventId}`];
          } catch { return [item.eventId, `이벤트 #${item.eventId}`]; }
        }),
      );
      if (mounted) setEventNameById(Object.fromEntries(entries));
    };
    fetchEventNames();
    return () => { mounted = false; };
  }, [registrations]);

  const loadQr = useCallback(async (eventId) => {
    if (!eventId) return;
    setLoadingQr(true); setError(""); setUseImage(true); setExpired(false);
    try {
      const [qrRes, eventRes] = await Promise.all([
        axiosInstance.get("/api/qr/me", { params: { eventId } }),
        eventApi.getEventDetail(eventId),
      ]);
      setQrInfo(qrRes?.data?.data ?? null);
      setEventDetail(eventRes?.data?.data ?? null);
    } catch (e) {
      const raw = e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || "";
      setError(translateError(raw));
    }
    finally { setLoadingQr(false); }
  }, []);

  useEffect(() => {
    if (!selectedEventId) { setQrInfo(null); setEventDetail(null); return; }
    loadQr(selectedEventId);
  }, [selectedEventId]);

  const statusMeta = STATUS_META[qrInfo?.qrStatus] || { label: "확인 필요", color: "#6B7280", bg: "#F3F4F6", canEnter: false };
  const selectedRegistration = selectedEventId ? registrationMap.get(selectedEventId) : null;
  const eventName = normalizeEventTitle(eventDetail?.eventName, eventDetail || {}) || "이벤트를 선택해 주세요";
  const canEnter = statusMeta.canEnter && selectedRegistration;

  const selectedLabel = selectedEventId
    ? (eventNameById[selectedEventId] || `이벤트 #${selectedEventId}`)
    : registrations.length === 0 ? "승인완료된 이벤트가 없습니다" : "이벤트를 선택하세요";

  const handleSendSMS = async () => {
    if (!qrInfo || !eventDetail) return;
    const smsMessage = `[${eventName}]\nQR 번호: QR-${qrInfo.qrId}\n행사일: ${formatDateRange(eventDetail.startAt, eventDetail.endAt)}\n장소: ${eventDetail.location || "-"}\n상태: ${statusMeta.label}`;
    setSmsSending(true); setError("");
    try {
      await axiosInstance.post("/api/qr/me/sms-test", { eventId: selectedEventId, phone: "LOCAL-TEST", message: smsMessage });
      setSmsSent(true); setTimeout(() => setSmsSent(false), 3000);
    } catch (e) {
      setError(translateError(e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || ""));
    }
    finally { setSmsSending(false); }
  };

  const handleDownload = async () => {
    if (!selectedEventId) return;
    setDownloading(true); setError("");
    try {
      const response = await axiosInstance.get("/api/qr/me/download", { params: { eventId: selectedEventId }, responseType: "blob" });
      const filename = getDownloadFilename(response?.headers?.["content-disposition"], `qr-${qrInfo?.qrId ?? "code"}.png`);
      const objectUrl = URL.createObjectURL(response.data);
      const a = document.createElement("a"); a.href = objectUrl; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (e) {
      setError(translateError(e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || ""));
    }
    finally { setDownloading(false); }
  };

  const notices = [
    "QR 코드는 행사 시작 1시간 전부터 활성화됩니다.",
    "이벤트별로 1인 1QR 정책이 적용됩니다.",
    "행사 종료 후 QR은 자동 만료됩니다.",
    "문제 발생 시 운영팀에 문의해 주세요.",
  ];

  return (
    <div className="qr-page-bg">
      <style>{css}</style>
      <div className="qr-page-content">
        <PageHeader title="QR 체크인" icon={<QrCode size={40} strokeWidth={1.8} style={{ color: "#4F6AFF" }} />} subtitle={SUBTITLE_MAP[currentPath]} categories={SERVICE_CATEGORIES} />

        <div className="qr-root">
          <main className="qr-container">
          {loading ? (
            <PageLoading />
          ) : (<>
          {/* ── Filter Bar ── */}
          <div className="qr-filter-bar">
            <span className="qr-filter-label">행사 선택</span>
            <div className="qr-dropdown-wrap" ref={ddRef}>
              <button
                type="button"
                className={`qr-dropdown-btn${ddOpen ? " open" : ""}`}
                onClick={() => { if (registrations.length > 0) setDdOpen((v) => !v); }}
                disabled={loading || registrations.length === 0}
              >
                {selectedEventId
                  ? (eventNameById[selectedEventId] || `이벤트 #${selectedEventId}`)
                  : <span className="placeholder">{registrations.length === 0 ? "승인완료된 이벤트가 없습니다" : "이벤트를 선택하세요"}</span>
                }
              </button>
              <div className={`qr-dropdown-arrow${ddOpen ? " open" : ""}`}>
                <ChevronDown size={18} />
              </div>
              {ddOpen && registrations.length > 0 && (
                <div className="qr-dropdown-list">
                  {registrations.map((item) => {
                    const name = eventNameById[item.eventId] || `이벤트 #${item.eventId}`;
                    const reg = registrationMap.get(item.eventId);
                    const statusText = reg ? formatRegistrationStatus(reg.status) : "";
                    return (
                      <div
                        key={item.applyId ?? item.eventId}
                        className={`qr-dropdown-item${item.eventId === selectedEventId ? " selected" : ""}`}
                        onClick={() => { setSelectedEventId(item.eventId); setDdOpen(false); }}
                      >
                        <div className="qr-dd-icon">
                          <Calendar size={16} />
                        </div>
                        <div className="qr-dd-text">
                          <div className="qr-dd-title">{name}</div>
                          <div className="qr-dd-desc">{statusText}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <button className="qr-btn-refresh" onClick={() => loadQr(selectedEventId)} disabled={!selectedEventId || loadingQr}>
              <RefreshCw size={14} /> {loadingQr ? "조회 중..." : "QR 조회"}
            </button>
          </div>

          {/* ── Ticket Card ── */}
          <div className="qr-ticket-wrap">
            <div className={`qr-ticket${expired ? " expired" : ""}`}>
              {expired && (
                <div className="qr-expired-overlay">
                  <div className="qr-expired-text">QR 코드가 만료되었습니다</div>
                  <button className="qr-expired-refresh" onClick={() => loadQr(selectedEventId)}>
                    <RefreshCw size={15} /> 새로고침
                  </button>
                </div>
              )}
              <PunchHoles side="left" />
              <PunchHoles side="right" />

              {/* Left: QR */}
              <div className="qr-ticket-left">
                <div className="qr-left-title">입장을 위한 QR 코드</div>
                <div className="qr-left-desc">
                  이용하려는 시설에 QR 코드로 체크인 하거나<br />
                  명부에 전화번호 대신 안심번호를 기재하세요.
                </div>

                <div className="qr-box">
                  {qrInfo?.originalUrl && useImage ? (
                    <img className="qr-img" src={qrInfo.originalUrl} alt="QR 코드" onError={() => setUseImage(false)} />
                  ) : (
                    <svg className="qr-svg" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                      {QR_MATRIX.map((row, ri) =>
                        row.map((cell, ci) =>
                          cell === 1 ? <rect key={`${ri}-${ci}`} x={ci} y={ri} width="1" height="1" fill="#111827" rx="0.08" /> : null
                        )
                      )}
                    </svg>
                  )}
                </div>

                <div className="qr-safety-box">
                  <span className="qr-safety-label">개인안심번호</span>
                  <span className="qr-safety-number">{qrInfo?.qrId ? `QR-${qrInfo.qrId}` : "QR-"}</span>
                </div>

                <div className="qr-timer">
                  <button
                    type="button"
                    className={`qr-refresh-btn${loadingQr ? " spinning" : ""}`}
                    onClick={() => { loadQr(selectedEventId); }}
                    title="새로고침"
                  >
                    <RefreshCw size={16} className="refresh-icon" />
                  </button>
                  <div className={`qr-timer-text${countdown <= 15 ? " danger" : countdown <= 45 ? " warning" : ""}`}>
                    <strong>{countdown}</strong>초 후 자동 새로고침
                  </div>
                </div>

                <button className="qr-btn-enlarge" onClick={() => setShowEnlarge(true)}>
                  <Maximize2 size={14} /> 크게보기
                </button>
              </div>

              {/* Right: Info */}
              <div className="qr-ticket-right">
                <div className="qr-ticket-header">
                  <div className="qr-ticket-title">입장 티켓</div>
                  <span className="qr-ticket-badge" style={{ color: statusMeta.color, background: statusMeta.bg }}>
                    <CheckCircle2 size={14} /> {statusMeta.label}
                  </span>
                </div>

                <div className="qr-info-grid">
                  <div className="qr-info-item">
                    <div className="qr-info-label"><Calendar size={11} /> 행사 시작</div>
                    <div className={`qr-info-value${!eventDetail?.startAt ? " placeholder" : ""}`}>
                      {eventDetail?.startAt ? formatDateTime(eventDetail.startAt) : "데이터 없음"}
                    </div>
                  </div>
                  <div className="qr-info-item">
                    <div className="qr-info-label"><Calendar size={11} /> 행사 종료</div>
                    <div className={`qr-info-value${!eventDetail?.endAt ? " placeholder" : ""}`}>
                      {eventDetail?.endAt ? formatDateTime(eventDetail.endAt) : "데이터 없음"}
                    </div>
                  </div>
                  <div className="qr-info-item">
                    <div className="qr-info-label"><MapPin size={11} /> 장소</div>
                    <div className={`qr-info-value${!eventDetail?.location ? " placeholder" : ""}`}>
                      {eventDetail?.location || "데이터 없음"}
                    </div>
                  </div>
                  <div className="qr-info-item">
                    <div className="qr-info-label"><Clock size={11} /> 활성 시작</div>
                    <div className={`qr-info-value mono${!qrInfo?.activeFrom ? " placeholder" : ""}`}>
                      {qrInfo?.activeFrom ? formatDateTime(qrInfo.activeFrom) : "데이터 없음"}
                    </div>
                  </div>
                  <div className="qr-info-item">
                    <div className="qr-info-label"><ShieldCheck size={11} /> 신청 상태</div>
                    <div className="qr-info-value">
                      {selectedRegistration ? formatRegistrationStatus(selectedRegistration.status) : "-"}
                    </div>
                  </div>
                  <div className="qr-info-item">
                    <div className="qr-info-label"><Clock size={11} /> 만료 시각</div>
                    <div className={`qr-info-value mono${!qrInfo?.expiredAt ? " placeholder" : ""}`}>
                      {qrInfo?.expiredAt ? formatDateTime(qrInfo.expiredAt) : "데이터 없음"}
                    </div>
                  </div>
                </div>

                {/* ── Admission Card ── */}
                {canEnter ? (
                  <div className="qr-admission-card">
                    <div className="qr-admission-top">
                      <div className="qr-admission-icon">
                        <Zap size={20} color="#fff" />
                      </div>
                      <div className="qr-admission-title">입장 가능</div>
                    </div>
                    <div className="qr-admission-body">
                      <strong>{eventName}</strong> 행사에 입장할 수 있습니다.<br />
                      신청일: {formatDateTime(selectedRegistration.appliedAt)}
                    </div>
                  </div>
                ) : (
                  <div className="qr-noadmit-card">
                    <div className="qr-noadmit-icon">
                      <Ticket size={18} color="#bbb" />
                    </div>
                    <div>
                      <div className="qr-noadmit-text">입장 대기 중</div>
                      <div className="qr-noadmit-sub">QR 코드가 활성화되면 입장할 수 있습니다.</div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="qr-error-banner">
                    <Info size={16} color="#991b1b" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="qr-action-row">
                  <button className="qr-action-btn qr-action-outline" onClick={handleSendSMS} disabled={!qrInfo || smsSending}>
                    <MessageSquare size={15} />
                    {smsSending ? "요청 중..." : smsSent ? "발송됨" : "문자 받기"}
                  </button>
                  <button className="qr-action-btn qr-action-primary" onClick={handleDownload} disabled={!selectedEventId || downloading}>
                    <Download size={15} />
                    {downloading ? "저장 중..." : "이미지 저장"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Notice ── */}
          <div className="qr-notice">
            <div className="qr-notice-header">
              <div className="qr-notice-icon">
                <Info size={18} color="#3b6df5" />
              </div>
              <div className="qr-notice-title">안내사항</div>
            </div>
            <ul className="qr-notice-list">
              {notices.map((n, i) => (
                <li key={i} className="qr-notice-item">
                  <div className="qr-notice-bullet" />
                  {n}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Enlarge Modal ── */}
          {showEnlarge && (
            <div className="qr-modal-overlay" onClick={() => setShowEnlarge(false)}>
              <div className="qr-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="qr-modal-title">입장을 위한 QR 코드</div>
                <div className="qr-modal-desc">시설 입구에서 아래 QR을 스캔해 주세요</div>

                <div className="qr-modal-qr">
                  {qrInfo?.originalUrl && useImage ? (
                    <img className="qr-img" src={qrInfo.originalUrl} alt="QR 코드" onError={() => setUseImage(false)} />
                  ) : (
                    <svg className="qr-svg" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                      {QR_MATRIX.map((row, ri) =>
                        row.map((cell, ci) =>
                          cell === 1 ? <rect key={`${ri}-${ci}`} x={ci} y={ri} width="1" height="1" fill="#111827" rx="0.08" /> : null
                        )
                      )}
                    </svg>
                  )}
                </div>

                <div className="qr-modal-safety">
                  <span className="qr-safety-label">개인안심번호</span>
                  <span className="qr-safety-number">{qrInfo?.qrId ? `QR-${qrInfo.qrId}` : "QR-"}</span>
                </div>

                <div className="qr-modal-timer">
                  <button
                    type="button"
                    className={`qr-refresh-btn${loadingQr ? " spinning" : ""}`}
                    onClick={() => { loadQr(selectedEventId); }}
                    title="새로고침"
                  >
                    <RefreshCw size={16} className="refresh-icon" />
                  </button>
                  <span><strong style={{ fontWeight: 800, color: "#3b6df5", fontSize: 14 }}>{countdown}</strong>초 후 자동 새로고침</span>
                </div>

                <button className="qr-modal-close" onClick={() => setShowEnlarge(false)}>닫기</button>
              </div>
            </div>
          )}
          </>)}
          </main>
        </div>
      </div>
    </div>
  );
}
