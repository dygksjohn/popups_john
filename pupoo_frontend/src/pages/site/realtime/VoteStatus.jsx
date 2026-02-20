import { useEffect, useRef } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');

  .pupoo-header {
    background: var(--header-bg);
    padding: 22px 36px 18px 36px;
    display: flex;
    align-items: flex-start;
    gap: 0;
    font-family: 'Noto Sans KR', sans-serif;
    border-bottom: 1px solid rgba(0,0,0,0.07);
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    width: 1400px;
    user-select: none;
    margin-top:100px;
  }

  .pupoo-header__icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 14px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .globe-canvas {
    border-radius: 50%;
    filter: drop-shadow(0 0 10px var(--globe-glow)) drop-shadow(0 0 22px rgba(26,115,232,0.25));
    display: block;
  }

  .pupoo-header__text {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
  }

  .pupoo-header__title {
    font-size: clamp(20px, 3vw, 26px);
    font-weight: 900;
    color: var(--title-color);
    letter-spacing: -0.5px;
    line-height: 1.2;
  }

  .pupoo-header__subtitle {
    font-size: clamp(12px, 1.5vw, 14px);
    font-weight: 400;
    color: var(--subtitle-color);
    letter-spacing: 0.2px;
    line-height: 1.4;
  }

  @media (max-width: 480px) {
    .pupoo-header {
      padding: 16px 20px 14px 20px;
    }
    .pupoo-header__icon-wrap {
      margin-right: 10px;
    }
  }
`;

function GlobeCanvas({ size = 44 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const angleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const s = size * dpr;
    canvas.width = s;
    canvas.height = s;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 1.5;

    function drawGlobe(angle) {
      ctx.clearRect(0, 0, size, size);

      // --- Base sphere gradient ---
      const grad = ctx.createRadialGradient(
        cx - r * 0.3,
        cy - r * 0.3,
        r * 0.05,
        cx,
        cy,
        r,
      );
      grad.addColorStop(0, "#5badff");
      grad.addColorStop(0.45, "#1A73E8");
      grad.addColorStop(1, "#0a3d8f");
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // --- Grid lines clipped to circle ---
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      ctx.strokeStyle = "rgba(255,255,255,0.32)";
      ctx.lineWidth = 0.9;

      // Latitude lines (static horizontal ellipses)
      const latAngles = [-60, -30, 0, 30, 60];
      for (const lat of latAngles) {
        const latRad = (lat * Math.PI) / 180;
        const ry = r * Math.cos(latRad);
        const yOff = r * Math.sin(latRad);
        ctx.beginPath();
        ctx.ellipse(cx, cy + yOff, ry, ry * 0.18, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Longitude lines (rotating vertical ellipses)
      const numLon = 6;
      for (let i = 0; i < numLon; i++) {
        const lon = angle + (i * Math.PI) / numLon;
        const rx = r * Math.abs(Math.cos(lon));
        ctx.beginPath();
        ctx.ellipse(
          cx + r * Math.sin(lon) * 0.0,
          cy,
          rx * Math.abs(Math.sin(lon + Math.PI / 2)),
          r,
          0,
          0,
          Math.PI * 2,
        );
        // Draw as a rotated ellipse to simulate 3D longitude arc
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(0);
        ctx.beginPath();
        // Project: x = R*sin(phi)*cos(lon+angle), y = R*cos(phi)
        // Approximate with ellipse: rx=R*|cos(lon+angle)|, ry=R
        const lrx = r * Math.abs(Math.cos(lon));
        ctx.ellipse(
          r * Math.sin(lon) * 0.0,
          0,
          lrx === 0 ? 0.3 : lrx,
          r,
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
        ctx.restore();
      }

      // --- Equator highlight ---
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.18, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      // --- Specular highlight ---
      const shine = ctx.createRadialGradient(
        cx - r * 0.38,
        cy - r * 0.42,
        0,
        cx - r * 0.2,
        cy - r * 0.2,
        r * 0.62,
      );
      shine.addColorStop(0, "rgba(255,255,255,0.55)");
      shine.addColorStop(0.4, "rgba(255,255,255,0.08)");
      shine.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = shine;
      ctx.fill();

      // --- Bottom shadow rim ---
      const rimGrad = ctx.createRadialGradient(
        cx + r * 0.2,
        cy + r * 0.3,
        r * 0.2,
        cx,
        cy,
        r,
      );
      rimGrad.addColorStop(0.75, "rgba(0,0,0,0)");
      rimGrad.addColorStop(1, "rgba(0,20,80,0.35)");
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = rimGrad;
      ctx.fill();
    }

    let last = null;
    function animate(ts) {
      if (last !== null) {
        const dt = ts - last;
        angleRef.current += (dt / 1000) * (Math.PI / 2.2); // ~one full rotation per ~4.4s
      }
      last = ts;
      drawGlobe(angleRef.current);
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      className="globe-canvas"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

export default function VoteStatus() {
  return (
    <>
      <style>{styles}</style>
      <header className="pupoo-header" role="banner">
        <div className="pupoo-header__icon-wrap">
          <GlobeCanvas size={48} />
        </div>
        <div className="pupoo-header__text">
          <span className="pupoo-header__title">카카오그룹</span>
          <span className="pupoo-header__subtitle">
            카카오가 만든 더 나은 세상
          </span>
        </div>
      </header>
    </>
  );
}
