# @angular-bootstrap/ngbootstrap 2.1.0

This release expands the DataGrid with first-class grouping support and rounds out several related grid behaviors and docs updates.

## Added

- DataGrid grouping with `groupable` and `group` inputs for single-field or multi-field grouping.
- `groupChange` and grouped `dataStateChange` payloads for manual or server-side grouping flows.
- Drag-to-group interactions, grouped rows, expand/collapse behavior, aggregate output, and custom group header/footer templates.
- Sticky group headers and sticky group footers for larger grouped datasets.

## Changed

- Docs, package copy, and examples now position ngbootstrap as Angular UI for data-heavy apps.
- Grouping examples now build on a shared realistic dataset and extend it across automatic grouping, manual grouping, aggregates, templates, and sticky group examples.

## Fixed

- Sorting continues to behave correctly in grouped scenarios.
- In-cell editing activation is more reliable.
- Sticky columns and column reordering behavior were corrected in the DataGrid docs and integration flow.

## Notes

PDF and Excel export remain dependency-free by default.

Use a custom `PdfExportAdapter` or `ExcelExportAdapter` when your product needs branded documents, advanced workbook generation, charts, images, or other highly customized export output.
