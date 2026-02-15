import Container from "../../components/Container";
import Button from "../../components/Button";
import Card from "../../components/Card";
import ImageBlock from "../../components/ImageBlock";
import SectionTitle from "../../components/SectionTitle";
import { highlights, newsPosts, categories } from "../../data/mock";
import { Link } from "react-router-dom";

const HERO_1 =
  "https://images.unsplash.com/photo-1551739440-5dd934d3a94a?auto=format&fit=crop&w=2000&q=80";
const HERO_2 =
  "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=2000&q=80";
const HERO_3 =
  "https://images.unsplash.com/photo-1525253086316-d0c936c814f8?auto=format&fit=crop&w=2000&q=80";
const HERO_4 =
  "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=2000&q=80";
const HERO_5 =
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=2000&q=80";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-white">
        <div className="relative">
          <ImageBlock src={HERO_1} overlay className="h-[520px] md:h-[620px] rounded-none">
            <div className="flex h-full items-center">
              <Container>
                <div className="max-w-2xl text-white">
                  <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
                    pupoo, 애견 행사를 잇다
                  </h1>
                  <p className="mt-4 text-sm md:text-base leading-7 text-white/90">
                    애견 박람회·포럼의 운영 전 과정을 하나로 연결해요. 체크인부터
                    대기 관리, 공지, 참여기록까지.
                  </p>
                  <div className="mt-8 flex gap-3">
                    <Button
                      as={Link}
                      to="/project"
                      variant="outline"
                      className="bg-white/10 text-white border-white/30 hover:bg-white/15"
                    >
                      자세히
                    </Button>
                    <Button as={Link} to="/admin" variant="primary">
                      관리자 콘솔
                    </Button>
                  </div>
                </div>
              </Container>
            </div>
          </ImageBlock>
        </div>
      </section>

      {/* Intro split */}
      <section className="section-divider bg-white">
        <Container className="py-14 md:py-18">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-xs font-semibold text-[var(--color-accent)]">
                Pet Expo
              </div>
              <h2 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight">
                클라우드 애견 행사 플랫폼, pupoo
              </h2>
              <p className="mt-4 text-sm md:text-base leading-7 text-[var(--color-sub)]">
                pupoo는 애견 박람회·포럼 등 오프라인 대형 행사를 위한 클라우드
                기반 통합 운영 플랫폼입니다. 사전 신청부터 QR 체크인, 실시간
                혼잡도/대기 관리, 공지 전파, 참여기록까지 한 번에 관리합니다.
              </p>
            </div>
            <ImageBlock src={HERO_2} className="h-[240px] md:h-[320px]" />
          </div>
        </Container>
      </section>

      {/* Big headline */}
      <section className="section-divider bg-white">
        <Container className="py-14">
          <SectionTitle
            kicker="Cloud Native"
            title="Cloud Native 애견 행사 플랫폼 pupoo로 박람회·포럼 운영을 더 쉽게"
            desc="현장 운영을 자동화하고 데이터를 축적해 다음 행사를 더 안전하고 효율적으로 만듭니다."
          />
        </Container>

        <div className="px-6 pb-14">
          <div className="mx-auto max-w-6xl">
            <ImageBlock src={HERO_4} overlay className="h-[360px] md:h-[420px]">
              <div className="flex h-full items-center">
                <div className="w-full px-8 md:px-12">
                  <div className="max-w-5xl text-white">
                    <div className="text-center text-xl md:text-2xl font-extrabold">
                      pupoo, 애견 행사의 모든 순간을 연결해요
                    </div>
                    <div className="mt-8 grid gap-6 md:grid-cols-3">
                      {highlights.map((h) => (
                        <div
                          key={h.title}
                          className="rounded-[var(--radius)] border border-white/25 bg-white/10 p-6 backdrop-blur"
                        >
                          <div className="text-sm font-extrabold">{h.title}</div>
                          <p className="mt-2 text-sm leading-6 text-white/85">
                            {h.desc}
                          </p>
                          <div className="mt-4 text-xs text-white/80">
                            • {h.tag}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ImageBlock>
          </div>
        </div>
      </section>

      {/* Split image + text */}
      <section className="section-divider bg-white">
        <Container className="py-14">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <ImageBlock src={HERO_5} className="h-[280px] md:h-[360px]" />
            <div>
              <div className="text-xs font-semibold text-[var(--color-accent)]">
                Cloud Native 애견 행사 플랫폼
              </div>
              <h3 className="mt-2 text-xl md:text-2xl font-extrabold tracking-tight">
                운영자는 더 가볍게, 참가자는 더 편하게
              </h3>
              <p className="mt-4 text-sm md:text-base leading-7 text-[var(--color-sub)]">
                운영자 콘솔에서 참가자/세션/체험존을 관리하고, 참가자는 모바일로
                체크인과 안내를 받습니다.
              </p>
              <div className="mt-6 flex gap-3">
                <Button as={Link} to="/features" variant="primary">
                  기능 보기
                </Button>
                <Button as={Link} to="/use-cases" variant="outline">
                  이용 흐름
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="section-divider bg-white">
        <div className="mt-10">
          <ImageBlock src={HERO_4} overlay className="h-[260px] md:h-[320px] rounded-none">
            <div className="flex h-full items-center">
              <Container>
                <div className="max-w-2xl text-white">
                  <div className="text-2xl md:text-3xl font-extrabold">
                    Cloud Native 애견 행사 통합 운영 플랫폼,
                    <br />
                    pupoo입니다
                  </div>
                  <p className="mt-3 text-sm md:text-base leading-7 text-white/90">
                    참가 등록, 체크인, 대기 관리, 공지, 결제, 참여 이력까지 한 번에.
                  </p>
                  <Button
                    as={Link}
                    to="/project"
                    variant="outline"
                    className="mt-6 bg-white/10 text-white border-white/30 hover:bg-white/15"
                  >
                    더 알아보기
                  </Button>
                </div>
              </Container>
            </div>
          </ImageBlock>
        </div>
      </section>
    </div>
  );
}
