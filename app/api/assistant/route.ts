import { NextResponse } from "next/server";
import {
  AssistantIntentResponse,
  AssistantRoute,
  CANONICAL_INTENTS,
  CanonicalIntent,
  getFactsForScopes,
  resolveCanonicalIntent,
  resolveLocalRoute,
} from "@/app/assistant";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const MAX_INPUT_LENGTH = 240;

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function getClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  return ip;
}

function isRateLimited(request: Request) {
  const key = getClientKey(request);
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  entry.count += 1;
  rateLimitMap.set(key, entry);
  return false;
}

function isApprovedIntent(value: unknown): value is CanonicalIntent {
  return typeof value === "string" && CANONICAL_INTENTS.includes(value as (typeof CANONICAL_INTENTS)[number]);
}

function isAssistantResponse(data: unknown, expectedIntent: CanonicalIntent): data is AssistantIntentResponse {
  if (!data || typeof data !== "object") return false;
  const value = data as { intent?: unknown; answer?: unknown; suggestContact?: unknown };
  return value.intent === expectedIntent && (typeof value.answer === "string" || value.answer === null) && typeof value.suggestContact === "boolean";
}

function extractResponseText(response: unknown) {
  if (!response || typeof response !== "object") return null;

  const payload = response as {
    status?: unknown;
    error?: unknown;
    incomplete_details?: unknown;
    output_text?: unknown;
    output?: unknown;
  };

  if (payload.status === "failed" || payload.status === "incomplete" || payload.error) return null;

  if (typeof payload.output_text === "string") return payload.output_text;

  if (!Array.isArray(payload.output)) return null;

  const text = payload.output
    .filter((item): item is { type?: unknown; content?: unknown } => Boolean(item) && typeof item === "object")
    .filter((item) => item.type === "message" && Array.isArray(item.content))
    .flatMap((item) => item.content as unknown[])
    .filter((item): item is { type?: unknown; text?: unknown } => Boolean(item) && typeof item === "object")
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text as string)
    .join("");

  return text || null;
}

function parseStructuredOutput(payload: unknown) {
  const outputText = extractResponseText(payload);
  if (!outputText) return null;
  try {
    return JSON.parse(outputText) as unknown;
  } catch {
    return null;
  }
}

function fallback(intent: CanonicalIntent, status?: number) {
  return NextResponse.json({ intent, answer: null, suggestContact: false }, status ? { status } : undefined);
}

function shouldSuggestContact(question: string, intent: CanonicalIntent) {
  return intent === "languages" && /(comfortably|comfortable|client-facing|works for your team)/.test(question.toLowerCase());
}

function routeFromModel(data: unknown): AssistantRoute | null {
  if (!data || typeof data !== "object") return null;
  const value = data as { primaryIntent?: unknown; factScopes?: unknown };
  if (!isApprovedIntent(value.primaryIntent) || !Array.isArray(value.factScopes)) return null;
  if (!value.factScopes.every(isApprovedIntent)) return null;
  return { primaryIntent: value.primaryIntent, factScopes: value.factScopes, confident: true };
}

