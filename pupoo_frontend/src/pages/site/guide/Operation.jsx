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
  ChevronRight,
  AlertTriangle,
  Info,
  ClipboardList,
} from "lucide-react";

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
    background: #f8f9fc; min-height: 100vh;
  }
  .op-root *, .op-root *::before, .op-root *::after { box-sizing: border-box; font-family: inherit; }
  .op-container { max-width: 860px; margin: 0 auto; padding: 32px 24px 64px; }

  /* 섹션 */
  .op-section { margin-bottom: 28px; }
  .op-section-header { display: flex; align-items: center; gap: 9px; margin-bottom: 16px; }
  .op-section-icon {
    width: 28px; height: 28px; border-radius: 7px; background: #eff4ff;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .op-section-title { font-size: 15px; font-weight: 800; color: #111827; margin: 0; }

  /* ── 타임라인 ── */
  .op-timeline { display: flex; flex-direction: column; }
  .op-timeline-item { display: flex; gap: 0; position: relative; }
  .op-tl-left { display: flex; flex-direction: column; align-items: center; width: 48px; flex-shrink: 0; }
  .op-tl-dot {
    width: 40px; height: 40px; border-radius: 50%;
    background: #fff; border: 2px solid #e2e8f0;
    display: flex; align-items: center; justify-content: center; z-index: 1;
    color: #6b7280; transition: all 0.15s;
  }
  .op-timeline-item:first-child .op-tl-dot { background: #eff4ff; border-color: #c7d7fb; color: #1a4fd6; }
  .op-tl-line { width: 2px; flex: 1; min-height: 12px; background: #e9ecef; margin: 3px 0; }
  .op-timeline-item:last-child .op-tl-line { display: none; }
  .op-tl-card {
    flex: 1; margin-left: 14px; margin-bottom: 10px;
    background: #fff; border: 1px solid #e9ecef; border-radius: 12px;
    padding: 16px 20px; transition: box-shadow 0.15s;
  }
  .op-tl-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
  .op-tl-tag {
    display: inline-block; padding: 2px 9px; border-radius: 100px;
    font-size: 10.5px; font-weight: 700; background: #eff4ff; color: #1a4fd6; margin-bottom: 6px;
  }
  .op-tl-title { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 4px; }
  .op-tl-desc { font-size: 13px; color: #6b7280; line-height: 1.6; }

  /* ── 가이드 그리드 ── */
  .op-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .op-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px;
    padding: 20px; transition: box-shadow 0.15s;
  }
  .op-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); }
  .op-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
  .op-card-icon {
    width: 42px; height: 42px; border-radius: 11px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .op-card-icon.blue   { background: #eff4ff; color: #1a4fd6; }
  .op-card-icon.green  { background: #ecfdf5; color: #059669; }
  .op-card-icon.amber  { background: #fffbeb; color: #d97706; }
  .op-card-icon.purple { background: #f5f3ff; color: #7c3aed; }
  .op-card-icon.red    { background: #fef2f2; color: #dc2626; }
  .op-card-icon.teal   { background: #f0fdfa; color: #0d9488; }
  .op-card-chevron { color: #d1d5db; margin-top: 3px; }
  .op-card-title { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 6px; }
  .op-card-desc { font-size: 13px; color: #6b7280; line-height: 1.62; }

  /* ── 공지 ── */
  .op-notice {
    background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px;
    padding: 16px 20px; display: flex; gap: 12px; align-items: flex-start;
  }
  .op-notice-icon { color: #d97706; flex-shrink: 0; margin-top: 1px; }
  .op-notice-title { font-size: 13px; font-weight: 700; color: #78350f; margin-bottom: 3px; }
  .op-notice-text { font-size: 13px; color: #92400e; line-height: 1.65; }

  @media (max-width: 900px) { .op-grid { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 640px) {
    .op-container { padding: 20px 16px 48px; }
    .op-grid { grid-template-columns: 1fr; }
  }
`;

const FLOW_ITEMS = [
  {
    Icon: QrCode,
    time: "입장 시",
    title: "QR 코드 제시",
    desc: "신청 완료 후 발급된 QR 코드를 입장 게이트에서 스캔해 주세요.",
  },
  {
    Icon: PawPrint,
    time: "입장 후",
    title: "반려동물 등록 확인",
    desc: "현장 데스크에서 반려동물 등록증 또는 예방접종 증명서를 확인합니다.",
  },
  {
    Icon: Map,
    time: "행사 중",
    title: "프로그램 참여",
    desc: "안내 지도를 수령 후 원하시는 부스 및 프로그램에 자유롭게 참여하세요.",
  },
  {
    Icon: Trash2,
    time: "행사 중",
    title: "매너 있는 관람",
    desc: "반려동물 배변 봉투는 현장에서 제공됩니다. 지정된 배변 구역을 이용해 주세요.",
  },
];

const GUIDE_ITEMS = [
  {
    Icon: Dog,
    cls: "blue",
    title: "동반 가능 동물",
    desc: "개, 고양이, 소형 소동물 (케이지 지참 시). 공격성 있는 동물은 입장이 제한될 수 있습니다.",
  },
  {
    Icon: Syringe,
    cls: "green",
    title: "필수 서류",
    desc: "광견병 등 기본 예방접종 완료 증명서 지참 필수. 미지참 시 현장 입장이 거부될 수 있습니다.",
  },
  {
    Icon: ShieldCheck,
    cls: "amber",
    title: "목줄 / 하네스",
    desc: "모든 반려동물은 행사장 내 항상 목줄 또는 하네스를 착용해야 합니다.",
  },
  {
    Icon: Ban,
    cls: "red",
    title: "금지 사항",
    desc: "타인 동물에 대한 무단 접촉, 취식 물품 무단 급여, 지정 구역 외 배변은 금지됩니다.",
  },
  {
    Icon: ParkingCircle,
    cls: "purple",
    title: "주차 안내",
    desc: "행사장 내 주차 공간은 제한적입니다. 대중교통 이용을 권장하며, 주차는 선착순 운영됩니다.",
  },
  {
    Icon: Stethoscope,
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
          <div className="op-section-header">
            <div className="op-section-icon">
              <ClipboardList size={15} color="#1a4fd6" />
            </div>
            <h2 className="op-section-title">입장 절차</h2>
          </div>
          <div className="op-timeline">
            {FLOW_ITEMS.map((item, i) => (
              <div key={i} className="op-timeline-item">
                <div className="op-tl-left">
                  <div className="op-tl-dot">
                    <item.Icon size={17} />
                  </div>
                  <div className="op-tl-line" />
                </div>
                <div className="op-tl-card">
                  <div className="op-tl-tag">{item.time}</div>
                  <div className="op-tl-title">{item.title}</div>
                  <div className="op-tl-desc">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 운영 가이드 */}
        <div className="op-section">
          <div className="op-section-header">
            <div className="op-section-icon">
              <Info size={15} color="#1a4fd6" />
            </div>
            <h2 className="op-section-title">운영 가이드</h2>
          </div>
          <div className="op-grid">
            {GUIDE_ITEMS.map((item) => (
              <div key={item.title} className="op-card">
                <div className="op-card-top">
                  <div className={`op-card-icon ${item.cls}`}>
                    <item.Icon size={19} />
                  </div>
                  <ChevronRight size={14} className="op-card-chevron" />
                </div>
                <div className="op-card-title">{item.title}</div>
                <div className="op-card-desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 공지 */}
        <div className="op-notice">
          <AlertTriangle size={17} className="op-notice-icon" />
          <div>
            <div className="op-notice-title">운영자 안내</div>
            <div className="op-notice-text">
              행사장 내 안내 스태프의 지시에 따라 주시기 바랍니다. 반복적인 규정
              위반 시 퇴장 조치될 수 있으며, 이로 인한 불이익은 주최 측에서
              책임지지 않습니다.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
