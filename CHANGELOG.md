# Changelog

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
