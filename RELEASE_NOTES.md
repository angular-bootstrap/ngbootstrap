# @angular-bootstrap/ngbootstrap 2.0.1

This patch fixes PDF export in browser apps.

## Fixed

- `JsPdfAdapter` no longer leaves `jspdf` and `jspdf-autotable` as bare browser runtime imports.
- Angular/Webpack can now resolve and bundle those maintained optional PDF integrations from the consuming application.

## Notes

Applications using PDF export should keep `jspdf` and `jspdf-autotable` installed:

```bash
npm install jspdf jspdf-autotable
```

Excel export remains dependency-free through `BrowserExcelExportAdapter`.
