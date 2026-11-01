# Scope and personality boundaries

Reviewed: 2026-11-01. Scope: keep the portfolio assistant about Tomas, with friendly redirects for unrelated tasks and appropriate responses to serious concerns. Bilingual support and visual redesign remain separate tasks.

## Evidence consulted

- [OWASP LLM Prompt Injection Prevention Cheat Sheet](https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.md), retrieved from its official repository for this task. Relevant sections cover direct/indirect injection, role changes, multi-turn attacks, and defense in depth. It explicitly warns that pattern filtering alone does not establish resistance to injection. User history and model output are untrusted; privileges and consequential actions must be controlled outside the model.
- Reused the [Rasa response variations](https://github.com/RasaHQ/rasa/blob/main/docs/docs/responses.mdx) and [OpenAI conversation-flow/variety guidance](https://github.com/openai/openai-cookbook/blob/main/examples/Realtime_prompting_guide.ipynb) reviewed in the preceding [natural-conversation task](2026-11-01-natural-conversation.md). Their principles still apply to this unchanged stack: distinguish reply types, use short responses, vary repeated wording and provide an actionable way back to the supported conversation.

These are primary-source design/security principles, not a popularity ranking. Publication dates and broad community consensus were not independently verified. No dependency, security framework or new model is being adopted.

## Approaches compared

1. Add only a scope/personality instruction to the model. Flexible wording, but leaves the application dependent on model availability and its willingness to maintain scope; it would not fix local keyword routing.
2. Ask a second model to classify every request. Potentially better coverage of paraphrases, but adds latency, cost, configuration and another fallible model boundary. Disproportionate to this focused portfolio iteration.
3. Use a shared explicit scope layer plus a narrower narration boundary. Selected: intercept task delegation/role changes before technology matching, then produce a brief contextual redirect. The optional narration model receives only resolved application-owned facts and grounded text, never raw visitor questions or history.

## Implementation decisions

- Distinguish asking Tomas's coding background from delegating code generation/debugging to the assistant. Include polite formulations, indirect delegation and mixed requests in tests. The selected code does not execute or generate requested visitor code.
- Render boundaries using the existing short conversational view: no evidence cards, source label or large refusal heading. Offer a quick introduction and a technology question as ways back to Tomas.
- Vary repeated harmless redirects using bounded history; avoid insults, escalating hostility or mocking visitors. Use an explicit identity/configuration boundary for common role-change requests. Repeated insistence does not change scope, and blocked task history is not used to resolve later technology pronouns.
- Use a separate respectful reply for detected serious personal concerns, with no portfolio suggestions attached. Immediate-danger wording points to local emergency help or someone nearby without guessing the visitor's country or pretending the portfolio is a crisis service. This is not clinical assessment or a general-purpose support capability.
- Restrict optional AI narration to a rephrasing task over `intent`, verified profile facts and the grounded answer. The visitor still gets question-specific UI from the local resolver; their original text and history do not enter the phrasing model. Returned text remains bounded and React-rendered as text, not executable UI.
- No UI framework APIs or dependencies change; this uses the existing conversation view, shared resolver, Next.js 16.3.3 route and React 19.2.8 rendering. Reviewed the installed `use client` guidance before validating the existing interactive presentation.

## Limits and validation

The English scope detector is a pragmatic product-routing layer, not an exhaustive semantic classifier or a security guarantee. Keyword patterns can miss paraphrases or misclassify a request. The meaningful structural improvement is removing raw visitor instructions from the optional model path and continuing to expose no general-purpose tools or executable model-generated components.

The regression suite covers code delegation, legitimate technical background questions, unrelated tasks, role/configuration changes, mixed requests, variation, insistence, respectful serious-concern responses, context recovery and the narration-input boundary. Production endpoint/browser checks must verify the same boundary view, allowed recovery and no layout regressions on phone/desktop. These are smoke/regression tests, not an adversarial security benchmark or physical-phone/voice validation.
