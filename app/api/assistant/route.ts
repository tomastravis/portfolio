import { NextResponse } from "next/server";
import { CanonicalIntent, resolveCanonicalIntent } from "@/app/assistant";

const CANONICAL_INTENTS = [
  "experience",
  "skills",
  "education",
  "languages",
  "promotion",
  "projects",
  "unknown",
] as const satisfies readonly string[];

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

function coerceOpenAIIntent(data: unknown): CanonicalIntent | null {
  if (!data || typeof data !== "object") return null;

  const candidate = (data as { intent?: unknown }).intent;
  if (isApprovedIntent(candidate)) return candidate;

  const outputParsed = (data as { output_parsed?: { intent?: unknown } }).output_parsed;
  if (outputParsed && isApprovedIntent(outputParsed.intent)) return outputParsed.intent;

  const outputText = (data as { output_text?: string }).output_text;
  if (typeof outputText === "string") {
    try {
      const parsed = JSON.parse(outputText) as { intent?: unknown };
      if (isApprovedIntent(parsed.intent)) return parsed.intent;
    } catch {
      // Ignore parse errors and fall through to fallback.
    }
  }

  const output = (data as { output?: Array<{ content?: Array<{ text?: string }> }> }).output;
  if (Array.isArray(output)) {
    for (const item of output) {
      const content = item?.content;
      if (!Array.isArray(content)) continue;
      for (const segment of content) {
        const text = segment?.text;
        if (typeof text !== "string") continue;
        try {
          const parsed = JSON.parse(text) as { intent?: unknown };
          if (isApprovedIntent(parsed.intent)) return parsed.intent;
        } catch {
          // Ignore parse errors and fall through to fallback.
        }
      }
    }
  }

  return null;
}

export async function POST(request: Request) {
  let question = "";

  try {
    if (isRateLimited(request)) {
      return NextResponse.json({ intent: "unknown" }, { status: 429 });
    }

    const body = (await request.json().catch(() => ({}))) as { question?: unknown };
    question = typeof body.question === "string" ? body.question.trim() : "";

    if (!question || question.length > MAX_INPUT_LENGTH) {
      return NextResponse.json({ intent: resolveCanonicalIntent(question || "unknown") }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ intent: resolveCanonicalIntent(question) });
    }

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
            role: "user",
            content: `Classify this visitor question into exactly one canonical intent. Allowed intents: ${CANONICAL_INTENTS.join(", ")}. Return only JSON with an "intent" property. Question: ${question}`,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "portfolio_intent_classifier",
            strict: true,
            schema: {
              type: "object",
              properties: {
                intent: {
                  type: "string",
                  enum: [...CANONICAL_INTENTS],
                },
              },
              required: ["intent"],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      return NextResponse.json({ intent: resolveCanonicalIntent(question) }, { status });
    }

    const payload = await response.json();
    const intent = coerceOpenAIIntent(payload);

    if (!intent) {
      return NextResponse.json({ intent: resolveCanonicalIntent(question) });
    }

    return NextResponse.json({ intent });
  } catch {
    return NextResponse.json({ intent: resolveCanonicalIntent(question || "unknown") });
  }
}

