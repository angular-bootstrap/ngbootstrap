# @angular-bootstrap/ngbootstrap 2.0.3

This patch makes the default PDF export path dependency-free.

## Fixed

- `JsPdfAdapter` now generates a simple table PDF directly in the browser.
- Removed `jspdf` and `jspdf-autotable` from optional peer dependencies.
- Angular apps no longer need jsPDF optional HTML/canvas dependencies for basic DataGrid PDF export.

## Notes

PDF and Excel export are dependency-free by default. The built-in PDF adapter is intended for simple table export only.

Use a custom `PdfExportAdapter` for branded layouts, images, charts, rich typography, or advanced pagination.
