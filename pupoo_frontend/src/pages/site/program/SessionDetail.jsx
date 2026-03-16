import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Clock,
  ImageOff,
  Mail,
  MapPin,
  Mic2,
  Phone,
  Tag,
  ArrowUpRight,
} from "lucide-react";
import { eventApi } from "../../../app/http/eventApi";
import { programApi } from "../../../app/http/programApi";
import { toPublicAssetUrl } from "../../../shared/utils/publicAssetUrl";
import {
  getProgramImage,
  loadImageCache as loadProgramImageCache,
} from "../../admin/shared/programImageStore";

const FONT = "'Kakao Big Sans', Pretendard, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";

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
  if (raw.includes("SESSION") || raw.includes("LECTURE") || raw.includes("SEMINAR") || raw.includes("세션") || raw.includes("강연")) return "SESSION";
  if (raw.includes("EXPERIENCE") || raw.includes("EXHIBIT") || raw.includes("BOOTH") || raw.includes("체험")) return "EXPERIENCE";
  if (raw.includes("CONTEST") || raw.includes("VOTE") || raw.includes("COMPETITION") || raw.includes("콘테스트") || raw.includes("대회") || raw.includes("투표")) return "CONTEST";
  return "ETC";
}

function fmtDate(v) {
  if (!v) return "일정 미정";
  const d = new Date(v);
  if (isNaN(d)) return "일정 미정";
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} (${days[d.getDay()]})`;
}
function fmtTime(v) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d)) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function fmtRange(s, e) {
  const a = fmtTime(s), b = fmtTime(e);
  return a && b ? `${a} ~ ${b}` : a ? `${a} ~` : "시간 미정";
}
function statusInfo(item) {
  const raw = String(item?.status ?? "").toUpperCase();
  if (raw.includes("LIVE") || raw.includes("ONGOING") || raw.includes("PROGRESS"))
    return { label: "진행 중", color: "#059669" };
  if (raw.includes("DONE") || raw.includes("END") || raw.includes("FINISH"))
    return { label: "종료", color: "#9ca3af" };
  const now = Date.now(), s = new Date(item?.startAt).getTime(), e = new Date(item?.endAt).getTime();
  if (isFinite(s) && now < s)
    return { label: "예정", color: "#d97706" };
  if (isFinite(e) && now > e)
    return { label: "종료", color: "#9ca3af" };
  return { label: "진행 중", color: "#059669" };
}

const css = `
.kd-root {
  min-height: 100vh;
  font-family: ${FONT};
  background: #fff;
}

/* ── 히어로 ── */
.kd-hero {
  position: relative;
  width: 100%;
  min-height: 520px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  background: #111;
}
.kd-hero-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: brightness(0.35) saturate(1.2);
  transition: transform 0.6s ease;
}
.kd-hero:hover .kd-hero-bg {
  transform: scale(1.03);
}
.kd-hero-empty {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}
.kd-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.85) 100%);
}
.kd-hero-content {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 60px 40px 56px;
}
.kd-hero-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.kd-hero-tag {
  display: inline-flex;
  align-items: center;
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.02em;
  border: 1px solid rgba(255,255,255,0.2);
  backdrop-filter: blur(4px);
}
.kd-hero-title {
  font-size: 44px;
  font-weight: 800;
  color: #fff;
  line-height: 1.25;
  letter-spacing: -0.03em;
  margin: 0 0 16px;
  max-width: 750px;
}
.kd-hero-event {
  font-size: 17px;
  color: rgba(255,255,255,0.6);
  font-weight: 400;
}

