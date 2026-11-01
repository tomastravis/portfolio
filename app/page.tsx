"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CanonicalIntent } from "./assistant";
import { acceptNarration, ConversationReply, resolveConversation } from "./conversation";
import { profile } from "./profile";

type Turn = { id: number; question: string; reply: ConversationReply; status: "pending" | "ready" | "failed" | "cancelled"; message?: string };
type Recognition = {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void; stop: () => void; abort: () => void;
};

function Icon({ name }: { name: "arrow" | "mic" | "sound" | "stop" }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "arrow" && <path d="M12 19V5m-6 6 6-6 6 6" />}
    {name === "mic" && <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-3 0h6" /></>}
    {name === "sound" && <><path d="m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>}
    {name === "stop" && <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />}
  </svg>;
}

function Mercury({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => ref.current?.classList.toggle("is-visible", entry.isIntersecting));
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`mercury ${active ? "mercury-active" : ""}`} aria-hidden="true">
    <svg viewBox="0 0 620 280" fill="none">
      <defs>
        <linearGradient id="metal" x1="145" y1="40" x2="425" y2="250" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fcfdff" /><stop offset=".17" stopColor="#ced9e8" /><stop offset=".3" stopColor="#556b89" /><stop offset=".37" stopColor="#eff7ff" /><stop offset=".46" stopColor="#fafcff" /><stop offset=".5" stopColor="#95aecb" /><stop offset=".56" stopColor="#293d5e" /><stop offset=".65" stopColor="#97b7df" /><stop offset=".78" stopColor="#e6f1fe" /><stop offset=".87" stopColor="#6e8cae" /><stop offset="1" stopColor="#ecf4ff" />
        </linearGradient>
        <linearGradient id="edge" x1="200" y1="190" x2="460" y2="90" gradientUnits="userSpaceOnUse"><stop stopColor="#708baa" /><stop offset=".4" stopColor="#e7f1ff" /><stop offset=".63" stopColor="#304c76" /><stop offset="1" stopColor="#a5c5e9" /></linearGradient>
        <radialGradient id="shadow"><stop stopColor="#738fb2" stopOpacity=".2" /><stop offset="1" stopColor="#738fb2" stopOpacity="0" /></radialGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="8" /></filter>
      </defs>
      <ellipse cx="310" cy="244" rx="170" ry="17" fill="url(#shadow)" filter="url(#soft)" />
      <g className="ribbon-float">
        <path className="ribbon-body" d="M180 64C245 10 413 40 428 104C449 190 165 99 176 182C186 243 328 248 403 197" stroke="#f7fbff" strokeWidth="47" strokeLinecap="round" />
        <path className="ribbon-body" d="M180 64C245 10 413 40 428 104C449 190 165 99 176 182C186 243 328 248 403 197" stroke="url(#metal)" strokeWidth="45" strokeLinecap="round" />
        <path d="M187 76C248 24 399 53 415 107C432 167 157 109 164 179" stroke="url(#edge)" strokeWidth="5" strokeLinecap="round" />
        <path d="M190 50C255 8 397 35 422 85M182 188C205 235 318 238 387 200" stroke="white" strokeOpacity=".75" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  </div>;
}

