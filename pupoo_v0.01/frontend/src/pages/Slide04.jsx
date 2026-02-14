import React from "react";
import SlideShell from "../components/SlideShell";

function Feature({ title, desc, bullets }) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
      <div className="text-base font-semibold tracking-tight">{title}</div>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{desc}</p>
      <ul className="mt-4 space-y-2 text-sm">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
            <span className="leading-6">{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Slide04() {
  return (
    <SlideShell
      id="slide-4"
      kicker="04 DIFFERENTIATION"
      title="서비스 차별점"
      subtitle="현장 운영을 ‘실시간’으로, 행사는 ‘지속 가능’하게. 운영과 기록을 하나로 묶습니다."
      rightNote="4.pdf 톤: 3개의 차별점 블록. 카드 그리드로 정리."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Feature
          title="실시간 정보 공유"
          desc="운영자와 참가자가 동일한 정보를 공유"
          bullets={["혼잡도/대기 현황 실시간", "일정 변경 즉시 공지", "현장 안내 통합"]}
        />
        <Feature
          title="지속 가능한 운영"
          desc="행사 종료 후에도 기록이 남는 구조"
          bullets={["참여 이력 자동 축적", "후기/건의 데이터화", "다음 행사 개선 연결"]}
        />
        <Feature
          title="데이터 기반 개선"
          desc="운영 성과를 객관적으로 측정"
          bullets={["선호 프로그램 분석", "대기시간 추세", "운영 지표 대시보드"]}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[color:color-mix(in_srgb,var(--color-panel),#000_3%)] p-6">
        <div className="text-sm font-semibold">Key message</div>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          “현장 혼잡 관리”와 “참여 데이터 축적”을 동시에 제공해, 일회성 행사를 운영 시스템으로 전환합니다.
        </p>
      </div>
    </SlideShell>
  );
}
