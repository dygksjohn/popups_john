import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { useAuth } from "./pages/site/auth/AuthProvider";
import SiteLayout from "./layouts/SiteLayout";
import ScrollToTop from "./ScrollToTop.jsx";
import { adminNoticeApi, getToken, clearToken } from "./api/noticeApi";

/* admin */
import Dashboard from "./pages/admin/dashboard/Dashboard";
import BoardManage from "./pages/admin/board/boardManage";
import NoticeManage from "./pages/admin/board/Notice";
import EventManage from "./pages/admin/event/eventManage";
import ProgramManage from "./pages/admin/program/programManage";
import RealtimeData from "./pages/admin/realtime/RealtimeData.jsx";
import PastEvents from "./pages/admin/past/PastEvents";
import ZoneManage from "./pages/admin/zone/zoneManage";
import ContestManage from "./pages/admin/contest/contestManage";
import SessionManage from "./pages/admin/session/sessionManage";
import Reviews from "./pages/admin/board/Reviews";
import GalleryManage from "./pages/admin/gallery/Gallery";
import ParticipantList from "./pages/admin/participant/ParticipantList";
import PaymentManage from "./pages/admin/participant/PaymentManage";
import AlertManage from "./pages/admin/participant/AlertManage";
import RefundManage from "./pages/admin/refund/RefundManage";
import ReportManage from "./pages/admin/report/ReportManage";
import AdminLogin from "./pages/admin/shared/AdminLogin";

/* Home */
import Home from "./pages/site/home/Home";

/* Auth */
import Login from "./pages/site/auth/Login";
import FindPassword from "./pages/site/auth/FindPassword";
import ResetPassword from "./pages/site/auth/ResetPassword";
import Mypage from "./pages/site/auth/Mypage";
import MypageQr from "./pages/site/auth/MypageQr";
import MypageProfileEdit from "./pages/site/auth/MypageProfileEdit";
import MypagePetEditor from "./pages/site/auth/MypagePetEditor";
import JoinSelect from "./pages/site/auth/join/JoinSelect";
import JoinNormal from "./pages/site/auth/join/JoinNormal";
import JoinSocial from "./pages/site/auth/join/JoinSocial";

/* Kakao */
import KakaoCallback from "./pages/site/auth/KakaoCallback";
import KakaoJoin from "./pages/site/auth/join/KakaoJoin";
import KakaoOtp from "./pages/site/auth/join/KakaoOtp";

/* Google */
import GoogleCallback from "./pages/site/auth/GoogleCallback";
import GoogleJoin from "./pages/site/auth/join/GoogleJoin";

/* Payment */
import Checkout from "./pages/site/payment/Checkout";
import PaymentApprove from "./pages/site/payment/PaymentApprove";

/* Event */
import Current from "./pages/site/event/Current";
import Upcoming from "./pages/site/event/Upcoming";
import Closed from "./pages/site/event/Closed";
import PreRegister from "./pages/site/event/PreRegister";
import EventSchedule from "./pages/site/event/EventSchedule";

/* Program */
import Experience from "./pages/site/program/Experience";
import Session from "./pages/site/program/Session";
import Contest from "./pages/site/program/Contest";
import ContestDetailPage from "./pages/site/program/ContestDetailPage";
import ProgramAll from "./pages/site/program/ProgramAll";
import ProgramStatus from "./pages/site/program/ProgramStatus";
import SessionDetail from "./pages/site/program/SessionDetail";
import SpeakerDetail from "./pages/site/program/SpeakerDetail";
import VoteResult from "./pages/site/program/VoteResult";

/* Registration */
import Apply from "./pages/site/registration/Apply";
import ApplyHistory from "./pages/site/registration/ApplyHistory";
import PaymentHistory from "./pages/site/registration/PaymentHistory";
import QRCheckin from "./pages/site/registration/QRCheckin";

/* Realtime */
import WaitingStatus from "./pages/site/realtime/WaitingStatus";
import VoteStatus from "./pages/site/realtime/VoteStatus";
import RealtimeDashboard from "./pages/site/realtime/Dashboard";
import CheckinStatus from "./pages/site/realtime/CheckinStatus";

