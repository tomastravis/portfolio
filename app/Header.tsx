"use client";

import React from "react";

type Props = {
  onOpenAssistant?: () => void;
};

export default function Header({ onOpenAssistant }: Props) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-sm bg-black/30 border-b border-zinc-800/40">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="#" className="font-semibold text-xl text-zinc-50">Tom Travis</a>
          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-300">
            <a href="#about" className="hover:text-zinc-100">About</a>
            <a href="#experience" className="hover:text-zinc-100">Experience</a>
            <a href="#projects" className="hover:text-zinc-100">Projects</a>
            <a href="#contact" className="hover:text-zinc-100">Contact</a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAssistant}
            className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/12 transition"
          >
            Talk to my AI
          </button>
        </div>
      </div>
    </header>
  );
}
