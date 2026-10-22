# @angular-bootstrap/ngbootstrap 2.6.0

Build master-detail grids with conditional disclosure, controlled expansion and nested keyboard navigation.

- Use `detailRowPredicate` to show details only for eligible records.
- Use `detailRowKey`, `expandedDetailKeys` and `expandedDetailKeysChange` to retain expansion through sorting, paging and immutable data refreshes.
- Call `expandRow(index)` or `collapseRow(index)` and observe typed `detailChange` events for explicit current-page transitions.
- Enable keyboard navigation on parent and child grids: Enter on the detail cell enters the child; Escape from a plain child cell returns to the parent. Editors keep their own shortcuts.
- Disclosure IDs are scoped to each grid. Collapsing focused detail content restores disclosure focus, and parent cell navigation no longer targets nested-grid cells.

Existing templates and index-based expansion remain compatible. No runtime dependencies were added. Applications own child-data loading and expansion persistence. Details remain incompatible with pinned columns and flat remote virtual windows; local virtualization requires fixed detail heights. This release does not claim complete APG or WCAG conformance.

## Available feature guides

- [Master-detail](docs/guides/master-detail.md): nested grids, conditional display, keyed expansion, events and keyboard support.
- [Scrolling and virtualization](docs/guides/scrolling.md): local rows, remote windows, complete grouped trees and fixed-height details, with explicit compatibility limits.
- [Saved views and Undo/Redo](docs/guides/saved-views.md): configuration snapshots, optional persistence and committed-edit history.
- [Cell ranges](docs/guides/cell-ranges.md) and [batch editing](docs/guides/batch-editing.md): clipboard drafts, validation and atomic history for supported regular-table layouts.
- [Shared themes](docs/guides/theming.md) and [AI controls](src/ai/README.md): Bootstrap defaults, optional palettes and provider-independent UI.

See [CHANGELOG.md](CHANGELOG.md) for earlier releases. Angular 21/22 are supported peers. All features, themes and examples remain MIT-licensed, with no paid tier or mandatory hosted service. Applications own backend and AI-provider costs.
