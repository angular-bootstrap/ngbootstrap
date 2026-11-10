# Inputs contributor guidance

Applies to numeric/masked controls in this subtree in addition to the [library rules](../../AGENTS.md). Read [the inputs guide](../../docs/guides/inputs.md), `index.ts` and the affected component before changing forms or parsing behavior.

## Value and forms contracts

- Preserve CVA and Validator behavior alongside standalone `value`/`valueChange` usage. Test each supported binding approach separately. External writes must not echo user changes; touched, disabled, read-only and validation state must remain consistent on the native input.
- Numeric model is `number | null`. Draft text commits on blur/Enter or `commit()`; invalid/incomplete/nonfinite/out-of-range drafts stay visible without replacing the model. Preserve one `valueChange` per effective commit, including no-op commits. Enter commits the field without accidentally saving its grid row.
- Percent values are fractions and step uses model units. Preserve locale separators/grouping validation and rounding to display precision, including percentage rounding. Use the same explicit locale server/client. Wheel scrolling must not alter values.
- Masked model is `string | null`; preserve raw/formatted modes, fixed ASCII token grammar and escaped literals. Valid partial text can update the model while remaining invalid; invalid/excess text retains the prior model. Do not replace this with numeric-style commit semantics.
- Preserve native selection, paste, caret behavior, Backspace/Delete across mask literals and buffered IME composition. Do not implement dynamic masks, country detection or arbitrary-precision arithmetic as incidental parser fixes; these require a separate design.
- IDs from `src/input-ids.service.ts` must remain deterministic for equivalent SSR/client trees. Preserve explicit IDs and label/description relationships, numeric spinbutton metadata and masked native-text semantics.

## Grid integration and verification

Custom numeric editors bind the grid's existing form control. Save and saved-edit Undo/Redo update committed aggregates; invalid drafts and Cancel leave totals unchanged. Read [DataGrid guidance](../datagrid/AGENTS.md) when changing this boundary. JavaScript number precision and currency validation remain documented limits; formatting is not exact accounting arithmetic.

From the library root run `corepack pnpm test:ci --testPathPatterns=src/inputs`:

- `src/inputs.spec.ts`: parsing/formatting, limits, modes, composition and keyboard behavior.
- `src/accessible-controls.spec.ts`: native naming, state and relationships, including related Typeahead/Splitter regressions.
- `src/numeric-grid.spec.ts`: invalid/save/cancel/history and grouped totals.

For DOM, ID, caret or locale changes, verify actual browser interaction and production SSR/hydration in the docs workspace. Add boundary tests for the changed parsing behavior instead of only asserting formatted happy paths. Preserve existing default editors for other grid fields.
