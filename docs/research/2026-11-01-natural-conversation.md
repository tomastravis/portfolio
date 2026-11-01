# Natural conversation: greetings and introductions

Reviewed: 2026-11-01. Scope: the reported `hey` → `whats up` → `who is tomas` sequence, conversational acknowledgements, and transitions into factual questions. This is not a bilingual, voice-platform, or off-topic-personality implementation.

## Sources consulted

- [Rasa response documentation](https://github.com/RasaHQ/rasa/blob/main/docs/docs/responses.mdx), retrieved from its official repository. It separates greeting/chitchat responses from other intents, supports response variations and conditional selection, and treats buttons as optional response elements. These are established patterns, not evidence of a new popularity trend or a reason to add Rasa to this project. The page includes older Rasa 3.x examples; we use the design principles, not its APIs.
- [OpenAI Realtime prompting guide](https://github.com/openai/openai-cookbook/blob/main/examples/Realtime_prompting_guide.ipynb), retrieved from the official cookbook. The relevant sections recommend short warm replies, examples, variation constraints to reduce robotic repetition, and explicit conversation states. Its sample tool policy excludes simple greetings and basic chitchat from factual lookup. The guide is for Realtime; this change applies those interaction principles without claiming model-specific results for our text endpoint or adopting a new voice stack.

Retrieval confirms these sources were available during this review. Their publication dates and community popularity were not independently established. Initial guessed Microsoft/Rasa documentation paths returned 404 and were not used as supporting evidence.

## Approaches compared

1. Route every opening through a language model. Flexible, but introduces cost, latency, availability dependence, and harder-to-reproduce greeting behaviour. It does not by itself guarantee a useful answer or accurate profile facts.
2. Add a compact social-conversation layer before factual routing. Explicitly recognise greetings, casual openings, introductions, identity questions and acknowledgements; vary the response according to bounded history. Keep substantive questions in the existing profile-evidence flow. This is the selected approach for this focused change.

## Decision and tradeoffs

- Greetings and casual openings receive short text replies, without evidence disclaimers, large answer headings or source panels. Introductions summarise only existing profile facts. The UI still identifies the speaker as Tomas Travis AI.
- Match complete social openings rather than a greeting word anywhere in a question: `hey, is he good with Spark?` must remain a technology question. Support common English paraphrases and punctuation, including the accented spelling of Tomas's name.
- Use deterministic, history-aware variations for repeat greetings; do not invent feelings, personal updates, or live-human presence. Acknowledgements do not erase the last technical subject. A short affirmative after an offered introduction can continue into the introduction.
- Keep proficiency limitations when they are relevant to a real question. Retain technology evidence, source disclosures, model narration and the endpoint's existing typed streaming contract.
- No dependencies or framework APIs are added. This fits the existing Next.js 16.3.3 / React 19.2.8 client UI and shared TypeScript resolver. Reviewed the installed Next.js `use client` guidance before editing the interactive rendering.
- This remains a deliberately small English conversation layer, not general natural-language understanding. Uncovered paraphrases still need regression examples or a later routing improvement. Spanish/English support and playful out-of-scope boundaries remain separately queued.

## Validation plan

Replay the exact reported sequence in the resolver, endpoint and rendered phone/desktop UI. Check paraphrases, repeated greetings, assistant identity, a greeting containing a factual question, `yes` after an introduction offer, and `thanks` followed by a pronoun-based technical follow-up. Preserve existing grounding tests. Run lint, TypeScript/production build, and inspect mobile and desktop screenshots; do not infer real microphone or iOS Safari validation from Chromium.
