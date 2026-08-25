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

export type AssistantResponse = {
  title: string;
  description: string;
  items: string[];
};

const normalize = (value: string) => value.trim().toLowerCase();

const describeEducationEntry = (item: (typeof profile.education)[number]) => {
  const details = item as { range?: string; completed?: string; start?: string };
  const date = details.range ?? details.completed ?? details.start ?? "";
  return `${item.degree} · ${item.institution} (${date})`;
};

export function resolveCanonicalIntent(rawQuery: string): CanonicalIntent {
  const query = normalize(rawQuery);

  if (!query) {
    return "experience";
  }

  if (/(experience|work|career|role|journey)/.test(query)) return "experience";
  if (/(project|projects)/.test(query)) return "projects";
  if (/(skills|technology|technologies|stack|tool|tools)/.test(query)) return "skills";
  if (/(education|studies|study|degree|master|university|erasmus)/.test(query)) return "education";
  if (/(language|languages|spanish|english|french|portuguese)/.test(query)) return "languages";
  if (/(promotion|new role|upcoming|engineer)/.test(query)) return "promotion";

  return "unknown";
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
