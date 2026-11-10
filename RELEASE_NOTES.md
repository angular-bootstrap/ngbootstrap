# @angular-bootstrap/ngbootstrap 2.7.1

Accessibility, keyboard behavior and package maintenance. Released November 10, 2026.

- Typeahead announces virtual option positions, retains stable active-item identity and uses hydration-safe IDs. Chip removal returns input focus; empty/rejected Tab and Shift+Tab leave normally, and IME composition is preserved.
- DataGrid Ctrl+Home/End reach corner cells. Removed navigation cells recover focus without taking it from external controls. Correct multiple-selection state, detail column naming and remote loading-row indexes.
- Package the MIT LICENSE and validate it against the source file.
- Patch vulnerable build/test dependencies. Runtime dependencies and Angular 21/22 peers are unchanged. One low-severity deepmerge advisory remains in Jest tooling; full APG navigation and manual screen-reader certification are not claimed.

No application migration is required. Code should not rely on generated Typeahead popup ID strings. Existing Tab-to-add still works when a token is added; set `updateOnTab=false` for ordinary form Tab behavior.

See [Typeahead accessibility](docs/guides/typeahead-accessibility.md), the [feature guides](docs/guides/README.md), and [changelog](CHANGELOG.md). All features remain MIT-licensed.
