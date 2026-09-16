# Shared component themes

## Audit and compatibility

DataGrid already had a real token layer before scoped themes were added:
82 distinct `--dg-*` names across its styles, covering surfaces, text, borders,
status colors, selection, hover, focus, shadows, radii, cell/header padding,
control sizing, typography, and pagination. `_datagrid-tokens.scss` supplied
Bootstrap mappings and named Bootstrap, Material, and Tailwind palettes.
The `theme` input defaults to `bootstrap` and writes `data-theme` on the grid.

The gap was not a missing design system. There were no shared `--ngb-*` visual
tokens, no `data-ngb-theme` wrapper support, and the Material palettes were
fixed values rather than Angular Material system-variable mappings. Floating
filter menus copied only the named theme when moving to `document.body`, so
ancestor-scoped values would have been lost.

| Audit area | Finding before this change |
| --- | --- |
| `--ngb-*` in SCSS/CSS | Only the stepper animation-duration hook; no shared visual token layer |
| Direct `--bs-*` use in DataGrid | 68 references, almost all in the Bootstrap token mixin; one overlay control-radius rule |
| Hardcoded colors and shadows | Primarily fallback values and named palettes; a grouping error tint also mixed with hardcoded white |
| Radius | Most uses tokenized; some filter controls used `0.375rem`; pill/handle shapes intentionally use fixed radii |
| Spacing and fonts | Cell/header padding and font sizes tokenized; many local gaps, button paddings, and small labels remain fixed; font family inherited |
| Other components | Stepper, drag-drop CSS, pagination inline styles, and JSON preview still reference Bootstrap directly |

This change adds a small public layer above `--dg-*`; it does not replace the
existing DataGrid palettes. Shared tokens now also cover Stepper, Splitter, Tree, Typeahead, Chips, Pager, pagination, drag/drop feedback, and JSON preview. Bootstrap markup and base CSS
remain part of the library's styling requirements. Material theming is a token
bridge, not an implementation of Angular Material components.

## Usage

Keep Bootstrap 5 CSS installed. Load the shared theme entry once in application
global styles, after Bootstrap, including when using individual component entry points:

```scss
@use 'sass:meta';
@import 'bootstrap/dist/css/bootstrap.min.css';
@include meta.load-css('@angular-bootstrap/ngbootstrap/src/styles/themes');
```

`src/styles/themes.scss` is shipped as a package asset. DataGrid also includes
the Bootstrap and Material mappings for compatibility with existing grid-only consumers. No Angular
Material or Tailwind dependency is required.

```html
<!-- Bootstrap remains the default. -->
<ngb-datagrid [columns]="columns" [data]="rows" />

<!-- Multiple themes can coexist on the same page. -->
<div data-ngb-theme="material">
  <ngb-datagrid [columns]="columns" [data]="rows" />

  <div data-ngb-theme="bootstrap">
    <ngb-datagrid [columns]="columns" [data]="rows" />
  </div>
</div>
```

For scoped themes, leave the grid's `theme` input at `bootstrap` (its default).
Existing explicit named palettes, including `[theme]="'material'"`, remain
compatible and retain their palette overrides; that input is not the new
Angular Material bridge. Prefer the wrapper for Material system-variable use.

The nearest theme wrapper wins. Set `--ngb-*` overrides on that wrapper or on
the grid host. Existing `--dg-*` overrides directly on `.ngb-grid` remain valid.

```css
.orders[data-ngb-theme="material"] {
  --ngb-density-row-height: 52px;
  --ngb-radius-md: 8px;
}
```

Bootstrap defaults are fallback chains evaluated on the grid, not aliases
installed globally on `:root`. This preserves local `--bs-*` overrides,
`data-bs-theme` scopes, and existing inherited fonts. An explicit Bootstrap
wrapper defines the same public token names so it can reset a nested Material
scope. For a scoped dark Bootstrap theme, put `data-bs-theme="dark"` on that
wrapper (or above it).

## Public token reference

