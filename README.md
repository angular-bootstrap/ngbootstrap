# ngbootstrap

![npm version](https://img.shields.io/npm/v/@ngbootstrap/datagrid)
![license](https://img.shields.io/github/license/you-know-nothing-h/ngbootstrap)
![build status](https://github.com/you-know-nothing-h/ngbootstrap/actions/workflows/release.yml/badge.svg)

**ngbootstrap** is a custom Angular UI component library designed to provide high-quality, reusable, and accessible components.  
The first package in the library is `@ngbootstrap/datagrid` — a powerful, customizable data grid component with rich features.

---

## ✨ Features

- 🚀 **High performance** rendering for large datasets  
- 🖊 **Inline Editing** (Add, Edit, Delete rows)  
- 🔍 **Sorting & Filtering**  
- 📄 **Pagination** support  
- 📦 **Drag-and-Drop** with nested levels  
- 🎨 Built with **Bootstrap** and fully customizable via Angular templates  
- ♿ **Accessible** (ARIA roles and keyboard navigation support)  

---

## 📦 Installation


# Install the ngbootstrap datagrid package
npm install @ngbootstrap/datagrid --save

## 🛠 Usage

**Import the module** into your Angular application:

```ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgbDatagridModule } from '@ngbootstrap/datagrid';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    NgbDatagridModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}

```
## 2. Use the component in your template

```html
<ngb-datagrid
  [data]="rows"
  [columns]="columns"
  (rowAdded)="onRowAdded($event)"
  (rowUpdated)="onRowUpdated($event)"
  (rowDeleted)="onRowDeleted($event)">
</ngb-datagrid>
```

### 3. Define your data and column config in the component

```ts
columns = [
  { field: 'id', title: 'ID', sortable: true },
  { field: 'name', title: 'Name', editable: true },
  { field: 'email', title: 'Email', editable: true }
];

rows = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

onRowAdded(newRow: any) {
  console.log('Row added:', newRow);
}
```
## 📚 Documentation
Full documentation, demos, and API reference will be available soon at
ngbootstrap.com

## 🤝 Contributing
We welcome contributions! Please follow these steps:

1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Open a pull request

Before submitting PRs, run:

```html
npm run lint
npm run test
```

## 📜 License
This project is licensed under the MIT License.
See the LICENSE file for details.

## 📬 Support
If you find a bug or have a feature request, please open an issue at:
https://github.com/you-know-nothing-h/ngbootstrap/issues


