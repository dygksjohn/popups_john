const STATUS_LABEL = {
  WAITING: "체크인 대기",
  NOT_STARTED: "시작 전",
  CHECKED_IN: "체크인 완료",
  CANCELED: "참여 취소",
  PENDING: "집계 중",
};

const getStatusText = (status) =>
  STATUS_LABEL[String(status ?? "PENDING").toUpperCase()] || STATUS_LABEL.PENDING;

export default function MyProgramList({ myPrograms = [], loading = false }) {
  return (
    <section className="ck-card my-program-list-card">
      <div className="ck-card-header">
        <h2 className="ck-card-title">오늘 참여 프로그램</h2>
        <span className="ck-live-count">총 {myPrograms.length}건</span>
      </div>

      {loading && myPrograms.length === 0 ? (
        <div className="ck-empty">내 프로그램 목록을 불러오는 중입니다.</div>
      ) : myPrograms.length === 0 ? (
        <div className="ck-empty">오늘 참여 프로그램이 없습니다.</div>
      ) : (
        <ul className="program-list ck-my-program-list">
          {myPrograms.map((program, index) => (
            <li
              key={program.programApplyId ?? `${program.programId}-${index}`}
              className="ck-my-program-item"
            >
              <div className="ck-my-program-main">
                <div className="time ck-my-program-time">{program.time}</div>
                <div className="name ck-my-program-title">{program.programName}</div>
              </div>
              <div className="ck-my-program-right">
                <div className="status ck-my-program-meta">
                  상태 : {getStatusText(program.status)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
