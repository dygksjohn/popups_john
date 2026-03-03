import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  ImageOff,
  Maximize2,
  Pencil,
  Trash2,
  X,
  Search,
  Plus,
  ChevronDown,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { eventApi } from "../../../app/http/eventApi";
import { galleryApi } from "../../../app/http/galleryApi";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../auth/AuthProvider";
import { userApi } from "../../../app/http/userApi";

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .eg-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
  }
  .eg-root *, .eg-root *::before, .eg-root *::after {
    box-sizing: border-box;
    font-family: inherit;
  }

  .eg-container {
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
    padding: 25px 25px 64px;
  }

  /* ── MASONRY ── */
  .eg-masonry {
    columns: 4;
    column-gap: 18px;
  }
  @media (max-width: 1100px) { .eg-masonry { columns: 3; } }
  @media (max-width: 720px) {
    .eg-masonry { columns: 2; }
    .eg-container { padding: 32px 16px 48px; }
  }

  /* ── CARD ── */
  .eg-card {
    break-inside: avoid;
    margin-bottom: 18px;
    display: flex;
    flex-direction: column;
    background: #fff;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    overflow: hidden;
    transition: box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .eg-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.07);
    border-color: #d1d5db;
  }

  /* ── CARD IMAGE SLIDER ── */
  .eg-card-img-wrap {
    width: 100%;
    aspect-ratio: 4 / 3;
    background: #f1f3f5;
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
    cursor: pointer;
    line-height: 0;
  }
  .eg-card-img-wrap img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    transition: transform 0.35s ease;
  }
  .eg-card-img-wrap:hover img { transform: scale(1.03); }
  .eg-card-img-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1f3f5;
    color: #ced4da;
  }

  .eg-slide-nav { display: none; }

  .eg-slide-dots {
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 4px;
    z-index: 3;
  }
  .eg-slide-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(255,255,255,0.5);
    border: none;
    padding: 0;
    cursor: pointer;
    transition: background 0.15s, width 0.15s;
  }
  .eg-slide-dot.active {
    background: #fff;
    width: 14px;
    border-radius: 3px;
  }

  .eg-img-count {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0,0,0,0.38);
    color: rgba(255,255,255,0.92);
    font-size: 10.5px;
    font-weight: 500;
    padding: 11px 11px;
    border-radius: 100px;
    letter-spacing: 0.04em;
    pointer-events: none;
    z-index: 2;
    font-variant-numeric: tabular-nums;
  }

  .eg-enlarge-btn {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%) translateY(6px);
    opacity: 0;
    z-index: 3;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 16px;
    background: rgba(15, 23, 53, 0.72);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: rgba(255,255,255,0.93);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.04em;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 5px;
    cursor: pointer;
    white-space: nowrap;
    transition: opacity 0.22s ease, transform 0.22s ease, background 0.15s ease;
    pointer-events: none;
  }
  .eg-card-img-wrap:hover .eg-enlarge-btn {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
    pointer-events: auto;
  }
  .eg-enlarge-btn:hover { background: rgba(15, 23, 53, 0.88); }

  /* ── CARD BODY ── */
  .eg-card-body {
    padding: 14px 16px 16px;
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  
  .eg-card-title {
    font-size: 14px;
    font-weight: 700;
    color: #111;
    margin: 0 0 8px;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
  }  

  .eg-card-author {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 9px;
  }
  .eg-avatar {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
  }
  .eg-author-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex: 1;
    min-width: 0;
  }
  .eg-author-name {
    font-size: 12px;
    font-weight: 600;
    color: #222;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .eg-author-pet {
    font-size: 11px;
    color: #9ca3af;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .eg-author-date {
    font-size: 11px;
    color: #bbb;
    flex-shrink: 0;
  }

  .eg-card-comment {
    font-size: 12.5px;
    color: #374151;
    line-height: 1.6;
    margin: 0 0 9px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
  }

  .eg-card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-bottom: 11px;
  }
  .eg-tag {
    font-size: 11px;
    color: #1a4fd6;
    background: #eff4ff;
    padding: 2px 8px;
    border-radius: 100px;
    font-weight: 500;
  }

  .eg-card-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-top: 10px;
    border-top: 1px solid #f3f4f6;
    margin-top: auto;
  }
  .eg-stat {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    color: #9ca3af;
    font-variant-numeric: tabular-nums;
  }
  .eg-like-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    color: #9ca3af;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
    font-variant-numeric: tabular-nums;
    transition: color 0.15s;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }
  .eg-like-btn.liked { color: #f03e5a; }
  .eg-like-btn:hover:not(.liked) { color: #f03e5a; }
  .eg-heart-icon.pop {
    animation: eg-heart-pop 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  @keyframes eg-heart-pop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.6); }
    70%  { transform: scale(0.88); }
    100% { transform: scale(1); }
  }

  /* ── PAGINATION ── */
  .eg-page-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    background: #fff;
    color: #6b7280;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: inherit;
  }
  .eg-page-btn:hover { border-color: #1a4fd6; color: #1a4fd6; }
  .eg-page-btn.active {
    background: #1a4fd6;
    border-color: #1a4fd6;
    color: #fff;
    font-weight: 600;
  }
  .eg-page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  }

  /* ── FULLSCREEN MODAL ── */
  .eg-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(15, 20, 30, 0.75);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    animation: eg-fade-in 0.22s ease forwards;
    padding: 32px 24px;
  }
  @keyframes eg-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .eg-modal-overlay.eg-closing {
    animation: eg-fade-out 0.18s ease forwards;
  }
  @keyframes eg-fade-out {
    from { opacity: 1; }
    to   { opacity: 0; }
  }

  .eg-modal-inner {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    width: min(92vw, 900px);
    height: min(82vh, 620px);
    border-radius: 14px;
    overflow: hidden;
    cursor: default;
    animation: eg-scale-in 0.22s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    box-shadow: 0 20px 60px rgba(0,0,0,0.22);
  }
  @keyframes eg-scale-in {
    from { opacity: 0; transform: scale(0.96); }
    to   { opacity: 1; transform: scale(1); }
  }

  .eg-modal-close {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(255,255,255,0.88);
    border: 1px solid rgba(0,0,0,0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #555;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    z-index: 10;
    box-shadow: 0 1px 4px rgba(0,0,0,0.12);
  }
  .eg-modal-close:hover { background: #fff; color: #111; }

  .eg-modal-img-wrap {
    flex: 1 1 0;
    min-width: 0;
    position: relative;
    background: #111;
    overflow: hidden;
  }
  .eg-modal-img-inner {
    width: 100%;
    height: 100%;
    position: relative;
  }
  .eg-modal-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    animation: eg-img-appear 0.18s ease forwards;
  }
  @keyframes eg-img-appear {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .eg-modal-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(255,255,255,0.10);
    border: 1px solid rgba(255,255,255,0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgba(255,255,255,0.75);
    opacity: 0;
    transition: opacity 0.18s ease, background 0.15s ease;
    z-index: 2;
  }
  .eg-modal-img-wrap:hover .eg-modal-nav { opacity: 1; }
  .eg-modal-nav:hover { background: rgba(255,255,255,0.22); color: #fff; }
  .eg-modal-nav.prev { left: 14px; }
  .eg-modal-nav.next { right: 14px; }

  .eg-modal-footer {
    position: absolute;
    bottom: 14px;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    pointer-events: none;
    z-index: 3;
  }
  .eg-modal-counter {
    font-size: 11px;
    color: rgba(255,255,255,0.55);
    letter-spacing: 0.08em;
    font-variant-numeric: tabular-nums;
    pointer-events: auto;
  }
  .eg-modal-dots {
    display: flex;
    gap: 5px;
    align-items: center;
    pointer-events: auto;
  }
  .eg-modal-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(255,255,255,0.3);
    border: none;
    padding: 0;
    cursor: pointer;
    transition: background 0.15s, width 0.15s;
  }
  .eg-modal-dot.active {
    background: rgba(255,255,255,0.85);
    width: 14px;
    border-radius: 3px;
  }

  .eg-modal-info {
    width: 300px;
    flex-shrink: 0;
    background: #fff;
    border-left: 1px solid #e5e7eb;
    padding: 22px 20px 20px;
    color: #111;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    min-height: 0;
  }
  .eg-modal-title {
    font-size: 15px;
    font-weight: 700;
    color: #111;
    margin: 0 0 14px;
    line-height: 1.4;
    word-break: break-word;
  }
  .eg-modal-author-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    padding-bottom: 14px;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;
  }
  .eg-modal-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
  }
  .eg-modal-author-name { font-size: 13.5px; font-weight: 700; color: #111; line-height: 1.3; }
  .eg-modal-author-pet { font-size: 11.5px; color: #9ca3af; margin-top: 2px; }
  .eg-modal-date { font-size: 11px; color: #bbb; margin-left: auto; flex-shrink: 0; }
  .eg-modal-comment {
    font-size: 13px;
    color: #374151;
    line-height: 1.7;
    margin-bottom: 12px;
    word-break: break-word;
    flex: 1;
    min-height: 0;
  }
  .eg-modal-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 14px; flex-shrink: 0; }
  .eg-modal-tag {
    font-size: 11px;
    color: #1a4fd6;
    background: #eff4ff;
    padding: 2px 9px;
    border-radius: 100px;
  }
  .eg-modal-meta {
    display: flex;
    align-items: center;
    gap: 14px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
    flex-shrink: 0;
  }
  .eg-modal-like-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12.5px;
    color: #9ca3af;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
    font-variant-numeric: tabular-nums;
    transition: color 0.15s;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }
  .eg-modal-like-btn.liked { color: #f03e5a; }
  .eg-modal-like-btn:hover:not(.liked) { color: #f03e5a; }
  .eg-modal-view {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12.5px;
    color: #bbb;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 640px) {
    .eg-modal-inner {
      flex-direction: column;
      height: auto;
      max-height: 92vh;
      width: 96vw;
    }
    .eg-modal-img-wrap {
      flex: none;
      height: 56vw;
      min-height: 200px;
    }
    .eg-modal-info {
      width: 100%;
      max-height: 40vh;
    }
  }
`;

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const SERVICE_CATEGORIES = [
  { label: "참가자 갤러리", path: "/gallery/eventgallery" },
  { label: "현장 스케치", path: "/gallery/eventsketch" },
];

/* ─────────────────────────────────────────────
   WRITE MODAL (등록하기)
───────────────────────────────────────────── */
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
        }}
      >
        {children}
      </div>
    </div>
  );
}

function WriteModal({ onClose }) {
  const [form, setForm] = useState({ comment: "", tags: "" });
  const [err, setErr] = useState("");

  const handleSave = () => {
    if (!form.comment.trim()) {
      setErr("내용을 입력해주세요.");
      return;
    }
    // TODO: API 연동
    onClose();
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: "28px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h3
            style={{ fontSize: 18, fontWeight: 700, color: "#222", margin: 0 }}
          >
            사진 등록
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "1px solid #eee",
              background: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} color="#999" />
          </button>
        </div>

        {err && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
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

        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#555",
              marginBottom: 6,
              display: "block",
            }}
          >
            사진 첨부 <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <div
            style={{
              border: "2px dashed #ddd",
              borderRadius: 10,
              padding: "28px 0",
              textAlign: "center",
              color: "#aaa",
              fontSize: 13,
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
          >
            클릭하여 사진을 업로드하세요
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#555",
              marginBottom: 6,
              display: "block",
            }}
          >
            내용 <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <textarea
            rows={4}
            value={form.comment}
            onChange={(e) =>
              setForm((p) => ({ ...p, comment: e.target.value }))
            }
            placeholder="사진에 대한 설명을 입력하세요"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 14,
              color: "#222",
              outline: "none",
              boxSizing: "border-box",
              resize: "vertical",
              fontFamily: "'Pretendard Variable', sans-serif",
              lineHeight: 1.6,
            }}
            onFocus={(e) => (e.target.style.borderColor = "#1a4fd6")}
            onBlur={(e) => (e.target.style.borderColor = "#ddd")}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#555",
              marginBottom: 6,
              display: "block",
            }}
          >
            태그
          </label>
          <input
            value={form.tags}
            onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
            placeholder="#태그1 #태그2"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 14,
              color: "#222",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "'Pretendard Variable', sans-serif",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#1a4fd6")}
            onBlur={(e) => (e.target.style.borderColor = "#ddd")}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              color: "#666",
              fontFamily: "'Pretendard Variable', sans-serif",
            }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 8,
              border: "none",
              background: "#1a4fd6",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'Pretendard Variable', sans-serif",
            }}
          >
            등록하기
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/* ─────────────────────────────────────────────
   CARD IMAGE SLIDER
───────────────────────────────────────────── */
const CardSlider = ({ images, onEnlarge }) => {
  const [idx, setIdx] = useState(0);
  const [imgError, setImgError] = useState(false);
  const total = images.length;

  return (
    <div className="eg-card-img-wrap" onClick={() => onEnlarge(idx)}>
      {imgError ? (
        <div className="eg-card-img-fallback">
          <ImageOff size={28} strokeWidth={1.5} />
        </div>
      ) : (
        <img
          key={idx}
          src={images[idx]}
          alt=""
          onError={() => setImgError(true)}
        />
      )}
      {total > 1 && (
        <span className="eg-img-count">
          {idx + 1} / {total}
        </span>
      )}
      {total > 1 && (
        <div className="eg-slide-dots">
          {images.map((_, i) => (
            <button
              key={i}
              className={`eg-slide-dot${i === idx ? " active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setIdx(i);
              }}
              aria-label={`${i + 1}번`}
            />
          ))}
        </div>
      )}
      <button
        className="eg-enlarge-btn"
        onClick={(e) => {
          e.stopPropagation();
          onEnlarge(idx);
        }}
        aria-label="이미지 확대"
      >
        <Maximize2 size={12} strokeWidth={2} />
        확대하기
      </button>
    </div>
  );
};

