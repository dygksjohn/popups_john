import { MoreHorizontal, QrCode, UserCheck } from "lucide-react";
import ds from "../shared/designTokens";
import {
  Pill,
  DataTable,
  TRow,
  Td,
  MiniStat,
  ActionBtn,
} from "../shared/Components";
import DATA from "../shared/data";

export default function CheckinManage() {
  const totalP = DATA.participants.length;
  const checkedIn = DATA.participants.filter((p) => p.checkedIn).length;
  const cols = [
    { label: "ID" },
    { label: "참가자" },
    { label: "행사" },
    { label: "방식" },
    { label: "체크인 시간" },
    { label: "게이트" },
    { label: "" },
  ];

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <MiniStat label="전체 참가자" value={totalP} color={ds.brand} />
        <MiniStat
          label="체크인 완료"
          value={checkedIn}
          sub={`${Math.round((checkedIn / totalP) * 100)}% 완료`}
          color={ds.green}
        />
        <MiniStat label="미체크인" value={totalP - checkedIn} color={ds.red} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <ActionBtn icon={QrCode} label="QR 스캔" />
        <ActionBtn
          icon={UserCheck}
          label="수동 체크인"
          color={ds.green}
          bg={ds.greenSoft}
        />
      </div>
      <DataTable
        title="체크인 내역"
        count={DATA.checkins.length}
        columns={cols}
        rows={DATA.checkins}
        renderRow={(r) => (
          <TRow key={r.id}>
            <Td mono>{r.participantId}</Td>
            <Td bold>{r.name}</Td>
            <Td>{r.event}</Td>
            <Td>
              <Pill
                color={r.method === "QR" ? ds.brand : ds.amber}
                bg={r.method === "QR" ? ds.brandSoft : ds.amberSoft}
              >
                {r.method}
              </Pill>
            </Td>
            <Td>{r.time}</Td>
            <Td>{r.gate}</Td>
            <Td>
              <MoreHorizontal
                size={15}
                color={ds.ink4}
                style={{ cursor: "pointer" }}
              />
            </Td>
          </TRow>
        )}
      />
    </div>
  );
}
