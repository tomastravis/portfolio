# Standing project instructions

## Research before substantial changes

For every future task in this repository, consider current external evidence before choosing an approach. Before substantial design, architecture, AI/conversation, generative UI, animation, voice, accessibility or performance changes:

- Research how people are currently solving the specific problem, including recent working examples, maintained open-source implementations, official documentation and relevant engineering write-ups. Do not rely only on model memory or familiar libraries.
- Prefer primary sources. Check publication/update dates, maintenance status and compatibility with the repository's exact installed versions. Distinguish documented capabilities and measured results from marketing, popularity and personal opinion; do not claim something is trending without evidence.
- Compare a small number of relevant approaches against this portfolio's goals: a simple, conversational interface, source-grounded answers, useful adaptive UI, distinctive restrained visuals and a good experience on phones.
- Consider accessibility, reduced motion, touch/voice support, mobile Safari, latency, battery/GPU cost, privacy and deployment constraints when relevant. Adopt techniques because they solve our problem, not because they are fashionable.
- Briefly explain the findings and the chosen approach, with source links and material tradeoffs. For significant decisions, save dated research notes under `docs/research/` so later tasks can reuse them; recheck them when versions or circumstances change.
- If browsing or source access is unavailable, say what could not be verified and distinguish a provisional choice from researched evidence. Never invent citations or current community consensus.

Keep research proportional: small mechanical fixes can use recently verified sources when still applicable. Research should inform implementation and validation, not replace shipping a tested result.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