/* Community */
import FreeBoard from "./pages/site/community/FreeBoard";
import FreeBoardDetailPage from "./pages/site/community/FreeBoardDetailPage";
import FreeBoardWritePage from "./pages/site/community/FreeBoardWritePage";
import Review from "./pages/site/community/Review";
import ReviewDetailPage from "./pages/site/community/ReviewDetailPage";
import ReviewWritePage from "./pages/site/community/ReviewWritePage";
import QnA from "./pages/site/community/QnA";
import QnADetailPage from "./pages/site/community/QnADetailPage";
import QnAWritePage from "./pages/site/community/QnAWritePage";
import Notice from "./pages/site/community/Notice";
import NoticeDetailPage from "./pages/site/community/NoticeDetailPage";
import CommunityFaq from "./pages/site/community/Faq";
import InfoBoard from "./pages/site/community/InfoBoard";
import InfoBoardDetailPage from "./pages/site/community/InfoBoardDetailPage";
import InfoBoardWritePage from "./pages/site/community/InfoBoardWritePage";
import FaqDetailPage from "./pages/site/community/FaqDetailPage";
import FreeBoardEditPage from "./pages/site/community/FreeBoardEditPage";
import InfoBoardEditPage from "./pages/site/community/InfoBoardEditPage";
import QnAEditPage from "./pages/site/community/QnAEditPage";
import ReviewEditPage from "./pages/site/community/ReviewEditPage";

/* Info */
import PlatformIntro from "./pages/site/info/PlatformIntro";
import InfoFAQ from "./pages/site/info/FAQ";
import Inquiry from "./pages/site/info/Inquiry";
import Location from "./pages/site/info/Location";

/* Policy */
import AboutUs from "./pages/site/policy/aboutus";
import PrivacyPolicy from "./pages/site/policy/privacypolicy";
import ServiceGuide from "./pages/site/policy/serviceguide";
import TermsOfService from "./pages/site/policy/termsofservice";
import EFTTerms from "./pages/site/policy/EFTTerms";

/* gallery */
import EventGallery from "./pages/site/gallery/eventgallery";

/* guide */
import Operation from "./pages/site/guide/Operation";
import LocationPage from "./pages/site/guide/Location";
import Credits from "./pages/site/credits/Credits";

function ComingSoon() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px",
        color: "#94A3B8",
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 16 }}>...</div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#64748B",
          marginBottom: 6,
        }}
      >
        Preparing
      </div>
      <div style={{ fontSize: 13 }}>This feature will be added soon.</div>
    </div>
  );
}

