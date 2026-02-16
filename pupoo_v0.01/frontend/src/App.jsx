import { Routes, Route, Navigate } from "react-router-dom";
import SiteLayout from "./layouts/SiteLayout";

/* admin */
import SkoteAdminEntry from "./admin/SkoteAdminEntry";

/* Home */
import Home from "./pages/site/home/Home";

/* Event */
import Current from "./pages/site/event/Current";
import Upcoming from "./pages/site/event/Upcoming";
import Closed from "./pages/site/event/Closed";
import PreRegister from "./pages/site/event/PreRegister";
import Detail from "./pages/site/event/Detail";

/* Program */
import Experience from "./pages/site/program/Experience";
import Session from "./pages/site/program/Session";
import Booth from "./pages/site/program/Booth";
import Contest from "./pages/site/program/Contest";
import Schedule from "./pages/site/program/Schedule";

/* Registration */
import Apply from "./pages/site/registration/Apply";
import ApplyHistory from "./pages/site/registration/ApplyHistory";
import PaymentHistory from "./pages/site/registration/PaymentHistory";
import QRCheckin from "./pages/site/registration/QRCheckin";

/* Realtime */
import CheckinStatus from "./pages/site/realtime/CheckinStatus";
import WaitingStatus from "./pages/site/realtime/WaitingStatus";
import VoteStatus from "./pages/site/realtime/VoteStatus";

/* Community */
import FreeBoard from "./pages/site/community/FreeBoard";
import Review from "./pages/site/community/Review";
import Gallery from "./pages/site/community/Gallery";

/* Info */
import PlatformIntro from "./pages/site/info/PlatformIntro";
import Notice from "./pages/site/info/Notice";
import FAQ from "./pages/site/info/FAQ";
import Inquiry from "./pages/site/info/Inquiry";
import Location from "./pages/site/info/Location";

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />

        {/* 행사 */}
        <Route path="/event/current" element={<Current />} />
        <Route path="/event/upcoming" element={<Upcoming />} />
        <Route path="/event/ended" element={<Closed />} />
        <Route path="/event/preregister" element={<PreRegister />} />
        <Route path="/event/detail" element={<Detail />} />

        {/* 프로그램 */}
        <Route path="/program/experience" element={<Experience />} />
        <Route path="/program/session" element={<Session />} />
        <Route path="/program/booth" element={<Booth />} />
        <Route path="/program/contest" element={<Contest />} />
        <Route path="/program/schedule" element={<Schedule />} />

        {/* 참가/신청 */}
        <Route path="/apply" element={<Apply />} />
        <Route path="/apply/history" element={<ApplyHistory />} />
        <Route path="/apply/payment" element={<PaymentHistory />} />
        <Route path="/apply/qr" element={<QRCheckin />} />

        {/* 실시간 */}
        <Route path="/realtime/checkin" element={<CheckinStatus />} />
        <Route path="/realtime/waiting" element={<WaitingStatus />} />
        <Route path="/realtime/vote" element={<VoteStatus />} />

        {/* 커뮤니티 */}
        <Route path="/community/free" element={<FreeBoard />} />
        <Route path="/community/review" element={<Review />} />
        <Route path="/community/gallery" element={<Gallery />} />

        {/* 안내 */}
        <Route path="/info/intro" element={<PlatformIntro />} />
        <Route path="/info/notice" element={<Notice />} />
        <Route path="/info/faq" element={<FAQ />} />
        <Route path="/info/inquiry" element={<Inquiry />} />
        <Route path="/info/directions" element={<Location />} />
      </Route>

      {/* Admin 영역 */}
      <Route path="/admin/*" element={<SkoteAdminEntry />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