export async function POST(request: Request) {
  let question = "";

  try {
    if (isRateLimited(request)) {
      return fallback("unknown", 429);
    }

    const body = (await request.json().catch(() => ({}))) as { question?: unknown };
    question = typeof body.question === "string" ? body.question.trim() : "";

    if (!question || question.length > MAX_INPUT_LENGTH) {
      return fallback(resolveCanonicalIntent(question || "unknown"), 400);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return fallback(resolveCanonicalIntent(question));
    }

    let route = resolveLocalRoute(question);

    if (!route.confident) {
      const routingResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5.6-luna",
          input: [
            {
              role: "developer",
              content: `Answer only from the supplied verified profile facts.

            Refer to him as "Tomas" in conversational responses. Never call him "Tom".

            Write like a friendly, confident portfolio assistant:
            - concise
            - human
            - positive
            - slightly playful when appropriate
            - never bureaucratic
            - never exaggerate

            You may summarize and combine supplied facts and explain why factual experience or skills are relevant to the question.

            Never invent facts or infer unsupported personality, comfort, confidence, proficiency, or qualifications.

            When the question asks for something the facts cannot establish:
            1. state the relevant verified fact positively
            2. explain the limitation naturally
            3. when appropriate, encourage the visitor to ask Tomas directly

            Example:
            Question: "Could Tomas comfortably work with a French-speaking client?"
            Good answer: "Tomas lists French at B1. Want to know whether that works for your team? Ask him yourself."

            Do not generate an email address or contact link.

            If the supplied facts cannot meaningfully answer the question, set answer to null.

            Keep non-null answers short.`,
            },
            { role: "user", content: question },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "portfolio_route",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  primaryIntent: { type: "string", enum: [...CANONICAL_INTENTS] },
                  factScopes: { type: "array", items: { type: "string", enum: [...CANONICAL_INTENTS] } },
                },
                required: ["primaryIntent", "factScopes"],
                additionalProperties: false,
              },
            },
          },
          max_output_tokens: 80,
        }),
      });

      if (!routingResponse.ok) return fallback("unknown");
      route = routeFromModel(parseStructuredOutput(await routingResponse.json())) ?? {
        primaryIntent: null,
        factScopes: [],
        confident: false,
      };
    }

    if (!route.primaryIntent || route.factScopes.length === 0) return fallback(route.primaryIntent ?? "unknown");

    const facts = getFactsForScopes(route.factScopes);
    if (Object.keys(facts).length === 0) return fallback(route.primaryIntent);

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-nano",
        input: [
          {
            role: "developer",
            content: "Answer only from the supplied verified profile facts. Refer to him as Tomas, never Tom, in conversational responses. Write in roughly 1 to 3 concise sentences in a human, friendly, confident, positive portfolio style. Be slightly playful when appropriate and never bureaucratic, dishonest, or exaggerated. You may summarize verified facts, combine facts from multiple approved factScopes, and explain why factual experience or skills are relevant. Preserve the exact tense and dates of every supplied fact. Never infer that work, study, research, roles, projects, or activities are current or ongoing unless the supplied facts explicitly say Present, current, or upcoming. Do not turn past experience into current activity. Do not invent facts or infer unsupported personality traits, confidence, comfort, proficiency, or qualifications. In particular, do not describe Tomas as proactive, collaborative, communicative, adaptable, or similar based only on mentoring, coordination, or other activities. Do not claim Tomas is well-suited, excellent, strong, highly qualified, suitable, versatile, or otherwise objectively qualified. Do not use unsupported qualifiers such as extensive. Do not infer abilities from a language level beyond stating the recorded level. Do not invent causality or unsupported conclusions. Use only the recorded names for roles, research, studies, and projects; do not relabel research as a project or call past work academic projects unless the facts do so. Use plain factual language and never use marketing or evaluative phrases such as core pillars, bolster, toolkit, potential, innovations, showcases, capability, complex projects, strong skills, suitability, versatility, or further bolster. For the AI engineering question, use only this neutral pattern: Tomas has experience with [verified experience and dates]. He has skills including [verified skills]. These are relevant to AI engineering. Do not add any evaluation of Tomas. When the facts cannot fully answer something, state the relevant verified fact positively and explain only the necessary limitation naturally. For French-speaking client comfort, say that Tomas lists French at B1 and that the profile does not specify how comfortable he is working with French-speaking clients. For AI engineering suitability, describe relevant dated experience and skills, including that the Deep Learning Research Assistant role ran from December 2024 to December 2025 if mentioned, without exaggerating qualifications or implying that past research is ongoing. Set suggestContact to true for subjective or uncertain questions that Tomas himself would need to answer, or when contacting him is a natural next step. Set suggestContact to false for straightforward factual questions that the supplied facts answer sufficiently, including the AI engineering question when the profile provides relevant experience and skills. Never generate an email address or mailto URL. If the supplied facts cannot meaningfully answer the question, set answer to null and suggestContact to false.",
          },
          { role: "user", content: JSON.stringify({ question, intent: route.primaryIntent, facts }) },
        ],
        text: {
          format: {
            type: "json_schema",
              name: "portfolio_answer",
            strict: true,
            schema: {
              type: "object",
                properties: {
                  intent: { type: "string", enum: [...CANONICAL_INTENTS] },
                  answer: { type: ["string", "null"] },
                  suggestContact: { type: "boolean" },
                },
                required: ["intent", "answer", "suggestContact"],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    if (!response.ok) {
      return fallback(route.primaryIntent);
    }

    const output = parseStructuredOutput(await response.json());
    if (!isAssistantResponse(output, route.primaryIntent)) return fallback(route.primaryIntent);
    return NextResponse.json({
      ...output,
      suggestContact: output.suggestContact || shouldSuggestContact(question, route.primaryIntent),
    });
  } catch {
    return fallback(resolveCanonicalIntent(question || "unknown"));
  }
}

