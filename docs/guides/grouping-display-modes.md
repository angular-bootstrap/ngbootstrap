# Grouping display modes

Set `groupable` to an options object to choose the group heading layout and expose a field picker in the existing grid toolbar:

```html
<ngb-datagrid
  [columns]="columns" [data]="rows" [dataOperations]="true"
  [groupable]="{ displayMode: 'compact', showGroupButton: true }"
  [group]="groups" (groupChange)="groups = $event.group">
</ngb-datagrid>
```

`standard` is the default and indents each level. `compact` aligns group headings without changing the descriptor hierarchy or expansion state. This is independent of row density. The Group button is opt-in; the existing panel and header drag behavior remain available.

The picker adds or removes visible configured fields. Group chips change direction, remove fields, or open actions to move a field earlier/later. `moveGroupField(field, 'previous' | 'next')` provides the same reorder operation for application controls. Unknown fields and boundary moves do nothing. Direction and aggregate descriptors are preserved.

Listen to `groupChange` to retain order. Remote applications should reload once from `dataStateChange`; each real mutation emits one consolidated state notification and resets to page one. Existing saved-view/history contracts include grouping descriptors, but not the visual display mode.

## Keyboard

Tab to a control; Enter/Space opens its list. Up/Down and Home/End focus available list actions. Escape closes and returns focus. Unavailable moves are disabled. Removing a chip focuses a neighbour or the Group button when present.

## Limits

Display modes do not change data processing, remote grouping requirements or virtualization geometry. Custom templates own their content and accessibility. Verify theme, overflow and keyboard behavior in application layouts. This guide does not claim full APG grid navigation or WCAG certification.
