
import React from "react";
import TopNav from "./TopNav";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <main className="mx-auto max-w-6xl px-6 py-10">
        {children}
      </main>
    </div>
  );
}
