import { Outlet } from "react-router-dom";
import SiteHeader from "../site/SiteHeader";
import SiteFooter from "../site/SiteFooter";

export default function SiteLayout() {
  return (
    <div className="min-h-dvh bg-[var(--color-bg)]">
      <SiteHeader />
      <Outlet />
      <SiteFooter />
    </div>
  );
}
