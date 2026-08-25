"use client";

import React from "react";

type ProfileShape = {
  name: string;
  role: string;
  intro: string;
};

export default function Hero({ onOpenAssistant, profile }: { onOpenAssistant?: () => void; profile: ProfileShape }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-animated p-8">
      <div className="absolute inset-0 opacity-40" aria-hidden>
        <div className="pointer-events-none h-full w-full bg-gradient-to-br from-transparent to-black/40" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-start gap-6">
        <p className="text-sm text-emerald-300/80 uppercase tracking-wide">Data Engineering • AI • Software Engineering</p>
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">Tom Travis</h1>
        <p className="text-zinc-300 max-w-2xl text-lg">{profile.intro}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#projects" className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-5 py-3 text-sm text-emerald-300 hover:bg-emerald-500/14 transition">Explore my work</a>
          <button onClick={onOpenAssistant} className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-5 py-3 text-sm text-zinc-200 hover:bg-white/2 transition">Talk to my AI</button>
        </div>
      </div>

      <div className="absolute right-6 top-6 opacity-40 blur-[26px] w-56 h-56 rounded-full bg-gradient-to-tr from-emerald-400 to-indigo-500/80" />
    </section>
  );
}
