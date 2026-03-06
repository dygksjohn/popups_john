import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  ImageOff,
  Loader2,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import { eventApi } from "../../../app/http/eventApi";
import { galleryApi } from "../../../app/http/galleryApi";
import { useAuth } from "../auth/AuthProvider";
import { userApi } from "../../../app/http/userApi";
import { normalizeEventTitle } from "../../../shared/utils/eventDisplay";
import { toPublicAssetUrl } from "../../../shared/utils/publicAssetUrl";

const PAGE_SIZE = 8;
const SERVICE_CATEGORIES = [{ label: "행사 갤러리", path: "/gallery/eventgallery" }];
const SORT_OPTIONS = [
  { value: "latest", label: "최신순" },
  { value: "views", label: "조회순" },
  { value: "likes", label: "좋아요순" },
];

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function toTimestamp(value) {
  const ts = Date.parse(String(value || ""));
  return Number.isFinite(ts) ? ts : 0;
}

function normalizeGallery(row) {
  return {
    galleryId: row?.galleryId,
    eventId: row?.eventId,
    userId: row?.userId,
    title: row?.title || "제목 없음",
    description: row?.description || "",
    createdAt: row?.createdAt || null,
    likeCount: Number(row?.likeCount || 0),
    viewCount: Number(row?.viewCount || 0),
    imageUrls: Array.isArray(row?.imageUrls)
      ? row.imageUrls.map((url) => toPublicAssetUrl(url))
      : [],
  };
}

function backdropStyle() {
  return {
    position: "fixed",
    inset: 0,
    zIndex: 5000,
    background: "rgba(15,23,42,0.48)",
    backdropFilter: "blur(5px)",
  };
}

function overlayStyle() {
  return {
    position: "fixed",
    inset: 0,
    zIndex: 5001,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  };
}

function modalShellStyle(width) {
  return {
    width,
    maxHeight: "90vh",
    overflow: "auto",
    background: "#fff",
    borderRadius: 22,
    border: "1px solid #dbe2ea",
    boxShadow: "0 28px 70px rgba(15,23,42,0.18)",
  };
}

function buttonStyle(kind = "neutral") {
  if (kind === "primary") {
    return {
      height: 44,
      padding: "0 18px",
      borderRadius: 10,
      border: "none",
      background: "#1d4ed8",
      fontSize: 14,
      fontWeight: 800,
      color: "#fff",
      cursor: "pointer",
    };
  }
  return {
    height: 44,
    padding: "0 18px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    background: "#fff",
    fontSize: 14,
    fontWeight: 700,
    color: "#475569",
    cursor: "pointer",
  };
}

