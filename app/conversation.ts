import { CanonicalIntent, getFactsForScopes, resolveCanonicalIntent } from "./assistant";
import { profile } from "./profile";
import { explicitLanguage, Language, languageFor, normaliseText, toRoutingEnglish } from "./i18n";
import { spanishReply } from "./replies.es";

export type TechnologyFact = { name: string; category: string; source: string; evidence: { role: string; company: string; dates: string; detail: string }[] };
export type ConversationView =
  | { type: "technology"; technologies: TechnologyFact[] }
  | { type: "comparison"; technologies: TechnologyFact[] }
  | { type: "profile"; intent: CanonicalIntent; focus?: "research" }
  | { type: "conversation"; kind: "greeting" | "casual" | "introduction" | "assistant" | "acknowledgement" | "goodbye" | "boundary" | "support" | "language" }
  | { type: "clarification" };
export type ConversationReply = {
  version: 1; language: Language; intent: CanonicalIntent; title: string; answer: string;
  view: ConversationView; followups: string[]; suggestContact: boolean;
};
type EnglishReply = Omit<ConversationReply, "language">;

const aliases: Record<string, string[]> = {
  PySpark: ["spark", "apache spark", "pyspark"],
  "Scikit-learn": ["scikit-learn", "scikit learn", "sklearn"],
  Kubernetes: ["kubernetes", "k8s"],
  "Power BI": ["power bi", "powerbi"],
  "CI/CD": ["ci/cd", "ci cd", "continuous integration"],
  AWS: ["aws", "amazon web services"],
  TypeScript: ["typescript", "type script"],
};

function mentions(text: string, term: string) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i").test(text);
}

function technologiesIn(question: string): TechnologyFact[] {
  return profile.skills.flatMap(group => group.items.filter(name =>
    (aliases[name] ?? [name]).some(alias => mentions(question, alias)),
  ).map(name => ({
    name, category: group.category, source: `Profile / Skills / ${group.category}`,
    evidence: profile.experience.flatMap(role => role.highlights.filter(detail =>
      (aliases[name] ?? [name]).some(alias => mentions(detail, alias)),
    ).map(detail => ({ role: role.role, company: role.company, dates: `${role.start} — ${role.end}`, detail }))),
  })));
}

export function readHistory(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-6).filter((item): item is string => typeof item === "string" && item.length <= 240).map(item => item.trim()).filter(Boolean);
}

function selectTopic(question: string): CanonicalIntent {
  if (/\b(certification|certified|cloud|devops|programming|coding|code|scripts|analytics tools|machine learning tools)\b/i.test(question)) return "skills";
  if (/\b(robotics|research|reinforcement learning|ros ?2|autonomous|ntt|cloudera|etl|etls|pipelines|mentoring)\b/i.test(question)) return "experience";
  if (/\b(contact|email|reach|hire)\b/i.test(question)) return "unknown";
  return resolveCanonicalIntent(question);
}

function normaliseOpening(question: string) {
  return question.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[’‘]/g, "'").replace(/\bwho'?s\b/g, "who is").replace(/[^a-z0-9'\s]/g, " ").replace(/\s+/g, " ").trim();
}

