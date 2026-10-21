# @angular-bootstrap/ngbootstrap 2.5.2

Typeahead suggestions now expose option roles and listbox multi-selection state. Suggestions remain outside the tab order while the combobox uses active-descendant navigation. Regression coverage checks these relationships and focus behavior.

Development-tool dependencies were patched, including removal of the vulnerable legacy sprintf-js dependency from the coverage configuration loader. No new runtime dependency or breaking public API is introduced.

This patch does not claim complete WAI-ARIA or WCAG conformance. Applications still need to verify accessible naming, custom templates, themes and end-to-end keyboard/focus flows.

## Available feature guides

- [Scrolling and virtualization](docs/guides/scrolling.md): local rows, remote windows, complete grouped trees and fixed-height details, with explicit compatibility limits.
- [Saved views and Undo/Redo](docs/guides/saved-views.md): configuration snapshots, optional persistence and committed-edit history.
- [Cell ranges](docs/guides/cell-ranges.md) and [batch editing](docs/guides/batch-editing.md): clipboard drafts, validation and atomic history for supported regular-table layouts.
- [Shared themes](docs/guides/theming.md) and [AI controls](src/ai/README.md): Bootstrap defaults, optional palettes and provider-independent UI.

See [CHANGELOG.md](CHANGELOG.md) for earlier releases. Angular 21/22 are supported peers. All features, themes and examples remain MIT-licensed, with no paid tier or mandatory hosted service. Applications own backend and AI-provider costs.
