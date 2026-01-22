# @angular-bootstrap/ngbootstrap

Angular UI library providing Datagrid, Drag‑and‑drop, Pagination, Stepper, Splitter, Tree, Typeahead, and Chips components with Bootstrap‑friendly styling.

## Features

- Datagrid – sortable, filterable, paginated, Sticky Header/Footer, Sticky Rows, Grid Styling, editable table with export (PDF/Excel) support and accessible templates.
- Drag & drop – lightweight list and item directives with keyboard‑friendly a11y helpers.
- Pagination – standalone Bootstrap‑styled pagination component.
- Stepper – horizontal/vertical stepper with custom labels, error states, theming hooks, and keyboard support.
- Splitter – resizable horizontal/vertical panes with collapsing, keyboard resizing, and ARIA semantics.
- Tree – keyboard-accessible tree with optional checkboxes, JSON-style expanders, and expand/collapse helpers.
- Typeahead – Bootstrap dropdown overlay with debouncing, virtualization, single/multi select, chips/tags mode, custom templates, and Reactive Forms support.
- Chips – small reusable chips/tags component used by Typeahead (can also be used standalone).
- Angular + Bootstrap first – built for modern Angular (v21) and works with plain Bootstrap CSS; Material/Tailwind can be layered via custom styles.

## Installation

```bash
npm install @angular-bootstrap/ngbootstrap
```

Make sure your app:

- Uses Angular 21 (peer deps: `>=21 <22`).
- Includes Bootstrap CSS + Bootstrap Icons (for example in `angular.json` or global styles):

```css
@import 'bootstrap/dist/css/bootstrap.min.css';
@import 'bootstrap-icons/font/bootstrap-icons.css';
```

## Usage overview

All components are standalone, so you import them directly into your feature components.

Key datagrid capabilities:

- Sorting (`enableSorting`, `sortChange`).
- Column/global filtering (`enableFiltering`, `enableGlobalFilter`, `filtersChange`).
- Pagination (`enablePagination`, `pageSize`, `pageChange`).
- Inline add/edit/delete (`enableAdd`, `enableEdit`, `enableDelete`, `rowAdd`, `rowSave`, `rowDelete`).
- Stable row identity via `trackBy` (defaults to index).
- Pluggable editing logic via `editService` (implement `NgbDatagridEditService`).
- Export to PDF/Excel via `exportOptions`.

Export requires optional peer dependencies. Install only if you use export:

```sh
npm install jspdf jspdf-autotable xlsx
```

Stepper highlights:

- Horizontal/vertical variants via `orientation`.
- Custom labels with the `ngbStepLabel` directive.
- Label and content positioning (`labelPosition`, `contentPosition`).
- Error states and messages (`errorMessage` on steps).
- Controlled navigation (`allowRevisit`, `next()`, `prev()`, `reset()` and events).
- Theming hooks via `theme` and CSS classes (`bootstrap`, `material`, `tailwind`).

Refer to the source under `src/drag-drop` and `src/datagrid`/`src/stepper` for full API details until a dedicated docs site is added.

## Development

Local setup:

```bash
npm install
npm run lint
npm test
npm run build
```

- Build artefacts go to `dist/`.
- Tests are powered by Jest + `jest-preset-angular`.

## Releasing

Releases are automated via GitHub Actions:

- Non‑`main` branches:
  - `.github/workflows/ci.yml` runs install, tests, build only.
- `main` branch:
  - `.github/workflows/release.yml` runs install, tests, build and publishes to npm using `NPM_TOKEN` from repository secrets.

Recommended release flow:

- On your local machine:
  - Decide the new version (e.g. `1.1.0`).
  - Run `npm version minor` or `npm version patch` to bump `package.json` and create the tag.
  - Push the commit and tag: `git push origin main --tags`.
- GitHub Actions will build and publish that tagged version to npm.
