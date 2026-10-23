# Numeric and masked inputs

Import standalone controls from `@angular-bootstrap/ngbootstrap` with Angular's `ReactiveFormsModule` or `FormsModule`. Both support ControlValueAccessor, disabled/touched state, Angular validation, and `value`/`valueChange` for applications without forms. Use one binding approach per control.

## Numeric input

```html
<ngb-numeric-input label="Transfer amount" [formControl]="amount"
  format="currency" currency="USD" locale="en-US"
  [min]="0" [max]="1000000" [precision]="2" [step]="100" />
```

Model: `number | null`. Decimal is the default format. Percent models are fractions: `0.0525` displays as `5.25%`. Step uses model units, so `0.0025` is 0.25 percentage points.

Draft text commits on blur or Enter, or through `commit()`. Invalid, incomplete, nonfinite or out-of-range text stays visible and leaves the model unchanged. Check form validity before saving. Empty input is null unless required. A valid commit rounds to `precision` display digits (0–12); percentages round in displayed percentage units. There is one valueChange per effective commit. Angular may notify form validity changes while typing.

Locale-specific decimal/grouping separators and currency/percent symbols are accepted; malformed grouping is rejected. Set the same explicit locale on server and browser. Up/Down and optional step buttons increment within bounds. Wheel scrolling does not change the value. Tab retains native navigation; Enter commits only the field, not an enclosing grid row.

## Masked input

```html
<ngb-masked-input label="Payment reference" mask="AA-000000"
  [formControl]="reference" [required]="true" />
```

Model: `string | null`. Tokens: `0` = ASCII digit, `A` = ASCII letter, `*` = ASCII alphanumeric. Other characters are literals; backslash escapes tokens as literals. A mask must contain an editable slot and be at most 256 characters. All slots are required for nonempty input.

Default `valueMode="raw"` excludes literals; `formatted` includes them. External values must follow the chosen mode. Paste accepts raw or formatted text. Matching partial text updates the model but is invalid until complete. Invalid/excess text remains visible without replacing the prior model. Backspace/Delete skip separators; native selection and paste remain available. Composition is buffered and then validated against the ASCII grammar.

Masks validate shape only. Optional/dynamic masks and country detection are not included.

## DataGrid editors and financial data

Project `ng-template ngbEditor="amount" let-control`, then bind the numeric input's `[formControl]="control"`. Import `NgbEditorTemplate`; mark the column editable. Keep default grid editors unchanged for other fields. Name each custom editor and display validation messages.

The docs demonstrate synthetic USD payments with and without grouped sum/count footers. Totals derive from committed rows: Save and saved-edit Undo/Redo recalculate them; invalid drafts and Cancel do not. Handle rowSave (including historyAction) for application persistence. Group only comparable currencies or convert them explicitly. The aggregate example disables pagination so totals cover all filtered loaded rows.

JavaScript numbers have binary floating-point limits. These controls are not an accounting engine; exact posting, authorization, currency scale and backend validation belong to the application. Arbitrary-precision arithmetic is a separate future design.

## Accessibility and SSR

Use `label`, an external label with `inputId`, or `ariaLabel`/`ariaLabelledBy`. Connect instructions/errors with `ariaDescribedBy`. Numeric input exposes spinbutton bounds, committed value and formatted text; masked input remains a native text field. Invalid state is exposed on the native input. Read-only allows focus and selection; disabled removes controls from keyboard navigation.

Generated IDs are application-scoped and deterministic for equivalent SSR/client trees. Prefer explicit inputId for application relationships. Test screen-reader delivery in the target application; no blanket conformance claim is made.
