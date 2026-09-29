# DataGrid scrolling (2.5.0)

Import `Datagrid`, `ColumnDef` and the relevant request types from
`@angular-bootstrap/ngbootstrap`. All features remain MIT licensed.

## Choose a mode

- `scrollable="scrollable"` (or `true`, the default): separate header and body;
  all loaded rows render. `height` fixes the body viewport in pixels.
- `scrollable="none"` (or `false`): header and rows share a single table with
  natural height, without an internal scrolling viewport.
- `scrollable="virtual"`: renders a buffered window, with spacers for other rows.

`height` describes the body, not toolbars/pagers. Without it, regular mode has a
24rem maximum and virtual mode uses 384px. `maxHeight` sets a content-sized
maximum in regular mode; an explicit `height` takes precedence. Set column widths
when horizontal scrolling is required; the header follows the body horizontally.

```html
<ngb-datagrid [data]="rows" [columns]="columns" [trackBy]="trackRow"
  scrollable="virtual" [height]="384" [virtualRowHeight]="48"
  [virtualOverscan]="5" [enablePagination]="false" />
```

`trackRow = (_index: number, row: Inventory) => row.id` uses your row type.
`virtualRowHeight` defaults to 48px (minimum 32), including borders. Overscan
is 5 by default, bounded to 0–100. Templates must fit that height. Use responsive
cell templates that shorten/hide content without changing the row geometry.

Local data uses the existing sorting/filtering/grouping pipeline. All records
remain in memory; virtualization reduces DOM work, not the cost of processing
arrays. With paging, only the current page is virtualized.

## Remote windows

```html
<ngb-datagrid [data]="windowRows" [columns]="columns" [trackBy]="trackRow"
  scrollable="virtual" [height]="384" [virtualRemote]="true"
  [virtualSkip]="windowOffset" [total]="filteredTotal"
  [virtualPageSize]="60" [virtualDebounce]="100" [loading]="loading"
  [enablePagination]="false" (virtualRangeChange)="requests.next($event)" />
```

`NgbDataGridVirtualRange` has `skip`, `take` and `state`. Fetch that range and bind
`data`, `virtualSkip` and the filtered `total` together. `virtualPageSize` defaults
to 60, with a minimum buffer of three visible viewports plus overscan. Requests
are debounced by `virtualDebounce` (80ms default). Browser rendering starts the
first request; SSR does not fetch. Remote arrays are already processed: the grid
does not locally filter or sort a partial response.

Use `switchMap` with HttpClient, or a request ID, to prevent older responses from
replacing newer results. Handle errors inside the inner observable so later
requests continue. Bind `loading`, announce an application error, retain the last
valid result, and retry with `requestVirtualRange(true)`. Cache keys must include
the query state and range. No endpoint, cache, or runtime dependency is imposed.
Use only `virtualRangeChange` for fetching in this mode; handling both it and
`dataStateChange` would make duplicate requests. Query changes request the first
range; responses preserve scroll position. Remote windows use the full result
scrollbar; for a pager, use ordinary server paging with `virtualRemote=false`.

Unloaded rows show skeletons. Customize them with `[loadingCellTemplate]`, a
`TemplateRef` whose implicit value is the column and whose `index` is the absolute
row index. Loading is application-owned. A zero total shows the normal empty state.

## Grouping and details

Virtualization supports local grouping and complete server-provided `groupedData`
trees. Group headers/footers use `virtualRowHeight`; keep templates within it.
`expandGroup(0)` and `collapseGroup(0)` address a root group. Nested paths such as
`[0, 1]` address sibling indexes. Both return false for an invalid path.
`setAllGroupsExpanded(false)` collapses roots; true clears all collapsed keys.

Expanded details use `detailRowHeight` (160px default, minimum 32). Detail content
scrolls within that height; its space is included in virtual offsets. Flat remote
windows cannot describe unloaded group/detail geometry. Load the complete tree
or detail data with `virtualRemote=false` for these features.

## Endless loading and programmatic navigation

`scrollBottom` emits once at the bottom for each appended collection, and re-arms
when scrolling away. Ignore it while a request is pending or when all records are
loaded. Append with a new array; preserve existing rows after errors. Provide a
Load more button for keyboard users. Endless scrolling retains every appended row;
virtualization is preferable for unbounded lists.

- `scrollToRow(index)` addresses the processed page (absolute index in remote mode).
- `scrollTo({row, column})` also accepts a zero-based visible-column index.
- `scrollToItem({idField, id})` finds an item in the loaded processed page. Resolve
  unloaded remote IDs to indexes in the application, then use `scrollToRow`.

These methods return false for invalid targets, disabled scrolling or a viewport
that is not ready. They do not change pages. Remote jumps can request new windows.
`virtualScrollActive` and `virtualScrollFallbackReason` expose the effective mode.

## Accessibility and limits

Arrow keys and Ctrl+Home/End render offscreen destinations before focusing. Remote
boundary navigation requests the destination and focuses it after the response.
Rows expose logical ARIA indexes; spacer rows are hidden from assistive technology.
Group/detail counts are reported as unknown. Browser Find and screen-reader browse
mode only inspect mounted rows; use grid search or regular rendering for full DOM
access. SSR uses deterministic initial markup without measuring browser layout.

Sticky rows, reordering, cards/stacked layouts, adding, batch and inline/in-cell/
toolbar editing fall back to regular rendering with a visible message. External
editing, selection, pinned columns, themes and pagination remain supported.
Variable row heights and column virtualization are not supported. Browsers impose
maximum scroll heights; filter or page exceptionally large results. Scroll settings
and offsets are not included in saved views or Undo/Redo.
