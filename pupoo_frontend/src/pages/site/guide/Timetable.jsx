import { useState } from "react";
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

  .tt-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .tt-root *, .tt-root *::before, .tt-root *::after { box-sizing: border-box; font-family: inherit; }
  .tt-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px 64px; }

  /* 히어로 */
  .tt-hero {
    background: linear-gradient(135deg, #1a4fd6 0%, #2563eb 60%, #3b82f6 100%);
    border-radius: 16px; padding: 40px 40px; margin-bottom: 28px;
    position: relative; overflow: hidden;
  }
  .tt-hero::before {
    content: ''; position: absolute; top: -40px; right: -40px;
    width: 200px; height: 200px; background: rgba(255,255,255,0.06); border-radius: 50%;
  }
  .tt-hero-label { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.7); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px; }
  .tt-hero-title { font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 8px; letter-spacing: -0.5px; }
  .tt-hero-desc { font-size: 14px; color: rgba(255,255,255,0.75); line-height: 1.6; }

  /* 날짜 탭 */
  .tt-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
  .tt-tab {
    padding: 10px 22px; border-radius: 100px;
    font-size: 13px; font-weight: 700; cursor: pointer;
    border: 1.5px solid #e9ecef; background: #fff; color: #6b7280;
    font-family: inherit; transition: all 0.15s;
  }
  .tt-tab:hover { border-color: #c7d7fb; color: #1a4fd6; }
  .tt-tab.active { background: #eff4ff; border-color: #1a4fd6; color: #1a4fd6; }

  /* 스테이지 범례 */
  .tt-legend { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
  .tt-legend-item { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: #4b5563; font-weight: 600; }
  .tt-legend-dot { width: 10px; height: 10px; border-radius: 3px; }

  /* 타임테이블 */
  .tt-table-wrap { background: #fff; border: 1px solid #e9ecef; border-radius: 14px; overflow: hidden; }
  .tt-table { width: 100%; border-collapse: collapse; }
  .tt-table th {
    background: #f8f9fc; padding: 12px 16px;
    font-size: 12px; font-weight: 700; color: #6b7280;
    border-bottom: 1px solid #e9ecef; text-align: left;
  }
  .tt-table th:first-child { width: 90px; }
  .tt-row { border-bottom: 1px solid #f1f3f5; }
  .tt-row:last-child { border-bottom: none; }
  .tt-row:hover { background: #fafbfc; }
  .tt-time-cell {
    padding: 16px; vertical-align: top;
    font-size: 13px; font-weight: 700; color: #374151;
    border-right: 1px solid #f1f3f5; white-space: nowrap;
  }
  .tt-event-cell { padding: 10px 12px; vertical-align: top; }
  .tt-event {
    border-radius: 9px; padding: 10px 14px; margin: 4px 0;
    transition: box-shadow 0.15s;
  }
  .tt-event:hover { box-shadow: 0 3px 12px rgba(0,0,0,0.08); }
  .tt-event.main   { background: #eff4ff; border-left: 3px solid #1a4fd6; }
  .tt-event.sub    { background: #ecfdf5; border-left: 3px solid #059669; }
  .tt-event.kids   { background: #fff7ed; border-left: 3px solid #f59e0b; }
  .tt-event.food   { background: #fef2f2; border-left: 3px solid #ef4444; }
  .tt-event-name { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 3px; }
  .tt-event-meta { font-size: 11.5px; color: #6b7280; }
  .tt-event-badge {
    display: inline-block; padding: 2px 8px; border-radius: 100px;
    font-size: 10px; font-weight: 700; margin-bottom: 5px;
  }
  .tt-event.main .tt-event-badge { background: #dbeafe; color: #1d4ed8; }
  .tt-event.sub  .tt-event-badge { background: #d1fae5; color: #059669; }
  .tt-event.kids .tt-event-badge { background: #fde68a; color: #b45309; }
  .tt-event.food .tt-event-badge { background: #fee2e2; color: #dc2626; }

  .tt-break { background: #f8f9fc; }
  .tt-break-cell { padding: 12px 16px; text-align: center; font-size: 12px; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px; }

  /* 공지 */
  .tt-notice {
    background: #fffbeb; border: 1px solid #fde68a; border-radius: 11px;
    padding: 14px 18px; display: flex; gap: 10px; align-items: flex-start; margin-top: 20px;
  }
  .tt-notice-text { font-size: 13px; color: #92400e; line-height: 1.65; }
  .tt-notice-text strong { font-weight: 700; color: #78350f; }

  @media (max-width: 768px) {
    .tt-container { padding: 20px 16px 48px; }
    .tt-hero { padding: 28px 24px; }
    .tt-table th:not(:first-child):not(:nth-child(2)) { display: none; }
    .tt-event-cell:not(:first-child):not(:nth-child(2)) { display: none; }
  }
`;

const DAYS = [
  { key: "day1", label: "Day 1 · 4월 12일 (토)" },
  { key: "day2", label: "Day 2 · 4월 13일 (일)" },
];

const STAGES = [
  { key: "main", label: "메인 스테이지", color: "#1a4fd6" },
  { key: "sub", label: "체험 부스", color: "#059669" },
  { key: "kids", label: "키즈 존", color: "#f59e0b" },
  { key: "food", label: "푸드 코트", color: "#ef4444" },
];

const SCHEDULE = {
  day1: [
    {
      time: "10:00",
      events: [
        {
          stage: "main",
          badge: "메인 스테이지",
          name: "개막식 & 환영 공연",
          meta: "전체 · 30분",
        },
        {
          stage: "kids",
          badge: "키즈 존",
          name: "반려동물 입문 교육",
          meta: "어린이 · 40분",
        },
      ],
    },
    {
      time: "11:00",
      events: [
        {
          stage: "main",
          badge: "메인 스테이지",
          name: "펫 패션쇼 1부",
          meta: "전체 · 50분",
        },
        {
          stage: "sub",
          badge: "체험 부스",
          name: "반려동물 헬스체크 무료 진단",
          meta: "선착순 50팀",
        },
      ],
    },
    { break: true, label: "🍽 점심 시간 (12:00 – 13:00)" },
    {
      time: "13:00",
      events: [
        {
          stage: "main",
          badge: "메인 스테이지",
          name: "어질리티 대회 예선",
          meta: "참가팀 대상 · 60분",
        },
        {
          stage: "sub",
          badge: "체험 부스",
          name: "포토 부스 & 굿즈 증정",
          meta: "상시 운영",
        },
        {
          stage: "food",
          badge: "푸드 코트",
          name: "반려동물 수제 간식 체험",
          meta: "유료 · 1팀 5,000원",
        },
      ],
    },
    {
      time: "14:30",
      events: [
        {
          stage: "main",
          badge: "메인 스테이지",
          name: "펫 패션쇼 2부 & 시상식",
          meta: "전체 · 60분",
        },
        {
          stage: "kids",
          badge: "키즈 존",
          name: "반려동물 그림 그리기 대회",
          meta: "12세 이하 · 무료",
        },
      ],
    },
    {
      time: "16:00",
      events: [
        {
          stage: "main",
          badge: "메인 스테이지",
          name: "어질리티 결승 & 시상",
          meta: "전체 · 45분",
        },
      ],
    },
    {
      time: "17:00",
      events: [
        {
          stage: "main",
          badge: "메인 스테이지",
          name: "Day 1 마무리 & 경품 추첨",
          meta: "전체 · 30분",
        },
      ],
    },
  ],
  day2: [
    {
      time: "10:00",
      events: [
        {
          stage: "main",
          badge: "메인 스테이지",
          name: "전문가 특강 - 반려동물 영양",
          meta: "전체 · 40분",
        },
        {
          stage: "kids",
          badge: "키즈 존",
          name: "반려동물 비누 만들기 워크숍",
          meta: "어린이 · 60분",
        },
      ],
    },
    {
      time: "11:00",
      events: [
        {
          stage: "sub",
          badge: "체험 부스",
          name: "유기견 입양 상담 부스",
          meta: "상시 운영",
        },
        {
          stage: "food",
          badge: "푸드 코트",
          name: "펫 카페 체험존",
          meta: "유료 · 2,000원",
        },
      ],
    },
    { break: true, label: "🍽 점심 시간 (12:00 – 13:00)" },
    {
      time: "13:00",
      events: [
        {
          stage: "main",
          badge: "메인 스테이지",
          name: "트릭 도그 쇼",
          meta: "전체 · 45분",
        },
        {
          stage: "sub",
          badge: "체험 부스",
          name: "반려동물 마사지 체험",
          meta: "선착순 30팀",
        },
      ],
    },
    {
      time: "15:00",
      events: [
        {
          stage: "main",
          badge: "메인 스테이지",
          name: "전체 기념 촬영 & 폐막식",
          meta: "전체 · 30분",
        },
      ],
    },
  ],
};

export default function Timetable({ onNavigate }) {
  const currentPath = "/guide/timetable";
  const [day, setDay] = useState("day1");
  const schedule = SCHEDULE[day];

  return (
    <div className="tt-root">
      <style>{styles}</style>

      <PageHeader
        title="타임 테이블"
        subtitle={GUIDE_SUBTITLE_MAP[currentPath]}
        categories={GUIDE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={onNavigate}
      />

      <main className="tt-container">
        {/* 날짜 탭 */}
        <div className="tt-tabs">
          {DAYS.map((d) => (
            <button
              key={d.key}
              className={`tt-tab${day === d.key ? " active" : ""}`}
              onClick={() => setDay(d.key)}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* 범례 */}
        <div className="tt-legend">
          {STAGES.map((s) => (
            <div key={s.key} className="tt-legend-item">
              <div className="tt-legend-dot" style={{ background: s.color }} />
              {s.label}
            </div>
          ))}
        </div>

        {/* 테이블 */}
        <div className="tt-table-wrap">
          <table className="tt-table">
            <thead>
              <tr>
                <th>시간</th>
                <th>프로그램</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((row, i) =>
                row.break ? (
                  <tr key={i} className="tt-break">
                    <td colSpan={2} className="tt-break-cell">
                      {row.label}
                    </td>
                  </tr>
                ) : (
                  <tr key={i} className="tt-row">
                    <td className="tt-time-cell">{row.time}</td>
                    <td className="tt-event-cell">
                      {row.events.map((ev, j) => (
                        <div key={j} className={`tt-event ${ev.stage}`}>
                          <div className="tt-event-badge">{ev.badge}</div>
                          <div className="tt-event-name">{ev.name}</div>
                          <div className="tt-event-meta">{ev.meta}</div>
                        </div>
                      ))}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>

        <div className="tt-notice">
          <span>⚠️</span>
          <div className="tt-notice-text">
            <strong>안내</strong> 모든 프로그램 일정은 운영 상황에 따라 변경될
            수 있습니다. 변경 사항은 공식 홈페이지 및 현장 안내판을 통해
            공지됩니다.
          </div>
        </div>
      </main>
    </div>
  );
}