/* ── 정보 바 ── */
.kd-info-bar {
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
}
.kd-info-bar-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  align-items: stretch;
}
.kd-info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px 0;
  flex: 1;
  border-right: 1px solid #f0f0f0;
  padding-right: 32px;
  margin-right: 32px;
}
.kd-info-item:last-child {
  border-right: none;
  padding-right: 0;
  margin-right: 0;
}
.kd-info-item svg {
  flex-shrink: 0;
  color: #bbb;
}
.kd-info-item-label {
  font-size: 13px;
  color: #aaa;
  font-weight: 500;
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.kd-info-item-value {
  font-size: 17px;
  color: #222;
  font-weight: 700;
}

/* ── 본문 ── */
.kd-body {
  max-width: 1100px;
  margin: 0 auto;
  padding: 64px 40px 100px;
}

/* 섹션 */
.kd-section {
  margin-bottom: 64px;
}
.kd-section:last-child {
  margin-bottom: 0;
}
.kd-section-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 20px;
}
.kd-section-label::after {
  content: '';
  display: block;
  width: 40px;
  height: 1px;
  background: #ddd;
}
.kd-desc-text {
  font-size: 18px;
  line-height: 2;
  color: #444;
  white-space: pre-wrap;
  word-break: keep-all;
  max-width: 750px;
}

/* 포스터 */
.kd-poster-section {
  margin-bottom: 64px;
}
.kd-poster-img {
  width: 100%;
  max-width: 750px;
  display: block;
  border-radius: 12px;
}

/* 연사 */
.kd-speaker {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 28px 32px;
  background: #fafafa;
  border-radius: 16px;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
  max-width: 750px;
}
.kd-speaker:hover {
  background: #f5f5f5;
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
}
.kd-speaker-av {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 900;
  color: #fff;
  flex-shrink: 0;
  overflow: hidden;
}
.kd-speaker-av img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.kd-speaker-name {
  font-size: 20px;
  font-weight: 800;
  color: #111;
  margin-bottom: 4px;
}
.kd-speaker-bio {
  font-size: 16px;
  color: #888;
  line-height: 1.5;
}
.kd-speaker-contact {
  margin-top: 8px;
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #aaa;
}
.kd-speaker-contact-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.kd-speaker-arrow {
  margin-left: auto;
  flex-shrink: 0;
  color: #ccc;
}

/* 소속 행사 */
.kd-event-banner {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px 32px;
  background: #f7f8fa;
  border-radius: 16px;
  cursor: pointer;
  transition: background 0.2s;
  max-width: 750px;
}
.kd-event-banner:hover {
  background: #f0f1f4;
}
.kd-event-thumb {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  object-fit: cover;
  flex-shrink: 0;
  background: #e8ecf4;
}
.kd-event-name {
  font-size: 17px;
  font-weight: 700;
  color: #222;
}
.kd-event-loc {
  font-size: 14px;
  color: #aaa;
  margin-top: 3px;
}

/* 하단 네비 */
.kd-bottom-nav {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 40px 80px;
  display: flex;
  justify-content: center;
  gap: 12px;
}
.kd-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 32px;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 700;
  font-family: ${FONT};
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}
.kd-nav-btn-dark {
  background: #222;
  color: #fff;
}
.kd-nav-btn-dark:hover {
  background: #000;
}
.kd-nav-btn-light {
  background: #f3f4f6;
  color: #555;
  border: none;
}
.kd-nav-btn-light:hover {
  background: #e5e7eb;
  color: #222;
}

/* 로딩/에러 */
.kd-center {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-family: ${FONT};
}
@keyframes kd-spin { to { transform: rotate(360deg); } }
@keyframes kd-dot { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }

