# @angular-bootstrap/ngbootstrap/datagrid

Import from `@angular-bootstrap/ngbootstrap/datagrid` or the root `@angular-bootstrap/ngbootstrap` package.

## Data binding

Bind row data with `[data]` and `ColumnDef[]` on `[columns]` (local, in-memory binding).

- **Local:** pass the full array; sorting, filtering, and paging run in the grid.
- **Remote:** fetch in the parent, assign each page to `[data]`, set `[total]` to the full result count, and handle `(pageChange)` to load the next page. When `total > data.length`, the grid skips client-side page slicing.
- **`[loading]`:** set while fetching; shows an overlay and `aria-busy` on the root.
- **`[trackBy]`:** stable row identity for selection and efficient row rendering.
- **`externalFiltering` / `filterManual`:** parent-owned filtering with `filterChange` events.

```typescript
@Component({
  template: `
    <ngb-datagrid
      [columns]="columns"
      [data]="orders"
      [loading]="loading"
      [total]="totalCount"
      [pageable]="true"
      (pageChange)="loadPage($event.page, $event.pageSize)"
    />
  `,
})
export class OrdersPage {
  orders: Order[] = [];
  totalCount = 0;
  loading = false;

  loadPage(page: number, pageSize: number): void {
    this.loading = true;
    this.http.get<PageResult>('/api/orders', { params: { page, pageSize } }).subscribe((res) => {
      this.orders = res.items;
      this.totalCount = res.total;
      this.loading = false;
    });
  }
}
```

## Filtering

The datagrid supports descriptor-based filtering with legacy compatibility:

- Basic filtering: bind a `filter` descriptor and let the grid filter locally.
- Filter row: set `filterable` to `true` or `'row'` for per-column operator + value controls.
- Filter menu: set `filterable="menu"` for popover-style header menus.
- Manual filtering: set `filterManual` to emit `filterChange` without applying the filter locally.
- External filtering: set `externalFiltering` when the parent owns the filtered dataset.
- Custom row/menu filters: use `<ng-template ngbFilter="field">` (or `ngbFilterMenu`) and the `FilterCtx`
  (`filter`, `filterChange`, `setFieldFilter`, or `ngbSetFieldFilter` / `ngbFlattenFilterDescriptors` helpers).
- Column resizing: set `[resizable]="true"` and explicit `width` on each column; optional `minResizableWidth` /
  `maxResizableWidth`; call `autoFitColumnsToGrid()` to expand or shrink columns to the grid viewport.
- Column reordering: set `[columnReorderable]="true"`; drag the header grip handle; listen to `columnReorder`; set
  `reorderable: false` on columns that must stay fixed in place; call `reorderColumn(column, index, { before })` or
  `moveColumn(from, to)` for programmatic reordering.
- Pagination: bind `[pageable]` to `true` or `NgbDatagridPageableSettings` (`buttonCount`, `info`, `pageSizes`,
  `previousNext`, `type`, `responsive`, `position`). Pass custom values in `pageSizes`; the active `[pageSize]` is added
  to the dropdown when missing. Responsive paging (default) hides info and page-size controls as the footer narrows;
  set `responsive: false` to wrap all controls instead. Use `<ng-template ngbPager>` for a fully custom pager (disables
  built-in responsive behavior).

Preferred advanced API:

- Inputs: `filterable`, `filter`, `filterOperators`, `filterManual`, `externalFiltering`
- Output: `filterChange`

Compatibility API still supported:

- `enableFiltering`, `enableGlobalFilter`, `filtersChange`

## Columns

The datagrid supports both dynamic and declarative columns:

- Dynamic columns: pass `columns: ColumnDef[]`
- Declarative columns: place `ngb-grid-column` elements inside `ngb-datagrid`

Column capabilities:

- `hidden`: remove a column from rendering while preserving its definition
- `sticky: true | 'start' | 'end'`: pin columns to the start or end edge
- `locked: true`: freeze a column on the leading edge

Sticky and locked columns require explicit `width` values on all visible columns.
Locked columns also require at least one visible unlocked column.
Detail row templates are not supported together with sticky or locked columns.

## Feature guides and accessibility

- [Saved views and Undo/Redo](../../docs/guides/saved-views.md)
- [Cell ranges](../../docs/guides/cell-ranges.md) and [batch editing](../../docs/guides/batch-editing.md)
- [Scroll modes, remote windows and virtualization](../../docs/guides/scrolling.md)
- [Shared themes](../../docs/guides/theming.md)

Set an appropriate `tableOptions.caption` for the grid name. Headers/cells expose grid semantics and state, but the default grid is not a full APG spreadsheet keyboard implementation. Range selection is opt-in; virtual rows expose logical indexes while only mounted content is available to browser Find and assistive-technology browse mode. Preserve native input/clipboard behavior in custom editors and test focus across sorting, grouping, details and remote updates.

The remote-binding snippet above illustrates application responsibilities, not a complete standalone component: provide `Order`, `PageResult`, columns, HttpClient setup and an initial load. Cancel stale requests, handle errors and release subscriptions in production. Use `dataStateChange` for consolidated remote query state, and only `virtualRangeChange` for virtual remote fetching, to avoid duplicate requests.
