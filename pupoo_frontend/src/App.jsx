import { Routes, Route } from "react-router-dom";
import SiteLayout from "./layouts/SiteLayout";
import ScrollToTop from "./ScrollToTop";

/* admin */
import Intro from "./pages/admin/intro";
import AdminDashboard from "./pages/admin/dashboard";

/* Home */
import Home from "./pages/site/home/Home";

/* Auth */
import Login from "./pages/site/auth/Login";
import JoinSelect from "./pages/site/auth/join/JoinSelect";
import JoinNormal from "./pages/site/auth/join/JoinNormal";
import JoinSocial from "./pages/site/auth/join/JoinSocial";

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
import SessionDetail from "./pages/site/program/SessionDetail";
import ContestDetail from "./pages/site/program/contest/ContestDetail";
import ContestApply from "./pages/site/program/contest/ContestApply";
import ContestVote from "./pages/site/program/contest/ContestVote";
import ContestResult from "./pages/site/program/contest/ContestResult";

/* Registration */
import Apply from "./pages/site/registration/Apply";
import ApplyHistory from "./pages/site/registration/ApplyHistory";
import PaymentHistory from "./pages/site/registration/PaymentHistory";
import QRCheckin from "./pages/site/registration/QRCheckin";

/* Realtime */
import CheckinStatus from "./pages/site/realtime/CheckinStatus";
import WaitingStatus from "./pages/site/realtime/WaitingStatus";
import VoteStatus from "./pages/site/realtime/VoteStatus";
import RealtimeDashboard from "./pages/site/realtime/Dashboard";

/* Community */
import FreeBoard from "./pages/site/community/FreeBoard";
import Review from "./pages/site/community/Review";
import Gallery from "./pages/site/community/Gallery";
import QnA from "./pages/site/community/QnA";
import Notice from "./pages/site/community/Notice.jsx";

/* Info */
import PlatformIntro from "./pages/site/info/PlatformIntro";

import FAQ from "./pages/site/info/FAQ";
import Inquiry from "./pages/site/info/Inquiry";
import Location from "./pages/site/info/Location";

/* Policy (※ 파일명 대소문자 맞춤) */
import AboutUs from "./pages/site/policy/aboutus";
import PrivacyPolicy from "./pages/site/policy/privacypolicy";
import ServiceGuide from "./pages/site/policy/serviceguide";
import TermsOfService from "./pages/site/policy/termsofservice";
import EFTTerms from "./pages/site/policy/EFTTerms";

export default function App() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* ---------------- 관리자 전용 ---------------- */}
        <Route path="/admin/intro" element={<Intro />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* ---------------- 일반 사이트 ---------------- */}
        <Route element={<SiteLayout />}>
          {/* Home */}
          <Route path="/" element={<Home />} />

          {/* Auth */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/join/joinselect" element={<JoinSelect />} />
          <Route path="/auth/join/joinnormal" element={<JoinNormal />} />
          <Route path="/auth/join/joinsocial" element={<JoinSocial />} />

          {/* Event */}
          <Route path="/event/current" element={<Current />} />
          <Route path="/event/upcoming" element={<Upcoming />} />
          <Route path="/event/closed" element={<Closed />} />
          <Route path="/event/preregister" element={<PreRegister />} />
          <Route path="/event/detail" element={<Detail />} />

          {/* program */}
          <Route path="/program/experience" element={<Experience />} />
          <Route path="/program/session" element={<Session />} />
          <Route path="/program/booth" element={<Booth />} />
          <Route path="/program/contest" element={<Contest />} />
          <Route path="/program/schedule" element={<Schedule />} />

          <Route path="/program/session-detail" element={<SessionDetail />} />

          {/* contest 상세/기능 */}
          <Route path="/program/contest/detail" element={<ContestDetail />} />
          <Route path="/program/contest/apply" element={<ContestApply />} />
          <Route path="/program/contest/vote" element={<ContestVote />} />
          <Route path="/program/contest/result" element={<ContestResult />} />

          {/* Registration */}
          <Route path="/registration/apply" element={<Apply />} />
          <Route
            path="/registration/apply-history"
            element={<ApplyHistory />}
          />
          <Route
            path="/registration/payment-history"
            element={<PaymentHistory />}
          />
          <Route path="/registration/qr-checkin" element={<QRCheckin />} />

          {/* Realtime */}
          <Route path="/realtime/checkin-status" element={<CheckinStatus />} />
          <Route path="/realtime/waiting-status" element={<WaitingStatus />} />
          <Route path="/realtime/vote-status" element={<VoteStatus />} />
          <Route path="/realtime/dashboard" element={<RealtimeDashboard />} />

          {/* Community */}
          <Route path="/community/freeboard" element={<FreeBoard />} />
          <Route path="/community/review" element={<Review />} />
          <Route path="/community/gallery" element={<Gallery />} />
          <Route path="/community/qna" element={<QnA />} />
          <Route path="/community/notice" element={<Notice />} />

          {/* Info */}
          <Route path="/info/intro" element={<PlatformIntro />} />

          <Route path="/info/faq" element={<FAQ />} />
          <Route path="/info/inquiry" element={<Inquiry />} />
          <Route path="/info/location" element={<Location />} />

          {/* Policy */}
          <Route path="/policy/aboutus" element={<AboutUs />} />
          <Route path="/policy/privacypolicy" element={<PrivacyPolicy />} />
          <Route path="/policy/serviceguide" element={<ServiceGuide />} />
          <Route path="/policy/termsofservice" element={<TermsOfService />} />
          <Route path="/policy/eftterms" element={<EFTTerms />} />
        </Route>
      </Routes>
    </>
  );
}
