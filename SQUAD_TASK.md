# AI squad task: Selected Work section

## Goal
Make the portfolio more useful to recruiters by adding a polished Selected Work section that shows concrete engineering projects and makes the existing Explore work / Projects navigation functional.

## Scope
- Add a `#projects` section below the current hero/assistant area.
- Show three concise project cards:
  1. AI Tech Lead — an AI engineering control plane/orchestrator for safe coding-agent workflows.
  2. BOATCO2 — a full-stack shipping/emissions application.
  3. Autonomous Surface Vehicle / ROS 2 — reinforcement-learning and robotics work for autonomous vessel control.
- Keep copy factual and grounded in repository/profile information; do not invent metrics, users, employers, awards, or production claims.
- Wire the header `Projects` link and every `Explore work` control to `#projects`.
- Preserve the existing dark/emerald visual language, responsive behavior, and reduced-motion accessibility.
- Prefer a small, maintainable implementation; reuse existing styles/components where practical.

## Acceptance criteria
1. `npm run lint` passes.
2. `npm run build` passes.
3. The three project cards are readable on mobile and desktop.
4. Project navigation works without a page reload.
5. Existing AI assistant behavior remains intact.
6. No secrets, analytics, new backend services, deployment changes, or unnecessary dependencies are introduced.
7. The squad stops at human approval with a reviewable diff; do not merge or deploy automatically.
