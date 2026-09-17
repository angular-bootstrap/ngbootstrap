# Saved DataGrid views

Available in 2.3.0. ngbootstrap is MIT-licensed Angular UI for data-heavy apps. Advanced features, themes and examples remain free and open source: no component tier, license keys, watermarks or mandatory hosted service. Applications pay for their own backend and AI providers. This project is not affiliated with ng-bootstrap or ngx-bootstrap.

## Install and connect

```sh
npm install @angular-bootstrap/ngbootstrap@^2.3.0 bootstrap@^5
```

Import `Datagrid` and `NgbDataGridViewsComponent` into your standalone Angular component:

```html
<ngb-datagrid-views [grid]="invoices" storageKey="tenant-7/user-42/invoices"
  [store]="viewStore" />
<ngb-datagrid #invoices [columns]="columns" [data]="rows" />
```

```ts
import { NgbLocalStorageGridViewStore } from '@angular-bootstrap/ngbootstrap';
readonly viewStore = new NgbLocalStorageGridViewStore();
```

Omit `[store]` for memory-only views. Keep the grid instance, store and key stable for the lifetime of the control; recreate the control when switching users/tenants. Reset returns to the configuration captured when the control attached, reconciled against today's columns. No view is applied on load and changes never save automatically. Names are trimmed, nonempty and case-insensitively unique. Delete requires confirmation and retains the current grid configuration.

## API

- `grid.captureView(): NgbDataGridViewSnapshot`: detached version-1 snapshot.
- `grid.restoreView(snapshot: unknown): NgbDataGridViewRestoreResult`: success with `ignoredFields`, or failure with `reason` (`editing` or `invalid-snapshot`) and actionable `message`.
- `(viewChange)`: configuration snapshots after interactive data/layout changes and restoration. Page navigation alone does not make a saved view dirty because page number is excluded. Re-capture after application-driven input changes; inputs are not an automatic persistence mechanism.
- `ngbSerializeGridView`, `ngbDeserializeGridView`, `ngbCloneGridView`: validate and preserve Date-valued nested filters. Use these instead of raw JSON serialization of snapshots.
- `NgbDataGridSavedView`: `{ id, name, snapshot }`.
- `NgbDataGridViewStore`: asynchronous `list(key)`, `save(key, view)` and `delete(key, id)` methods.

Snapshots include the current single-column sorting descriptor, nested filters, global search, grouping and aggregate descriptors, page size, column order, hidden state, explicit widths and pinning. They omit records, selection, expanded groups/details, active edits, callbacks, templates and themes. Plain JSON-compatible values and valid Dates are supported. Cycles, functions, nonfinite numbers, custom class instances, reserved serialization keys and invalid versions fail validation before restoration changes anything.

Restoration starts at page one and emits exactly one `dataStateChange` plus one `viewChange`. Reload remote rows from `dataStateChange`; restoration does not replay individual sort/filter/page events. Server applications must enforce permissions and validate query descriptors independently. Restoring never enables local processing on a remote grid.

Removed fields are ignored throughout column, sort, filter, group and aggregate settings. New fields append with configured defaults. Current locked columns retain their position, visibility and pinning. Saved lock flags do not override application constraints. Non-reorderable columns retain their position; non-resizable columns retain their configured width; restored widths honor current minimum/maximum limits. Unlocked columns restore their saved sticky edge. Save or cancel an active inline, cell, new-row or external editor before applying/resetting a view.

## Persistence ownership

The default `NgbMemoryGridViewStore` lasts only as long as its instance. `NgbLocalStorageGridViewStore` reads browser storage only after the Views control renders, under `ngb:grid-views:<storageKey>`. Keys must distinguish grids, users and tenants. Neither storage keys nor client-side storage provide authorization or encryption. Avoid storing sensitive filter values on shared devices. Applications own cleanup, retention, authentication, synchronization and server-side access checks.

Implement `NgbDataGridViewStore` for a backend of your choice. Encode each snapshot with `ngbSerializeGridView` when sending it and decode with `ngbDeserializeGridView` on receipt. Save should upsert by ID and enforce name uniqueness within the key; reject failed writes so the control announces them. No HTTP client or endpoint is built into the library. Local storage is intended for one active writer; cross-tab transactions and conflict resolution belong in a custom adapter.

Denied storage, malformed collections, quota failures and rejected adapter operations are displayed as errors. They do not replace current grid configuration. The component does not automatically discard malformed stored data. Repair/remove that application's storage entry or recreate the control to retry loading.

## Accessibility, rendering and themes

The Views control uses native labeled select/input/button controls, a keyboard-submittable form, Escape to cancel naming, focus restoration and live status/error messages. It consumes existing `--ngb-*` tokens, including Bootstrap defaults and optional palettes. Persisted settings load after browser rendering. Server markup contains the initial configuration, never browser storage. Grid column measurements, Pager density measurements and Splitter size announcements start after browser rendering.

Grid headers and body share a grid role; drag/drop rows retain row/rowgroup roles. Keyboard sort/filter/edit controls remain available. This release does not claim complete spreadsheet keyboard navigation: cell-range navigation and selection are future work. Pointer column resizing and sticky overlays still require application-specific accessibility evaluation. Test custom templates, theme overrides, dense layouts and actual screen-reader workflows in your application.

## Planned, not currently included

Spreadsheet-style editing (ranges, clipboard, batch validation and undo), large-data virtualization/datasource caching, pivot analysis, CSV import and a reusable Form Builder engine are later roadmap priorities. Scheduler/resource planning remains an evaluation item. These are not release dates or available APIs.
