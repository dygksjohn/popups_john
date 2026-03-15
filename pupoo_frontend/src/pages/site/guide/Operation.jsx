import { useEffect, useRef } from "react";
import PageHeader from "../components/PageHeader";
import {
  QrCode,
  PawPrint,
  Map,
  Trash2,
  Dog,
  Syringe,
  ShieldCheck,
  Ban,
  ParkingCircle,
  Stethoscope,
  AlertTriangle,
  Sparkles,
  ArrowDown,
} from "lucide-react";

/* ────────────────────────────────────
   Scroll reveal
   ──────────────────────────────────── */
function useReveal(ref) {
  useEffect(() => {
    if (!ref.current) return;
    const els = ref.current.querySelectorAll("[data-reveal]");
    const ob = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.style.opacity = 1;
            e.target.style.transform = "translateY(0) scale(1)";
            ob.unobserve(e.target);
          }
        }),
      { threshold: 0.12 },
    );
    els.forEach((el) => ob.observe(el));
    return () => ob.disconnect();
  }, [ref]);
}

/* ────────────────────────────────────
   3D Badge component
   ──────────────────────────────────── */
function Badge3D({ Icon, bg, color, shadow, size = 120, iconSize = 52, float = true, className = "" }) {
  return (
    <div
      className={`badge3d ${float ? "badge3d-float" : ""} ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: bg,
        boxShadow: `0 ${size * 0.06}px ${size * 0.25}px ${shadow}, 0 ${size * 0.02}px ${size * 0.06}px rgba(0,0,0,.04), inset 0 -${size * 0.03}px ${size * 0.06}px rgba(0,0,0,.06), inset 0 ${size * 0.03}px ${size * 0.06}px rgba(255,255,255,.5)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        transform: "perspective(600px) rotateX(6deg) rotateY(-4deg)",
        flexShrink: 0,
      }}
    >
      <Icon size={iconSize} style={{ color, position: "relative", zIndex: 1 }} strokeWidth={1.8} />
      <div style={{
        position: "absolute", inset: 0, borderRadius: size * 0.3,
        background: "linear-gradient(135deg, rgba(255,255,255,.35) 0%, transparent 50%)",
        pointerEvents: "none",
      }} />
    </div>
  );
}

/* ────────────────────────────────────
   Data
   ──────────────────────────────────── */
const STEPS = [
  {
    Icon: QrCode, bg: "#EEF1FF", color: "#4F6AFF", shadow: "rgba(79,106,255,.22)",
    img: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop",
    title: "QR 코드 제시",
    desc: "신청 완료 후 발급된 QR 코드를 준비해 주세요.\n입장 게이트에서 스태프에게 QR을 보여주시면 빠르게 입장하실 수 있습니다.",
  },
  {
    Icon: PawPrint, bg: "#FFF3E0", color: "#F59E0B", shadow: "rgba(245,158,11,.22)",
    img: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop",
    title: "반려동물 등록 확인",
    desc: "현장 데스크에서 반려동물 등록증 또는 예방접종 증명서를 확인합니다.\n서류가 준비되지 않으면 입장이 제한될 수 있으니 꼭 지참해 주세요.",
  },
  {
    Icon: Map, bg: "#ECFDF5", color: "#10B981", shadow: "rgba(16,185,129,.22)",
    img: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=600&fit=crop",
    title: "프로그램 참여",
    desc: "안내 지도를 수령한 후 원하시는 부스 및 프로그램에 자유롭게 참여하세요.\n다양한 체험과 이벤트가 준비되어 있습니다!",
  },
  {
    Icon: Trash2, bg: "#F3F0FF", color: "#8B5CF6", shadow: "rgba(139,92,246,.22)",
    img: "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=800&h=600&fit=crop",
    title: "매너 있는 관람",
    desc: "반려동물 배변 봉투는 현장에서 무료 제공됩니다.\n지정 배변 구역을 이용해 깨끗한 행사장을 함께 만들어 주세요.",
  },
];

