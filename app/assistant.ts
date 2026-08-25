import { profile } from "./profile";

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

export function resolveProfileIntent(rawQuery: string): AssistantResponse {
  const query = normalize(rawQuery);

  if (!query) {
    const latest = profile.experience[0]!;
    return {
      title: "Experience",
      description: "Current professional focus",
      items: [
        `${latest.role} · ${latest.company}`,
        `${latest.start} – ${latest.end}`,
      ],
    };
  }

  if (/(experience|work|career|role|journey)/.test(query)) {
    const latest = profile.experience[0]!;
    return {
      title: "Experience",
      description: `${latest.role} · ${latest.company}`,
      items: [...latest.highlights],
    };
  }

  if (/(project|projects)/.test(query)) {
    return {
      title: "Projects",
      description: "No project data has been added yet.",
      items: ["No project data has been added yet."],
    };
  }

  if (/(skills|technology|technologies|stack|tool|tools)/.test(query)) {
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

  if (/(education|studies|study|degree|master|university|erasmus)/.test(query)) {
    return {
      title: "Education",
      description: "Academic background",
      items: profile.education.map((item) => describeEducationEntry(item)),
    };
  }

  if (/(language|languages|spanish|english|french|portuguese)/.test(query)) {
    return {
      title: "Languages",
      description: "Language proficiency",
      items: profile.languages.map((entry) => `${entry.language}: ${entry.level}`),
    };
  }

  if (/(promotion|new role|upcoming|engineer)/.test(query)) {
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

  return {
    title: "Try asking about",
    description: "experience, education, languages, skills, or promotion",
    items: [
      "Experience",
      "Education",
      "Skills",
      "Languages",
      "Promotion",
    ],
  };
}
