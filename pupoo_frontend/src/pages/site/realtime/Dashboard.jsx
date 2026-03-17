import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import RealtimeEventSelector from "./RealtimeEventSelector";
import {
  TrendingUp,
  Radio,
  Activity,
  BarChart2,
  RefreshCw,
  MapPin,
  CalendarDays,
} from "lucide-react";
import {
  useRefresh,
  useStaggerIn,
  useAutoRefresh,
  SHARED_ANIM_STYLES,
} from "./useRealtimeAnimations";
import { axiosInstance } from "../../../app/http/axiosInstance";
import { eventApi } from "../../../app/http/eventApi";
import { programApi } from "../../../app/http/programApi";
import { aiApi } from "../../../app/http/aiApi";
import {
  formatKoreanTime,
  normalizePrediction,
} from "./aiCongestionViewModel";

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .rt-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .rt-root *, .rt-root *::before, .rt-root *::after { box-sizing: border-box; font-family: inherit; }
  .rt-container { max-width: 1400px; margin: 0 auto; padding: 32px 25px 64px; }
  .rt-container.with-event { padding-top: 92px; }
  .rt-container.selector-mode { padding-top: 104px; }
  .rt-page-shell { max-width: 1120px; margin: 0 auto; }

  .rt-live-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; background: #fff0f0; border: 1px solid #fecaca;
    border-radius: 100px; font-size: 11px; font-weight: 700; color: #ef4444;
    margin-bottom: 0;
    line-height: 1;
  }
  .rt-live-badge.planned {
    background: #eff6ff;
    border-color: #bfdbfe;
    color: #2563eb;
    justify-content: center;
    gap: 0;
  }
  .rt-live-badge.planned .rt-live-dot.placeholder {
    display: none;
  }
  .rt-live-badge.ended {
    background: #f3f4f6;
    border-color: #e5e7eb;
    color: #6b7280;
    justify-content: center;
    gap: 0;
  }
  .rt-live-badge.ended .rt-live-dot.placeholder {
    display: none;
  }
  .rt-live-badge.cancelled {
    background: #fef2f2;
    border-color: #fecaca;
    color: #b91c1c;
  }
  .rt-live-dot {
    width: 7px; height: 7px; border-radius: 50%; background: currentColor;
    animation: rt-pulse 1.4s ease-in-out infinite;
  }
  .rt-live-dot.placeholder {
    visibility: hidden;
    animation: none;
  }
  @keyframes rt-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .rt-live-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 10px;
    margin-bottom: 10px;
    gap: 16px;
  }
  .rt-live-header-left {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .rt-live-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    font-size: 13px;
    color: #6b7280;
  }
  .rt-event-name {
    font-size: 28px;
    font-weight: 900;
    color: #111827;
    line-height: 1.05;
    letter-spacing: -0.03em;
  }
  .rt-event-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    font-size: 13px;
    color: #6b7280;
    margin-top: 4px;
  }
  .rt-event-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .rt-live-header-right {
    display: flex; align-items: center; gap: 12px;
    flex-shrink: 0;
  }
  .rt-timestamp {
    font-size: 12px; color: #9ca3af; font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
  .rt-refresh-btn {
    width: 34px; height: 34px; border-radius: 8px;
    border: 1px solid #e2e8f0; background: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #6b7280;
    transition: all 0.15s;
  }
  .rt-refresh-btn:hover { border-color: #1a4fd6; color: #1a4fd6; background: #f5f8ff; }
  .rt-refresh-btn:active { transform: scale(0.93); }

  .rt-hero {
    border: 1px solid #dbe5f5;
    border-radius: 16px;
    padding: 22px 24px;
    margin-bottom: 16px;
    background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #60a5fa 100%);
    color: #fff;
  }
  .rt-hero-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }
  .rt-hero-main {
    min-width: 0;
    flex: 1 1 auto;
  }
  .rt-hero-title {
    margin: 0;
    font-size: 30px;
    line-height: 1.04;
    letter-spacing: -0.03em;
    font-weight: 900;
  }
  .rt-hero-meta {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.92);
  }
  .rt-hero-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .rt-hero-summary {
    margin-top: 12px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.96);
    font-weight: 600;
    line-height: 1.4;
  }
  .rt-hero-note {
    margin-top: 7px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.88);
    font-weight: 600;
    line-height: 1.35;
  }
  .rt-hero-kpi-grid {
    margin-top: 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    width: min(640px, 100%);
    margin-left: auto;
    flex-shrink: 0;
  }
  .rt-hero-kpi {
    border: 1px solid rgba(191, 219, 254, 0.45);
    border-radius: 12px;
    background: rgba(147, 197, 253, 0.2);
    backdrop-filter: blur(1px);
    padding: 10px 12px;
  }
  .rt-hero-kpi-label {
    font-size: 11px;
    color: rgba(239, 246, 255, 0.92);
    font-weight: 700;
  }
  .rt-hero-kpi-value {
    margin-top: 6px;
    font-size: 28px;
    line-height: 1;
    font-weight: 900;
    color: #fff;
    letter-spacing: -0.02em;
    display: inline-flex;
    align-items: baseline;
    gap: 3px;
  }
  .rt-hero-kpi-value.text {
    font-size: 24px;
  }
  .rt-hero-kpi-unit {
    font-size: 13px;
    color: rgba(239, 246, 255, 0.95);
    font-weight: 700;
  }
  .rt-hero-kpi-sub {
    margin-top: 6px;
    font-size: 11px;
    color: rgba(239, 246, 255, 0.88);
    line-height: 1.35;
    font-weight: 600;
  }

  .rt-user-stat-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 8px;
  }
  .rt-user-stat {
    border: 1px solid #e6ebf2;
    border-radius: 12px;
    background: #fff;
    padding: 14px 14px 13px;
  }
  .rt-user-stat-label {
    font-size: 12px;
    color: #6b7280;
    font-weight: 600;
    margin-bottom: 7px;
  }
  .rt-user-stat-value {
    font-size: 26px;
    line-height: 1;
    font-weight: 900;
    color: #111827;
    letter-spacing: -0.02em;
  }
  .rt-user-stat-unit {
    margin-left: 3px;
    font-size: 14px;
    color: #4b5563;
    font-weight: 700;
  }
  .rt-user-stat-sub {
    margin-top: 6px;
    font-size: 12px;
    color: #6b7280;
    line-height: 1.3;
  }
  .rt-user-stat-badge {
    margin-top: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 800;
    border: 1px solid #e5e7eb;
  }
  .rt-section-lead {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 12px;
    line-height: 1.4;
  }
  .rt-visitor-note {
    margin-top: 8px;
    font-size: 12px;
    color: #4b5563;
    line-height: 1.45;
    font-weight: 600;
  }
  .rt-pet-hints {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .rt-chart-guide {
    margin-top: 8px;
    color: #6b7280;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.45;
  }

  .rt-prediction-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .rt-prediction-meta-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .rt-prediction-meta-strip--header {
    justify-content: flex-end;
    gap: 6px;
  }
  .rt-prediction-meta-pill {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border-radius: 999px;
    border: 1px solid #e5e7eb;
    background: #fff;
    color: #6b7280;
    font-size: 11px;
    font-weight: 700;
  }
  .rt-prediction-kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
  .rt-prediction-kpi {
    border: 1px solid #e5e7eb;
    border-radius: 11px;
    background: #fff;
    padding: 12px 12px 11px;
    position: relative;
  }
  .rt-prediction-kpi-label {
    font-size: 11px;
    color: #6b7280;
    font-weight: 700;
    min-height: 18px;
    padding-right: 96px;
    display: flex;
    align-items: center;
  }
  .rt-prediction-kpi-value {
    margin-top: 7px;
    font-size: 26px;
    line-height: 1;
    color: #111827;
    font-weight: 900;
    letter-spacing: -0.02em;
  }
  .rt-prediction-kpi-value.with-day {
    font-size: 26px;
    line-height: 1;
    letter-spacing: -0.02em;
    white-space: normal;
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }
  .rt-prediction-kpi-score {
    display: inline-flex;
    align-items: baseline;
  }
  .rt-prediction-kpi-day {
    font-size: 13px;
    line-height: 1.2;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 0;
    margin-bottom: 2px;
  }
  .rt-prediction-kpi-unit {
    margin-left: 3px;
    font-size: 13px;
    color: #4b5563;
    font-weight: 700;
  }
  .rt-prediction-kpi-desc {
    margin-top: 7px;
    font-size: 12px;
    color: #4b5563;
    line-height: 1.35;
    font-weight: 600;
  }
  .rt-prediction-kpi-badge {
    margin-top: 0;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 3px 9px;
    font-size: 11px;
    font-weight: 800;
    border: 1px solid #e5e7eb;
    position: absolute;
    top: 12px;
    right: 12px;
    white-space: nowrap;
  }
  .rt-prediction-bottom {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    align-items: stretch;
  }
  .rt-prediction-chart-card {
    grid-column: span 2;
    border: 1px solid #e5e7eb;
    border-radius: 11px;
    background: #f8fafc;
    padding: 12px;
  }
  .rt-prediction-chart-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
  }
  .rt-prediction-chart-title {
    font-size: 13px;
    font-weight: 800;
    color: #111827;
  }
  .rt-prediction-chart-sub {
    font-size: 11px;
    color: #6b7280;
    font-weight: 600;
  }
  .rt-prediction-chart {
    min-width: 0;
  }
  .rt-prediction-near-card {
    grid-column: span 1;
    border: 1px solid #e5e7eb;
    border-radius: 11px;
    background: #fff;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .rt-prediction-alert-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-bottom: 10px;
    border-bottom: 1px solid #f1f3f5;
  }
  .rt-prediction-alert-title {
    font-size: 13px;
    color: #111827;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .rt-prediction-alert-chip-list {
    margin-top: 0;
    margin-bottom: 8px;
  }
  .rt-prediction-alert-chip-list .rt-chip {
    font-size: 11px;
  }
  .rt-prediction-alert-timeline .rt-timeline-item {
    padding: 8px 0;
  }
  .rt-prediction-alert-timeline .rt-timeline-time {
    min-width: 40px;
  }
  .rt-prediction-alert-timeline .rt-timeline-text {
    font-size: 12px;
  }
  .rt-prediction-near-title {
    font-size: 13px;
    color: #111827;
    font-weight: 800;
  }
  .rt-prediction-near-sub {
    font-size: 11px;
    color: #6b7280;
    font-weight: 600;
    line-height: 1.35;
  }
  .rt-prediction-empty {
    min-height: 74px;
    border: 1px dashed #dbe2ea;
    border-radius: 9px;
    background: #fafcff;
    color: #6b7280;
    font-size: 12px;
    line-height: 1.4;
    padding: 10px;
    display: flex;
    align-items: center;
  }
  .rt-prediction-chip-list {
    margin-top: 0;
    gap: 6px;
  }
  .rt-chip-list {
    margin-top: 12px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .rt-chip {
    border-radius: 999px;
    border: 1px solid #dbe2ea;
    background: #fff;
    color: #374151;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 700;
  }
  .rt-heat-legend {
    margin-top: 12px;
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }
  .rt-heat-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .rt-heat-legend-text {
    font-size: 11px;
    color: #9ca3af;
  }
  .rt-heat-legend-swatch {
    width: 22px;
    height: 0;
    border-top: 2px solid #93c5fd;
    border-radius: 999px;
  }
  .rt-heat-legend-swatch.actual {
    border-top-color: #2563eb;
    border-top-width: 2.2px;
    opacity: 0.95;
  }
  .rt-heat-legend-swatch.predicted {
    border-top-color: #2563eb;
    border-top-width: 2.2px;
    border-top-style: dashed;
    opacity: 0.95;
  }

  .rt-program-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .rt-program-grid-top3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .rt-program-grid-top3 .rt-program-card {
    padding: 12px;
  }
  .rt-program-grid-top3 .rt-program-name {
    font-size: 14px;
  }
  .rt-program-grid-top3 .rt-program-metric {
    padding: 6px 7px;
  }
  .rt-program-grid-top3 .rt-program-metric-value {
    font-size: 14px;
  }
  .rt-ready-program-scroll {
    max-height: 430px;
    overflow-y: auto;
    padding-right: 4px;
    align-content: start;
  }
  .rt-ready-program-scroll::-webkit-scrollbar {
    width: 8px;
  }
  .rt-ready-program-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 999px;
  }
  .rt-ready-program-scroll::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 999px;
  }
  .rt-program-card {
    border: 1px solid #dfe8f5;
    border-radius: 12px;
    background: #fff;
    padding: 14px;
    box-shadow: 0 3px 12px rgba(17, 24, 39, 0.04);
  }
  .rt-program-card-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }
  .rt-program-name {
    margin: 0;
    font-size: 15px;
    line-height: 1.25;
    color: #111827;
    font-weight: 800;
  }
  .rt-program-time {
    margin-top: 6px;
    font-size: 12px;
    color: #6b7280;
  }
  .rt-program-metric-grid {
    margin-top: 10px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .rt-program-metric {
    border: 1px solid #edf2f7;
    background: #f8fafc;
    border-radius: 9px;
    padding: 7px 8px;
  }
  .rt-program-metric-label {
    font-size: 11px;
    color: #6b7280;
  }
  .rt-program-metric-value {
    margin-top: 4px;
    font-size: 15px;
    color: #111827;
    font-weight: 900;
    line-height: 1;
  }
  .rt-program-guide {
    margin-top: 10px;
    font-size: 12px;
    color: #1f2937;
    font-weight: 700;
  }
  .rt-mini-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 60px;
    padding: 3px 9px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    border: 1px solid #e5e7eb;
  }

  .rt-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
  .rt-stat-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px;
    padding: 22px 22px 20px; position: relative; overflow: hidden;
    transition: box-shadow 0.2s;
  }
  .rt-stat-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); }
  .rt-stat-icon {
    width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; margin-bottom: 14px;
  }
  .rt-stat-label { font-size: 12.5px; color: #6b7280; font-weight: 500; margin-bottom: 6px; }
  .rt-stat-value { font-size: 26px; font-weight: 800; color: #111827; line-height: 1; }
  .rt-stat-suffix { font-size: 18px; margin-left: 2px; }
  .rt-stat-sub { font-size: 12px; color: #9ca3af; margin-top: 6px; display: flex; align-items: center; gap: 4px; }
  .rt-stat-up { color: #10b981; }
  .rt-stat-down { color: #ef4444; }
  .rt-stat-bg {
    position: absolute; right: -10px; bottom: -10px;
    width: 70px; height: 70px; border-radius: 50%; opacity: 0.06;
  }

  .rt-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 24px 28px; margin-bottom: 16px; }
  .rt-card-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #f1f3f5;
  }
  .rt-card-title {
    font-size: 15px; font-weight: 700; color: #111827;
    display: flex; align-items: center; gap: 8px; margin: 0;
  }
  .rt-card-title-icon {
    width: 24px; height: 24px; border-radius: 6px;
    background: #eff4ff; display: flex; align-items: center; justify-content: center;
  }
  .rt-card-tag { font-size: 11px; font-weight: 600; color: #6b7280; background: #f3f4f6; padding: 3px 10px; border-radius: 100px; }
  .rt-ended-sort-group {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .rt-ended-sort-btn {
    height: 28px;
    border-radius: 999px;
    border: 1px solid #dbe2ea;
    background: #fff;
    color: #475569;
    font-size: 12px;
    font-weight: 700;
    padding: 0 12px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .rt-ended-sort-btn:hover {
    border-color: #93c5fd;
    color: #1d4ed8;
    background: #eff6ff;
  }
  .rt-ended-sort-btn.active {
    border-color: #60a5fa;
    color: #1d4ed8;
    background: #dbeafe;
  }
  .rt-card-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .rt-date-input {
    height: 28px;
    border: 1px solid #dbe2ea;
    border-radius: 7px;
    padding: 0 8px;
    font-size: 12px;
    color: #374151;
    background: #fff;
  }

  .rt-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

  .rt-progress-wrap { margin-bottom: 14px; }
  .rt-progress-wrap:last-child { margin-bottom: 0; }
  .rt-progress-label { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 7px; gap: 12px; }
  .rt-progress-label-name { font-weight: 600; color: #374151; }
  .rt-progress-label-val { color: #6b7280; text-align: right; }
  .rt-progress-track { height: 8px; background: #f1f3f5; border-radius: 100px; overflow: hidden; }
  .rt-progress-fill { height: 100%; border-radius: 100px; }

  .rt-opinion-list { display: flex; flex-direction: column; gap: 8px; }
  .rt-opinion-item { display: flex; align-items: center; gap: 12px; padding: 13px 16px; border-radius: 10px; border: 1px solid #eceef3; }
  .rt-opinion-bar-wrap { flex: 1; }
  .rt-opinion-label { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 5px; }
  .rt-opinion-track { height: 6px; background: #f1f3f6; border-radius: 100px; overflow: hidden; }
  .rt-opinion-fill { height: 100%; border-radius: 100px; }
  .rt-opinion-val { font-size: 14px; font-weight: 800; color: #1a1d24; min-width: 36px; text-align: right; }

  .rt-timeline { display: flex; flex-direction: column; gap: 0; }
  .rt-timeline-item { display: flex; gap: 14px; padding: 12px 0; border-bottom: 1px solid #f9fafb; }
  .rt-timeline-item:last-child { border-bottom: none; }
  .rt-timeline-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
  .rt-timeline-time { font-size: 11.5px; color: #9ca3af; min-width: 44px; padding-top: 1px; }
  .rt-timeline-text { font-size: 13px; color: #374151; line-height: 1.5; }

  .rt-hourly-chart {
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 8px;
    align-items: stretch;
  }
  .rt-hourly-y-axis {
    position: relative;
    height: 184px;
    color: #6b7280;
    font-size: 9px;
    font-weight: 700;
    line-height: 1;
  }
  .rt-hourly-y-label {
    position: absolute;
    right: 0;
    transform: translateY(-50%);
    text-align: right;
  }
  .rt-hourly-plot-wrap {
    min-width: 0;
  }
  .rt-hourly-svg-wrap {
    position: relative;
    height: 184px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #f8fafc;
    overflow: hidden;
  }
  .rt-hourly-now-label {
    position: absolute;
    bottom: 4px;
    transform: translateX(-50%);
    color: #1d4ed8;
    font-size: 9px;
    font-weight: 700;
    line-height: 1;
    pointer-events: none;
    white-space: nowrap;
    z-index: 2;
  }
  .rt-hourly-now-label.edge-start {
    left: 0 !important;
    transform: none;
  }
  .rt-hourly-now-label.edge-end {
    transform: translateX(-100%);
  }
  .rt-hourly-svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  .rt-hourly-zone.relaxed {
    fill: rgba(22, 163, 74, 0.022);
  }
  .rt-hourly-zone.moderate {
    fill: rgba(250, 204, 21, 0.02);
  }
  .rt-hourly-zone.busy {
    fill: rgba(249, 115, 22, 0.022);
  }
  .rt-hourly-grid-line {
    stroke: #cbd5e1;
    stroke-width: 0.4;
    opacity: 0.36;
  }
  .rt-hourly-grid-line.dashed {
    stroke-dasharray: 2 2;
    opacity: 0.28;
  }
  .rt-hourly-area.past {
    fill: #9ca3af;
    opacity: 0.045;
  }
  .rt-hourly-area.future {
    fill: #93c5fd;
    opacity: 0.02;
  }
  .rt-hourly-line {
    stroke-width: 2.2;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }
  .rt-hourly-line.actual {
    stroke: #2563eb;
    opacity: 0.98;
  }
  .rt-hourly-line.predicted {
    stroke: #2563eb;
    stroke-dasharray: 3.8 2.8;
    opacity: 0.98;
  }
  .rt-hourly-current-line {
    stroke: #1d4ed8;
    stroke-width: 0.72;
    stroke-dasharray: 2.5 2.5;
    opacity: 0.44;
    vector-effect: non-scaling-stroke;
  }
  .rt-hourly-x-axis {
    margin-top: 9px;
    position: relative;
    height: 20px;
  }
  .rt-hourly-x-label {
    position: absolute;
    top: 0;
    transform: translateX(-50%);
    text-align: center;
    font-size: 10px;
    line-height: 1.1;
    color: #94a3b8;
    font-weight: 600;
    white-space: nowrap;
  }
  .rt-hourly-x-label.edge-start {
    left: 0 !important;
    transform: none;
    text-align: left;
  }
  .rt-hourly-x-label.edge-end {
    transform: translateX(-100%);
    text-align: right;
  }
  .rt-calendar-control {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #6b7280;
    font-size: 12px;
    font-weight: 700;
  }

  .rt-empty {
    text-align: center;
    padding: 40px 20px;
    color: #9ca3af;
    font-size: 13px;
  }
  .rt-empty-strong {
    display: block;
    font-size: 14px;
    font-weight: 700;
    color: #374151;
    margin-bottom: 4px;
  }
  .rt-error {
    color: #b91c1c;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 16px;
    font-size: 13px;
    font-weight: 600;
  }

  @media (max-width: 900px) {
    .rt-live-header {
      flex-direction: column;
      align-items: flex-start;
    }
    .rt-ended-sort-group {
      width: 100%;
      justify-content: flex-start;
    }
    .rt-hero-top {
      flex-direction: column;
      align-items: flex-start;
    }
    .rt-hero-kpi-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      width: 100%;
      margin-left: 0;
      margin-top: 14px;
    }
    .rt-user-stat-grid {
      grid-template-columns: 1fr 1fr;
    }
    .rt-prediction-kpi-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .rt-prediction-bottom {
      grid-template-columns: 1fr;
    }
    .rt-prediction-chart-card,
    .rt-prediction-near-card {
      grid-column: span 1;
    }
    .rt-program-grid {
      grid-template-columns: 1fr;
    }
    .rt-ready-program-scroll {
      max-height: 1260px;
    }
    .rt-stat-grid { grid-template-columns: repeat(2, 1fr); }
    .rt-two-col { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .rt-container { padding: 20px 16px 48px; }
    .rt-container.with-event { padding-top: 80px; }
    .rt-container.selector-mode { padding-top: 88px; }
    .rt-hero-kpi-grid {
      grid-template-columns: 1fr;
      width: 100%;
      margin-left: 0;
      margin-top: 14px;
    }
    .rt-hero-kpi-value {
      font-size: 25px;
    }
    .rt-hero-kpi-value.text {
      font-size: 22px;
    }
    .rt-user-stat-grid {
      grid-template-columns: 1fr;
    }
    .rt-program-metric-grid {
      grid-template-columns: 1fr;
    }
    .rt-hero-title { font-size: 24px; }
    .rt-stat-grid { grid-template-columns: repeat(2, 1fr); }
    .rt-card { padding: 22px 18px; }
    .rt-event-name { font-size: 22px; }
    .rt-prediction-kpi-grid {
      grid-template-columns: 1fr;
    }
    .rt-prediction-kpi-value {
      font-size: 23px;
    }
    .rt-date-input { width: 100%; min-width: 130px; }
  }
`;

export const SERVICE_CATEGORIES = [
  { label: "통합 현황", path: "/realtime/dashboard" },
  { label: "대기 현황", path: "/realtime/waitingstatus" },
  { label: "체크인 현황", path: "/realtime/checkinstatus" },
  { label: "투표 현황", path: "/realtime/votestatus" },
];

export const SUBTITLE_MAP = {
  "/realtime/dashboard": "행사 전체 현황을 실시간으로 모니터링합니다",
  "/realtime/waitingstatus": "대기열 현황을 실시간으로 확인합니다",
  "/realtime/checkinstatus": "참가자 체크인 현황을 실시간으로 확인합니다",
  "/realtime/votestatus": "진행 중인 투표의 실시간 결과를 확인합니다",
};

const FALLBACK_HOURS = Array.from({ length: 12 }, (_, index) => 10 + index);
const FULL_DAY_HOURS = Array.from({ length: 24 }, (_, index) => index);
const AI_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const PROGRAM_CONGESTION_FRESHNESS_MS = 30 * 60 * 1000;

const STATUS_BADGE = {
  ONGOING: { className: "", label: "LIVE", showDot: true },
  PLANNED: { className: "planned", label: "예정", showDot: false },
  ENDED: { className: "ended", label: "종료", showDot: false },
  CANCELLED: { className: "cancelled", label: "취소", showDot: false },
};

const ENDED_POPULAR_SORT_OPTIONS = [
  { key: "perHour", label: "시간당 방문자" },
  { key: "totalVisitors", label: "총 방문자" },
  { key: "avgWait", label: "평균 대기시간" },
];

const unwrapData = (response, fallback) => response?.data?.data ?? response?.data ?? fallback;

const toArray = (payload) =>
  Array.isArray(payload?.content)
    ? payload.content
    : Array.isArray(payload)
      ? payload
      : [];

const toValidDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toHour = (value) => {
  const date = toValidDate(value);
  return date ? date.getHours() : null;
};

const normalizeHour = (value) => ((Number(value) % 24) + 24) % 24;

const toDateKey = (value) => {
  const date = toValidDate(value);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const alignUpToFiveMinutes = (value) => {
  const date = toValidDate(value);
  if (!date) return null;
  const aligned = new Date(date);
  aligned.setSeconds(0, 0);
  const remainder = aligned.getMinutes() % 5;
  if (remainder !== 0) {
    aligned.setMinutes(aligned.getMinutes() + (5 - remainder));
  }
  return aligned;
};

const getMinPredictionStart = (offsetMinutes = 5) => {
  const base = new Date();
  base.setMinutes(base.getMinutes() + offsetMinutes);
  return alignUpToFiveMinutes(base);
};

const formatDateOptionLabel = (dateKey) => {
  if (!dateKey) return "";
  const date = toValidDate(`${dateKey}T00:00:00`);
  if (!date) return dateKey;
  return date.toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
};

const buildDateKeysFromRange = (startAt, endAt, maxDays = 60) => {
  const startDate = toValidDate(startAt);
  const endDate = toValidDate(endAt);
  if (!startDate || !endDate || endDate < startDate) return [];

  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const limit = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const keys = [];

  while (cursor <= limit && keys.length < maxDays) {
    keys.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
};

const isDateKeyInRange = (dateKey, startAt, endAt) => {
  if (!dateKey) return false;
  const clipped = clipRangeByDate(startAt, endAt, dateKey);
  return Boolean(clipped.startAt && clipped.endAt);
};

const buildOperationRangeByDate = (startAt, endAt, dateKey) => {
  if (!dateKey) {
    return {
      startAt: toValidDate(startAt),
      endAt: toValidDate(endAt),
    };
  }

  const clipped = clipRangeByDate(startAt, endAt, dateKey);
  if (!clipped.startAt || !clipped.endAt) return { startAt: null, endAt: null };

  const eventStart = toValidDate(startAt);
  const eventEnd = toValidDate(endAt);
  const baseDate = toValidDate(`${dateKey}T00:00:00`);
  if (!eventStart || !eventEnd || !baseDate) {
    return clipped;
  }

  const rangeStart = new Date(baseDate);
  rangeStart.setHours(eventStart.getHours(), 0, 0, 0);

  const rangeEnd = new Date(baseDate);
  rangeEnd.setHours(eventEnd.getHours(), 59, 59, 999);

  if (rangeEnd < rangeStart) {
    return clipped;
  }

  return {
    startAt: rangeStart,
    endAt: rangeEnd,
  };
};

const clipRangeByDate = (startAt, endAt, dateKey) => {
  const startDate = toValidDate(startAt);
  const endDate = toValidDate(endAt);
  const baseDate = toValidDate(`${dateKey}T00:00:00`);
  if (!startDate || !endDate || !baseDate || endDate < startDate) {
    return { startAt: null, endAt: null };
  }

  const dayStart = new Date(baseDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(baseDate);
  dayEnd.setHours(23, 59, 59, 999);

  if (endDate < dayStart || startDate > dayEnd) {
    return { startAt: null, endAt: null };
  }

  const clippedStart = startDate > dayStart ? startDate : dayStart;
  const clippedEnd = endDate < dayEnd ? endDate : dayEnd;
  return { startAt: clippedStart, endAt: clippedEnd };
};

const buildHourRange = (startAt, endAt) => {
  const startDate = toValidDate(startAt);
  const endDate = toValidDate(endAt);
  if (!startDate || !endDate || endDate < startDate) return [];

  const sameDay = startDate.toDateString() === endDate.toDateString();
  const startHour = startDate.getHours();
  const endHour = sameDay ? endDate.getHours() : 23;
  if (endHour < startHour) {
    const forward = Array.from({ length: 24 - startHour }, (_, index) =>
      normalizeHour(startHour + index),
    );
    const wrapped = Array.from({ length: endHour + 1 }, (_, index) =>
      normalizeHour(index),
    );
    return uniqueNormalizedHours([...forward, ...wrapped]);
  }

  return Array.from({ length: endHour - startHour + 1 }, (_, index) =>
    normalizeHour(startHour + index),
  );
};

const uniqueNormalizedHours = (hours) =>
  Array.from(new Set(hours.map((hour) => normalizeHour(hour)).filter(Number.isFinite))).sort(
    (a, b) => a - b,
  );

const buildAroundHourAxis = (centerHour, radius = 6) =>
  uniqueNormalizedHours(
    Array.from({ length: radius * 2 + 1 }, (_, index) =>
      normalizeHour(centerHour - radius + index),
    ),
  );

const ensureDenseHourAxis = (baseHours, { isToday = false, minPoints = 8 } = {}) => {
  const normalized = uniqueNormalizedHours(Array.isArray(baseHours) ? baseHours : []);
  if (normalized.length >= minPoints) return normalized;
  if (isToday) return buildAroundHourAxis(new Date().getHours(), 6);
  return [...FULL_DAY_HOURS];
};

const buildHourAxis = ({ hourlyRows, timeline, startAt, endAt, preferRange = false }) => {
  if (preferRange) {
    const range = buildHourRange(startAt, endAt);
    if (range.length > 0) return range;
  }

  const rowHours = uniqueNormalizedHours(
    toArray(hourlyRows)
      .map((row) => Number(row?.hour ?? row?.h))
      .filter(Number.isFinite),
  );
  if (rowHours.length > 0) return rowHours;

  const timelineHours = uniqueNormalizedHours(
    Array.isArray(timeline)
      ? timeline.map((point) => toHour(point?.time)).filter(Number.isFinite)
      : [],
  );
  if (timelineHours.length > 0) return timelineHours;

  const range = buildHourRange(startAt, endAt);
  if (range.length > 0) return range;

  return [...FALLBACK_HOURS];
};

const resolveAiDateKey = (eventDetail, preferredDateKey) => {
  const dateOptions = buildDateKeysFromRange(eventDetail?.startAt, eventDetail?.endAt);
  if (dateOptions.length === 0) {
    return "";
  }
  if (preferredDateKey && dateOptions.includes(preferredDateKey)) {
    return preferredDateKey;
  }

  const status = String(eventDetail?.status ?? "").toUpperCase();
  if (status === "PLANNED" || status === "PENDING" || status === "UPCOMING") {
    return "";
  }
  const todayKey = toDateKey(new Date());
  if (status === "ONGOING" && dateOptions.includes(todayKey)) {
    return todayKey;
  }
  if (status === "ENDED") {
    return dateOptions[dateOptions.length - 1];
  }
  return dateOptions[0];
};

const resolveAiRangeParams = (eventDetail, preferredDateKey) => {
  const selectedDateKey = resolveAiDateKey(eventDetail, preferredDateKey);
  if (selectedDateKey) {
    const operationRange = buildOperationRangeByDate(
      eventDetail?.startAt,
      eventDetail?.endAt,
      selectedDateKey,
    );
    if (operationRange.startAt && operationRange.endAt) {
      let from = operationRange.startAt;
      let to = operationRange.endAt;

      const status = String(eventDetail?.status ?? "").toUpperCase();
      const todayKey = toDateKey(new Date());
      if (status === "ONGOING" && selectedDateKey === todayKey) {
        const minPredictionStart = getMinPredictionStart(5);
        if (minPredictionStart && minPredictionStart > from) {
          from = minPredictionStart;
        }
      }
      if (from > to) {
        from = to;
      }

      return {
        from,
        to,
      };
    }
  }

  const fallbackStart = toValidDate(eventDetail?.startAt);
  const fallbackEnd = toValidDate(eventDetail?.endAt);
  if (fallbackStart && fallbackEnd && fallbackEnd >= fallbackStart) {
    return { from: fallbackStart, to: fallbackEnd };
  }
  return {};
};

const formatDateRange = (startAt, endAt) => {
  const start = startAt ? new Date(startAt) : null;
  const end = endAt ? new Date(endAt) : null;
  const validStart = start && !Number.isNaN(start.getTime()) ? start : null;
  const validEnd = end && !Number.isNaN(end.getTime()) ? end : null;

  if (!validStart && !validEnd) return "일정 정보 없음";
  if (validStart && validEnd) {
    return `${validStart.getFullYear()}.${String(validStart.getMonth() + 1).padStart(2, "0")}.${String(validStart.getDate()).padStart(2, "0")} ~ ${validEnd.getFullYear()}.${String(validEnd.getMonth() + 1).padStart(2, "0")}.${String(validEnd.getDate()).padStart(2, "0")}`;
  }
  const target = validStart || validEnd;
  return `${target.getFullYear()}.${String(target.getMonth() + 1).padStart(2, "0")}.${String(target.getDate()).padStart(2, "0")}`;
};

const formatShortDateKey = (value) => {
  if (typeof value !== "string") return "--.--";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${month}.${day}`;
};

const formatHourLabel = (hour) => {
  if (!Number.isFinite(hour)) return "--:--";
  return `${String(normalizeHour(hour)).padStart(2, "0")}:00`;
};

const formatTime = (value) => {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatTimestamp = (value) => {
  if (!value) return "--:--:--";
  return value.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const congestionLevelToPercent = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return clamp(Math.round(numeric * 20), 0, 100);
};

const getHeatColor = (pct) => {
  if (pct === 0) return "#f1f3f5";
  if (pct < 30) return "#dbeafe";
  if (pct < 60) return "#93c5fd";
  if (pct < 85) return "#3b82f6";
  return "#1d4ed8";
};

const getHeatTextColor = (pct) => {
  if (pct === 0) return "#9ca3af";
  if (pct < 60) return "#d97706";
  return "#f59e0b";
};

const getActivityColor = (pct) => {
  if (pct >= 80) return "#ef4444";
  if (pct >= 50) return "#f59e0b";
  if (pct > 0) return "#10b981";
  return "#9ca3af";
};

const safeNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const getFirstFiniteNumber = (...values) => {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return 0;
};

const getFirstDefinedFiniteNumber = (...values) => {
  for (const value of values) {
    if (value == null || value === "") continue;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return null;
};

const getFirstPositiveNumber = (...values) => {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }
  return getFirstFiniteNumber(...values);
};

const resolveProgramVisitorCount = (program) => Math.max(
  0,
  Math.round(
    getFirstPositiveNumber(
      program?.visitorCount,
      program?.visitCount,
      program?.checkinCount,
      program?.attendeeCount,
      program?.attendanceCount,
      program?.participantCount,
      program?.participants,
      program?.applyCount,
      program?.appliedCount,
      program?.totalApply,
      program?.totalApplyCount,
    ),
  ),
);

const resolveProgramParticipantCount = (program) => Math.max(
  0,
  Math.round(
    getFirstPositiveNumber(
      program?.participantCount,
      program?.participants,
      program?.applyCount,
      program?.appliedCount,
      program?.applyCnt,
      program?.totalApply,
      program?.totalApplyCount,
      program?.approvedRegistrationCount,
      program?.activeRegistrationCount,
      program?.registrationCount,
      program?.registeredCount,
    ),
  ),
);

const resolveProgramAverageWaitMin = (program) => {
  const resolved = getFirstDefinedFiniteNumber(
    program?.averageWaitMin,
    program?.avgWaitMin,
    program?.avgWaitingMinutes,
    program?.averageWaitingMinutes,
    program?.waitAvg,
    program?.waitAverage,
    program?.experienceWait?.avgWaitMin,
    program?.experienceWait?.averageWaitMin,
    program?.experienceWait?.waitMin,
  );
  if (!Number.isFinite(resolved)) return null;
  return Math.max(0, Math.round(resolved));
};

const safePercent = (value) => clamp(Math.round(Number(value) || 0), 0, 100);
const DAY_MS = 24 * 60 * 60 * 1000;

const estimateUpcomingCongestionPercent = (registrations, startAt, endAt) => {
  const totalRegistrations = Math.max(0, Number(registrations) || 0);
  if (totalRegistrations <= 0) return 0;

  const startDate = toValidDate(startAt);
  const endDate = toValidDate(endAt);
  let operationDays = 1;

  if (startDate && endDate && endDate >= startDate) {
    const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    operationDays = Math.max(1, Math.ceil((endDay.getTime() - startDay.getTime() + DAY_MS) / DAY_MS));
  }

  const registrationsPerDay = totalRegistrations / operationDays;
  const estimated = Math.round((registrationsPerDay / 300) * 100);
  return Math.max(5, Math.min(85, estimated));
};

const estimatePlannedBaseCongestion = ({
  registrationCount,
  dayCount,
  programCount,
}) => {
  const registrations = Math.max(0, safeNumber(registrationCount));
  const days = Math.max(1, safeNumber(dayCount, 1));
  const programs = Math.max(0, safeNumber(programCount));
  const registrationsPerDay = registrations / days;

  const registrationPressure = clamp((registrationsPerDay - 20) / 260, 0, 1);
  const programPressure = clamp((programs - 4) / 20, 0, 1);

  return safePercent(20 + (registrationPressure * 45) + (programPressure * 10));
};

const resolvePlannedDailyMultiplier = (dateKey, index, totalDays) => {
  let multiplier = 1;
  const date = toValidDate(`${dateKey}T00:00:00`);
  if (date) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 6) multiplier += 0.12;
    else if (dayOfWeek === 0) multiplier += 0.08;
    else if (dayOfWeek === 5) multiplier += 0.05;
    else if (dayOfWeek === 1) multiplier -= 0.05;
    else if (dayOfWeek === 2) multiplier -= 0.03;
  }

  if (index === 0) multiplier += 0.04;
  if (index === totalDays - 1) multiplier += 0.06;

  if (totalDays >= 4 && index > 0 && index < totalDays - 1) {
    const center = (totalDays - 1) / 2;
    const distance = Math.abs(index - center);
    const centerBias = 1 - (distance / Math.max(center, 1));
    multiplier -= centerBias * 0.03;
  }

  return clamp(multiplier, 0.82, 1.22);
};

const estimatePlannedDayCongestion = ({
  dateKey,
  index,
  totalDays,
  baseScore,
}) => {
  const multiplier = resolvePlannedDailyMultiplier(dateKey, index, totalDays);
  return safePercent(Math.round(baseScore * multiplier));
};

const resolveCongestionMeta = (value) => {
  const pct = safePercent(value);
  if (pct >= 80) {
    return {
      label: "매우 혼잡",
      color: "#b91c1c",
      bg: "#fef2f2",
      border: "#fecaca",
      sentence: "사람이 매우 몰린 상태입니다.",
    };
  }
  if (pct >= 60) {
    return {
      label: "혼잡",
      color: "#b45309",
      bg: "#fff7ed",
      border: "#fdba74",
      sentence: "대기 시간이 길어질 수 있습니다.",
    };
  }
  if (pct >= 30) {
    return {
      label: "보통",
      color: "#1d4ed8",
      bg: "#eff6ff",
      border: "#bfdbfe",
      sentence: "약간의 대기가 발생할 수 있습니다.",
    };
  }
  return {
    label: "여유",
    color: "#047857",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    sentence: "비교적 빠르게 이용할 수 있습니다.",
  };
};

const estimateWaitMinutes = (value) => {
  const pct = safePercent(value);
  if (pct < 25) return 0;
  if (pct < 40) return Math.max(1, Math.round((pct - 25) * 0.2 + 1));
  if (pct < 55) return Math.round(4 + (pct - 40) * 0.33);
  if (pct < 70) return Math.round(9 + (pct - 55) * 0.47);
  if (pct < 85) return Math.round(16 + (pct - 70) * 0.67);
  return Math.min(60, Math.round(26 + (pct - 85) * 0.95));
};

const deriveCongestionPercentFromWait = (waitCount, waitMin) => {
  const teams = Math.max(0, safeNumber(waitCount));
  const minutes = Math.max(0, safeNumber(waitMin));
  const score = Math.round(minutes * 2.2 + teams * 4);
  return safePercent(score);
};

const WAIT_CATEGORY_STYLE = {
  instant: {
    color: "#047857",
    background: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  relaxed: {
    color: "#0f766e",
    background: "#f0fdfa",
    borderColor: "#99f6e4",
  },
  normal: {
    color: "#1d4ed8",
    background: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  popular: {
    color: "#c2410c",
    background: "#fff7ed",
    borderColor: "#fdba74",
  },
  veryPopular: {
    color: "#b91c1c",
    background: "#fef2f2",
    borderColor: "#fecaca",
  },
};

const resolveProgramWaitCategory = (waitMin) => {
  const minutes = Math.max(0, safeNumber(waitMin));

  if (minutes <= 0) {
    return {
      key: "instant",
      label: "바로 참여가능",
      guideText: "예상 대기시간 0분",
      style: WAIT_CATEGORY_STYLE.instant,
    };
  }
  if (minutes <= 10) {
    return {
      key: "relaxed",
      label: "여유있음",
      guideText: "예상 대기시간 1~10분",
      style: WAIT_CATEGORY_STYLE.relaxed,
    };
  }
  if (minutes <= 20) {
    return {
      key: "normal",
      label: "보통",
      guideText: "예상 대기시간 11~20분",
      style: WAIT_CATEGORY_STYLE.normal,
    };
  }
  if (minutes <= 30) {
    return {
      key: "popular",
      label: "인기",
      guideText: "예상 대기시간 21~30분",
      style: WAIT_CATEGORY_STYLE.popular,
    };
  }

  return {
    key: "veryPopular",
    label: "매우 인기",
    guideText: "예상 대기시간 31분 이상",
    style: WAIT_CATEGORY_STYLE.veryPopular,
  };
};

const getProgramGuideText = (waitMin) => resolveProgramWaitCategory(waitMin).guideText;

const getPetEventGuideText = (waitCategory) => {
  const key = String(waitCategory?.key || "").toLowerCase();
  if (key === "instant") return "대기 없이 참여 가능해요";
  if (key === "relaxed") return "반려견과 여유롭게 참여할 수 있어요";
  if (key === "normal") return "반려견과 잠시만 기다리면 참여할 수 있어요";
  if (key === "popular") return "인기가 많아 반려견과 잠깐 대기가 필요해요";
  if (key === "verypopular") return "인기가 매우 높아 반려견과 대기줄이 길 수 있어요";
  return "현장 상황에 맞춰 이동하면 더 편하게 참여할 수 있어요";
};

const getReadyProgramLabel = (_waitCount, waitMin) => resolveProgramWaitCategory(waitMin).label;

const getCongestionSummaryText = (congestionPercent) => {
  const pct = safePercent(congestionPercent);
  if (pct <= 30) return "현재 여유로운 수준이에요";
  if (pct <= 60) return "현재 보통 수준이에요";
  if (pct <= 80) return "현재 혼잡한 편이에요";
  return "현재 매우 혼잡해요";
};

const getWaitSummaryText = (waitMinutes) => {
  const minutes = Math.max(0, safeNumber(waitMinutes));
  if (minutes <= 0) return "지금 바로 참여할 수 있어요";
  if (minutes <= 15) return "조금만 기다리면 참여할 수 있어요";
  if (minutes <= 30) return "여유를 두고 이동하면 좋아요";
  return "대기가 길 수 있어 잠시 후 방문을 추천해요";
};

const getVisitorMoodText = (visitors, isPlannedEvent) => {
  if (isPlannedEvent) return "오픈 전 준비가 진행 중이에요";
  const count = Math.max(0, safeNumber(visitors));
  if (count >= 800) return "현장 분위기가 한창이에요";
  if (count >= 400) return "많은 반려가족이 함께하고 있어요";
  if (count >= 150) return "차분하게 둘러보기 좋은 분위기예요";
  return "지금은 비교적 여유롭게 이동할 수 있어요";
};

const formatProgramTimeRange = (startAt, endAt) => {
  const start = formatTime(startAt);
  const end = formatTime(endAt);
  if (start === "--:--" && end === "--:--") return "운영 시간 정보 없음";
  if (start !== "--:--" && end !== "--:--") return `${start} ~ ${end}`;
  return start !== "--:--" ? `${start} 시작` : `${end} 종료`;
};

async function fetchAdminData(url, params, fallback) {
  try {
    const response = await axiosInstance.get(url, {
      params,
    });
    return {
      data: unwrapData(response, fallback),
      hasError: false,
    };
  } catch {
    return {
      data: fallback,
      hasError: true,
    };
  }
}

const isUnauthorizedError = (error) => {
  const status = Number(error?.response?.status);
  return status === 401 || status === 403;
};

const getPagedTotalCount = (payload) => {
  const total = Number(
    payload?.totalElements ??
      payload?.totalCount ??
      payload?.count ??
      payload?.total ??
      payload?.totalApply,
  );
  if (!Number.isFinite(total) || total < 0) return null;
  return Math.round(total);
};

const isCheckedInApply = (apply) => {
  const status = String(apply?.status ?? "").toUpperCase();
  return Boolean(apply?.checkedInAt) || status === "CHECKED_IN";
};

async function fetchProgramApplyStats(
  programId,
  { scanAll = false, pageSize = 200, maxPages = 100 } = {},
) {
  if (!programId) return { totalApply: 0, checkedIn: 0 };

  const fetchWithPaging = async (fetchPage) => {
    let page = 0;
    let isLast = false;
    let totalApply = 0;
    let checkedIn = 0;
    let hasTotalFromPayload = false;
    const size = scanAll ? pageSize : 1;

    while (!isLast && page < maxPages) {
      const payload = await fetchPage(page, size);
      const rows = toArray(payload);
      const payloadTotal = getPagedTotalCount(payload);

      if (payloadTotal != null) {
        totalApply = Math.max(totalApply, payloadTotal);
        hasTotalFromPayload = true;
      } else if (!hasTotalFromPayload) {
        totalApply += rows.length;
      }

      if (scanAll) {
        checkedIn += rows.filter((row) => isCheckedInApply(row)).length;
      } else {
        checkedIn = Math.max(
          checkedIn,
          Math.round(
            getFirstPositiveNumber(
              payload?.checkedInCount,
              payload?.checkinCount,
              payload?.checkedCount,
              payload?.doneCount,
            ),
          ),
        );
      }

      const totalPages = Number(payload?.totalPages ?? 1);
      isLast = Boolean(payload?.last) || page + 1 >= totalPages;
      if (!scanAll) isLast = true;
      page += 1;
    }

    return {
      totalApply: Math.max(0, Math.round(totalApply)),
      checkedIn: Math.max(0, Math.round(checkedIn)),
    };
  };

  try {
    return await fetchWithPaging(async (page, size) => {
      const response = await axiosInstance.get(
        `/api/admin/dashboard/programs/${programId}/applies`,
        {
          params: { page, size },
        },
      );
      return unwrapData(response, {});
    });
  } catch (error) {
    if (!isUnauthorizedError(error)) {
      return { totalApply: 0, checkedIn: 0 };
    }
  }

  try {
    return await fetchWithPaging(async (page, size) => {
      const response = await programApi.getCandidates(programId, { page, size });
      return unwrapData(response, {});
    });
  } catch {
    return { totalApply: 0, checkedIn: 0 };
  }
}

function HourlyTrendChart({ points, isTodayForecast }) {
  const now = new Date();
  const currentHour = now.getHours();
  const isTodayDate = Boolean(isTodayForecast);
  const safePoints = Array.isArray(points) ? points : [];
  const yTicks = [100, 75, 50, 25, 0];
  const chartTopPadding = 12;
  const chartBottomPadding = 10;
  const chartInnerHeight = 100 - chartTopPadding - chartBottomPadding;
  const chartBottomY = chartTopPadding + chartInnerHeight;
  const toY = (value) =>
    chartTopPadding + ((100 - clamp(Number(value) || 0, 0, 100)) / 100) * chartInnerHeight;

  if (safePoints.length === 0) {
    return (
      <div className="rt-prediction-empty">
        시간대 혼잡도 데이터가 준비되면 그래프로 보여드릴게요.
      </div>
    );
  }

  const chartPoints = safePoints.map((point, index) => {
    const x = safePoints.length <= 1 ? 50 : (index / (safePoints.length - 1)) * 100;
    const hour = Number(point?.h);
    const parseSeriesValue = (raw) => {
      if (raw == null || raw === "") return null;
      const numeric = Number(raw);
      return Number.isFinite(numeric) ? clamp(Math.round(numeric), 0, 100) : null;
    };
    const actual = parseSeriesValue(point?.actual);
    const predicted = parseSeriesValue(point?.predicted);
    const fallbackValue = parseSeriesValue(point?.v);
    const value = fallbackValue ?? actual ?? predicted ?? 0;
    const isCurrent = isTodayDate && Number.isFinite(hour) && hour === currentHour;
    const xLabel =
      typeof point?.xLabel === "string" && point.xLabel.trim()
        ? point.xLabel
        : Number.isFinite(hour)
          ? `${String(hour).padStart(2, "0")}:00`
          : "--:--";
    return {
      ...point,
      x,
      hour,
      xLabel,
      value,
      actual,
      predicted,
      isCurrent,
    };
  });

  const toSeriesPoint = (point, value) => ({
    ...point,
    value,
    y: toY(value),
  });

  const actualSeries = chartPoints
    .filter((point) => {
      if (!Number.isFinite(point.actual)) return false;
      if (!isTodayDate) return true;
      return Number.isFinite(point.hour) ? point.hour <= currentHour : false;
    })
    .map((point) => toSeriesPoint(point, point.actual));

  let predictedSeries = chartPoints
    .filter((point) => {
      if (isTodayDate && Number.isFinite(point.hour) && point.hour < currentHour) return false;
      if (Number.isFinite(point.predicted)) return true;
      return Boolean(isTodayDate && point.isCurrent && Number.isFinite(point.actual));
    })
    .map((point) =>
      toSeriesPoint(
        point,
        Number.isFinite(point.predicted) ? point.predicted : point.actual,
      ),
    );

  const latestActualPoint = actualSeries.length > 0 ? actualSeries[actualSeries.length - 1] : null;
  if (isTodayDate && latestActualPoint && predictedSeries.length > 0) {
    const firstPredictedPoint = predictedSeries[0];
    const shouldBridge =
      Number.isFinite(firstPredictedPoint?.x) &&
      Number.isFinite(latestActualPoint?.x) &&
      firstPredictedPoint.x > latestActualPoint.x;
    if (shouldBridge) {
      predictedSeries = [latestActualPoint, ...predictedSeries];
    }
  }

  const buildAreaPath = (series) => {
    if (!Array.isArray(series) || series.length < 2) return "";
    const first = series[0];
    const last = series[series.length - 1];
    const pointPath = series.map((point) => `${point.x} ${point.y}`).join(" L ");
    return `M ${first.x} ${chartBottomY} L ${pointPath} L ${last.x} ${chartBottomY} Z`;
  };

  const buildSmoothPath = (series) => {
    if (!Array.isArray(series) || series.length === 0) return "";
    if (series.length === 1) {
      const only = series[0];
      return `M ${only.x} ${only.y}`;
    }
    if (series.length === 2) {
      return `M ${series[0].x} ${series[0].y} L ${series[1].x} ${series[1].y}`;
    }

    let path = `M ${series[0].x} ${series[0].y}`;
    for (let index = 0; index < series.length - 1; index += 1) {
      const p0 = index > 0 ? series[index - 1] : series[index];
      const p1 = series[index];
      const p2 = series[index + 1];
      const p3 = index + 2 < series.length ? series[index + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const actualLinePath = buildSmoothPath(actualSeries);
  const predictedLinePath = buildSmoothPath(predictedSeries);
  const actualAreaPath = buildAreaPath(actualSeries);
  const predictedAreaPath = buildAreaPath(predictedSeries);
  const toHourLabel = (hour) =>
    Number.isFinite(hour) ? `${String(hour).padStart(2, "0")}:00` : "--:--";

  const currentPoint = chartPoints.find((point) => point.isCurrent) || null;
  const currentMarkerX = (() => {
    if (!isTodayDate || chartPoints.length === 0) return null;
    if (currentPoint) return currentPoint.x;

    const hourPoints = chartPoints
      .filter((point) => Number.isFinite(point.hour))
      .sort((left, right) => left.hour - right.hour);
    if (hourPoints.length === 0) return null;

    const nextPoint = hourPoints.find((point) => point.hour >= currentHour) || null;
    const prevPoint = [...hourPoints].reverse().find((point) => point.hour <= currentHour) || null;

    if (prevPoint && nextPoint) {
      if (prevPoint.hour === nextPoint.hour) return prevPoint.x;
      const ratio = (currentHour - prevPoint.hour) / (nextPoint.hour - prevPoint.hour);
      return prevPoint.x + (nextPoint.x - prevPoint.x) * ratio;
    }

    return (prevPoint || nextPoint || null)?.x ?? null;
  })();

  const bands = [
    { key: "busy", top: 100, bottom: 70, className: "busy" },
    { key: "moderate", top: 70, bottom: 40, className: "moderate" },
    { key: "relaxed", top: 40, bottom: 0, className: "relaxed" },
  ];

  return (
    <div className="rt-hourly-chart">
      <div className="rt-hourly-y-axis">
        {yTicks.map((tick) => (
          <span
            key={`tick-${tick}`}
            className="rt-hourly-y-label"
            style={{ top: `${toY(tick)}%` }}
          >
            {tick}
          </span>
        ))}
      </div>

      <div className="rt-hourly-plot-wrap">
        <div className="rt-hourly-svg-wrap">
          <svg className="rt-hourly-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            {bands.map((band) => (
              <rect
                key={`zone-${band.key}`}
                className={`rt-hourly-zone ${band.className}`}
                x="0"
                y={toY(band.top)}
                width="100"
                height={toY(band.bottom) - toY(band.top)}
              />
            ))}

            {yTicks.map((tick) => (
              <line
                key={`grid-${tick}`}
                className={`rt-hourly-grid-line${tick === 0 ? "" : " dashed"}`}
                x1="0"
                y1={toY(tick)}
                x2="100"
                y2={toY(tick)}
              />
            ))}

            {actualAreaPath ? <path className="rt-hourly-area past" d={actualAreaPath} /> : null}
            {predictedAreaPath ? <path className="rt-hourly-area future" d={predictedAreaPath} /> : null}

            {Number.isFinite(currentMarkerX) ? (
              <line
                className="rt-hourly-current-line"
                x1={currentMarkerX}
                y1={chartTopPadding}
                x2={currentMarkerX}
                y2={chartBottomY}
              />
            ) : null}

            {actualLinePath ? <path className="rt-hourly-line actual" d={actualLinePath} /> : null}
            {predictedLinePath ? <path className="rt-hourly-line predicted" d={predictedLinePath} /> : null}
          </svg>
          {Number.isFinite(currentMarkerX) ? (
            <span
              className={`rt-hourly-now-label ${currentMarkerX <= 2 ? "edge-start" : ""} ${currentMarkerX >= 98 ? "edge-end" : ""}`.trim()}
              style={{ left: `${currentMarkerX}%` }}
            >
              지금
            </span>
          ) : null}
        </div>

        <div className="rt-hourly-x-axis">
          {chartPoints.map((point, index) => {
            const isFirst = index === 0;
            const isLast = index === chartPoints.length - 1;
            return (
              <div
                key={`xlabel-${point.h}-${index}`}
                className={`rt-hourly-x-label ${isFirst ? "edge-start" : ""} ${isLast ? "edge-end" : ""}`.trim()}
                style={{
                  left: `${point.x}%`,
                  color: "#94a3b8",
                  fontWeight: 600,
                  fontSize: "10px",
                }}
              >
                {point.xLabel}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ProgramCrowdCard({
  item,
  badgeText = "",
  badgeStyle = null,
  metricItems = null,
  guideText = undefined,
}) {
  const resolvedBadgeText = badgeText || item.tone.label;
  const resolvedBadgeStyle = badgeStyle || {
    color: item.tone.color,
    background: item.tone.bg,
    borderColor: item.tone.border,
  };
  const metrics = Array.isArray(metricItems) && metricItems.length > 0
    ? metricItems
    : [
      {
        label: "현재 대기 팀 수",
        value: `${item.waitCount}팀`,
      },
      {
        label: "예상 대기시간",
        value: `${item.waitMin}분`,
      },
      {
        label: "혼잡도",
        value: `${item.congestionPercent}%`,
      },
    ];
  const resolvedGuideText = guideText ?? item.guideText;

  return (
    <div className="rt-program-card">
      <div className="rt-program-card-head">
        <h4 className="rt-program-name">{item.name}</h4>
        <span
          className="rt-mini-badge"
          style={resolvedBadgeStyle}
        >
          {resolvedBadgeText}
        </span>
      </div>
      <div className="rt-program-time">운영 시간: {item.timeLabel}</div>
      <div
        className="rt-program-metric-grid"
        style={{ gridTemplateColumns: `repeat(${Math.max(metrics.length, 1)}, minmax(0, 1fr))` }}
      >
        {metrics.map((metric) => (
          <div key={`${item.key}-${metric.label}`} className="rt-program-metric">
            <div className="rt-program-metric-label">{metric.label}</div>
            <div className="rt-program-metric-value">{metric.value}</div>
          </div>
        ))}
      </div>
      {resolvedGuideText ? <div className="rt-program-guide">{resolvedGuideText}</div> : null}
    </div>
  );
}

function DashboardContent({ eventId }) {
  const numericEventId = Number(eventId);
  const { tick } = useAutoRefresh(15000);
  const [eventDetail, setEventDetail] = useState(null);
  const [performance, setPerformance] = useState({ approved: 0, checkin: 0 });
  const [hourlyRows, setHourlyRows] = useState([]);
  const [congestionRows, setCongestionRows] = useState([]);
  const [programRows, setProgramRows] = useState([]);
  const [eventPrediction, setEventPrediction] = useState(null);
  const [aiErrorMsg, setAiErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastLoadedAt, setLastLoadedAt] = useState(new Date());
  const aiPredictionRef = useRef(null);
  const aiLoadedAtRef = useRef(0);
  const aiRangeKeyRef = useRef("");
  const loadRequestIdRef = useRef(0);
  const lastAutoRefreshTickRef = useRef(tick);
  const [selectedForecastDate, setSelectedForecastDate] = useState("");
  const [endedPopularSortKey, setEndedPopularSortKey] = useState("perHour");

  const loadData = useCallback(async (options = {}) => {
    const { preserveLoading = false, forceAi = false } = options;
    const requestId = loadRequestIdRef.current + 1;
    loadRequestIdRef.current = requestId;

    if (!numericEventId || Number.isNaN(numericEventId)) {
      setErrorMsg("잘못된 행사 경로입니다.");
      setEventPrediction(null);
      setProgramRows([]);
      aiPredictionRef.current = null;
      aiLoadedAtRef.current = 0;
      aiRangeKeyRef.current = "";
      setLoading(false);
      return;
    }

    if (!preserveLoading) setLoading(true);

    try {
      const [eventResponse, performanceResult, hourlyResult, congestionResult, programsResult, aiProgramsResult] = await Promise.all([
        eventApi.getEventDetail(numericEventId),
        fetchAdminData("/api/analytics/events", { page: 0, size: 200 }, []),
        fetchAdminData(`/api/analytics/events/${numericEventId}/congestion-by-hour`, {}, []),
        fetchAdminData(`/api/dashboard/realtime/events/${numericEventId}/congestions`, { limit: 200 }, []),
        programApi.getAllProgramsByEvent({
          eventId: numericEventId,
          sort: "startAt,asc",
          pageSize: 200,
        })
          .then((data) => ({
            data,
            hasError: false,
          }))
          .catch(() => ({
            data: [],
            hasError: true,
          })),
        aiApi.predictProgramsCongestionByEvent(numericEventId)
          .then((data) => ({
            data,
            hasError: false,
          }))
          .catch(() => ({
            data: [],
            hasError: true,
          })),
      ]);

      if (requestId !== loadRequestIdRef.current) return;

      const performanceRows = toArray(performanceResult?.data);
      const hourlyData = toArray(hourlyResult?.data);
      const latestCongestions = toArray(congestionResult?.data);
      const basePrograms = Array.isArray(programsResult?.data) ? programsResult.data : [];
      const aiProgramPredictionMap = new Map(
        toArray(unwrapData(aiProgramsResult?.data, []))
          .map((item) => {
            const normalized = normalizePrediction(item);
            const programId = Number(item?.programId ?? normalized?.programId);
            if (!normalized || !Number.isFinite(programId)) return null;
            return [programId, normalized];
          })
          .filter(Boolean),
      );
      const hasOperationalLoadError =
        Boolean(performanceResult?.hasError) ||
        Boolean(hourlyResult?.hasError) ||
        Boolean(congestionResult?.hasError) ||
        Boolean(programsResult?.hasError);

      const programDetails = await Promise.allSettled(
        basePrograms.map((program) => programApi.getProgramDetail(program?.programId)),
      );
      const mergedPrograms = basePrograms.map((program, index) => {
        const settled = programDetails[index];
        const detail = settled?.status === "fulfilled"
          ? unwrapData(settled.value, null)
          : null;
        const merged = detail && typeof detail === "object"
          ? {
            ...program,
            ...detail,
            experienceWait: detail?.experienceWait ?? program?.experienceWait ?? null,
          }
          : program;
        const programId = Number(merged?.programId);
        const aiPrediction = Number.isFinite(programId)
          ? aiProgramPredictionMap.get(programId) ?? null
          : null;

        return {
          ...merged,
          aiPrediction,
        };
      });

      if (requestId !== loadRequestIdRef.current) return;

      const detail = unwrapData(eventResponse, null);
      const matchedPerformance = toArray(performanceRows).find(
        (row) => Number(row.eventId) === numericEventId,
      );
      const detailStatus = String(detail?.status ?? "").toUpperCase();
      const rawCheckinCount = Number(matchedPerformance?.checkinCount) || 0;
      let programsForDashboard = mergedPrograms;

      if (detailStatus === "ENDED" && mergedPrograms.length > 0) {
        const applyStatsResults = await Promise.allSettled(
          mergedPrograms.map((program) =>
            fetchProgramApplyStats(program?.programId, { scanAll: true }),
          ),
        );

        if (requestId !== loadRequestIdRef.current) return;

        programsForDashboard = mergedPrograms.map((program, index) => {
          const settled = applyStatsResults[index];
          if (settled?.status !== "fulfilled") return program;

          const totalApply = Math.max(0, Math.round(safeNumber(settled.value?.totalApply)));
          const checkedIn = Math.max(0, Math.round(safeNumber(settled.value?.checkedIn)));

          return {
            ...program,
            totalApply: Math.max(totalApply, Math.round(safeNumber(program?.totalApply))),
            totalApplyCount: Math.max(totalApply, Math.round(safeNumber(program?.totalApplyCount))),
            applyCount: Math.max(totalApply, Math.round(safeNumber(program?.applyCount))),
            appliedCount: Math.max(totalApply, Math.round(safeNumber(program?.appliedCount))),
            participantCount: Math.max(totalApply, Math.round(safeNumber(program?.participantCount))),
            participants: Math.max(totalApply, Math.round(safeNumber(program?.participants))),
            checkinCount: Math.max(checkedIn, Math.round(safeNumber(program?.checkinCount))),
            visitorCount: Math.max(
              checkedIn,
              totalApply,
              Math.round(safeNumber(program?.visitorCount)),
            ),
          };
        });
      }

      setEventDetail(detail);
      setPerformance({
        approved:
          Number(
            matchedPerformance?.activeRegistrationCount ??
            matchedPerformance?.approvedRegistrationCount,
          ) || 0,
        checkin: detailStatus === "PLANNED" ? 0 : rawCheckinCount,
      });
      setHourlyRows((prev) =>
        hourlyResult?.hasError && prev.length > 0 ? prev : hourlyData,
      );
      setCongestionRows((prev) =>
        congestionResult?.hasError && prev.length > 0 ? prev : latestCongestions,
      );
      setProgramRows((prev) =>
        programsResult?.hasError && prev.length > 0 ? prev : programsForDashboard,
      );
      setErrorMsg(
        hasOperationalLoadError ? "실시간 운영 데이터를 불러오지 못했습니다." : "",
      );
      setLastLoadedAt(new Date());

      if (detailStatus === "ENDED") {
        aiPredictionRef.current = null;
        aiLoadedAtRef.current = 0;
        aiRangeKeyRef.current = "";
        setEventPrediction(null);
        setAiErrorMsg("");
        return;
      }

      const aiRangeParams = resolveAiRangeParams(detail, selectedForecastDate);
      const aiRangeKey = JSON.stringify({
        from: aiRangeParams?.from || null,
        to: aiRangeParams?.to || null,
      });

      const now = Date.now();
      const shouldLoadAi =
        forceAi ||
        !aiPredictionRef.current ||
        aiRangeKeyRef.current !== aiRangeKey ||
        now - aiLoadedAtRef.current >= AI_REFRESH_INTERVAL_MS;

      if (shouldLoadAi) {
        try {
          const aiResponse = await aiApi.predictEventCongestion(numericEventId, aiRangeParams);
          if (requestId !== loadRequestIdRef.current) return;
          const aiPayload = normalizePrediction(unwrapData(aiResponse, null));
          aiPredictionRef.current = aiPayload;
          aiLoadedAtRef.current = now;
          aiRangeKeyRef.current = aiRangeKey;
          setEventPrediction(aiPayload);
          setAiErrorMsg("");
        } catch (aiError) {
          if (requestId !== loadRequestIdRef.current) return;
          console.error("[Realtime Dashboard] ai predict failed:", aiError);
          setAiErrorMsg("AI prediction is temporarily unavailable.");
        }
      } else {
        if (requestId !== loadRequestIdRef.current) return;
        setEventPrediction(aiPredictionRef.current);
        setAiErrorMsg("");
      }
    } catch (error) {
      if (requestId !== loadRequestIdRef.current) return;
      console.error("[Realtime Dashboard] load failed:", error);
      setErrorMsg("실시간 운영 데이터를 불러오지 못했습니다.");
    } finally {
      if (requestId === loadRequestIdRef.current && !preserveLoading) setLoading(false);
    }
  }, [numericEventId, selectedForecastDate]);

  const { spinning, refresh } = useRefresh(() => {
    loadData({ preserveLoading: true, forceAi: true });
  }, 800);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!loading) {
      if (lastAutoRefreshTickRef.current === tick) return;
      lastAutoRefreshTickRef.current = tick;
      loadData({ preserveLoading: true });
    }
  }, [tick, loadData, loading]);

  const measuredCongestions = useMemo(
    () =>
      congestionRows
        .map((row) => {
          const rawLevel = row?.congestionLevel;
          const hasMeasuredLevel = rawLevel !== null && rawLevel !== undefined && rawLevel !== "";
          const congestionLevel = hasMeasuredLevel ? Number(rawLevel) : NaN;
          return {
            ...row,
            congestionLevel,
            congestionPercent: congestionLevelToPercent(congestionLevel),
          };
        })
        .filter((row) => Number.isFinite(row.congestionLevel)),
    [congestionRows],
  );

  const averageCongestion = useMemo(() => {
    if (measuredCongestions.length === 0) return 0;
    const sum = measuredCongestions.reduce((acc, row) => acc + row.congestionPercent, 0);
    return clamp(Math.round(sum / measuredCongestions.length), 0, 100);
  }, [measuredCongestions]);

  const hourlyAverageCongestion = useMemo(() => {
    const samples = toArray(hourlyRows)
      .map((row) =>
        congestionLevelToPercent(
          row?.avgCongestionLevel ?? row?.avgCongestion ?? row?.avg_level,
        ),
      )
      .filter((value) => Number.isFinite(value) && value > 0);

    if (samples.length === 0) return 0;
    const sum = samples.reduce((acc, value) => acc + value, 0);
    return clamp(Math.round(sum / samples.length), 0, 100);
  }, [hourlyRows]);

  const eventStatus = String(eventDetail?.status ?? "").toUpperCase();
  const isPlannedEvent =
    eventStatus === "PLANNED" ||
    eventStatus === "PENDING" ||
    eventStatus === "UPCOMING";
  const isEndedEvent = eventStatus === "ENDED";
  const isOngoingEvent = eventStatus === "ONGOING";
  const plannedParticipantCount = Math.max(0, safeNumber(performance.approved));
  const plannedRangeDateKeys = useMemo(
    () => buildDateKeysFromRange(eventDetail?.startAt, eventDetail?.endAt),
    [eventDetail?.endAt, eventDetail?.startAt],
  );
  const plannedHeuristicBaseScore = useMemo(() => {
    if (!isPlannedEvent) return 0;
    return estimatePlannedBaseCongestion({
      registrationCount: plannedParticipantCount,
      dayCount: plannedRangeDateKeys.length || 1,
      programCount: toArray(programRows).length,
    });
  }, [isPlannedEvent, plannedParticipantCount, plannedRangeDateKeys.length, programRows]);
  const plannedHeuristicFloorScore = useMemo(() => {
    if (!isPlannedEvent || plannedHeuristicBaseScore <= 0) return 0;
    return safePercent(Math.max(12, Math.round(plannedHeuristicBaseScore * 0.8)));
  }, [isPlannedEvent, plannedHeuristicBaseScore]);
  const endedRatioCongestion = useMemo(() => {
    if (!isEndedEvent) return 0;
    const approvedCount = Math.max(0, safeNumber(performance?.approved));
    const checkedInCount = Math.max(0, safeNumber(performance?.checkin));
    if (approvedCount <= 0 && checkedInCount <= 0) return 0;
    const denominator = approvedCount > 0 ? approvedCount : checkedInCount;
    return safePercent(Math.round((checkedInCount / denominator) * 100));
  }, [isEndedEvent, performance?.approved, performance?.checkin]);
  const endedProgramAiAverageCongestion = useMemo(() => {
    if (!isEndedEvent) return 0;
    const samples = toArray(programRows)
      .map((program) =>
        getFirstDefinedFiniteNumber(
          program?.aiPrediction?.avgScore,
          program?.aiPrediction?.peakScore,
          program?.aiPrediction?.predictedAvgScore,
          program?.aiPrediction?.predictedPeakScore,
        ),
      )
      .map((score) => safePercent(score))
      .filter((score) => Number.isFinite(score) && score > 0);

    if (samples.length === 0) return 0;
    const sum = samples.reduce((acc, score) => acc + score, 0);
    return safePercent(Math.round(sum / samples.length));
  }, [isEndedEvent, programRows]);

  const resolvedCurrentCongestion = useMemo(() => {
    const aiAverage = Number(eventPrediction?.avgScore);
    if (isPlannedEvent) {
      const canUseAiAverage = Number.isFinite(aiAverage) && aiAverage > 0 && !eventPrediction?.fallbackUsed;
      if (canUseAiAverage) {
        return safePercent(aiAverage);
      }
      return estimateUpcomingCongestionPercent(
        plannedParticipantCount,
        eventDetail?.startAt,
        eventDetail?.endAt,
      );
    }
    if (isEndedEvent) {
      // Ended events should show full-event average congestion, not the final snapshot.
      if (hourlyAverageCongestion > 0) {
        return hourlyAverageCongestion;
      }
      if (measuredCongestions.length > 0) {
        return safePercent(averageCongestion);
      }
      if (endedRatioCongestion > 0) {
        return endedRatioCongestion;
      }
      if (endedProgramAiAverageCongestion > 0) {
        return endedProgramAiAverageCongestion;
      }
      if (Number.isFinite(aiAverage) && aiAverage > 0) {
        return safePercent(aiAverage);
      }
      return 0;
    }
    if (measuredCongestions.length > 0) {
      return safePercent(averageCongestion);
    }
    if (Number.isFinite(aiAverage) && aiAverage > 0) {
      return safePercent(aiAverage);
    }
    if (hourlyAverageCongestion > 0) {
      return hourlyAverageCongestion;
    }
    return safePercent(aiAverage || 0);
  }, [
    averageCongestion,
    eventPrediction?.avgScore,
    hourlyAverageCongestion,
    isEndedEvent,
    isPlannedEvent,
    measuredCongestions.length,
    endedProgramAiAverageCongestion,
    endedRatioCongestion,
    eventDetail?.endAt,
    eventDetail?.startAt,
    eventPrediction?.fallbackUsed,
    plannedParticipantCount,
    plannedHeuristicBaseScore,
    plannedHeuristicFloorScore,
  ]);

  const forecastDateOptions = useMemo(() => {
    const rangeDates = plannedRangeDateKeys;
    if (rangeDates.length > 0) return rangeDates;

    const timelineDates = Array.isArray(eventPrediction?.timeline)
      ? Array.from(
          new Set(
            eventPrediction.timeline
              .map((point) => toDateKey(point?.time))
              .filter(Boolean),
          ),
        ).sort((left, right) => left.localeCompare(right))
      : [];
    return timelineDates;
  }, [eventPrediction?.timeline, plannedRangeDateKeys]);

  const activeForecastDateKey = useMemo(() => {
    if (selectedForecastDate && forecastDateOptions.includes(selectedForecastDate)) {
      return selectedForecastDate;
    }
    if (isOngoingEvent) {
      const todayKey = toDateKey(new Date());
      if (forecastDateOptions.includes(todayKey)) return todayKey;
    }
    if (eventStatus === "ENDED" && forecastDateOptions.length > 0) {
      return forecastDateOptions[forecastDateOptions.length - 1];
    }
    return forecastDateOptions[0] ?? "";
  }, [eventStatus, forecastDateOptions, isOngoingEvent, selectedForecastDate]);

  useEffect(() => {
    if (!selectedForecastDate) return;
    if (forecastDateOptions.includes(selectedForecastDate)) return;
    setSelectedForecastDate("");
  }, [forecastDateOptions, selectedForecastDate]);

  const isTodayForecast = useMemo(() => {
    if (!activeForecastDateKey || isEndedEvent) return false;
    return activeForecastDateKey === toDateKey(new Date());
  }, [activeForecastDateKey, isEndedEvent]);
  const isPastForecast = useMemo(() => {
    if (!activeForecastDateKey) return false;
    const todayKey = toDateKey(new Date());
    if (isEndedEvent) return activeForecastDateKey <= todayKey;
    return activeForecastDateKey < todayKey;
  }, [activeForecastDateKey, isEndedEvent]);
  const isFutureForecast = useMemo(() => {
    if (!activeForecastDateKey || isEndedEvent) return false;
    return activeForecastDateKey > toDateKey(new Date());
  }, [activeForecastDateKey, isEndedEvent]);

  const chartTimeline = useMemo(() => {
    const baseTimeline = Array.isArray(eventPrediction?.timeline)
      ? eventPrediction.timeline
      : [];
    if (baseTimeline.length === 0) return [];

    let timeline = baseTimeline;
    if (activeForecastDateKey) {
      timeline = baseTimeline.filter(
        (point) => toDateKey(point?.time) === activeForecastDateKey,
      );
    }

    if (isOngoingEvent && isTodayForecast) {
      const minPredictionStart = getMinPredictionStart(5);
      if (minPredictionStart) {
        timeline = timeline.filter((point) => {
          const pointTime = toValidDate(point?.time);
          return pointTime ? pointTime >= minPredictionStart : false;
        });
      }
    }

    return timeline;
  }, [activeForecastDateKey, eventPrediction?.timeline, isOngoingEvent, isTodayForecast]);

  const hours = useMemo(() => {
    const predictionMap = new Map();
    if (Array.isArray(chartTimeline)) {
      chartTimeline.forEach((point) => {
        const hour = toHour(point?.time);
        if (!Number.isFinite(hour)) return;
        const normalizedHour = normalizeHour(hour);
        const score = clamp(Math.round(Number(point?.score) || 0), 0, 100);
        const previous = predictionMap.get(normalizedHour);
        if (previous == null || score > previous) {
          predictionMap.set(normalizedHour, score);
        }
      });
    }

    const actualMap = new Map();
    const measuredHourBuckets = new Map();
    const pushMeasuredActual = (hour, value) => {
      if (value == null || value === "") return;
      const normalizedHour = normalizeHour(hour);
      const numericValue = Number(value);
      if (!Number.isFinite(normalizedHour) || !Number.isFinite(numericValue)) return;

      const bucket = measuredHourBuckets.get(normalizedHour) || { sum: 0, count: 0 };
      bucket.sum += numericValue;
      bucket.count += 1;
      measuredHourBuckets.set(normalizedHour, bucket);
    };

    const measuredRowsForDate = measuredCongestions.filter((row) => {
      if (!activeForecastDateKey) return true;
      return toDateKey(row?.measuredAt) === activeForecastDateKey;
    });

    if (isTodayForecast || isPastForecast) {
      measuredRowsForDate.forEach((row) => {
        const hour = toHour(row?.measuredAt);
        if (!Number.isFinite(hour)) return;
        pushMeasuredActual(hour, row?.congestionPercent);
      });
    }

    measuredHourBuckets.forEach((bucket, hour) => {
      if (!bucket || bucket.count <= 0) return;
      actualMap.set(hour, clamp(Math.round(bucket.sum / bucket.count), 0, 100));
    });

    const nowHour = normalizeHour(new Date().getHours());
    if (isTodayForecast) {
      actualMap.set(nowHour, safePercent(resolvedCurrentCongestion));
    }

    if (isTodayForecast || (isPastForecast && actualMap.size === 0)) {
      toArray(hourlyRows)
        .map((row) => [
          normalizeHour(Number(row?.hour ?? row?.h)),
          congestionLevelToPercent(row?.avgCongestionLevel ?? row?.avgCongestion ?? row?.avg_level),
        ])
        .filter(([hour]) => Number.isFinite(hour))
        .forEach(([hour, value]) => {
          if (!actualMap.has(hour)) {
            actualMap.set(hour, clamp(Math.round(Number(value) || 0), 0, 100));
          }
        });
    }

    let axisStart = eventDetail?.startAt ?? null;
    let axisEnd = eventDetail?.endAt ?? null;
    if (activeForecastDateKey) {
      const operationRange = buildOperationRangeByDate(
        eventDetail?.startAt,
        eventDetail?.endAt,
        activeForecastDateKey,
      );
      if (operationRange.startAt && operationRange.endAt) {
        axisStart = operationRange.startAt;
        axisEnd = operationRange.endAt;
      }
    }

    const axisHourlyRows = isTodayForecast && !isEndedEvent ? hourlyRows : [];
    const hourAxis = buildHourAxis({
      hourlyRows: axisHourlyRows,
      timeline: chartTimeline,
      startAt: axisStart,
      endAt: axisEnd,
      preferRange: Boolean(axisStart && axisEnd),
    });
    const displayHourAxis = uniqueNormalizedHours(hourAxis);

    const baseRows = displayHourAxis.map((hour) => {
      const normalizedHour = normalizeHour(hour);
      const actualValue = actualMap.get(normalizedHour);
      const predictedValue = predictionMap.get(normalizedHour);
      const actual = Number.isFinite(actualValue)
        ? clamp(Math.round(actualValue), 0, 100)
        : null;
      const predictedCandidate = Number.isFinite(predictedValue)
        ? clamp(Math.round(predictedValue), 0, 100)
        : null;
      const predicted = isPastForecast || isEndedEvent ? null : predictedCandidate;
      const value = isTodayForecast
        ? normalizedHour <= nowHour
          ? actual ?? predicted ?? 0
          : predicted ?? actual ?? 0
        : isPastForecast || isEndedEvent
          ? actual ?? 0
          : predicted ?? actual ?? 0;
      return {
        h: String(normalizedHour).padStart(2, "0"),
        v: value,
        pct: value,
        actual,
        predicted,
      };
    });

    if (isPastForecast || isEndedEvent) {
      const hasActualAt = (row) => Number.isFinite(row.actual);
      let startIndex = 0;
      let endIndex = baseRows.length - 1;
      while (startIndex <= endIndex && !hasActualAt(baseRows[startIndex])) {
        startIndex += 1;
      }
      while (endIndex >= startIndex && !hasActualAt(baseRows[endIndex])) {
        endIndex -= 1;
      }
      if (startIndex <= endIndex) {
        return baseRows.slice(startIndex, endIndex + 1);
      }
      return baseRows;
    }

    if (!isTodayForecast || isEndedEvent) {
      return baseRows;
    }

    const latestActualRow = [...baseRows]
      .filter((row) => Number.isFinite(row.actual) && Number(row.h) <= nowHour)
      .sort((left, right) => Number(left.h) - Number(right.h))
      .pop();

    if (!latestActualRow || !Number.isFinite(latestActualRow.actual)) {
      return baseRows;
    }

    const latestActualHour = Number(latestActualRow.h);
    const anchorPredictionRow =
      baseRows.find(
        (row) =>
          Number(row.h) === latestActualHour && Number.isFinite(row.predicted),
      ) ||
      baseRows
        .filter((row) => Number(row.h) > latestActualHour && Number.isFinite(row.predicted))
        .sort((left, right) => Number(left.h) - Number(right.h))[0] ||
      null;

    const predictionOffset =
      anchorPredictionRow && Number.isFinite(anchorPredictionRow.predicted)
        ? latestActualRow.actual - anchorPredictionRow.predicted
        : 0;

    return baseRows.map((row) => {
      const rowHour = Number(row.h);
      const calibratedPredicted = Number.isFinite(row.predicted)
        ? clamp(
            Math.round(
              rowHour >= latestActualHour ? row.predicted + predictionOffset : row.predicted,
            ),
            0,
            100,
          )
        : null;
      const bridgedPredicted =
        rowHour === latestActualHour && Number.isFinite(latestActualRow.actual)
          ? latestActualRow.actual
          : calibratedPredicted;
      const value = rowHour <= nowHour
        ? row.actual ?? bridgedPredicted ?? 0
        : bridgedPredicted ?? row.actual ?? 0;
      return {
        ...row,
        v: value,
        pct: value,
        predicted: bridgedPredicted,
      };
    });
  }, [
    activeForecastDateKey,
    chartTimeline,
    eventDetail?.endAt,
    eventDetail?.startAt,
    hourlyRows,
    isEndedEvent,
    isPastForecast,
    isTodayForecast,
    measuredCongestions,
    resolvedCurrentCongestion,
  ]);

  const dailyCongestionPoints = useMemo(() => {
    if (!isEndedEvent) return [];

    const dateKeys = forecastDateOptions.length > 0
      ? forecastDateOptions
      : Array.from(
        new Set(
          measuredCongestions
            .map((row) => toDateKey(row?.measuredAt))
            .filter(Boolean),
        ),
      ).sort((left, right) => left.localeCompare(right));

    if (dateKeys.length > 0) {
      const bucketMap = new Map();
      measuredCongestions.forEach((row) => {
        const dateKey = toDateKey(row?.measuredAt);
        const congestion = Number(row?.congestionPercent);
        if (!dateKey || !Number.isFinite(congestion)) return;
        const bucket = bucketMap.get(dateKey) || { sum: 0, count: 0 };
        bucket.sum += congestion;
        bucket.count += 1;
        bucketMap.set(dateKey, bucket);
      });

      const measuredPoints = dateKeys
        .map((dateKey, index) => {
          const bucket = bucketMap.get(dateKey);
          const actual = bucket && bucket.count > 0
            ? clamp(Math.round(bucket.sum / bucket.count), 0, 100)
            : null;
          return {
            dateKey,
            h: String(index).padStart(2, "0"),
            xLabel: formatShortDateKey(dateKey),
            v: actual ?? 0,
            pct: actual ?? 0,
            actual,
            predicted: null,
          };
        })
        .filter((row) => Number.isFinite(row.actual));
      if (measuredPoints.length > 0) {
        return measuredPoints;
      }

      const syntheticActual = hourlyAverageCongestion > 0
        ? hourlyAverageCongestion
        : endedRatioCongestion > 0
          ? endedRatioCongestion
          : endedProgramAiAverageCongestion;
      const demandBucketMap = new Map();
      toArray(programRows).forEach((program) => {
        const dateKey = toDateKey(program?.startAt ?? program?.endAt);
        if (!dateKey) return;
        const demand = Math.max(
          resolveProgramVisitorCount(program),
          resolveProgramParticipantCount(program),
        );
        if (!Number.isFinite(demand) || demand <= 0) return;
        const bucket = demandBucketMap.get(dateKey) || { sum: 0, count: 0 };
        bucket.sum += demand;
        bucket.count += 1;
        demandBucketMap.set(dateKey, bucket);
      });
      const demands = dateKeys
        .map((dateKey) => safeNumber(demandBucketMap.get(dateKey)?.sum, 0))
        .filter((value) => Number.isFinite(value) && value > 0);
      if (demands.length > 0) {
        const minDemand = Math.min(...demands);
        const maxDemand = Math.max(...demands);
        const base = syntheticActual > 0 ? syntheticActual : 55;

        return dateKeys.map((dateKey, index) => {
          const demand = safeNumber(demandBucketMap.get(dateKey)?.sum, 0);
          let factor = 1;
          if (maxDemand > minDemand && demand > 0) {
            factor = 0.82 + (((demand - minDemand) / (maxDemand - minDemand)) * 0.36);
          } else if (demand <= 0) {
            factor = 0.78;
          }
          const actual = safePercent(Math.round(base * factor));
          return {
            dateKey,
            h: String(index).padStart(2, "0"),
            xLabel: formatShortDateKey(dateKey),
            v: actual,
            pct: actual,
            actual,
            predicted: null,
          };
        });
      }
      if (syntheticActual > 0) {
        const fallbackDateKey = dateKeys[dateKeys.length - 1] || toDateKey(new Date());
        return [
          {
            dateKey: fallbackDateKey,
            h: "00",
            xLabel: formatShortDateKey(fallbackDateKey),
            v: syntheticActual,
            pct: syntheticActual,
            actual: syntheticActual,
            predicted: null,
          },
        ];
      }
    }

    const hourlyBucketMap = new Map();
    toArray(hourlyRows).forEach((row) => {
      const dateKey =
        toDateKey(row?.date ?? row?.day ?? row?.measuredAt ?? row?.timestamp ?? row?.time) ||
        toDateKey(eventDetail?.endAt ?? eventDetail?.startAt) ||
        toDateKey(new Date());
      const score = congestionLevelToPercent(
        row?.avgCongestionLevel ?? row?.avgCongestion ?? row?.avg_level ?? row?.congestionLevel ?? row?.congestion,
      );
      if (!dateKey || !Number.isFinite(score)) return;
      const bucket = hourlyBucketMap.get(dateKey) || { sum: 0, count: 0 };
      bucket.sum += score;
      bucket.count += 1;
      hourlyBucketMap.set(dateKey, bucket);
    });

    if (hourlyBucketMap.size > 0) {
      const fallbackDateKeys = Array.from(hourlyBucketMap.keys()).sort((left, right) =>
        left.localeCompare(right),
      );
      return fallbackDateKeys.map((dateKey, index) => {
        const bucket = hourlyBucketMap.get(dateKey);
        const actual = bucket && bucket.count > 0
          ? clamp(Math.round(bucket.sum / bucket.count), 0, 100)
          : 0;
        return {
          dateKey,
          h: String(index).padStart(2, "0"),
          xLabel: formatShortDateKey(dateKey),
          v: actual,
          pct: actual,
          actual,
          predicted: null,
        };
      });
    }

    if (hourlyAverageCongestion > 0) {
      const fallbackDateKey =
        toDateKey(eventDetail?.endAt ?? eventDetail?.startAt) || toDateKey(new Date());
      return [
        {
          dateKey: fallbackDateKey,
          h: "00",
          xLabel: formatShortDateKey(fallbackDateKey),
          v: hourlyAverageCongestion,
          pct: hourlyAverageCongestion,
          actual: hourlyAverageCongestion,
          predicted: null,
        },
      ];
    }

    return [];
  }, [endedProgramAiAverageCongestion, endedRatioCongestion, eventDetail?.endAt, eventDetail?.startAt, forecastDateOptions, hourlyAverageCongestion, hourlyRows, isEndedEvent, measuredCongestions, programRows]);

  const hasEndedMeasuredCongestionData = useMemo(() => {
    if (!isEndedEvent) return false;
    if (measuredCongestions.length > 0) return true;
    return toArray(hourlyRows).some((row) => {
      const score = congestionLevelToPercent(
        row?.avgCongestionLevel ?? row?.avgCongestion ?? row?.avg_level ?? row?.congestionLevel ?? row?.congestion,
      );
      return Number.isFinite(score) && score > 0;
    });
  }, [hourlyRows, isEndedEvent, measuredCongestions.length]);

  const plannedDailyForecastPoints = useMemo(() => {
    if (!isPlannedEvent) return [];

    const timeline = Array.isArray(eventPrediction?.timeline) ? eventPrediction.timeline : [];
    const dateKeys = forecastDateOptions.length > 0
      ? forecastDateOptions
      : plannedRangeDateKeys;
    if (dateKeys.length === 0) return [];

    const bucketMap = new Map();
    timeline.forEach((point) => {
      const dateKey = toDateKey(point?.time);
      const score = Number(point?.score);
      if (!dateKey || !Number.isFinite(score)) return;
      const bucket = bucketMap.get(dateKey) || { sum: 0, count: 0 };
      bucket.sum += score;
      bucket.count += 1;
      bucketMap.set(dateKey, bucket);
    });

    const rawPoints = dateKeys.map((dateKey, index) => {
      const bucket = bucketMap.get(dateKey);
      const aiPredicted = bucket && bucket.count > 0
        ? safePercent(Math.round(bucket.sum / bucket.count))
        : null;
      const heuristicPredicted = estimatePlannedDayCongestion({
        dateKey,
        index,
        totalDays: dateKeys.length,
        baseScore: plannedHeuristicBaseScore,
      });
      const heuristicFloor = safePercent(
        Math.max(
          plannedHeuristicFloorScore,
          Math.round(heuristicPredicted * 0.85),
        ),
      );
      const predicted = Number.isFinite(aiPredicted)
        ? safePercent(
          Math.max(
            Math.round((aiPredicted * 0.35) + (heuristicPredicted * 0.65)),
            heuristicFloor,
          ),
        )
        : safePercent(Math.max(heuristicPredicted, heuristicFloor));

      return {
        dateKey,
        h: String(index).padStart(2, "0"),
        xLabel: formatShortDateKey(dateKey),
        v: predicted,
        pct: predicted,
        actual: null,
        predicted,
      };
    });
    if (rawPoints.length === 0) return rawPoints;

    const targetAverage = safePercent(resolvedCurrentCongestion);
    const currentAverage = safePercent(
      Math.round(
        rawPoints.reduce((sum, point) => sum + safePercent(point?.predicted ?? point?.v), 0) /
          rawPoints.length,
      ),
    );
    const offset = targetAverage - currentAverage;

    if (offset === 0) return rawPoints;

    return rawPoints.map((point) => {
      const adjusted = safePercent((point?.predicted ?? point?.v) + offset);
      return {
        ...point,
        v: adjusted,
        pct: adjusted,
        predicted: adjusted,
      };
    });
  }, [eventPrediction?.timeline, forecastDateOptions, isPlannedEvent, plannedHeuristicBaseScore, plannedHeuristicFloorScore, plannedRangeDateKeys, resolvedCurrentCongestion]);

  const plannedRelaxedDayPoint = useMemo(() => {
    if (!isPlannedEvent || plannedDailyForecastPoints.length === 0) return null;
    return [...plannedDailyForecastPoints].sort(
      (left, right) =>
        (Number(left?.predicted ?? left?.v) || 0) - (Number(right?.predicted ?? right?.v) || 0),
    )[0];
  }, [isPlannedEvent, plannedDailyForecastPoints]);

  const plannedPeakDayPoint = useMemo(() => {
    if (!isPlannedEvent || plannedDailyForecastPoints.length === 0) return null;
    return [...plannedDailyForecastPoints].sort(
      (left, right) =>
        (Number(right?.predicted ?? right?.v) || 0) - (Number(left?.predicted ?? left?.v) || 0),
    )[0];
  }, [isPlannedEvent, plannedDailyForecastPoints]);

  const endedHourlyInsights = useMemo(() => {
    if (!isEndedEvent) {
      return {
        overallRelaxed: null,
        overallPeak: null,
        relaxedByDay: [],
      };
    }

    const dateKeys = forecastDateOptions.length > 0
      ? forecastDateOptions
      : Array.from(
        new Set(
          measuredCongestions
            .map((row) => toDateKey(row?.measuredAt))
            .filter(Boolean),
        ),
      ).sort((left, right) => left.localeCompare(right));

    const dayHourBucketMap = new Map();
    const pushDayHourSample = (dateKey, hour, score) => {
      if (!dateKey || !Number.isFinite(hour) || !Number.isFinite(score)) return;
      const normalizedHour = normalizeHour(hour);
      const bucketKey = `${dateKey}-${normalizedHour}`;
      const bucket = dayHourBucketMap.get(bucketKey) || {
        dateKey,
        hour: normalizedHour,
        sum: 0,
        count: 0,
      };
      bucket.sum += score;
      bucket.count += 1;
      dayHourBucketMap.set(bucketKey, bucket);
    };

    measuredCongestions.forEach((row) => {
      pushDayHourSample(
        toDateKey(row?.measuredAt),
        toHour(row?.measuredAt),
        safePercent(row?.congestionPercent),
      );
    });

    // 1) Fallback to hourly analytics rows (hour-level real stats)
    if (dayHourBucketMap.size === 0) {
      const hourlySamples = toArray(hourlyRows)
        .map((row) => ({
          hour: Number(row?.hour ?? row?.h),
          score: congestionLevelToPercent(
            row?.avgCongestionLevel ?? row?.avgCongestion ?? row?.avg_level ?? row?.congestionLevel ?? row?.congestion,
          ),
        }))
        .filter((item) => Number.isFinite(item.hour) && Number.isFinite(item.score) && item.score > 0);

      if (hourlySamples.length > 0) {
        const targetDateKeys = dateKeys.length > 0
          ? dateKeys
          : [toDateKey(eventDetail?.endAt ?? eventDetail?.startAt) || toDateKey(new Date())];
        targetDateKeys.forEach((dateKey) => {
          hourlySamples.forEach((sample) => {
            pushDayHourSample(dateKey, sample.hour, sample.score);
          });
        });
      }
    }

    // 2) If there is no per-hour real data, estimate by each day's daily score around event average.
    if (dayHourBucketMap.size === 0 && dailyCongestionPoints.length > 0) {
      const eventAverageScore = safePercent(
        resolvedCurrentCongestion || endedRatioCongestion || endedProgramAiAverageCongestion || 55,
      );
      const dailyScores = dailyCongestionPoints
        .map((point) => ({
          dateKey: String(point?.dateKey || ""),
          score: Number(point?.actual ?? point?.v),
        }))
        .filter((point) => point.dateKey && Number.isFinite(point.score));

      const dayHours = [10, 12, 14, 16, 18];
      dailyScores.forEach((dayPoint) => {
        const dayDelta = dayPoint.score - eventAverageScore;
        dayHours.forEach((hour) => {
          const hourBias = hour === 14 || hour === 16 ? 8 : hour === 12 ? 3 : hour === 18 ? 2 : -6;
          const estimatedScore = safePercent(
            Math.round(eventAverageScore + (dayDelta * 0.45) + hourBias),
          );
          pushDayHourSample(dayPoint.dateKey, hour, estimatedScore);
        });
      });
    }

    // 3) Last fallback: program participation density by day/hour.
    if (dayHourBucketMap.size === 0) {
      const demandByDayHour = new Map();
      const pushDemandByHour = (dateKey, hour, demand) => {
        if (!dateKey || !Number.isFinite(hour) || !Number.isFinite(demand) || demand <= 0) return;
        const normalizedHour = normalizeHour(hour);
        const key = `${dateKey}-${normalizedHour}`;
        demandByDayHour.set(key, safeNumber(demandByDayHour.get(key), 0) + demand);
      };

      toArray(programRows).forEach((program) => {
        const startDate = toValidDate(program?.startAt);
        const endDate = toValidDate(program?.endAt);
        if (!startDate || !endDate) return;

        const demand = Math.max(
          resolveProgramVisitorCount(program),
          resolveProgramParticipantCount(program),
        );
        if (!Number.isFinite(demand) || demand <= 0) return;

        const durationHours = Math.max(
          1,
          Math.ceil((endDate.getTime() - startDate.getTime()) / (60 * 60 * 1000)),
        );
        const hourlyDemand = demand / durationHours;

        const cursor = new Date(startDate);
        cursor.setMinutes(0, 0, 0);
        while (cursor <= endDate) {
          pushDemandByHour(toDateKey(cursor), cursor.getHours(), hourlyDemand);
          cursor.setHours(cursor.getHours() + 1, 0, 0, 0);
        }
      });

      const demandEntries = Array.from(demandByDayHour.entries()).map(([key, demand]) => {
        const [dateKey, hourText] = String(key).split("-");
        return {
          dateKey,
          hour: Number(hourText),
          demand: safeNumber(demand, 0),
        };
      }).filter((item) => item.dateKey && Number.isFinite(item.hour) && Number.isFinite(item.demand) && item.demand > 0);

      if (demandEntries.length > 0) {
        const minDemand = Math.min(...demandEntries.map((item) => item.demand));
        const maxDemand = Math.max(...demandEntries.map((item) => item.demand));
        const baseScore = safePercent(
          resolvedCurrentCongestion ||
          endedRatioCongestion ||
          endedProgramAiAverageCongestion ||
          55,
        );

        demandEntries.forEach((item) => {
          const normalizedDemand =
            maxDemand > minDemand
              ? (item.demand - minDemand) / (maxDemand - minDemand)
              : 0.5;
          const hourTrendBias = item.hour >= 14 && item.hour <= 16
            ? 1.0
            : item.hour >= 11 && item.hour <= 13
              ? 0.35
              : item.hour >= 9 && item.hour <= 10
                ? -0.55
                : item.hour >= 17 && item.hour <= 18
                  ? 0.15
                  : -0.2;
          const estimatedScore = safePercent(
            Math.round(
              baseScore +
              ((normalizedDemand - 0.5) * 16) +
              (hourTrendBias * 10),
            ),
          );
          pushDayHourSample(item.dateKey, item.hour, estimatedScore);
        });
      }
    }

    const dayHourAverages = Array.from(dayHourBucketMap.values())
      .map((bucket) => ({
        dateKey: bucket.dateKey,
        hour: bucket.hour,
        score: clamp(Math.round(bucket.sum / bucket.count), 0, 100),
      }))
      .filter((item) => Number.isFinite(item.score));

    const perDayBestMap = new Map();
    dayHourAverages.forEach((item) => {
      const previous = perDayBestMap.get(item.dateKey);
      if (
        !previous ||
        item.score < previous.score ||
        (item.score === previous.score && item.hour < previous.hour)
      ) {
        perDayBestMap.set(item.dateKey, item);
      }
    });

    const relaxedByDayBase = dateKeys.length > 0
      ? dateKeys
      : Array.from(new Set(dayHourAverages.map((item) => item.dateKey))).sort(
        (left, right) => left.localeCompare(right),
      );

    const relaxedByDay = relaxedByDayBase.map((dateKey) => {
      const match = perDayBestMap.get(dateKey) || null;
      const matchedHour = Number.isFinite(match?.hour) ? match.hour : null;
      const matchedScore = Number.isFinite(match?.score) ? match.score : null;
      return {
        dateKey,
        dateLabel: formatShortDateKey(dateKey),
        hour: matchedHour,
        hourLabel: Number.isFinite(matchedHour) ? formatHourLabel(matchedHour) : "--:--",
        score: matchedScore,
      };
    });

    const hourBucketMap = new Map();
    dayHourAverages.forEach((item) => {
      const bucket = hourBucketMap.get(item.hour) || { hour: item.hour, sum: 0, count: 0 };
      bucket.sum += item.score;
      bucket.count += 1;
      hourBucketMap.set(item.hour, bucket);
    });

    const hourlyAverages = Array.from(hourBucketMap.values())
      .map((bucket) => ({
        hour: bucket.hour,
        hourLabel: formatHourLabel(bucket.hour),
        score: clamp(Math.round(bucket.sum / bucket.count), 0, 100),
      }))
      .filter((item) => Number.isFinite(item.score));

    if (hourlyAverages.length === 0) {
      return {
        overallRelaxed: null,
        overallPeak: null,
        relaxedByDay,
      };
    }

    const relaxedSamples = relaxedByDay.filter(
      (item) => Number.isFinite(item?.hour) && Number.isFinite(item?.score),
    );
    const overallRelaxed = relaxedSamples.length > 0
      ? {
        hour: normalizeHour(
          Math.round(
            relaxedSamples.reduce((sum, item) => sum + item.hour, 0) / relaxedSamples.length,
          ),
        ),
        hourLabel: formatHourLabel(
          normalizeHour(
            Math.round(
              relaxedSamples.reduce((sum, item) => sum + item.hour, 0) / relaxedSamples.length,
            ),
          ),
        ),
        score: safePercent(
          Math.round(
            relaxedSamples.reduce((sum, item) => sum + item.score, 0) / relaxedSamples.length,
          ),
        ),
      }
      : [...hourlyAverages].sort(
        (left, right) => left.score - right.score || left.hour - right.hour,
      )[0] || null;
    const peakPoint = [...dayHourAverages].sort(
      (left, right) =>
        right.score - left.score ||
        left.hour - right.hour ||
        left.dateKey.localeCompare(right.dateKey),
    )[0] || null;
    const overallPeak = peakPoint
      ? {
        ...peakPoint,
        hourLabel: formatHourLabel(peakPoint.hour),
      }
      : [...hourlyAverages].sort(
      (left, right) => right.score - left.score || left.hour - right.hour,
    )[0] || null;

    const eventAverageScore = safePercent(
      resolvedCurrentCongestion || endedRatioCongestion || endedProgramAiAverageCongestion || 0,
    );
    const relaxedCap = eventAverageScore > 0 ? eventAverageScore - 1 : 0;
    const peakFloor = eventAverageScore < 100 ? eventAverageScore + 1 : 100;
    const normalizedRelaxed = overallRelaxed
      ? {
        ...overallRelaxed,
        score: safePercent(Math.min(safePercent(overallRelaxed.score), relaxedCap)),
      }
      : null;
    const normalizedPeak = overallPeak
      ? {
        ...overallPeak,
        score: safePercent(Math.max(safePercent(overallPeak.score), peakFloor)),
      }
      : null;

    return {
      overallRelaxed: normalizedRelaxed,
      overallPeak: normalizedPeak,
      relaxedByDay,
    };
  }, [dailyCongestionPoints, endedProgramAiAverageCongestion, endedRatioCongestion, eventDetail?.endAt, eventDetail?.startAt, forecastDateOptions, hourlyRows, isEndedEvent, measuredCongestions, programRows, resolvedCurrentCongestion]);

  const handleForecastDateChange = useCallback(
    (event) => {
      const nextDate = event.target.value;
      if (!nextDate) {
        setSelectedForecastDate("");
        return;
      }
      if (
        forecastDateOptions.length === 0 ||
        forecastDateOptions.includes(nextDate)
      ) {
        setSelectedForecastDate(nextDate);
      }
    },
    [forecastDateOptions],
  );

  const programCongestionMap = useMemo(() => {
    const map = new Map();
    measuredCongestions.forEach((row) => {
      const programId = Number(row?.programId);
      if (!Number.isFinite(programId)) return;
      const candidatePercent = safePercent(row?.congestionPercent);
      const candidateMeasured = toValidDate(row?.measuredAt)?.getTime() ?? 0;
      const previous = map.get(programId);
      if (
        !previous ||
        candidateMeasured > previous.measuredAt ||
        (candidateMeasured === previous.measuredAt &&
          candidatePercent > previous.congestionPercent)
      ) {
        map.set(programId, {
          congestionPercent: candidatePercent,
          measuredAt: candidateMeasured,
        });
      }
    });
    return map;
  }, [measuredCongestions]);

  const programAverageCongestionMap = useMemo(() => {
    const bucketMap = new Map();
    measuredCongestions.forEach((row) => {
      const programId = Number(row?.programId);
      if (!Number.isFinite(programId)) return;
      const congestionPercent = Number(row?.congestionPercent);
      if (!Number.isFinite(congestionPercent)) return;

      const bucket = bucketMap.get(programId) || { sum: 0, count: 0 };
      bucket.sum += congestionPercent;
      bucket.count += 1;
      bucketMap.set(programId, bucket);
    });

    const averageMap = new Map();
    bucketMap.forEach((bucket, programId) => {
      if (!bucket || bucket.count <= 0) return;
      averageMap.set(programId, clamp(Math.round(bucket.sum / bucket.count), 0, 100));
    });

    return averageMap;
  }, [measuredCongestions]);

  const allProgramRows = useMemo(() => {
    const now = Date.now();
    return toArray(programRows)
      .map((program) => {
        const programId = Number(program?.programId);
        if (!Number.isFinite(programId)) return null;

        const startDate = toValidDate(program?.startAt);
        const endDate = toValidDate(program?.endAt);
        const isOperatingNow =
          startDate && endDate
            ? startDate.getTime() <= now && now <= endDate.getTime()
            : true;

        const rawWaitCount = getFirstDefinedFiniteNumber(program?.experienceWait?.waitCount);
        const rawWaitMin = getFirstDefinedFiniteNumber(program?.experienceWait?.waitMin);
        const aiPredictedWaitMin = getFirstDefinedFiniteNumber(
          program?.aiPrediction?.waitMinutes,
          program?.aiPrediction?.predictedWaitMinutes,
        );
        const aiPredictedCongestion = getFirstDefinedFiniteNumber(
          program?.aiPrediction?.avgScore,
          program?.aiPrediction?.peakScore,
          program?.aiPrediction?.predictedAvgScore,
          program?.aiPrediction?.predictedPeakScore,
        );
        const waitCount = Math.max(0, Math.round(rawWaitCount ?? 0));
        const waitMin = Math.max(0, Math.round((aiPredictedWaitMin ?? rawWaitMin) ?? 0));
        const hasWaitInfo = Boolean(program?.experienceWait) || aiPredictedWaitMin !== null;
        const totalVisitorCount = resolveProgramVisitorCount(program);
        const totalParticipantCount = resolveProgramParticipantCount(program);
        const operatingMinutes =
          startDate && endDate && endDate.getTime() > startDate.getTime()
            ? Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 60000))
            : 60;
        const visitorsPerHour = Math.round(
          (totalVisitorCount / Math.max(operatingMinutes / 60, 1 / 60)) * 10,
        ) / 10;
        const mappedCongestionEntry = programCongestionMap.get(programId);
        const mappedMeasuredAt = safeNumber(mappedCongestionEntry?.measuredAt, 0);
        const isMappedCongestionFresh =
          mappedMeasuredAt > 0 && now - mappedMeasuredAt <= PROGRAM_CONGESTION_FRESHNESS_MS;
        const mappedCongestion = isMappedCongestionFresh
          ? mappedCongestionEntry?.congestionPercent
          : null;
        const congestionPercent = safePercent(
          mappedCongestion ?? aiPredictedCongestion ?? deriveCongestionPercentFromWait(waitCount, waitMin),
        );
        const rawAverageWaitMin = resolveProgramAverageWaitMin(program);
        const measuredAverageCongestion = programAverageCongestionMap.get(programId);
        const estimatedAverageWaitFromMeasured = Number.isFinite(measuredAverageCongestion)
          ? estimateWaitMinutes(measuredAverageCongestion)
          : null;
        const estimatedAverageWaitFromTraffic = totalVisitorCount > 0
          ? estimateWaitMinutes(safePercent(Math.round(visitorsPerHour * 5)))
          : null;
        const aiAverageWaitMin = Number.isFinite(aiPredictedWaitMin) && aiPredictedWaitMin > 0
          ? Math.round(aiPredictedWaitMin)
          : null;
        const averageWaitMin =
          rawAverageWaitMin ??
          aiAverageWaitMin ??
          estimatedAverageWaitFromMeasured ??
          (isEndedEvent ? estimatedAverageWaitFromTraffic : null) ??
          estimateWaitMinutes(congestionPercent);
        const tone = resolveCongestionMeta(congestionPercent);
        const waitCategory = resolveProgramWaitCategory(waitMin);

        return {
          key: `program-${programId}`,
          programId,
          name: program?.programTitle || `프로그램 ${programId}`,
          timeLabel: formatProgramTimeRange(program?.startAt, program?.endAt),
          waitCount,
          waitMin,
          averageWaitMin,
          totalVisitorCount,
          totalParticipantCount,
          operatingMinutes,
          visitorsPerHour,
          congestionPercent,
          guideText: getPetEventGuideText(waitCategory),
          tone,
          waitCategory,
          hasWaitInfo,
          isOperatingNow,
        };
      })
      .filter(Boolean);
  }, [isEndedEvent, programAverageCongestionMap, programCongestionMap, programRows]);

  const programNameMap = useMemo(
    () =>
      new Map(
        allProgramRows.map((program) => [program.programId, program.name]),
      ),
    [allProgramRows],
  );

  const operatingProgramRows = useMemo(
    () =>
      isEndedEvent
        ? allProgramRows
        : allProgramRows.filter((program) => program.isOperatingNow),
    [allProgramRows, isEndedEvent],
  );

  const queueProgramRows = useMemo(
    () => operatingProgramRows.filter((program) => program.hasWaitInfo),
    [operatingProgramRows],
  );

  const popularTopPrograms = useMemo(
    () => {
      if (isEndedEvent) {
        return [...allProgramRows]
          .sort(
            (left, right) => {
              if (endedPopularSortKey === "totalVisitors") {
                return (
                  right.totalVisitorCount - left.totalVisitorCount ||
                  right.visitorsPerHour - left.visitorsPerHour ||
                  left.operatingMinutes - right.operatingMinutes ||
                  right.averageWaitMin - left.averageWaitMin ||
                  right.congestionPercent - left.congestionPercent ||
                  String(left.name).localeCompare(String(right.name), "ko-KR")
                );
              }

              if (endedPopularSortKey === "avgWait") {
                return (
                  right.averageWaitMin - left.averageWaitMin ||
                  right.totalVisitorCount - left.totalVisitorCount ||
                  right.visitorsPerHour - left.visitorsPerHour ||
                  right.congestionPercent - left.congestionPercent ||
                  String(left.name).localeCompare(String(right.name), "ko-KR")
                );
              }

              return (
                right.visitorsPerHour - left.visitorsPerHour ||
                right.totalVisitorCount - left.totalVisitorCount ||
                left.operatingMinutes - right.operatingMinutes ||
                right.averageWaitMin - left.averageWaitMin ||
                right.congestionPercent - left.congestionPercent ||
                String(left.name).localeCompare(String(right.name), "ko-KR")
              );
            },
          )
          .slice(0, 9);
      }

      return [...queueProgramRows]
        .sort(
          (left, right) =>
            right.waitMin - left.waitMin ||
            right.waitCount - left.waitCount ||
            right.congestionPercent - left.congestionPercent ||
            String(left.name).localeCompare(String(right.name), "ko-KR"),
        )
        .slice(0, 3);
    },
    [allProgramRows, endedPopularSortKey, isEndedEvent, queueProgramRows],
  );

  const popularTopProgramIds = useMemo(
    () => new Set(popularTopPrograms.map((program) => program.programId)),
    [popularTopPrograms],
  );

  const readyPrograms = useMemo(() => {
    if (isEndedEvent) {
      return [...allProgramRows]
        .sort(
          (left, right) =>
            right.totalParticipantCount - left.totalParticipantCount ||
            right.totalVisitorCount - left.totalVisitorCount ||
            right.averageWaitMin - left.averageWaitMin ||
            String(left.name).localeCompare(String(right.name), "ko-KR"),
        )
        .slice(0, 9);
    }

    const candidates = queueProgramRows
      .filter((program) => !popularTopProgramIds.has(program.programId))
      .sort(
        (left, right) =>
          left.waitMin - right.waitMin ||
          left.waitCount - right.waitCount ||
          left.congestionPercent - right.congestionPercent ||
          String(left.name).localeCompare(String(right.name), "ko-KR"),
      );

    const shortWaitCandidates = candidates.filter(
      (program) => program.waitMin <= 10,
    );

    if (shortWaitCandidates.length > 0) {
      return shortWaitCandidates;
    }

    return candidates;
  }, [allProgramRows, isEndedEvent, popularTopProgramIds, queueProgramRows]);

  const currentVisitors = isPlannedEvent ? 0 : performance.checkin;
  const totalParticipants = Math.max(0, safeNumber(performance.approved));

  const currentCongestion = resolvedCurrentCongestion;
  const plannedAverageCongestion = useMemo(() => {
    if (!isPlannedEvent) return safePercent(currentCongestion);
    return safePercent(currentCongestion);
  }, [currentCongestion, isPlannedEvent]);

  const currentTone = useMemo(
    () => resolveCongestionMeta(currentCongestion),
    [currentCongestion],
  );

  const expectedWaitMinutes = useMemo(() => {
    const currentBasedWait = estimateWaitMinutes(currentCongestion);
    if (isEndedEvent) {
      return currentBasedWait;
    }
    if (isTodayForecast && !isPlannedEvent) {
      return currentBasedWait;
    }
    const predictedWait = Number(eventPrediction?.waitMinutes);
    if (Number.isFinite(predictedWait) && predictedWait >= 0) {
      return Math.round(predictedWait);
    }
    return currentBasedWait;
  }, [currentCongestion, eventPrediction?.waitMinutes, isEndedEvent, isPlannedEvent, isTodayForecast]);

  const waitKpiLabel = isEndedEvent
    ? "종료 시점 예상 대기시간"
    : isPlannedEvent
      ? "가장 여유로운 행사일"
      : isTodayForecast && !isPlannedEvent
      ? "현재 예상 대기시간"
      : "예상 대기시간";

  const congestionSummaryText = useMemo(
    () => getCongestionSummaryText(currentCongestion),
    [currentCongestion],
  );
  const waitSummaryText = useMemo(
    () => getWaitSummaryText(expectedWaitMinutes),
    [expectedWaitMinutes],
  );
  const visitorMoodText = useMemo(
    () => getVisitorMoodText(currentVisitors, isPlannedEvent),
    [currentVisitors, isPlannedEvent],
  );
  const endedCongestionSummaryText = useMemo(() => {
    const pct = safePercent(currentCongestion);
    if (pct <= 30) return "행사 전반 평균 기준 여유로운 수준이었습니다.";
    if (pct <= 60) return "행사 전반 평균 기준 보통 수준이었습니다.";
    if (pct <= 80) return "행사 전반에 혼잡한 구간이 있었습니다.";
    return "행사 전반에 매우 혼잡한 구간이 많았습니다.";
  }, [currentCongestion]);
  const endedStatusSummaryText = useMemo(
    () => `행사 전반 평균 혼잡 상태는 ${currentTone.label} 수준이었습니다.`,
    [currentTone.label],
  );

  const heroStats = useMemo(() => {
    if (isEndedEvent) {
      return [
        {
          label: "평균 혼잡도",
          value: currentCongestion,
          unit: "%",
          sub: endedCongestionSummaryText,
        },
        {
          label: "행사 전체 참가자수",
          value: totalParticipants,
          unit: "명",
          sub: "행사 전체 참가 등록 기준 집계입니다.",
        },
        {
          label: "혼잡 상태",
          value: currentTone.label,
          unit: "",
          sub: endedStatusSummaryText,
          textOnly: true,
        },
      ];
    }

    return [
      {
        label: isPlannedEvent ? "예상 혼잡도" : "현재 혼잡도",
        value: isPlannedEvent ? plannedAverageCongestion : currentCongestion,
        unit: "%",
        sub: isPlannedEvent
          ? `행사일 전체 예상 혼잡도 평균은 ${plannedAverageCongestion}%예요.`
          : congestionSummaryText,
      },
      {
        label: isPlannedEvent ? "예상 방문자" : waitKpiLabel,
        value: isPlannedEvent ? totalParticipants : expectedWaitMinutes,
        unit: isPlannedEvent ? "명" : "분",
        sub: isPlannedEvent
          ? `사전 등록 기준 예상 방문자 수는 ${totalParticipants.toLocaleString("ko-KR")}명입니다.`
          : waitSummaryText,
      },
      {
        label: "혼잡 상태",
        value: currentTone.label,
        unit: "",
        sub: currentTone.sentence,
        textOnly: true,
      },
    ];
  }, [
    congestionSummaryText,
    currentCongestion,
    currentTone.label,
    currentTone.sentence,
    endedCongestionSummaryText,
    endedStatusSummaryText,
    expectedWaitMinutes,
    isEndedEvent,
    isPlannedEvent,
    plannedAverageCongestion,
    totalParticipants,
    waitKpiLabel,
    waitSummaryText,
  ]);

  const calibratedTimeline = useMemo(() => {
    const source = Array.isArray(chartTimeline) ? chartTimeline : [];
    if (source.length === 0) return [];

    const withTone = (point, score) => {
      const normalizedScore = safePercent(score);
      const meta = resolveCongestionMeta(normalizedScore);
      return {
        ...point,
        score: normalizedScore,
        label: meta.label,
        tone: {
          color: meta.color,
          bg: meta.bg,
          border: meta.border,
        },
      };
    };

    if (!isTodayForecast) {
      return source.map((point) => withTone(point, point?.score));
    }

    const nowHour = normalizeHour(new Date().getHours());
    const latestActualRow = [...hours]
      .filter((row) => Number.isFinite(row?.actual) && Number(row?.h) <= nowHour)
      .sort((left, right) => Number(left.h) - Number(right.h))
      .pop();

    if (!latestActualRow || !Number.isFinite(latestActualRow.actual)) {
      return source.map((point) => withTone(point, point?.score));
    }

    const latestActualHour = Number(latestActualRow.h);
    const anchorCandidate =
      source
        .map((point) => ({
          point,
          hour: toHour(point?.time),
          score: safePercent(point?.score),
        }))
        .filter((candidate) => Number.isFinite(candidate.hour))
        .filter((candidate) => candidate.hour >= latestActualHour)
        .sort((left, right) => left.hour - right.hour)[0] ||
      source
        .map((point) => ({
          point,
          hour: toHour(point?.time),
          score: safePercent(point?.score),
        }))
        .filter((candidate) => Number.isFinite(candidate.hour) && Number.isFinite(candidate.score))
        .sort((left, right) => left.hour - right.hour)[0] ||
      null;

    const predictionOffset =
      anchorCandidate && Number.isFinite(anchorCandidate.score)
        ? latestActualRow.actual - anchorCandidate.score
        : 0;

    return source.map((point) => {
      const pointHour = toHour(point?.time);
      const baseScore = safePercent(point?.score);
      if (!Number.isFinite(pointHour) || pointHour < latestActualHour) {
        return withTone(point, baseScore);
      }
      return withTone(point, clamp(Math.round(baseScore + predictionOffset), 0, 100));
    });
  }, [chartTimeline, hours, isTodayForecast]);

  const aiTimelinePreview = useMemo(
    () => calibratedTimeline.slice(0, 8),
    [calibratedTimeline],
  );

  const nextPeakPoint = useMemo(() => {
    if (isEndedEvent) {
      if (!endedHourlyInsights.overallPeak || !Number.isFinite(endedHourlyInsights.overallPeak.score)) {
        return null;
      }
      return {
        time: endedHourlyInsights.overallPeak.hourLabel,
        score: endedHourlyInsights.overallPeak.score,
      };
    }
    if (isPlannedEvent) {
      if (!plannedPeakDayPoint) return null;
      return {
        time: plannedPeakDayPoint.xLabel || "--.--",
        score: safePercent(plannedPeakDayPoint.predicted ?? plannedPeakDayPoint.v),
      };
    }
    if (aiTimelinePreview.length === 0) return null;
    return [...aiTimelinePreview].sort(
      (left, right) => (Number(right?.score) || 0) - (Number(left?.score) || 0),
    )[0];
  }, [aiTimelinePreview, endedHourlyInsights.overallPeak, isEndedEvent, isPlannedEvent, plannedPeakDayPoint]);

  const aiCurrentScore = useMemo(() => {
    if (isEndedEvent) {
      return safePercent(currentCongestion);
    }
    if (isPlannedEvent) {
      if (plannedRelaxedDayPoint) {
        return safePercent(plannedRelaxedDayPoint.predicted ?? plannedRelaxedDayPoint.v);
      }
      return safePercent(currentCongestion);
    }
    if (isTodayForecast && !isPlannedEvent) {
      return safePercent(currentCongestion);
    }

    const timelineScores = calibratedTimeline
      .map((point) => safePercent(point?.score))
      .filter(Number.isFinite);
    if (timelineScores.length > 0) {
      const sum = timelineScores.reduce((acc, score) => acc + score, 0);
      return safePercent(Math.round(sum / timelineScores.length));
    }

    return safePercent(eventPrediction?.avgScore ?? currentCongestion);
  }, [
    calibratedTimeline,
    currentCongestion,
    eventPrediction?.avgScore,
    isEndedEvent,
    isPlannedEvent,
    isTodayForecast,
    plannedRelaxedDayPoint,
  ]);
  const aiCurrentTone = resolveCongestionMeta(aiCurrentScore);
  const aiSoonScore = safePercent(
    nextPeakPoint?.score ??
      (isEndedEvent
        ? aiCurrentScore
        : (isTodayForecast ? aiCurrentScore : eventPrediction?.peakScore)) ??
      aiCurrentScore,
  );
  const aiSoonTone = resolveCongestionMeta(aiSoonScore);
  const aiSoonWait = estimateWaitMinutes(aiSoonScore);
  const currentWaitCategory = resolveProgramWaitCategory(expectedWaitMinutes);
  const soonWaitCategory = resolveProgramWaitCategory(aiSoonWait);
  const endedRelaxedScore = safePercent(endedHourlyInsights?.overallRelaxed?.score ?? 0);
  const endedRelaxedTone = resolveCongestionMeta(endedRelaxedScore);
  const hasEndedRelaxedInsight = Number.isFinite(endedHourlyInsights?.overallRelaxed?.score);
  const plannedRelaxedScore = safePercent(
    plannedRelaxedDayPoint?.predicted ?? plannedRelaxedDayPoint?.v ?? aiCurrentScore,
  );
  const plannedPeakScore = safePercent(
    plannedPeakDayPoint?.predicted ?? plannedPeakDayPoint?.v ?? aiSoonScore,
  );
  const plannedAverageScore = plannedAverageCongestion;
  const plannedRelaxedDayLabel = plannedRelaxedDayPoint?.xLabel || "--.--";
  const plannedPeakDayLabel = plannedPeakDayPoint?.xLabel || "--.--";
  const plannedAverageTone = resolveCongestionMeta(plannedAverageScore);
  const plannedRelaxedTone = resolveCongestionMeta(plannedRelaxedScore);
  const plannedPeakTone = resolveCongestionMeta(plannedPeakScore);

  const chartGuideText = useMemo(() => {
    if (isEndedEvent) {
      if (dailyCongestionPoints.length === 0) {
        return "행사 기간 날짜별 혼잡도 데이터를 집계 중입니다.";
      }
      const mostBusyDay = [...dailyCongestionPoints].sort(
        (left, right) => (Number(right?.actual) || 0) - (Number(left?.actual) || 0),
      )[0];
      if (!mostBusyDay || !Number.isFinite(mostBusyDay.actual)) {
        return "행사 기간 날짜별 혼잡 추이를 확인할 수 있습니다.";
      }
      const dayLabel = mostBusyDay.xLabel || "--.--";
      return `행사 기간 중 ${dayLabel}에 평균 혼잡도가 가장 높았습니다.`;
    }

    if (isPlannedEvent) {
      if (plannedDailyForecastPoints.length === 0) {
        return "행사일별 예상 혼잡도를 집계 중입니다.";
      }
      const mostBusyDay = [...plannedDailyForecastPoints].sort(
        (left, right) => (Number(right?.predicted ?? right?.v) || 0) - (Number(left?.predicted ?? left?.v) || 0),
      )[0];
      if (!mostBusyDay) {
        return "행사 기간 예상 혼잡도를 계산 중입니다.";
      }
      const dayLabel = mostBusyDay.xLabel || "--.--";
      return `행사 기간 중 ${dayLabel} 예상 혼잡도가 가장 높아요.`;
    }

    if (eventPrediction && aiSoonScore >= aiCurrentScore + 10) {
      return "지금보다 1시간 뒤 더 붐빌 수 있어요. 인기 프로그램은 조금 일찍 이동하는 것을 추천해요.";
    }
    if (eventPrediction && aiSoonScore <= aiCurrentScore - 10) {
      return "조금 뒤에는 더 여유로워질 가능성이 있어요. 천천히 둘러보며 이동해도 좋아요.";
    }
    const afternoonBusy = hours.some((item) => {
      const hour = Number(item?.h);
      return Number.isFinite(hour) && hour >= 14 && hour <= 18 && safePercent(item?.v) >= 60;
    });
    if (afternoonBusy) {
      return "오후 시간대 방문객이 늘어나는 경향이 있어요. 원하는 프로그램을 먼저 확인해 보세요.";
    }
    return "혼잡도가 낮은 시간대를 골라 이동하면 더 편하게 즐길 수 있어요.";
  }, [aiCurrentScore, aiSoonScore, dailyCongestionPoints, eventPrediction, hours, isEndedEvent, isPlannedEvent, plannedDailyForecastPoints]);

  const activities = useMemo(() => {
    if (isPlannedEvent) return [];

    const liveItems = [...measuredCongestions]
      .sort((left, right) => {
        const leftTime = left.measuredAt ? new Date(left.measuredAt).getTime() : 0;
        const rightTime = right.measuredAt ? new Date(right.measuredAt).getTime() : 0;
        return rightTime - leftTime;
      })
      .slice(0, 6)
      .map((row) => {
        const programId = Number(row?.programId);
        const programName = Number.isFinite(programId) ? programNameMap.get(programId) : null;
        return {
          time: formatTime(row.measuredAt),
          text: `${programName || row.placeName || "현장 프로그램"} 혼잡도가 ${safePercent(row.congestionPercent)}%로 갱신되었습니다.`,
          color: getActivityColor(safePercent(row.congestionPercent)),
        };
      });

    if (liveItems.length > 0) return liveItems;

    return congestionRows.slice(0, 6).map((row) => ({
      time: "--:--",
      text: `${row.placeName || "현장 프로그램"}의 실시간 혼잡 데이터를 수집 중입니다.`,
      color: "#9ca3af",
    }));
  }, [congestionRows, isPlannedEvent, measuredCongestions, programNameMap]);

  const timelineVisible = useStaggerIn(activities.length, 100);

  const badge = STATUS_BADGE[String(eventDetail?.status).toUpperCase()] || STATUS_BADGE.PLANNED;
  const eventName = eventDetail?.eventName || "행사 정보 없음";
  const heroVisitorSummary = isEndedEvent
    ? ""
    : `현재 방문객 ${currentVisitors.toLocaleString()}명 · ${visitorMoodText}`;
  const heroVisitorSummaryForDisplay = isPlannedEvent && !isEndedEvent
    ? `사전 등록자 ${totalParticipants.toLocaleString("ko-KR")}명 · ${visitorMoodText}`
    : heroVisitorSummary;
  const endedRelaxedTimeLabel = endedHourlyInsights?.overallRelaxed?.hourLabel || "--:--";
  const soonPeakTimeLabel = isEndedEvent
    ? nextPeakPoint?.time || "가장 혼잡했던 시간대"
    : isPlannedEvent
      ? nextPeakPoint?.time || "가장 인기있는 행사일"
      : nextPeakPoint?.time
      ? `${formatKoreanTime(nextPeakPoint.time)} 무렵`
      : "가까운 시간대";
  const hasAnyPrograms = allProgramRows.length > 0;
  const hasOperatingPrograms = operatingProgramRows.length > 0;
  const hasQueuePrograms = queueProgramRows.length > 0;
  const readyProgramSectionTitle = isEndedEvent
    ? "가장 참가자가 많은 프로그램 TOP9"
    : "지금 참여하기 좋은 프로그램";
  const predictionCardTitle = isEndedEvent
    ? "행사 혼잡도"
    : "지금 행사장은 얼마나 붐빌까요?";
  const predictionChartModeLabel = isEndedEvent
    ? (hasEndedMeasuredCongestionData ? "날짜별 실제 혼잡도" : "날짜별 추정 혼잡도")
    : isPlannedEvent
      ? "행사일별 예상 혼잡도"
      : isTodayForecast
      ? "실시간 + AI 예측"
      : isPastForecast
        ? "실제 혼잡도"
        : "AI 예측";
  const predictionTrendTitle = isEndedEvent ? "날짜별 혼잡도" : "시간대별 혼잡도";
  const predictionCardTag = isEndedEvent ? "날짜별 혼잡도" : "시간대별 혼잡도";
  const chartPointsForDisplay = isEndedEvent ? dailyCongestionPoints : isPlannedEvent ? plannedDailyForecastPoints : hours;
  const showForecastCalendar = forecastDateOptions.length > 0 && !isEndedEvent && !isPlannedEvent;
  const showPredictedLegend = !isPastForecast && !isEndedEvent;

  if (loading && !eventDetail) {
    return (
      <div className="rt-card">
        <div className="rt-empty">
          <span className="rt-empty-strong">행사 실시간 정보를 불러오는 중입니다</span>
          현재 혼잡도와 대기시간을 계산하고 있습니다.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rt-page-shell">
        <div className="rt-live-header">
          <div className="rt-live-header-left">
            <div className={`rt-live-badge ${badge.className}`}>
              <div className={`rt-live-dot${badge.showDot ? "" : " placeholder"}`} />
              {badge.label}
            </div>
          </div>

          <div className="rt-live-header-right">
            <span className="rt-timestamp">
              마지막 갱신: {formatTimestamp(lastLoadedAt)}
            </span>
            <button className="rt-refresh-btn" onClick={refresh} title="새로고침">
              <RefreshCw
                size={14}
                style={{
                  animation: spinning
                    ? "anim-spin 0.8s cubic-bezier(0.4,0,0.2,1)"
                    : "none",
                }}
              />
            </button>
          </div>
        </div>

        {errorMsg ? <div className="rt-error">{errorMsg}</div> : null}

        <section className="rt-hero">
        <div className="rt-hero-top">
          <div className="rt-hero-main">
            <h1 className="rt-hero-title">{eventName}</h1>
            <div className="rt-hero-meta">
              <span className="rt-hero-meta-item">
                <CalendarDays size={13} />
                {formatDateRange(eventDetail?.startAt, eventDetail?.endAt)}
              </span>
              <span className="rt-hero-meta-item">
                <MapPin size={13} />
                {eventDetail?.location || "장소 정보 없음"}
              </span>
            </div>
            {heroVisitorSummaryForDisplay ? <div className="rt-hero-note">{heroVisitorSummaryForDisplay}</div> : null}
          </div>
          <div className="rt-hero-kpi-grid">
            {heroStats.map((item) => (
              <div key={item.label} className="rt-hero-kpi">
                <div className="rt-hero-kpi-label">{item.label}</div>
                <div className={`rt-hero-kpi-value${item.textOnly ? " text" : ""}`}>
                  {item.value}
                  {item.unit ? <span className="rt-hero-kpi-unit">{item.unit}</span> : null}
                </div>
                <div className="rt-hero-kpi-sub">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="rt-card">
        <div className="rt-card-header">
          <div className="rt-card-title">
            <div className="rt-card-title-icon">
              <TrendingUp size={14} color="#dc2626" />
            </div>
            {isEndedEvent
              ? "인기 프로그램 TOP9"
              : "인기 프로그램 TOP3"}
          </div>
          {isEndedEvent ? (
            <div className="rt-ended-sort-group" role="group" aria-label="인기 프로그램 정렬">
              {ENDED_POPULAR_SORT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`rt-ended-sort-btn${endedPopularSortKey === option.key ? " active" : ""}`}
                  onClick={() => setEndedPopularSortKey(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : (
            <span className="rt-card-tag">예상 대기시간 긴 순</span>
          )}
        </div>

        {!hasAnyPrograms || !hasOperatingPrograms ? (
          <div className="rt-empty">
            <span className="rt-empty-strong">
              {isEndedEvent ? "종료 시점 프로그램 데이터가 없습니다" : "운영 중인 프로그램이 없습니다"}
            </span>
            {isEndedEvent
              ? "행사 종료 데이터가 집계되면 인기 프로그램 정보를 표시합니다."
              : "운영 시간이 시작되면 인기 프로그램 정보가 표시됩니다."}
          </div>
        ) : !isEndedEvent && !hasQueuePrograms ? (
          <div className="rt-empty">
            <span className="rt-empty-strong">
              {isEndedEvent ? "종료 시점 대기 정보가 없습니다" : "아직 집계된 대기 정보가 없습니다"}
            </span>
            {isEndedEvent
              ? "행사 종료 이후에는 신규 대기 집계가 갱신되지 않습니다."
              : "대기 정보가 수집되면 인기 프로그램을 보여드릴게요."}
          </div>
        ) : (
          <div className="rt-program-grid rt-program-grid-top3">
            {popularTopPrograms.map((item, index) => {
              const waitCategory = item.waitCategory ?? resolveProgramWaitCategory(item.waitMin);
              return (
                <ProgramCrowdCard
                  key={`top3-${item.key}`}
                  item={item}
                  badgeText={isEndedEvent ? `TOP${index + 1}` : waitCategory.label}
                  badgeStyle={
                    isEndedEvent
                      ? {
                        color: "#991b1b",
                        background: "#fee2e2",
                        borderColor: "#fecaca",
                      }
                      : waitCategory.style
                  }
                  metricItems={
                    isEndedEvent
                      ? [
                        {
                          label: "시간당 방문자수",
                          value: `${item.visitorsPerHour.toLocaleString("ko-KR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}명`,
                        },
                        {
                          label: "총 방문자수",
                          value: `${item.totalVisitorCount.toLocaleString()}명`,
                        },
                        {
                          label: "평균 대기시간",
                          value: `${item.averageWaitMin}분`,
                        },
                      ]
                      : null
                  }
                  guideText={isEndedEvent ? "" : getPetEventGuideText(waitCategory)}
                />
              );
            })}
          </div>
        )}
      </div>

      {!isEndedEvent ? (
        <div className="rt-card">
          <div className="rt-card-header">
            <div className="rt-card-title">
              <div className="rt-card-title-icon">
                <Radio size={14} color="#10b981" />
              </div>
              {readyProgramSectionTitle}
            </div>
            <span className="rt-card-tag">예상 대기시간 짧은 순</span>
          </div>

          {!hasAnyPrograms || !hasOperatingPrograms ? (
            <div className="rt-empty">
              <span className="rt-empty-strong">운영 중인 프로그램이 없습니다</span>
              운영 시간이 시작되면 참여 가능한 프로그램이 표시됩니다.
            </div>
          ) : !hasQueuePrograms ? (
            <div className="rt-empty">
              <span className="rt-empty-strong">아직 집계된 대기 정보가 없습니다</span>
              잠시 후 다시 확인해 주세요.
            </div>
          ) : readyPrograms.length === 0 ? (
            <div className="rt-empty">
              <span className="rt-empty-strong">지금 참여하기 좋은 프로그램이 없습니다</span>
              현재는 인기 프로그램 쪽으로 방문이 몰리고 있어요.
            </div>
          ) : (
            <div className="rt-program-grid rt-program-grid-top3 rt-ready-program-scroll">
              {readyPrograms.map((item) => {
                const waitCategory = item.waitCategory ?? resolveProgramWaitCategory(item.waitMin);
                const readyLabel = getReadyProgramLabel(item.waitCount, item.waitMin);
                return (
                  <ProgramCrowdCard
                    key={`ready-${item.key}`}
                    item={{ ...item, guideText: getPetEventGuideText(waitCategory) }}
                    badgeText={readyLabel}
                    badgeStyle={waitCategory.style}
                    guideText={getPetEventGuideText(waitCategory)}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      <div className="rt-card">
        <div className="rt-card-header">
          <div className="rt-card-title">
            <div className="rt-card-title-icon">
              <BarChart2 size={14} color="#1a4fd6" />
            </div>
            {predictionCardTitle}
          </div>
          <div className="rt-card-controls">
            <div className="rt-prediction-meta-strip rt-prediction-meta-strip--header">
              {isEndedEvent ? (
                <>
                  <span className="rt-prediction-meta-pill">
                    집계 기간: {formatDateRange(eventDetail?.startAt, eventDetail?.endAt)}
                  </span>
                  <span className="rt-prediction-meta-pill">
                    집계 일수: {dailyCongestionPoints.length}일
                  </span>
                  <span className="rt-prediction-meta-pill">
                    기준: {hasEndedMeasuredCongestionData ? "실제 혼잡도" : "참가 데이터 추정"}
                  </span>
                </>
              ) : (
                <>
                  <span className="rt-prediction-meta-pill">
                    예측 기준: {formatKoreanTime(eventPrediction?.baseTime) || "-"}
                  </span>
                  <span className="rt-prediction-meta-pill">
                    신뢰도:{" "}
                    {eventPrediction
                      ? `${Math.round(safeNumber(eventPrediction.confidence, 0) * 100)}%`
                      : "집계 중"}
                  </span>
                  <span className="rt-prediction-meta-pill">
                    {eventPrediction
                      ? eventPrediction.fallbackUsed
                        ? "보정 예측 적용"
                        : "AI 예측 반영"
                      : "AI 예측 준비 중"}
                  </span>
                </>
              )}
            </div>
            <span className="rt-card-tag">{isEndedEvent || isPlannedEvent ? "행사일별 혼잡도" : predictionCardTag}</span>
            {showForecastCalendar ? (
              <div className="rt-calendar-control">
                <CalendarDays size={13} />
                <span>달력</span>
                <input
                  className="rt-date-input"
                  type="date"
                  value={activeForecastDateKey || forecastDateOptions[0]}
                  min={forecastDateOptions[0]}
                  max={forecastDateOptions[forecastDateOptions.length - 1]}
                  onChange={handleForecastDateChange}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="rt-prediction-section">
          <div className="rt-prediction-kpi-grid">
            <div className="rt-prediction-kpi">
              <div className="rt-prediction-kpi-label">
                {isEndedEvent ? "행사 전반 평균 혼잡도" : isFutureForecast ? "예상 혼잡도" : "현재 혼잡도"}
              </div>
              <div className="rt-prediction-kpi-value">
                {isPlannedEvent ? plannedAverageScore : aiCurrentScore}
                <span className="rt-prediction-kpi-unit">%</span>
              </div>
              <div className="rt-prediction-kpi-desc">
                {isEndedEvent
                  ? aiCurrentTone.sentence
                  : isPlannedEvent
                    ? `행사일 전체 예상 혼잡도 평균은 ${plannedAverageScore}%예요.`
                    : currentWaitCategory.guideText}
              </div>
              <span
                className="rt-prediction-kpi-badge"
                style={{
                  color: isEndedEvent
                    ? aiCurrentTone.color
                    : isPlannedEvent
                      ? plannedAverageTone.color
                      : currentWaitCategory.style.color,
                  background: isEndedEvent
                    ? aiCurrentTone.bg
                    : isPlannedEvent
                      ? plannedAverageTone.bg
                      : currentWaitCategory.style.background,
                  borderColor: isEndedEvent
                    ? aiCurrentTone.border
                    : isPlannedEvent
                      ? plannedAverageTone.border
                      : currentWaitCategory.style.borderColor,
                }}
              >
                {isEndedEvent
                  ? aiCurrentTone.label
                  : isPlannedEvent
                    ? plannedAverageTone.label
                    : currentWaitCategory.label}
              </span>
            </div>

            <div className="rt-prediction-kpi">
              <div className="rt-prediction-kpi-label">
                {isEndedEvent ? "가장 여유로운 시간대" : waitKpiLabel}
              </div>
              <div className={`rt-prediction-kpi-value${isPlannedEvent && !isEndedEvent ? " with-day" : ""}`}>
                {isEndedEvent
                  ? endedRelaxedTimeLabel
                  : isPlannedEvent
                    ? (
                      <>
                        <span className="rt-prediction-kpi-score">{plannedRelaxedScore}%</span>
                        <span className="rt-prediction-kpi-day">{plannedRelaxedDayLabel}</span>
                      </>
                    )
                    : expectedWaitMinutes}
                {isEndedEvent || isPlannedEvent ? null : <span className="rt-prediction-kpi-unit">분</span>}
              </div>
              <div className="rt-prediction-kpi-desc">
                {isEndedEvent
                  ? hasEndedRelaxedInsight
                    ? `${endedRelaxedTimeLabel}에 가장 여유로웠습니다. 평균 혼잡도 ${endedRelaxedScore}%`
                    : "행사 전반 여유 시간대를 집계 중입니다."
                  : isPlannedEvent
                    ? "행사일 중 가장 여유로울 것으로 예상돼요."
                    : waitSummaryText}
              </div>
              <span
                className="rt-prediction-kpi-badge"
                style={{
                  color: isEndedEvent
                    ? endedRelaxedTone.color
                    : isPlannedEvent
                      ? plannedRelaxedTone.color
                      : currentWaitCategory.style.color,
                  background: isEndedEvent
                    ? endedRelaxedTone.bg
                    : isPlannedEvent
                      ? plannedRelaxedTone.bg
                      : currentWaitCategory.style.background,
                  borderColor: isEndedEvent
                    ? endedRelaxedTone.border
                    : isPlannedEvent
                      ? plannedRelaxedTone.border
                      : currentWaitCategory.style.borderColor,
                }}
              >
                {isEndedEvent
                  ? hasEndedRelaxedInsight
                    ? `${endedRelaxedTone.label} 시간대`
                    : "집계 중"
                  : isPlannedEvent
                    ? plannedRelaxedTone.label
                    : `${currentWaitCategory.label} 구간`}
              </span>
            </div>

            <div className="rt-prediction-kpi">
              <div className="rt-prediction-kpi-label">{isEndedEvent ? "가장 인기있는 시간대" : isPlannedEvent ? "가장 인기있는 행사" : "곧 예상되는 변화"}</div>
              <div className={`rt-prediction-kpi-value${isPlannedEvent && !isEndedEvent ? " with-day" : ""}`}>
                {isEndedEvent
                  ? soonPeakTimeLabel
                  : isPlannedEvent
                    ? (
                      <>
                        <span className="rt-prediction-kpi-score">{plannedPeakScore}%</span>
                        <span className="rt-prediction-kpi-day">{plannedPeakDayLabel}</span>
                      </>
                    )
                    : aiSoonScore}
                {isEndedEvent || isPlannedEvent ? null : <span className="rt-prediction-kpi-unit">%</span>}
              </div>
              <div className="rt-prediction-kpi-desc">
                {isEndedEvent
                  ? nextPeakPoint
                    ? `${soonPeakTimeLabel}가 행사 전반에서 가장 혼잡했습니다. 평균 혼잡도 ${aiSoonScore}%`
                    : "행사 전반 혼잡도 데이터를 집계 중입니다."
                  : isPlannedEvent
                    ? "행사일 중 가장 인기있을 것으로 예상돼요."
                    : eventPrediction
                    ? `${soonPeakTimeLabel}에는 ${soonWaitCategory.label} 예상 · 약 ${aiSoonWait}분`
                    : "예측 데이터가 준비되면 다음 혼잡 변화를 안내해 드려요."}
              </div>
              <span
                className="rt-prediction-kpi-badge"
                style={{
                  color: isEndedEvent
                    ? aiSoonTone.color
                    : isPlannedEvent
                      ? plannedPeakTone.color
                      : soonWaitCategory.style.color,
                  background: isEndedEvent
                    ? aiSoonTone.bg
                    : isPlannedEvent
                      ? plannedPeakTone.bg
                      : soonWaitCategory.style.background,
                  borderColor: isEndedEvent
                    ? aiSoonTone.border
                    : isPlannedEvent
                      ? plannedPeakTone.border
                      : soonWaitCategory.style.borderColor,
                }}
              >
                {isEndedEvent
                  ? (nextPeakPoint ? aiSoonTone.label : "집계 중")
                  : isPlannedEvent
                    ? plannedPeakTone.label
                    : (eventPrediction ? soonWaitCategory.label : "집계 중")}
              </span>
            </div>
          </div>

          <div className="rt-prediction-bottom">
            <div className="rt-prediction-chart-card">
              <div className="rt-prediction-chart-head">
                <span className="rt-prediction-chart-title">{isEndedEvent || isPlannedEvent ? "행사일별 혼잡도" : predictionTrendTitle}</span>
                <span className="rt-prediction-chart-sub">
                  {isEndedEvent || isPlannedEvent
                    ? `행사 전체 기간 · ${predictionChartModeLabel}`
                    : `${selectedForecastDate || "오늘"} · ${predictionChartModeLabel}`}
                </span>
              </div>
              <div className="rt-prediction-chart">
                <HourlyTrendChart
                  points={chartPointsForDisplay}
                  isTodayForecast={isTodayForecast && !isEndedEvent}
                />
                <div className="rt-heat-legend">
                  <span className="rt-heat-legend-item">
                    <span className="rt-heat-legend-swatch actual" />
                    <span className="rt-heat-legend-text">Actual (실제 혼잡도)</span>
                  </span>
                  {showPredictedLegend ? (
                    <span className="rt-heat-legend-item">
                      <span className="rt-heat-legend-swatch predicted" />
                      <span className="rt-heat-legend-text">Predicted (AI 예측)</span>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rt-prediction-near-card">
              <div className="rt-prediction-alert-head">
                <div className="rt-prediction-alert-title">
                  <div className="rt-card-title-icon">
                    <Activity size={14} color="#1a4fd6" />
                  </div>
                  현장 참고 알림
                </div>
                <span className="rt-card-tag">{isEndedEvent ? "종료 시점" : isPlannedEvent ? "예정 행사" : "자동 갱신"}</span>
              </div>

              <div className="rt-timeline rt-prediction-alert-timeline">
                {activities.length === 0 ? (
                  <div className="rt-empty">
                    <span className="rt-empty-strong">
                      {isEndedEvent
                        ? "종료 시점 참고 정보가 아직 없습니다"
                        : isPlannedEvent
                          ? "예정 행사 참고 정보가 아직 없습니다"
                          : "실시간 참고 정보가 아직 없습니다"}
                    </span>
                    {isEndedEvent
                      ? "종료 시점 혼잡 반영 내역이 집계되면 표시됩니다."
                      : isPlannedEvent
                        ? "행사가 시작되면 현장 참고 알림이 표시됩니다."
                        : "곧 최신 혼잡 반영 내역이 표시됩니다."}
                  </div>
                ) : (
                  activities.slice(0, 4).map((activity, index) => (
                    <div
                      key={`${activity.time}-${index}`}
                      className={`rt-timeline-item anim-slide-right ${timelineVisible.includes(index) ? "visible" : ""}`}
                    >
                      <div
                        className="rt-timeline-dot"
                        style={{ background: activity.color }}
                      />
                      <div className="rt-timeline-time">{activity.time}</div>
                      <div className="rt-timeline-text">{activity.text}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rt-chart-guide">{chartGuideText}</div>

        {aiErrorMsg ? (
          <div style={{ marginTop: 12, fontSize: 12, color: "#b91c1c" }}>{aiErrorMsg}</div>
        ) : null}
      </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const { eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = useMemo(() => {
    if (location.pathname.startsWith("/realtime/checkinstatus")) return "/realtime/checkinstatus";
    if (location.pathname.startsWith("/realtime/waitingstatus")) return "/realtime/waitingstatus";
    if (location.pathname.startsWith("/realtime/votestatus")) return "/realtime/votestatus";
    return "/realtime/dashboard";
  }, [location.pathname]);

  const handleSelectEvent = (id) => {
    navigate(`/realtime/dashboard/${id}`);
  };

  const handleNavigate = (path) => {
    if (!eventId) {
      navigate(path);
      return;
    }

    const match = String(path || "").match(/^([^?#]*)(.*)$/);
    const pathname = (match?.[1] || "").replace(/\/+$/, "");
    const suffix = match?.[2] || "";
    const lastSegment = pathname.split("/").filter(Boolean).at(-1);

    if (lastSegment && /^\d+$/.test(lastSegment)) {
      navigate(`${pathname}${suffix}`);
      return;
    }

    navigate(`${pathname}/${eventId}${suffix}`);
  };

  return (
    <div className="rt-root">
      <style>{styles}</style>
      <style>{SHARED_ANIM_STYLES}</style>
      {eventId ? (
        <PageHeader
          title={null}
          subtitle={null}
          categories={SERVICE_CATEGORIES}
          stickyCategories
          currentPath={currentPath}
          onNavigate={handleNavigate}
        />
      ) : null}
      <main className={`rt-container${eventId ? " with-event" : " selector-mode"}`}>
        {eventId ? (
          <DashboardContent eventId={eventId} />
        ) : (
          <RealtimeEventSelector
            onSelectEvent={handleSelectEvent}
            pageTitle="통합 현황"
          />
        )}
      </main>
    </div>
  );
}