function GalleryWriteModal({
  open,
  events,
  form,
  onChange,
  onFilesChange,
  onClose,
  onSubmit,
  loading,
  error,
}) {
  if (!open) return null;

  return (
    <>
      <div style={backdropStyle()} onClick={onClose} />
      <div style={overlayStyle()}>
        <div onClick={(event) => event.stopPropagation()} style={modalShellStyle("min(760px, 100%)")}>
          <div style={{ padding: "24px 28px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>갤러리 글쓰기</div>
              <div style={{ marginTop: 6, fontSize: 13, color: "#64748b" }}>행사 현장 사진과 설명을 함께 등록할 수 있습니다.</div>
            </div>
            <button type="button" onClick={onClose} style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid #dbe2ea", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <X size={16} color="#64748b" />
            </button>
          </div>

          <div style={{ padding: 28, display: "grid", gap: 18 }}>
            {error ? <div style={{ padding: "12px 14px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 13, fontWeight: 700 }}>{error}</div> : null}

            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>행사 선택</span>
              <select value={form.eventId} onChange={(event) => onChange("eventId", event.target.value)} style={{ height: 46, borderRadius: 10, border: "1px solid #cbd5e1", padding: "0 14px", fontSize: 14 }}>
                <option value="">행사를 선택해 주세요</option>
                {events.map((item) => <option key={item.eventId} value={item.eventId}>{item.eventName}</option>)}
              </select>
            </label>

            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>제목</span>
              <input value={form.title} onChange={(event) => onChange("title", event.target.value)} placeholder="사진 제목을 입력해 주세요" style={{ height: 46, borderRadius: 10, border: "1px solid #cbd5e1", padding: "0 14px", fontSize: 14 }} />
            </label>

            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>설명</span>
              <textarea value={form.description} onChange={(event) => onChange("description", event.target.value)} rows={5} placeholder="현장 분위기와 설명을 입력해 주세요" style={{ borderRadius: 12, border: "1px solid #cbd5e1", padding: 14, fontSize: 14, lineHeight: 1.7, resize: "vertical" }} />
            </label>

            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>이미지 업로드</span>
              <label style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 74, borderRadius: 14, border: "1px dashed #93c5fd", background: "#eff6ff", padding: "0 16px", cursor: "pointer" }}>
                <Upload size={18} color="#1d4ed8" />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1d4ed8" }}>여러 장 선택</span>
                <input type="file" accept="image/*" multiple onChange={(event) => onFilesChange(Array.from(event.target.files || []))} style={{ display: "none" }} />
              </label>
            </label>

            {form.files.length ? <div style={{ display: "grid", gap: 8 }}>{form.files.map((file) => <div key={`${file.name}-${file.lastModified}`} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, color: "#475569", background: "#fff" }}>{file.name}</div>)}</div> : null}
          </div>

          <div style={{ padding: "0 28px 28px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" onClick={onClose} style={buttonStyle()}>취소</button>
            <button type="button" onClick={onSubmit} disabled={loading} style={{ ...buttonStyle("primary"), opacity: loading ? 0.6 : 1 }}>{loading ? "등록 중..." : "등록하기"}</button>
          </div>
        </div>
      </div>
    </>
  );
}
function GalleryViewer({ item, eventName, onClose, onToggleLike, liked }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [item?.galleryId]);

  if (!item) return null;

  const currentImage = item.imageUrls[index] || "";

  return (
    <>
      <div style={backdropStyle()} onClick={onClose} />
      <div style={overlayStyle()}>
        <div onClick={(event) => event.stopPropagation()} style={modalShellStyle("min(980px, 100%)")}>
          <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", lineHeight: 1.3 }}>{item.title}</div>
              <div style={{ marginTop: 6, display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13, color: "#64748b" }}>
                <span>{eventName}</span>
                <span>{formatDate(item.createdAt)}</span>
                <span>{item.viewCount} 조회</span>
                <span>{item.likeCount} 좋아요</span>
              </div>
            </div>
            <button type="button" onClick={onClose} style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid #dbe2ea", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <X size={16} color="#64748b" />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(320px, 0.85fr)" }}>
            <div style={{ minHeight: 540, background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              {currentImage ? (
                <img src={currentImage} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "contain", maxHeight: 620 }} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: "#94a3b8" }}>
                  <ImageOff size={42} />
                  <span>이미지가 없습니다.</span>
                </div>
              )}
              {item.imageUrls.length > 1 ? (
                <>
                  <button type="button" onClick={() => setIndex((prev) => (prev - 1 + item.imageUrls.length) % item.imageUrls.length)} style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: 999, border: "none", background: "rgba(255,255,255,0.18)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ChevronLeft size={18} /></button>
                  <button type="button" onClick={() => setIndex((prev) => (prev + 1) % item.imageUrls.length)} style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: 999, border: "none", background: "rgba(255,255,255,0.18)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ChevronRight size={18} /></button>
                </>
              ) : null}
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ fontSize: 15, lineHeight: 1.8, color: "#334155", whiteSpace: "pre-wrap" }}>{item.description || "설명이 없습니다."}</div>
              {item.imageUrls.length > 1 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
                  {item.imageUrls.map((imageUrl, imageIndex) => (
                    <button key={`${imageUrl}-${imageIndex}`} type="button" onClick={() => setIndex(imageIndex)} style={{ border: imageIndex === index ? "2px solid #1d4ed8" : "1px solid #dbe2ea", borderRadius: 12, overflow: "hidden", background: "#fff", cursor: "pointer", padding: 0 }}>
                      <img src={imageUrl} alt={`${item.title}-${imageIndex + 1}`} style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }} />
                    </button>
                  ))}
                </div>
              ) : null}
              <button type="button" onClick={onToggleLike} style={{ marginTop: "auto", alignSelf: "flex-start", height: 42, padding: "0 16px", borderRadius: 999, border: liked ? "1px solid #fecdd3" : "1px solid #dbe2ea", background: liked ? "#fff1f2" : "#fff", color: liked ? "#e11d48" : "#334155", display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                <Heart size={15} fill={liked ? "currentColor" : "none"} /> 좋아요 {item.likeCount}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default function EventGallery() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedEventId = searchParams.get("eventId") || "";
  const { isAuthed } = useAuth();

  const [events, setEvents] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortOption, setSortOption] = useState("latest");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meUserId, setMeUserId] = useState(null);
  const [likedMap, setLikedMap] = useState({});
  const [viewer, setViewer] = useState(null);
  const [writeOpen, setWriteOpen] = useState(false);
  const [writeLoading, setWriteLoading] = useState(false);
  const [writeError, setWriteError] = useState("");
  const [writeForm, setWriteForm] = useState({ eventId: "", title: "", description: "", files: [] });

  const eventNameMap = useMemo(() => Object.fromEntries(events.map((event) => [String(event.eventId), event.eventName])), [events]);

  const loadEvents = useCallback(async () => {
    try {
      const res = await eventApi.getEvents({ page: 0, size: 100, sort: "startAt,desc" });
      const rows = Array.isArray(res?.data?.data?.content) ? res.data.data.content : [];
      setEvents(rows.map((row) => ({ eventId: row?.eventId, eventName: normalizeEventTitle(row?.eventName ?? row?.title, row) })));
    } catch (err) {
      console.error("[EventGallery] event load failed:", err);
      setEvents([]);
    }
  }, []);

  const loadGalleries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = selectedEventId ? await galleryApi.getListByEvent(Number(selectedEventId), { page: 0, size: 200 }) : await galleryApi.getList({ page: 0, size: 200 });
      const data = res?.data?.data ?? res?.data;
      const rows = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
      setGalleries(rows.map(normalizeGallery));
    } catch (err) {
      console.error("[EventGallery] gallery load failed:", err);
      setGalleries([]);
      setError(err?.response?.data?.message || "갤러리를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => { loadEvents(); }, [loadEvents]);
  useEffect(() => { loadGalleries(); }, [loadGalleries]);
  useEffect(() => { setPage(1); }, [search, selectedEventId, sortOption]);
  useEffect(() => {
    if (!isAuthed) {
      setMeUserId(null);
      return;
    }
    userApi.getMe().then((data) => setMeUserId(data?.userId ?? null)).catch(() => setMeUserId(null));
  }, [isAuthed]);

  const filteredGalleries = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const list = galleries.filter((gallery) => {
      const eventName = String(eventNameMap[String(gallery.eventId)] || `행사 ${gallery.eventId}`).toLowerCase();
      return !keyword || String(gallery.title || "").toLowerCase().includes(keyword) || String(gallery.description || "").toLowerCase().includes(keyword) || eventName.includes(keyword);
    });
    return [...list].sort((a, b) => {
      if (sortOption === "views") return b.viewCount - a.viewCount;
      if (sortOption === "likes") return b.likeCount - a.likeCount;
      return toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
    });
  }, [eventNameMap, galleries, search, sortOption]);

  const totalPages = Math.max(1, Math.ceil(filteredGalleries.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedGalleries = useMemo(() => filteredGalleries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [currentPage, filteredGalleries]);

  const ensureAuthed = useCallback(() => {
    if (!isAuthed) {
      navigate("/auth/login", { state: { from: "/gallery/eventgallery" } });
      return false;
    }
    return true;
  }, [isAuthed, navigate]);

  const openViewer = useCallback(async (gallery) => {
    setViewer(gallery);
    try {
      const res = await galleryApi.getOne(gallery.galleryId);
      const detail = normalizeGallery(res?.data?.data ?? res?.data ?? gallery);
      setViewer(detail);
      setGalleries((prev) => prev.map((item) => item.galleryId === detail.galleryId ? detail : item));
    } catch (err) {
      console.error("[EventGallery] detail load failed:", err);
    }
  }, []);

  const toggleLike = useCallback(async (gallery) => {
    if (!ensureAuthed()) return;
    const liked = !!likedMap[gallery.galleryId];
    try {
      if (liked) await galleryApi.unlike(gallery.galleryId, meUserId);
      else await galleryApi.like(gallery.galleryId, meUserId);
      const nextCount = Math.max(0, gallery.likeCount + (liked ? -1 : 1));
      setLikedMap((prev) => ({ ...prev, [gallery.galleryId]: !liked }));
      setGalleries((prev) => prev.map((item) => item.galleryId === gallery.galleryId ? { ...item, likeCount: nextCount } : item));
      setViewer((prev) => prev?.galleryId === gallery.galleryId ? { ...prev, likeCount: nextCount } : prev);
    } catch (err) {
      console.error("[EventGallery] like toggle failed:", err);
    }
  }, [ensureAuthed, likedMap, meUserId]);

  const handleCreate = useCallback(async () => {
    if (!ensureAuthed()) return;
    if (!writeForm.eventId) return setWriteError("행사를 선택해 주세요.");
    if (!writeForm.title.trim()) return setWriteError("제목을 입력해 주세요.");
    if (!writeForm.files.length) return setWriteError("이미지를 한 장 이상 선택해 주세요.");

    setWriteLoading(true);
    setWriteError("");
    try {
      const uploaded = [];
      for (const file of writeForm.files) {
        const res = await galleryApi.uploadImage(file);
        const publicPath = res?.data?.data?.publicPath ?? res?.data?.publicPath;
        if (publicPath) uploaded.push(publicPath);
      }
      await galleryApi.createByUser({ eventId: Number(writeForm.eventId), title: writeForm.title.trim(), description: writeForm.description.trim(), imageUrls: uploaded });
      setWriteOpen(false);
      setWriteForm({ eventId: selectedEventId || "", title: "", description: "", files: [] });
      await loadGalleries();
    } catch (err) {
      console.error("[EventGallery] create failed:", err);
      setWriteError(err?.response?.data?.message || "갤러리 등록에 실패했습니다.");
    } finally {
      setWriteLoading(false);
    }
  }, [ensureAuthed, loadGalleries, selectedEventId, writeForm]);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)", fontFamily: "'Noto Sans KR', sans-serif" }}>
      <PageHeader title="행사 갤러리" subtitle="실제 행사별 사진을 모아 보고 조회순, 좋아요순, 최신순으로 정렬할 수 있습니다" categories={SERVICE_CATEGORIES} currentPath="/gallery/eventgallery" onNavigate={(path) => navigate(path)} />
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 20px 64px" }}>
        <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 22, boxShadow: "0 18px 40px rgba(15,23,42,0.06)", overflow: "hidden" }}>
          <div style={{ padding: "26px 28px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <select value={selectedEventId} onChange={(event) => setSearchParams(event.target.value ? { eventId: event.target.value } : {})} style={{ minWidth: 240, height: 44, borderRadius: 12, border: "1px solid #cbd5e1", padding: "0 14px", fontSize: 14, color: "#0f172a", background: "#fff" }}><option value="">전체 행사</option>{events.map((event) => <option key={event.eventId} value={event.eventId}>{event.eventName}</option>)}</select>
            <div style={{ position: "relative", flex: 1, minWidth: 220 }}><Search size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="제목, 설명, 행사명 검색" style={{ width: "100%", height: 44, borderRadius: 12, border: "1px solid #cbd5e1", padding: "0 14px 0 40px", fontSize: 14, color: "#0f172a" }} /></div>
            <div style={{ position: "relative" }}><button type="button" onClick={() => setSortMenuOpen((prev) => !prev)} style={{ height: 44, minWidth: 136, borderRadius: 12, border: "1px solid #cbd5e1", background: "#fff", padding: "0 14px", display: "inline-flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 13, fontWeight: 800, color: "#334155", cursor: "pointer" }}><span>{SORT_OPTIONS.find((item) => item.value === sortOption)?.label}</span><ChevronDown size={14} /></button>{sortMenuOpen ? <div style={{ position: "absolute", top: 50, right: 0, minWidth: 136, borderRadius: 14, overflow: "hidden", border: "1px solid #e2e8f0", background: "#fff", boxShadow: "0 18px 36px rgba(15,23,42,0.14)", zIndex: 20 }}>{SORT_OPTIONS.map((option) => <button key={option.value} type="button" onClick={() => { setSortOption(option.value); setSortMenuOpen(false); }} style={{ width: "100%", height: 42, border: "none", background: sortOption === option.value ? "#eff6ff" : "#fff", color: sortOption === option.value ? "#1d4ed8" : "#334155", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>{option.label}</button>)}</div> : null}</div>
            {isAuthed ? <button type="button" onClick={() => { setWriteError(""); setWriteForm({ eventId: selectedEventId || "", title: "", description: "", files: [] }); setWriteOpen(true); }} style={{ marginLeft: "auto", height: 44, padding: "0 18px", borderRadius: 12, border: "none", background: "#1d4ed8", color: "#fff", display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 800, cursor: "pointer" }}><Plus size={16} /> 글쓰기</button> : null}
          </div>
          <div style={{ padding: 28 }}>
            {loading ? <div style={{ minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#64748b", fontSize: 14 }}><Loader2 size={18} className="animate-spin" /> 갤러리를 불러오는 중입니다.</div> : error ? <div style={{ minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626", fontSize: 14 }}>{error}</div> : pagedGalleries.length === 0 ? <div style={{ minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 14 }}>조건에 맞는 갤러리가 없습니다.</div> : <><div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">{pagedGalleries.map((gallery) => { const cover = gallery.imageUrls[0] || ""; const liked = !!likedMap[gallery.galleryId]; return <article key={gallery.galleryId} style={{ borderRadius: 20, overflow: "hidden", border: "1px solid #e2e8f0", background: "#fff", boxShadow: "0 12px 24px rgba(15,23,42,0.05)", display: "flex", flexDirection: "column" }}><button type="button" onClick={() => openViewer(gallery)} style={{ border: "none", padding: 0, background: "none", cursor: "pointer" }}><div style={{ aspectRatio: "4 / 3", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>{cover ? <img src={cover} alt={gallery.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : <ImageOff size={30} color="#94a3b8" />}</div></button><div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}><div><div style={{ fontSize: 12, fontWeight: 800, color: "#1d4ed8", marginBottom: 6 }}>{eventNameMap[String(gallery.eventId)] || `행사 ${gallery.eventId}`}</div><div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", lineHeight: 1.35 }}>{gallery.title}</div><div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7, color: "#64748b", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{gallery.description || "설명이 없습니다."}</div></div><div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, paddingTop: 12, borderTop: "1px solid #eef2f7" }}><div style={{ display: "flex", gap: 12, fontSize: 12, color: "#64748b" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Calendar size={13} /> {formatDate(gallery.createdAt)}</span><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Eye size={13} /> {gallery.viewCount}</span></div><button type="button" onClick={() => toggleLike(gallery)} style={{ border: "none", background: "none", color: liked ? "#e11d48" : "#64748b", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, cursor: "pointer" }}><Heart size={14} fill={liked ? "currentColor" : "none"} /> {gallery.likeCount}</button></div></div></article>; })}</div><div style={{ marginTop: 26, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}><button type="button" onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage <= 1} style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid #dbe2ea", background: currentPage <= 1 ? "#f8fafc" : "#fff", color: currentPage <= 1 ? "#cbd5e1" : "#334155", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: currentPage <= 1 ? "not-allowed" : "pointer" }}><ChevronLeft size={16} /></button><span style={{ minWidth: 110, textAlign: "center", fontSize: 13, fontWeight: 800, color: "#475569" }}>{currentPage} / {totalPages}</span><button type="button" onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage >= totalPages} style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid #dbe2ea", background: currentPage >= totalPages ? "#f8fafc" : "#fff", color: currentPage >= totalPages ? "#cbd5e1" : "#334155", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: currentPage >= totalPages ? "not-allowed" : "pointer" }}><ChevronRight size={16} /></button></div></>}
          </div>
        </section>
      </main>
      <GalleryWriteModal open={writeOpen} events={events} form={writeForm} onChange={(field, value) => setWriteForm((prev) => ({ ...prev, [field]: value }))} onFilesChange={(files) => setWriteForm((prev) => ({ ...prev, files }))} onClose={() => setWriteOpen(false)} onSubmit={handleCreate} loading={writeLoading} error={writeError} />
      <GalleryViewer item={viewer} eventName={eventNameMap[String(viewer?.eventId)] || `행사 ${viewer?.eventId || ""}`} onClose={() => setViewer(null)} onToggleLike={() => viewer && toggleLike(viewer)} liked={!!likedMap[viewer?.galleryId]} />
    </div>
  );
}




