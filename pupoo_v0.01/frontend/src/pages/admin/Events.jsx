import Card from "../../components/Card";
import Button from "../../components/Button";
import Table from "../../components/Table";
import Input from "../../components/Input";
import { adminEvents } from "../../data/mock";

const columns = [
  { key: "id", label: "ID" },
  { key: "title", label: "행사명" },
  { key: "date", label: "일정" },
  { key: "venue", label: "장소" },
  { key: "status", label: "상태" }
];

export default function Events() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold text-[var(--color-accent)]">행사 관리</div>
        <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight">행사 목록</h1>
        <p className="mt-2 text-sm text-[var(--color-sub)]">등록/수정/삭제, 신청 상태, 운영 설정을 관리합니다.</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <Input placeholder="행사 검색..." />
          </div>
          <div className="flex gap-2">
            <Button variant="outline">내보내기</Button>
            <Button variant="primary">행사 등록</Button>
          </div>
        </div>

        <div className="mt-5">
          <Table columns={columns} rows={adminEvents} />
        </div>
      </Card>
    </div>
  );
}
