import { adminKpis, adminNotices, adminEvents } from "../../data/mock";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Table from "../../components/Table";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-semibold text-[var(--color-accent)]">운영 대시보드</div>
        <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight">오늘의 운영 현황</h1>
        <p className="mt-2 text-sm text-[var(--color-sub)]">실시간 체크인, 혼잡도, 알림, 결제 현황을 요약합니다.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {adminKpis.map((k) => (
          <Card key={k.label} className="p-5">
            <div className="text-sm font-semibold text-[var(--color-sub)]">{k.label}</div>
            <div className="mt-2 text-3xl font-extrabold">{k.value}</div>
            <div className="mt-2 text-xs text-[var(--color-sub)]">{k.delta}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="font-extrabold">진행/예정 행사</div>
            <Button variant="outline">행사 등록</Button>
          </div>
          <div className="mt-4">
            <Table
              columns={[
                { key: "id", label: "ID" },
                { key: "title", label: "행사명" },
                { key: "date", label: "일정" },
                { key: "venue", label: "장소" },
                { key: "status", label: "상태" }
              ]}
              rows={adminEvents}
            />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="font-extrabold">실시간 알림</div>
            <Button variant="outline">발송</Button>
          </div>
          <div className="mt-4 space-y-3">
            {adminNotices.map((n) => (
              <div key={n.id} className="rounded-xl border border-[var(--color-line)] p-4">
                <div className="flex items-center justify-between">
                  <Badge tone={n.tone}>{n.tone}</Badge>
                  <div className="text-xs text-[var(--color-sub)]">{n.time}</div>
                </div>
                <div className="mt-2 text-sm font-semibold">{n.title}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
