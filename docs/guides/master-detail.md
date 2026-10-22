# DataGrid master-detail

Available in v2.6.0. Existing `ngbRowDetail` templates and `singleExpand` remain compatible.

Import `Datagrid`, `NgbRowDetailTemplate` and `ColumnDef` from `@angular-bootstrap/ngbootstrap` and add the standalone declarations to your component imports.

```html
<ngb-datagrid #orders [data]="rows" [columns]="columns"
  [detailRowPredicate]="hasDetails" [singleExpand]="true"
  (detailChange)="onDetailChange($event)">
  <ng-template ngbRowDetail let-order let-index="index">
    <p>{{ order.deliveryNote }}</p>
    <button type="button" (click)="orders.collapseRow(index)">Close details</button>
  </ng-template>
</ngb-datagrid>
```

Define `hasDetails = (order: Order) => !!order.deliveryNote`. Keep the predicate pure and inexpensive because the grid evaluates it while rendering. A rejected row keeps the utility cell alignment but has no disclosure button. Content is created only for expanded, mounted rows.

## Expansion API

- `expandRow(index)` / `collapseRow(index)` return true when the expansion state changes; invalid indexes and repeated requests return false. `expandRow` respects the predicate and collapses previous rows when `singleExpand` is enabled.
- `toggleExpand(index)` remains available for existing integrations.
- `detailChange: NgbDataGridDetailChange<T>` emits `{ row, index, expanded }` once per changed row. Accordion collapse events precede the new expansion event. Repeated calls emit nothing. Predicate, paging and data input changes do not emit this event; it reports explicit expansion API/button transitions.
- Indexes refer to the processed current page. With `detailRowKey`, expansion follows stable keys instead. Without that selector, indexes are not database IDs and expansion is not stable-record persistence. Close details before replacing, paging, sorting or filtering data when retaining a page-position expansion is inappropriate. Saved views and Undo/Redo exclude expansion.
- Expansion state may be set before a detail template is attached for compatibility; no detail content renders without `ngbRowDetail`.

Applications own lazy requests, caching, authentication, cancellation, loading and errors. Use `detailChange` to request data and key results by a stable record ID. Cancel/ignore stale requests and make retry an explicit action. The grid does not call an endpoint or persist details. Template controls must have labels and application handlers.

## Accessibility and constraints

Disclosure buttons support normal Tab/Shift+Tab and Enter/Space activation. Expanded buttons link to their rendered detail rows with IDs scoped to the grid instance. Tab moves into native controls in the detail template. Using `collapseRow` or the disclosure to close a detail that contains focus returns focus to its disclosure; closing an unrelated row does not move focus. Enable `keyboardNavigation` on both grids. Enter on the focused detail cell enters the child grid’s active data cell; Escape from a plain child data cell returns to the parent detail cell without collapsing it. Interactive controls and editors retain their own shortcuts. Empty child grids have no data cell to enter; use Tab for their controls.

Deterministic IDs require the same initial grid/component tree on server and client. Multiple independently bootstrapped Angular applications on a page should use distinct `APP_ID` values. Test custom templates, nested grids and conditional rendering with your application's hydration and focus flow.

Sticky/locked columns cannot be combined with detail templates. Local virtual rendering uses `detailRowHeight` (160px by default) and scrolls overflow within that height. Flat remote windows do not support detail geometry; see [scrolling](scrolling.md). Group/detail row counts are reported as unknown; this is not a complete APG grid navigation implementation. Row detail content is application-owned, including any nested grid's data and keyboard behavior.

## Expanded state

Provide a pure `detailRowKey: NgbDataGridDetailKeySelector<T>` selector returning a unique nonempty string or finite number. Bind `expandedDetailKeys` and handle `expandedDetailKeysChange` to keep application state synchronized:

```html
<ngb-datagrid [data]="rows" [columns]="columns"
  [detailRowKey]="orderKey" [expandedDetailKeys]="expandedKeys()"
  (expandedDetailKeysChange)="expandedKeys.set($event)">
  <ng-template ngbRowDetail let-order><p>{{ order.deliveryNote }}</p></ng-template>
</ngb-datagrid>
```

For example, `orderKey = (order: Order) => order.id` and `expandedKeys = signal<readonly NgbDataGridDetailKey[]>([1041])`. Invalid keys are ignored. Replace arrays immutably. Input changes do not emit events. Keys survive sorting, paging and object replacement; applications remove obsolete keys when records are deleted. `singleExpand` clears all other keys when opening a row, including off-page keys, but does not normalize supplied initial keys. Off-page key removal has no `detailChange` row event. Persistence remains application-owned; no browser storage is written automatically.
