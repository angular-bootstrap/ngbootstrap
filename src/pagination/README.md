# ngbootstrap/pagination

Standalone pagination for any data source (lists, tables, custom grids).

## Components

- **`ngb-pagination`** — page buttons or page input (low-level control).
- **`ngb-pager`** — full pager bar: range info, pagination, and optional rows-per-page selector with responsive layout.

Import from `ngbootstrap/pagination` or `@angular-bootstrap/ngbootstrap/pagination`.

## `ngb-pager` example

```html
<ngb-pager
  [page]="page"
  [pageSize]="pageSize"
  [collectionSize]="items.length"
  [settings]="{ pageSizes: [10, 25, 50], info: true, buttonCount: 5 }"
  (pageChange)="page = $event"
  (pageSizeChange)="pageSize = $event; page = 1"
/>
```

`[settings]` accepts `true` for defaults or a `NgbPagerSettings` object (`buttonCount`, `info`, `pageSizes`, `previousNext`, `type`, `responsive`).

## Datagrid

The datagrid uses `ngb-pager` internally. Configure via `[pageable]` (`NgbDatagridPageableSettings`), which extends `NgbPagerSettings` with `position: 'top' | 'bottom' | 'both'`.
