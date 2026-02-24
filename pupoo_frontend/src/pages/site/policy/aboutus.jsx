import { useEffect, useMemo, useRef, useState } from "react";

/* reduced-motion */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(!!mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

/* reveal */
function useReveal(threshold = 0.18) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold, rootMargin: "0px 0px -30px 0px" },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}

function R({ children, delay = 0, y = 10, style = {} }) {
  const reduced = usePrefersReducedMotion();
  const [ref, vis] = useReveal();
  return (
    <div
      ref={ref}
      style={{
        ...style,
        opacity: vis || reduced ? 1 : 0,
        transform:
          vis || reduced ? "translate3d(0,0,0)" : `translate3d(0,${y}px,0)`,
        transition: reduced
          ? "none"
          : `opacity 520ms cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 620ms cubic-bezier(0.22,1,0.36,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export default function PupooBrandIdentity() {
  const base = "http://kgj.dothome.co.kr/pupoo";
  const img = (n) => `${base}/info${n}.png`;

  const reduced = usePrefersReducedMotion();

  const colors = useMemo(
    () => [
      {
        hex: "#2F55FF",
        name: "PUPOO BLUE",
        p: "2728 C",
        c: "80 · 64 · 0 · 0",
        r: "47 · 85 · 255",
      },
      {
        hex: "#00B894",
        name: "PUPOO MINT",
        p: "7465 C",
        c: "67 · 0 · 40 · 0",
        r: "0 · 184 · 148",
      },
    ],
    [],
  );

  const handleDownload = async () => {
    try {
      const res = await fetch(`${base}/pupoo_logo.psd`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pupoo_logo.psd";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(`${base}/pupoo_logo.psd`, "_blank");
    }
  };

  const jump = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <div
      style={{
        background: "#F2F3F5", // 아주 연한 회색
        color: "#141414",
        minHeight: "100vh",
      }}
    >
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        :root{
          --bg: #F2F3F5;
          --fg: #141414;
          --muted: rgba(20,20,20,.58);
          --muted2: rgba(20,20,20,.36);
          --line: rgba(20,20,20,.10);
          --panel: rgba(255,255,255,.78);
          --blue: #2F55FF;
          --mint: #00B894;

          --sans: 'Pretendard Variable', Pretendard, system-ui, -apple-system, sans-serif;
          --display: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
          --mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;

          --radius: 16px;
          --shadow: 0 18px 50px rgba(0,0,0,.06);
        }

        *{ box-sizing: border-box; }
        body{ margin:0; }

        /* ✅ margin-top:70 조건 = wrap padding-top으로 유지 */
        .wrap{
          max-width: 1200px;
          margin: 0 auto;
          padding: 70px 24px 120px;
        }

        /* ✅ 헤더 “못생김” 해결: 타이틀/서브/메뉴/다운로드를 한 줄에서 정돈 */
        .dochead{
          display:flex;
          align-items:center;
          justify-content: space-between;
          gap: 16px;

          padding: 14px 0;
          border-bottom: 1px solid var(--line);

          position: sticky;
          top: 0;
          z-index: 30;

          background: rgba(242,243,245,.86);
          backdrop-filter: blur(14px);
        }

        .brand{
          display:flex;
          align-items:center;
          gap: 12px;
          min-width: 0;
        }

        .brandMark{
          width: 34px;
          height: 34px;
          border-radius: 12px;
          background:
            radial-gradient(circle at 30% 30%, rgba(47,85,255,.16), transparent 56%),
            radial-gradient(circle at 70% 70%, rgba(0,184,148,.16), transparent 56%),
            rgba(255,255,255,.78);
          border: 1px solid rgba(20,20,20,.10);
          box-shadow: 0 10px 28px rgba(0,0,0,.06);
          flex: 0 0 auto;
        }

        .brandText{
          display:flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .brand-title{
          font-family: var(--display);
          font-weight: 800;
          letter-spacing: -0.03em;
          font-size: 16px;
          line-height: 1.15;
          margin: 0;

          display:flex;
          align-items: baseline;
          gap: 8px;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .brand-chip{
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: .12em;
          color: rgba(20,20,20,.46);
          background: rgba(255,255,255,.70);
          border: 1px solid rgba(20,20,20,.10);
          padding: 4px 8px;
          border-radius: 999px;
          flex: 0 0 auto;
        }

        .brand-sub{
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: .16em;
          color: var(--muted2);
          text-transform: uppercase;
          margin: 0;
        }

        .head-actions{
          display:flex;
          align-items:center;
          gap: 6px;
          flex-wrap: wrap;
        }

        /* ✅ ABOUT~APPLICATION = 탭 느낌 */
        .btn{
          height: 34px;
          padding: 0 10px;
          border-radius: 10px;
          border: 1px solid transparent;
          background: transparent;
          box-shadow: none;
          cursor: pointer;

          font-family: var(--display);
          font-weight: 700;
          font-size: 12px;
          letter-spacing: -0.01em;
          color: rgba(20,20,20,.62);

          transition: background .18s ease, color .18s ease, border-color .18s ease;
        }

        .btn:hover{
          background: rgba(255,255,255,.72);
          border-color: rgba(20,20,20,.10);
          color: rgba(20,20,20,.88);
        }

        /* ✅ DOWNLOAD만 진짜 CTA */
        .btn-primary{
          height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid rgba(20,20,20,.22);
          background: rgba(20,20,20,1);
          color: #fff;
          box-shadow: 0 14px 34px rgba(0,0,0,.14);
        }
        .btn-primary:hover{
          background: rgba(20,20,20,.92);
          border-color: rgba(20,20,20,.30);
        }

        /* 본문: 좌측 인덱스 + 우측 콘텐츠 */
        .layout{
          display:grid;
          grid-template-columns: 240px 1fr;
          gap: 36px;
          padding-top: 28px;
        }

        .side{
          position: sticky;
          top: 92px;
          align-self: start;
        }

        .nav{
          border-left: 1px solid var(--line);
          padding-left: 14px;
          display:flex;
          flex-direction: column;
          gap: 10px;
        }
        .nav a{
          text-decoration:none;
          color: var(--muted);
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: .14em;
          text-transform: uppercase;
          padding: 6px 0;
          display:block;
        }
        .nav a:hover{ color: var(--fg); }

        /* 섹션 */
        .section{
          padding: 56px 0;
          border-bottom: 1px solid var(--line);
        }
        .kicker{
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: .18em;
          color: var(--muted2);
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .h2{
          margin: 0 0 12px;
          font-family: var(--sans);
          font-weight: 700;
          letter-spacing: -0.02em;
          font-size: 28px;
          line-height: 1.25;
        }
        .p{
          margin: 0;
          font-family: var(--sans);
          font-weight: 350;
          color: var(--muted);
          font-size: 15px;
          line-height: 1.9;
          max-width: 62ch;
        }

        /* 미디어 프레임 */
        .frame{
          margin-top: 22px;
          border: 1px solid var(--line);
          background: var(--panel);
          border-radius: var(--radius);
          overflow:hidden;
          box-shadow: var(--shadow);
        }
        .frame-inner{ padding: 22px; }

        .mediaGrid{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .shot{
          border: 1px solid var(--line);
          border-radius: 14px;
          background: #fff;
          aspect-ratio: 4 / 3;
          display:flex;
          align-items:center;
          justify-content:center;
          position: relative;
          overflow:hidden;
        }
        .shotLabel{
          position:absolute;
          top: 14px; left: 14px;
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: .16em;
          color: rgba(20,20,20,.28);
          text-transform: uppercase;
        }
        .shot img{
          max-width: 72%;
          max-height: 62%;
          object-fit: contain;
        }

        /* 컬러 */
        .colorGrid{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-top: 22px;
        }
        .colorCard{
          border: 1px solid var(--line);
          border-radius: var(--radius);
          overflow:hidden;
          background: var(--panel);
          box-shadow: var(--shadow);
        }
        .swatch{
          height: 170px;
          display:flex;
          align-items:flex-end;
          padding: 18px;
        }
        .swatchName{
          font-family: var(--display);
          font-weight: 800;
          font-size: 14px;
          letter-spacing: .02em;
          color: #fff;
        }
        .spec{ padding: 16px 18px; }
        .row{
          display:flex;
          justify-content: space-between;
          align-items:center;
          padding: 9px 0;
          border-top: 1px solid var(--line);
        }
        .row:first-child{ border-top: none; }
        .k{ font-family: var(--mono); font-size: 10px; letter-spacing: .14em; color: var(--muted2); }
        .v{ font-family: var(--mono); font-size: 12px; color: var(--fg); }

        /* 다운로드 CTA */
        .cta{
          margin-top: 22px;
          border: 1px solid var(--line);
          border-radius: var(--radius);
          background: var(--panel);
          padding: 18px;
          display:flex;
          align-items:center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          box-shadow: var(--shadow);
        }
        .ctaTitle{
          font-family: var(--sans);
          font-weight: 700;
          letter-spacing: -0.02em;
          font-size: 16px;
          margin: 0 0 4px;
        }
        .ctaDesc{
          font-family: var(--sans);
          font-weight: 350;
          color: var(--muted);
          font-size: 14px;
          margin: 0;
          line-height: 1.7;
        }

        @media (max-width: 980px){
          .layout{ grid-template-columns: 1fr; }
          .side{ position: relative; top: 0; }
          .nav{
            border-left: none;
            padding-left: 0;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 12px;
          }
          .section{ padding: 44px 0; }
          .mediaGrid{ grid-template-columns: 1fr; }
          .colorGrid{ grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="wrap">
        {/* Doc Header */}
        <div className="dochead">
          <div className="brand">
            <div className="brandMark" aria-hidden />
            <div className="brandText">
              <div className="brand-title">
                PUPOO{" "}
                <span style={{ color: "var(--blue)" }}>Brand Identity</span>
                <span className="brand-chip">v1.0</span>
              </div>
              <div className="brand-sub">Guideline · 2026</div>
            </div>
          </div>

          <div className="head-actions">
            <button className="btn" onClick={() => jump("about")}>
              ABOUT
            </button>
            <button className="btn" onClick={() => jump("logotype")}>
              LOGOTYPE
            </button>
            <button className="btn" onClick={() => jump("color")}>
              COLOR
            </button>
            <button className="btn" onClick={() => jump("apply")}>
              APPLICATION
            </button>
            <button className="btn btn-primary" onClick={handleDownload}>
              DOWNLOAD <span style={{ opacity: 0.85 }}>↗</span>
            </button>
          </div>
        </div>

        <div className="layout">
          {/* Side index */}
          <aside className="side">
            <nav className="nav">
              <a
                href="#about"
                onClick={(e) => (e.preventDefault(), jump("about"))}
              >
                01 — ABOUT
              </a>
              <a
                href="#logotype"
                onClick={(e) => (e.preventDefault(), jump("logotype"))}
              >
                02 — LOGOTYPE
              </a>
              <a
                href="#color"
                onClick={(e) => (e.preventDefault(), jump("color"))}
              >
                03 — COLOR
              </a>
              <a
                href="#apply"
                onClick={(e) => (e.preventDefault(), jump("apply"))}
              >
                04 — APPLICATION
              </a>
              <a
                href="#assets"
                onClick={(e) => (e.preventDefault(), jump("assets"))}
              >
                05 — ASSETS
              </a>
            </nav>
          </aside>

          {/* Content */}
          <main>
            {/* 01 */}
            <section id="about" className="section">
              <R>
                <div className="kicker">01 — ABOUT</div>
                <h2 className="h2">연결과 확장</h2>
                <p className="p">
                  Pupoo는 행사 기획, 참가 신청, 결제, 현장 운영, 커뮤니티까지
                  하나의 시스템으로 이어지는 통합 경험을 제공합니다.
                  정보/신청/결제/현장/후기가 단절되지 않게, 한 번의 흐름으로
                  이어지는 것이 핵심입니다.
                </p>

                <div className="frame">
                  <div
                    className="frame-inner"
                    style={{ display: "flex", justifyContent: "center" }}
                  >
                    <img
                      src={img(1)}
                      alt="Pupoo Logo"
                      style={{ width: "min(320px, 70%)", opacity: 0.98 }}
                    />
                  </div>
                </div>
              </R>
            </section>

            {/* 02 */}
            <section id="logotype" className="section">
              <R>
                <div className="kicker">02 — LOGOTYPE</div>
                <h2 className="h2">Logotype</h2>
                <p className="p">
                  국문/영문 로고 타입을 동일한 규격의 프레임으로 정리합니다.
                </p>

                <div className="frame">
                  <div className="frame-inner">
                    <div className="mediaGrid">
                      {[
                        { src: img(2), label: "KOREAN TYPE" },
                        { src: img(3), label: "ENGLISH TYPE" },
                      ].map((t, i) => (
                        <div key={i} className="shot">
                          <div className="shotLabel">{t.label}</div>
                          <img src={t.src} alt={t.label} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </R>
            </section>

            {/* 03 */}
            <section id="color" className="section">
              <R>
                <div className="kicker">03 — COLOR</div>
                <h2 className="h2">Color System</h2>
                <p className="p">
                  컬러는 스펙 중심으로 간결하게 표시하고, 과한 장식은 쓰지
                  않습니다.
                </p>

                <div className="colorGrid">
                  {colors.map((c, i) => (
                    <div key={i} className="colorCard">
                      <div className="swatch" style={{ background: c.hex }}>
                        <div className="swatchName">{c.name}</div>
                      </div>
                      <div className="spec">
                        {[
                          ["PANTONE", c.p],
                          ["CMYK", c.c],
                          ["RGB", c.r],
                        ].map(([k, v], idx) => (
                          <div className="row" key={idx}>
                            <div className="k">{k}</div>
                            <div className="v">{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </R>
            </section>

            {/* 04 */}
            <section id="apply" className="section">
              <R>
                <div className="kicker">04 — APPLICATION</div>
                <h2 className="h2">Usage</h2>
                <p className="p">
                  화이트/다크 배경에서의 사용 예시를 최소 구성으로 제시합니다.
                </p>

                <div className="frame">
                  <div className="frame-inner">
                    <div className="mediaGrid">
                      {[
                        { src: img(4), label: "WHITE" },
                        { src: img(5), label: "DARK" },
                      ].map((t, i) => (
                        <div
                          key={i}
                          className="shot"
                          style={{ background: i === 1 ? "#0F0F10" : "#fff" }}
                        >
                          <div
                            className="shotLabel"
                            style={{
                              color:
                                i === 1
                                  ? "rgba(255,255,255,.35)"
                                  : "rgba(20,20,20,.28)",
                            }}
                          >
                            {t.label}
                          </div>
                          <img src={t.src} alt={t.label} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </R>
            </section>

            {/* 05 */}
            <section
              id="assets"
              className="section"
              style={{ borderBottom: "none" }}
            >
              <R>
                <div className="kicker">05 — ASSETS</div>
                <h2 className="h2">Download</h2>
                <p className="p">필요한 파일만 명확한 CTA로 제공합니다.</p>

                <div className="cta">
                  <div>
                    <p className="ctaTitle">로고 PSD 파일</p>
                    <p className="ctaDesc">
                      원본 파일을 다운로드해 활용할 수 있습니다.
                    </p>
                  </div>
                  <button className="btn btn-primary" onClick={handleDownload}>
                    DOWNLOAD <span style={{ opacity: 0.85 }}>↗</span>
                  </button>
                </div>
              </R>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
