# @angular-bootstrap/ngbootstrap 2.0.2

This patch fixes PDF export bundling for Angular browser apps.

## Fixed

- `JsPdfAdapter` now loads jsPDF from its browser UMD bundle.
- This avoids forcing consuming apps to resolve jsPDF optional ESM dependencies such as HTML/canvas sanitization helpers when they only need table PDF export.

## Notes

Applications using PDF export should keep both maintained PDF integrations installed:

```bash
npm install jspdf jspdf-autotable
```

Excel export remains dependency-free through `BrowserExcelExportAdapter`.
