"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CanonicalIntent } from "./assistant";
import { acceptNarration, ConversationReply, resolveConversation } from "./conversation";
import { profile } from "./profile";
import { Language, profileText, speechLanguage, ui } from "./i18n";

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

function Evidence({ intent, ask, research, language }: { intent: CanonicalIntent; ask: (question: string) => void; research?: boolean; language: Language }) {
  const t = ui[language];
  if (intent === "experience") return <ol className="timeline">{[...profile.experience].filter(role => !research || role.role === "Deep Learning Research Assistant").sort((a, b) => (b.end === "Present" ? Infinity : Date.parse(b.end)) - (a.end === "Present" ? Infinity : Date.parse(a.end))).map(role => <li key={role.role}><span className="timeline-dot" /><div className="fact-date">{profileText(`${role.start} — ${role.end}`, language)}</div><h3 lang="en">{role.role}</h3><p className="fact-subtitle">{role.company}</p><details open={research || undefined}><summary>{t.role}</summary><ul className="highlights">{role.highlights.map(item => <li key={item}>{profileText(item, language)}</li>)}</ul></details></li>)}</ol>;
  if (intent === "education") return <ol className="timeline">{profile.education.map(item => <li key={item.degree}><span className="timeline-dot" /><div className="fact-date">{profileText("range" in item ? item.range : `${item.start} — ${item.completed}`, language)}</div><h3 lang={item.degree === "Erasmus" ? undefined : "en"}>{item.degree}</h3><p className="fact-subtitle">{item.institution}</p></li>)}</ol>;
  if (intent === "skills") return <div className="skill-map">{profile.skills.map(group => <section key={group.category}><h3>{profileText(group.category, language)}</h3><div className="tags">{group.items.map(item => <button key={item} onClick={() => ask(language === "es" ? `Háblame de ${item}` : `Tell me about ${item}`)}>{item}</button>)}</div></section>)}</div>;
  if (intent === "languages") return <dl className="language-list">{profile.languages.map(item => <div key={item.language}><dt>{profileText(item.language, language)}</dt><dd>{profileText(item.level, language)}</dd></div>)}</dl>;
  if (intent === "projects") return <p className="empty-fact">{t.noProjects} <a href={`mailto:${profile.contact.email}`}>{t.askWork}</a></p>;
  if (intent === "promotion") return <p className="empty-fact">{t.planned}</p>;
  return <p className="empty-fact">{t.empty}</p>;
}

