import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  ExternalLink,
  ImageOff,
  Mail,
  MapPin,
  Mic2,
  Phone,
  Tag,
} from "lucide-react";
import { eventApi } from "../../../app/http/eventApi";
import { programApi } from "../../../app/http/programApi";
import { toPublicAssetUrl } from "../../../shared/utils/publicAssetUrl";
import {
  getProgramImage,
  loadImageCache as loadProgramImageCache,
} from "../../admin/shared/programImageStore";

const AVATAR_COLORS = ["#1a4fd6", "#059669", "#d97706", "#dc2626", "#7c3aed"];
const CATEGORY_META = {
  SESSION: { label: "세션/강연", bg: "#eff4ff", color: "#1a4fd6" },
  EXPERIENCE: { label: "체험", bg: "#ecfdf5", color: "#059669" },
  CONTEST: { label: "콘테스트", bg: "#fef3c7", color: "#b45309" },
  ETC: { label: "프로그램", bg: "#f3f4f6", color: "#4b5563" },
};

const avatarColor = (id) =>
  AVATAR_COLORS[Math.abs(Number(id) || 0) % AVATAR_COLORS.length];

function normalizeProgramCategory(value) {
  const raw = String(value ?? "").toUpperCase();
  if (
    raw.includes("SESSION") ||
    raw.includes("LECTURE") ||
    raw.includes("SEMINAR") ||
    raw.includes("세션") ||
    raw.includes("강연")
  ) {
    return "SESSION";
  }
  if (
    raw.includes("EXPERIENCE") ||
    raw.includes("EXHIBIT") ||
    raw.includes("BOOTH") ||
    raw.includes("체험")
  ) {
    return "EXPERIENCE";
  }
  if (
    raw.includes("CONTEST") ||
    raw.includes("VOTE") ||
    raw.includes("COMPETITION") ||
    raw.includes("콘테스트") ||
    raw.includes("대회") ||
    raw.includes("투표")
  ) {
    return "CONTEST";
  }
  return "ETC";
}

function fmtDate(v) {
  if (!v) return "일정 미정";
  const d = new Date(v);
  if (isNaN(d)) return "일정 미정";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
function fmtTime(v) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d)) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function fmtRange(s, e) {
  const a = fmtTime(s),
    b = fmtTime(e);
  return a && b ? `${a} ~ ${b}` : a ? `${a} ~` : "시간 미정";
}
function statusInfo(item) {
  const raw = String(item?.status ?? "").toUpperCase();
  if (
    raw.includes("LIVE") ||
    raw.includes("ONGOING") ||
    raw.includes("PROGRESS")
  )
    return {
      label: "진행 중",
      bg: "#ecfdf5",
      color: "#059669",
      dot: "#10b981",
    };
  if (raw.includes("DONE") || raw.includes("END") || raw.includes("FINISH"))
    return { label: "종료", bg: "#f3f4f6", color: "#9ca3af", dot: "#9ca3af" };
  const now = Date.now(),
    s = new Date(item?.startAt).getTime(),
    e = new Date(item?.endAt).getTime();
  if (isFinite(s) && now < s)
    return { label: "예정", bg: "#fff7ed", color: "#d97706", dot: "#f59e0b" };
  if (isFinite(e) && now > e)
    return { label: "종료", bg: "#f3f4f6", color: "#9ca3af", dot: "#9ca3af" };
  return { label: "진행 중", bg: "#ecfdf5", color: "#059669", dot: "#10b981" };
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');

.sd-root {
  background: #f4f6fb;
  min-height: 100vh;
  font-family: 'Noto Sans KR', sans-serif;
}

/* ── 뒤로가기 플로팅 버튼 ── */
.sd-float-back {
  position: fixed;
  top: 18px; left: 18px;
  z-index: 200;
}
.sd-back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff; border-radius: 999px;
  padding: 9px 16px; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: background 0.2s;
  font-family: inherit;
}
.sd-back-btn:hover { background: rgba(0,0,0,0.65); }

