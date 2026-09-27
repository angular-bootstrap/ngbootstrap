# @angular-bootstrap/ngbootstrap 2.3.0

Saved DataGrid views for data-heavy Angular applications, free and open source under MIT.

- Include committed existing-row edits in Undo/Redo, with rowSave historyAction events, validation and conflict protection.
- Support grid-scoped Undo/Redo keyboard shortcuts with native editor protection and an application opt-out.
- Keep header/body columns aligned with both overlay and classic scrollbars.
- Add opt-in DataGrid configuration Undo/Redo with bounded history, duplicate suppression, active-editor protection and reactive availability signals.
- Save and restore sorting, nested Date filters, search, groups/aggregates, page size and column layout.
- Use the standalone Views control for named layouts, explicit saving, rename, confirmed deletion and reset.
- Choose memory-only, opt-in local storage, or an application-owned async persistence adapter.
- Restore on page one with one remote-data notification; reject active edits and invalid snapshots before applying state.
- Reconcile removed/new columns while honoring current width, reordering and locking constraints.
- Defer Grid, Pager and Splitter layout measurements until browser rendering; preserve row semantics with drag/drop.
- Include development dependency security fixes from the post-2.2.0 maintenance work.

No new runtime dependencies. Angular 21/22 and Bootstrap default appearance remain supported.
Advanced features, themes and examples stay MIT-licensed. No paid component tier, keys, watermarks or mandatory hosted service.
Applications own backend/AI-provider costs, persistence authorization and retention.

See [SAVED_VIEWS.md](SAVED_VIEWS.md) for installation, APIs, persistence and accessibility limitations.
Spreadsheet editing, virtualization, pivot, CSV import and the reusable Form Builder engine are later planned milestones, not part of 2.3.0.