@media (max-width: 768px) {
  .kd-hero { min-height: 380px; }
  .kd-hero-title { font-size: 26px; }
  .kd-hero-content { padding: 40px 20px 40px; }
  .kd-info-bar-inner { flex-direction: column; padding: 0 20px; }
  .kd-info-item { border-right: none; border-bottom: 1px solid #f0f0f0; padding: 16px 0; margin-right: 0; padding-right: 0; }
  .kd-info-item:last-child { border-bottom: none; }
  .kd-body { padding: 40px 20px 60px; }
  .kd-speaker { flex-direction: column; text-align: center; gap: 16px; }
  .kd-speaker-arrow { display: none; }
  .kd-speaker-contact { justify-content: center; }
  .kd-bottom-nav { padding: 0 20px 60px; flex-direction: column; }
  .kd-nav-btn { justify-content: center; }
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
        const cat = normalizeProgramCategory(prog?.category ?? prog?.programCategory);
        const [speakerRes, eventRes] = await Promise.all([
          cat === "SESSION"
            ? programApi.getProgramSpeakers(programId).catch(() => ({ data: { data: [] } }))
            : Promise.resolve({ data: { data: [] } }),
          prog?.eventId
            ? eventApi.getEventDetail(prog.eventId).catch(() => null)
            : Promise.resolve(null),
        ]);
        if (!mounted) return;
        const spList = Array.isArray(speakerRes?.data?.data) ? speakerRes.data.data : [];
        setProgram(prog ?? null);
        setSpeaker(cat === "SESSION" ? spList[0] ?? null : null);
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
    return () => { mounted = false; };
  }, [programId]);

  if (loading)
    return (
      <div className="kd-root">
        <style>{css}</style>
        <div className="kd-center" style={{ flexDirection: "column", gap: 16 }}>
          <div style={{ display: "inline-flex", alignItems: "flex-end", gap: 5, height: 30 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#9ca3af", animation: "kd-dot 1.4s ease-in-out 0s infinite" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#9ca3af", animation: "kd-dot 1.4s ease-in-out 0.2s infinite" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#9ca3af", animation: "kd-dot 1.4s ease-in-out 0.4s infinite" }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#adb5bd" }}>데이터를 불러오는 중입니다</span>
        </div>
      </div>
    );

  if (errorMsg || !program)
    return (
      <div className="kd-root">
        <style>{css}</style>
        <div className="kd-center">
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#dc2626", marginBottom: 14, fontSize: 14 }}>{errorMsg || "프로그램을 찾을 수 없습니다."}</div>
            <button className="kd-nav-btn kd-nav-btn-light" onClick={() => navigate(-1)}>
              <ArrowLeft size={14} /> 뒤로 가기
            </button>
          </div>
        </div>
      </div>
    );

  const normalizedCategory = normalizeProgramCategory(program?.category ?? program?.programCategory);
  const catMeta = CATEGORY_META[normalizedCategory] || CATEGORY_META.ETC;
  const showSpeaker = normalizedCategory === "SESSION";
  const st = statusInfo(program);
  const heroImg = getProgramImage(programId) || program?.imageUrl || null;
  const hasImg = !!heroImg && !imgFailed;
  const speakerImageUrl = toPublicAssetUrl(speaker?.speakerImageUrl);
  const title = program.programTitle || program.programName || "프로그램";

  const goSpeaker = () => {
    if (!speaker?.speakerId) return;
    navigate(`/program/speaker/detail?speakerId=${speaker.speakerId}&programId=${program.programId}`);
  };

  return (
    <div className="kd-root">
      <style>{css}</style>

      {/* ── 히어로 배너 ── */}
      <div className="kd-hero">
        {hasImg ? (
          <div className="kd-hero-bg" style={{ backgroundImage: `url(${heroImg})` }} />
        ) : (
          <div className="kd-hero-empty" />
        )}
        <div className="kd-hero-overlay" />
        <div className="kd-hero-content">
          <div className="kd-hero-meta">
            <span className="kd-hero-tag" style={{ color: st.color, borderColor: st.color }}>
              {st.label}
            </span>
            <span className="kd-hero-tag" style={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.15)" }}>
              {catMeta.label}
            </span>
          </div>
          <h1 className="kd-hero-title">{title}</h1>
          {eventInfo?.eventName && (
            <div className="kd-hero-event">{eventInfo.eventName}</div>
          )}
        </div>
      </div>

      {/* ── 정보 바 ── */}
      <div className="kd-info-bar">
        <div className="kd-info-bar-inner">
          <div className="kd-info-item">
            <Calendar size={18} />
            <div>
              <div className="kd-info-item-label">날짜</div>
              <div className="kd-info-item-value">{fmtDate(program.startAt)}</div>
            </div>
          </div>
          <div className="kd-info-item">
            <Clock size={18} />
            <div>
              <div className="kd-info-item-label">시간</div>
              <div className="kd-info-item-value">{fmtRange(program.startAt, program.endAt)}</div>
            </div>
          </div>
          <div className="kd-info-item">
            <MapPin size={18} />
            <div>
              <div className="kd-info-item-label">장소</div>
              <div className="kd-info-item-value">{program.location || program.place || program.boothName || "장소 미정"}</div>
            </div>
          </div>
          <div className="kd-info-item">
            <Tag size={18} />
            <div>
              <div className="kd-info-item-label">카테고리</div>
              <div className="kd-info-item-value">{catMeta.label}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 본문 ── */}
      <div className="kd-body">
        {/* 포스터 원본 */}
        {hasImg && (
          <div className="kd-poster-section">
            <div className="kd-section-label">Poster</div>
            <img className="kd-poster-img" src={heroImg} alt={title} onError={() => setImgFailed(true)} />
          </div>
        )}

        {/* 프로그램 소개 */}
        {!!program.description && (
          <div className="kd-section">
            <div className="kd-section-label">About</div>
            <div className="kd-desc-text">{program.description}</div>
          </div>
        )}

        {/* 연사 정보 */}
        {showSpeaker && (
          <div className="kd-section">
            <div className="kd-section-label">Speaker</div>
            {!speaker ? (
              <div style={{ color: "#bbb", fontSize: 14 }}>등록된 연사가 없습니다.</div>
            ) : (
              <div className="kd-speaker" role="button" tabIndex={0} onClick={goSpeaker} onKeyDown={(e) => { if (e.key === "Enter") goSpeaker(); }}>
                <div className="kd-speaker-av" style={{ background: avatarColor(speaker.speakerId) }}>
                  {speakerImageUrl ? (
                    <img src={speakerImageUrl} alt={speaker.speakerName || "speaker"} />
                  ) : (
                    (speaker.speakerName || "?").charAt(0)
                  )}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="kd-speaker-name">{speaker.speakerName}</div>
                  {!!speaker.speakerBio && <div className="kd-speaker-bio">{speaker.speakerBio}</div>}
                  {(speaker.speakerEmail || speaker.speakerPhone) && (
                    <div className="kd-speaker-contact">
                      {!!speaker.speakerEmail && <span className="kd-speaker-contact-item"><Mail size={11} />{speaker.speakerEmail}</span>}
                      {!!speaker.speakerPhone && <span className="kd-speaker-contact-item"><Phone size={11} />{speaker.speakerPhone}</span>}
                    </div>
                  )}
                </div>
                <ChevronRight size={20} className="kd-speaker-arrow" />
              </div>
            )}
          </div>
        )}

        {/* 소속 행사 */}
        {!!eventInfo && (
          <div className="kd-section">
            <div className="kd-section-label">Event</div>
            <div className="kd-event-banner" onClick={() => navigate(`/program/all/${program.eventId}`)}>
              {eventInfo.imageUrl ? (
                <img className="kd-event-thumb" src={eventInfo.imageUrl} alt="" />
              ) : (
                <div className="kd-event-thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Calendar size={22} color="#b0bcce" />
                </div>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="kd-event-name">{eventInfo.eventName}</div>
                <div className="kd-event-loc">{eventInfo.location || "장소 미정"}</div>
              </div>
              <ArrowUpRight size={18} color="#bbb" style={{ flexShrink: 0 }} />
            </div>
          </div>
        )}
      </div>

      {/* ── 하단 버튼 ── */}
      <div className="kd-bottom-nav">
        <button className="kd-nav-btn kd-nav-btn-dark" onClick={() => navigate(`/program/all/${program.eventId}`)}>
          전체 프로그램 보기 <ChevronRight size={15} />
        </button>
        <button className="kd-nav-btn kd-nav-btn-light" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> 뒤로가기
        </button>
      </div>
    </div>
  );
}
