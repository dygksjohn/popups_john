import { PawPrint } from "lucide-react";
import ds from "../shared/designTokens";
import { Pill, DataTable, TRow, Td } from "../shared/Components";
import DATA from "../shared/data";

export default function SessionParticipation() {
  const cols = [{ label: "참가자" }, { label: "반려견" }, { label: "세션" }, { label: "호출 시간" }, { label: "시작" }, { label: "종료" }, { label: "결과" }];

  return (
    <DataTable title="체험 세션 참여 이력" count={DATA.sessionParticipation.length} columns={cols} rows={DATA.sessionParticipation}
      renderRow={r => (
        <TRow key={r.id}>
          <Td bold>{r.participant}</Td>
          <Td><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><PawPrint size={11} color={ds.violet} />{r.pet}</span></Td>
          <Td>{r.session}</Td>
          <Td>{r.callTime}</Td>
          <Td>{r.startTime || "—"}</Td>
          <Td>{r.endTime || "—"}</Td>
          <Td>
            <Pill color={r.result === "완료" ? "#059669" : ds.amber} bg={r.result === "완료" ? ds.greenSoft : ds.amberSoft}>{r.result}</Pill>
          </Td>
        </TRow>
      )}
    />
  );
}
