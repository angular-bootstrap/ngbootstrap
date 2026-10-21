# AGENTS.md

## Scope and source of truth

This repository publishes `@angular-bootstrap/ngbootstrap`, MIT-licensed **Angular UI for data-heavy apps**. All features, themes and examples remain open source; no paid tier, license keys or mandatory hosted service. Applications own backend and AI-provider costs. The project is not affiliated with `ng-bootstrap` or `ngx-bootstrap`; differentiate respectfully by focus.

Public exports, implementations and tests in `src/**` define behavior. The separate private docs workspace owns ngbootstrap.com, SEO, demos and Ask ngbootstrap. Implement library features here before documenting them as available there. Do not copy proprietary implementations or examples.

## Before changing any code

1. Read this file, any narrower instructions, and the relevant feature guide. Inspect `git status`, branch and diff; preserve unrelated work and never reset it.
2. Identify the public inputs, outputs, types, secondary entry points, templates, styles and tests affected. Trace callers and compatibility behavior before editing.
3. Reproduce bugs where practical. Define the expected behavior, acceptance checks and unsupported combinations. For broader work, write a short implementation plan first.
4. Check `package.json`, the lockfile and CI for supported tooling. Use Node 22 and Corepack with the pinned pnpm version; install with `corepack pnpm install --frozen-lockfile`. Do not replace the lockfile with another package manager.
5. Assess API compatibility, keyboard/focus behavior, SSR/hydration, themes, performance and security. Keep the change small; avoid unrelated refactors or new dependencies without a concrete need.
6. Confirm the requested scope and existing authorization. Do not start/restart servers, publish, deploy or change account settings unless authorized. Do not repeatedly ask for approval already given.

## Coding standards

- Preserve Angular 21/22 peer compatibility. Keep Angular as peers and optional integrations optional; do not require Material or Tailwind for palettes.
- Prefer standalone components, directives and pipes; built-in `@if`, `@for`, `@switch`; stable row/item tracking; strict public types and typed event payloads. Avoid unnecessary `any`.
- Use `inject()`, signals and `computed()` where they clarify local state. Keep effects narrow; avoid effects that merely copy derived state. Use OnPush when behavior is bounded and tested; stay zoneless-friendly.
- Keep hot template paths cheap. Cache derived work where appropriate; avoid repeated full-data scans on scroll. Benchmark with a stated dataset/environment before claiming performance gains.
- Preserve input ownership, immutable update contracts, event ordering and cancellation. Avoid duplicate remote requests; ignore stale async completions and release subscriptions, listeners, observers and timers on destruction.
- Keep browser globals and measurements out of module initialization and server rendering. Defer browser-only work until after rendering; maintain deterministic initial markup and IDs for hydration.
- Use shared `--ngb-*` tokens and existing `--dg-*` mappings. Preserve Bootstrap defaults, nested theme scopes, visible focus and disabled/error states; no docs-only CSS that disguises missing library behavior.
- Prefer native controls and explicit behavior over unnecessary abstractions. Document non-obvious constraints and rationale, not line-by-line narration.
- Never expose secrets or execute untrusted AI output. Validate external values and bound large payloads. Persistence, authorization and provider credentials remain application/server responsibilities.

## Accessibility

- Start with native semantics; use ARIA only with the corresponding interaction. Verify valid role ownership, names, unique IDs, labels/descriptions, state and relationships.
- Test Tab/Shift+Tab, Enter/Space, Escape and documented arrow shortcuts. Preserve native editing, clipboard, IME composition and text undo. Restore focus after closing/removing UI and announce meaningful async results/errors without excessive live updates.
- Check visible focus, disabled/busy states, zoom/reflow, contrast, target size and reduced motion in affected themes. Never use color alone to communicate a state.
- For grids, check logical row/column indexes, virtual spacer semantics and focus across grouping, details and editing. Do not claim full APG navigation just because roles are present.
- Document actual supported keys, application responsibilities and known gaps. Manual screen-reader checks are optional supplementary evidence; record whether performed. Automated checks are not WCAG certification.

## Testing and documentation

Feature guides live in `docs/guides/` with lowercase, hyphenated names and an index. Keep contributor/release instructions at the root and component-specific introductions beside their source. When moving guides, update links, `ng-package.json`, package validation and downstream source-index consumers.

- Add regression tests for behavioral fixes and meaningful tests for public contracts: success, invalid input, boundaries, cancellation/failure, cleanup and event counts. Avoid tests that only mirror implementation.
- Cover changed Grid interactions with editing, grouping, filtering, paging, saved views/history and supported scroll modes. Check applicable themes and keyboard interactions; include all affected AI controls for shared changes.
- SSR-sensitive changes require server rendering and browser hydration checks. DOM mocks alone do not establish hydration correctness. State any missing browser verification explicitly.
- Validate public examples against actual exports and strict Angular templates. Use scoped package imports. Keep examples simple, realistic, accessible and clear about application-owned handlers and backend logic.
- Update relevant Markdown, API descriptions and changelog for shipped behavior. Mark future features as planned; preserve historical changelog facts. Keep release notes current and avoid unpublished-development notices in the npm README.
- In the separate docs workspace, coordinate examples, API references, Accessibility pages, navigation and release version. Run its actual build, route and SEO checks: unique titles/descriptions, one descriptive main heading, canonical URLs, sitemap entries, working internal links and accurate structured data. This library has no SEO audit command.
- When updating Ask, use committed public sources, correct package version and immutable citations; run the docs workspace's version/index checks and retrieval tests. Do not index private files or change keys, budgets or usage storage as part of documentation maintenance.

## Before pushing

1. Review the full diff and status for scope, accidental generated files, secrets and breaking changes. Run `git diff --check`.
2. Run focused tests during development. Before a code/release push, run the CI checks below from this repository. For Markdown-only changes, validate links, examples and package docs; state which broader checks were not necessary or not run.
3. Review the full dependency audit, including moderate advisories. Use compatible fixes and inspect lockfile changes; never blindly force upgrades. Record unresolved advisories and release impact rather than claiming an audit is clean from a high-only exit status.
4. Verify affected docs and browser workflows using existing servers; report blockers and limitations honestly. Never invent test results or compliance/performance claims.
5. Confirm branch/destination and authorization. Stage only intended files, use a descriptive commit, push through the existing process and inspect CI. Do not bypass protections or publish a new npm version merely for routine development.

```sh
corepack pnpm lint
corepack pnpm test:ci
corepack pnpm build
corepack pnpm release:verify
corepack pnpm pack:dry-run
corepack pnpm security:audit
corepack pnpm --ignore-workspace audit --audit-level=moderate
```

## Before publishing

Follow [RELEASE_PLAN.md](RELEASE_PLAN.md). Use the existing tag-triggered GitHub workflow and npm trusted publishing, not a second manual publish or new token. Align package version, release notes and changelog; verify the package and an isolated consumer. After publication, verify registry installation, GitHub release and separately deployed docs/Ask versions. Keep planned capabilities distinct from released ones.
