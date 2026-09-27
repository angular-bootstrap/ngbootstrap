# DataGrid batch editing

Available in v2.4.0. Stage clipboard changes, validate the whole batch, and apply
or discard it. No new dependencies or external services are required.

## Connect the library controls

Import `Datagrid`, `NgbGridBatchEditingDirective`, `NgbDatagridToolbarComponent`,
`NgbGridBatchApplyToolDirective` and `NgbGridBatchDiscardToolDirective`.

```html
<ngb-datagrid #grid ngbGridBatchEditing #batch="ngbGridBatchEditing"
  cellSelection="range" [enableEdit]="true" [trackBy]="rowKey"
  [columns]="columns" [data]="rows" (batchSave)="persistBatch($event)">
  <ngb-datagrid-toolbar [grid]="grid" ariaLabel="Batch editing">
    <button ngbGridBatchApplyTool>Apply changes</button>
    <button ngbGridBatchDiscardTool>Discard</button>
  </ngb-datagrid-toolbar>
</ngb-datagrid>
<p role="status">{{ batch.message() }}</p>
```

`rowKey` must return a unique stable string or finite number. Use the default edit
service (no editService input), an ungrouped table and no detail/sticky/stacked/reordering layout.

## Clipboard and drafts

Select cells, then use the browser's normal copy/paste shortcuts. Text editors
keep their native clipboard behavior. Copy returns raw primitive values and ISO
Dates, not template HTML. `clipboardFormat(value, row)` and `clipboardParse(text,
row)` column hooks customize conversion; both receive detached row copies.
Declarative ngb-grid-column definitions also accept these hooks.

Paste starts at the upper-left cell of the selected range. It stages one rectangle
without repeating or truncating it to the selection size. Pasting over existing
drafts replaces their proposed values. A failed parse or protected target leaves
existing drafts intact. A validation failure retains the newly staged drafts for
correction. Changes preview in normal cells with a dashed draft border; custom
cell templates should read `$implicit` for the proposed value (their `row` context
still represents the committed row).

Defaults: finite decimal numbers; true/false or 1/0 booleans; ISO dates or UTC ISO
timestamps; select-option values by exact string match. Empty numeric/date values
become null and required rules still apply. Formula-like text remains literal;
the grid never evaluates formulas.

Paste limits are 10,000 cells and 1 MiB of UTF-8 text; pending drafts are also capped
at 10,000 changed cells. Quoted tabs, quotes and multiline cells are supported.
Ragged matrices, malformed quotes, overflows and identity changes are rejected.
Rows must contain cloneable plain objects/arrays, primitives and valid Dates.

## API and validation

- `stagePaste(text): NgbGridBatchResult` stages text supplied by a user or app.
- `copySelection(): NgbGridClipboardResult` returns text for an application-owned
  fallback when native clipboard access is denied. No permissions are requested.
- `applyBatch(): Promise<NgbGridBatchResult>` validates and commits once, or leaves
  all committed rows unchanged. Concurrent Apply calls are rejected.
- `discardBatch()` cancels pending validation and clears drafts without changing rows.
- `pendingCount()`, `validating()`, `errors()`, `message()` and `canApply()` are
  read-only signals. Errors include rowId, field and message for custom summaries.
- `batchValidator(changes, signal)` optionally returns cell errors synchronously or
  as a Promise. Honor the AbortSignal for cancellation. Exceptions reject Apply
  without losing drafts. A stale completion after Discard or grid changes cannot commit.
- `batchResult` on the directive reports native clipboard failures/paste results;
  the Apply tool also emits a result. Programmatic methods return their result.

The grid's current required and type validators run before commit. Data/configuration
changes invalidate pending drafts without discarding them. Apply then asks the user
to discard and paste again. Save/cancel any active row editor before staging; while
drafts exist, apply/discard before opening a row editor or restoring a saved view.

## Persistence and current limitations

One `batchSave` event carries all original/updated rows and stable row IDs after a
successful local Apply. The grid replaces its local rows without mutating the original bound array; update application state from the event. No rowSave or dataStateChange is emitted for the same batch.
The app owns backend persistence, transactions and failure recovery; on backend
failure, reload authoritative data and clear history before further editing.
Batch editing does not support custom edit services or a server transaction adapter.

Add `ngbGridHistory` and the existing Undo/Redo toolbar tools to record each Apply
as one atomic command. Replays emit one `batchSave` with `historyAction` set to
`undo` or `redo`; persist these changes through the same backend handler. Drafts
and ranges are never recorded. Current validators, permissions and row identities
are rechecked before replay. Conflicts or validation failures preserve the command
and leave every committed row unchanged.

For application buttons use `await history.undoAsync()` / `redoAsync()`; toolbar
and keyboard tools choose the async path automatically. Existing synchronous
`undo()` / `redo()` still work for settings and single rows; they return
`async-required` for a batch. The `busy()` signal disables tools during replay.
Apply/discard drafts before replay; Discard also cancels a replay under validation.

The step limit still defaults to 20. Batch history additionally retains at most
50,000 changed cells and 10 MiB of estimated UTF-16 JSON snapshot payload across
both stacks. Oldest commands are evicted first. A single batch exceeding this
budget saves normally but clears history with a visible error. This is a payload
budget, not an exact JavaScript heap limit. Full-row snapshots include unchanged
fields, so avoid attaching large binary/text payloads to grid rows.

Apply/Discard are native labeled buttons with disabled/busy states. Cell errors
are visible and marked aria-invalid; messages use the grid's existing live region.
Test keyboard and assistive-technology workflows in your application, especially
when supplying custom cells or controls. Touch-drag selection is not supported.
Use pagination for large datasets; batch editing does not virtualize rows.
