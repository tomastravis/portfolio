import { profile } from "./profile";

export const CANONICAL_INTENTS = [
  "experience",
  "skills",
  "education",
  "languages",
  "promotion",
  "projects",
  "unknown",
] as const;

export type CanonicalIntent = (typeof CANONICAL_INTENTS)[number];

export type AssistantIntentResponse = {
  intent: CanonicalIntent;
  answer: string | null;
  suggestContact: boolean;
};

export type AssistantRoute = {
  primaryIntent: CanonicalIntent | null;
  factScopes: CanonicalIntent[];
  confident: boolean;
};

export type AssistantResponse = {
  title: string;
  description: string;
  items: string[];
};

const normalize = (value: string) => value.trim().toLowerCase();

const intentScore = (query: string, patterns: readonly RegExp[]) =>
  patterns.reduce((score, pattern) => score + (pattern.test(query) ? 1 : 0), 0);

export function resolveLocalRoute(rawQuery: string): AssistantRoute {
  const query = normalize(rawQuery);

  if (!query) {
    return { primaryIntent: "experience", factScopes: ["experience"], confident: true };
  }

  if (/(why|good|strong|fit|suitable|ai engineer)/.test(query) && /engineer|ai/.test(query)) {
    return {
      primaryIntent: "experience",
      factScopes: ["experience", "skills", "education"],
      confident: true,
    };
  }

  if (/(french-speaking|language|languages|spanish|english|french|portuguese)/.test(query)) {
    return { primaryIntent: "languages", factScopes: ["languages"], confident: true };
  }

  const scores = [
    { intent: "experience", score: 0, patterns: [/(experience|work|career|role|journey)/] },
    { intent: "projects", score: 0, patterns: [/(project|projects)/] },
    { intent: "skills", score: 0, patterns: [/(skills|technology|technologies|stack|tool|tools)/] },
    { intent: "education", score: 0, patterns: [/(education|studies|study|degree|master|university|erasmus)/] },
    { intent: "promotion", score: 0, patterns: [/(promotion|new role|upcoming)/] },
  ] as const;

  const ranked = scores
    .map((entry) => ({ ...entry, score: intentScore(query, entry.patterns) }))
    .sort((left, right) => right.score - left.score);

  const best = ranked[0];
  const isUniqueMatch = best && best.score > 0 && best.score > (ranked[1]?.score ?? 0);

  if (isUniqueMatch) {
    return { primaryIntent: best.intent, factScopes: [best.intent], confident: true };
  }

  return { primaryIntent: null, factScopes: [], confident: false };
}

const describeEducationEntry = (item: (typeof profile.education)[number]) => {
  const details = item as { range?: string; completed?: string; start?: string };
  const date = details.range ?? details.completed ?? details.start ?? "";
  return `${item.degree} · ${item.institution} (${date})`;
};

export function resolveCanonicalIntent(rawQuery: string): CanonicalIntent {
  return resolveLocalRoute(rawQuery).primaryIntent ?? "unknown";
}

export function getFactsForScopes(scopes: CanonicalIntent[]) {
  const facts: Record<string, unknown> = {};

  for (const scope of scopes) {
    switch (scope) {
      case "experience":
        facts.experience = profile.experience;
        break;
      case "skills":
        facts.skills = profile.skills;
        break;
      case "education":
        facts.education = profile.education;
        break;
      case "languages":
        facts.languages = profile.languages;
        break;
      case "promotion":
        facts.promotion = profile.promotion;
        break;
      case "projects":
      case "unknown":
        break;
    }
  }

  return facts;
}

export function resolveIntentByCanonical(intent: CanonicalIntent): AssistantResponse {
  switch (intent) {
    case "experience": {
      const latest = profile.experience[0]!;
      return {
        title: "Experience",
        description: `${latest.role} · ${latest.company}`,
        items: [...latest.highlights],
      };
    }
    case "projects": {
      return {
        title: "Projects",
        description: "No project data has been added yet.",
        items: ["No project data has been added yet."],
      };
    }
    case "skills": {
      const items: string[] = [];
      for (const group of profile.skills) {
        for (const item of group.items) {
          items.push(`${group.category}: ${item}`);
        }
      }
      return {
        title: "Skills",
        description: "Core technical capabilities",
        items,
      };
    }
    case "education": {
      return {
        title: "Education",
        description: "Academic background",
        items: profile.education.map((item) => describeEducationEntry(item)),
      };
    }
    case "languages": {
      return {
        title: "Languages",
        description: "Language proficiency",
        items: profile.languages.map((entry) => `${entry.language}: ${entry.level}`),
      };
    }
    case "promotion": {
      return {
        title: "Promotion",
        description: `${profile.promotion.currentRole} → ${profile.promotion.newRole}`,
        items: [
          `Company: ${profile.promotion.company}`,
          `Effective: ${profile.promotion.effective}`,
          `Status: ${profile.promotion.status}`,
        ],
      };
    }
    case "unknown":
    default:
      return {
        title: "Try asking about",
        description: "experience, education, languages, skills, promotion, or projects",
        items: [
          "Experience",
          "Education",
          "Skills",
          "Languages",
          "Promotion",
          "Projects",
        ],
      };
  }
}

export function resolveProfileIntent(rawQuery: string): AssistantResponse {
  const canonicalIntent = resolveCanonicalIntent(rawQuery);
  return resolveIntentByCanonical(canonicalIntent);
}