const RULES = [
  { Icon: Dog, bg: "#EEF1FF", color: "#4F6AFF", shadow: "rgba(79,106,255,.22)", title: "동반 가능 동물", desc: "개, 고양이, 소형 소동물 (케이지 지참 시)\n공격성 있는 동물은 입장이 제한됩니다." },
  { Icon: Syringe, bg: "#ECFDF5", color: "#10B981", shadow: "rgba(16,185,129,.22)", title: "필수 서류", desc: "광견병 등 기본 예방접종 완료 증명서\n미지참 시 현장 입장이 거부될 수 있습니다." },
  { Icon: ShieldCheck, bg: "#EEF2FF", color: "#6366F1", shadow: "rgba(99,102,241,.22)", title: "목줄 / 하네스", desc: "행사장 내 모든 반려동물은\n항상 목줄 또는 하네스를 착용해야 합니다." },
  { Icon: Ban, bg: "#FEF2F2", color: "#EF4444", shadow: "rgba(239,68,68,.22)", title: "금지 사항", desc: "타인 동물 무단 접촉, 무단 급여\n지정 구역 외 배변은 금지됩니다." },
  { Icon: ParkingCircle, bg: "#F3F0FF", color: "#8B5CF6", shadow: "rgba(139,92,246,.22)", title: "주차 안내", desc: "주차 공간이 제한적입니다.\n대중교통 이용을 권장합니다." },
  { Icon: Stethoscope, bg: "#F0FDFA", color: "#14B8A6", shadow: "rgba(20,184,166,.22)", title: "응급 처치", desc: "동물 응급 처치 부스 운영\n긴급 시 안내 데스크로 문의하세요." },
];

/* ────────────────────────────────────
   Styles
   ──────────────────────────────────── */
