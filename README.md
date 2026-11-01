This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Conversation checks

Run the profile-grounding and follow-up regression cases with the installed TypeScript compiler and Node's test runner:

```bash
node --test --test-isolation=none tests/conversation.test.mjs
```

The assistant recognises recorded technologies and aliases, resolves follow-ups from the last six questions, and composes source-backed evidence panels. `/api/assistant` delivers newline-delimited JSON: an initial versioned `reply`, then a `done` event with the final answer. UI components and evidence come from the local profile, not executable model output.

If `OPENAI_API_KEY` is configured on the server, broad overviews can receive optional AI phrasing. Named-technology evidence, proficiency limitations and focused research remain deterministic. Without that key, or if narration is unavailable, the profile-backed conversation still works. No key is exposed to the browser. Real voice capture/playback still needs physical-device validation.

See [ROADMAP.md](ROADMAP.md) for completed work and remaining visual, streaming and device-validation tasks.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
