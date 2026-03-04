import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { programApi } from "../../../app/http/programApi";
import { eventApi } from "../../../app/http/eventApi";
import {
  ArrowLeft, Calendar, Clock, MapPin, User, Mail, Phone,
  ChevronRight, Tag, BookOpen, Mic2, ExternalLink,
} from "lucide-react";

/* ── 이미지 폴백 ── */
const DOG_IMGS = [
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900&h=500&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=900&h=500&fit=crop",
  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=900&h=500&fit=crop",
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900&h=500&fit=crop",
  "https://images.unsplash.com/photo-1552053831-71594a27632d?w=900&h=500&fit=crop",
  "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=900&h=500&fit=crop",
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=900&h=500&fit=crop",
  "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=900&h=500&fit=crop",
];
const dogImg = (id) => DOG_IMGS[Math.abs(Number(id) || 0) % DOG_IMGS.length];
const AVATAR_COLORS = ["#1a4fd6","#059669","#d97706","#dc2626","#7c3aed","#0891b2","#be185d","#4338ca"];
const avatarColor = (i) => AVATAR_COLORS[i % AVATAR_COLORS.length];

function fmtDate(v) {
  if (!v) return "일정 미정";
  const d = new Date(v);
  if (isNaN(d)) return "일정 미정";
  const w = ["일","월","화","수","목","금","토"];
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")} (${w[d.getDay()]})`;
}
function fmtTime(v) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d)) return "";
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
function fmtTimeRange(s, e) {
  const st = fmtTime(s), et = fmtTime(e);
  if (st && et) return `${st} ~ ${et}`;
  if (st) return `${st} ~`;
  return "시간 미정";
}
function statusInfo(item) {
  const raw = String(item?.status ?? "").toUpperCase();
  if (raw.includes("LIVE") || raw.includes("ONGOING") || raw.includes("PROGRESS"))
    return { label: "진행 중", bg: "#ecfdf5", color: "#059669", dot: "#10b981" };
  if (raw.includes("DONE") || raw.includes("END") || raw.includes("FINISH"))
    return { label: "종료", bg: "#f3f4f6", color: "#9ca3af", dot: "#9ca3af" };
  const s = new Date(item?.startAt)?.getTime();
  const e = new Date(item?.endAt)?.getTime();
  const now = Date.now();
  if (s && now < s) return { label: "예정", bg: "#fff7ed", color: "#d97706", dot: "#f59e0b" };
  if (e && now > e) return { label: "종료", bg: "#f3f4f6", color: "#9ca3af", dot: "#9ca3af" };
  return { label: "진행 중", bg: "#ecfdf5", color: "#059669", dot: "#10b981" };
}
const CATEGORY_MAP = { SESSION: "세션", EXPERIENCE: "체험", CONTEST: "콘테스트" };

