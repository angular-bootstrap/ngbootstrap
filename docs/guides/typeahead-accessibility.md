# Typeahead keyboard and accessibility

Name the native input with `inputId` and an external label, `ariaLabel`, or `ariaLabelledBy`. Associate help and errors with `ariaDescribedBy`. Placeholder text is not an accessible label.

With the popup open, arrows move the active suggestion, Home/End reach the result boundaries, Enter selects and Escape closes. Suggestions are not separate Tab stops. Native input composition is preserved.

In chips mode, removal buttons include the item name and return focus to the input. `updateOnTab` retains focus only when it adds a token; empty/rejected Tab and Shift+Tab leave normally. Set `[updateOnTab]="false"` to disable Tab-to-add. Disabled chips cannot be removed individually; Clear remains a bulk reset. A disabled control cannot change selection.

Virtual options expose their position and total within the loaded, filtered results after `limit`. Keyboard navigation mounts its target before referencing it. Manual scrolling clears an active descendant that leaves the mounted window. This is not a remote-total API. Application data must use unique, stable item IDs.

Use noninteractive content inside option templates. Multi-select and chips combine a combobox with a selection list; test the configured workflow with your assistive technology. These behaviors do not establish complete APG or WCAG conformance.
