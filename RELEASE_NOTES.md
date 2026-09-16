# @angular-bootstrap/ngbootstrap 2.2.0

This minor release adds provider-independent AI UI components and a shared
CSS-token theme layer for Angular applications using Bootstrap 5.

## Added

- Prompt Box, AI Chat, Inline AI Prompt, AI Prompt workspace, and Smart Paste,
  exported from the package root with typed messages and events.
- Original task, conversation, contextual editing, draft-review, and field-review
  workflows. Applications own model requests, streaming, cancellation, and storage.
- Shared `--ngb-*` tokens, Bootstrap defaults, Material/Tailwind variable bridges,
  palette presets, and optional Tailwind v4 utility integration.

## Improved

- DataGrid theme selection, token consumption, swatches, and portaled filter menus.
- Shared theming across pager/pagination, stepper, splitter, tree, typeahead,
  chips, drag/drop styling, and JSON preview.
- AI keyboard instructions, stable Send/Stop controls, read-only busy inputs,
  expanded-panel relationships, focus restoration, live announcements, and
  keyboard-focusable draft review.
- Package validation for AI exports and theme assets; patched transitive tooling
  dependencies and synchronized optional-peer lockfile metadata.

## Validation and limits

- 414 library tests, including 42 AI tests; lint, package build, and package checks.
- Tarball consumer template compilation on Angular 21 and Angular 22.
- Browser keyboard checks and desktop/mobile theme checks.
- Audit passes the high-severity threshold. Three moderate advisories remain in
  the Angular 22.0.8 development dependencies; Angular is a consumer peer, not
  bundled into the library runtime.
- Manual VoiceOver/NVDA testing has not been performed. Accessibility support is
  not a WCAG certification.

## Compatibility

Bootstrap remains the default. Angular peers remain `>=21.0.0 <23.0.0`.
Angular Material and AI provider SDKs are not dependencies. Tailwind is optional.
AI responses render plain text; Markdown, attachments, voice, AI Grid features,
and WebMCP are not included.

See `THEMING.md` and `src/ai/README.md` for setup and behavior details.
