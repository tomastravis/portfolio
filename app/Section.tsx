import React from "react";

export default function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg p-6 bg-gradient-to-b from-black/20 to-transparent border border-zinc-800/30">
      <h3 className="font-semibold text-zinc-100 text-xl">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}
