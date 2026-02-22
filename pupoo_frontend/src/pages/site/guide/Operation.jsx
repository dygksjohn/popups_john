import PageHeader from "../components/PageHeader";

const GUIDE_CATEGORIES = [
  { label: "현장 운영 안내", path: "/guide/operation" },
  { label: "타임 테이블", path: "/guide/timetable" },
  { label: "장소/오시는길", path: "/guide/location" },
];

const GUIDE_SUBTITLE_MAP = {
  "/guide/operation":
    "원활하고 즐거운 행사 참여를 위해 아래 안내 사항을 미리 확인해 주세요",
  "/guide/timetable": "프로그램은 현장 상황에 따라 일부 변경될 수 있습니다.",
  "/guide/location":
    "행사장 위치와 교통편 안내입니다. 대중교통 이용을 적극 권장드립니다.",
};

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .op-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .op-root *, .op-root *::before, .op-root *::after { box-sizing: border-box; font-family: inherit; }
  .op-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  /* 히어로 배너 */
  .op-hero {
    background: linear-gradient(135deg, #1a4fd6 0%, #2563eb 60%, #3b82f6 100%);
    border-radius: 16px;
    padding: 40px 40px;
    margin-bottom: 28px;
    position: relative;
    overflow: hidden;
  }
  .op-hero::before {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 200px; height: 200px;
    background: rgba(255,255,255,0.06);
    border-radius: 50%;
  }
  .op-hero::after {
    content: '';
    position: absolute;
    bottom: -60px; right: 80px;
    width: 160px; height: 160px;
    background: rgba(255,255,255,0.04);
    border-radius: 50%;
  }
  .op-hero-label {
    font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.7);
    letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px;
  }
  .op-hero-title { font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 8px; letter-spacing: -0.5px; }
  .op-hero-desc { font-size: 14px; color: rgba(255,255,255,0.75); line-height: 1.6; }

  /* 섹션 */
  .op-section { margin-bottom: 20px; }
  .op-section-title {
    font-size: 15px; font-weight: 800; color: #111827;
    margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
  }
  .op-section-title span { font-size: 16px; }

  /* 그리드 카드 */
  .op-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .op-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px;
    padding: 20px; transition: box-shadow 0.15s;
  }
  .op-card:hover { box-shadow: 0 4px 18px rgba(0,0,0,0.06); }
  .op-card-icon {
    width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; margin-bottom: 12px;
  }
  .op-card-icon.blue  { background: #eff4ff; }
  .op-card-icon.green { background: #ecfdf5; }
  .op-card-icon.amber { background: #fffbeb; }
  .op-card-icon.purple { background: #f5f3ff; }
  .op-card-icon.red   { background: #fef2f2; }
  .op-card-icon.teal  { background: #f0fdfa; }
  .op-card-title { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 6px; }
  .op-card-desc { font-size: 13px; color: #6b7280; line-height: 1.6; }

  /* 타임라인 */
  .op-timeline { display: flex; flex-direction: column; gap: 0; }
  .op-timeline-item { display: flex; gap: 16px; position: relative; }
  .op-timeline-item:not(:last-child) .op-timeline-line {
    position: absolute; left: 19px; top: 38px; bottom: 0;
    width: 2px; background: #e9ecef;
  }
  .op-timeline-dot {
    width: 38px; height: 38px; border-radius: 50%;
    background: #eff4ff; border: 2px solid #c7d7fb;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; flex-shrink: 0; z-index: 1;
  }
  .op-timeline-content {
    background: #fff; border: 1px solid #e9ecef; border-radius: 11px;
    padding: 14px 18px; flex: 1; margin-bottom: 10px;
  }
  .op-timeline-time { font-size: 11px; font-weight: 700; color: #1a4fd6; margin-bottom: 3px; }
  .op-timeline-title { font-size: 13.5px; font-weight: 700; color: #111827; margin-bottom: 3px; }
  .op-timeline-desc { font-size: 12.5px; color: #6b7280; line-height: 1.5; }

  /* 공지 박스 */
  .op-notice {
    background: #fffbeb; border: 1px solid #fde68a; border-radius: 11px;
    padding: 16px 20px; display: flex; gap: 12px; align-items: flex-start;
  }
  .op-notice-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
  .op-notice-text { font-size: 13px; color: #92400e; line-height: 1.65; }
  .op-notice-text strong { font-weight: 700; color: #78350f; }

  @media (max-width: 768px) {
    .op-grid { grid-template-columns: 1fr 1fr; }
    .op-container { padding: 20px 16px 48px; }
    .op-hero { padding: 28px 24px; }
  }
`;

const FLOW_ITEMS = [
  {
    icon: "🎟",
    time: "입장 시",
    title: "QR 코드 제시",
    desc: "신청 완료 후 발급된 QR 코드를 입장 게이트에서 스캔해 주세요.",
  },
  {
    icon: "🐾",
    time: "입장 후",
    title: "반려동물 등록 확인",
    desc: "현장 데스크에서 반려동물 등록증 또는 예방접종 증명서를 확인합니다.",
  },
  {
    icon: "🗺",
    time: "행사 중",
    title: "프로그램 참여",
    desc: "안내 지도를 수령 후 원하시는 부스 및 프로그램에 자유롭게 참여하세요.",
  },
  {
    icon: "🚮",
    time: "행사 중",
    title: "매너 있는 관람",
    desc: "반려동물 배변 봉투는 현장에서 제공됩니다. 지정된 배변 구역을 이용해 주세요.",
  },
];

const GUIDE_ITEMS = [
  {
    icon: "🐕",
    cls: "blue",
    title: "동반 가능 동물",
    desc: "개, 고양이, 소형 소동물 (케이지 지참 시). 공격성 있는 동물은 입장이 제한될 수 있습니다.",
  },
  {
    icon: "💉",
    cls: "green",
    title: "필수 서류",
    desc: "광견병 등 기본 예방접종 완료 증명서 지참 필수. 미지참 시 현장 입장이 거부될 수 있습니다.",
  },
  {
    icon: "🦺",
    cls: "amber",
    title: "목줄 / 하네스",
    desc: "모든 반려동물은 행사장 내 항상 목줄 또는 하네스를 착용해야 합니다.",
  },
  {
    icon: "🚫",
    cls: "red",
    title: "금지 사항",
    desc: "타인 동물에 대한 무단 접촉, 취식 물품 무단 급여, 지정 구역 외 배변은 금지됩니다.",
  },
  {
    icon: "🅿️",
    cls: "purple",
    title: "주차 안내",
    desc: "행사장 내 주차 공간은 제한적입니다. 대중교통 이용을 권장하며, 주차는 선착순 운영됩니다.",
  },
  {
    icon: "🏥",
    cls: "teal",
    title: "응급 처치",
    desc: "행사장 내 동물 응급 처치 부스가 운영됩니다. 긴급 상황 시 안내 데스크로 즉시 문의하세요.",
  },
];

export default function Operation({ onNavigate }) {
  const currentPath = "/guide/operation";

  return (
    <div className="op-root">
      <style>{styles}</style>

      <PageHeader
        title="현장 운영 안내"
        subtitle={GUIDE_SUBTITLE_MAP[currentPath]}
        categories={GUIDE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={onNavigate}
      />

      <main className="op-container">
        {/* 입장 절차 */}
        <div className="op-section">
          <div className="op-section-title">
            <span>📋</span> 입장 절차
          </div>
          <div className="op-timeline">
            {FLOW_ITEMS.map((item, i) => (
              <div key={i} className="op-timeline-item">
                <div className="op-timeline-line" />
                <div className="op-timeline-dot">{item.icon}</div>
                <div className="op-timeline-content">
                  <div className="op-timeline-time">{item.time}</div>
                  <div className="op-timeline-title">{item.title}</div>
                  <div className="op-timeline-desc">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 운영 가이드 */}
        <div className="op-section">
          <div className="op-section-title">
            <span>📌</span> 운영 가이드
          </div>
          <div className="op-grid">
            {GUIDE_ITEMS.map((item) => (
              <div key={item.title} className="op-card">
                <div className={`op-card-icon ${item.cls}`}>{item.icon}</div>
                <div className="op-card-title">{item.title}</div>
                <div className="op-card-desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 공지 */}
        <div className="op-notice">
          <div className="op-notice-icon">⚠️</div>
          <div className="op-notice-text">
            <strong>운영자 안내</strong> 행사장 내 안내 스태프의 지시에 따라
            주시기 바랍니다. 반복적인 규정 위반 시 퇴장 조치될 수 있으며, 이로
            인한 불이익은 주최 측에서 책임지지 않습니다.
          </div>
        </div>
      </main>
    </div>
  );
}