| `--ngb-` suffix | Bootstrap mapping / fallback | Material mapping / fallback |
| --- | --- | --- |
| `primary` | `--bs-primary` / `#0d6efd` | `--mat-sys-primary` / `#6750a4` |
| `on-primary` | White | `--mat-sys-on-primary` / white |
| `surface` | `--bs-body-bg` / white | `--mat-sys-surface` / `#fffbfe` |
| `surface-container` | `--bs-tertiary-bg` / `#f8f9fa` | `--mat-sys-surface-container` / `#f3edf7` |
| `surface-variant` | `--bs-secondary-bg` / `#e9ecef` | `--mat-sys-surface-container-high` / `#ece6f0` |
| `on-surface` | `--bs-body-color` / `#212529` | `--mat-sys-on-surface` / `#1d1b20` |
| `on-surface-variant` | `--bs-secondary-color` / `#6c757d` | `--mat-sys-on-surface-variant` / `#49454f` |
| `border-color` | `--bs-border-color` / `#dee2e6` | `--mat-sys-outline-variant` / `#cac4d0` |
| `primary-hover` | `--bs-link-hover-color` / `#0a58ca` | Primary mixed with 12% on-surface |
| `primary-container` | `--bs-primary-bg-subtle` / `#cfe2ff` | `--mat-sys-primary-container` / `#eaddff` |
| `focus-ring` | `--bs-focus-ring-color` / translucent blue | `--mat-sys-primary` / `#6750a4` |
| `radius-sm`, `radius-md`, `radius-lg` | Bootstrap radius variables / `0.25`, `0.375`, `0.5rem` | `4`, `12`, `16px` |
| `font-family` | `--bs-body-font-family` / system sans-serif | `--mat-sys-body-medium-font` / Roboto, Arial, sans-serif |
| `font-size-sm` | Existing grid cell size `0.84rem` | `--mat-sys-body-medium-size` / `0.875rem` |
| `density-row-height` | Explicit wrapper: `40px`; unscoped: existing automatic height | `48px` |
| `elevation-1`, `elevation-2` | Bootstrap small/regular shadows | `--mat-sys-level1`, `--mat-sys-level2` / small menu/card shadows |
| `disabled-opacity` | Existing `0.45` | `0.38` |
| `hover-bg` | `--bs-tertiary-bg` / `#f8f9fa` | Surface mixed with 8% on-surface |
| `selected-bg` | `--bs-primary-bg-subtle` / `#cfe2ff` | `--mat-sys-secondary-container` / `#e8def8` |

Row height is a minimum requested table-cell height; content and padding can
make rows taller. Existing compact-density options still control padding.

Angular Material system variables must be available on the wrapper or an
ancestor. If absent, all mappings have standalone light-theme fallbacks. No
font is downloaded. For Material dark mode, supply a dark set of system
variables; Bootstrap dark mode alone does not create a Material dark palette.
See Angular Material's [custom component theming guide](https://github.com/angular/components/blob/main/guides/theming-your-components.md)
for the supported system color, typography, and elevation variables.

## DataGrid integration

`--dg-*` remains the component-specific layer. Its Bootstrap mixin now resolves
shared colors, surfaces, borders, radii, shadows, focus, hover, selection, and
pager styling through `--ngb-*` before existing Bootstrap fallbacks. DataGrid
also consumes shared font, row-height, disabled-opacity, and control-radius
tokens. Portaled filter menus snapshot resolved grid tokens when opened, so
their styling survives moving outside the theme wrapper. Close and reopen an
open filter menu after changing its ancestor theme.

Existing named palettes and component-specific semantic tokens remain available
through `--dg-*`. Shared success and danger colors feed the Bootstrap mapping;
other specialized grid status surfaces remain component tokens. Fixed layout
gaps, icons, and pill shapes remain component details.


## Families and swatches

Every value below works on `data-ngb-theme` for all participating components:

| Family | Wrapper value | Palette |
| --- | --- | --- |
| Bootstrap | `bootstrap` | Classic, maps local Bootstrap variables |
| Bootstrap | `bootstrap-main` | Ocean |
| Bootstrap | `bootstrap-main-dark` | Midnight, dark |
| Bootstrap | `bootstrap-nordic` | Aqua Rose |
| Bootstrap | `bootstrap-urban` | Clay |
| Bootstrap | `bootstrap-vintage` | Sage |
| Material | `material` | Angular Material system-variable mapping |
| Material | `material-main` | Orchid |
| Material | `material-indigo` | Indigo |
| Material | `material-deep-purple` | Plum |
| Tailwind | `tailwind` | Tailwind v4 system-variable mapping |
| Tailwind | `tailwind-main` | Sky |
| Tailwind | `tailwind-slate` | Graphite |
| Tailwind | `tailwind-emerald` | Mint |

Named swatches have fixed palettes and reset every shared token for nested
scopes. They share the grid presets' primary and surface colors; grid-only
striping, density, and detailed pager settings remain with the grid's `theme`
input. Material and Tailwind family mappings read external system variables;
their named swatches do not.

Additional shared tokens:

| Token | Purpose |
| --- | --- |
| `--ngb-success`, `--ngb-on-success` | Completion fill and text; Bootstrap success, Material fallback green, Tailwind green-700 |
| `--ngb-danger`, `--ngb-on-danger` | Error fill and text; Bootstrap danger, Material error, Tailwind red-700 |
| `--ngb-select-icon` | Select arrow CSS image; Midnight and Bootstrap dark use a light arrow. Override for custom dark Material/Tailwind surfaces. |
| `--ngb-space-1` through `--ngb-space-4` | Selected gaps and padding; 0.25, 0.5, 0.75, 1rem; Tailwind maps spacing multiples |

