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

  .loc-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .loc-root *, .loc-root *::before, .loc-root *::after { box-sizing: border-box; font-family: inherit; }
  .loc-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  /* 히어로 */
  .loc-hero {
    background: linear-gradient(135deg, #1a4fd6 0%, #2563eb 60%, #3b82f6 100%);
    border-radius: 16px; padding: 40px 40px; margin-bottom: 28px;
    position: relative; overflow: hidden;
  }
  .loc-hero::before {
    content: ''; position: absolute; top: -40px; right: -40px;
    width: 200px; height: 200px; background: rgba(255,255,255,0.06); border-radius: 50%;
  }
  .loc-hero-label { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.7); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px; }
  .loc-hero-title { font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 8px; letter-spacing: -0.5px; }
  .loc-hero-desc  { font-size: 14px; color: rgba(255,255,255,0.75); line-height: 1.6; }

  /* 2단 레이아웃 */
  .loc-layout { display: grid; grid-template-columns: 1fr 360px; gap: 20px; margin-bottom: 20px; }

  /* 지도 영역 */
  .loc-map-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 14px;
    overflow: hidden;
  }
  .loc-map-placeholder {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    height: 320px; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 10px;
    font-size: 40px; color: #1a4fd6;
  }
  .loc-map-placeholder-text { font-size: 14px; font-weight: 700; color: #1a4fd6; }
  .loc-map-placeholder-sub  { font-size: 12px; color: #93c5fd; }
  .loc-map-bottom {
    padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;
    border-top: 1px solid #f1f3f5;
  }
  .loc-address { font-size: 13.5px; font-weight: 600; color: #111827; }
  .loc-address-sub { font-size: 12px; color: #9ca3af; margin-top: 2px; }
  .loc-map-btn {
    padding: 9px 18px; border-radius: 8px;
    background: #1a4fd6; color: #fff;
    font-size: 13px; font-weight: 700;
    border: none; cursor: pointer; font-family: inherit;
    transition: background 0.15s; white-space: nowrap;
  }
  .loc-map-btn:hover { background: #1640b0; }

  /* 사이드 정보 */
  .loc-info-col { display: flex; flex-direction: column; gap: 12px; }
  .loc-info-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 20px;
  }
  .loc-info-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .loc-info-icon {
    width: 36px; height: 36px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }
  .loc-info-icon.blue   { background: #eff4ff; }
  .loc-info-icon.green  { background: #ecfdf5; }
  .loc-info-icon.amber  { background: #fffbeb; }
  .loc-info-icon.purple { background: #f5f3ff; }
  .loc-info-title { font-size: 14px; font-weight: 800; color: #111827; }

  .loc-row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
  .loc-row:last-child { margin-bottom: 0; }
  .loc-row-icon { font-size: 15px; flex-shrink: 0; margin-top: 1px; }
  .loc-row-text { font-size: 13px; color: #374151; line-height: 1.55; }
  .loc-row-text strong { font-weight: 700; color: #111827; }

  /* 교통편 섹션 */
  .loc-section-title {
    font-size: 15px; font-weight: 800; color: #111827;
    margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
  }
  .loc-transport-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .loc-transport-card {
    background: #fff; border: 1px solid #e9ecef; border-radius: 13px;
    padding: 18px 20px; transition: box-shadow 0.15s;
  }
  .loc-transport-card:hover { box-shadow: 0 4px 18px rgba(0,0,0,0.06); }
  .loc-transport-icon {
    width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; margin-bottom: 12px;
  }
  .loc-transport-icon.subway { background: #eff4ff; }
  .loc-transport-icon.bus    { background: #ecfdf5; }
  .loc-transport-icon.car    { background: #fffbeb; }
  .loc-transport-title { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 8px; }
  .loc-transport-item { font-size: 12.5px; color: #4b5563; line-height: 1.6; margin-bottom: 4px; }
  .loc-transport-item strong { font-weight: 700; color: #111827; }

  /* 태그 */
  .loc-tag {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; border-radius: 100px;
    font-size: 11px; font-weight: 700;
    background: #eff4ff; color: #1a4fd6;
    margin-right: 4px; margin-top: 4px;
  }

  /* 공지 */
  .loc-notice {
    background: #fffbeb; border: 1px solid #fde68a; border-radius: 11px;
    padding: 14px 18px; display: flex; gap: 10px; align-items: flex-start; margin-top: 8px;
  }
  .loc-notice-text { font-size: 13px; color: #92400e; line-height: 1.65; }
  .loc-notice-text strong { font-weight: 700; color: #78350f; }

  @media (max-width: 1024px) {
    .loc-layout { grid-template-columns: 1fr; }
    .loc-info-col { display: grid; grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 768px) {
    .loc-container { padding: 20px 16px 48px; }
    .loc-hero { padding: 28px 24px; }
    .loc-transport-grid { grid-template-columns: 1fr; }
    .loc-info-col { grid-template-columns: 1fr; }
  }
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
              <span>🗺️</span>
              <div className="loc-map-placeholder-text">
                서울 올림픽공원 SK핸드볼경기장 주변
              </div>
              <div className="loc-map-placeholder-sub">
                지도를 불러오는 중...
              </div>
            </div>
            <div className="loc-map-bottom">
              <div>
                <div className="loc-address">
                  서울특별시 송파구 올림픽로 424
                </div>
                <div className="loc-address-sub">
                  올림픽공원 내 특설 행사장 (SK핸드볼경기장 인근)
                </div>
              </div>
              <button
                className="loc-map-btn"
                onClick={() => window.open("https://map.naver.com", "_blank")}
              >
                지도 앱으로 보기
              </button>
            </div>
          </div>

          {/* 사이드 정보 */}
          <div className="loc-info-col">
            {/* 행사 정보 */}
            <div className="loc-info-card">
              <div className="loc-info-header">
                <div className="loc-info-icon blue">📋</div>
                <div className="loc-info-title">행사 기본 정보</div>
              </div>
              <div className="loc-row">
                <span className="loc-row-icon">📅</span>
                <div className="loc-row-text">
                  <strong>일시</strong>
                  <br />
                  2026.04.12 (토) – 04.13 (일)
                  <br />
                  오전 10:00 – 오후 6:00
                </div>
              </div>
              <div className="loc-row">
                <span className="loc-row-icon">🏟</span>
                <div className="loc-row-text">
                  <strong>장소</strong>
                  <br />
                  서울 올림픽공원 특설 행사장
                </div>
              </div>
              <div className="loc-row">
                <span className="loc-row-icon">📞</span>
                <div className="loc-row-text">
                  <strong>문의</strong>
                  <br />
                  02-1234-5678 (평일 10:00–17:00)
                </div>
              </div>
            </div>

            {/* 주차 */}
            <div className="loc-info-card">
              <div className="loc-info-header">
                <div className="loc-info-icon amber">🅿️</div>
                <div className="loc-info-title">주차 안내</div>
              </div>
              <div className="loc-row">
                <span className="loc-row-icon">⚠️</span>
                <div className="loc-row-text">
                  행사 기간 중 주차 공간이 매우 혼잡합니다.
                  <br />
                  가급적 <strong>대중교통 이용</strong>을 권장합니다.
                </div>
              </div>
              <div className="loc-row">
                <span className="loc-row-icon">💰</span>
                <div className="loc-row-text">
                  <strong>주차 요금</strong>
                  <br />
                  최초 30분 무료, 이후 10분당 400원
                </div>
              </div>
              <div className="loc-row">
                <span className="loc-row-icon">⏰</span>
                <div className="loc-row-text">
                  <strong>운영 시간</strong>
                  <br />
                  오전 8:00 – 오후 8:00
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 교통편 */}
        <div className="loc-section-title">
          <span>🚌</span> 교통편 안내
        </div>
        <div className="loc-transport-grid">
          <div className="loc-transport-card">
            <div className="loc-transport-icon subway">🚇</div>
            <div className="loc-transport-title">지하철</div>
            <div className="loc-transport-item">
              <strong>5호선</strong> 올림픽공원역 3번 출구 → 도보 5분
            </div>
            <div className="loc-transport-item">
              <strong>9호선</strong> 한성백제역 1번 출구 → 도보 10분
            </div>
            <div className="loc-transport-item">
              <strong>2호선</strong> 잠실역 8번 출구 → 버스 환승 10분
            </div>
          </div>
          <div className="loc-transport-card">
            <div className="loc-transport-icon bus">🚌</div>
            <div className="loc-transport-title">버스</div>
            <div className="loc-transport-item">
              <strong>간선버스</strong> 340, 3312, 3411
            </div>
            <div className="loc-transport-item">
              <strong>지선버스</strong> 2412, 3313
            </div>
            <div className="loc-transport-item">
              올림픽공원 정류장 하차 후 도보 3분
            </div>
          </div>
          <div className="loc-transport-card">
            <div className="loc-transport-icon car">🚗</div>
            <div className="loc-transport-title">자가용</div>
            <div className="loc-transport-item">
              <strong>내비게이션 검색</strong>
              <br />
              「올림픽공원 특설 행사장」
            </div>
            <div className="loc-transport-item">
              강변북로 → 올림픽대로 → 올림픽공원 진입
            </div>
            <div className="loc-transport-item">행사 당일 도로 혼잡 예상</div>
          </div>
        </div>

        <div className="loc-notice" style={{ marginTop: 20 }}>
          <span>⚠️</span>
          <div className="loc-notice-text">
            <strong>교통 혼잡 안내</strong> 행사 당일 주변 도로가 매우 혼잡할 수
            있습니다. 여유 있는 출발 시간을 계획하시고, 가급적 대중교통을 이용해
            주시기 바랍니다.
          </div>
        </div>
      </main>
    </div>
  );
}
