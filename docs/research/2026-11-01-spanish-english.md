# Spanish and English conversation

Reviewed: 2026-11-01. Scope: English/Spanish UI, profile-backed replies, conversational context, boundaries and browser voice settings. No visual redesign or general translation service is introduced.

## Sources and access

- [Next.js internationalisation guide](https://nextjs.org/docs/app/guides/internationalization): read the guide shipped with installed Next.js 16.3.3. It distinguishes locale routing from dictionary-based localisation. Also reviewed the installed `use client` guide for the existing interactive page.
- [next-intl maintained project](https://github.com/amannn/next-intl): fetched its current README. Its approach combines typed messages, formatting and optional internationalised routing. Its message-key consistency guidance informs our dictionary-key regression check; the package is not installed for this small single-page feature.
- [MDN HTML lang](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang): retrieved the official source. Document language and mixed-language parts need explicit language attributes for assistive technology pronunciation. The transcript therefore keeps a language per answer; recorded English role/qualification labels retain their own `lang`.
- [MDN SpeechRecognition.lang](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/lang), [SpeechSynthesisUtterance.lang](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/lang) and [SpeechSynthesis.getVoices](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices): retrieved their official sources. Recognition and synthesis have separate BCP 47 language settings; available voices vary by device and may load asynchronously.

Attempted to inspect the recent public next-intl issue feed through GitHub's API. The environment denied that destination with HTTP 403. No issue discussion, popularity ranking or current community consensus is claimed from that failed request. The maintainer implementation and primary documentation above were accessible. Retrieval dates are recorded here; source publication/update dates were not independently established.

## Approaches compared

1. Add locale-prefixed routes and an internationalisation library. Suitable for separately indexed multilingual pages, plural-rich catalogues and a growing site. Here, routing alone would not localise conversation semantics, scope checks or voice, and navigating would require explicit state preservation.
2. Ask the model to translate every interaction. Flexible language coverage, but adds latency, dependency on credentials/network, translation drift and another way to lose factual constraints or bypass boundaries. Unsuitable as the only path for a deterministic, source-backed portfolio.
3. Use a typed English/Spanish dictionary, a shared bounded routing vocabulary and authored Spanish replies. Selected for this single conversation page. English and Spanish share the same canonical evidence and scope logic. Existing optional narration receives only trusted facts, the grounded answer and a validated target language.

## Decisions

- Add an explicit English/Español selector. A question with clear language cues changes the UI/reply language; ambiguous technology-only queries inherit the current selection. Explicit language commands can switch the conversation, including inline requests followed by a question.
- Distinguish a request to change language from a question about Tomas's language proficiency. `Does Tomas speak Spanish?` remains an English profile question. A switch never clears the transcript, and cross-language pronoun follow-ups retain their subject.
- Keep original visitor messages and source data unchanged. Only routing text is normalised. Localise answers, follow-ups, source labels, dates, highlights, status/error copy and accessibility labels. Retain original technology names, institutions, qualifications and recorded role titles; translating their surrounding presentation must not create new claims.
- Keep boundaries and uncertainty equivalent in both languages. Spanish coding delegation is still off-topic; Spanish questions about Tomas's coding background remain allowed. Language levels and unconfirmed promotion status are unchanged.
- Set recognition to `en-US` or `es-ES` from the current selection. Set utterance language independently, prefer a matching installed voice (including a compatible regional voice), and show a localised text fallback if loaded voices contain no match. When voices have not loaded, let the browser resolve the explicit utterance language; playback failures remain visible. Switching languages stops an active recording or playback.
- Preserve the existing voice opt-in, editable transcript, no automatic microphone activation, no automatic sending of dictated text, and browser speech-service notice. Mocked voice checks establish API wiring, not physical-device recognition/playback quality.
- No package versions, lockfile or deployment configuration change. The implementation fits Next.js 16.3.3 and React 19.2.8. Initial server-rendered UI remains English; explicit selection or typed-language detection changes the current session. Locale-prefixed SEO pages and saved preferences across reloads are not part of this pass.

## Limits and checks

Language detection and Spanish-to-canonical routing use a deliberately bounded vocabulary, not universal language understanding. Mixed/ambiguous phrasing can still need clarification. Expand with real examples rather than claiming complete Spanish paraphrase coverage.

Verify equal source facts across equivalent English/Spanish questions, language switches and follow-ups, introductions, scope boundaries, uncertainty, dictionary-key parity, preserved names/levels/dates, translated endpoint errors and narration locale validation. Inspect phone/desktop layouts, especially long Spanish labels and the 320px header. Test recognition/synthesis language tags, voice selection and absent-voice/permission fallbacks using browser simulations; actual microphone, audio and mobile Safari still require physical-phone validation.
