# Portfolio experience checklist

The first conversation canvas is a starting point. The next iteration should feel like a responsive conversation with Tomas's AI representative: useful, attentive and grounded in verified profile information. Keep the layout simple and make the visual response specific to each question.

## Next: conversational intelligence

- [x] Recognise named technologies and aliases, including Spark/PySpark. Replaced the broad-keyword-only route and inconsistent model-routing path with profile-derived matching and optional narration.
- [x] Cover "is he good with spark?" with a regression case. Surface PySpark, explain missing proficiency evidence, and avoid inventing a linked role or achievement.
- [x] Resolve contextual follow-ups from the last six completed questions, including "where did he use it?", "show me more" and "what about Python?". Only recorded profile data supplies facts.
- [x] Show a concise conversational answer before supporting UI, identifying the assistant as Tomas's AI representative.
- [x] Replace the generic topic-menu dead end with a specific clarification and actionable examples. Distinguish missing facts from service failures.
- [x] Offer contextual follow-up actions instead of repeating the opening prompts.

## Generative UI and reactive behaviour

- [x] Compose question-specific technology details, side-by-side comparisons, focused research, timelines, expandable role evidence and contact actions.
- [x] Assemble each turn from a constrained component vocabulary. The initial implementation chooses views from resolved questions and profile evidence; it does not execute arbitrary model-generated UI.
- [x] Define a versioned typed contract for answers, evidence, supported views and follow-ups. Validate optional model narration separately; rebuild UI from trusted profile data.
- [ ] Use charts only when verified numerical data supports them. Never invent metrics, skill percentages, achievements or project details to populate visuals.
- [x] Acknowledge questions immediately, progressively deliver profile-backed evidence and optional narration, and support cancellation/retry without duplicate turns.
- [ ] Add token-by-token model narration where appropriate. The current stream sends a complete grounded reply first and an optional complete refined answer afterward.
- [x] Remove the content-covering sticky input, compact the conversation header, and avoid scrolling again when evidence or narration arrives.
- [ ] Keep voice and text in the same conversation, with visible listening/speaking states, editable transcripts, interruption controls and graceful browser fallbacks.

## Liquid visual refinement

- [ ] Replace or substantially improve the opening silver sideways-S form. Explore more organic liquid movement and distinctive material/refraction treatments; the current SVG is a placeholder direction, not the final signature visual.
- [ ] Make visual reactions meaningful to listening, preparing an answer and speaking, without claiming the animation measures real microphone levels unless it actually does.
- [ ] Keep content calm and readable. Preserve the simple conversation layout rather than surrounding it with decorative panels or a dashboard.
- [ ] Evaluate the effect on physical phones, including Safari, touch input and battery/GPU cost. Keep offscreen pausing, a manual pause control, reduced-motion support and a lightweight fallback.

## Acceptance checks for the next iteration

- [x] Add automated grounding/context tests for Spark, unsupported proficiency, pronoun follow-ups, topic changes, comparisons, unknown topics, dated research, malformed history and narration validation.
- [x] Verify the production API and UI in Chromium at 320px, 390px and 1440px: Spark, follow-ups, comparison, explicit work evidence, unknown topics, failed requests, retry without duplicates, cancellation, compact viewport, reduced motion and no horizontal overflow/browser errors.
- [ ] Confirm every displayed fact and chart value has a supporting profile source; distinguish missing evidence from a negative assessment of Tomas.
- [ ] Inspect rendered desktop and mobile layouts, including an open phone keyboard, long conversations, streaming content, focus handling and screen-reader announcements.
- [ ] Test real microphone capture and spoken playback on a physical phone; mocked browser API tests alone do not establish voice readiness.
- [x] Pass lint, 10 grounding/context tests, TypeScript and the webpack production build, plus production browser/API regression checks for this conversational iteration. Turbopack's local worker-socket restriction remains an environment limitation; no build configuration was changed.
