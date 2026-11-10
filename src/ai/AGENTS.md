# AI controls contributor guidance

Applies to the five UI controls in this subtree in addition to the [library rules](../../AGENTS.md). Read [the component guide](README.md), `public-api.ts` and `src/ai.types.ts` for their distinct contracts.

## Boundaries and interactions

- These are provider-independent UI controls: accept supplied data and emit events. Do not add provider calls, credentials, automatic clipboard reads, generated-action execution or conversation persistence. Application code owns request cancellation, stale-response suppression and backend validation; emitting Stop is not proof that a network request was aborted.
- Render supplied content as text. Preserve immutable message/response inputs and stable IDs during streaming; do not mutate conversation history or force scrolling away from earlier messages.
- Prompt Box: reject blank, over-limit, disabled or busy submissions. Preserve Shift+Enter and IME composition; selecting a suggestion populates the draft without sending it. Keep Send/Stop focus stable through busy transitions.
- Chat and AI Prompt workspace: preserve retry/feedback/apply/regenerate/dismiss payloads and action availability during streaming. Result actions emit intent without mutating application-owned records.
- Inline Prompt: only explicit Apply emits the replacement. Closing via trigger, Close or Escape restores trigger focus, emits `closed`, and requests Stop when busy; original context stays unchanged.
- Smart Paste: emit a copied field schema, accept only known suggestion keys, preserve schema order and explicit review/apply. Keep first-valid duplicate handling and prototype-like field keys safe. New suggestions/fields reset temporary review state; never auto-apply extracted values.
- Preserve named controls, unique instruction relationships, live announcements and native Tab behavior. Streaming updates must not recreate focused controls or announce every token unnecessarily.

## Focused verification

From the library root run `corepack pnpm test:ci --runTestsByPath src/ai/src/ai-components.spec.ts`. Shared composer/type/style changes need coverage across all five controls, including busy/error/stop, immutable streaming, text-only rendering, selection/reset and focus restoration.

Add browser checks for affected streaming/focus transitions; unit event assertions do not establish assistive-technology delivery. Use mock data/providers. The separate docs Ask service has its own grounding, transport, budget and persistence tests; changing these controls does not authorize paid calls or service configuration changes.
