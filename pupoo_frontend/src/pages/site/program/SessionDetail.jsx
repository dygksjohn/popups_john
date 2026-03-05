import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Mic2,
  Phone,
  Tag,
} from "lucide-react";
import { eventApi } from "../../../app/http/eventApi";
import { programApi } from "../../../app/http/programApi";

const FALLBACK_IMGS = [
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900&h=500&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=900&h=500&fit=crop",
  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=900&h=500&fit=crop",
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900&h=500&fit=crop",
  "https://images.unsplash.com/photo-1552053831-71594a27632d?w=900&h=500&fit=crop",
];

const AVATAR_COLORS = [
  "#1a4fd6",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
];

const CATEGORY_MAP = {
  SESSION: "세션",
  EXPERIENCE: "체험",
  CONTEST: "콘테스트",
};

function fallbackImg(id) {
  return FALLBACK_IMGS[Math.abs(Number(id) || 0) % FALLBACK_IMGS.length];
}

function avatarColor(id) {
  return AVATAR_COLORS[Math.abs(Number(id) || 0) % AVATAR_COLORS.length];
}

function fmtDate(v) {
  if (!v) return "일정 미정";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "일정 미정";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function fmtTime(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fmtTimeRange(startAt, endAt) {
  const s = fmtTime(startAt);
  const e = fmtTime(endAt);
  if (s && e) return `${s} ~ ${e}`;
  if (s) return `${s} ~`;
  return "시간 미정";
}

function statusInfo(item) {
  const raw = String(item?.status ?? "").toUpperCase();
  if (raw.includes("LIVE") || raw.includes("ONGOING") || raw.includes("PROGRESS")) {
    return { label: "진행 중", bg: "#ecfdf5", color: "#059669", dot: "#10b981" };
  }
  if (raw.includes("DONE") || raw.includes("END") || raw.includes("FINISH")) {
    return { label: "종료", bg: "#f3f4f6", color: "#9ca3af", dot: "#9ca3af" };
  }
  const now = Date.now();
  const s = new Date(item?.startAt).getTime();
  const e = new Date(item?.endAt).getTime();
  if (Number.isFinite(s) && now < s) {
    return { label: "예정", bg: "#fff7ed", color: "#d97706", dot: "#f59e0b" };
  }
  if (Number.isFinite(e) && now > e) {
    return { label: "종료", bg: "#f3f4f6", color: "#9ca3af", dot: "#9ca3af" };
  }
  return { label: "진행 중", bg: "#ecfdf5", color: "#059669", dot: "#10b981" };
}

const css = `
  .sd-root { background:#f8f9fc; min-height:100vh; }
  .sd-hero { position:relative; width:100%; height:320px; overflow:hidden; }
  .sd-hero img { width:100%; height:100%; object-fit:cover; }
  .sd-hero-ov { position:absolute; inset:0; background:linear-gradient(to bottom, rgba(0,0,0,.08), rgba(0,0,0,.58)); }
  .sd-hero-back {
    position:absolute; top:20px; left:20px; z-index:2;
    width:40px; height:40px; border-radius:50%;
    background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.3);
    color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer;
  }
  .sd-hero-ct { position:absolute; left:0; right:0; bottom:0; padding:28px 24px; color:#fff; z-index:2; max-width:1200px; margin:0 auto; }
  .sd-hero-title { font-size:28px; font-weight:800; margin-top:10px; line-height:1.3; }
  .sd-hero-sub { margin-top:6px; font-size:14px; color:rgba(255,255,255,.85); }
  .sd-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:700; }
  .sd-main { max-width:1200px; margin:-60px auto 0; padding:0 24px 56px; display:grid; grid-template-columns:1fr 340px; gap:20px; position:relative; z-index:3; }
  .sd-card { background:#fff; border:1px solid #e9ecef; border-radius:16px; padding:24px; }
  .sd-title { display:flex; align-items:center; gap:8px; margin-bottom:16px; font-size:16px; font-weight:800; color:#111827; }
  .sd-icon-box { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; }
  .sd-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .sd-item { display:flex; align-items:flex-start; gap:10px; }
  .sd-item-label { font-size:11px; color:#9ca3af; }
  .sd-item-value { font-size:14px; color:#111827; font-weight:700; margin-top:2px; }
  .sd-desc { white-space:pre-wrap; line-height:1.7; color:#374151; font-size:14px; }
  .sd-speaker {
    display:flex; gap:12px; background:#f8f9fc; border:1px solid #edf0f4; border-radius:14px;
    padding:14px; cursor:pointer; transition:.15s border-color, .15s box-shadow;
  }
  .sd-speaker:hover { border-color:#d5ddef; box-shadow:0 2px 12px rgba(0,0,0,.04); }
  .sd-speaker-av { width:50px; height:50px; border-radius:50%; color:#fff; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:800; flex-shrink:0; }
  .sd-speaker-name { font-size:15px; font-weight:800; color:#111827; }
  .sd-speaker-bio { margin-top:4px; color:#6b7280; font-size:12.5px; line-height:1.45; }
  .sd-speaker-ct { margin-top:8px; display:flex; gap:12px; flex-wrap:wrap; color:#9ca3af; font-size:12px; }
  .sd-chip { color:#9ca3af; font-size:12px; font-weight:600; }
  .sd-sidebar { display:flex; flex-direction:column; gap:16px; }
  .sd-side-title { font-size:14px; font-weight:800; color:#111827; margin-bottom:12px; display:flex; align-items:center; gap:6px; }
  .sd-event-link {
    display:flex; gap:10px; align-items:center; padding:12px; border:1px solid #edf0f4; border-radius:10px;
    background:#f8f9fc; cursor:pointer;
  }
  .sd-event-link img { width:44px; height:44px; border-radius:10px; object-fit:cover; flex-shrink:0; }
  .sd-btn { width:100%; border:none; border-radius:10px; padding:12px; font-size:14px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; }
  .sd-btn-primary { background:#1a4fd6; color:#fff; }
  .sd-btn-secondary { background:#f8f9fc; color:#374151; border:1px solid #e5e7eb; margin-top:8px; }
  .sd-load, .sd-err { min-height:60vh; display:flex; align-items:center; justify-content:center; color:#9ca3af; }
  @media (max-width: 920px) {
    .sd-hero { height:250px; }
    .sd-hero-title { font-size:22px; }
    .sd-main { grid-template-columns:1fr; padding:0 16px 40px; }
    .sd-grid { grid-template-columns:1fr; }
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
      try {
        const [progRes, speakerRes] = await Promise.all([
          programApi.getProgramDetail(programId),
          programApi.getProgramSpeakers(programId).catch(() => ({ data: { data: [] } })),
        ]);

        if (!mounted) return;
        const prog = progRes?.data?.data;
        const speakerList = Array.isArray(speakerRes?.data?.data) ? speakerRes.data.data : [];

        setProgram(prog ?? null);
        setSpeaker(speakerList[0] ?? null);

        if (prog?.eventId) {
          try {
            const evRes = await eventApi.getEventDetail(prog.eventId);
            if (mounted) setEventInfo(evRes?.data?.data ?? null);
          } catch {
            if (mounted) setEventInfo(null);
          }
        } else {
          setEventInfo(null);
        }
      } catch (e) {
        if (!mounted) return;
        const code = e?.response?.status;
        const msg = e?.response?.data?.message || e?.message || "Program detail load failed";
        setErrorMsg(code ? `[${code}] ${msg}` : msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [programId]);

  if (loading) {
    return (
      <div className="sd-root">
        <style>{css}</style>
        <div className="sd-load">Loading...</div>
      </div>
    );
  }

  if (errorMsg || !program) {
    return (
      <div className="sd-root">
        <style>{css}</style>
        <div className="sd-err">
          <div>
            <div style={{ color: "#dc2626", marginBottom: 14 }}>{errorMsg || "Program not found."}</div>
            <button className="sd-btn sd-btn-secondary" onClick={() => navigate(-1)}>
              <ArrowLeft size={14} /> Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const categoryRaw = String(program?.category ?? program?.programCategory ?? "").toUpperCase();
  const categoryLabel = CATEGORY_MAP[categoryRaw] || "프로그램";
  const st = statusInfo(program);
  const heroImg = program?.imageUrl || fallbackImg(programId);
  const eventImg = eventInfo?.imageUrl || fallbackImg(program?.eventId);

  const goSpeakerDetail = () => {
    if (!speaker?.speakerId) return;
    navigate(`/program/speaker/detail?speakerId=${speaker.speakerId}&programId=${program.programId}`);
  };

  return (
    <div className="sd-root">
      <style>{css}</style>

      <section className="sd-hero">
        <img
          src={heroImg}
          alt=""
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = fallbackImg(programId);
          }}
        />
        <div className="sd-hero-ov" />
        <button className="sd-hero-back" onClick={() => navigate(-1)} aria-label="back">
          <ArrowLeft size={18} />
        </button>
        <div className="sd-hero-ct">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="sd-badge" style={{ background: st.bg, color: st.color }}>
              <span
                style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot }}
              />
              {st.label}
            </span>
            <span
              className="sd-badge"
              style={{ background: "rgba(255,255,255,.16)", color: "#fff" }}
            >
              {categoryLabel}
            </span>
          </div>
          <div className="sd-hero-title">
            {program.programTitle || program.programName || "프로그램"}
          </div>
          <div className="sd-hero-sub">{eventInfo?.eventName || "행사 정보"}</div>
        </div>
      </section>

      <section className="sd-main">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="sd-card">
            <div className="sd-title">
              <div className="sd-icon-box" style={{ background: "#eff4ff" }}>
                <BookOpen size={15} color="#1a4fd6" />
              </div>
              프로그램 정보
            </div>
            <div className="sd-grid">
              <div className="sd-item">
                <div className="sd-icon-box" style={{ background: "#eff4ff" }}>
                  <Calendar size={15} color="#1a4fd6" />
                </div>
                <div>
                  <div className="sd-item-label">날짜</div>
                  <div className="sd-item-value">{fmtDate(program.startAt)}</div>
                </div>
              </div>
              <div className="sd-item">
                <div className="sd-icon-box" style={{ background: "#fef3c7" }}>
                  <Clock size={15} color="#d97706" />
                </div>
                <div>
                  <div className="sd-item-label">시간</div>
                  <div className="sd-item-value">{fmtTimeRange(program.startAt, program.endAt)}</div>
                </div>
              </div>
              <div className="sd-item">
                <div className="sd-icon-box" style={{ background: "#ecfdf5" }}>
                  <MapPin size={15} color="#10b981" />
                </div>
                <div>
                  <div className="sd-item-label">장소</div>
                  <div className="sd-item-value">
                    {program.location || program.place || program.boothName || "장소 미정"}
                  </div>
                </div>
              </div>
              <div className="sd-item">
                <div className="sd-icon-box" style={{ background: "#f3e8ff" }}>
                  <Tag size={15} color="#8b5cf6" />
                </div>
                <div>
                  <div className="sd-item-label">카테고리</div>
                  <div className="sd-item-value">{categoryLabel}</div>
                </div>
              </div>
            </div>
          </div>

          {!!program.description && (
            <div className="sd-card">
              <div className="sd-title">
                <div className="sd-icon-box" style={{ background: "#fff7ed" }}>
                  <BookOpen size={15} color="#ea580c" />
                </div>
                프로그램 소개
              </div>
              <div className="sd-desc">{program.description}</div>
            </div>
          )}

          <div className="sd-card">
            <div className="sd-title">
              <div className="sd-icon-box" style={{ background: "#f3e8ff" }}>
                <Mic2 size={15} color="#8b5cf6" />
              </div>
              연사 정보
              <span className="sd-chip">{speaker ? "1명" : "0명"}</span>
            </div>

            {!speaker ? (
              <div style={{ padding: "14px 0", color: "#9ca3af", textAlign: "center" }}>
                등록된 연사가 없습니다.
              </div>
            ) : (
              <div
                className="sd-speaker"
                role="button"
                tabIndex={0}
                onClick={goSpeakerDetail}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    goSpeakerDetail();
                  }
                }}
              >
                <div
                  className="sd-speaker-av"
                  style={{ background: avatarColor(speaker.speakerId) }}
                >
                  {(speaker.speakerName || "?").charAt(0)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="sd-speaker-name">{speaker.speakerName}</div>
                  {!!speaker.speakerBio && <div className="sd-speaker-bio">{speaker.speakerBio}</div>}
                  {(speaker.speakerEmail || speaker.speakerPhone) && (
                    <div className="sd-speaker-ct">
                      {!!speaker.speakerEmail && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Mail size={11} /> {speaker.speakerEmail}
                        </span>
                      )}
                      {!!speaker.speakerPhone && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Phone size={11} /> {speaker.speakerPhone}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="sd-sidebar">
          {!!eventInfo && (
            <div className="sd-card">
              <div className="sd-side-title">
                <ExternalLink size={14} color="#1a4fd6" /> 소속 행사
              </div>
              <div className="sd-event-link" onClick={() => navigate(`/program/schedule/${program.eventId}`)}>
                <img
                  src={eventImg}
                  alt=""
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = fallbackImg(program?.eventId);
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                    {eventInfo.eventName}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                    {eventInfo.location || "장소 미정"}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="sd-card" style={{ padding: 16 }}>
            <button className="sd-btn sd-btn-primary" onClick={() => navigate(`/program/schedule/${program.eventId}`)}>
              <ChevronRight size={15} /> 전체 프로그램 보기
            </button>
            <button className="sd-btn sd-btn-secondary" onClick={() => navigate(-1)}>
              <ArrowLeft size={14} /> 뒤로 가기
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}
