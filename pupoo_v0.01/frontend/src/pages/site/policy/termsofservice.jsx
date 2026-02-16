export default function TermsOfService() {
  return (
    <div className="pt-32 pb-20 bg-[#f5f7fa] min-h-screen">
      <div className="max-w-[900px] mx-auto bg-white shadow-sm rounded-xl px-12 py-14 text-gray-800 leading-8">
        <h1 className="text-4xl font-bold mb-4">이용약관</h1>
        <div className="h-[2px] bg-gray-200 mb-10"></div>

        <h2 className="text-2xl font-semibold mb-6">제1장 총칙</h2>

        <h3 className="font-semibold mb-2">제1조 (목적)</h3>
        <p>
          본 약관은 (주)Pupoo(이하 “회사”)가 운영하는 애견 행사 통합 운영 플랫폼
          “Pupoo”(이하 “서비스”)의 이용과 관련하여 회사와 이용자의 권리, 의무 및
          책임사항을 규정함을 목적으로 합니다.
        </p>

        <h3 className="font-semibold mt-8 mb-2">제2조 (용어의 정의)</h3>
        <ol className="list-decimal ml-6 space-y-2">
          <li>
            “플랫폼”이란 회사가 애견 행사 운영을 위해 제공하는 온라인 시스템을
            말합니다.
          </li>
          <li>
            “이용자”란 플랫폼에 접속하여 서비스를 이용하는 회원 및 비회원을
            말합니다.
          </li>
          <li>
            “회원”이란 소셜로그인 등을 통해 가입하여 지속적으로 서비스를
            이용하는 자를 말합니다.
          </li>
          <li>
            “행사”란 플랫폼을 통해 등록·운영되는 애견 관련 이벤트를 말합니다.
          </li>
        </ol>

        <h3 className="font-semibold mt-8 mb-2">제3조 (약관의 효력 및 변경)</h3>
        <p>
          본 약관은 서비스 화면에 게시하고 이용자가 동의함으로써 효력이
          발생합니다. 회사는 관련 법령을 준수하는 범위 내에서 약관을 변경할 수
          있으며, 변경 시 최소 7일 전에 공지합니다.
        </p>

        <h2 className="text-2xl font-semibold mt-12 mb-6">제2장 서비스 이용</h2>

        <h3 className="font-semibold mb-2">제4조 (서비스 제공)</h3>
        <p>
          회사는 행사 등록, 참가 신청, 결제, QR 체크인, 부스 관리, 프로그램 안내
          등 행사 운영에 필요한 기능을 제공합니다.
        </p>

        <h3 className="font-semibold mt-8 mb-2">제5조 (서비스 이용 제한)</h3>
        <ul className="list-disc ml-6 space-y-2">
          <li>허위 정보 등록</li>
          <li>타인 정보 도용</li>
          <li>서비스 운영 방해</li>
          <li>법령 위반 행위</li>
        </ul>

        <h3 className="font-semibold mt-8 mb-2">제6조 (책임 제한)</h3>
        <p>
          회사는 천재지변, 시스템 장애 등 불가항력적 사유로 인한 서비스 중단에
          대해 책임을 지지 않습니다.
        </p>

        <div className="mt-12 text-sm text-gray-400">
          부칙: 본 약관은 2026년 1월 1일부터 적용됩니다.
        </div>
      </div>
    </div>
  );
}
