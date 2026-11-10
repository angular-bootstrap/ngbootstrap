# DataGrid contributor guidance

Applies to this subtree in addition to the [library rules](../../AGENTS.md). Public contracts are in `public-api.ts`, `src/datagrid.types.ts`, models and `src/datagrid/datagrid.component.ts`; inspect callers before changing shared state or event paths.

## Contracts to preserve

- Keep application-owned remote data separate from local operations. Never sort/filter a partial remote window as if it were the complete dataset. Test event counts and request state, not only rendered rows; application cancellation/caching remains application-owned.
- Saved views validate before mutation, preserve Date-valued nested filters, reconcile current column constraints, reject restoration during editing and restore on page one. Restoration emits one consolidated `dataStateChange` and one `viewChange`, without replaying individual sort/filter/page events. View snapshots exclude records, selection, expansion, drafts and themes.
- Configuration history and saved-edit history are distinct from persisted views. Invalid drafts and Cancel must not change committed rows, aggregates or history. Preserve `rowSave`/`historyAction` replay and atomic batch behavior. Inserts/deletes currently clear history; do not silently broaden what is undoable.
- Group moves preserve descriptor direction/aggregates and change the actual hierarchy, not just chips. Preserve unavailable boundary actions, keyboard focus and one remote notification per action.
- Detail expansion uses stable keys when configured. Preserve conditional disclosure, controlled expansion and nested-grid event/focus isolation: child navigation must not accidentally operate the parent.
- Virtual rows require supported fixed geometry; avoid full-data recomputation on each scroll. Preserve logical row indexes, spacer semantics, remote offsets and editor/detail focus. Do not claim variable-height rows or column virtualization without implementing and testing them.

## Focused verification

Run from the library root: `corepack pnpm test:ci --testPathPatterns=src/datagrid`. For changes affecting numeric editors, also run `corepack pnpm test:ci --runTestsByPath src/inputs/src/numeric-grid.spec.ts` and read [Inputs guidance](../inputs/AGENTS.md).

Select regression coverage by changed behavior:

- Views/history: `src/views/grid-view.spec.ts`, `datagrid-views.spec.ts`, `datagrid-history.spec.ts`.
- Editing/data processing: `src/services/editing.service.spec.ts`, `src/data-operations.spec.ts`, and relevant grid/batch/range suites.
- Details/scrolling/semantics: `src/datagrid/datagrid-detail.spec.ts`, `datagrid-scroll.spec.ts`, `datagrid-scroll-advanced.spec.ts`, `datagrid-a11y.spec.ts`.
- Shared presentation: token/theme and toolbar suites, plus grouped/editing/detail layouts in affected themes.

Use production browser hydration checks in the separate docs workspace for layout/focus/SSR changes. Unit mocks do not prove those behaviors. Benchmark scroll or processing changes with a stated dataset before making performance claims; full release checks remain defined at the root.

## Behavior references

Read the relevant guide: [saved views/history](../../docs/guides/saved-views.md), [batch editing](../../docs/guides/batch-editing.md), [cell ranges](../../docs/guides/cell-ranges.md), [scrolling](../../docs/guides/scrolling.md), [master-detail](../../docs/guides/master-detail.md), or [grouping controls](../../docs/guides/grouping-display-modes.md). Keep limits and application responsibilities aligned with implementation.
