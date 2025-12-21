# @angular-bootstrap/ngbootstrap

Angular UI library providing datagrid, drag‑and‑drop, pagination, and stepper components with Bootstrap‑friendly styling.

## Features

- Datagrid – sortable, filterable, paginated, editable table with export (PDF/Excel) support and accessible templates.
- Drag & drop – lightweight list and item directives with keyboard‑friendly a11y helpers.
- Pagination – standalone Bootstrap‑styled pagination component.
- Stepper – horizontal/vertical stepper with custom labels, error states, theming hooks, and keyboard support.
- Splitter – resizable horizontal/vertical panes with collapsing, keyboard resizing, and ARIA semantics.
- Tree – keyboard-accessible tree with optional checkboxes, JSON-style expanders, and expand/collapse helpers.
- Typeahead – virtualized, debounced search with single/multi select, exact-match selection, and scroll hooks.
- Angular + Bootstrap first – built for modern Angular (v17–20) and works with plain Bootstrap CSS; Material/Tailwind can be layered via custom styles.

## Installation

```bash
npm install @angular-bootstrap/ngbootstrap
```

Make sure your app:

- Uses Angular 17–20.
- Includes Bootstrap CSS (for example in `angular.json` or global styles):

```css
@import 'bootstrap/dist/css/bootstrap.min.css';
```

## Usage overview

All components are standalone, so you import them directly into your feature components.

### Datagrid

```ts
import { Component } from '@angular/core';
import { Datagrid } from '@angular-bootstrap/ngbootstrap/datagrid';

interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  standalone: true,
  selector: 'app-users',
  imports: [Datagrid],
  template: `
    <ngb-datagrid
      [columns]="columns"
      [data]="rows"
      [enableSorting]="true"
      [enableFiltering]="true"
      [enablePagination]="true"
      [pageSize]="10"
      (rowSave)="onRowSave($event)"
    ></ngb-datagrid>
  `,
})
export class UsersComponent {
  columns = [
    { field: 'id', header: 'ID', sortable: true },
    { field: 'name', header: 'Name', sortable: true, filterable: true },
    { field: 'email', header: 'Email', sortable: true, filterable: true, type: 'email' },
  ];

  rows: User[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
  ];

  onRowSave(evt: { original: User; updated: User }) {
    // persist the update
  }
}
```

Key datagrid capabilities:

- Sorting (`enableSorting`, `sortChange`).
- Column/global filtering (`enableFiltering`, `enableGlobalFilter`, `filtersChange`).
- Pagination (`enablePagination`, `pageSize`, `pageChange`).
- Inline add/edit/delete (`enableAdd`, `enableEdit`, `enableDelete`, `rowAdd`, `rowSave`, `rowDelete`).
- Export to PDF/Excel via `exportOptions`.

Export requires optional peer dependencies. Install only if you use export:

```sh
npm install jspdf jspdf-autotable xlsx
```

### Pagination

```ts
import { Component } from '@angular/core';
import { NgbPaginationComponent } from '@angular-bootstrap/ngbootstrap/pagination';

@Component({
  standalone: true,
  selector: 'app-pager',
  imports: [NgbPaginationComponent],
  template: `
    <ngb-pagination
      [(page)]="page"
      [pageSize]="pageSize"
      [collectionSize]="total"
      (pageChange)="loadPage($event)"
    ></ngb-pagination>
  `,
})
export class PagerComponent {
  page = 1;
  pageSize = 10;
  total = 250;

  loadPage(p: number) {
    this.page = p;
    // fetch data for the page
  }
}
```

### Stepper

```ts
import { Component } from '@angular/core';
import { NgbStepperComponent } from '@angular-bootstrap/ngbootstrap/stepper';
import { NgbStepperStep } from '@angular-bootstrap/ngbootstrap/stepper';

### Splitter

```ts
import { Component } from '@angular/core';
import { NgbSplitterComponent, NgbSplitterPaneComponent } from '@angular-bootstrap/ngbootstrap/splitter';

