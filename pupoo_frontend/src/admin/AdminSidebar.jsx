import { NavLink } from "react-router-dom";

const items = [
  { to: "/admin", label: "대시보드" },
  { to: "/admin/events", label: "행사 관리" },
  { to: "/admin/participants", label: "참가자 관리" },
  { to: "/admin/checkin", label: "체크인 관리" },
  { to: "/admin/payments", label: "결제 관리" },
  { to: "/admin/notices", label: "알림 관리" },
  { to: "/admin/community", label: "커뮤니티" },
  { to: "/admin/settings", label: "설정" }
];

export default function AdminSidebar() {
  return (
    <aside className="hidden w-72 border-r border-[var(--color-line)] bg-white md:block">
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[var(--color-accent)]" />
          <div className="leading-tight">
            <div className="font-extrabold">pupoo</div>
            <div className="text-xs text-[var(--color-sub)]">Admin Console</div>
          </div>
        </div>

        <nav className="mt-8 space-y-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === "/admin"}
              className={({ isActive }) =>
                `flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition
                 ${isActive ? "bg-[color:color-mix(in_srgb,var(--color-accent),white_88%)] text-[color:color-mix(in_srgb,var(--color-accent),black_40%)]" : "text-[var(--color-sub)] hover:bg-[var(--color-surface-2)]"}`
              }
            >
              {it.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
