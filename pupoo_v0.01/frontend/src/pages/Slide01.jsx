import React from "react";
import SlideShell from "../components/SlideShell";
import MetricRow from "../components/MetricRow";

export default function Slide01() {
  return (
    <SlideShell
      id="slide-1"
      kicker="01 PROJECT"
      title={<>현장 중심 애견 행사 운영을<br className="hidden md:block" />디지털로 통합하다</>}
      subtitle="체험·대기·체크인·공지·참여 데이터를 하나로 연결해 혼잡과 운영 부담을 줄이고, 안전하고 효율적인 행사를 지원합니다."
      rightNote="큰 제목 + 짧은 서브카피 + 3개의 메트릭 카드. 1.pdf 커버 톤을 웹으로 재현."
    >
      <MetricRow
        items={[
          { label: "CHECK-IN", value: "QR", hint: "빠른 입장/출입 기록" },
          { label: "REAL-TIME", value: "혼잡·대기", hint: "현장 상태 즉시 반영" },
          { label: "DATA", value: "참여 이력", hint: "다음 행사 개선 근거" },
        ]}
      />

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { t: "행사 생성", d: "일정·장소·프로그램 구성" },
          { t: "현장 운영", d: "혼잡도·공지·대기 관리" },
          { t: "기록 축적", d: "참여 데이터 기반 분석" },
        ].map((x) => (
          <div key={x.t} className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
            <div className="text-sm font-semibold">{x.t}</div>
            <div className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{x.d}</div>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}