/* ── 포스터 풀 표시 ── */
.sd-poster-section {
  width: 100%;
  background: #0d0d0d;
  display: flex;
  justify-content: center;
  position: relative;
}
.sd-poster-section img {
  display: block;
  width: 100%;
  max-width: 700px;
  height: auto;
  object-fit: contain;   /* 절대 잘리지 않음 */
}
/* 포스터 → 본문 자연스러운 페이드 */
.sd-poster-fade {
  position: absolute;
  bottom: 0; left: 0; right: 0; height: 120px;
  background: linear-gradient(to bottom, transparent, #0d0d0d 80%, #f4f6fb 100%);
  pointer-events: none;
}

/* 이미지 없을 때 */
.sd-poster-empty {
  width: 100%; padding: 80px 0 60px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 10px;
  background: linear-gradient(135deg,#1e293b,#334155);
}
.sd-poster-empty span { font-size:13px; color:rgba(255,255,255,0.3); }

/* ── 제목 오버레이 (포스터 위) ── */
.sd-title-overlay {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  z-index: 10;
  display: flex; justify-content: center;
  padding-bottom: 28px;
  background: linear-gradient(to bottom, transparent 0%, rgba(13,13,13,0.85) 100%);
}
.sd-title-inner {
  width: 100%; max-width: 700px; padding: 0 25px;
}
.sd-badges { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px; }
.sd-status-badge {
  display:inline-flex; align-items:center; gap:5px;
  padding:4px 12px; border-radius:999px; font-size:12px; font-weight:700;
}
.sd-cat-badge {
  padding:4px 12px; border-radius:999px; font-size:12px; font-weight:700;
  background:rgba(255,255,255,0.15); color:#fff;
  border:1px solid rgba(255,255,255,0.25);
}
.sd-hero-title {
  font-size:26px; font-weight:900; color:#fff; line-height:1.3;
  letter-spacing:-0.02em; text-shadow:0 2px 16px rgba(0,0,0,0.6);
}
.sd-hero-sub { margin-top:5px; font-size:13px; color:rgba(255,255,255,0.65); }

/* ── 본문 ── */
.sd-body {
  max-width: 1060px;
  margin: 0 auto;
  padding: 28px 24px 72px;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  align-items: start;
}
.sd-left { display:flex; flex-direction:column; gap:16px; }

/* ── 카드 ── */
.sd-card {
  background:#fff; border-radius:16px;
  padding:22px 24px; border:1px solid #e8ecf4;
  box-shadow:0 1px 4px rgba(0,0,0,0.04);
}
.sd-card-title {
  display:flex; align-items:center; gap:8px;
  font-size:15px; font-weight:800; color:#111827;
  margin-bottom:18px; padding-bottom:14px;
  border-bottom:1px solid #f1f4f9;
}
.sd-pill {
  width:28px; height:28px; border-radius:8px;
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
}

/* 정보 그리드 */
.sd-info-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.sd-info-item {
  display:flex; align-items:flex-start; gap:10px;
  padding:12px 14px; background:#f8faff;
  border-radius:12px; border:1px solid #edf0f8;
}
.sd-info-label { font-size:11px; color:#9ca3af; font-weight:500; }
.sd-info-value { font-size:14px; color:#111827; font-weight:700; margin-top:3px; }

/* 소개 */
.sd-desc { white-space:pre-wrap; line-height:1.8; color:#374151; font-size:14px; }

/* 연사 */
.sd-speaker-row {
  display:flex; gap:14px; padding:14px;
  background:#f8faff; border:1px solid #edf0f8;
  border-radius:14px; cursor:pointer;
  transition:border-color 0.15s, box-shadow 0.15s;
}
.sd-speaker-row:hover { border-color:#c7d5f0; box-shadow:0 4px 16px rgba(26,79,214,0.08); }
.sd-av {
  width:50px; height:50px; border-radius:14px;
  display:flex; align-items:center; justify-content:center;
  font-size:20px; font-weight:900; color:#fff; flex-shrink:0;
  overflow:hidden;
}
.sd-av img { width:100%; height:100%; object-fit:cover; display:block; }
.sd-sp-name  { font-size:15px; font-weight:800; color:#111827; }
.sd-sp-bio   { margin-top:3px; color:#6b7280; font-size:12.5px; line-height:1.5; }
.sd-sp-ct    { margin-top:6px; display:flex; gap:12px; flex-wrap:wrap; color:#9ca3af; font-size:12px; }
.sd-ct-item  { display:inline-flex; align-items:center; gap:4px; }
.sd-empty    { padding:18px 0; text-align:center; color:#b0bcce; font-size:13px; }

/* 사이드바 */
.sd-sidebar  { display:flex; flex-direction:column; gap:14px; position:sticky; top:24px; }
.sd-side-label {
  font-size:11px; font-weight:700; color:#9ca3af;
  text-transform:uppercase; letter-spacing:0.08em;
  margin-bottom:10px; display:flex; align-items:center; gap:6px;
}
.sd-event-row {
  display:flex; gap:12px; align-items:center; padding:12px;
  border-radius:12px; background:#f8faff; border:1px solid #edf0f8;
  cursor:pointer; transition:border-color 0.15s;
}
.sd-event-row:hover { border-color:#c7d5f0; }
.sd-event-thumb {
  width:46px; height:46px; border-radius:10px;
  object-fit:cover; flex-shrink:0; background:#e8ecf4;
}
.sd-event-name { font-size:13px; font-weight:700; color:#111827; }
.sd-event-loc  { font-size:11px; color:#9ca3af; margin-top:2px; }

/* 버튼 */
.sd-btn {
  width:100%; border:none; border-radius:10px;
  padding:13px; font-size:14px; font-weight:700;
  cursor:pointer; display:flex; align-items:center;
  justify-content:center; gap:6px;
  font-family:inherit; transition:opacity 0.15s;
}
.sd-btn:hover { opacity:0.85; }
.sd-btn-primary   { background:#1a4fd6; color:#fff; }
.sd-btn-secondary { background:#fff; color:#374151; border:1px solid #e2e8f0; margin-top:8px; }

/* 로딩/에러 */
.sd-center { min-height:60vh; display:flex; align-items:center; justify-content:center; color:#9ca3af; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width:900px) {
  .sd-body { grid-template-columns:1fr; padding:20px 16px 56px; }
  .sd-info-grid { grid-template-columns:1fr; }
  .sd-sidebar { position:static; }
  .sd-hero-title { font-size:20px; }
}
`;

export default function SessionDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const programId = searchParams.get("programId");

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [program, setProgram] = useState(null);
  const [speaker, setSpeaker] = useState(null);
  const [eventInfo, setEventInfo] = useState(null);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    if (!programId) {
      setErrorMsg("programId is required.");
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      setLoading(true);
      setErrorMsg("");
      await loadProgramImageCache();
      try {
        const progRes = await programApi.getProgramDetail(programId);
        const prog = progRes?.data?.data;
        const normalizedCategory = normalizeProgramCategory(
          prog?.category ?? prog?.programCategory,
        );
        const [speakerRes, eventRes] = await Promise.all([
          normalizedCategory === "SESSION"
            ? programApi
                .getProgramSpeakers(programId)
                .catch(() => ({ data: { data: [] } }))
            : Promise.resolve({ data: { data: [] } }),
          prog?.eventId
            ? eventApi.getEventDetail(prog.eventId).catch(() => null)
            : Promise.resolve(null),
        ]);
        if (!mounted) return;
        const spList = Array.isArray(speakerRes?.data?.data)
          ? speakerRes.data.data
          : [];
        setProgram(prog ?? null);
        setSpeaker(normalizedCategory === "SESSION" ? spList[0] ?? null : null);
        setEventInfo(eventRes?.data?.data ?? null);
      } catch (e) {
        if (!mounted) return;
        const code = e?.response?.status;
        const msg = e?.response?.data?.message || e?.message || "불러오기 실패";
        setErrorMsg(code ? `[${code}] ${msg}` : msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [programId]);

  if (loading)
    return (
      <div className="sd-root">
        <style>{css}</style>
        <div className="sd-center" style={{ flexDirection: "column", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              border: "3px solid #e2e8f0",
              borderTopColor: "#1a4fd6",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span style={{ fontSize: 13 }}>불러오는 중...</span>
        </div>
      </div>
    );

  if (errorMsg || !program)
    return (
      <div className="sd-root">
        <style>{css}</style>
        <div className="sd-center">
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#dc2626", marginBottom: 14, fontSize: 14 }}>
              {errorMsg || "프로그램을 찾을 수 없습니다."}
            </div>
            <button
              className="sd-btn sd-btn-secondary"
              style={{ width: "auto", padding: "10px 20px" }}
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={14} /> 뒤로 가기
            </button>
          </div>
        </div>
      </div>
    );

  const normalizedCategory = normalizeProgramCategory(
    program?.category ?? program?.programCategory,
  );
  const catMeta = CATEGORY_META[normalizedCategory] || CATEGORY_META.ETC;
  const catLabel = catMeta.label;
  const catColor = { bg: catMeta.bg, color: catMeta.color };
  const showSpeakerSection = normalizedCategory === "SESSION";
  const st = statusInfo(program);
  const heroImg = getProgramImage(programId) || program?.imageUrl || null;
  const hasImg = !!heroImg && !imgFailed;
  const speakerImageUrl = toPublicAssetUrl(speaker?.speakerImageUrl);

  const goSpeaker = () => {
    if (!speaker?.speakerId) return;
    navigate(
      `/program/speaker/detail?speakerId=${speaker.speakerId}&programId=${program.programId}`,
    );
  };

  return (
    <div className="sd-root">
      <style>{css}</style>

      {/* 뒤로가기 플로팅 버튼 */}
      <div className="sd-float-back">
        <button className="sd-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> 목록으로
        </button>
      </div>

      {/* ── 포스터 풀 표시 영역 ── */}
      <div className="sd-poster-section">
        {hasImg ? (
          <>
            <img
              src={heroImg}
              alt={program.programTitle || "포스터"}
              onError={() => setImgFailed(true)}
            />
            {/* 제목 오버레이 */}
            <div className="sd-title-overlay">
              <div className="sd-title-inner">
                <div className="sd-badges">
                  <span
                    className="sd-status-badge"
                    style={{ background: st.bg, color: st.color }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: st.dot,
                        display: "inline-block",
                      }}
                    />
                    {st.label}
                  </span>
                  <span className="sd-cat-badge">{catLabel}</span>
                </div>
                <div className="sd-hero-title">
                  {program.programTitle || program.programName || "프로그램"}
                </div>
                {eventInfo?.eventName && (
                  <div className="sd-hero-sub">{eventInfo.eventName}</div>
                )}
              </div>
            </div>
            <div className="sd-poster-fade" />
          </>
        ) : (
          /* 이미지 없을 때 다크 플레이스홀더 + 제목 */
          <div style={{ width: "100%", maxWidth: 700, position: "relative" }}>
            <div className="sd-poster-empty">
              <ImageOff
                size={40}
                color="rgba(255,255,255,0.2)"
                strokeWidth={1.2}
              />
              <span>등록된 포스터가 없습니다</span>
            </div>
            <div
              className="sd-title-overlay"
              style={{
                position: "relative",
                background: "linear-gradient(to bottom,#1e293b,#0f172a)",
                padding: "20px 0 28px",
              }}
            >
              <div className="sd-title-inner">
                <div className="sd-badges">
                  <span
                    className="sd-status-badge"
                    style={{ background: st.bg, color: st.color }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: st.dot,
                        display: "inline-block",
                      }}
                    />
                    {st.label}
                  </span>
                  <span className="sd-cat-badge">{catLabel}</span>
                </div>
                <div className="sd-hero-title">
                  {program.programTitle || program.programName || "프로그램"}
                </div>
                {eventInfo?.eventName && (
                  <div className="sd-hero-sub">{eventInfo.eventName}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 본문 ── */}
      <div className="sd-body">
        <div className="sd-left">
          {/* 프로그램 정보 */}
          <div className="sd-card">
            <div className="sd-card-title">
              <div className="sd-pill" style={{ background: "#eff4ff" }}>
                <BookOpen size={14} color="#1a4fd6" />
              </div>
              프로그램 정보
            </div>
            <div className="sd-info-grid">
              <div className="sd-info-item">
                <div className="sd-pill" style={{ background: "#eff4ff" }}>
                  <Calendar size={14} color="#1a4fd6" />
                </div>
                <div>
                  <div className="sd-info-label">날짜</div>
                  <div className="sd-info-value">
                    {fmtDate(program.startAt)}
                  </div>
                </div>
              </div>
              <div className="sd-info-item">
                <div className="sd-pill" style={{ background: "#fef3c7" }}>
                  <Clock size={14} color="#d97706" />
                </div>
                <div>
                  <div className="sd-info-label">시간</div>
                  <div className="sd-info-value">
                    {fmtRange(program.startAt, program.endAt)}
                  </div>
                </div>
              </div>
              <div className="sd-info-item">
                <div className="sd-pill" style={{ background: "#ecfdf5" }}>
                  <MapPin size={14} color="#10b981" />
                </div>
                <div>
                  <div className="sd-info-label">장소</div>
                  <div className="sd-info-value">
                    {program.location ||
                      program.place ||
                      program.boothName ||
                      "장소 미정"}
                  </div>
                </div>
              </div>
              <div className="sd-info-item">
                <div className="sd-pill" style={{ background: catColor.bg }}>
                  <Tag size={14} color={catColor.color} />
                </div>
                <div>
                  <div className="sd-info-label">카테고리</div>
                  <div className="sd-info-value">{catLabel}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 프로그램 소개 */}
          {!!program.description && (
            <div className="sd-card">
              <div className="sd-card-title">
                <div className="sd-pill" style={{ background: "#fff7ed" }}>
                  <BookOpen size={14} color="#ea580c" />
                </div>
                프로그램 소개
              </div>
              <div className="sd-desc">{program.description}</div>
            </div>
          )}

          {showSpeakerSection && (
            <div className="sd-card">
              <div className="sd-card-title">
                <div className="sd-pill" style={{ background: "#f3e8ff" }}>
                  <Mic2 size={14} color="#8b5cf6" />
                </div>
                연사 정보
                <span
                  style={{
                    marginLeft: 4,
                    fontSize: 12,
                    color: "#9ca3af",
                    fontWeight: 600,
                  }}
                >
                  {speaker ? "1명" : "0명"}
                </span>
              </div>
              {!speaker ? (
                <div className="sd-empty">등록된 연사가 없습니다.</div>
              ) : (
                <div
                  className="sd-speaker-row"
                  role="button"
                  tabIndex={0}
                  onClick={goSpeaker}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") goSpeaker();
                  }}
                >
                  <div
                    className="sd-av"
                    style={{ background: avatarColor(speaker.speakerId) }}
                  >
                    {speakerImageUrl ? (
                      <img
                        src={speakerImageUrl}
                        alt={speaker.speakerName || "speaker"}
                      />
                    ) : (
                      (speaker.speakerName || "?").charAt(0)
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="sd-sp-name">{speaker.speakerName}</div>
                    {!!speaker.speakerBio && (
                      <div className="sd-sp-bio">{speaker.speakerBio}</div>
                    )}
                    {(speaker.speakerEmail || speaker.speakerPhone) && (
                      <div className="sd-sp-ct">
                        {!!speaker.speakerEmail && (
                          <span className="sd-ct-item">
                            <Mail size={11} />
                            {speaker.speakerEmail}
                          </span>
                        )}
                        {!!speaker.speakerPhone && (
                          <span className="sd-ct-item">
                            <Phone size={11} />
                            {speaker.speakerPhone}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 사이드바 */}
        <aside className="sd-sidebar">
          {!!eventInfo && (
            <div className="sd-card">
              <div className="sd-side-label">
                <ExternalLink size={11} /> 소속 행사
              </div>
              <div
                className="sd-event-row"
                onClick={() => navigate(`/program/all/${program.eventId}`)}
              >
                {eventInfo.imageUrl ? (
                  <img
                    className="sd-event-thumb"
                    src={eventInfo.imageUrl}
                    alt=""
                  />
                ) : (
                  <div
                    className="sd-event-thumb"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Calendar size={18} color="#b0bcce" />
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div className="sd-event-name">{eventInfo.eventName}</div>
                  <div className="sd-event-loc">
                    {eventInfo.location || "장소 미정"}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="sd-card" style={{ padding: 16 }}>
            <button
              className="sd-btn sd-btn-primary"
              onClick={() => navigate(`/program/all/${program.eventId}`)}
            >
              <ChevronRight size={15} /> 전체 프로그램 보기
            </button>
            <button
              className="sd-btn sd-btn-secondary"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={14} /> 뒤로 가기
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