function AnswerVisual({ reply, ask }: { reply: ConversationReply; ask: (question: string) => void }) {
  const t = ui[reply.language];
  if (reply.view.type === "clarification" || reply.view.type === "conversation") return null;
  if (reply.view.type === "profile") return <Evidence intent={reply.intent} ask={ask} research={reply.view.focus === "research"} language={reply.language} />;
  return <div className={`technology-evidence ${reply.view.type === "comparison" ? "comparison-evidence" : ""}`}>
    {reply.view.technologies.map(technology => <section key={technology.name} className="technology-detail">
      <div className="technology-header"><h3>{technology.name}</h3><span className="recorded-label">{t.listed}</span></div>
      <p className="technology-category">{profileText(technology.category, reply.language)}</p>
      <div className="evidence-row"><span>{t.confirms}</span><strong>{technology.evidence.length ? t.evidence : t.listedSkill}</strong></div>
      {technology.evidence.map((evidence, index) => <blockquote key={index}><p>{profileText(evidence.detail, reply.language)}</p><cite><span lang="en">{evidence.role}</span> · {evidence.company}<br />{profileText(evidence.dates, reply.language)}</cite></blockquote>)}
      <details className="source-disclosure"><summary>{t.viewSource}</summary><p>{profileText(technology.source, reply.language)}</p><p>{t.sourceCaveat}</p></details>
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
  const [language, setLanguage] = useState<Language>("en");
  const t = ui[language];
  const recognition = useRef<Recognition | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef<HTMLElement>(null);
  const request = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const spokenEnabled = useRef(false);

  useEffect(() => () => { recognition.current?.abort(); request.current?.abort(); window.speechSynthesis?.cancel(); }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);

  function changeLanguage(next: Language) {
    recognition.current?.abort(); window.speechSynthesis?.cancel();
    setListening(false); setSpeaking(false); setNotice(""); setLanguage(next);
  }

  function speak(text: string, spokenLanguage: Language) {
    const messages = ui[spokenLanguage];
    if (!("speechSynthesis" in window)) { setNotice(messages.noSpeech); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLanguage[spokenLanguage]; utterance.rate = 1;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(item => item.lang === utterance.lang) ?? voices.find(item => item.lang.toLowerCase().startsWith(spokenLanguage));
    if (voice) utterance.voice = voice;
    else if (voices.length) { setNotice(messages.noVoice); return; }
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = event => { setSpeaking(false); if (!["canceled", "interrupted"].includes(event.error)) setNotice(messages.audioStopped); };
    window.speechSynthesis.speak(utterance);
  }

  function toggleVoice() {
    if (listening) { recognition.current?.stop(); return; }
    const browser = window as typeof window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Constructor) { setNotice(t.noRecognition); input.current?.focus(); return; }
    window.speechSynthesis?.cancel(); setSpeaking(false);
    const session = new Constructor();
    session.lang = speechLanguage[language]; session.interimResults = false; session.continuous = false;
    session.onresult = event => { setQuery(event.results[0][0].transcript.slice(0, 240)); input.current?.focus(); };
    session.onerror = event => { setListening(false); if (event.error !== "aborted") setNotice(event.error === "not-allowed" ? t.permission : t.capture); };
    session.onend = () => setListening(false);
    recognition.current = session;
    setNotice(t.privacy);
    try { session.start(); setListening(true); } catch { setListening(false); setNotice(t.startVoice); }
  }

  async function ask(question: string, retryId?: number) {
    const clean = question.trim();
    if (!clean || busy.current || clean.length > 240) return;
    busy.current = true; setPending(true); setQuery(""); setNotice("");
    recognition.current?.abort(); setListening(false);
    window.speechSynthesis?.cancel(); setSpeaking(false);
    const history = turns.filter(turn => turn.id !== retryId && turn.status === "ready").slice(-6).map(turn => turn.question);
    const plan = resolveConversation(clean, history, language);
    const messages = ui[plan.language];
    setLanguage(plan.language);
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
      const response = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json", "Accept-Language": plan.language }, body: JSON.stringify({ question: clean, history, language: plan.language }), signal: controller.signal });
      if (!response.ok || !response.body) throw new Error(response.status === 429 ? messages.rateLimit : messages.connection);
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
            if (!narration) throw new Error(messages.unexpected);
            answer = narration; complete = true;
            update({ reply: { ...plan, answer }, status: "ready", message: event.mode === "fallback" ? messages.aiUnavailable : undefined });
          }
        }
        if (chunk.done) break;
      }
      if (!complete) throw new Error(messages.interrupted);
      if (spokenEnabled.current) speak(answer, plan.language);
    } catch (error) {
      const cancelled = controller.signal.reason === "user";
      update({ status: cancelled ? "cancelled" : "failed", message: cancelled ? messages.stopped : error instanceof TypeError ? messages.connection : error instanceof SyntaxError ? messages.interrupted : error instanceof Error && error.name !== "AbortError" ? error.message : messages.timeout });
    }
    finally { clearTimeout(timer); busy.current = false; setPending(false); }
  }

  function submit(event: FormEvent) { event.preventDefault(); void ask(query); }

  return <div className={`portfolio ${turns.length ? "has-conversation" : ""} ${motionPaused ? "motion-paused" : ""}`}>
    <header className="site-header"><Link href="/" className="wordmark" aria-label={t.home}><span className="monogram">t.</span><span>Tomas Travis</span></Link><div className="header-actions"><label className="sr-only" htmlFor="language">{t.language}</label><select id="language" value={language} disabled={pending} onChange={event => changeLanguage(event.target.value as Language)}><option value="en" lang="en">English</option><option value="es" lang="es">Español</option></select><a className="contact-link" href={`mailto:${profile.contact.email}`}>{t.contact} <span><Icon name="arrow" /></span></a></div></header>
    <main>
      <section className="intro" aria-labelledby="intro-title">
        <Mercury active={listening || pending || speaking} />
        <div className="intro-copy"><p className="intro-kicker">{t.kicker}</p><h1 id="intro-title">Tomas Travis <span>{language === "es" ? "IA" : "AI"}</span></h1><p className="intro-description">{t.intro}<br />{t.introMore}</p></div>
        {!turns.length && <div className="suggestions" aria-label={t.suggested}>{[{ label: t.experience, question: t.askExperience }, { label: t.skills, question: t.askSkills }, { label: t.education, question: t.askEducation }].map(item => <button key={item.label} disabled={pending || listening} onClick={() => void ask(item.question)}>{item.label}<span><Icon name="arrow" /></span></button>)}</div>}
      </section>
      <p className="sr-only" role="status">{turns.length ? `${pending ? t.preparing : t.updated}: ${t.answer} ${turns.length}, ${turns[turns.length - 1].reply.title}.` : ""}</p>
      <div className="conversation" aria-label={t.conversation} aria-busy={pending}>
        {turns.map((turn, index) => { const tt = ui[turn.reply.language]; return <section lang={turn.reply.language} id={`turn-${turn.id}`} key={turn.id} ref={index === turns.length - 1 ? latest : undefined} className={`answer-section ${turn.reply.view.type === "conversation" ? "conversational-answer" : ""}`} aria-label={`${tt.answer}: ${turn.question}`}>
          <div className="question-bubble">{turn.question}</div>
          <div className="answer-heading"><span className="answer-mark" aria-hidden="true">t.</span><span>Tomas Travis {turn.reply.language === "es" ? "IA" : "AI"}</span>{turn.reply.view.type !== "conversation" && <span className="source-note">{tt.source}</span>}</div>
          {turn.message && <p className="fallback-note" role="status">{turn.message}</p>}
          {turn.reply.view.type !== "conversation" && <h2>{turn.reply.title}</h2>}
          <p className="answer-prose">{turn.reply.answer}</p>
          <AnswerVisual reply={turn.reply} ask={question => { if (!pending && !listening) void ask(question); }} />
          {turn.reply.suggestContact && <a className="answer-contact" href={`mailto:${profile.contact.email}`}>{tt.direct} <Icon name="arrow" /></a>}
          {(turn.status === "failed" || turn.status === "cancelled") && <button className="retry-button" disabled={pending} onClick={() => void ask(turn.question, turn.id)}>{tt.retry}</button>}
          {index === turns.length - 1 && <div className="followups" aria-label={tt.followups}>{turn.reply.followups.map(question => <button key={question} disabled={pending || listening} onClick={() => void ask(question)}>{question}<span aria-hidden="true"> →</span></button>)}</div>}
        </section>; })}
        {pending && <p role="status" className="thinking"><span />{t.checking} <button onClick={() => request.current?.abort("user")}>{t.stopResponse}</button></p>}
      </div>
      <div className="composer-dock">
        <form className={`composer ${listening ? "is-listening" : ""}`} onSubmit={submit}>
          <label className="sr-only" htmlFor="question">{t.ask}</label>
          <input id="question" ref={input} value={query} onChange={event => setQuery(event.target.value)} placeholder={listening ? t.listening : t.placeholder} maxLength={240} autoComplete="off" disabled={pending} />
          <button type="button" className="icon-button mic-button" onClick={toggleVoice} disabled={pending} aria-label={listening ? t.stopRecording : t.dictate} aria-pressed={listening}><Icon name={listening ? "stop" : "mic"} /></button>
          <button type="submit" className="send-button" aria-label={t.send} disabled={!query.trim() || pending || listening}><Icon name="arrow" /></button>
        </form>
        <div className="composer-meta"><span>{listening ? t.listeningHint : t.tagline}</span><button type="button" aria-pressed={spoken} onClick={() => { if (spoken) { window.speechSynthesis?.cancel(); setSpeaking(false); } spokenEnabled.current = !spoken; setSpoken(!spoken); }}><Icon name="sound" />{t.spoken} {spoken ? t.on : t.off}</button></div>
        {speaking && <button className="stop-speaking" onClick={() => { window.speechSynthesis?.cancel(); setSpeaking(false); }}>{t.stopSpeaking}</button>}
        <p className="voice-notice" role="status">{notice}</p>
      </div>
    </main>
    <footer className="site-footer"><span>{t.footer}</span><button type="button" aria-pressed={motionPaused} onClick={() => setMotionPaused(!motionPaused)}>{motionPaused ? t.resume : t.pause}</button><span>{t.built}</span></footer>
  </div>;
}
