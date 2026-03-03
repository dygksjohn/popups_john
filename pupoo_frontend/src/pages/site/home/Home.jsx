import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { eventApi } from "../../../app/http/eventApi";
import { programApi } from "../../../app/http/programApi";
import { reviewApi } from "../../../app/http/reviewApi";
import { noticeApi, unwrap as unwrapNotice } from "../../../api/noticeApi";

function getPayload(res) {
  return res?.data?.data ?? res?.data ?? res;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function trimText(value, limit = 90) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

export default function Home() {
  const [ongoingEvents, setOngoingEvents] = useState([]);
  const [eventLoading, setEventLoading] = useState(true);

  const [recommendedPrograms, setRecommendedPrograms] = useState([]);
  const [programLoading, setProgramLoading] = useState(false);

  const [notices, setNotices] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    let mounted = true;

    const fetchEvents = async () => {
      setEventLoading(true);
      try {
        const res = await eventApi.getEvents({
          status: "ONGOING",
          page: 0,
          size: 6,
          sort: "startAt,asc",
        });
        const data = getPayload(res);
        if (!mounted) return;
        setOngoingEvents(Array.isArray(data?.content) ? data.content : []);
      } catch {
        if (mounted) setOngoingEvents([]);
      } finally {
        if (mounted) setEventLoading(false);
      }
    };

    const fetchCommunity = async () => {
      try {
        const [noticeRes, reviewRes] = await Promise.all([
          noticeApi.list(1, 3),
          reviewApi.list({ page: 0, size: 3 }),
        ]);

        if (!mounted) return;

        const noticeData = unwrapNotice(noticeRes);
        const reviewData = getPayload(reviewRes);
        setNotices(Array.isArray(noticeData?.content) ? noticeData.content.slice(0, 3) : []);
        setReviews(Array.isArray(reviewData?.content) ? reviewData.content.slice(0, 3) : []);
      } catch {
        if (!mounted) return;
        setNotices([]);
        setReviews([]);
      }
    };

    fetchEvents();
    fetchCommunity();

    return () => {
      mounted = false;
    };
  }, []);

  const firstEventId = useMemo(() => ongoingEvents?.[0]?.eventId ?? null, [ongoingEvents]);

  useEffect(() => {
    let mounted = true;
    if (!firstEventId) {
      setRecommendedPrograms([]);
      return;
    }

    const fetchPrograms = async () => {
      setProgramLoading(true);
      try {
        let res;
        try {
          res = await programApi.getPrograms({
            eventId: firstEventId,
            page: 0,
            size: 6,
            sort: "applyCount,desc",
          });
        } catch {
          res = await programApi.getPrograms({
            eventId: firstEventId,
            page: 0,
            size: 6,
            sort: "startAt,asc",
          });
        }

        const data = getPayload(res);
        if (!mounted) return;
        setRecommendedPrograms(Array.isArray(data?.content) ? data.content : []);
      } catch {
        if (mounted) setRecommendedPrograms([]);
      } finally {
        if (mounted) setProgramLoading(false);
      }
    };

    fetchPrograms();

    return () => {
      mounted = false;
    };
  }, [firstEventId]);

  return (
    <div className="bg-white text-slate-900">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
        <div className="mx-auto max-w-[1400px] px-6 py-24 md:py-32">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">Pupoo Event Platform</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-6xl">
            지금 참여할 수 있는
            <br />
            반려견 행사를 확인하세요
          </h1>
          <p className="mt-6 max-w-2xl text-base text-blue-100 md:text-lg">
            진행 중인 이벤트, 인기 프로그램, 커뮤니티 최신 글을 한 번에 확인할 수 있도록 메인 화면을 구성했습니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/event/current"
              className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-slate-900 transition hover:bg-blue-50"
            >
              진행 행사 보기
            </Link>
            <Link
              to="/program/schedule"
              className="rounded-full border border-blue-200 px-6 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-800"
            >
              프로그램 둘러보기
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">현재 진행 행사</p>
            <h2 className="mt-2 text-3xl font-bold">진행 중인 이벤트</h2>
          </div>
          <Link to="/event/current" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
            See details
          </Link>
        </div>

        {eventLoading ? (
          <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">행사 정보를 불러오는 중입니다.</div>
        ) : ongoingEvents.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">현재 진행 중인 이벤트가 없습니다.</div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {ongoingEvents.map((event) => (
              <Link
                key={event.eventId}
                to="/event/current"
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{event.status}</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">{event.eventName}</h3>
                <p className="mt-3 text-sm text-slate-600">{trimText(event.description, 110) || "이벤트 설명이 아직 등록되지 않았습니다."}</p>
                <div className="mt-4 text-xs text-slate-500">
                  <span>{formatDate(event.startAt)} 시작</span>
                  <span className="mx-2">|</span>
                  <span>{formatDate(event.endAt)} 종료</span>
                </div>
                <div className="mt-4 inline-flex items-center text-sm font-semibold text-blue-700">See details</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-slate-100 py-16">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">추천 프로그램</p>
              <h2 className="mt-2 text-3xl font-bold">인기 프로그램 TOP 6</h2>
            </div>
          </div>

          {programLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">추천 프로그램을 불러오는 중입니다.</div>
          ) : recommendedPrograms.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">추천 프로그램이 없습니다.</div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {recommendedPrograms.map((program) => (
                <Link
                  key={program.programId}
                  to={`/program/detail?programId=${program.programId}`}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-blue-300"
                >
                  <div className="aspect-[16/9] w-full bg-slate-200">
                    {program.imageUrl ? (
                      <img src={program.imageUrl} alt={program.programTitle} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-500">NO IMAGE</div>
                    )}
                  </div>
                  <div className="p-4">
                    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      {program.category || "PROGRAM"}
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-slate-900">{program.programTitle}</h3>
                    <p className="mt-2 text-sm text-slate-600">{trimText(program.description, 90) || "프로그램 소개가 없습니다."}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-6 md:grid-cols-2">
          <div>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-2xl font-bold">공지사항</h3>
              <Link to="/community/notice" className="text-sm font-semibold text-blue-300 hover:text-blue-200">more +</Link>
            </div>
            <div className="space-y-4">
              {notices.length === 0 ? (
                <div className="rounded-xl border border-slate-800 p-4 text-sm text-slate-400">표시할 공지사항이 없습니다.</div>
              ) : (
                notices.map((notice) => {
                  const noticeId = notice.noticeId ?? notice.id;
                  return (
                    <Link key={noticeId} to={`/community/notice/${noticeId}`} className="block rounded-xl border border-slate-800 p-4 transition hover:border-blue-400">
                      <p className="text-base font-semibold">{notice.title}</p>
                      <p className="mt-2 text-xs text-slate-400">{formatDate(notice.createdAt)}</p>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-2xl font-bold">행사 후기</h3>
              <Link to="/community/review" className="text-sm font-semibold text-blue-300 hover:text-blue-200">more +</Link>
            </div>
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="rounded-xl border border-slate-800 p-4 text-sm text-slate-400">표시할 후기가 없습니다.</div>
              ) : (
                reviews.map((review) => {
                  const reviewId = review.reviewId ?? review.id;
                  const title = trimText(review.title || review.content || "리뷰", 60);
                  return (
                    <Link key={reviewId} to={`/community/review?reviewId=${reviewId}`} className="block rounded-xl border border-slate-800 p-4 transition hover:border-blue-400">
                      <p className="text-base font-semibold">{title}</p>
                      <p className="mt-2 text-xs text-slate-400">{formatDate(review.createdAt)}</p>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
