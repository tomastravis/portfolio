# Copilot instructions

- Never invent facts about Tomas Travis.
- Never invent employers, roles, dates, technologies, qualifications, projects, achievements, metrics, links, or contact information.
- Portfolio content must come only from explicitly provided structured profile data or source documents.
- If required information is missing, use an obvious neutral placeholder or ask for the information rather than inventing it.
- Maintain the established Apple/Linear/Stripe-inspired visual direction.
- Avoid generic SaaS dashboard aesthetics.
- Avoid excessive cards, gradients, glow effects, animations, or decorative clutter.
- Frontend work is not finished until the rendered result has been visually inspected at desktop and mobile sizes.
- Respect accessibility and prefers-reduced-motion.
- Do not add dependencies without explaining why they are necessary.
- Run lint and production build before considering implementation work complete.
- Do not commit or push unless explicitly instructed.

Before adding or upgrading any external dependency:
- Check the current official documentation and latest stable package/version.
- Prefer the modern recommended package/API over legacy packages.
- Verify compatibility with the exact installed Next.js, React, TypeScript and Tailwind versions.
- Do not rely solely on model memory for current library versions.
- Explain any peer-dependency workaround before using flags such as --legacy-peer-deps.