/* ─────────────────────────────────────────────
   HEART BUTTON
───────────────────────────────────────────── */
const HeartBtn = ({ liked, count, onToggle, modal }) => {
  const [pop, setPop] = useState(false);

  const handle = (e) => {
    e.stopPropagation();
    if (!liked) {
      setPop(true);
      setTimeout(() => setPop(false), 400);
    }
    onToggle();
  };

  return (
    <button
      className={
        modal
          ? `eg-modal-like-btn${liked ? " liked" : ""}`
          : `eg-like-btn${liked ? " liked" : ""}`
      }
      onClick={handle}
    >
      <span
        className={`eg-heart-icon${pop ? " pop" : ""}`}
        style={{ display: "inline-flex" }}
      >
        <Heart
          size={modal ? 14 : 12}
          strokeWidth={1.8}
          fill={liked ? "currentColor" : "none"}
        />
      </span>
      {count}
    </button>
  );
};

/* ─────────────────────────────────────────────
   FULLSCREEN MODAL VIEWER
───────────────────────────────────────────── */
const FullscreenViewer = ({
  card,
  startIndex,
  liked,
  onToggleLike,
  onClose,
  isMine,
  onEdit,
  onDelete,
}) => {
  const [index, setIndex] = useState(startIndex);
  const [closing, setClosing] = useState(false);
  const [imgKey, setImgKey] = useState(0);
  const images = card.images;
  const total = images.length;

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 170);
  }, [onClose]);
  const prev = useCallback(
    (e) => {
      e?.stopPropagation();
      setIndex((i) => (i - 1 + total) % total);
      setImgKey((k) => k + 1);
    },
    [total],
  );
  const next = useCallback(
    (e) => {
      e?.stopPropagation();
      setIndex((i) => (i + 1) % total);
      setImgKey((k) => k + 1);
    },
    [total],
  );

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [close, prev, next]);

  return (
    <div
      className={`eg-modal-overlay${closing ? " eg-closing" : ""}`}
      onClick={close}
    >
      <button
        className="eg-modal-close"
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
      >
        <X size={16} />
      </button>
      <div className="eg-modal-inner" onClick={(e) => e.stopPropagation()}>
        <div className="eg-modal-img-wrap">
          <div className="eg-modal-img-inner">
            {total > 1 && (
              <button
                className="eg-modal-nav prev"
                onClick={prev}
                aria-label="이전 이미지"
              >
                <ChevronLeft size={18} strokeWidth={1.8} />
              </button>
            )}
            <img
              key={imgKey}
              className="eg-modal-img"
              src={images[index]}
              alt={`이미지 ${index + 1}`}
            />
            {total > 1 && (
              <button
                className="eg-modal-nav next"
                onClick={next}
                aria-label="다음 이미지"
              >
                <ChevronRight size={18} strokeWidth={1.8} />
              </button>
            )}
          </div>
          {total > 1 && (
            <div
              className="eg-modal-footer"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="eg-modal-counter">
                {index + 1} / {total}
              </span>
              <div className="eg-modal-dots">
                {images.map((_, i) => (
                  <button
                    key={i}
                    className={`eg-modal-dot${i === index ? " active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIndex(i);
                      setImgKey((k) => k + 1);
                    }}
                    aria-label={`이미지 ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="eg-modal-info" onClick={(e) => e.stopPropagation()}>
          {card.title ? <h3 className="eg-modal-title">{card.title}</h3> : null}
          <div className="eg-modal-author-row">
            <div
              className="eg-modal-avatar"
              style={{
                background: `linear-gradient(135deg, ${card.avatarColor[0]}, ${card.avatarColor[1]})`,
              }}
            >
              {card.initials}
            </div>
            <div>
              <div className="eg-modal-author-name">{card.author}</div>
              <div className="eg-modal-author-pet">🐾 {card.pet}</div>
            </div>
            <span className="eg-modal-date">{card.date}</span>
          </div>
          <p className="eg-modal-comment">{card.comment}</p>
          <div className="eg-modal-tags">
            {card.tags.map((t) => (
              <span key={t} className="eg-modal-tag">
                {t}
              </span>
            ))}
          </div>
          <div className="eg-modal-meta">
            <HeartBtn
              liked={liked}
              count={card.likes + (liked ? 1 : 0)}
              onToggle={onToggleLike}
              modal
            />
            <span className="eg-modal-view">
              <Eye size={14} strokeWidth={1.8} /> {card.views.toLocaleString()}
            </span>
          </div>
          {isMine && (
            <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid #f0f0f0" }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  fontSize: 13,
                  color: "#6b7280",
                  background: "#f3f4f6",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                <Pencil size={14} strokeWidth={2} /> 수정
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  fontSize: 13,
                  color: "#dc2626",
                  background: "#fef2f2",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                <Trash2 size={14} strokeWidth={2} /> 삭제
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   GALLERY CARD
───────────────────────────────────────────── */
const GalleryCard = ({ card, liked, onToggleLike, onEnlarge, isMine, onEdit, onDelete }) => (
  <div className="eg-card">
    <CardSlider
      images={card.images}
      onEnlarge={(idx) => onEnlarge(card, idx)}
    />
    <div className="eg-card-body">
      {card.title ? <h3 className="eg-card-title">{card.title}</h3> : null}
      <div className="eg-card-author">
        <div
          className="eg-avatar"
          style={{
            background: `linear-gradient(135deg, ${card.avatarColor[0]}, ${card.avatarColor[1]})`,
          }}
        >
          {card.initials}
        </div>
        <div className="eg-author-info">
          <span className="eg-author-name">{card.author}</span>
          <span className="eg-author-pet">🐾 {card.pet}</span>
        </div>
        <span className="eg-author-date">{card.date}</span>
      </div>
      <p className="eg-card-comment">{card.comment}</p>
      <div className="eg-card-tags">
        {card.tags.map((t) => (
          <span key={t} className="eg-tag">
            {t}
          </span>
        ))}
      </div>
      <div className="eg-card-meta">
        <HeartBtn
          liked={liked}
          count={card.likes + (liked ? 1 : 0)}
          onToggle={onToggleLike}
        />
        <span className="eg-stat">
          <Eye size={12} strokeWidth={1.8} /> {card.views.toLocaleString()}
        </span>
        {isMine && (
          <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit?.(card.id); }}
              title="수정"
              style={{
                padding: 4,
                border: "none",
                background: "none",
                cursor: "pointer",
                color: "#6b7280",
                borderRadius: 4,
              }}
            >
              <Pencil size={14} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete?.(card.id); }}
              title="삭제"
              style={{
                padding: 4,
                border: "none",
                background: "none",
                cursor: "pointer",
                color: "#dc2626",
                borderRadius: 4,
              }}
            >
              <Trash2 size={14} strokeWidth={2} />
            </button>
          </span>
        )}
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function EventGallery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const eventIdParam = searchParams.get("eventId");
  const selectedEventId = eventIdParam ? Number(eventIdParam) : null;

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [galleries, setGalleries] = useState([]);
  const [galleriesLoading, setGalleriesLoading] = useState(true);
  const [galleriesError, setGalleriesError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const size = 4;

  const [liked, setLiked] = useState({});
  const [viewer, setViewer] = useState(null);
  const [viewerDetail, setViewerDetail] = useState(null); // 단건 조회 결과
  const [meUserId, setMeUserId] = useState(null);
  const navigate = useNavigate();
  const { isAuthed } = useAuth();

  // 상대 경로 이미지 → API 서버 base URL 붙여서 표시 (미리보기·카드·상세 공통, 기본값 8080)
  const getImageSrc = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/+$/, "");
    return base + (url.startsWith("/") ? url : "/" + url);
  };

  // 글쓰기 모달
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ eventId: "", title: "", description: "", imageUrls: [] });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const fileInputRef = useRef(null);

  // 수정 모달
  const [editingGalleryId, setEditingGalleryId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [editLoading, setEditLoading] = useState(false);

  const refetchGalleries = useCallback(() => {
    setGalleriesLoading(true);
    setGalleriesError(null);
    const promise = selectedEventId == null
      ? galleryApi.getList({ page, size })
      : galleryApi.getListByEvent(selectedEventId, { page, size });
    promise
      .then((res) => {
        const data = res.data?.data ?? res.data;
        const list = data?.content ?? (Array.isArray(data) ? data : []);
        setGalleries(Array.isArray(list) ? list : []);
        const total = data?.totalPages ?? 0;
        setTotalPages(typeof total === "number" ? total : 0);
      })
      .catch((e) => {
        setGalleries([]);
        setGalleriesError(e?.response?.data?.message ?? e?.message ?? "갤러리를 불러오지 못했습니다.");
      })
      .finally(() => setGalleriesLoading(false));
  }, [selectedEventId, page, size]);

  const handleCreateSubmit = async () => {
    const eventId = createForm.eventId === "" ? null : Number(createForm.eventId);
    if (eventId == null) {
      setCreateError("행사를 선택해 주세요.");
      return;
    }
    if (!createForm.title?.trim()) {
      setCreateError("제목을 입력해 주세요.");
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      await galleryApi.createByUser({
        eventId,
        title: createForm.title.trim(),
        description: createForm.description?.trim() ?? "",
        imageUrls: createForm.imageUrls ?? [],
      });
      setShowCreateModal(false);
      setCreateForm({ eventId: "", title: "", description: "", imageUrls: [] });
      refetchGalleries();
    } catch (e) {
      setCreateError(e?.response?.data?.error?.message ?? e?.message ?? "등록에 실패했습니다.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleFileSelect = async (files) => {
    if (!files?.length) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      setCreateError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    setCreateError(null);
    setUploadingCount((c) => c + list.length);
    for (const file of list) {
      try {
        const res = await galleryApi.uploadImage(file);
        const publicPath = res.data?.data?.publicPath ?? res.data?.publicPath;
        if (publicPath) {
          setCreateForm((f) => ({ ...f, imageUrls: [...(f.imageUrls ?? []), publicPath] }));
        }
      } catch (e) {
        setCreateError(e?.response?.data?.message ?? e?.message ?? "업로드에 실패했습니다.");
      } finally {
        setUploadingCount((c) => Math.max(0, c - 1));
      }
    }
  };

  const removeUploadedImage = (index) => {
    setCreateForm((f) => ({
      ...f,
      imageUrls: (f.imageUrls ?? []).filter((_, i) => i !== index),
    }));
  };

  const [draggedImageIndex, setDraggedImageIndex] = useState(null);

  const handleImageDragStart = (index) => {
    setDraggedImageIndex(index);
  };
  const handleImageDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleImageDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedImageIndex == null) return;
    setCreateForm((f) => {
      const urls = [...(f.imageUrls ?? [])];
      const [removed] = urls.splice(draggedImageIndex, 1);
      urls.splice(dropIndex, 0, removed);
      return { ...f, imageUrls: urls };
    });
    setDraggedImageIndex(null);
  };
  const handleImageDragEnd = () => {
    setDraggedImageIndex(null);
  };

  const handleEditClick = (galleryId) => {
    const g = galleries.find((x) => x.galleryId === galleryId);
    if (!g) return;
    setEditForm({ title: g.title ?? "", description: g.description ?? "" });
    setEditingGalleryId(galleryId);
  };

  const handleEditSubmit = async () => {
    if (editingGalleryId == null) return;
    setEditLoading(true);
    try {
      await galleryApi.updateOne(editingGalleryId, {
        title: editForm.title?.trim() ?? "",
        description: editForm.description?.trim() ?? "",
      });
      setEditingGalleryId(null);
      refetchGalleries();
      setViewer(null);
      setViewerDetail(null);
    } catch (e) {
      console.error("수정 실패", e);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = async (galleryId) => {
    if (!window.confirm("이 갤러리를 삭제할까요?")) return;
    try {
      await galleryApi.deleteOne(galleryId);
      refetchGalleries();
      setViewer(null);
      setViewerDetail(null);
      setEditingGalleryId(null);
    } catch (e) {
      console.error("삭제 실패", e);
    }
  };

  // 로그인 시 /me 로 userId 확보 (좋아요용)
  useEffect(() => {
    if (!isAuthed) {
      setMeUserId(null);
      return;
    }
    userApi
      .getMe()
      .then((data) => {
        if (data?.userId != null) setMeUserId(data.userId);
      })
      .catch(() => setMeUserId(null));
  }, [isAuthed]);

  // 모달 열린 갤러리 단건 조회 (최신 상세·조회수)
  useEffect(() => {
    if (!viewer?.card?.id) {
      setViewerDetail(null);
      return;
    }
    galleryApi
      .getOne(viewer.card.id)
      .then((res) => {
        const g = res.data?.data ?? res.data;
        if (!g) return;
        setViewerDetail({
          id: g.galleryId,
          title: g.title ?? "",
          images: (g.imageUrls ?? []).map((u) => getImageSrc(u)),
          comment: g.description ?? "",
          tags: [],
          author: "운영팀",
          pet: "",
          date: g.createdAt
            ? new Date(g.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").trim()
            : "",
          avatarColor: ["#e0e7ff", "#6366f1"],
          initials: "갤",
          likes: g.likeCount ?? 0,
          views: g.viewCount ?? 0,
        });
      })
      .catch(() => setViewerDetail(null));
  }, [viewer?.card?.id]);

  // 행사 목록 로드
  useEffect(() => {
    let cancelled = false;
    setEventsLoading(true);
    eventApi
      .getEvents({ page: 0, size: 100 })
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.data?.content ?? res.data?.content ?? [];
        setEvents(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setEventsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

    // 갤러리 목록 로드 (전체 vs 행사별)
    useEffect(() => {
      let cancelled = false;
      setGalleriesLoading(true);
      setGalleriesError(null);
      const promise = selectedEventId == null
        ? galleryApi.getList({ page, size })
        : galleryApi.getListByEvent(selectedEventId, { page, size });
  
      promise
        .then((res) => {
          if (cancelled) return;
          const data = res.data?.data ?? res.data;
          const list = data?.content ?? (Array.isArray(data) ? data : []);
          setGalleries(Array.isArray(list) ? list : []);
          const total = data?.totalPages ?? 0;
          setTotalPages(typeof total === "number" ? total : 0);
        })
        .catch((e) => {
          if (!cancelled) {
            setGalleries([]);
            const msg = e?.response?.data?.message ?? e?.message ?? "갤러리를 불러오지 못했습니다.";
            setGalleriesError(msg);
          }
        })
        .finally(() => {
          if (!cancelled) setGalleriesLoading(false);
        });
      return () => { cancelled = true; };
    }, [selectedEventId, page]);

  const handleEventChange = (e) => {
    const v = e.target.value;
    if (v === "" || v === "all") {
      setSearchParams({});
      setPage(0);
    } else {
      setSearchParams({ eventId: v });
      setPage(0);
    }
  };

  const toggleLike = async (galleryId) => {
    if (!isAuthed) {
      if (window.confirm("좋아요는 로그인 후 이용할 수 있습니다. 로그인 페이지로 이동할까요?")) {
        navigate("/auth/login", { state: { from: "/gallery/eventgallery" } });
      }
      return;
    }
    if (meUserId == null) {
      // /me 아직 안 불러옴
      const data = await userApi.getMe().catch(() => null);
      const uid = data?.userId;
      if (uid == null) return;
      setMeUserId(uid);
      await doLikeUnlike(galleryId, uid);
    } else {
      await doLikeUnlike(galleryId, meUserId);
    }
  };

  const doLikeUnlike = async (galleryId, userId) => {
    const currentlyLiked = liked[galleryId];
    try {
      if (currentlyLiked) {
        await galleryApi.unlike(galleryId, userId);
      } else {
        await galleryApi.like(galleryId, userId);
      }
      setLiked((prev) => ({ ...prev, [galleryId]: !currentlyLiked }));
      setGalleries((prev) =>
        prev.map((g) =>
          g.galleryId === galleryId
            ? { ...g, likeCount: (g.likeCount ?? 0) + (currentlyLiked ? -1 : 1) }
            : g
        )
      );
      if (viewerDetail?.id === galleryId) {
        setViewerDetail((d) => ({
          ...d,
          likes: (d.likes ?? 0) + (currentlyLiked ? -1 : 1),
        }));
      }
    } catch (e) {
      console.error("like/unlike failed", e);
    }
  };
  const handleEnlarge = (card, idx) => setViewer({ card, startIndex: idx });

  // API 응답 → 카드 형식 매핑 (기존 GALLERY_CARDS 구조에 맞춤, 상대 경로는 getImageSrc로 표시용 URL로 변환)
  const cards = galleries.map((g) => ({
    id: g.galleryId,
    title: g.title ?? "",
    userId: g.userId,
    images: (g.imageUrls ?? []).map((u) => getImageSrc(u)),
    comment: g.description ?? "",
    tags: [],
    author: "운영팀",
    pet: "",
    date: g.createdAt
      ? new Date(g.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").trim()
      : "",
    avatarColor: ["#e0e7ff", "#6366f1"],
    initials: "갤",
    likes: g.likeCount ?? 0,
    views: g.viewCount ?? 0,
  }));

  return (
    <div className="eg-root">
      <style>{styles}</style>

      <PageHeader
        title="참가자 갤러리"
        subtitle="참가자들이 직접 공유한 행사 사진을 모아둔 공간입니다"
        categories={SERVICE_CATEGORIES}
        currentPath="/gallery/eventgallery"
        onNavigate={(path) => window.location.href = path}
      />

      <main className="eg-container">
        {/* 행사 선택 */}
        <section style={{ marginBottom: "24px" }}>
          <label htmlFor="eg-event-select" style={{ marginRight: "8px", fontSize: 14, color: "#374151" }}>
            행사 선택
          </label>
          <select
            id="eg-event-select"
            value={selectedEventId ?? ""}
            onChange={handleEventChange}
            disabled={eventsLoading}
            style={{
              padding: "8px 12px",
              fontSize: 14,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              minWidth: 200,
            }}
          >
            <option value="">전체 보기</option>
            {events.map((ev) => (
              <option key={ev.eventId} value={ev.eventId}>
                {ev.eventTitle ?? ev.title ?? `행사 ${ev.eventId}`}
              </option>
            ))}
          </select>
          {isAuthed && (
            <button
              type="button"
              onClick={() => {
                setCreateForm({
                  eventId: selectedEventId ?? events[0]?.eventId ?? "",
                  title: "",
                  description: "",
                  imageUrls: [],
                });
                setCreateError(null);
                setShowCreateModal(true);
              }}
              style={{
                marginLeft: 12,
                padding: "8px 16px",
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                background: "#1a4fd6",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              글쓰기
            </button>
          )}
        </section>

        <section style={{ marginBottom: "48px" }}>
          {galleriesLoading ? (
            <p style={{ color: "#6b7280", fontSize: 14 }}>갤러리를 불러오는 중...</p>
          ) : galleriesError ? (
            <div style={{ textAlign: "center", padding: "32px 16px" }}>
              <p style={{ color: "#dc2626", fontSize: 14, marginBottom: 12 }}>
                {galleriesError}
              </p>
              <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>
                다시 시도해 주세요.
              </p>
              <button
                type="button"
                onClick={() => {
                  setGalleriesError(null);
                  setGalleriesLoading(true);
                  const promise = selectedEventId == null
                    ? galleryApi.getList({ page, size })
                    : galleryApi.getListByEvent(selectedEventId, { page, size });
                  promise
                    .then((res) => {
                      const data = res.data?.data ?? res.data;
                      const list = data?.content ?? (Array.isArray(data) ? data : []);
                      setGalleries(Array.isArray(list) ? list : []);
                      const total = data?.totalPages ?? 0;
                      setTotalPages(typeof total === "number" ? total : 0);
                    })
                    .catch((e) => {
                      setGalleries([]);
                      setGalleriesError(e?.response?.data?.message ?? e?.message ?? "갤러리를 불러오지 못했습니다.");
                    })
                    .finally(() => setGalleriesLoading(false));
                }}
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1a4fd6",
                  background: "#fff",
                  border: "1px solid #1a4fd6",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                다시 시도
              </button>
            </div>
          ) : cards.length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: 14 }}>등록된 갤러리가 없습니다.</p>
          ) : (
            <div className="eg-masonry">
              {cards.map((card) => (
                <GalleryCard
                  key={card.id}
                  card={card}
                  liked={!!liked[card.id]}
                  onToggleLike={() => toggleLike(card.id)}
                  onEnlarge={handleEnlarge}
                  isMine={meUserId != null && card.userId === meUserId}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          )}
        </section>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "40px", flexWrap: "wrap" }}>
  <button
    type="button"
    className="eg-page-btn"
    onClick={() => setPage((p) => Math.max(0, p - 1))}
    disabled={page === 0}
            aria-label="이전 페이지"
  >
    ‹
  </button>
  <span style={{ display: "inline-flex", alignItems: "center", fontSize: 13, color: "#6b7280", minWidth: "4ch" }}>
            {totalPages > 0 ? `${page + 1} / ${totalPages}` : "1"}
          </span>
  <button
    type="button"
    className="eg-page-btn"
    onClick={() => setPage((p) => p + 1)}
    disabled={totalPages <= 0 || page >= totalPages - 1}
            aria-label="다음 페이지"
  >
    ›
  </button>
</div>
</main>

{/* 글쓰기 모달 */}
{showCreateModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}
    onClick={() => !createLoading && setShowCreateModal(false)}
  >
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 24,
        width: "100%",
        maxWidth: 420,
        boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h3 style={{ margin: "0 0 16px", fontSize: 18 }}>갤러리 글쓰기</h3>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>행사</label>
        <select
          value={createForm.eventId}
          onChange={(e) => setCreateForm((f) => ({ ...f, eventId: e.target.value }))}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db" }}
        >
          <option value="">선택</option>
          {events.map((ev) => (
            <option key={ev.eventId} value={ev.eventId}>
              {ev.eventTitle ?? ev.title ?? `행사 ${ev.eventId}`}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>제목</label>
        <input
          type="text"
          value={createForm.title}
          onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="제목"
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db" }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>설명</label>
        <textarea
          value={createForm.description}
          onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="설명 (선택)"
          rows={3}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", resize: "vertical" }}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>이미지</label>
        <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 8px" }}>
          첫 번째 이미지가 대표 이미지로 사용됩니다. 드래그하여 순서를 변경할 수 있습니다.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            handleFileSelect(e.target.files);
            e.target.value = "";
          }}
        />
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleFileSelect(e.dataTransfer?.files);
          }}
          style={{
            border: "2px dashed #d1d5db",
            borderRadius: 10,
            padding: "24px 16px",
            textAlign: "center",
            color: "#6b7280",
            fontSize: 13,
            cursor: "pointer",
            background: "#f9fafb",
            marginBottom: 12,
          }}
        >
          {uploadingCount > 0 ? "업로드 중..." : "클릭하거나 이미지를 여기에 놓으세요"}
        </div>
        {(createForm.imageUrls ?? []).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(createForm.imageUrls ?? []).map((url, i) => (
              <div
                key={url}
                draggable
                onDragStart={() => handleImageDragStart(i)}
                onDragOver={handleImageDragOver}
                onDrop={(e) => handleImageDrop(e, i)}
                onDragEnd={handleImageDragEnd}
                style={{
                  position: "relative",
                  width: 64,
                  height: 64,
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "1px solid #e5e7eb",
                  cursor: uploadingCount > 0 ? "default" : "grab",
                  opacity: draggedImageIndex === i ? 0.6 : 1,
                  boxShadow: draggedImageIndex === i ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
                }}
                title="드래그하여 순서 변경"
              >
                {i === 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 2,
                      left: 2,
                      fontSize: 9,
                      fontWeight: 700,
                      background: "#1a4fd6",
                      color: "#fff",
                      padding: "2px 4px",
                      borderRadius: 4,
                      zIndex: 2,
                    }}
                  >
                    대표
                  </span>
                )}
                <img
                  src={getImageSrc(url)}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
                  draggable={false}
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeUploadedImage(i); }}
                  disabled={uploadingCount > 0}
                  aria-label="삭제"
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    cursor: uploadingCount > 0 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    zIndex: 2,
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {createError && (
        <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{createError}</p>
      )}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => !createLoading && setShowCreateModal(false)}
          style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleCreateSubmit}
          disabled={createLoading}
          style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#1a4fd6", color: "#fff", cursor: createLoading ? "not-allowed" : "pointer" }}
        >
          {createLoading ? "등록 중..." : "등록"}
        </button>
      </div>
    </div>
  </div>
)}

{/* 수정 모달 */}
{editingGalleryId != null && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}
    onClick={() => !editLoading && setEditingGalleryId(null)}
  >
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 24,
        width: "100%",
        maxWidth: 420,
        boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h3 style={{ margin: "0 0 16px", fontSize: 18 }}>갤러리 수정</h3>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>제목</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db" }}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>설명</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", resize: "vertical" }}
        />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => !editLoading && setEditingGalleryId(null)}
          style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleEditSubmit}
          disabled={editLoading}
          style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#1a4fd6", color: "#fff", cursor: editLoading ? "not-allowed" : "pointer" }}
        >
          {editLoading ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  </div>
)}

{viewer && (
        <FullscreenViewer
        card={viewerDetail ?? viewer.card}
        startIndex={viewer.startIndex}
        liked={!!liked[viewer.card.id]}
        onToggleLike={() => toggleLike(viewer.card.id)}
        onClose={() => { setViewer(null); setViewerDetail(null); }}
        isMine={meUserId != null && viewer.card.userId === meUserId}
        onEdit={() => {
          setViewer(null);
          setViewerDetail(null);
          handleEditClick(viewer.card.id);
        }}
        onDelete={() => {
          setViewer(null);
          setViewerDetail(null);
          handleDeleteClick(viewer.card.id);
        }}
      />
      )}
    </div>
  );
}
