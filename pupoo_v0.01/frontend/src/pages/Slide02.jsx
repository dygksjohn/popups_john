import React from "react";
import SlideShell from "../components/SlideShell";
import CardGrid from "../components/CardGrid";

export default function Slide02() {
  return (
    <SlideShell
      id="slide-2"
      kicker="02 OVERVIEW"
      title="서비스 개요 및 기획 배경"
      subtitle="사전 준비 → 현장 운영 → 사후 기록까지, 운영 흐름을 하나의 기준으로 통합합니다."
      rightNote="2.pdf 톤: 문제-해결 흐름. 2열 카드로 구조를 명확히."
    >
      <CardGrid
        cards={[
          {
            title: "운영 흐름",
            desc: "행사 전 과정을 단계별로 지원",
            items: [
              "행사 생성 및 운영 설정",
              "참가 등록 및 QR 체크인",
              "실시간 현장 운영(혼잡/대기/공지)",
              "결과 데이터 축적 및 다음 행사 개선",
            ],
          },
          {
            title: "운영 환경의 한계",
            desc: "수기·분산 운영에서 발생하는 문제",
            items: [
              "체험존 대기 줄 혼잡",
              "체크인/안내 업무 과부하",
              "실시간 안전 관리 한계",
              "공지 전달 지연",
              "참여 기록 부재로 분석 어려움",
            ],
          },
        ]}
      />
    </SlideShell>
  );
}
