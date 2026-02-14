import Card from "../../components/Card";
import Button from "../../components/Button";
import Table from "../../components/Table";
import Input from "../../components/Input";
import Badge from "../../components/Badge";
import { adminParticipants } from "../../data/mock";

const columns = [
  { key: "id", label: "참가자 ID" },
  { key: "name", label: "이름" },
  { key: "ticket", label: "티켓" },
  { key: "checkin", label: "체크인" },
  { key: "time", label: "시간" }
];

export default function Participants() {
  const rows = adminParticipants.map((p) => ({
    ...p,
    checkin: <Badge tone={p.checkin === "완료" ? "success" : "warn"}>{p.checkin}</Badge>
  }));

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold text-[var(--color-accent)]">참가자 관리</div>
        <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight">참가자 목록</h1>
        <p className="mt-2 text-sm text-[var(--color-sub)]">신청 승인/반려, 대기자, 참가자 상세, 수정/삭제를 처리합니다.</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <Input placeholder="이름/ID 검색..." />
          </div>
          <div className="flex gap-2">
            <Button variant="outline">CSV</Button>
            <Button variant="primary">수동 등록</Button>
          </div>
        </div>

        <div className="mt-5">
          <Table columns={columns} rows={rows} />
        </div>
      </Card>
    </div>
  );
}
