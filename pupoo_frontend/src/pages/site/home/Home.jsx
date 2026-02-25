import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { noticeApi, unwrap } from "../../../api/noticeApi";

// ================= 스크롤 reveal 훅 =================
function useScrollReveal(options = {}) {
  const { threshold = 0.15, rootMargin = "0px 0px -60px 0px" } = options;
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);
  return [ref, isVisible];
}

function RevealSection({ children, className = "", delay = 0 }) {
  const [ref, isVisible] = useScrollReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ================= EVENT SECTION =================
function EventSection() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const events = {
    left: {
      date: "2026.02.28(수)",
      dateColor: "bg-gradient-to-r from-blue-50 to-blue-100/50",
      dateTextColor: "text-blue-700",
      items: [
        {
          title: "댕댕이 플레이 그라운드",
          time: "08:00 ~ 17:10",
          location: "올림픽 공원",
        },
        {
          title: "반려건 라이프 페어",
          time: "09:00 ~ 11:30",
          location: "올림픽 공원",
        },
        {
          title: "댕댕이 웰니스 데이",
          time: "10:00 ~ 16:00",
          location: "올림픽 공원",
        },
      ],
    },
    right: {
      date: "2026.02.28(수)",
      dateColor: "bg-gradient-to-r from-emerald-50 to-teal-100/50",
      dateTextColor: "text-teal-700",
      items: [
        {
          title: "댕댕이 웰니스 데이",
          time: "08:00 ~ 17:10",
          location: "올림픽 공원",
        },
        {
          title: "펫 비헤이비어 포럼",
          time: "09:00 ~ 11:30",
          location: "올림픽 공원",
        },
        {
          title: "반려견 교감 클래스",
          time: "10:00 ~ 16:00",
          location: "올림픽 공원",
        },
      ],
    },
  };
  return (
    <section className="w-full bg-gradient-to-b from-gray-50 to-white py-16 px-6">
      <div className="max-w-[1400px] mx-auto px-6">
        <RevealSection>
          <div className="text-center mb-10">
            <p className="text-[14px] font-semibold text-gray-500 uppercase mb-1">
              2026 애견 행사 진행 안내
            </p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
              현재 진행 중인 반려견 행사
            </h2>
            <button className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2 rounded-full transition-all duration-300">
              자세히 보기
            </button>
          </div>
        </RevealSection>
        <RevealSection delay={0.15}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 relative">
            <div className="hidden lg:block absolute left-1/2 top-6 bottom-0 -translate-x-1/2">
              <div
                className="w-px h-full"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
                  backgroundSize: "1px 5px",
                }}
              />
            </div>
            {["left", "right"].map((side) => (
              <div key={side} className="space-y-4">
                <div
                  className={`${events[side].dateColor} ${events[side].dateTextColor} text-center py-3 rounded-xl font-semibold text-sm`}
                >
                  {events[side].date}
                </div>
                <div className="space-y-4">
                  {events[side].items.map((event, idx) => (
                    <EventCard
                      key={`${side}-${idx}`}
                      event={event}
                      isHovered={hoveredCard === `${side}-${idx}`}
                      onHover={() => setHoveredCard(`${side}-${idx}`)}
                      onLeave={() => setHoveredCard(null)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </RevealSection>
      </div>
    </section>
  );
}
function EventCard({ event, isHovered, onHover, onLeave }) {
  return (
    <div
      className="cursor-pointer"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div
        className={`rounded-xl p-5 border border-gray-200 transition-all duration-300 ${isHovered ? "bg-gray-100 border-gray-300" : "bg-white"}`}
      >
        <div className="text-center">
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {event.title}
          </h3>
          <p className="text-[13px] text-gray-600 leading-tight">
            {event.time}
          </p>
          <p className="text-[13px] text-gray-600 leading-tight">
            {event.location}
          </p>
          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${isHovered ? "max-h-16 mt-3" : "max-h-0 mt-0"}`}
          >
            <button className="bg-blue-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full">
              자세히 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ================= 무한루프 훅 =================
function useInfiniteSlider(itemCount, slideSize) {
  const CLONES = 15;
  const CENTER = itemCount * 7;
  const [index, setIndex] = useState(CENTER);
  const [transition, setTransition] = useState(true);
  const resetTimer = useRef(null);
  const next = () => setIndex((p) => p + 1);
  const prev = () => setIndex((p) => p - 1);
  const goTo = (realIdx) => setIndex(CENTER + realIdx);
  useEffect(() => {
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      const mod = (((index - CENTER) % itemCount) + itemCount) % itemCount;
      const target = CENTER + mod;
      if (target !== index) {
        setTransition(false);
        setIndex(target);
      }
    }, 650);
    return () => clearTimeout(resetTimer.current);
  }, [index, itemCount]);
  useEffect(() => {
    if (!transition) {
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransition(true));
      });
      return () => cancelAnimationFrame(t);
    }
  }, [transition]);
  const realIndex = ((index % itemCount) + itemCount) % itemCount;
  const offset = index * slideSize;
  return {
    index,
    realIndex,
    offset,
    transition,
    next,
    prev,
    goTo,
    setIndex,
    setTransition,
    CLONES,
  };
}

// ================= SPEAKER LINEUP =================
const speakers = [
  {
    id: 1,
    tag: "기조연설",
    role: "수의학 박사 · 반려동물 행동 전문가",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
    name: "김도현 박사",
  },
  {
    id: 2,
    tag: "기조연설",
    role: "서울대학교 동물학과 교수",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop",
    name: "이준서 교수",
  },
  {
    id: 3,
    tag: "슈스등장",
    role: "웰시코기 · 인스타 스타견",
    image:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=500&fit=crop",
    name: "콩이",
  },
  {
    id: 4,
    tag: "슈스등장",
    role: "골든리트리버 · 세라피 도그",
    image:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=500&fit=crop",
    name: "보리",
  },
  {
    id: 5,
    tag: "패널토론",
    role: "펫 라이프스타일 에디터",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop",
    name: "박서연 에디터",
  },
  {
    id: 6,
    tag: "패널토론",
    role: "동물복지 정책 연구원",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop",
    name: "최유진 연구원",
  },
];

function SpeakerLineup() {
  const GAP = 20;
  const VISIBLE = 4;
  const PEEK = 0.35;
  const CARD_W = Math.floor((1400 - GAP * VISIBLE) / (VISIBLE + PEEK));
  const SLIDE = CARD_W + GAP;
  const slider = useInfiniteSlider(speakers.length, SLIDE);
  const extended = Array.from({ length: slider.CLONES }, () => speakers).flat();
  const [hovered, setHovered] = useState(null);
  const dragRef = useRef({ startX: 0, currentX: 0, dragging: false });
  const trackRef = useRef(null);
  const onPointerDown = (e) => {
    dragRef.current = {
      startX: e.clientX,
      currentX: e.clientX,
      dragging: true,
    };
    slider.setTransition(false);
  };
  const onPointerMove = (e) => {
    if (!dragRef.current.dragging) return;
    dragRef.current.currentX = e.clientX;
    const track = trackRef.current;
    if (track) {
      const delta = dragRef.current.currentX - dragRef.current.startX;
      track.style.transform = `translate3d(${-slider.offset + delta}px, 0, 0)`;
    }
  };
  const onPointerUp = () => {
    if (!dragRef.current.dragging) return;
    const delta = dragRef.current.currentX - dragRef.current.startX;
    dragRef.current.dragging = false;
    slider.setTransition(true);
    if (delta < -50) slider.next();
    else if (delta > 50) slider.prev();
  };
  const tagColor = {
    기조연설: { bg: "bg-blue-600", text: "text-white" },
    슈스등장: { bg: "bg-amber-500", text: "text-white" },
    패널토론: { bg: "bg-violet-600", text: "text-white" },
  };

  return (
    <div className="w-full bg-white py-20">
      <div className="max-w-[1400px] mx-auto px-6">
        <RevealSection>
          <div className="text-center mb-10">
            <p className="text-[14px] font-semibold text-gray-500 uppercase mb-1">
              2026 애견 행사 진행 안내
            </p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
              현재 진행 중인 반려견 행사
            </h2>
            <button className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2 rounded-full transition-all duration-300">
              자세히 보기
            </button>
          </div>
        </RevealSection>
        <RevealSection delay={0.12}>
          <div
            className="overflow-hidden cursor-grab active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            style={{ userSelect: "none" }}
          >
            <div
              ref={trackRef}
              className="flex"
              style={{
                gap: GAP,
                transform: `translate3d(-${slider.offset}px, 0, 0)`,
                transition: slider.transition
                  ? "transform 600ms cubic-bezier(0.16,1,0.3,1)"
                  : "none",
                willChange: "transform",
              }}
            >
              {extended.map((speaker, i) => {
                const isH = hovered === i;
                const colors = tagColor[speaker.tag] || {
                  bg: "bg-gray-600",
                  text: "text-white",
                };
                return (
                  <div
                    key={i}
                    style={{ width: CARD_W }}
                    className="shrink-0"
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div className="relative overflow-hidden rounded-2xl bg-gray-100 aspect-[3/4]">
                      <img
                        src={speaker.image}
                        alt={speaker.name}
                        className={`w-full h-full object-cover transition-all duration-700 ease-out ${isH ? "scale-105 grayscale-0" : "scale-100 grayscale"}`}
                        draggable={false}
                      />
                      <div
                        className="absolute inset-x-0 bottom-0 h-2/5"
                        style={{
                          background:
                            "linear-gradient(to top, rgba(0,0,0,0.55), transparent)",
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <p className="text-white font-bold text-lg">
                          {speaker.name}
                        </p>
                        <p className="text-white/60 text-sm mt-0.5">
                          {speaker.role}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span
                        className={`inline-block text-[11px] font-bold ${colors.bg} ${colors.text} px-2.5 py-1 rounded-md`}
                      >
                        {speaker.tag}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center gap-5">
              <span className="text-sm font-bold tabular-nums text-gray-900">
                {String(slider.realIndex + 1).padStart(2, "0")}
                <span className="text-gray-300 mx-1.5">/</span>
                {String(speakers.length).padStart(2, "0")}
              </span>
              <div className="flex gap-1.5">
                {speakers.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => slider.goTo(i)}
                    className={`h-[3px] rounded-full transition-all duration-500 ${i === slider.realIndex ? "w-8 bg-gray-900" : "w-3 bg-gray-300 hover:bg-gray-400"}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={slider.prev}
                className="w-11 h-11 rounded-full border border-gray-200 bg-white flex items-center justify-center transition-all duration-200 hover:border-gray-400 active:scale-95"
              >
                <svg
                  className="w-4 h-4 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={slider.next}
                className="w-11 h-11 rounded-full border border-gray-200 bg-white flex items-center justify-center transition-all duration-200 hover:border-gray-400 active:scale-95"
              >
                <svg
                  className="w-4 h-4 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </RevealSection>
      </div>
    </div>
  );
}

// ================= RECOMMEND CAROUSEL =================
function RecommendCarousel() {
  const items = [
    {
      title: "제목제목제목제목",
      desc: "여기다가 덧불일 내용을 쓰세요 좋게 말할때",
      tag: "서울시 강남구",
      img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "제목제목제목제목",
      desc: "여기다가 덧불일 내용을 쓰세요 좋게 말할때",
      tag: "서울시 강남구",
      img: "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "제목제목제목제목",
      desc: "여기다가 덧불일 내용을 쓰세요 좋게 말할때",
      tag: "서울시 강남구",
      img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "제목제목제목제목",
      desc: "여기다가 덧불일 내용을 쓰세요 좋게 말할때",
      tag: "서울시 강남구",
      img: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1200&q=80",
    },
  ];
  const GAP = 24;
  const PEEK = 0.4;
  const CARD_W = Math.floor((1400 - GAP * 3) / (3 + PEEK));
  const SLIDE = CARD_W + GAP;
  const slider = useInfiniteSlider(items.length, SLIDE);
  const extended = Array.from({ length: slider.CLONES }, () => items).flat();
  const dragRef = useRef({ startX: 0, currentX: 0, dragging: false });
  const trackRef = useRef(null);
  const onPointerDown = (e) => {
    dragRef.current = {
      startX: e.clientX,
      currentX: e.clientX,
      dragging: true,
    };
    slider.setTransition(false);
  };
  const onPointerMove = (e) => {
    if (!dragRef.current.dragging) return;
    dragRef.current.currentX = e.clientX;
    const track = trackRef.current;
    if (track) {
      track.style.transform = `translate3d(${-slider.offset + (dragRef.current.currentX - dragRef.current.startX)}px, 0, 0)`;
    }
  };
  const onPointerUp = () => {
    if (!dragRef.current.dragging) return;
    const delta = dragRef.current.currentX - dragRef.current.startX;
    dragRef.current.dragging = false;
    slider.setTransition(true);
    if (delta < -50) slider.next();
    else if (delta > 50) slider.prev();
  };

  return (
    <div className="relative w-full">
      <RevealSection>
        <div
          className="overflow-hidden cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          style={{ userSelect: "none" }}
        >
          <div
            ref={trackRef}
            className="flex"
            style={{
              gap: GAP,
              transform: `translate3d(-${slider.offset}px, 0, 0)`,
              transition: slider.transition
                ? "transform 600ms cubic-bezier(0.16,1,0.3,1)"
                : "none",
              willChange: "transform",
            }}
          >
            {extended.map((item, i) => (
              <div key={i} style={{ width: CARD_W }} className="shrink-0 group">
                <div className="relative overflow-hidden rounded-2xl">
                  <img
                    src={item.img}
                    alt=""
                    draggable={false}
                    className="h-[260px] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="mt-4">
                  <div className="text-[17px] font-bold text-gray-900">
                    {item.title}
                  </div>
                  <div className="text-sm text-gray-500 mt-1.5">
                    {item.desc}
                  </div>
                  <span className="inline-block mt-3 text-xs font-medium bg-gray-200 text-gray-600 px-3 py-1 rounded-md">
                    {item.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between mt-8">
          <div className="flex items-center gap-5">
            <span className="text-sm font-bold tabular-nums text-gray-900">
              {String(slider.realIndex + 1).padStart(2, "0")}
              <span className="text-gray-300 mx-1.5">/</span>
              {String(items.length).padStart(2, "0")}
            </span>
            <div className="flex gap-1.5">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => slider.goTo(i)}
                  className={`h-[3px] rounded-full transition-all duration-500 ${i === slider.realIndex ? "w-8 bg-gray-900" : "w-3 bg-gray-300 hover:bg-gray-400"}`}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={slider.prev}
              className="w-11 h-11 rounded-full border border-gray-200 bg-white flex items-center justify-center transition-all hover:border-gray-400 active:scale-95"
            >
              <svg
                className="w-4 h-4 text-gray-700"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={slider.next}
              className="w-11 h-11 rounded-full border border-gray-200 bg-white flex items-center justify-center transition-all hover:border-gray-400 active:scale-95"
            >
              <svg
                className="w-4 h-4 text-gray-700"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </RevealSection>
    </div>
  );
}

// ================= NOTICE SECTION (API 연동) =================
function fmtDate(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function NoticeSection() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    noticeApi
      .list(1, 3)
      .then((res) => {
        const d = unwrap(res);
        setNotices(d?.content?.slice(0, 3) || []);
      })
      .catch(() => setNotices([]));
  }, []);

  // 후기는 아직 API 없으므로 더미
  const articles = [
    { title: "반려동물 산업 2026 트렌드 분석", date: "2026.02.20" },
    { title: "펫 테크 스타트업 투자 현황", date: "2026.02.18" },
    { title: "반려동물 동반 여행 시장 성장세", date: "2026.02.15" },
  ];

  const sections = [
    {
      title: "공지사항",
      items: notices.map((n) => ({
        title: n.title,
        date: fmtDate(n.createdAt),
      })),
      morePath: "/community/notice",
    },
    {
      title: "후기 게시판",
      items: articles,
      morePath: "/community/review",
    },
  ];

  return (
    <section className="bg-black text-white py-24">
      <div className="max-w-[1400px] mx-auto px-6 grid md:grid-cols-2 gap-16">
        {sections.map((section, idx) => (
          <RevealSection key={idx} delay={idx * 0.12}>
            <div>
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-extrabold">{section.title}</h3>
                <button
                  type="button"
                  className="text-sm text-white/70 hover:text-white transition"
                  onClick={() => section.morePath && navigate(section.morePath)}
                >
                  more +
                </button>
              </div>
              <div className="space-y-10">
                {section.items.length > 0
                  ? section.items.map((item, i) => (
                      <div
                        key={i}
                        className="group cursor-pointer"
                        onClick={() =>
                          section.morePath && navigate(section.morePath)
                        }
                      >
                        <div className="flex justify-between">
                          <div>
                            <div className="text-lg font-semibold group-hover:text-gray-300 transition">
                              {item.title}
                            </div>
                            <div className="mt-3 text-sm text-white/60">
                              {item.date}
                            </div>
                          </div>
                          <div className="text-3xl text-white/60 group-hover:text-white transition">
                            +
                          </div>
                        </div>
                        <div className="mt-6 border-b border-white/20" />
                      </div>
                    ))
                  : [1, 2, 3].map((i) => (
                      <div key={i} className="group cursor-pointer">
                        <div className="flex justify-between">
                          <div>
                            <div className="text-lg font-semibold text-white/30">
                              불러오는 중...
                            </div>
                            <div className="mt-3 text-sm text-white/20">-</div>
                          </div>
                        </div>
                        <div className="mt-6 border-b border-white/20" />
                      </div>
                    ))}
              </div>
            </div>
          </RevealSection>
        ))}
      </div>
    </section>
  );
}

// ================= MAIN =================
export default function Home() {
  const heroVideos = [
    "http://kgj.dothome.co.kr/pupoo/1.mov",
    "http://kgj.dothome.co.kr/pupoo/2.mov",
    "http://kgj.dothome.co.kr/pupoo/3.mp4",
  ];
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const updateProgress = () => {
      if (video.duration)
        setProgress((video.currentTime / video.duration) * 100);
    };
    const handleEnded = () => {
      setFade(false);
      setProgress(0);
      setTimeout(() => {
        setCurrentVideoIndex((p) => (p === heroVideos.length - 1 ? 0 : p + 1));
        setFade(true);
      }, 600);
    };
    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("ended", handleEnded);
    return () => {
      video.removeEventListener("timeupdate", updateProgress);
      video.removeEventListener("ended", handleEnded);
    };
  }, [currentVideoIndex]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    isPlaying ? v.pause() : v.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <div>
      <section className="relative h-screen w-full overflow-hidden">
        <video
          ref={videoRef}
          key={currentVideoIndex}
          src={heroVideos[currentVideoIndex]}
          autoPlay
          muted
          playsInline
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${fade ? "opacity-100" : "opacity-0"}`}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex items-center justify-center">
          <div className="max-w-[1400px] w-full px-6 text-white">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              지금, 가장 즐거운
              <br />
              반려견 페스티벌
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/90">
              참여 가능한 행사를 바로 확인하세요
            </p>
          </div>
        </div>
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[300px]">
          <div className="relative h-[2px] bg-white/30">
            <div
              className="absolute left-0 top-0 h-full bg-white transition-[width] duration-200 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-3 text-white text-sm">
            <span>
              {String(currentVideoIndex + 1).padStart(2, "0")} /{" "}
              {String(heroVideos.length).padStart(2, "0")}
            </span>
            <button type="button" onClick={togglePlay}>
              {isPlaying ? "❚❚" : "▶"}
            </button>
          </div>
        </div>
      </section>

      <SpeakerLineup />
      <EventSection />

      <section className="bg-[#f4f5f7] py-24 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6">
          <RevealSection>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-8">
              <span className="text-blue-600">당신이</span> 좋아할 만한 추천
              행사
            </h2>
          </RevealSection>
          <RevealSection delay={0.08}>
            <div className="bg-[#e9eaee] rounded-xl px-6 py-4 text-sm text-gray-700 mb-12">
              '나의 성향에 따른 맞춤형 행사'가 추천되고 있습니다.
            </div>
          </RevealSection>
          <RecommendCarousel />
        </div>
      </section>

      <NoticeSection />
    </div>
  );
}