const css = `
  .sd-root { background:#f8f9fc; min-height:100vh; }
  .sd-hero { position:relative; width:100%; height:340px; overflow:hidden; }
  .sd-hero img { width:100%; height:100%; object-fit:cover; }
  .sd-hero-ov { position:absolute; inset:0; background:linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.58) 100%); }
  .sd-hero-ct { position:absolute; bottom:0; left:0; right:0; padding:32px 0; }
  .sd-hero-ct-inner { max-width:1200px; margin:0 auto; padding:0 24px; }
  .sd-hero-back {
    position:absolute; top:20px; left:20px; z-index:2;
    width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,0.15); backdrop-filter:blur(8px);
    border:1px solid rgba(255,255,255,0.2); color:#fff;
    display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .15s;
  }
  .sd-hero-back:hover { background:rgba(255,255,255,0.3); }
  .sd-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:700; }
  .sd-hero-title { font-size:28px; font-weight:800; color:#fff; line-height:1.3; text-shadow:0 2px 12px rgba(0,0,0,0.25); margin-top:10px; }
  .sd-hero-sub { margin-top:6px; font-size:14px; color:rgba(255,255,255,0.8); }

  .sd-main { max-width:1200px; margin:-60px auto 0; padding:0 24px 64px; position:relative; z-index:1; display:grid; grid-template-columns:1fr 340px; gap:24px; }
  .sd-card { background:#fff; border:1px solid #e9ecef; border-radius:16px; padding:28px; }
  .sd-card-t { font-size:16px; font-weight:800; color:#111827; display:flex; align-items:center; gap:8px; margin-bottom:18px; }
  .sd-card-ico { width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

  .sd-igrid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .sd-iitem { display:flex; align-items:flex-start; gap:10px; }
  .sd-iico { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .sd-ilb { font-size:11px; color:#9ca3af; font-weight:500; }
  .sd-iv { font-size:14px; color:#111827; font-weight:700; margin-top:2px; }

  .sd-desc { font-size:14.5px; color:#374151; line-height:1.8; white-space:pre-wrap; }

  .sd-spks { display:flex; flex-direction:column; gap:14px; }
  .sd-spk {
    display:flex; gap:14px; padding:16px; background:#f8f9fc; border-radius:14px;
    border:1px solid #f1f3f5; transition:border-color .15s, box-shadow .15s;
  }
  .sd-spk:hover { border-color:#dde4f0; box-shadow:0 2px 12px rgba(0,0,0,0.04); }
  .sd-spk-av {
    width:52px; height:52px; border-radius:50%; display:flex; align-items:center; justify-content:center;
    color:#fff; font-size:18px; font-weight:800; flex-shrink:0;
  }
  .sd-spk-nm { font-size:15px; font-weight:700; color:#111827; }
  .sd-spk-bio { font-size:12.5px; color:#6b7280; margin-top:3px; line-height:1.45; }
  .sd-spk-ct { font-size:12px; color:#9ca3af; margin-top:6px; display:flex; gap:12px; flex-wrap:wrap; }
  .sd-spk-ci { display:inline-flex; align-items:center; gap:4px; }

  .sd-sidebar { display:flex; flex-direction:column; gap:20px; }
  .sd-sc { background:#fff; border:1px solid #e9ecef; border-radius:16px; padding:22px; }
  .sd-st { font-size:14px; font-weight:800; color:#111827; margin-bottom:14px; display:flex; align-items:center; gap:6px; }

  .sd-evl {
    display:flex; align-items:center; gap:10px; padding:12px 14px;
    background:#f8f9fc; border-radius:10px; cursor:pointer; border:1px solid #f1f3f5; transition:all .15s;
  }
  .sd-evl:hover { border-color:#dde4f0; background:#eff4ff; }
  .sd-evl img { width:44px; height:44px; border-radius:10px; object-fit:cover; flex-shrink:0; }

  .sd-btn {
    width:100%; padding:12px 0; border-radius:10px; border:none; font-size:14px; font-weight:700;
    cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:all .15s; font-family:inherit;
  }
  .sd-btn-p { background:#1a4fd6; color:#fff; }
  .sd-btn-p:hover { background:#1541b0; }
  .sd-btn-s { background:#f8f9fc; color:#374151; border:1px solid #e5e7eb; margin-top:8px; }
  .sd-btn-s:hover { background:#eff4ff; border-color:#c7d2fe; color:#1a4fd6; }

  .sd-load { display:flex; align-items:center; justify-content:center; min-height:60vh; color:#9ca3af; font-size:15px; }
  .sd-err { max-width:500px; margin:80px auto; text-align:center; }

  @media (max-width: 900px) {
    .sd-main { grid-template-columns:1fr; }
    .sd-hero { height:260px; }
    .sd-hero-title { font-size:22px; }
    .sd-igrid { grid-template-columns:1fr; }
  }
`;