The Tailwind mapping reads `--color-blue-*`, `--color-slate-*`, `--color-white`,
`--font-sans`, `--text-sm`, `--radius-*`, `--shadow-*`, and `--spacing` with safe
fallbacks. It does not install Tailwind or remove the Bootstrap requirement.
For Tailwind v4, use a separate CSS pipeline; omit Preflight when Bootstrap
supplies base styles and prefix utilities to avoid class collisions. Prefixed
variables need explicit mappings, such as
`--ngb-primary: var(--tw-color-indigo-600, #4f46e5)` on the wrapper.
Tailwind v3 applications can define CSS variables manually. See the official
[Tailwind Preflight](https://tailwindcss.com/docs/preflight) and
[Sass compatibility](https://tailwindcss.com/docs/compatibility) guides.

## Component boundaries

The AI UI entry point (Prompt Box, Chat, AI Prompt, Inline AI Prompt, and
Smart Paste) also consumes the shared tokens for controls, text, surfaces,
focus, error states, spacing, and corners. Load the global theme stylesheet
when using this entry point independently.


- Stepper: indicators, action buttons, error text, focus and selected spacing.
  Its explicit `material` and `tailwind` theme inputs create a local mapping;
  the default input inherits the nearest wrapper.
- Splitter: separator, handle and keyboard focus. Explicit color inputs win.
- Tree: text, buttons, checkboxes and focus. Projected/application content is unchanged.
- Typeahead: controls, suggestions, selection, focus, disabled state, menu elevation.
- Chips: fill, text, removal button and disabled opacity; pill shape is retained.
- Pager/pagination: controls and labels; nested DataGrid `--dg-*` overrides retain priority.
- Drag/drop: global list, compatible/denied hover and placeholder feedback.
  JSON preview uses shared surfaces and spacing, with its monospace font retained.

No theme selector targets arbitrary application buttons. The old optional
`styles.css` drag/drop entry no longer contains a global `table button.btn` rule.
Projected templates, chart series, and the application-built Form Builder
canvas are application-owned. They can use the same shared variables explicitly.
The shared themes do not alter component event contracts or keyboard behavior.


## Optional Tailwind v4 utility preset

There are two integration directions:

- **ngbootstrap → Tailwind:** the optional preset exposes shared tokens through
  utilities for application layouts and projected content.
- **Tailwind → ngbootstrap:** the `tailwind` wrapper or explicit `--ngb-*`
  overrides read an application's existing Tailwind design variables.

To generate utilities, install and configure Tailwind v4 in the consuming app.
Tailwind is an optional peer dependency; using built-in palettes does not require
it. The preset is a packaged CSS asset, not a JavaScript plugin. Keep Bootstrap
CSS and the global library `themes.scss` entry loaded separately.

```css
/* Separate CSS entry processed by Tailwind, not Sass. */
@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme) prefix(tw);
@import 'tailwindcss/utilities.css' layer(utilities) prefix(tw);
@import '@angular-bootstrap/ngbootstrap/styles/tailwind.css';
```

This setup omits Preflight because Bootstrap supplies base styles. Example:

```html
<section data-ngb-theme="material-main"
  class="tw:bg-ngb-surface tw:text-ngb-on-surface tw:rounded-ngb-md tw:p-ngb-4">
  <ngb-tree [nodes]="folders" />
</section>
```

Without `prefix(tw)`, omit `tw:` from class names. With the prefix, variants
come after it, for example `tw:hover:bg-ngb-hover`. Keep literal utility names
in source files scanned by the consuming Tailwind build.

| Category | Unprefixed examples |
| --- | --- |
| Colors | `bg-ngb-primary`, `text-ngb-on-primary`, `bg-ngb-surface`, `text-ngb-on-surface`, `border-ngb-border` |
| Interaction | `hover:bg-ngb-hover`, `bg-ngb-selected`, `focus:outline-ngb-focus` |
| Status | `bg-ngb-success`, `text-ngb-on-success`, `bg-ngb-danger`, `text-ngb-on-danger` |
| Radius | `rounded-ngb-sm`, `rounded-ngb-md`, `rounded-ngb-lg` |
| Typography | `font-ngb`, `text-ngb-sm` |
| Spacing | `p-ngb-1` through `p-ngb-4`, `gap-ngb-2`, `min-h-ngb-row` |
| Elevation | `shadow-ngb-1`, `shadow-ngb-2` |

Use a theme wrapper with this preset, including for Bootstrap defaults; unscoped
components can use fallback colors without defining inherited shared tokens.
`@theme inline` makes generated utilities reference `--ngb-*` directly at the
styled element, preserving nested theme scopes and live token overrides.
The preset defines only namespaced aliases. It does not replace Tailwind's
standard variables, preventing cycles with the reverse Tailwind mapping.
Do not combine conflicting Bootstrap and Tailwind utility classes on an element.

Verify the optional integration with an independently installed Tailwind v4:

```sh
node scripts/verify-tailwind-preset.mjs /path/to/tailwind-project
```

## Naming and scope

Built-in palettes supply predefined shared visual values. Framework integrations
connect those values to external variables or utility classes. Full component
themes would additionally implement an entire design system's component metrics,
structure, and effects. The current library retains Bootstrap-based structures;
its Material palettes and variable mapping are not a full Material 3 implementation.
