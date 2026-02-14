import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold text-[var(--color-accent)]">관리자</div>
        <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight">체크인 관리</h1>
        <p className="mt-2 text-sm text-[var(--color-sub)]">QR 체크인 내역, 체크인 시간 기록, 수동 체크인을 관리합니다.</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <Input placeholder="검색..." />
          </div>
          <div className="flex gap-2">
            <Button variant="outline">필터</Button>
            <Button variant="primary">새로 만들기</Button>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-10 text-sm text-[var(--color-sub)]">
          이 영역에 실제 기능 UI(폼/테이블/차트)를 붙여 확장하세요.
        </div>
      </Card>
    </div>
  );
}
