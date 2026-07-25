# @angular-bootstrap/ngbootstrap

Angular UI for data-heavy apps, with a focus on DataGrid depth, Angular-native Form Builder workflows, and practical standalone components that fit naturally into Bootstrap-based Angular projects.

## What Is Included

- DataGrid
- DataGrid grouping, aggregates, and custom group templates
- Pagination
- Typeahead
- Tree
- Splitter
- Stepper
- Chips
- Drag and drop
- Angular-native Form Builder workflows

## Positioning

This project is not affiliated with `ng-bootstrap` or `ngx-bootstrap`.

Those projects focus mainly on Bootstrap components for Angular. `@angular-bootstrap/ngbootstrap` focuses more on practical Angular UI for data-heavy apps, including DataGrid workflows, grouping, drag and drop, Form Builder scenarios, and documentation examples that map to real library APIs.

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
      [groupable]="true"
      [group]="[{ field: 'role', dir: 'asc' }]"
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

## DataGrid Highlights

- Sorting, filtering, pagination, editing, export, sticky rows and columns, and row detail workflows
- Grouping by one or more fields with grouped state events for local or server-driven data flows
- Custom group header/footer templates, aggregate output, and sticky group headers/footers
- Dependency-free PDF and Excel export defaults for common table export scenarios

## Development

```bash
pnpm install
pnpm test
pnpm build
```

Build output is written to `dist/`.
