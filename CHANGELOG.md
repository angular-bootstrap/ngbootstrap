# Changelog

## 2.3.0 - 2026-09-16

### Added

- Align grid header and body gutters when classic scrollbars reserve layout space.
- Add grid-scoped Undo/Redo keyboard shortcuts with opt-out, native text-editor protection and result announcements.
- Include committed existing-row edits in Undo/Redo, with rowSave historyAction events, validation and conflict protection.
- Add opt-in DataGrid configuration Undo/Redo with bounded history, duplicate suppression, active-editor protection and reactive availability signals.
- Versioned DataGrid snapshots, Date-safe serialization, `captureView()`, `restoreView()` and `viewChange`.
- Standalone Views control with save, update, rename, confirmed delete, initial reset and unsaved-change feedback.
- In-memory and opt-in local-storage adapters plus an asynchronous custom-persistence contract.
- Schema reconciliation, width/locking constraints, active-editor protection and one consolidated remote-data event per restoration.

### Fixed

- Browser layout measurements now wait until after rendering in Grid column sizing, Pager and Splitter.
- Shared grid/header semantics and row/rowgroup roles when drag/drop directives are present.
- Sort clearing emits the unified data state; view changes include visibility, order, resizing and auto-fit changes.

### Compatibility and ownership

- MIT throughout; no paid tier or new runtime dependency. Angular 21/22 peers and Bootstrap defaults remain supported.
- Views do not store rows, selection, expansion, drafts, callbacks, templates or themes. Storage is explicitly application-owned.
- See SAVED_VIEWS.md for APIs, accessibility limitations and planned future milestones.


- Updated Angular development dependencies to 22.1.7, ng-packagr to 22.1.1, and Zone.js to 0.16 to address development-dependency security advisories. These tooling fixes are included in this release; Angular peer ranges remain unchanged.

## 2.2.0 - 2026-09-16

### Added

- Five standalone, provider-independent AI controls: Prompt Box, AI Chat, Inline AI Prompt, AI Prompt workspace, and Smart Paste. Exported from the package root.
- Typed request, response, feedback, and reviewed-field events; application-owned streaming, cancellation, errors, and persistence.
- Shared `--ngb-*` theme tokens, Bootstrap defaults, optional Material/Tailwind variable mappings, and named palettes.
- Optional Tailwind v4 utility preset and token/theme integration documentation.

### Changed

- DataGrid consumes shared tokens and preserves theme values in portaled filter panels.
- Shared theme coverage for pagination/pager, stepper, splitter, tree, typeahead, chips, and drag/drop styles and JSON preview.
- AI controls provide keyboard instructions, busy-state focus continuity, expanded-panel relationships, live status announcements, and keyboard-focusable review regions.
- Release validation checks AI exports, theme assets, and optional Tailwind integration packaging.
- Patched vulnerable transitive build/test dependencies and synchronized the optional Tailwind peer in the lockfile.

### Compatibility

- Bootstrap remains the default; existing DataGrid theme selection remains supported.
- Angular peer range remains `>=21.0.0 <23.0.0`. No AI provider or Angular Material dependency.
- Tailwind is an optional peer, required only when compiling the utility integration.
- AI output is plain text. Attachments, voice, Markdown rendering, AI Grid features, and WebMCP are outside this release.

## 2.1.2 - 2026-07-27

### Fixed

- Removed an unused standalone directive import that created a circular DataGrid dependency and caused the published FESM bundle to throw `Cannot access 'Datagrid' before initialization` in Jest and other direct bundle-loading environments.

### Changed

- Extended release package verification to import the built FESM bundle and confirm that `Datagrid` and `NgbGridHighlightDirective` initialize and remain publicly exported.

### Compatibility

- No public component APIs, selectors, inputs, outputs, or Angular peer ranges changed.

## 2.1.1 - 2026-07-27

### Security

- Updated Angular 22, ng-packagr, Jest, ESLint, TypeScript tooling, and their transitive dependencies to patched compatible releases.
- Added targeted Jest dependency overrides to remove vulnerable legacy glob and brace-expansion paths without changing the published library API.
- Refreshed the pnpm lockfile so the complete library dependency graph reports no known vulnerabilities.

### Changed

- Updated the security audit command to include build and test dependencies while isolating the public library from any parent pnpm workspace.

### Fixed

- Removed a dead DataGrid test assignment surfaced by the updated ESLint rules.

## 2.1.0 - 2026-07-25

### Added

- Added DataGrid grouping with `groupable`, `group`, `groupChange`, and grouped `dataStateChange` support for local or manual/server-driven workflows.
- Added group panel interactions so users can group by dragging column headers, reorder grouped fields, and remove active groups without duplicating descriptors.
- Added grouped rendering helpers for nested group headers, expand/collapse behavior, aggregates, custom group header/footer templates, and sticky group headers/footers.
- Added grouping-focused docs, API coverage, examples, and library tests for grouping, aggregates, templates, and sticky group overlays.

### Changed

- Updated DataGrid docs and package positioning to emphasize Angular UI for data-heavy apps, including DataGrid depth and Angular-native Form Builder workflows.
- Expanded the public package README and release notes to document grouping, aggregate templates, and dependency-free export defaults more clearly.

### Fixed

- Fixed grouped sorting and grouped render paths so sorting continues to work correctly across grouping examples and grouped datasets.
- Fixed several DataGrid behavior regressions surfaced during the docs pass, including in-cell editing activation, sticky column behavior, and column reordering/data alignment.

## 2.0.3 - 2026-07-05

### Fixed

- Replaced the default PDF export implementation with a dependency-free browser PDF writer so Angular apps do not need jsPDF optional HTML/canvas dependencies for basic table export.
- Removed `jspdf` and `jspdf-autotable` from optional peer dependencies.

## 2.0.2 - 2026-07-05

### Fixed

- Fixed PDF export bundling by loading jsPDF from its browser UMD bundle, avoiding build-time resolution of jsPDF optional ESM dependencies.

## 2.0.1 - 2026-07-05

### Fixed

- Fixed `JsPdfAdapter` runtime loading in browser apps by allowing the bundler to resolve `jspdf` and `jspdf-autotable` from the consuming application.

## 2.0.0 - 2026-07-05

### Breaking Changes

- Removed the previous public spreadsheet adapter export.
- Replaced the DataGrid default Excel export implementation with `BrowserExcelExportAdapter`.

### Added

- Added `BrowserExcelExportAdapter`, a dependency-free browser workbook exporter that implements `ExcelExportAdapter`.
- Added tests for the browser Excel export adapter.
- Added documentation that explains why Excel export is dependency-free and when to provide a custom adapter.

### Changed

- DataGrid Excel export no longer depends on an unmaintained spreadsheet writer package.
- The default Excel export path generates an Excel-compatible SpreadsheetML workbook in the browser.
- Documentation now calls out the limitations of the default adapter: visible column values and basic scalar cell types only; no formulas, charts, pivot tables, merged cells, multiple sheets, workbook styling, or macro-enabled files.

### Migration

- Replace imports of the previous spreadsheet adapter with `BrowserExcelExportAdapter`.
- If your application needs advanced workbook generation, provide your own `ExcelExportAdapter` implementation.

```ts
import {
  BrowserExcelExportAdapter,
  ExcelExportAdapter,
} from '@angular-bootstrap/ngbootstrap';

providers: [
  { provide: ExcelExportAdapter, useClass: BrowserExcelExportAdapter },
];
```
