import { Routes, Route, Navigate } from "react-router-dom";
import SiteLayout from "./layouts/SiteLayout";
import SkoteAdminEntry from "./admin/SkoteAdminEntry";

import Home from "./pages/site/Home";
import Project from "./pages/site/Project";
import Features from "./pages/site/Features";
import UseCases from "./pages/site/UseCases";
import TechStack from "./pages/site/TechStack";
import News from "./pages/site/News";

// /admin is served by the Skote dashboard template (Themeforest)

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/project" element={<Project />} />
        <Route path="/features" element={<Features />} />
        <Route path="/use-cases" element={<UseCases />} />
        <Route path="/tech" element={<TechStack />} />
        <Route path="/news" element={<News />} />
      </Route>

      {/* Themeforest Skote Admin (mounted under /admin/*) */}
      <Route path="/admin/*" element={<SkoteAdminEntry />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
