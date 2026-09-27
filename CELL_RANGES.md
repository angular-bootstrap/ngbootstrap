# DataGrid cell ranges

Available in v2.4.0. Select a rectangular range on the current page.
For clipboard drafts, validation and batch history, see BATCH_EDITING.md.

```html
<ngb-datagrid
  [data]="rows"
  [columns]="columns"
  [trackBy]="rowKey"
  cellSelection="range"
  (cellRangeChange)="onRangeChange($event)"
/>
```

`cellSelection` defaults to `none`. Range mode uses the existing cell keyboard
navigation even when `keyboardNavigation` is false. `cellRange` returns a detached
`NgbGridCellRange` or null; `cellRangeChange` emits changes, including null on clear.
The range contains `anchor` and `focus`, each with `rowId` and `field`.
Supply stable unique trackBy IDs; without trackBy, IDs are data-array indexes.
`clearCellRange()` clears the range without changing row selection or row values.

- Arrow keys move focus and collapse the range; Shift+arrows extend it.
- Home/End select the first/last visible column; Shift extends from the anchor.
- Ctrl+Home/End retain the existing first/last-row navigation behavior.
- Mouse drag and Shift-click extend a range. Escape clears it.
- F2/Enter retain the existing in-cell editor activation. In range mode a plain
  cell click selects rather than immediately opening an editor.
- Inputs, buttons, links and editable content retain their own key handling.
- Space and row checkboxes retain existing row-selection behavior.

Only one range on the current loaded, ungrouped page is supported. Hidden columns
are excluded. Paging, sorting, filtering, data replacement and schema changes clear
selection. Stacked cards, sticky rows and row-reordering mode disable range selection.
Mouse dragging is supported; touch-drag range selection is not yet implemented.
Ranges are not saved in views or recorded as history commands.

Selected cells expose aria-selected; the grid exposes aria-multiselectable. The
active cell keeps the existing roving tabindex. Customize `labels.cellRangeSelected`
(with `{rows}` and `{columns}`) and `labels.cellRangeCleared` for announcements.
Visuals use `--ngb-selected-bg` and `--ngb-primary`.

Test custom templates with keyboard and assistive technology in your application.
