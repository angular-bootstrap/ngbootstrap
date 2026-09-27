# @angular-bootstrap/ngbootstrap 2.4.0

Update multiple existing records through opt-in DataGrid range selection and batch editing.

- Select a current-page rectangle with the mouse or keyboard and copy/paste tab-separated values.
- Keep clipboard drafts separate from committed rows, with typed conversion and column hooks.
- Validate the whole batch, including cancellable async validation; Apply commits once and Discard leaves rows unchanged.
- Treat each successful Apply as one Undo/Redo command, with conflict protection and validation during replay.
- Customize Apply, Discard, Undo and Redo buttons in the existing grid toolbar.
- Use consistent Add buttons in External and Toolbar editing, with one decorative plus icon.

One `batchSave` event reports each local commit or replay. Applications own server persistence,
authorization, transactions and recovery; the grid does not wait for a server response.
Requires stable unique trackBy IDs, the default edit service and a regular ungrouped table.
No cross-page paste, new-row insertion, formulas or virtualization. Paste is limited to
10,000 cells / 1 MiB; history has step and payload limits. See [BATCH_EDITING.md](BATCH_EDITING.md)
and [CELL_RANGES.md](CELL_RANGES.md) for setup, keyboard behavior and limitations.

Existing editing modes and synchronous history APIs remain compatible. Use async history
methods for batch commands; the supplied toolbar tools and shortcuts do this automatically.
Angular 21/22, Bootstrap defaults and shared themes remain supported. No new runtime dependency.
All features, themes and examples remain MIT-licensed, without license keys or a paid tier.
