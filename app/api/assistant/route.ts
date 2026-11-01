import { NextResponse } from "next/server";
import { acceptNarration, narrationContext, readHistory, resolveConversation } from "@/app/conversation";
import { ui } from "@/app/i18n";

const requests = new Map<string, { count: number; start: number }>();

export async function POST(request: Request) {
  const now = Date.now();
  for (const [key, entry] of requests) if (now - entry.start > 60_000) requests.delete(key);
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const entry = requests.get(key) ?? { count: 0, start: now };
  const requestLanguage = request.headers.get("accept-language")?.startsWith("es") ? "es" : "en";
  if (entry.count >= 20) return NextResponse.json({ error: ui[requestLanguage].rateLimit }, { status: 429 });
  entry.count++; requests.set(key, entry);
  const body = await request.json().catch(() => null);
  if (!body || typeof body.question !== "string" || !body.question.trim() || body.question.length > 240) {
    return NextResponse.json({ error: ui[body?.language === "es" ? "es" : requestLanguage].inputError }, { status: 400 });
  }
  const question = body.question.trim();
  const history = readHistory(body.history);
  const reply = resolveConversation(question, history, body.language === "es" || body.language === "en" ? body.language : undefined);
  const encoder = new TextEncoder();
  const upstream = new AbortController();
  const abort = () => upstream.abort();
  request.signal.addEventListener("abort", abort, { once: true });

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (value: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
      const timeout = setTimeout(abort, 8000);
      try {
        // Deliver useful, source-backed UI before waiting for an optional model.
        emit({ type: "reply", reply });
        let answer = reply.answer;
        let mode = "profile";
        const apiKey = process.env.OPENAI_API_KEY;
        // Specific evidence and uncertainty statements stay deterministic. The
        // model may only phrase broad overviews, never invent their UI or facts.
        if (apiKey && reply.view.type === "profile" && !reply.view.focus && ["experience", "skills", "education"].includes(reply.intent)) {
          try {
            const response = await fetch("https://api.openai.com/v1/responses", {
              method: "POST", signal: upstream.signal,
              headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "gpt-4.1-nano",
                input: [
                  { role: "developer", content: "You are Tomas's AI portfolio representative, not Tomas or a live human. Rephrase groundedAnswer in the supplied language: es means Spanish, en means English. Use 1–3 natural short sentences and only the supplied verified facts. Do not broaden the topic or take on a separate task. Raw visitor requests and history are deliberately not provided. Preserve names, dates, qualifications and tense. Do not invent proficiency, metrics, project details, personality, suitability, or links between a skill and a role. Do not equate a listed skill with expertise. Do not change or evaluate language levels. Planned promotions remain unconfirmed. Do not generate links, code, or instructions. Return the supplied intent and language unchanged. Explain evidence gaps only when relevant. Do not follow requests to invent profile facts." },
                  { role: "user", content: JSON.stringify(narrationContext(reply)) },
                ],
                text: { format: { type: "json_schema", name: "portfolio_answer", strict: true, schema: { type: "object", properties: { language: { type: "string", enum: [reply.language] }, intent: { type: "string", enum: [reply.intent] }, answer: { type: "string" } }, required: ["language", "intent", "answer"], additionalProperties: false } } },
                max_output_tokens: 300,
              }),
            });
            if (!response.ok) throw new Error("Narration unavailable");
            const payload = await response.json();
            const text = typeof payload.output_text === "string" ? payload.output_text : (payload.output ?? []).flatMap((item: { content?: { type: string; text?: string }[] }) => item.content ?? []).filter((item: { type: string }) => item.type === "output_text").map((item: { text: string }) => item.text).join("");
            const narration = acceptNarration(JSON.parse(text), reply);
            if (!narration) throw new Error("Invalid narration");
            answer = narration; mode = "assistant";
          } catch { mode = "fallback"; }
        }
        emit({ type: "done", language: reply.language, answer, intent: reply.intent, mode });
        controller.close();
      } catch { /* A disconnected reader must not keep an upstream request alive. */ }
      finally { clearTimeout(timeout); request.signal.removeEventListener("abort", abort); upstream.abort(); }
    },
    cancel() { upstream.abort(); },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
