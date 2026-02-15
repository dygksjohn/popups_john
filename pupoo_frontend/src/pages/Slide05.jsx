import React from "react";
import SlideShell from "../components/SlideShell";

function Step({ n, title, desc }) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
      <div className="text-xs font-semibold tracking-[0.14em] text-[var(--color-muted)]">STEP {String(n).padStart(2, "0")}</div>
      <div className="mt-2 text-base font-semibold">{title}</div>
      <div className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{desc}</div>
    </div>
  );
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--color-line)] bg-white px-3 py-1 text-xs text-[var(--color-muted)]">
      {children}
    </span>
  );
}

export default function Slide05() {
  return (
    <SlideShell
      id="slide-5"
      kicker="05 DELIVERY"
      title="구현 목표 기능"
      subtitle="핵심 기능을 4개 영역으로 묶고, 단계별로 완성도를 높입니다."
      rightNote="5.pdf 톤: 목표 기능 묶음 + 단계(로드맵)."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Step n={1} title="행사 정보 등록" desc="일정·장소·프로그램 구성" />
        <Step n={2} title="사전 신청 & QR 입장" desc="체크인/기록 자동화" />
        <Step n={3} title="실시간 운영 안내" desc="혼잡·대기·공지 통합" />
        <Step n={4} title="참여 기록 축적" desc="성과 분석 및 개선" />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Pill>Event Setup</Pill>
        <Pill>QR Check-in</Pill>
        <Pill>Congestion & Queue</Pill>
        <Pill>Notifications</Pill>
        <Pill>Participation History</Pill>
        <Pill>Analytics</Pill>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
          <div className="text-sm font-semibold">참가자 가치</div>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            대기·체험·일정 정보를 실시간으로 확인하고, 더 쾌적한 행사 경험을 제공합니다.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
          <div className="text-sm font-semibold">운영자 가치</div>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            체크인·체험·공지·결제 데이터를 통합 관리하고, 행사 결과를 데이터로 축적해 운영을 고도화합니다.
          </p>
        </div>
      </div>

      <footer className="mt-8 text-xs text-[var(--color-muted)]">
        © POPUPS — Tailwind v4 + Vite slide template
      </footer>
    </SlideShell>
  );
}
