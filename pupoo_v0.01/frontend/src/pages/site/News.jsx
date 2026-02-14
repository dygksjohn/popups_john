import Container from "../../components/Container";
import SectionTitle from "../../components/SectionTitle";
import ImageBlock from "../../components/ImageBlock";
import { newsPosts } from "../../data/mock";

export default function News() {
  return (
    <div className="bg-white">
      <Container className="py-14">
        <SectionTitle title="News" desc="pupoo 업데이트, 운영 노하우, 행사 소식을 공유합니다." />
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {newsPosts.map((p) => (
            <article key={p.id}>
              <ImageBlock src={p.image} className="h-[220px] md:h-[260px]" />
              <div className="mt-4 text-xs text-[var(--color-sub)]">{p.date} · {p.category}</div>
              <h3 className="mt-2 text-lg font-extrabold leading-snug">{p.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--color-sub)]">{p.excerpt}</p>
            </article>
          ))}
        </div>
      </Container>
    </div>
  );
}
