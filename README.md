# @angular-bootstrap/ngbootstrap

> Latest patch: v2.5.2 improves Typeahead accessibility semantics and updates development dependencies. See [release notes](./RELEASE_NOTES.md).

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
- AI UI: Prompt Box, Chat, draft workspace, inline edits, and reviewed Smart Paste
- Drag and drop
- Angular-native Form Builder workflows

## Positioning

This project is not affiliated with `ng-bootstrap` or `ngx-bootstrap`.

Those projects focus mainly on Bootstrap components for Angular. `@angular-bootstrap/ngbootstrap` focuses more on practical Angular UI for data-heavy apps, including DataGrid workflows, grouping, drag and drop, Form Builder scenarios, and documentation examples that map to real library APIs.

## Requirements

For shared Bootstrap, Material, and Tailwind themes, palette swatches,
installation, the optional Tailwind v4 utility preset, and CSS overrides, see the [theme reference and audit](THEMING.md).

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
import { Datagrid, type ColumnDef } from '@angular-bootstrap/ngbootstrap';

@Component({
  selector: 'app-users-grid',
  standalone: true,
  imports: [Datagrid],
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
corepack pnpm install --frozen-lockfile
corepack pnpm lint
corepack pnpm test:ci
corepack pnpm build
corepack pnpm release:verify
corepack pnpm security:audit
```

Use Node 22 and the pinned pnpm version. Build output is `dist/ngbootstrap`. Read [CONTRIBUTING.md](https://github.com/angular-bootstrap/ngbootstrap/blob/main/CONTRIBUTING.md) and [AGENTS.md](https://github.com/angular-bootstrap/ngbootstrap/blob/main/AGENTS.md) before editing; maintainers follow [RELEASE_PLAN.md](https://github.com/angular-bootstrap/ngbootstrap/blob/main/RELEASE_PLAN.md) before publishing.

For provider-independent assistant controls and request lifecycle guidance, see the [AI UI reference](src/ai/README.md).

## Saved views and open-source scope

[Saved DataGrid views](SAVED_VIEWS.md) add named invoice/workspace layouts, Date-safe snapshots and explicit memory, local-storage or custom persistence in 2.3.0.

Advanced features, themes and examples are MIT-licensed: no paid component tier, license keys, watermarks or mandatory hosted service. Applications own backend and AI-provider costs. Later roadmap capabilities are marked as planned in the saved-views guide.

## Batch editing (2.4.0)

[Batch editing](BATCH_EDITING.md) adds opt-in clipboard drafts, validation, Apply/Discard and atomic Undo/Redo for existing rows. [Cell ranges](CELL_RANGES.md) support current-page selection with mouse and keyboard. Applications own persistence; use pagination for batch editing on large datasets. [Virtual scrolling](SCROLLING.md) is a separate rendering mode and does not support batch editing.
