# Changelog

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
