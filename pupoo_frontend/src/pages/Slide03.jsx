import React from "react";
import SlideShell from "../components/SlideShell";
import CompareTable from "../components/CompareTable";

export default function Slide03() {
  return (
    <SlideShell
      id="slide-3"
      kicker="03 BENCHMARK"
      title="유사 서비스 분석 및 평가"
      subtitle="기존 서비스의 강점은 흡수하고, ‘지속 운영’과 ‘데이터 축적’에서 차별화합니다."
      rightNote="3.pdf 톤: 표 기반 비교. 모바일에서는 가로 스크롤."
    >
      <CompareTable
        rows={[
          {
            name: "Service A (Lifestyle/Booking)",
            pros: "장소·행사 탐색/예약 목적이 명확",
            cons: "유저 소통·데이터 분석 약함",
            diff: "큐레이션 중심 구조",
          },
          {
            name: "Service B (Health/Commerce)",
            pros: "데이터 기반 개인화/리텐션",
            cons: "유저 간 직접 소통 어려움",
            diff: "헬스케어+커머스 결합",
          },
          {
            name: "Service C (Expo Ops App)",
            pros: "QR 입장/현장 트래픽 관리 특화",
            cons: "행사 기간 외 사용 목적 약함",
            diff: "박람회 운영 최적화",
          },
        ]}
      />
    </SlideShell>
  );
}
