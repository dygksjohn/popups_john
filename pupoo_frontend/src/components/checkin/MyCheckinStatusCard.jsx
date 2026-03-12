import { UserCheck } from "lucide-react";

const STATUS_TEXT = {
  WAITING: "대기 중",
  CHECKED_IN: "체크인 완료",
  NOT_STARTED: "운영 전",
  CANCELED: "참여 취소",
  PENDING: "집계 중",
};

const STATUS_TONE = {
  WAITING: "wait",
  CHECKED_IN: "done",
  NOT_STARTED: "pending",
  CANCELED: "cancel",
  PENDING: "pending",
};

const formatPosition = (myCheckin) => {
  if (!myCheckin || myCheckin.status !== "WAITING") return "-";
  const position = Number(myCheckin.myPosition);
  if (!Number.isFinite(position) || position <= 0) return "집계 중";
  return `${position}번째`;
};

const formatEta = (myCheckin) => {
  if (!myCheckin) return "-";
  if (myCheckin.status !== "WAITING") return "-";
  const text = String(myCheckin.estimatedCheckinTime ?? "").trim();
  return text || "집계 중";
};

export default function MyCheckinStatusCard({ myCheckin }) {
  const programName = myCheckin?.programName || "참여 프로그램 없음";
  const programTime = myCheckin?.programTime || "운영 시간 정보 없음";
  const statusKey = String(myCheckin?.status ?? "PENDING").toUpperCase();
  const statusText = STATUS_TEXT[statusKey] || "집계 중";
  const tone = STATUS_TONE[statusKey] || "pending";
  const positionText = formatPosition(myCheckin);
  const etaText = formatEta(myCheckin);

  return (
    <section className="ck-card my-checkin-card">
      <div className="ck-card-header">
        <h2 className="ck-card-title">
          <span className="ck-card-title-icon">
            <UserCheck size={14} color="#1a4fd6" />
          </span>
          내 체크인 상태
        </h2>
        <span className={`ck-status-chip ck-status-chip-${tone}`}>상태 : {statusText}</span>
      </div>

      <div className="program-name ck-my-status-title">{programName}</div>
      <div className="program-time ck-my-status-desc">{programTime}</div>
      <div className="ck-my-checkin-grid">
        <div className="ck-my-checkin-item">
          <div className="ck-my-checkin-label">내 순서</div>
          <div className="ck-my-checkin-value">{positionText}</div>
        </div>
        <div className="ck-my-checkin-item">
          <div className="ck-my-checkin-label">예상 체크인</div>
          <div className="ck-my-checkin-value">{etaText}</div>
        </div>
      </div>
    </section>
  );
}
