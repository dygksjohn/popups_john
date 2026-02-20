// src/pages/site/program/Session.jsx
import ProgramList from "./_components/ProgramList";

export default function Session() {
  return (
    <ProgramList
      title="세션/강연"
      category="SESSION"
      detailPath="/program/session-detail"
      buttonConfig={{ primaryText: "강연 상세" }}
    />
  );
}
