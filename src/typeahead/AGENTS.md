# Typeahead contributor guidance

Applies alongside the [library rules](../../AGENTS.md). Read the [keyboard and accessibility guide](../../docs/guides/typeahead-accessibility.md), component and chips integration before changing selection or focus.

- Preserve single/multiple selection, standalone events and forms/CVA contracts. External writes must not echo user changes; disabled controls cannot change selection. Keep item identity based on stable application IDs.
- Name the native input through `inputId`/label, `ariaLabel` or `ariaLabelledBy`, with help/errors through `ariaDescribedBy`. Placeholder text is not a label. Preserve app-scoped deterministic popup IDs across SSR/hydration.
- Keep DOM focus on the combobox during suggestion navigation. Its active descendant must reference a mounted option for the same item; mount keyboard targets first and clear references when scrolling/removal unmounts them. Suggestions are not extra Tab stops.
- Virtual positions/totals describe loaded filtered results after `limit`, not a remote total. Keep spacers hidden from accessibility APIs and option content noninteractive; do not restore nested checkbox inputs inside options.
- Preserve native text editing and IME. Chips `updateOnTab` retains focus only when a token is actually added; empty/rejected Tab and Shift+Tab leave normally. Keep single-select Tab behavior distinct.
- Chip removal must name the item, honor disabled state and return focus to the input. Preserve selection announcements without announcing every keystroke. Shared chips changes require checking other consumers.

From the library root run `corepack pnpm test:ci --testPathPatterns=src/typeahead` and `corepack pnpm test:ci --runTestsByPath src/inputs/src/accessible-controls.spec.ts`. Cover replacement results, virtual scrolling, multi-select, chips, disabled state and forms. For focus/IDs/virtual DOM changes, verify the actual browser and docs SSR/hydration harness. Document limitations without claiming complete APG/WCAG conformance.
