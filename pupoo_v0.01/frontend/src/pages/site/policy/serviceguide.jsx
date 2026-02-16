export default function ServiceGuide() {
  return (
    <div className="pt-32 pb-20 bg-[#f5f7fa] min-h-screen">
      <div className="max-w-[900px] mx-auto bg-white shadow-sm rounded-xl px-12 py-14 text-gray-800 leading-8">
        <h1 className="text-4xl font-bold mb-4">이용안내</h1>
        <div className="h-[2px] bg-gray-200 mb-10"></div>

        <h2 className="text-2xl font-semibold mb-6">1. 회원가입</h2>
        <p>소셜로그인을 통해 간편하게 가입할 수 있습니다.</p>

        <h2 className="text-2xl font-semibold mt-10 mb-6">2. 행사 참가 신청</h2>
        <p>원하는 행사를 선택 후 참가 신청 및 결제를 진행합니다.</p>

        <h2 className="text-2xl font-semibold mt-10 mb-6">3. QR 체크인</h2>
        <p>행사 당일 발급된 QR코드를 통해 빠른 입장이 가능합니다.</p>

        <h2 className="text-2xl font-semibold mt-10 mb-6">4. 환불 안내</h2>
        <p>행사별 환불 정책에 따르며, 마이페이지에서 신청 가능합니다.</p>
      </div>
    </div>
  );
}
