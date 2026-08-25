"use client";

import React, { useEffect, useRef } from "react";

export default function AIAssistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div ref={ref} className="ai-drawer relative w-full sm:max-w-2xl mx-4 sm:mx-0 rounded-t-2xl sm:rounded-2xl bg-gradient-to-br from-[#0b0b0f]/80 to-[#071017]/80 border border-zinc-800/50 p-4 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-zinc-100">Tom AI Assistant</div>
            <div className="text-xs text-zinc-400">Ask about projects, experience, or say hello.</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-sm px-3 py-1 rounded-md bg-white/3 text-zinc-200">Close</button>
          </div>
        </div>

        <div className="mt-4 h-56 overflow-auto rounded-md border border-zinc-800/40 bg-black/40 p-4">
          {/* Placeholder conversation */}
          <div className="space-y-3">
            <div className="text-sm text-zinc-300">Hi — this is a demo assistant that can answer questions about Tom, including background, projects, and skills.</div>
            <div className="text-sm text-zinc-200">Try asking to show the most recent project or inquire about experience with data pipelines.</div>
          </div>
        </div>

        <form className="mt-4 flex gap-3" onSubmit={(e) => { e.preventDefault(); /* future: send to AI */ }}>
          <input aria-label="Ask the assistant a question" placeholder="Ask a question..." className="flex-1 rounded-md bg-black/60 border border-zinc-800/50 px-3 py-2 text-sm text-zinc-200" />
          <button type="submit" className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-black">Send</button>
        </form>

        <div className="mt-3 text-xs text-zinc-500">This assistant is a visual prototype — no external AI calls yet.</div>
      </div>
    </div>
  );
}