function conversationKind(question: string): Exclude<Extract<ConversationView, { type: "conversation" }>["kind"], "boundary" | "support" | "language"> | null {
  const text = normaliseOpening(question);
  if (/^(?:(?:hey+|hi+|hello|yo|hiya|howdy)(?: there| again| tomas(?: travis)?)?|good (?:morning|afternoon|evening))$/.test(text)) return "greeting";
  const direct = text.replace(/^(?:hey|hi|hello)(?: there)?\s+/, "");
  if (/^(?:(?:hey|hi|hello) )?(?:what'?s up|sup|how are you(?: doing)?|how'?s it going|how do you do)(?: today)?$/.test(text)) return "casual";
  if (/^(?:who is (?:tomas(?: travis)?|he)|(?:tell me(?: a (?:bit|little))?|what do you know) about (?:tomas(?: travis)?|him)|(?:give me (?:a |the )?)?(?:quick |short )?(?:intro|introduction)(?: to tomas(?: travis)?)?|(?:can you )?introduce (?:tomas(?: travis)?|him)|what does (?:tomas(?: travis)?|he) do|what is his background)$/.test(direct)) return "introduction";
  if (/^(?:who are you|what are you|introduce yourself|are you (?:tomas(?: travis)?|a real person|human)|is this (?:tomas|a real person)|what can you do)$/.test(direct)) return "assistant";
  if (/^(?:thanks(?: a lot)?|thank you(?: very much)?|cheers|cool|nice|great|awesome|ok(?:ay)?|got it|i see|sounds good|perfect)$/.test(text)) return "acknowledgement";
  if (/^(?:bye|goodbye|see you(?: later)?|that'?s all|all done)$/.test(text)) return "goodbye";
  return null;
}

function conversationalReply(question: string, history: string[]): EnglishReply | null {
  let kind = conversationKind(question);
  const previous = readHistory(history);
  if (/^(?:yes|yeah|yep|sure|please|go ahead|yes please)$/i.test(normaliseOpening(question))) {
    const lastKind = conversationKind(previous.at(-1) ?? "");
    if (lastKind === "greeting" || lastKind === "casual" || lastKind === "assistant") kind = "introduction";
  }
  if (!kind) return null;
  const count = previous.filter(item => conversationKind(item) === kind).length;
  const openings = [
    "Hey! I’m Tomas’s AI guide. Want a quick introduction?",
    "Hey again! Want the short version of who Tomas is?",
    "Hello again. We can start with a quick intro to Tomas, if you like.",
  ];
  const responses = {
    greeting: openings[count % openings.length],
    casual: ["Here to help you get to know Tomas. Want the quick intro?", "We can keep it casual. Want the short version of who Tomas is?", "We can start wherever you like. Shall I introduce Tomas?"][count % 3],
    introduction: "Tomas works across data engineering, AI and software engineering, with a background in mathematics and data analytics. His experience includes engineering at NTT DATA and deep-learning research at Universidad Loyola. Want to explore his work or how he got into it?",
    assistant: "I’m Tomas’s AI portfolio guide, not Tomas himself. I can introduce him, explore his work with you, or dig into a specific technology. Want a quick introduction?",
    acknowledgement: ["You’re welcome. Ask away if anything else comes to mind.", "Of course. What else are you curious about?", "Anytime. We can explore something else whenever you’re ready."][count % 3],
    goodbye: "Thanks for stopping by. You can come back to explore more, or use Get in touch to reach Tomas directly.",
  };
  return { version: 1, intent: "unknown", title: kind === "introduction" ? "Meet Tomas" : "Conversation", answer: responses[kind], view: { type: "conversation", kind }, followups: kind === "goodbye" || kind === "acknowledgement" ? [] : kind === "introduction" ? ["Show me his experience", "What did he study?"] : ["Who is Tomas?", "Show me his experience"], suggestContact: false };
}

type ScopeReason = "coding" | "unrelated" | "instructions" | "urgent" | "support";
const followupPattern = /\b(it|that|those|them|there|more|else|where did|where has|how long|tell me more)\b/i;
const insistencePattern = /^(?:do it anyway|just do it|just this once|come on|try anyway|please|please do it)$/;

export function classifyScope(question: string): ScopeReason | null {
  question = toRoutingEnglish(question);
  const text = normaliseOpening(question.replace(/[\u200B-\u200D\uFEFF]/g, ""));
  if (/\b(?:kill myself|hurt myself|end my life|want to die|suicidal|in immediate danger|not safe right now)\b/.test(text)) return "urgent";
  if (/\b(?:i am|i'm|im|i feel) (?:really |so |very )?(?:depressed|grieving|scared|unsafe)|\b(?:i need (?:medical|legal|mental health) (?:advice|help)|i(?:'m| am) having a panic attack)|\b(?:my (?:dad|mom|mum|mother|father|partner|friend) (?:died|passed away)|i lost my (?:dad|mom|mum|mother|father|partner|friend))\b/.test(text)) return "support";
  const roleChange = /(?:^|\b(?:you|please|now|then) )(?:act as|roleplay as|pretend to be)\b|\b(?:you are now|pretend you are|switch roles)\b/.test(text);
  if (roleChange || /\b(?:ignore|disregard|forget|override|bypass)\b.{0,55}\b(?:instructions|rules|guardrails|restrictions|prompt)\b|\b(?:system prompt|api key|secret key|developer mode)\b|\b(?:reveal|show|print|repeat|output)\b.{0,40}\b(?:instructions|configuration|secrets|system message)\b/.test(text)) return "instructions";

  // A question about Tomas doing a task is not delegation to this assistant.
  // A mixed request can still explicitly delegate work in its second clause.
  const profileText = text.replace(/^(?:(?:hey|hi|hello) )?(?:(?:can|could|would) you (?:please )?|please )?/, "");
  const profileQuestion = /^(?:(?:can|could|would|does|did|has|is) (?:tomas(?: travis)?|he)\b|(?:what|which|where|when|how|tell me about|show me)\b.*\b(?:tomas|his|he)\b|(?:explain|describe|write about) (?:his|tomas)\b)/.test(profileText);
  const extraTask = /\b(?:also|then|and|instead) (?:please )?(?:write|build|create|generate|debug|fix|solve|run)\b/.test(text);
  const delegation = /\b(?:write|build|make|create|generate|implement|debug|fix|refactor|execute|run|solve|review|complete|finish|give me|show me|help me|i need|i want|teach me|explain|design)\b|\bdo (?:my|this|the) (?:homework|assignment|coding)\b/.test(text);
  const codeArtifact = technologiesIn(question).length > 0 || /\b(?:code|script|function|program|app|website|algorithm|regex|homework|sql query|query|tests?|python|sql|typescript|javascript)\b/.test(text);
  if (delegation && codeArtifact && (!profileQuestion || extraTask) && !/^tell me about (?:python|pyspark|spark|sql|typescript|javascript)$/.test(text)) return "coding";
  if (/\b(?:write|compose|draft|translate|summari[sz]e|plan|book|recommend|solve|calculate|review)\b/.test(text) && /\b(?:poem|story|essay|email|letter|text|document|article|recipe|dinner|trip|flight|holiday|equation|homework|resume|cv)\b/.test(text) && (!profileQuestion || extraTask)) return "unrelated";
  if (conversationKind(question)) return null;
  if (/^(?:yes|yeah|yep|sure|please|go ahead|yes please)$/.test(text)) return null;
  if (technologiesIn(question).length || selectTopic(question) !== "unknown" || /\b(?:tomas|his|he|him)\b/.test(text) || followupPattern.test(text)) return null;
  return "unrelated";
}

function scopeReply(question: string, history: string[]): EnglishReply | null {
  let reason = classifyScope(question);
  const previous = readHistory(history);
  if (insistencePattern.test(normaliseOpening(question)) && previous.length) {
    for (const earlier of [...previous].reverse()) {
      if (insistencePattern.test(normaliseOpening(earlier))) continue;
      reason = classifyScope(earlier);
      break;
    }
  }
  if (!reason) return null;
  const serious = reason === "urgent" || reason === "support";
  const count = previous.filter(item => {
    const previousReason = classifyScope(item) ?? (insistencePattern.test(normaliseOpening(item)) ? "unrelated" : null);
    return previousReason && previousReason !== "urgent" && previousReason !== "support";
  }).length;
  const coding = [
    "Nice try—this is Tomas’s portfolio, not a coding hotline. I can show you his programming background, though.",
    "The coding shift belongs to Tomas. I’m here for the introduction—want to explore his technical skills?",
    "Still on portfolio duty. I can talk about Tomas’s coding experience, but I won’t write or debug code here.",
  ];
  const redirects = [
    "A small detour from the Tomas tour. I’m here to help you get to know him—curious about his work or studies?",
    "My entire beat is Tomas. Want the quick introduction, or a closer look at his experience?",
    "Keeping this little corner of the internet about Tomas. What would you like to know about him?",
  ];
  const answer = reason === "urgent"
    ? "I’m sorry you’re going through this. If you’re in immediate danger, contact local emergency services or someone you trust nearby. This portfolio guide can’t provide crisis support."
    : reason === "support"
      ? "I’m sorry you’re dealing with that. I’m a portfolio guide, so I can’t offer professional advice or personal support. Please reach out to someone you trust or a qualified professional."
      : reason === "coding" ? coding[count % coding.length]
        : reason === "instructions" ? "I’m keeping my portfolio-guide hat on. I can help you explore Tomas’s background, not change roles or share internal configuration."
          : redirects[count % redirects.length];
  return { version: 1, intent: "unknown", title: serious ? "Support" : "Back to Tomas", answer, view: { type: "conversation", kind: serious ? "support" : "boundary" }, followups: serious ? [] : ["Who is Tomas?", "What technologies does he use?"], suggestContact: false };
}

export function narrationContext(reply: ConversationReply) {
  // Only application-owned facts and resolved copy enter the optional model.
  // Never include raw visitor questions or conversation history here.
  return { language: reply.language, intent: reply.intent, facts: getFactsForScopes([reply.intent]), groundedAnswer: reply.answer };
}

function resolveEnglishConversation(question: string, history: string[] = []): EnglishReply {
  const clean = question.trim().slice(0, 240);
  const boundary = scopeReply(clean, history);
  if (boundary) return boundary;
  const conversational = conversationalReply(clean, history);
  if (conversational) return conversational;
  let technologies = technologiesIn(clean);
  let intent = selectTopic(clean);
  let topic = clean;
  const isFollowup = followupPattern.test(clean);
  if (!technologies.length && intent === "unknown" && isFollowup) {
    const previousQuestions = readHistory(history);
    for (let index = previousQuestions.length - 1; index >= 0; index--) {
      const previous = previousQuestions[index];
      if (classifyScope(previous)) continue;
      const social = conversationalReply(previous, previousQuestions.slice(0, index));
      const kind = social?.view.type === "conversation" ? social.view.kind : null;
      if (kind === "introduction") { intent = "experience"; topic = previous; break; }
      if (kind) continue;
      technologies = technologiesIn(previous);
      intent = technologies.length ? "skills" : selectTopic(previous);
      if (technologies.length || intent !== "unknown") { topic = previous; break; }
    }
  }
  if (technologies.length) {
    const comparison = technologies.length > 1;
    const names = technologies.map(item => item.name).join(" and ");
    const usage = /\b(where|used|use it|use that|use them|project|applied|example)\b/i.test(clean);
    const proficiency = /\b(good|expert|proficien|better|best|strong|rate|rating|level|comfortable)\w*/i.test(clean);
    const linked = technologies.flatMap(item => item.evidence);
    let answer = comparison
      ? `Tomas lists ${names} in his profile. Here’s the evidence side by side; the profile doesn’t rank his proficiency in them.`
      : `${names} is listed in Tomas’s ${technologies[0].category.toLowerCase()} skills.`;
    if (!comparison && (usage || proficiency)) {
      answer += linked.length
        ? ` His profile explicitly mentions it in ${linked.map(item => `${item.role} at ${item.company} (${item.dates})`).join("; ")}.`
        : usage ? " The profile doesn’t connect it to a specific role or project, so I can’t tell you where he used it." : " The profile doesn’t specify a proficiency level or a particular achievement with it, so I can’t fairly rate how good he is.";
      if (linked.length && proficiency) answer += " That’s recorded experience, rather than a proficiency rating.";
    }
    if (!comparison && !usage && !proficiency) answer += " You can explore the recorded evidence below, or ask where he used it.";
    return { version: 1, intent: "skills", title: comparison ? "The evidence, side by side" : `A closer look at ${names}`, answer,
      view: { type: comparison ? "comparison" : "technology", technologies },
      followups: comparison ? ["Show me his experience", "What other technologies does he list?"] : [`Where did he use ${names}?`, `Compare ${names} with ${names === "Python" ? "PySpark" : "Python"}`, "Show me his experience"],
      suggestContact: (usage || proficiency) && !linked.length };
  }

  const base = { version: 1 as const, intent, view: { type: "profile" as const, intent }, suggestContact: false };
  switch (intent) {
    case "experience": {
      if (/research|robotics|reinforcement|ros ?2|autonomous/i.test(topic)) {
        const research = profile.experience.find(role => role.role === "Deep Learning Research Assistant")!;
        return { ...base, title: "His deep-learning research", answer: `Tomas was a ${research.role} at ${research.company} from ${research.start} to ${research.end}. The recorded work covers reinforcement-learning models integrated with ROS 2 and autonomous control of surface-vehicle fleets.`, view: { type: "profile", intent, focus: "research" }, followups: ["What did he study?", "Show me his experience", "What technologies does he use?"] };
      }
      return { ...base, title: "His work, in context", answer: "Tomas’s profile covers engineering at NTT DATA and deep-learning research at Universidad Loyola. Open a role to see the work recorded for it.", followups: ["What technologies does he use?", "Tell me about Kubernetes", "What did he study?"] };
    }
    case "skills": return { ...base, title: "What he works with", answer: `His profile groups technologies into programming, cloud and DevOps, machine learning, frontend, and analytics. ${/certifi/i.test(clean) ? `It also lists ${profile.certification.join(", ")}. ` : ""}Choose a technology to ask a more specific question.`, followups: ["Is he good with Spark?", "Where did he use Kubernetes?", "Compare Python with PySpark"] };
    case "education": return { ...base, title: "From mathematics to data", answer: "Tomas studied Mathematics at Universidad de Sevilla, completed a Master’s in Data Analytics at Universidad Loyola in June 2024, and studied at Universidade de Lisboa through Erasmus.", followups: ["Tell me about his research", "What technologies does he use?", "What languages does he speak?"] };
    case "languages": return { ...base, title: "The languages he lists", answer: `His profile lists ${profile.languages.map(item => `${item.language} (${item.level})`).join(", ")}. ${/comfort|client|good|fluent/i.test(clean) ? "Those are recorded levels; the profile doesn’t establish how comfortable he is in a particular client situation." : "Want to explore his work or studies next?"}`, followups: ["Show me his experience", "What did he study?"], suggestContact: /comfort|client|good|fluent/i.test(clean) };
    case "projects": return { ...base, title: "Let’s separate projects from experience", answer: "There aren’t any standalone project entries in the profile yet. I can show you his recorded professional and research experience, or you can ask Tomas directly for a project example.", followups: ["Show me his experience", "Tell me about his research"], suggestContact: true };
    case "promotion": return { ...base, title: "What’s recorded about his next role", answer: `The profile records a planned move from ${profile.promotion.currentRole} to ${profile.promotion.newRole} at ${profile.promotion.company}, effective ${profile.promotion.effective}. Confirmation of that change hasn’t been added.`, followups: ["Show me his experience"], suggestContact: true };
    default: return { ...base, title: "Could you give me a little more to go on?", answer: /\b(contact|email|reach|hire)\b/i.test(clean) ? "You can reach Tomas directly using the contact link below. I can also help you explore his work before you get in touch." : "I don’t have that detail about Tomas yet. Want to explore his work, studies, or a particular technology instead?", view: { type: "clarification" }, followups: ["Who is Tomas?", "Show me his experience"], suggestContact: /\b(contact|email|reach|hire)\b/i.test(clean) };
  }
}

export function resolveConversation(question: string, history: string[] = [], preferredLanguage?: Language): ConversationReply {
  const bounded = readHistory(history);
  const fallback = preferredLanguage ?? bounded.reduce<Language>((language, item) => languageFor(item, language), "en");
  const language = languageFor(question, fallback);
  const canonical = toRoutingEnglish(question);
  const command = explicitLanguage(question) && normaliseText(question).split(" ").every(word => ["responde", "contesta", "habla", "hablemos", "hablar", "cambia", "cambiar", "sigue", "continua", "puedes", "podemos", "en", "al", "a", "in", "speak", "talk", "answer", "respond", "reply", "continue", "switch", "can", "could", "would", "you", "we", "to", "spanish", "espanol", "english", "ingles", "please", "por", "favor"].includes(word));
  if (command) return { version: 1, language, intent: "unknown", title: language === "es" ? "Idioma" : "Language", answer: language === "es" ? "Claro, seguimos en español. ¿Qué te gustaría saber de Tomas?" : "Of course—we can continue in English. What would you like to know about Tomas?", view: { type: "conversation", kind: "language" }, followups: language === "es" ? ["¿Quién es Tomas?", "Muéstrame su experiencia"] : ["Who is Tomas?", "Show me his experience"], suggestContact: false };
  const reply = { ...resolveEnglishConversation(canonical, bounded.map(toRoutingEnglish).filter(Boolean)), language };
  return language === "es" ? spanishReply(reply, canonical) : reply;
}

// Only this versioned, known component vocabulary crosses the network boundary.
// Evidence and UI are rebuilt from profile data, never accepted as executable model output.
export function acceptNarration(value: unknown, expected: ConversationReply): string | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { intent?: unknown; answer?: unknown; language?: unknown };
  return candidate.intent === expected.intent && (candidate.language === undefined || candidate.language === expected.language) && typeof candidate.answer === "string" && candidate.answer.trim().length > 0 && candidate.answer.length <= 1800 ? candidate.answer.trim() : null;
}
