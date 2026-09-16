# AI UI components

Provider-independent Angular controls for operational assistant workflows.
These components render supplied data and emit typed events. They do not call
an AI provider, execute generated actions, read the clipboard automatically,
or persist conversation history.

```ts
import {
  NgbPromptBoxComponent,
  NgbAiChatComponent,
  NgbAiPromptComponent,
  NgbInlineAiPromptComponent,
  NgbSmartPasteComponent,
} from '@angular-bootstrap/ngbootstrap';
```

Add the standalone components to your application's component imports.
Bootstrap 5 CSS is required. For scoped themes, load the library global
`src/styles/themes.scss` entry and use any supported `data-ngb-theme` wrapper.
No model SDK or AI provider dependency is installed.

| Component | Use case | Application event |
| --- | --- | --- |
| `ngb-prompt-box` | Ask a question or collect a generation instruction | `promptSubmit: string`, `stop: void` |
| `ngb-ai-chat` | Conversation with a workspace assistant | `promptSubmit`, `stop`, `retry: string`, `feedback: NgbAiFeedback` |
| `ngb-ai-prompt` | Generate and review multiple drafts | `promptSubmit`, `stop`, `responseApply`, `regenerate`, `responseDismiss` |
| `ngb-inline-ai-prompt` | Propose a contextual text replacement | `promptSubmit: NgbInlineAiRequest`, `responseApply: string`, `stop`, `closed` |
| `ngb-smart-paste` | Review field values extracted from pasted notes | `mappingRequest: NgbSmartPasteRequest`, `valuesApply: readonly NgbSmartPasteSuggestion[]`, `stop` |

## Prompt Box

```html
<ngb-prompt-box [(value)]="instruction" [busy]="pending()"
  [suggestions]="['Summarize open orders', 'Draft a delivery update']"
  (promptSubmit)="send($event)" (stop)="cancel()" />
```

`value` supports two-way binding. Set `maxLength` (default 4000),
`submitOnEnter` (default true), and `clearOnSubmit` (default true).
Empty, whitespace-only, over-limit, disabled, or busy submissions are rejected.
Shift+Enter inserts a line and composition events do not submit.
Suggestions populate the draft without sending it. The composer has
`label`, `placeholder`, `submitLabel`, and `stopLabel` string inputs.

## Chat

```html
<ngb-ai-chat [messages]="messages()" [busy]="pending()" [error]="error()"
  (promptSubmit)="send($event)" (stop)="cancel()"
  (retry)="retryMessage($event)" (feedback)="recordFeedback($event)" />
```

Each `NgbAiMessage` has a unique `id`, a `role` (`user`, `assistant`, or
`system`), and plain-text `content`. Optional `status` is `complete`,
`streaming`, or `error`; optional `error` supplies per-message failure text.
Replace messages immutably as chunks arrive. Retry emits the failed ID;
the application decides which request to replay. Feedback emits the ID and
`helpful`, `unhelpful`, or `null` when cleared. The component manages visual
feedback selection, but the application owns its persistence.

`label`, `userLabel`, `assistantLabel`, `emptyText`, and `suggestions` configure
basic conversation copy. Busy locks the composer and exposes Stop.
User messages align to the end of the transcript; assistant responses stay at
the start, with feedback below the response. There is no forced autoscroll: users can continue reading earlier messages.

## Draft workspace

The workspace places the instruction brief beside reviewable drafts and stacks
them on small screens. Provide `responses: readonly NgbAiResponse[]`, each with `id`, `prompt`, and
`text`. Array order determines display order. `responseApply` and `regenerate`
emit the selected response; `responseDismiss` emits its ID. These events do
not change the input history. Supply `label`, `promptLabel`, `emptyText`, and
`suggestions` as needed. The request text remains available after submission.

## Inline edits

Provide `context` and a separately generated `response`. The `promptSubmit`
event contains `{ instruction, context }`. Only explicit Apply emits
`responseApply`; the original context is never changed by the library.
Closing with the trigger, Close, or Escape emits `closed`, restores trigger
focus, and emits `stop` if work is pending. The expanded region stays in the
page flow, and normal Tab navigation reaches its controls.

## Reviewed paste

Provide `fields` as `{ key, label, value? }[]`; field values are strings.
`source` is an optional two-way input for the pasted text. The user pastes
into a normal textarea; the component does not request clipboard permission.
`mappingRequest` emits the text and a copied field schema. Your extraction
service returns `suggestions` as `{ field, value }[]`.

Only keys present in `fields` can be reviewed. The first valid suggestion for
a field is used; unknown fields are ignored. Users can edit proposed text and
exclude fields. `valuesApply` emits only the selected proposals. The application
must validate them and explicitly update its form. New fields or suggestions
reset the review selection and temporary edits.

## Request lifecycle and boundaries

All panels expose `busy`, `disabled`, and (except Prompt Box) `error` inputs.
Set busy immediately when a request starts. On Stop, abort the application
request, clear busy, and ignore results from older request IDs. Cancel pending
work on destruction. Clear stale proposals when the source or context changes.
Keep provider credentials on the server and validate response data before
passing it to components or applying it to domain records.

Content is interpolated as text. HTML, Markdown rendering, attachments, voice,
model transports, persistence, AI Grid features, and WebMCP are not included.
Inputs with labels support basic copy customization; this first version does
not yet expose a full translation dictionary for every built-in action label.

Tests cover submission guards, composition/keyboard input, cancellation,
streaming updates, error/retry, feedback, explicit draft/edit application,
field allowlisting, review edits, and escaped content.

## Accessibility and keyboard support

Native buttons support Tab/Shift+Tab navigation and Enter/Space activation.
Prompt inputs have visible labels and associated keyboard/length guidance.
Enter submits when enabled; Shift+Enter and IME composition are preserved.
During processing, the textarea stays focusable and read-only, and the same
button changes from Send to Stop without replacing the focused DOM node.
Explicitly disabled controls remain disabled.

Chat exposes a named live log and pressed feedback states. Drafts use a named,
focusable scroll region. Inline Prompt uses an expanded trigger linked to its
panel, Escape closes it, and closure restores trigger focus. New inline proposals
and Smart Paste fields have persistent live status regions. Smart Paste uses
labeled native checkboxes and inputs inside a fieldset.

These contracts have automated coverage and browser keyboard checks. They are
not a WCAG certification; perform assistive-technology testing in the consuming
application, especially for custom themes, content, and surrounding focus flows.
