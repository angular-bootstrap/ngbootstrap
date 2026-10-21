# @angular-bootstrap/ngbootstrap/pagination

Standalone pagination for any data source (lists, tables, custom grids).

## Components

- **`ngb-pagination`** — page buttons or page input (low-level control).
- **`ngb-pager`** — full pager bar: range info, pagination, and optional rows-per-page selector with responsive layout.

Import `NgbPagerComponent` or `NgbPaginationComponent` from `@angular-bootstrap/ngbootstrap/pagination` and add them to your standalone component imports.

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

## Integration and accessibility

The pager emits navigation choices; your application slices local data or fetches remote results. Keep the total count accurate, reset to page one when changing query/page size, and handle loading/errors without trapping focus. Native controls provide keyboard activation; verify labels and current-page state with your application content. Responsive measurements run after browser rendering, so test SSR/hydration when changing layout behavior.

Use [shared themes](../../THEMING.md) for styling. See [DataGrid scrolling](../../SCROLLING.md) when choosing between pagination and remote virtual windows.
