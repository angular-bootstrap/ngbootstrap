# @angular-bootstrap/ngbootstrap/drag-drop

Import from `@angular-bootstrap/ngbootstrap/drag-drop` or the root `@angular-bootstrap/ngbootstrap` package.

## Capabilities

- Pointer drag and drop for same-list reorder, cross-list movement, and nested builders
- Palette-to-canvas and clone-style workflows
- Same-list keyboard reorder for focused items:
  - `Space` to pick up
  - `ArrowUp` / `ArrowDown` to move
  - `Enter` to confirm
  - `Escape` to cancel and restore the original order

`(dndDropped)` fires after pointer drops and after keyboard-confirmed same-list reorders.

## Accessibility and ownership

Give draggable items meaningful `dndAriaLabel` values and preserve visible focus. Keyboard reorder is limited to the same list; cross-list keyboard movement is not implemented. Provide an application action when users need an accessible alternative to pointer-only movement. The legacy `aria-grabbed` attribute is not proof of current APG conformance.

Applications own item persistence and builder schemas. Simple list movement and advanced Form Builder workflows use the same primitives; a separate reusable form engine is not supplied. See [shared themes](../../docs/guides/theming.md) for styling and [contributor checks](../../CONTRIBUTING.md) before changing behavior.
