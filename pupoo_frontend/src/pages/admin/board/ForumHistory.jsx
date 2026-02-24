import { MoreHorizontal } from "lucide-react";
import ds, { statusMap } from "../shared/designTokens";
import { Pill, DataTable, TRow, Td } from "../shared/Components";
import DATA from "../shared/data";

export default function ForumHistory() {
  const cols = [{ label: "포럼명" }, { label: "일자" }, { label: "참여자", align: "right" }, { label: "게시글", align: "right" }, { label: "상태" }, { label: "" }];

  return (
    <DataTable title="포럼 아카이브" count={DATA.forums.length} columns={cols} rows={DATA.forums}
      renderRow={r => {
        const st = statusMap[r.status];
        return (
          <TRow key={r.id}>
            <Td bold>{r.title}</Td>
            <Td>{r.date}</Td>
            <Td align="right" bold>{r.participants.toLocaleString()}</Td>
            <Td align="right">{r.posts}</Td>
            <Td><Pill color={st.c} bg={st.bg}>{st.l}</Pill></Td>
            <Td><MoreHorizontal size={15} color={ds.ink4} style={{ cursor: "pointer" }} /></Td>
          </TRow>
        );
      }}
    />
  );
}