@Component({
  standalone: true,
  selector: 'app-splitter',
  imports: [NgbSplitterComponent, NgbSplitterPaneComponent],
  template: `
    <ngb-splitter orientation="horizontal">
      <ngb-splitter-pane size="30%" min="200px" [collapsible]="true" (collapsedChange)="onCollapse($event)">
        <div class="p-3">Navigation</div>
      </ngb-splitter-pane>
      <ngb-splitter-pane>
        <div class="p-3">Main content</div>
      </ngb-splitter-pane>
    </ngb-splitter>
  `,
})
export class SplitterExampleComponent {
  onCollapse(collapsed: boolean) {
    // persist pane state if needed
  }
}
```

@Component({
  standalone: true,
  selector: 'app-wizard',
  imports: [NgbStepperComponent],
  template: `
    <ngb-stepper
      [steps]="steps"
      [(selectedIndex)]="index"
      orientation="horizontal"
      [allowRevisit]="false"
      theme="bootstrap"
      (selectionChange)="onSelectionChange($event)"
    >
      <ng-template #stepContent let-index="index">
        <ng-container [ngSwitch]="index">
          <div *ngSwitchCase="0">Account step</div>
          <div *ngSwitchCase="1">Profile step</div>
          <div *ngSwitchCase="2">Confirm step</div>
        </ng-container>
      </ng-template>
    </ngb-stepper>
  `,
})
export class WizardComponent {
  index = 0;

  steps: NgbStepperStep[] = [
    { id: 'account', label: 'Account' },
    { id: 'profile', label: 'Profile' },
    { id: 'confirm', label: 'Confirm', optional: true },
  ];

  onSelectionChange(e: { previousIndex: number; currentIndex: number }) {
    // analytics, autosave, etc.
  }
}
```

Stepper highlights:

- Horizontal/vertical variants via `orientation`.
- Custom labels with the `ngbStepLabel` directive.
- Label and content positioning (`labelPosition`, `contentPosition`).
- Error states and messages (`errorMessage` on steps).
- Controlled navigation (`allowRevisit`, `next()`, `prev()`, `reset()` and events).
- Theming hooks via `theme` and CSS classes (`bootstrap`, `material`, `tailwind`).

### Drag & drop

```ts
import { Component } from '@angular/core';
import { DndListDirective, DndItemDirective } from '@angular-bootstrap/ngbootstrap/drag-drop';

### Tree

```ts
import { Component } from '@angular/core';
import { NgbTreeComponent, NgbTreeNode } from '@angular-bootstrap/ngbootstrap/tree';

@Component({
  standalone: true,
  selector: 'app-tree',
  imports: [NgbTreeComponent],
  template: `
    <ngb-tree
      [nodes]="nodes"
      [showCheckbox]="true"
      type="json"
      (expand)="onExpand($event)"
      (collapse)="onCollapse($event)"
      (selectionChange)="onSelection($event)"
    ></ngb-tree>
  `,
})
export class TreeExampleComponent {
  nodes: NgbTreeNode[] = [
    {
      id: 'parent',
      label: 'Parent',
      expanded: true,
      children: [
        { id: 'child-1', label: 'Child 1' },
        { id: 'child-2', label: 'Child 2' },
      ],
    },
  ];

  onExpand(node: NgbTreeNode) {}
  onCollapse(node: NgbTreeNode) {}
  onSelection(selected: NgbTreeNode[]) {}
}
```

@Component({
  standalone: true,
  selector: 'app-drag-list',
  imports: [DndListDirective, DndItemDirective],
  template: `
    <ul dndList [dndListData]="items">
      <li *ngFor="let item of items" dndItem [dndItemData]="item">
        {{ item }}
      </li>
    </ul>
  `,
})
export class DragListComponent {
  items = ['One', 'Two', 'Three'];
}
```

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
