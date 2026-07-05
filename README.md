# @angular-bootstrap/ngbootstrap

Standalone Angular UI components with Bootstrap-friendly styling.

## What Is Included

- DataGrid
- Pagination
- Typeahead
- Tree
- Splitter
- Stepper
- Chips
- Drag and drop

## Requirements

- Angular `>=21.0.0 <23.0.0`
- RxJS `^7.8.0`
- Bootstrap CSS in the consuming app
- Bootstrap Icons when icon-based examples are used

## Install

```bash
npm install @angular-bootstrap/ngbootstrap bootstrap bootstrap-icons
```

Optional integrations are installed only when you use those features:

```bash
npm install chart.js
```

PDF and Excel export are dependency-free by default.

Excel export is dependency-free by default. The built-in `BrowserExcelExportAdapter`
generates an Excel-compatible workbook in the browser and avoids unmaintained
spreadsheet writer dependencies. It is intended for visible column values and
basic scalar cell types; use a custom `ExcelExportAdapter` for formulas, charts,
multiple sheets, workbook styling, or other advanced workbook features.

The built-in PDF adapter generates a simple table PDF in the browser. Provide a custom
`PdfExportAdapter` when your product needs branded PDFs, images, charts, advanced layout,
rich typography, headers, footers, or more precise pagination.

## Use

Import standalone components directly in your Angular component.

```ts
import { Component } from '@angular/core';
import { NgbDatagridComponent, type ColumnDef } from '@angular-bootstrap/ngbootstrap';

@Component({
  selector: 'app-users-grid',
  standalone: true,
  imports: [NgbDatagridComponent],
  template: `
    <ngb-datagrid
      [data]="users"
      [columns]="columns"
      [enableSorting]="true"
      filterable="row"
      [enablePagination]="true"
      [pageSize]="10"
    />
  `,
})
export class UsersGridComponent {
  users = [
    { id: 1, name: 'Ava Patel', role: 'Admin' },
    { id: 2, name: 'Noah Chen', role: 'Editor' },
  ];

  columns: ColumnDef[] = [
    { field: 'id', header: 'ID', type: 'number', width: 90, sortable: true },
    { field: 'name', header: 'Name', type: 'text', sortable: true, filterable: true },
    { field: 'role', header: 'Role', type: 'text', filterable: true },
  ];
}
```

## Development

```bash
pnpm install
pnpm test
pnpm build
```

Build output is written to `dist/`.
