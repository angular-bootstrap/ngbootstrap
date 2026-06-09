import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Datagrid } from '../datagrid/datagrid.component';
import { ColumnDef } from '../models/column-def';
import { NgbDatagridColumnChooserToolComponent } from './datagrid-column-chooser-tool.component';
import { NgbDatagridFilterToolComponent } from './datagrid-filter-tool.component';
import { NgbDatagridLayoutToolbarComponent } from './datagrid-layout-toolbar.component';
import { NgbDatagridSortToolComponent } from './datagrid-sort-tool.component';

interface Row {
  name: string;
  price: number;
}

@Component({
  standalone: true,
  imports: [
    Datagrid,
    NgbDatagridLayoutToolbarComponent,
    NgbDatagridFilterToolComponent,
    NgbDatagridSortToolComponent,
    NgbDatagridColumnChooserToolComponent,
  ],
  template: `
    <ngb-datagrid
      #grid
      [columns]="columns"
      [data]="rows"
      [enableSorting]="true"
      [enableFiltering]="true"
      [filterable]="'menu'"
      [tableOptions]="{ stacked: true, stackedLayout: 'cards' }"
    >
      <ngb-datagrid-layout-toolbar [grid]="grid">
        <ngb-datagrid-filter-tool></ngb-datagrid-filter-tool>
        <ngb-datagrid-sort-tool></ngb-datagrid-sort-tool>
        <ngb-datagrid-column-chooser-tool></ngb-datagrid-column-chooser-tool>
      </ngb-datagrid-layout-toolbar>
    </ngb-datagrid>
  `,
})
class HostComponent {
  columns: ColumnDef<Row>[] = [
    { field: 'name', header: 'Name', sortable: true, filterable: true },
    { field: 'price', header: 'Price', type: 'number', sortable: true, filterable: true },
  ];
  rows: Row[] = [
    { name: 'Alpha', price: 10 },
    { name: 'Beta', price: 20 },
  ];
}

describe('NgbDatagrid layout toolbar tools', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders filter, sort, and column chooser triggers', () => {
    const triggers = fixture.nativeElement.querySelectorAll('.ngb-layout-tool__trigger');
    expect(triggers.length).toBe(3);
  });

  it('keeps only one toolbar panel open at a time', () => {
    const filterDe = fixture.debugElement.query(By.directive(NgbDatagridFilterToolComponent));
    const sortDe = fixture.debugElement.query(By.directive(NgbDatagridSortToolComponent));
    const filter = filterDe.componentInstance as NgbDatagridFilterToolComponent;
    const sort = sortDe.componentInstance as NgbDatagridSortToolComponent;

    filter.togglePanel(new MouseEvent('click'));
    fixture.detectChanges();
    expect(filter.open).toBe(true);

    sort.togglePanel(new MouseEvent('click'));
    fixture.detectChanges();
    expect(sort.open).toBe(true);
    expect(filter.open).toBe(false);
  });

  it('applies column visibility from the chooser tool', () => {
    const chooserDe = fixture.debugElement.query(By.directive(NgbDatagridColumnChooserToolComponent));
    const chooser = chooserDe.componentInstance as NgbDatagridColumnChooserToolComponent;
    const gridDe = fixture.debugElement.query(By.directive(Datagrid));
    const grid = gridDe.componentInstance as Datagrid<Row>;

    chooser.togglePanel(new MouseEvent('click'));
    fixture.detectChanges();

    chooser.draftVisibility = { name: false, price: true };
    chooser.apply();
    fixture.detectChanges();

    expect(grid.visibleColumns.length).toBe(1);
    expect(grid.visibleColumns[0].field).toBe('price');
  });
});
