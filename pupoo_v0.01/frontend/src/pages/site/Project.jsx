import Container from "../../components/Container";
import SectionTitle from "../../components/SectionTitle";
import Card from "../../components/Card";
import ImageBlock from "../../components/ImageBlock";

export default function Page() {
  return (
    <div className="bg-white">
      <Container className="py-14">
        <SectionTitle title="프로젝트 소개" desc="애견 포럼·박람회 운영을 디지털로 통합하는 pupoo의 목표와 배경을 소개합니다." />
        <div className="mt-10 grid gap-6 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <Card className="p-6">
              <div className="font-extrabold">요약</div>
              <p className="mt-2 text-sm leading-6 text-[var(--color-sub)]">
                이 페이지는 PDF(1~5)의 톤을 유지한 실제 플랫폼 웹 템플릿입니다. 필요한 섹션을 추가/삭제해 확장하세요.
              </p>
            </Card>
            <Card className="p-6">
              <div className="font-extrabold">핵심 포인트</div>
              <ul className="mt-2 list-disc list-inside text-sm leading-6 text-[var(--color-sub)]">
                <li>큰 사진 + 단정한 타이포</li>
                <li>섹션 간 넓은 여백</li>
                <li>그린 포인트 컬러</li>
              </ul>
            </Card>
          </div>
          <ImageBlock className="h-[260px] md:h-[340px]" src="https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=2000&q=80" />
        </div>
      </Container>
    </div>
  );
}