function Evidence({ intent, ask, research }: { intent: CanonicalIntent; ask: (question: string) => void; research?: boolean }) {
  if (intent === "experience") return <ol className="timeline">{[...profile.experience].filter(role => !research || role.role === "Deep Learning Research Assistant").sort((a, b) => (b.end === "Present" ? Infinity : Date.parse(b.end)) - (a.end === "Present" ? Infinity : Date.parse(a.end))).map(role => <li key={role.role}><span className="timeline-dot" /><div className="fact-date">{role.start} — {role.end}</div><h3>{role.role}</h3><p className="fact-subtitle">{role.company}</p><details open={research || undefined}><summary>Explore this role</summary><ul className="highlights">{role.highlights.map(item => <li key={item}>{item}</li>)}</ul></details></li>)}</ol>;
  if (intent === "education") return <ol className="timeline">{profile.education.map(item => <li key={item.degree}><span className="timeline-dot" /><div className="fact-date">{"range" in item ? item.range : `${item.start} — ${item.completed}`}</div><h3>{item.degree}</h3><p className="fact-subtitle">{item.institution}</p></li>)}</ol>;
  if (intent === "skills") return <div className="skill-map">{profile.skills.map(group => <section key={group.category}><h3>{group.category}</h3><div className="tags">{group.items.map(item => <button key={item} onClick={() => ask(`Tell me about ${item}`)}>{item}</button>)}</div></section>)}</div>;
  if (intent === "languages") return <dl className="language-list">{profile.languages.map(item => <div key={item.language}><dt>{item.language}</dt><dd>{item.level}</dd></div>)}</dl>;
  if (intent === "projects") return <p className="empty-fact">Project details haven’t been added to this profile yet. <a href={`mailto:${profile.contact.email}`}>Ask Tomas about his work.</a></p>;
  if (intent === "promotion") return <p className="empty-fact">The profile records a planned move from {profile.promotion.currentRole} to {profile.promotion.newRole} at {profile.promotion.company}, effective {profile.promotion.effective}. Confirmation of the change hasn’t been added.</p>;
  return <p className="empty-fact">I can show you the experience, skills, education and languages recorded in Tomas’s profile. Try asking about one of those.</p>;
}

