import { useState } from "react";
import PageHeader from "../components/PageHeader";
import {
  CalendarDays,
  Clock,
  Star,
  Utensils,
  Baby,
  ShoppingBag,
  Mic2,
  AlertTriangle,
  LayoutList,
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

  .tt-root {
    box-sizing: border-box;
    font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
    background: #f8f9fc; min-height: 100vh;
  }
  .tt-root *, .tt-root *::before, .tt-root *::after { box-sizing: border-box; font-family: inherit; }
  .tt-container { max-width: 860px; margin: 0 auto; padding: 32px 24px 64px; }

  /* ── 날짜 탭 ── */
  .tt-top-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
  .tt-tabs { display: flex; gap: 6px; }
  .tt-tab {
    padding: 9px 20px; border-radius: 100px;
    font-size: 13px; font-weight: 700; cursor: pointer;
    border: 1.5px solid #e2e8f0; background: #fff; color: #6b7280;
    font-family: inherit; transition: all 0.15s; display: flex; align-items: center; gap: 6px;
  }
  .tt-tab:hover { border-color: #c7d7fb; color: #1a4fd6; }
  .tt-tab.active { background: #eff4ff; border-color: #1a4fd6; color: #1a4fd6; }

  /* ── 범례 ── */
  .tt-legend { display: flex; gap: 10px; flex-wrap: wrap; }
  .tt-legend-item {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: #4b5563; font-weight: 600;
    padding: 5px 12px; border-radius: 100px; background: #fff;
    border: 1px solid #e9ecef;
  }
  .tt-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

  /* ── 타임테이블 카드 ── */
  .tt-table-wrap {
    background: #fff; border: 1px solid #e9ecef; border-radius: 14px; overflow: hidden;
    margin-bottom: 20px;
  }
  .tt-table { width: 100%; border-collapse: collapse; }
  .tt-table thead tr { background: #f8f9fc; }
  .tt-table th {
    padding: 13px 18px; font-size: 11.5px; font-weight: 700; color: #6b7280;
    border-bottom: 1px solid #e9ecef; text-align: left; letter-spacing: 0.3px;
  }
  .tt-table th:first-child { width: 88px; }

  /* 시간 행 */
  .tt-row { border-bottom: 1px solid #f1f3f5; transition: background 0.1s; }
  .tt-row:last-child { border-bottom: none; }
  .tt-row:hover { background: #fafbff; }
  .tt-time-cell {
    padding: 16px 18px; vertical-align: top;
    border-right: 1px solid #f1f3f5; white-space: nowrap;
  }
  .tt-time-chip {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 13px; font-weight: 800; color: #374151;
  }
  .tt-time-icon { color: #9ca3af; }
  .tt-event-cell { padding: 10px 14px; vertical-align: top; }

  /* 이벤트 카드 */
  .tt-event {
    border-radius: 10px; padding: 11px 15px; margin: 4px 0;
    transition: box-shadow 0.15s; display: flex; gap: 12px; align-items: flex-start;
  }
  .tt-event:first-child { margin-top: 0; }
  .tt-event:hover { box-shadow: 0 3px 14px rgba(0,0,0,0.07); }
  .tt-event.main   { background: #eff4ff; border-left: 3px solid #1a4fd6; }
  .tt-event.sub    { background: #ecfdf5; border-left: 3px solid #059669; }
  .tt-event.kids   { background: #fff7ed; border-left: 3px solid #f59e0b; }
  .tt-event.food   { background: #fef2f2; border-left: 3px solid #ef4444; }
  .tt-event-icon-wrap {
    width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; margin-top: 1px;
  }
  .tt-event.main  .tt-event-icon-wrap { background: #dbeafe; color: #1a4fd6; }
  .tt-event.sub   .tt-event-icon-wrap { background: #d1fae5; color: #059669; }
  .tt-event.kids  .tt-event-icon-wrap { background: #fde68a; color: #b45309; }
  .tt-event.food  .tt-event-icon-wrap { background: #fee2e2; color: #dc2626; }
  .tt-event-body { flex: 1; }
  .tt-event-badge {
    display: inline-block; padding: 2px 8px; border-radius: 100px;
    font-size: 10px; font-weight: 700; margin-bottom: 5px;
  }
  .tt-event.main .tt-event-badge { background: #dbeafe; color: #1d4ed8; }
  .tt-event.sub  .tt-event-badge { background: #d1fae5; color: #059669; }
  .tt-event.kids .tt-event-badge { background: #fde68a; color: #b45309; }
  .tt-event.food .tt-event-badge { background: #fee2e2; color: #dc2626; }
  .tt-event-name { font-size: 13.5px; font-weight: 700; color: #111827; margin-bottom: 3px; }
  .tt-event-meta { font-size: 12px; color: #6b7280; }

  /* 휴식 행 */
  .tt-break { background: #f8f9fc; }
  .tt-break-cell {
    padding: 13px 18px; text-align: center;
    font-size: 12.5px; color: #9ca3af; font-weight: 600;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }

  /* 공지 */
  .tt-notice {
    background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px;
    padding: 15px 20px; display: flex; gap: 12px; align-items: flex-start;
  }
  .tt-notice-icon { color: #d97706; flex-shrink: 0; margin-top: 1px; }
  .tt-notice-title { font-size: 13px; font-weight: 700; color: #78350f; margin-bottom: 3px; }
  .tt-notice-text { font-size: 13px; color: #92400e; line-height: 1.65; }

  @media (max-width: 768px) {
    .tt-container { padding: 20px 16px 48px; }
    .tt-top-bar { flex-direction: column; align-items: flex-start; }
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

// stage → lucide 아이콘 매핑
const STAGE_ICON = {
  main: Mic2,
  sub: Star,
  kids: Baby,
  food: Utensils,
};

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
    { break: true, label: "점심 시간 (12:00 – 13:00)" },
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
    { break: true, label: "점심 시간 (12:00 – 13:00)" },
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
        {/* 날짜 탭 + 범례 */}
        <div className="tt-top-bar">
          <div className="tt-tabs">
            {DAYS.map((d) => (
              <button
                key={d.key}
                className={`tt-tab${day === d.key ? " active" : ""}`}
                onClick={() => setDay(d.key)}
              >
                <CalendarDays size={13} />
                {d.label}
              </button>
            ))}
          </div>
          <div className="tt-legend">
            {STAGES.map((s) => (
              <div key={s.key} className="tt-legend-item">
                <div
                  className="tt-legend-dot"
                  style={{ background: s.color }}
                />
                {s.label}
              </div>
            ))}
          </div>
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
                    <td colSpan={2} style={{ padding: 0 }}>
                      <div className="tt-break-cell">
                        <Utensils size={13} color="#9ca3af" />
                        {row.label}
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={i} className="tt-row">
                    <td className="tt-time-cell">
                      <div className="tt-time-chip">
                        <Clock size={12} className="tt-time-icon" />
                        {row.time}
                      </div>
                    </td>
                    <td className="tt-event-cell">
                      {row.events.map((ev, j) => {
                        const IconComp = STAGE_ICON[ev.stage] || Star;
                        return (
                          <div key={j} className={`tt-event ${ev.stage}`}>
                            <div className="tt-event-icon-wrap">
                              <IconComp size={14} />
                            </div>
                            <div className="tt-event-body">
                              <div className="tt-event-badge">{ev.badge}</div>
                              <div className="tt-event-name">{ev.name}</div>
                              <div className="tt-event-meta">{ev.meta}</div>
                            </div>
                          </div>
                        );
                      })}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>

        <div className="tt-notice">
          <AlertTriangle size={17} className="tt-notice-icon" />
          <div>
            <div className="tt-notice-title">안내</div>
            <div className="tt-notice-text">
              모든 프로그램 일정은 운영 상황에 따라 변경될 수 있습니다. 변경
              사항은 공식 홈페이지 및 현장 안내판을 통해 공지됩니다.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
