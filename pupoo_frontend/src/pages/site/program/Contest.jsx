// src/pages/site/program/Contest.jsx
import ProgramList from "./_components/ProgramList";

export default function Contest() {
  return (
    <ProgramList
      title="콘테스트"
      category="CONTEST"
      detailPath="/program/contest/detail"
      buttonConfig={{ primaryText: "콘테스트 상세" }}
    />
  );
}
