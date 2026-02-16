import { Link } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";

export default function AdminTopbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-line)] bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center gap-4">
        <div className="md:hidden font-extrabold">pupoo Admin</div>
        <div className="flex-1">
          <Input placeholder="검색: 행사, 참가자, 공지..." />
        </div>
        <Button as={Link} to="/" variant="outline">사이트</Button>
        <div className="h-9 w-9 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-line)]" />
      </div>
    </header>
  );
}
