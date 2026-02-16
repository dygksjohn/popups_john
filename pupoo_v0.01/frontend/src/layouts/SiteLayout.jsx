import { Outlet } from "react-router-dom";
import SiteHeader from "../pages/site/components/layout/SiteHeader";
import SiteFooter from "../pages/site/components/layout/SiteFooter";

export default function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  );
}
