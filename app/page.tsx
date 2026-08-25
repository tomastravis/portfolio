"use client";

import { FormEvent, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { CanonicalIntent, resolveIntentByCanonical, resolveProfileIntent } from "./assistant";
import { profile } from "./profile";

export default function Home() {
  const [query, setQuery] = useState("experience");
  const [activeResponse, setActiveResponse] = useState(() => resolveProfileIntent("experience"));

  const headline = profile.headline.join(" · ");
  const reduceMotion = useReducedMotion();
  // Use motion components from motion/react. No framer-motion typing workaround needed.
  const MDiv = motion.div;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextQuery = query.trim() || "experience";

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: nextQuery }),
      });

      if (!response.ok) {
        throw new Error("Assistant request failed");
      }

      const payload: { intent?: CanonicalIntent } = await response.json();
      const canonicalIntent = payload.intent ?? "unknown";
      setActiveResponse(resolveIntentByCanonical(canonicalIntent));
    } catch {
      setActiveResponse(resolveProfileIntent(nextQuery));
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#05070b] text-zinc-100 antialiased selection:bg-emerald-500/30 selection:text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(76,120,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),transparent_28%)]" aria-hidden="true" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 pb-6 pt-6 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-900/80 text-sm font-medium text-zinc-100">
            T
          </div>
          <div className="text-sm font-medium tracking-[0.24em] text-zinc-300 uppercase">
            {profile.name}
          </div>
        </div>

        <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
          <a href="#" className="transition hover:text-zinc-100">About</a>
          <a href="#" className="transition hover:text-zinc-100">Experience</a>
          <a href="#" className="transition hover:text-zinc-100">Projects</a>
          <a href="#" className="transition hover:text-zinc-100">Contact</a>
        </nav>

        <button className="inline-flex items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/60 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800/80">
          Explore work
        </button>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-100px)] max-w-6xl items-center gap-10 px-5 pb-12 pt-4 md:grid-cols-[1.1fr_0.9fr] md:px-8 lg:gap-16">
        <section className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-emerald-300">
            {headline}
          </div>

          <h1 className="mt-6 text-5xl font-medium tracking-[-0.08em] text-white sm:text-6xl md:text-7xl xl:text-[7rem]">
            {profile.name}
          </h1>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-emerald-300">
              Explore work
            </button>
            <button className="inline-flex items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/60 px-5 py-3 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900/80">
              Talk to my AI
            </button>
          </div>

          <div className="mt-10 max-w-xl overflow-hidden rounded-[1.6rem] border border-zinc-800/80 bg-zinc-950/70 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_32px_80px_rgba(2,6,23,0.65)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Assistant</span>
            </div>

            <form onSubmit={handleSubmit} className="px-4 pb-4 pt-4">
              <label htmlFor="ask-tom" className="sr-only">
                What would you like to know about Tom?
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-zinc-700/80 bg-zinc-900/80 px-3 py-3 shadow-inner shadow-black/20">
                <span className="text-sm text-zinc-400">Ask</span>
                <input
                  id="ask-tom"
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="What would you like to know about Tom?"
                  aria-label="Ask about Tom"
                  className="w-full bg-transparent text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
                />
              </div>
              <button type="submit" className="sr-only">
                Submit
              </button>
            </form>
          </div>
        </section>

        <aside className="relative flex justify-center md:justify-end">
          <div className="absolute right-10 top-8 h-52 w-52 rounded-full bg-emerald-400/12 blur-3xl" aria-hidden="true" />
          <div className="absolute left-0 bottom-10 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" aria-hidden="true" />

          <MDiv
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-zinc-800/80 bg-[linear-gradient(180deg,rgba(10,14,20,0.95),rgba(6,9,12,0.82))] p-5 shadow-[0_40px_100px_rgba(2,6,23,0.75)]"
            layout
            transition={reduceMotion ? { duration: 0 } : { layout: { type: "spring", stiffness: 320, damping: 34 } }}
          >
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              <span>System</span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-300">
                Ready
              </span>
            </div>

            <AnimatePresence mode="wait">
              <MDiv
                key={activeResponse.title}
                initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                animate={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.2, 0.9, 0.1, 1] }}
                className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4"
                layout
              >
                <div className="mb-3 text-[10px] uppercase tracking-[0.2em] text-zinc-500">Context</div>
                <div className="mb-3 text-sm font-medium text-zinc-200">{activeResponse.title}</div>
                <div className="mb-3 text-xs uppercase tracking-[0.16em] text-zinc-400">{activeResponse.description}</div>

                <MDiv
                  className="space-y-3"
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  variants={{
                    hidden: {},
                    show: {},
                  }}
                >
                  {activeResponse.items.length > 0 ? (
                    <MDiv
                      className="space-y-3"
                      variants={{
                        hidden: { transition: { staggerChildren: reduceMotion ? 0 : 0 } },
                        show: { transition: { staggerChildren: reduceMotion ? 0 : 0.06 } },
                      }}
                    >
                      {activeResponse.items.map((item, idx) => (
                        <MDiv
                          key={`${activeResponse.title}-${item}`}
                          className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-200"
                          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                          animate={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                          exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
                          transition={reduceMotion ? { duration: 0 } : { duration: 0.22 }}
                        >
                          <span className="pr-4">{item}</span>
                          <span className="text-zinc-500">{String(idx + 1).padStart(2, "0")}</span>
                        </MDiv>
                      ))}
                    </MDiv>
                  ) : (
                    <MDiv className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-200" initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }} animate={{ opacity: 1 }} transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}>
                      No structured entries available.
                    </MDiv>
                  )}
                </MDiv>
              </MDiv>
            </AnimatePresence>

            <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
              <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">Signal</div>
              <div className="flex items-end gap-2 pt-2">
                {[35, 52, 44, 69, 58, 76, 66].map((height, index) => (
                  <span
                    key={height}
                    className="w-full rounded-t-md bg-gradient-to-t from-emerald-400/75 via-emerald-300/70 to-cyan-300/80"
                    style={{ height: `${height}px`, opacity: 1 - index * 0.08 }}
                  />
                ))}
              </div>
            </div>
          </MDiv>
        </aside>
      </main>
    </div>
  );
}