function AnswerVisual({ reply, ask }: { reply: ConversationReply; ask: (question: string) => void }) {
  if (reply.view.type === "clarification" || reply.view.type === "conversation") return null;
  if (reply.view.type === "profile") return <Evidence intent={reply.intent} ask={ask} research={reply.view.focus === "research"} />;
  return <div className={`technology-evidence ${reply.view.type === "comparison" ? "comparison-evidence" : ""}`}>
    {reply.view.technologies.map(technology => <section key={technology.name} className="technology-detail">
      <div className="technology-header"><h3>{technology.name}</h3><span className="recorded-label">Listed in profile</span></div>
      <p className="technology-category">{technology.category}</p>
      <div className="evidence-row"><span>What the profile confirms</span><strong>{technology.evidence.length ? "Skill + work evidence" : "Listed skill"}</strong></div>
      {technology.evidence.map((evidence, index) => <blockquote key={index}><p>{evidence.detail}</p><cite>{evidence.role} · {evidence.company}<br />{evidence.dates}</cite></blockquote>)}
      <details className="source-disclosure"><summary>View source</summary><p>{technology.source}</p><p>Only explicit mentions in role descriptions are linked here. A listed skill alone doesn’t establish proficiency or a project outcome.</p></details>
    </section>)}
  </div>;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);
  const [listening, setListening] = useState(false);
  const [spoken, setSpoken] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [notice, setNotice] = useState("");
  const [motionPaused, setMotionPaused] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef<HTMLElement>(null);
  const request = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const spokenEnabled = useRef(false);

  useEffect(() => () => { recognition.current?.abort(); request.current?.abort(); window.speechSynthesis?.cancel(); }, []);

  function speak(text: string) {
    if (!("speechSynthesis" in window)) { setNotice("Spoken replies aren’t available in this browser. You can read every answer here."); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US"; utterance.rate = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => { setSpeaking(false); setNotice("Audio playback stopped. The full answer is available on screen."); };
    window.speechSynthesis.speak(utterance);
  }

  function toggleVoice() {
    if (listening) { recognition.current?.stop(); return; }
    const browser = window as typeof window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Constructor) { setNotice("Voice input isn’t available in this browser. Try your phone keyboard’s dictation button, or type below."); input.current?.focus(); return; }
    window.speechSynthesis?.cancel(); setSpeaking(false);
    const session = new Constructor();
    session.lang = "en-US"; session.interimResults = false; session.continuous = false;
    session.onresult = event => { setQuery(event.results[0][0].transcript.slice(0, 240)); input.current?.focus(); };
    session.onerror = event => { setListening(false); setNotice(event.error === "not-allowed" ? "Microphone access wasn’t allowed. You can enable it in browser settings or keep typing." : "I couldn’t capture that. Please try again or type your question."); };
    session.onend = () => setListening(false);
    recognition.current = session;
    setNotice("Your browser may use its speech service to transcribe audio. Review the text before sending.");
    try { session.start(); setListening(true); } catch { setListening(false); setNotice("Voice input couldn’t start. Please type your question instead."); }
  }

  async function ask(question: string, retryId?: number) {
    const clean = question.trim();
    if (!clean || busy.current || clean.length > 240) return;
    busy.current = true; setPending(true); setQuery(""); setNotice("");
    recognition.current?.abort(); setListening(false);
    window.speechSynthesis?.cancel(); setSpeaking(false);
    const history = turns.filter(turn => turn.id !== retryId && turn.status === "ready").slice(-6).map(turn => turn.question);
    const plan = resolveConversation(clean, history);
    const id = retryId ?? (turns.at(-1)?.id ?? 0) + 1;
    const turn: Turn = { id, question: clean, reply: plan, status: "pending" };
    setTurns(previous => retryId ? previous.map(item => item.id === retryId ? turn : item) : [...previous, turn]);
    const controller = new AbortController(); request.current = controller;
    const timer = setTimeout(() => controller.abort(), 18000);
    const update = (changes: Partial<Turn>) => setTurns(previous => previous.map(item => item.id === id ? { ...item, ...changes } : item));
    // Keep the reading position steady as evidence arrives. Only move to the
    // visitor's submitted question, once, if it isn't already on screen.
    requestAnimationFrame(() => {
      const element = document.getElementById(`turn-${id}`);
      if (element && element.getBoundingClientRect().top > window.innerHeight - 170) element.scrollIntoView({ behavior: "instant", block: "start" });
    });
    let answer = plan.answer;
    try {
      const response = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: clean, history }), signal: controller.signal });
      if (!response.ok || !response.body) throw new Error(response.status === 429 ? "Too many questions. Please wait a moment and retry." : "The assistant service couldn’t connect. You can still explore the saved profile evidence.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", complete = false;
      while (true) {
        const chunk = await reader.read();
        buffer += decoder.decode(chunk.value, { stream: !chunk.done });
        const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === "reply" && event.reply?.version === 1) update({ reply: plan });
          if (event.type === "done") {
            const narration = acceptNarration(event, plan);
            if (!narration) throw new Error("The assistant returned an unexpected answer. The saved facts are shown instead.");
            answer = narration; complete = true;
            update({ reply: { ...plan, answer }, status: "ready", message: event.mode === "fallback" ? "The AI service is unavailable; this answer uses the saved profile." : undefined });
          }
        }
        if (chunk.done) break;
      }
      if (!complete) throw new Error("The response was interrupted. The saved profile is available below.");
      if (spokenEnabled.current) speak(answer);
    } catch (error) {
      const cancelled = controller.signal.reason === "user";
      update({ status: cancelled ? "cancelled" : "failed", message: cancelled ? "Stopped. Your question and its matching profile evidence are kept here." : error instanceof TypeError ? "The assistant service couldn’t connect. You can still explore the saved profile evidence." : error instanceof SyntaxError ? "The response was interrupted. The saved profile is available below." : error instanceof Error && error.name !== "AbortError" ? error.message : "The response took too long. Here’s the matching saved profile evidence." });
    }
    finally { clearTimeout(timer); busy.current = false; setPending(false); }
  }

  function submit(event: FormEvent) { event.preventDefault(); void ask(query); }

  return <div className={`portfolio ${turns.length ? "has-conversation" : ""} ${motionPaused ? "motion-paused" : ""}`}>
    <header className="site-header"><Link href="/" className="wordmark" aria-label="Tomas Travis home"><span className="monogram">t.</span><span>Tomas Travis</span></Link><a className="contact-link" href={`mailto:${profile.contact.email}`}>Get in touch <span><Icon name="arrow" /></span></a></header>
    <main>
      <section className="intro" aria-labelledby="intro-title">
        <Mercury active={listening || pending || speaking} />
        <div className="intro-copy"><p className="intro-kicker">A different way to get to know me</p><h1 id="intro-title">Tomas Travis <span>AI</span></h1><p className="intro-description">A conversation, not a résumé.<br />Ask about my work. See the story take shape.</p></div>
        {!turns.length && <div className="suggestions" aria-label="Suggested questions">{[{ label: "My experience", question: "Show me your experience" }, { label: "What I work with", question: "What technologies do you use?" }, { label: "My education", question: "What did you study?" }].map(item => <button key={item.label} disabled={pending || listening} onClick={() => void ask(item.question)}>{item.label}<span><Icon name="arrow" /></span></button>)}</div>}
      </section>
      <p className="sr-only" role="status">{turns.length ? `${pending ? "Preparing" : "Updated"} answer ${turns.length}: ${turns[turns.length - 1].reply.title}.` : ""}</p>
      <div className="conversation" aria-label="Conversation with Tomas Travis AI" aria-busy={pending}>
        {turns.map((turn, index) => <section id={`turn-${turn.id}`} key={turn.id} ref={index === turns.length - 1 ? latest : undefined} className={`answer-section ${turn.reply.view.type === "conversation" ? "conversational-answer" : ""}`} aria-label={`Answer to ${turn.question}`}>
          <div className="question-bubble">{turn.question}</div>
          <div className="answer-heading"><span className="answer-mark" aria-hidden="true">t.</span><span>Tomas Travis AI</span>{turn.reply.view.type !== "conversation" && <span className="source-note">From my profile</span>}</div>
          {turn.message && <p className="fallback-note" role="status">{turn.message}</p>}
          {turn.reply.view.type !== "conversation" && <h2>{turn.reply.title}</h2>}
          <p className="answer-prose">{turn.reply.answer}</p>
          <AnswerVisual reply={turn.reply} ask={question => { if (!pending && !listening) void ask(question); }} />
          {turn.reply.suggestContact && <a className="answer-contact" href={`mailto:${profile.contact.email}`}>Ask Tomas directly <Icon name="arrow" /></a>}
          {(turn.status === "failed" || turn.status === "cancelled") && <button className="retry-button" disabled={pending} onClick={() => void ask(turn.question, turn.id)}>Retry this question</button>}
          {index === turns.length - 1 && <div className="followups" aria-label="Continue the conversation">{turn.reply.followups.map(question => <button key={question} disabled={pending || listening} onClick={() => void ask(question)}>{question}<span aria-hidden="true"> →</span></button>)}</div>}
        </section>)}
        {pending && <p role="status" className="thinking"><span />Checking the profile… <button onClick={() => request.current?.abort("user")}>Stop response</button></p>}
      </div>
      <div className="composer-dock">
        <form className={`composer ${listening ? "is-listening" : ""}`} onSubmit={submit}>
          <label className="sr-only" htmlFor="question">Ask about Tomas</label>
          <input id="question" ref={input} value={query} onChange={event => setQuery(event.target.value)} placeholder={listening ? "Listening…" : "What would you like to know?"} maxLength={240} autoComplete="off" disabled={pending} />
          <button type="button" className="icon-button mic-button" onClick={toggleVoice} disabled={pending} aria-label={listening ? "Stop recording" : "Dictate a question"} aria-pressed={listening}><Icon name={listening ? "stop" : "mic"} /></button>
          <button type="submit" className="send-button" aria-label="Send question" disabled={!query.trim() || pending || listening}><Icon name="arrow" /></button>
        </form>
        <div className="composer-meta"><span>{listening ? "Listening · tap stop to finish" : "Your questions. My experience."}</span><button type="button" aria-pressed={spoken} onClick={() => { if (spoken) { window.speechSynthesis?.cancel(); setSpeaking(false); } spokenEnabled.current = !spoken; setSpoken(!spoken); }}><Icon name="sound" />Spoken replies {spoken ? "on" : "off"}</button></div>
        {speaking && <button className="stop-speaking" onClick={() => { window.speechSynthesis?.cancel(); setSpeaking(false); }}>Stop speaking</button>}
        <p className="voice-notice" role="status">{notice}</p>
      </div>
    </main>
    <footer className="site-footer"><span>Data engineering. AI. Software.</span><button type="button" aria-pressed={motionPaused} onClick={() => setMotionPaused(!motionPaused)}>{motionPaused ? "Resume visual" : "Pause visual"}</button><span>Built around a conversation.</span></footer>
  </div>;
}