const css = `
  .gop *{box-sizing:border-box}
  .gop{
    font-family:'Pretendard Variable','Pretendard',-apple-system,sans-serif;
    overflow:hidden;
  }

  /* 3D badge float */
  @keyframes badgeFloat{
    0%,100%{transform:perspective(600px) rotateX(6deg) rotateY(-4deg) translateY(0)}
    50%{transform:perspective(600px) rotateX(6deg) rotateY(-4deg) translateY(-12px)}
  }
  .badge3d-float{animation:badgeFloat 4s ease-in-out infinite}

  /* ── HERO ── */
  .gop-hero{
    background:linear-gradient(160deg,#EEF1FF 0%,#F5F0FF 40%,#FFF8EB 100%);
    padding:80px 32px 96px;
    text-align:center;
    position:relative;
    overflow:hidden;
  }
  .gop-hero-deco1{
    position:absolute;width:500px;height:500px;border-radius:50%;
    background:radial-gradient(circle,rgba(79,106,255,.08) 0%,transparent 65%);
    top:-200px;left:-100px;pointer-events:none;
  }
  .gop-hero-deco2{
    position:absolute;width:400px;height:400px;border-radius:50%;
    background:radial-gradient(circle,rgba(245,158,11,.06) 0%,transparent 65%);
    bottom:-150px;right:-80px;pointer-events:none;
  }
  .gop-hero-badges{
    display:flex;justify-content:center;gap:24px;
    margin-bottom:40px;position:relative;z-index:1;
  }
  .gop-hero h2{
    font-size:36px;font-weight:900;color:#111;
    line-height:1.45;margin:0 0 16px;letter-spacing:-.5px;
    position:relative;z-index:1;
  }
  .gop-hero h2 em{
    font-style:normal;
    background:linear-gradient(135deg,#4F6AFF,#8B5CF6);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;
    background-clip:text;
  }
  .gop-hero-sub{
    font-size:16px;color:#6B7280;line-height:1.7;margin:0 0 36px;
    position:relative;z-index:1;
  }
  .gop-scroll-hint{
    display:inline-flex;flex-direction:column;align-items:center;gap:6px;
    font-size:12px;font-weight:700;color:#b0b5c3;letter-spacing:1px;
    text-transform:uppercase;position:relative;z-index:1;
  }
  @keyframes bounceDown{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}
  .gop-scroll-hint svg{animation:bounceDown 1.8s ease-in-out infinite}

  /* ── STEP SECTION (alternating) ── */
  .gop-step{
    display:flex;align-items:center;gap:64px;
    max-width:1400px;margin:0 auto;
    padding:88px 32px;
  }
  .gop-step.reverse{flex-direction:row-reverse}
  .gop-step-visual{
    flex:0 0 46%;position:relative;
  }
  .gop-step-img{
    width:100%;aspect-ratio:4/3;
    border-radius:28px;
    object-fit:cover;
    box-shadow:0 24px 64px rgba(0,0,0,.10),0 4px 16px rgba(0,0,0,.04);
  }
  .gop-step-badge{
    position:absolute;
    bottom:-28px;right:-20px;
    z-index:2;
    filter:drop-shadow(0 8px 24px rgba(0,0,0,.10));
  }
  .gop-step.reverse .gop-step-badge{
    right:auto;left:-20px;
  }
  .gop-step-body{flex:1;min-width:0}
  .gop-step-num{
    display:inline-flex;align-items:center;gap:8px;
    font-size:13px;font-weight:800;letter-spacing:2px;
    text-transform:uppercase;
    margin-bottom:16px;padding:6px 16px;
    border-radius:999px;
  }
  .gop-step-title{
    font-size:28px;font-weight:900;color:#111;
    margin:0 0 16px;letter-spacing:-.3px;line-height:1.35;
  }
  .gop-step-desc{
    font-size:16px;color:#6B7280;line-height:1.85;
    white-space:pre-line;
  }

  /* step bg alternation */
  .gop-step-wrap:nth-child(odd){background:#fff}
  .gop-step-wrap:nth-child(even){background:#F8F9FC}

  /* ── RULES SECTION ── */
  .gop-rules{
    background:linear-gradient(180deg,#F8F9FC 0%,#fff 100%);
    padding:88px 32px;
  }
  .gop-rules-inner{max-width:1400px;margin:0 auto}
  .gop-rules-head{text-align:center;margin-bottom:56px}
  .gop-rules-tag{
    display:inline-flex;align-items:center;gap:6px;
    font-size:12px;font-weight:800;letter-spacing:1.5px;
    text-transform:uppercase;color:#4F6AFF;
    background:#EEF1FF;border-radius:999px;
    padding:8px 20px;margin-bottom:16px;
  }
  .gop-rules-title{
    font-size:32px;font-weight:900;color:#111;
    line-height:1.4;margin:0;letter-spacing:-.3px;
  }
  .gop-rules-title em{
    font-style:normal;
    background:linear-gradient(135deg,#4F6AFF,#8B5CF6);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;
    background-clip:text;
  }
  .gop-rules-grid{
    display:grid;grid-template-columns:repeat(3,1fr);
    gap:24px;
  }
  .gop-rcard{
    background:#fff;
    border-radius:28px;
    padding:36px 28px 32px;
    text-align:center;
    border:1px solid #f0f0f0;
    transition:all .4s cubic-bezier(.16,1,.3,1);
  }
  .gop-rcard:hover{
    transform:translateY(-10px);
    box-shadow:0 24px 56px rgba(0,0,0,.08);
    border-color:transparent;
  }
  .gop-rcard .badge3d{
    margin:0 auto 24px;
  }
  .gop-rcard:hover .badge3d{
    animation-play-state:paused;
    transform:perspective(600px) rotateX(0) rotateY(0) scale(1.05);
  }
  .gop-rcard-title{
    font-size:18px;font-weight:800;color:#111;
    margin-bottom:12px;
  }
  .gop-rcard-desc{
    font-size:14px;color:#6B7280;line-height:1.75;
    white-space:pre-line;
  }

  /* ── NOTICE ── */
  .gop-alert{
    max-width:1400px;margin:0 auto;
    padding:0 32px 88px;
  }
  .gop-alert-box{
    background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);
    border-radius:28px;
    padding:44px 48px;
    display:flex;align-items:center;gap:28px;
    position:relative;overflow:hidden;
  }
  .gop-alert-box::before{
    content:'';position:absolute;
    width:300px;height:300px;border-radius:50%;
    background:radial-gradient(circle,rgba(251,191,36,.12) 0%,transparent 65%);
    top:-100px;right:-60px;pointer-events:none;
  }
  .gop-alert-icon{
    width:64px;height:64px;border-radius:20px;
    background:rgba(251,191,36,.12);
    display:flex;align-items:center;justify-content:center;
    flex-shrink:0;color:#FBBF24;
  }
  .gop-alert-body{flex:1}
  .gop-alert-title{font-size:18px;font-weight:800;color:#fff;margin-bottom:10px}
  .gop-alert-text{font-size:15px;color:rgba(255,255,255,.5);line-height:1.85}

  /* ── RESPONSIVE ── */
  @media(max-width:860px){
    .gop-hero h2{font-size:28px}
    .gop-hero-badges .badge3d{width:80px!important;height:80px!important;border-radius:24px!important}
    .gop-hero-badges .badge3d svg{width:36px!important;height:36px!important}
    .gop-step{flex-direction:column!important;gap:36px;padding:56px 24px}
    .gop-step-visual{flex:none;width:100%}
    .gop-step-badge{bottom:-20px;right:8px!important;left:auto!important}
    .gop-step-badge .badge3d{width:72px!important;height:72px!important;border-radius:22px!important}
    .gop-step-badge .badge3d svg{width:32px!important;height:32px!important}
    .gop-step-title{font-size:24px}
    .gop-rules{padding:56px 24px}
    .gop-rules-title{font-size:26px}
    .gop-rules-grid{grid-template-columns:repeat(2,1fr);gap:16px}
    .gop-alert{padding:0 24px 56px}
    .gop-alert-box{padding:32px 28px;flex-direction:column;align-items:flex-start;gap:20px}
  }
  @media(max-width:560px){
    .gop-hero{padding:56px 20px 64px}
    .gop-hero h2{font-size:24px}
    .gop-hero-badges{gap:16px}
    .gop-hero-badges .badge3d{width:64px!important;height:64px!important;border-radius:20px!important}
    .gop-hero-badges .badge3d svg{width:28px!important;height:28px!important}
    .gop-step{padding:40px 20px}
    .gop-step-title{font-size:22px}
    .gop-step-desc{font-size:15px}
    .gop-rules-grid{grid-template-columns:1fr;gap:14px}
    .gop-rules-title{font-size:22px}
    .gop-alert{padding:0 20px 48px}
    .gop-alert-box{padding:28px 24px}
  }
`;

