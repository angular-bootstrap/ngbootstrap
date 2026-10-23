# @angular-bootstrap/ngbootstrap 2.7.0

Configure grouping layouts, edit numeric and fixed-format values, and use improved keyboard and accessible naming APIs.

## Grouping

- Choose standard or compact group display and opt into the Group toolbar picker.
- Add/remove grouping fields and move a group to the previous/next level while preserving direction and aggregates.
- Group controls support keyboard traversal, dismissal and focus restoration. Existing grouping defaults remain compatible.

## Numeric and masked inputs

- Standalone Numeric Input supports decimal, currency and percentage formats, explicit locales, bounds, stepping and Angular forms validation.
- Valid numeric drafts commit on blur/Enter. Invalid drafts preserve the previous model and expose validation errors.
- Standalone Masked Input supports fixed ASCII digit/letter/alphanumeric masks, escaped literals, raw/formatted models and Angular forms.
- Both controls support native input naming, keyboard/composition handling and shared theme tokens.
- Use custom numeric DataGrid editors with saved-edit Undo/Redo and same-currency aggregates. Persistence remains application-owned.

## Accessibility

- Tree adds visible-node navigation, roving focus, parent/child arrows, Home/End, type-ahead and correctly owned child groups.
- Stepper adds orientation-aware arrows and Home/End, respecting disabled steps and revisit restrictions.
- Typeahead adds inputId, ariaLabel, ariaLabelledBy and ariaDescribedBy for its native input, including chips mode.
- Splitter panes add paneId and ariaLabel; resize separators name and reference the preceding pane.

## Compatibility and limits

Angular 21/22 remain supported peers. No runtime dependencies were added. Existing default grid editors and Bootstrap styling remain unchanged.

Numeric models use JavaScript numbers, not arbitrary-precision decimals; percentage models use fractions. Masks validate fixed ASCII formats, not the existence of a phone number or identifier. Dynamic masks, country detection and arbitrary precision are deferred. Broader DataGrid APG coverage and Typeahead virtual/multi-select accessibility work remain planned. Manual screen-reader checks were optional and were not performed; no blanket WCAG certification is claimed.

## Guides

- [Grouping display modes](docs/guides/grouping-display-modes.md)
- [Numeric and masked inputs](docs/guides/inputs.md)
- [Saved views and Undo/Redo](docs/guides/saved-views.md)
- [Master-detail](docs/guides/master-detail.md)
- [Feature guide index](docs/guides/README.md)

All features, themes and examples remain MIT-licensed. Applications own backend and AI-provider costs. See [CHANGELOG.md](CHANGELOG.md) for previous releases.
