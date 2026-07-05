# @angular-bootstrap/ngbootstrap 2.0.0

This release removes the DataGrid Excel export dependency on an unmaintained spreadsheet writer package and replaces it with a dependency-free browser adapter.

## Highlights

- DataGrid Excel export now uses `BrowserExcelExportAdapter` by default.
- The adapter implements the existing `ExcelExportAdapter` contract, so applications can still provide a custom exporter through Angular DI.
- The package no longer references or requires the removed spreadsheet dependency.
- Documentation now explains the implementation choice, security rationale, migration path, and default adapter limitations.

## Breaking Change

The previous spreadsheet adapter has been removed from the public API. Use `BrowserExcelExportAdapter` or provide your own `ExcelExportAdapter`.

## Limitations

The built-in browser adapter exports visible column values and basic scalar cell types. It does not generate formulas, charts, pivot tables, merged cells, multiple sheets, workbook styling, or macro-enabled files.

## Upgrade

```ts
import {
  BrowserExcelExportAdapter,
  ExcelExportAdapter,
} from '@angular-bootstrap/ngbootstrap';

providers: [
  { provide: ExcelExportAdapter, useClass: BrowserExcelExportAdapter },
];
```