function PublicOnly({ children }) {
  const { isAuthed } = useAuth();
  const location = useLocation();

  if (isAuthed) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function RequireAdmin({ children }) {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const validate = async () => {
      const token = getToken();
      if (!token) {
        if (mounted) {
          setAuthed(false);
          setChecking(false);
        }
        return;
      }

      try {
        await adminNoticeApi.list(1, 1);
        if (mounted) setAuthed(true);
      } catch {
        clearToken();
        if (mounted) setAuthed(false);
      } finally {
        if (mounted) setChecking(false);
      }
    };

    validate();
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  if (checking) return null;

  if (!authed) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return children;
}

function LegacyProgramRedirect({ target }) {
  const { eventId } = useParams();
  return <Navigate to={eventId ? `${target}/${eventId}` : target} replace />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={<Navigate to="/admin/dashboard" replace />}
        />
        <Route
          path="/admin/dashboard"
          element={
            <RequireAdmin>
              <Dashboard />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/board"
          element={
            <RequireAdmin>
              <BoardManage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/board/notice"
          element={
            <RequireAdmin>
              <NoticeManage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/event"
          element={
            <RequireAdmin>
              <EventManage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/program"
          element={
            <RequireAdmin>
              <ProgramManage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/realtime"
          element={
            <RequireAdmin>
              <RealtimeData />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/past"
          element={
            <RequireAdmin>
              <PastEvents />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/zone"
          element={
            <RequireAdmin>
              <ZoneManage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/contest"
          element={
            <RequireAdmin>
              <ContestManage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/session"
          element={
            <RequireAdmin>
              <SessionManage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/board/reviews"
          element={
            <RequireAdmin>
              <Reviews />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/gallery"
          element={
            <RequireAdmin>
              <GalleryManage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <RequireAdmin>
              <ReportManage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/refunds"
          element={
            <RequireAdmin>
              <RefundManage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/participant"
          element={
            <RequireAdmin>
              <ParticipantList />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/participant/detail"
          element={
            <RequireAdmin>
              <ComingSoon />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/participant/detail/:id"
          element={
            <RequireAdmin>
              <ComingSoon />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/participant/checkin"
          element={
            <RequireAdmin>
              <ComingSoon />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/participant/session"
          element={
            <RequireAdmin>
              <ComingSoon />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/participant/payment"
          element={
            <RequireAdmin>
              <PaymentManage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/participant/alert"
          element={
            <RequireAdmin>
              <AlertManage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/participant/stats"
          element={
            <RequireAdmin>
              <ComingSoon />
            </RequireAdmin>
          }
        />

        {/* site */}
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route
            path="/auth/login"
            element={
              <PublicOnly>
                <Login />
              </PublicOnly>
            }
          />
          <Route
            path="/auth/find-password"
            element={
              <PublicOnly>
                <FindPassword />
              </PublicOnly>
            }
          />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/auth/mypage" element={<Mypage />} />
          <Route path="/auth/mypage/qr" element={<MypageQr />} />
          <Route path="/auth/mypage/profile" element={<MypageProfileEdit />} />
          <Route path="/auth/mypage/pjrofile" element={<MypageProfileEdit />} />
          <Route path="/auth/mypage/pets/new" element={<MypagePetEditor />} />
          <Route
            path="/auth/mypage/pets/:petId/edit"
            element={<MypagePetEditor />}
          />
          <Route path="/mypage" element={<Mypage />} />
          <Route path="/mypage/qr" element={<MypageQr />} />
          <Route path="/mypage/profile" element={<MypageProfileEdit />} />
          <Route path="/mypage/pjrofile" element={<MypageProfileEdit />} />
          <Route path="/mypage/pets/new" element={<MypagePetEditor />} />
          <Route
            path="/mypage/pets/:petId/edit"
            element={<MypagePetEditor />}
          />
          <Route
            path="/auth/join/joinselect"
            element={
              <PublicOnly>
                <JoinSelect />
              </PublicOnly>
            }
          />
          <Route
            path="/auth/join/joinnormal"
            element={
              <PublicOnly>
                <JoinNormal />
              </PublicOnly>
            }
          />
          <Route
            path="/auth/join/joinsocial"
            element={
              <PublicOnly>
                <JoinSocial />
              </PublicOnly>
            }
          />
          <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route
            path="/auth/join/google"
            element={
              <PublicOnly>
                <GoogleJoin />
              </PublicOnly>
            }
          />
          <Route
            path="/auth/join/kakao"
            element={
              <PublicOnly>
                <KakaoJoin />
              </PublicOnly>
            }
          />
          <Route
            path="/auth/join/kakao/otp"
            element={
              <PublicOnly>
                <KakaoOtp />
              </PublicOnly>
            }
          />
          <Route path="/join" element={<JoinSelect />} />
          <Route path="/find-password" element={<FindPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/join/select" element={<JoinSelect />} />
          <Route path="/join/normal" element={<JoinNormal />} />
          <Route path="/join/social" element={<JoinSocial />} />
          <Route path="/event/current" element={<Current />} />
          <Route path="/event/upcoming" element={<Upcoming />} />
          <Route path="/event/closed" element={<Closed />} />
          <Route path="/event/preregister" element={<PreRegister />} />
          <Route path="/event/eventschedule" element={<EventSchedule />} />
          <Route path="/payment/checkout" element={<Checkout />} />
          <Route path="/payment/approve" element={<PaymentApprove />} />
          <Route
            path="/program/experience/:eventId?"
            element={<Experience />}
          />
          <Route
            path="/program/current/:eventId?"
            element={<ProgramStatus statusKey="current" />}
          />
          <Route
            path="/program/upcoming/:eventId?"
            element={<ProgramStatus statusKey="upcoming" />}
          />
          <Route
            path="/program/closed/:eventId?"
            element={<ProgramStatus statusKey="closed" />}
          />
          <Route path="/program/session/:eventId?" element={<Session />} />
          <Route
            path="/program/schedule/:eventId?"
            element={<LegacyProgramRedirect target="/program/all" />}
          />
          <Route path="/program/all/:eventId?" element={<ProgramAll />} />
          <Route path="/program/detail" element={<SessionDetail />} />
          <Route path="/program/speaker/detail" element={<SpeakerDetail />} />
          <Route
            path="/program/contest/:eventId/detail/:programId"
            element={<ContestDetailPage />}
          />
          <Route path="/program/contest/:eventId?" element={<Contest />} />
          <Route
            path="/program/booth/:eventId?"
            element={<LegacyProgramRedirect target="/program/experience" />}
          />
          <Route path="/registration/apply" element={<Apply />} />
          <Route path="/registration/applyhistory" element={<ApplyHistory />} />
          <Route
            path="/registration/paymenthistory"
            element={<PaymentHistory />}
          />
          <Route path="/registration/qrcheckin" element={<QRCheckin />} />
          <Route
            path="/realtime/dashboard/:eventId?"
            element={<RealtimeDashboard />}
          />
          <Route
            path="/realtime/checkinstatus/:eventId?"
            element={<CheckinStatus />}
          />
          <Route
            path="/realtime/votestatus/:eventId?"
            element={<VoteStatus />}
          />
          <Route
            path="/realtime/waitingstatus/:eventId?"
            element={<WaitingStatus />}
          />
          <Route path="/community/freeboard" element={<FreeBoard />} />
          <Route
            path="/community/freeboard/write"
            element={<FreeBoardWritePage />}
          />
          <Route
            path="/community/freeboard/:postId/edit"
            element={<FreeBoardEditPage />}
          />
          <Route
            path="/community/freeboard/:postId"
            element={<FreeBoardDetailPage />}
          />
          <Route path="/community/info" element={<InfoBoard />} />
          <Route
            path="/community/info/write"
            element={<InfoBoardWritePage />}
          />
          <Route
            path="/community/info/:postId/edit"
            element={<InfoBoardEditPage />}
          />
          <Route
            path="/community/info/:postId"
            element={<InfoBoardDetailPage />}
          />
          <Route path="/community/review" element={<Review />} />
          <Route path="/community/review/write" element={<ReviewWritePage />} />
          <Route
            path="/community/review/:reviewId/edit"
            element={<ReviewEditPage />}
          />
          <Route
            path="/community/review/:reviewId"
            element={<ReviewDetailPage />}
          />
          <Route path="/community/qna" element={<QnA />} />
          <Route path="/community/qna/write" element={<QnAWritePage />} />
          <Route path="/community/qna/:qnaId/edit" element={<QnAEditPage />} />
          <Route path="/community/qna/:qnaId" element={<QnADetailPage />} />
          <Route path="/community/notice" element={<Notice />} />
          <Route
            path="/community/notice/:noticeId"
            element={<NoticeDetailPage />}
          />
          <Route path="/community/faq" element={<CommunityFaq />} />
          <Route path="/community/faq/:postId" element={<FaqDetailPage />} />
          <Route path="/info/intro" element={<PlatformIntro />} />
          <Route path="/info/faq" element={<InfoFAQ />} />
          <Route path="/info/inquiry" element={<Inquiry />} />
          <Route path="/info/location" element={<Location />} />
          <Route path="/policy/aboutus" element={<AboutUs />} />
          <Route path="/policy/privacypolicy" element={<PrivacyPolicy />} />
          <Route path="/policy/serviceguide" element={<ServiceGuide />} />
          <Route path="/policy/termsofservice" element={<TermsOfService />} />
          <Route path="/policy/eftterms" element={<EFTTerms />} />
          <Route path="/gallery/eventgallery" element={<EventGallery />} />
          <Route path="/guide/location" element={<LocationPage />} />
          <Route path="/guide/operation" element={<Operation />} />
          <Route path="/credits" element={<Credits />} />
          <Route
            path="/guide/timetable"
            element={<Navigate to="/event/eventschedule" replace />}
          />
        </Route>
      </Routes>
    </>
  );
}
