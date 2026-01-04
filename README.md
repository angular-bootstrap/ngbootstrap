# @angular-bootstrap/ngbootstrap

Angular UI library providing Datagrid, Drag‑and‑drop, Pagination, Stepper, Splitter, Tree, Typeahead, and Chips components with Bootstrap‑friendly styling.

## Features

- Datagrid – sortable, filterable, paginated, editable table with export (PDF/Excel) support and accessible templates.
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

### Datagrid

```ts
import { Component } from '@angular/core';
import { Datagrid } from '@angular-bootstrap/ngbootstrap/datagrid';
import { NgbDatagridDefaultEditService } from '@angular-bootstrap/ngbootstrap/datagrid';

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
      [trackBy]="trackById"
      [editService]="editService"
      [enableSorting]="true"
      [enableFiltering]="true"
      [enablePagination]="true"
      [pageSize]="10"
      (rowSave)="onRowSave($event)"
    ></ngb-datagrid>
  `,
})
export class UsersComponent {
  trackById = (_: number, row: User) => row.id;
  editService = new NgbDatagridDefaultEditService<User>();
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
- Stable row identity via `trackBy` (defaults to index).
- Pluggable editing logic via `editService` (implement `NgbDatagridEditService`).
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

### Splitter

```ts
import { Component } from '@angular/core';
import { NgbSplitterComponent, NgbSplitterPaneComponent } from '@angular-bootstrap/ngbootstrap/splitter';

@Component({
  standalone: true,
  selector: 'app-splitter',
  imports: [NgbSplitterComponent, NgbSplitterPaneComponent],
  template: `
    <ngb-splitter orientation="horizontal" [handleThickness]="10">
      <ngb-splitter-pane size="25%" collapsible>
        <div class="p-3">Navigation</div>
      </ngb-splitter-pane>
      <ngb-splitter-pane>
        <div class="p-3">Main content</div>
      </ngb-splitter-pane>
    </ngb-splitter>
  `,
})
export class SplitterExampleComponent {}
```

### Tree

```ts
import { Component } from '@angular/core';
import { NgbTreeComponent, NgbTreeNode } from '@angular-bootstrap/ngbootstrap/tree';

@Component({
  standalone: true,
  selector: 'app-tree',
  imports: [NgbTreeComponent],
  template: `
    <ngb-tree [nodes]="nodes" type="default"></ngb-tree>
  `,
})
export class TreeExampleComponent {
  nodes: NgbTreeNode[] = [
    { id: 'a', label: 'Parent', expanded: true, children: [{ id: 'a-1', label: 'Child 1' }] },
  ];
}
```

### Typeahead

```ts
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgbTypeaheadComponent, NgbTypeaheadItem } from '@angular-bootstrap/ngbootstrap/typeahead';

@Component({
  standalone: true,
  selector: 'app-typeahead',
  imports: [ReactiveFormsModule, NgbTypeaheadComponent],
  template: `
    <ngb-typeahead [data]="countries" [showDropdownButton]="true" [multiSelect]="true" [chips]="true"></ngb-typeahead>
    <ngb-typeahead [data]="countries" [showDropdownButton]="true" [formControl]="country"></ngb-typeahead>
  `,
})
export class TypeaheadExampleComponent {
  country = new FormControl<string | null>('IN');
  countries: NgbTypeaheadItem[] = [
    { id: 'IN', label: 'India', value: 'IN' },
    { id: 'US', label: 'United States', value: 'US' },
  ];
}
```

### Chips

```ts
import { Component } from '@angular/core';
import { NgbChipsComponent } from '@angular-bootstrap/ngbootstrap/chips';

@Component({
  standalone: true,
  selector: 'app-chips',
  imports: [NgbChipsComponent],
  template: `
    <ngb-chips [items]="items" (remove)="onRemove($event)"></ngb-chips>
  `,
})
export class ChipsExampleComponent {
  items = [
    { id: 1, label: 'One' },
    { id: 2, label: 'Two' },
  ];

  onRemove(item: { id: number; label: string }) {
    this.items = this.items.filter((x) => x.id !== item.id);
  }
}
```

### Drag & drop

```ts
import { Component } from '@angular/core';
import { DndListDirective, DndItemDirective } from '@angular-bootstrap/ngbootstrap/drag-drop';

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

## Keywords

Keywords: ngbootstrap, angular bootstrap, bootstrap 5, angular components, UI library, datagrid, data grid, table, pagination, stepper, wizard, splitter, resizable panes, tree view, typeahead, autocomplete, chips, tags input, drag and drop, dnd, accessibility, a11y, ARIA, reactive forms, standalone components.
