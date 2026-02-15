
import React from "react";

export default function TopNav() {
  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 py-4 flex justify-between items-center">
        <div className="font-semibold">애견 행사 통합 운영 플랫폼</div>
        <nav className="hidden md:flex gap-6 text-sm text-slate-600">
          <a href="#s1">01</a>
          <a href="#s2">02</a>
          <a href="#s3">03</a>
          <a href="#s4">04</a>
          <a href="#s5">05</a>
        </nav>
      </div>
    </header>
  );
}
