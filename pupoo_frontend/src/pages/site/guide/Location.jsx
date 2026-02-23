import PageHeader from "../components/PageHeader";
import {
  CalendarDays,
  MapPin,
  Phone,
  ParkingCircle,
  Banknote,
  Clock,
  Train,
  Bus,
  Car,
  Navigation,
  AlertTriangle,
  Map,
  ExternalLink,
  Info,
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

  .loc-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc; min-height: 100vh;
  }
  .loc-root *, .loc-root *::before, .loc-root *::after { box-sizing: border-box; font-family: inherit; }
  .loc-container { max-width: 860px; margin: 0 auto; padding: 32px 24px 64px; }

  /* ── 2단 레이아웃 ── */
  .loc-layout { display: grid; grid-template-columns: 1fr 360px; gap: 16px; margin-bottom: 20px; }

  /* 지도 카드 */
  .loc-map-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 14px; overflow: hidden;
  }
  .loc-map-placeholder {
    background: linear-gradient(135deg, #dbeafe 0%, #eff4ff 100%);
    height: 300px; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 12px;
  }
  .loc-map-icon-wrap {
    width: 60px; height: 60px; border-radius: 16px; background: rgba(26,79,214,0.12);
    display: flex; align-items: center; justify-content: center;
  }
  .loc-map-placeholder-text { font-size: 14px; font-weight: 700; color: #1a4fd6; }
  .loc-map-placeholder-sub  { font-size: 12px; color: #93c5fd; margin-top: -4px; }
  .loc-map-bottom {
    padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px;
    border-top: 1px solid #f1f3f5;
  }
  .loc-address-main { font-size: 14px; font-weight: 700; color: #111827; }
  .loc-address-sub  { font-size: 12px; color: #9ca3af; margin-top: 3px; display: flex; align-items: center; gap: 4px; }
  .loc-map-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 16px; border-radius: 8px;
    background: #1a4fd6; color: #fff;
    font-size: 13px; font-weight: 700;
    border: none; cursor: pointer; font-family: inherit;
    transition: background 0.15s; white-space: nowrap; flex-shrink: 0;
  }
  .loc-map-btn:hover { background: #1640b0; }

  /* 사이드 */
  .loc-info-col { display: flex; flex-direction: column; gap: 12px; }
  .loc-info-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 20px;
  }
  .loc-info-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f1f3f5; }
  .loc-info-icon {
    width: 36px; height: 36px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .loc-info-icon.blue   { background: #eff4ff; color: #1a4fd6; }
  .loc-info-icon.amber  { background: #fffbeb; color: #d97706; }
  .loc-info-title { font-size: 14px; font-weight: 800; color: #111827; }

  .loc-row { display: flex; align-items: flex-start; gap: 12px; padding: 9px 0; border-bottom: 1px solid #f9fafb; }
  .loc-row:last-child { border-bottom: none; padding-bottom: 0; }
  .loc-row-icon { color: #9ca3af; flex-shrink: 0; margin-top: 1px; }
  .loc-row-label { font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 3px; }
  .loc-row-value { font-size: 13.5px; font-weight: 500; color: #111827; line-height: 1.5; }
  .loc-row-value.muted { font-size: 13px; color: #374151; }

  /* 섹션 헤더 */
  .loc-section-header { display: flex; align-items: center; gap: 9px; margin-bottom: 14px; }
  .loc-section-icon { width: 28px; height: 28px; border-radius: 7px; background: #eff4ff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .loc-section-title { font-size: 15px; font-weight: 800; color: #111827; margin: 0; }

  /* 교통편 카드 */
  .loc-transport-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .loc-transport-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px;
    padding: 20px; transition: box-shadow 0.15s;
  }
  .loc-transport-card:hover { box-shadow: 0 4px 18px rgba(0,0,0,0.06); }
  .loc-transport-icon {
    width: 42px; height: 42px; border-radius: 11px;
    display: flex; align-items: center; justify-content: center; margin-bottom: 14px;
  }
  .loc-transport-icon.subway { background: #eff4ff; color: #1a4fd6; }
  .loc-transport-icon.bus    { background: #ecfdf5; color: #059669; }
  .loc-transport-icon.car    { background: #fffbeb; color: #d97706; }
  .loc-transport-title { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 10px; }

  .loc-transport-row {
    display: flex; align-items: flex-start; gap: 8px;
    font-size: 13px; color: #4b5563; line-height: 1.55; margin-bottom: 7px;
  }
  .loc-transport-row:last-child { margin-bottom: 0; }
  .loc-transport-bullet {
    width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0; margin-top: 1px;
    display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800;
  }
  .loc-transport-bullet.blue   { background: #dbeafe; color: #1d4ed8; }
  .loc-transport-bullet.green  { background: #d1fae5; color: #059669; }
  .loc-transport-bullet.orange { background: #fde68a; color: #b45309; }
  .loc-transport-desc strong { font-weight: 700; color: #111827; }

  /* 공지 */
  .loc-notice {
    background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px;
    padding: 15px 20px; display: flex; gap: 12px; align-items: flex-start; margin-top: 20px;
  }
  .loc-notice-icon { color: #d97706; flex-shrink: 0; margin-top: 1px; }
  .loc-notice-title { font-size: 13px; font-weight: 700; color: #78350f; margin-bottom: 3px; }
  .loc-notice-text { font-size: 13px; color: #92400e; line-height: 1.65; }

  @media (max-width: 1024px) { .loc-layout { grid-template-columns: 1fr; } }
  @media (max-width: 768px) {
    .loc-container { padding: 20px 16px 48px; }
    .loc-transport-grid { grid-template-columns: 1fr; }
    .loc-info-col { display: grid; grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 560px) { .loc-info-col { grid-template-columns: 1fr; } }
`;

export default function Location({ onNavigate }) {
  const currentPath = "/guide/location";

  return (
    <div className="loc-root">
      <style>{styles}</style>
      <PageHeader
        title="장소/오시는길"
        subtitle={GUIDE_SUBTITLE_MAP[currentPath]}
        categories={GUIDE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={onNavigate}
      />
      <main className="loc-container">
        {/* 지도 + 사이드 */}
        <div className="loc-layout">
          {/* 지도 카드 */}
          <div className="loc-map-card">
            <div className="loc-map-placeholder">
              <div className="loc-map-icon-wrap">
                <Map size={28} color="#1a4fd6" />
              </div>
              <div className="loc-map-placeholder-text">
                서울 올림픽공원 SK핸드볼경기장 주변
              </div>
              <div className="loc-map-placeholder-sub">
                지도를 불러오는 중...
              </div>
            </div>
            <div className="loc-map-bottom">
              <div>
                <div className="loc-address-main">
                  서울특별시 송파구 올림픽로 424
                </div>
                <div className="loc-address-sub">
                  <MapPin size={11} color="#9ca3af" />
                  올림픽공원 내 특설 행사장 (SK핸드볼경기장 인근)
                </div>
              </div>
              <button
                className="loc-map-btn"
                onClick={() => window.open("https://map.naver.com", "_blank")}
              >
                <Navigation size={13} />
                지도 앱으로 보기
                <ExternalLink size={11} />
              </button>
            </div>
          </div>

          {/* 사이드 정보 */}
          <div className="loc-info-col">
            {/* 행사 기본 정보 */}
            <div className="loc-info-card">
              <div className="loc-info-header">
                <div className="loc-info-icon blue">
                  <Info size={17} />
                </div>
                <div className="loc-info-title">행사 기본 정보</div>
              </div>
              <div className="loc-row">
                <CalendarDays size={16} className="loc-row-icon" />
                <div>
                  <div className="loc-row-label">일시</div>
                  <div className="loc-row-value">
                    2026.04.12 (토) – 04.13 (일)
                    <br />
                    오전 10:00 – 오후 6:00
                  </div>
                </div>
              </div>
              <div className="loc-row">
                <MapPin size={16} className="loc-row-icon" />
                <div>
                  <div className="loc-row-label">장소</div>
                  <div className="loc-row-value">
                    서울 올림픽공원 특설 행사장
                  </div>
                </div>
              </div>
              <div className="loc-row">
                <Phone size={16} className="loc-row-icon" />
                <div>
                  <div className="loc-row-label">문의</div>
                  <div className="loc-row-value">
                    02-1234-5678
                    <br />
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>
                      평일 10:00 – 17:00
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 주차 안내 */}
            <div className="loc-info-card">
              <div className="loc-info-header">
                <div className="loc-info-icon amber">
                  <ParkingCircle size={17} />
                </div>
                <div className="loc-info-title">주차 안내</div>
              </div>
              <div className="loc-row">
                <AlertTriangle
                  size={16}
                  className="loc-row-icon"
                  style={{ color: "#f59e0b" }}
                />
                <div>
                  <div className="loc-row-label">주의</div>
                  <div className="loc-row-value muted">
                    행사 기간 중 주차 공간이 매우 혼잡합니다. 가급적{" "}
                    <strong style={{ color: "#111827" }}>대중교통 이용</strong>
                    을 권장합니다.
                  </div>
                </div>
              </div>
              <div className="loc-row">
                <Banknote size={16} className="loc-row-icon" />
                <div>
                  <div className="loc-row-label">주차 요금</div>
                  <div className="loc-row-value">
                    최초 30분 무료, 이후 10분당 400원
                  </div>
                </div>
              </div>
              <div className="loc-row">
                <Clock size={16} className="loc-row-icon" />
                <div>
                  <div className="loc-row-label">운영 시간</div>
                  <div className="loc-row-value">오전 8:00 – 오후 8:00</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 교통편 */}
        <div className="loc-section-header">
          <div className="loc-section-icon">
            <Bus size={15} color="#1a4fd6" />
          </div>
          <h2 className="loc-section-title">교통편 안내</h2>
        </div>
        <div className="loc-transport-grid">
          {/* 지하철 */}
          <div className="loc-transport-card">
            <div className="loc-transport-icon subway">
              <Train size={20} />
            </div>
            <div className="loc-transport-title">지하철</div>
            <div className="loc-transport-row">
              <div className="loc-transport-bullet blue">5</div>
              <div className="loc-transport-desc">
                <strong>5호선</strong> 올림픽공원역 3번 출구 → 도보 5분
              </div>
            </div>
            <div className="loc-transport-row">
              <div className="loc-transport-bullet orange">9</div>
              <div className="loc-transport-desc">
                <strong>9호선</strong> 한성백제역 1번 출구 → 도보 10분
              </div>
            </div>
            <div className="loc-transport-row">
              <div className="loc-transport-bullet green">2</div>
              <div className="loc-transport-desc">
                <strong>2호선</strong> 잠실역 8번 출구 → 버스 환승 10분
              </div>
            </div>
          </div>

          {/* 버스 */}
          <div className="loc-transport-card">
            <div className="loc-transport-icon bus">
              <Bus size={20} />
            </div>
            <div className="loc-transport-title">버스</div>
            <div className="loc-transport-row">
              <div className="loc-transport-bullet blue">간</div>
              <div className="loc-transport-desc">
                <strong>간선버스</strong> 340, 3312, 3411
              </div>
            </div>
            <div className="loc-transport-row">
              <div className="loc-transport-bullet green">지</div>
              <div className="loc-transport-desc">
                <strong>지선버스</strong> 2412, 3313
              </div>
            </div>
            <div className="loc-transport-row" style={{ marginTop: 4 }}>
              <MapPin
                size={14}
                style={{ color: "#9ca3af", flexShrink: 0, marginTop: 2 }}
              />
              <div className="loc-transport-desc">
                올림픽공원 정류장 하차 후 도보 3분
              </div>
            </div>
          </div>

          {/* 자가용 */}
          <div className="loc-transport-card">
            <div className="loc-transport-icon car">
              <Car size={20} />
            </div>
            <div className="loc-transport-title">자가용</div>
            <div className="loc-transport-row">
              <Navigation
                size={14}
                style={{ color: "#9ca3af", flexShrink: 0, marginTop: 2 }}
              />
              <div className="loc-transport-desc">
                <strong>내비게이션 검색</strong>
                <br />
                「올림픽공원 특설 행사장」
              </div>
            </div>
            <div className="loc-transport-row">
              <Car
                size={14}
                style={{ color: "#9ca3af", flexShrink: 0, marginTop: 2 }}
              />
              <div className="loc-transport-desc">
                강변북로 → 올림픽대로 → 올림픽공원 진입
              </div>
            </div>
            <div className="loc-transport-row">
              <AlertTriangle
                size={14}
                style={{ color: "#f59e0b", flexShrink: 0, marginTop: 2 }}
              />
              <div className="loc-transport-desc" style={{ color: "#d97706" }}>
                행사 당일 도로 혼잡 예상
              </div>
            </div>
          </div>
        </div>

        <div className="loc-notice">
          <AlertTriangle size={17} className="loc-notice-icon" />
          <div>
            <div className="loc-notice-title">교통 혼잡 안내</div>
            <div className="loc-notice-text">
              행사 당일 주변 도로가 매우 혼잡할 수 있습니다. 여유 있는 출발
              시간을 계획하시고, 가급적 대중교통을 이용해 주시기 바랍니다.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
