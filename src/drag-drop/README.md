# ngbootstrap/drag-drop

Secondary entry point of `ngbootstrap`. It can be used by importing from `ngbootstrap/drag-drop`.

## Capabilities

- Pointer drag and drop for same-list reorder, cross-list movement, and nested builders
- Palette-to-canvas and clone-style workflows
- Same-list keyboard reorder for focused items:
  - `Space` to pick up
  - `ArrowUp` / `ArrowDown` to move
  - `Enter` to confirm
  - `Escape` to cancel and restore the original order

`(dndDropped)` fires after pointer drops and after keyboard-confirmed same-list reorders.