export default function SessionDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const programId = searchParams.get("programId");

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [program, setProgram] = useState(null);
  const [speakers, setSpeakers] = useState([]);
  const [eventInfo, setEventInfo] = useState(null);

  useEffect(() => {
    if (!programId) { setErrorMsg("programId가 없습니다."); setLoading(false); return; }
    let mounted = true;
    (async () => {
      setLoading(true); setErrorMsg("");
      try {
        const [progRes, spkRes] = await Promise.all([
          programApi.getProgramDetail(programId),
          programApi.getProgramSpeakers(programId).catch(() => ({ data: { data: [] } })),
        ]);
        if (!mounted) return;
        const prog = progRes.data.data;
        setProgram(prog);
        setSpeakers(spkRes.data.data || []);
        if (prog?.eventId) {
          try {
            const evRes = await eventApi.getEventDetail(prog.eventId);
            if (mounted) setEventInfo(evRes.data.data);
          } catch {}
        }
      } catch (e) {
        if (!mounted) return;
        const code = e?.response?.status;
        const msg = e?.response?.data?.message || e?.message || "프로그램 상세 조회 실패";
        setErrorMsg(code ? `[${code}] ${msg}` : msg);
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [programId]);

  if (loading) return (<div className="sd-root"><style>{css}</style><div className="sd-load">로딩 중...</div></div>);

  if (errorMsg || !program) return (
    <div className="sd-root"><style>{css}</style>
      <div className="sd-err">
        <div style={{ color: "#dc2626", fontSize: 14, marginBottom: 16 }}>{errorMsg || "데이터 없음"}</div>
        <button onClick={() => navigate(-1)} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>뒤로 가기</button>
      </div>
    </div>
  );

  const st = statusInfo(program);
  const catRaw = String(program?.category ?? program?.programCategory ?? "").toUpperCase();
  const catLabel = CATEGORY_MAP[catRaw] || "프로그램";
  const heroImg = program?.imageUrl ?? program?.image_url ?? program?.posterUrl ?? program?.thumbnail ?? eventInfo?.imageUrl ?? dogImg(programId);
  const eventImg = eventInfo?.imageUrl ?? eventInfo?.posterUrl ?? dogImg(program?.eventId);

  return (
    <div className="sd-root">
      <style>{css}</style>

      {/* Hero */}
      <div className="sd-hero">
        <img src={heroImg} alt="" onError={(e) => { e.target.onerror = null; e.target.src = dogImg(programId); }} />
        <div className="sd-hero-ov" />
        <button className="sd-hero-back" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <div className="sd-hero-ct"><div className="sd-hero-ct-inner">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="sd-badge" style={{ background: st.bg, color: st.color }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot }} />{st.label}
            </span>
            <span className="sd-badge" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", backdropFilter: "blur(4px)" }}>{catLabel}</span>
          </div>
          <div className="sd-hero-title">{program.programTitle || program.programName || "프로그램"}</div>
          <div className="sd-hero-sub">{eventInfo?.eventName || "행사 정보"}</div>
        </div></div>
      </div>

      {/* Main */}
      <div className="sd-main">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* 프로그램 정보 */}
          <div className="sd-card">
            <div className="sd-card-t"><div className="sd-card-ico" style={{ background: "#eff4ff" }}><BookOpen size={16} color="#1a4fd6" /></div>프로그램 정보</div>
            <div className="sd-igrid">
              <div className="sd-iitem">
                <div className="sd-iico" style={{ background: "#eff4ff" }}><Calendar size={16} color="#1a4fd6" /></div>
                <div><div className="sd-ilb">날짜</div><div className="sd-iv">{fmtDate(program.startAt)}</div></div>
              </div>
              <div className="sd-iitem">
                <div className="sd-iico" style={{ background: "#fef3c7" }}><Clock size={16} color="#f59e0b" /></div>
                <div><div className="sd-ilb">시간</div><div className="sd-iv">{fmtTimeRange(program.startAt, program.endAt)}</div></div>
              </div>
              <div className="sd-iitem">
                <div className="sd-iico" style={{ background: "#ecfdf5" }}><MapPin size={16} color="#10b981" /></div>
                <div><div className="sd-ilb">장소</div><div className="sd-iv">{program.location || program.place || program.boothName || "장소 미정"}</div></div>
              </div>
              <div className="sd-iitem">
                <div className="sd-iico" style={{ background: "#f3e8ff" }}><Tag size={16} color="#8b5cf6" /></div>
                <div><div className="sd-ilb">카테고리</div><div className="sd-iv">{catLabel}</div></div>
              </div>
            </div>
          </div>

          {/* 소개 */}
          {program.description && (
            <div className="sd-card">
              <div className="sd-card-t"><div className="sd-card-ico" style={{ background: "#fff7ed" }}><BookOpen size={16} color="#ea580c" /></div>프로그램 소개</div>
              <div className="sd-desc">{program.description}</div>
            </div>
          )}

          {/* 연사 */}
          <div className="sd-card">
            <div className="sd-card-t">
              <div className="sd-card-ico" style={{ background: "#f3e8ff" }}><Mic2 size={16} color="#8b5cf6" /></div>
              연사 정보
              <span style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", marginLeft: 4 }}>{speakers.length}명</span>
            </div>
            {speakers.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>등록된 연사가 없습니다.</div>
            ) : (
              <div className="sd-spks">
                {speakers.map((s, i) => (
                  <div className="sd-spk" key={s.speakerId || i}>
                    <div className="sd-spk-av" style={{ background: avatarColor(i) }}>{(s.speakerName || "?").charAt(0)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="sd-spk-nm">{s.speakerName}</div>
                      {s.speakerBio && <div className="sd-spk-bio">{s.speakerBio}</div>}
                      {(s.speakerEmail || s.speakerPhone) && (
                        <div className="sd-spk-ct">
                          {s.speakerEmail && <span className="sd-spk-ci"><Mail size={11} /> {s.speakerEmail}</span>}
                          {s.speakerPhone && <span className="sd-spk-ci"><Phone size={11} /> {s.speakerPhone}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="sd-sidebar">
          {eventInfo && (
            <div className="sd-sc">
              <div className="sd-st"><ExternalLink size={14} color="#1a4fd6" /> 소속 행사</div>
              <div className="sd-evl" onClick={() => navigate(`/program/schedule/${program.eventId}`)}>
                <img src={eventImg} alt="" onError={(e) => { e.target.onerror = null; e.target.src = dogImg(program?.eventId); }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{eventInfo.eventName}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{eventInfo.location || "장소 미정"}</div>
                </div>
              </div>
            </div>
          )}

          <div className="sd-sc">
            <div className="sd-st"><Calendar size={14} color="#1a4fd6" /> 일정 요약</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1a4fd6", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>시작</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{fmtDate(program.startAt)} {fmtTime(program.startAt)}</div>
                </div>
              </div>
              <div style={{ width: 1, height: 16, background: "#e5e7eb", marginLeft: 3.5 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>종료</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{fmtDate(program.endAt)} {fmtTime(program.endAt)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="sd-sc" style={{ padding: 16 }}>
            <button className="sd-btn sd-btn-p" onClick={() => navigate(`/program/schedule/${program.eventId}`)}>
              <ChevronRight size={15} /> 전체 프로그램 보기
            </button>
            <button className="sd-btn sd-btn-s" onClick={() => navigate(-1)}>
              <ArrowLeft size={14} /> 뒤로 가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
