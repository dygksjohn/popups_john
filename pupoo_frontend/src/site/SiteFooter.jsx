import Container from "../components/Container";

export default function SiteFooter() {
  return (
    <footer className="section-divider bg-white">
      <Container className="py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="font-extrabold">pupoo</div>
            <p className="mt-2 text-sm leading-6 text-[var(--color-sub)]">
              Cloud Native 애견 행사 통합 운영 플랫폼. 체크인·대기·공지·참여기록을 하나로 연결합니다.
            </p>
            <div className="mt-4 text-xs text-[var(--color-sub)]">© 2026 pupoo. All rights reserved.</div>
          </div>

          <div>
            <div className="font-semibold">Contact us</div>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-sub)]">
              <li>📞 070-0000-0000</li>
              <li>✉ help@mydomain.com</li>
              <li>🕒 MON-FRI (WEEKEND, HOLIDAY OFF)</li>
              <li>⏱ 9:00 AM ~ 6:00 PM (LUNCH 12:00 PM ~ 1:00 PM)</li>
            </ul>
          </div>

          <div>
            <div className="font-semibold">Links</div>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-sub)]">
              <li>이용약관</li>
              <li>개인정보처리방침</li>
              <li>문의하기</li>
            </ul>
          </div>
        </div>
      </Container>
    </footer>
  );
}
