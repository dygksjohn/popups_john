export default function WorldHeritageFestivalBI() {
  return (
    <div className="pt-36 pb-32 bg-white min-h-screen">
      <div className="max-w-[820px] mx-auto px-6 text-gray-900">
        {/* ================= 타이틀 (그대로 유지) ================= */}
        <div className="mb-20">
          <h1 className="text-5xl font-bold tracking-tight mb-6">회사소개</h1>
          <p className="text-gray-500 text-sm">
            최종 수정일자 : 2026-02-18 (Ver 1.0)
          </p>
        </div>

        {/* ================= BI 설명 ================= */}
        <section className="mb-24 bg-gray-100 p-10">
          <div className="space-y-10">
            <div className="flex flex-col items-center text-center">
              <div className="w-56 h-56 bg-gray-300 flex items-center justify-center mb-6">
                PUPOO LOGO
              </div>
              <div className="text-2xl font-bold text-teal-700">
                Pupoo Pet Event Platform
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-6 text-center">
                반려동물 문화의 연결과 확장
              </h2>
              <div className="space-y-4 text-gray-700 leading-relaxed text-sm">
                <p>
                  Pupoo는 반려동물과 보호자를 위한 행사 통합 운영 플랫폼입니다.
                </p>
                <p>행사 기획, 참가 신청, 결제, 현장 운영, 커뮤니티까지</p>
                <p>하나의 시스템 안에서 연결되는 통합 경험을 제공합니다.</p>
                <p>
                  오프라인 행사의 즐거움과 온라인 플랫폼의 편리함을 결합하여
                  반려동물 문화를 더 넓게 확장하는 것을 목표로 합니다.
                </p>
              </div>

              <div className="flex justify-center gap-4 mt-10">
                <button className="px-6 py-3 border text-sm">
                  브랜드 가이드 다운로드 ⬇
                </button>
                <button className="px-6 py-3 border text-sm">
                  로고 파일 다운로드 ⬇
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 국문형 / 영문형 ================= */}
        <section className="mb-24 bg-gray-100 p-10 text-center space-y-16">
          <div>
            <div className="w-full h-48 bg-gray-300 flex items-center justify-center mb-4">
              PUPOO LOGO
            </div>
            <p className="font-bold text-teal-700 mb-2">푸푸 (PUPOO)</p>
            <p className="text-sm text-gray-600">국문 로고 타입</p>
          </div>

          <div>
            <div className="w-full h-48 bg-gray-300 flex items-center justify-center mb-4">
              PUPOO LOGO
            </div>
            <p className="font-bold text-teal-700 uppercase mb-2">
              PUPOO PET EVENT PLATFORM
            </p>
            <p className="text-sm text-gray-600">영문 로고 타입</p>
          </div>
        </section>

        {/* ================= 전용색상 ================= */}
        <section className="mb-24">
          <h2 className="text-2xl font-bold mb-10">브랜드 컬러 시스템</h2>

          <div className="space-y-10">
            {[
              { bg: "#2F55FF", pantone: "Pupoo Blue" },
              { bg: "#00B894", pantone: "Pupoo Mint" },
              { bg: "#1E1E1E", pantone: "Pupoo Black" },
              { bg: "#F4F6FA", pantone: "Pupoo Light Gray" },
            ].map((color, i) => (
              <div key={i} className="border">
                <div className="h-40" style={{ backgroundColor: color.bg }} />
                <div className="p-4 text-sm space-y-2">
                  <div>{color.pantone}</div>
                  <div>CMYK 기준 브랜드 가이드 참조</div>
                  <div>RGB / HEX 기준 웹 가이드 적용</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= White / Black ================= */}
        <section className="space-y-16">
          <div>
            <h3 className="text-lg font-bold mb-6 text-center">
              White Version
            </h3>
            <div className="border bg-white p-10 flex flex-col items-center space-y-4">
              <div className="w-32 h-32 bg-gray-300 flex items-center justify-center">
                PUPOO LOGO
              </div>
              <p className="font-bold">2026</p>
              <p className="font-bold">Pupoo Pet Event Platform</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6 text-center">
              Black Version
            </h3>
            <div className="bg-black p-10 flex flex-col items-center space-y-4">
              <div className="w-32 h-32 bg-gray-600 flex items-center justify-center text-white">
                PUPOO LOGO
              </div>
              <p className="font-bold text-white">2026</p>
              <p className="font-bold text-white">Pupoo Pet Event Platform</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