/* ────────────────────────────────────
   Reveal helper
   ──────────────────────────────────── */
const rv = (delay = 0) => ({
  "data-reveal": true,
  style: {
    opacity: 0,
    transform: "translateY(48px) scale(.96)",
    transition: `opacity .75s cubic-bezier(.16,1,.3,1) ${delay}s, transform .75s cubic-bezier(.16,1,.3,1) ${delay}s`,
  },
});

/* ────────────────────────────────────
   Page
   ──────────────────────────────────── */
export default function Operation() {
  const rootRef = useRef(null);
  useReveal(rootRef);

  return (
    <div>
      <PageHeader
        title="현장 운영 안내"
        subtitle="원활하고 즐거운 행사 참여를 위해 아래 안내 사항을 미리 확인해 주세요"
        categories={[{ label: "현장 운영 안내", path: "/guide/operation" }]}
        currentPath="/guide/operation"
      />

      <div className="gop" ref={rootRef}>
        <style>{css}</style>

        {/* ════════ HERO ════════ */}
        <section className="gop-hero">
          <div className="gop-hero-deco1" />
          <div className="gop-hero-deco2" />

          <div {...rv(0)}>
            <div className="gop-hero-badges">
              <Badge3D Icon={QrCode} bg="#EEF1FF" color="#4F6AFF" shadow="rgba(79,106,255,.25)" size={100} iconSize={44} />
              <Badge3D Icon={PawPrint} bg="#FFF3E0" color="#F59E0B" shadow="rgba(245,158,11,.25)" size={110} iconSize={48} />
              <Badge3D Icon={Map} bg="#ECFDF5" color="#10B981" shadow="rgba(16,185,129,.25)" size={100} iconSize={44} />
            </div>
          </div>

          <div {...rv(0.15)}>
            <h2>
              한눈에 살펴보세요!<br />
              <em>현장 운영 안내</em> 모음 zip.
            </h2>
            <p className="gop-hero-sub">
              입장부터 퇴장까지, 즐겁고 안전한 행사 참여를 위한 가이드입니다.
            </p>
          </div>

          <div {...rv(0.3)} className="gop-scroll-hint">
            scroll
            <ArrowDown size={16} />
          </div>
        </section>

        {/* ════════ ENTRY STEPS (alternating image + text) ════════ */}
        {STEPS.map((step, i) => (
          <div key={i} className="gop-step-wrap">
            <div className={`gop-step ${i % 2 === 1 ? "reverse" : ""}`}>
              <div className="gop-step-visual" {...rv(0)}>
                <img
                  className="gop-step-img"
                  src={step.img}
                  alt={step.title}
                  loading="lazy"
                  onError={(e) => { e.target.style.background = "#e5e7eb"; }}
                />
                <div className="gop-step-badge">
                  <Badge3D
                    Icon={step.Icon}
                    bg={step.bg}
                    color={step.color}
                    shadow={step.shadow}
                    size={88}
                    iconSize={40}
                  />
                </div>
              </div>
              <div className="gop-step-body" {...rv(0.12)}>
                <div
                  className="gop-step-num"
                  style={{ background: step.bg, color: step.color }}
                >
                  <Sparkles size={13} />
                  Step {i + 1}
                </div>
                <h3 className="gop-step-title">{step.title}</h3>
                <p className="gop-step-desc">{step.desc}</p>
              </div>
            </div>
          </div>
        ))}

        {/* ════════ RULES GRID ════════ */}
        <section className="gop-rules">
          <div className="gop-rules-inner">
            <div className="gop-rules-head" {...rv(0)}>
              <div className="gop-rules-tag">
                <ShieldCheck size={13} /> Guide
              </div>
              <h3 className="gop-rules-title">
                <em>운영 가이드</em>를 확인하고<br />
                즐겁게 참여하세요!
              </h3>
            </div>
            <div className="gop-rules-grid">
              {RULES.map((r, i) => (
                <div key={r.title} className="gop-rcard" {...rv(0.06 * (i % 3))}>
                  <Badge3D
                    Icon={r.Icon}
                    bg={r.bg}
                    color={r.color}
                    shadow={r.shadow}
                    size={96}
                    iconSize={42}
                  />
                  <div className="gop-rcard-title">{r.title}</div>
                  <div className="gop-rcard-desc">{r.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════ NOTICE ════════ */}
        <section className="gop-alert">
          <div className="gop-alert-box" {...rv(0)}>
            <div className="gop-alert-icon">
              <AlertTriangle size={28} />
            </div>
            <div className="gop-alert-body">
              <div className="gop-alert-title">운영자 안내</div>
              <div className="gop-alert-text">
                행사장 내 안내 스태프의 지시에 따라 주시기 바랍니다.
                반복적인 규정 위반 시 퇴장 조치될 수 있으며, 이로 인한 불이익은 주최 측에서 책임지지 않습니다.
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
