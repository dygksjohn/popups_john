import { Link, NavLink } from "react-router-dom";
import Container from "../components/Container";
import Button from "../components/Button";
import { navItems } from "../data/mock";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-white/85 backdrop-blur">
      <Container className="py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[var(--color-accent)]"></div>
            <div className="leading-tight">
              <div className="font-extrabold tracking-tight">pupoo</div>
              <div className="text-xs text-[var(--color-sub)]">Pet Expo Ops Platform</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-[var(--color-sub)] lg:flex">
            {navItems.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `hover:text-[var(--color-text)] ${isActive ? "text-[var(--color-text)] font-semibold" : ""}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button as={Link} to="/admin" variant="outline" className="hidden sm:inline-flex">관리자</Button>
            <Button as={Link} to="/project" variant="primary">시작하기</Button>
          </div>
        </div>
      </Container>
    </header>
  );
}
