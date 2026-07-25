import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { Datagrid } from './datagrid.component';
import { NgbExportService } from '../services/export.services';
import { NgbCompositeFilterDescriptor } from '../models/filtering';

class MockExportService {
  registerPdfAdapter() {}
  registerExcelAdapter() {}
}

interface Row {
  id: number;
  name: string;
}

describe('Datagrid data binding', () => {
  let fixture: ComponentFixture<Datagrid<Row>>;
  let component: Datagrid<Row>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Datagrid],
      providers: [{ provide: NgbExportService, useClass: MockExportService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Datagrid<Row>);
    component = fixture.componentInstance;
    component.columns = [{ field: 'id', header: 'ID' }, { field: 'name', header: 'Name' }];
    component.enableFiltering = false;
  });

  it('binds a local array through [data]', () => {
    component.data = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ];
    fixture.detectChanges();
    expect(component.sorted.length).toBe(2);
    expect(component.paged.length).toBe(2);
  });

  it('exposes loading state on the grid root', () => {
    component.data = [{ id: 1, name: 'A' }];
    component.loading = true;
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('.ngb-grid') as HTMLElement;
    expect(root.classList.contains('ngb-grid--loading')).toBe(true);
    expect(root.getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.querySelector('.ngb-grid__loading-overlay')).toBeTruthy();
  });

  it('treats [total] as server-bound when greater than data length', () => {
    component.data = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));
    component.total = 42;
    component.pageable = { pageSizes: [5] };
    component.page = 2;
    component.pageSize = 5;
    fixture.detectChanges();

    expect(component.isServerBound()).toBe(true);
    expect(component.recordTotal()).toBe(42);
    expect(component.paged.length).toBe(5);
    expect(component.startIndex).toBe(6);
    expect(component.endIndex).toBe(10);
    expect(component.paginationRangeLabel()).toContain('42');
  });

  it('slices locally when [total] is omitted', () => {
    component.data = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));
    component.pageable = true;
    component.pageSize = 5;
    component.page = 2;
    fixture.detectChanges();

    expect(component.isServerBound()).toBe(false);
    expect(component.paged.length).toBe(5);
    expect(component.paged[0].id).toBe(6);
  });

  it('uses [total] for pager collection size when set', () => {
    component.data = [{ id: 1, name: 'A' }];
    component.total = 100;
    component.pageable = true;
    fixture.detectChanges();
    expect(component.pagerCollectionSize()).toBe(100);
  });

  it('emits a unified data state when sorting changes', () => {
    component.columns = [
      { field: 'id', header: 'ID' },
      { field: 'name', header: 'Name', sortable: true },
    ];
    component.data = [
      { id: 1, name: 'B' },
      { id: 2, name: 'A' },
    ];
    component.enableSorting = true;
    component.pageable = true;
    component.pageSize = 5;
    const emitSpy = jest.spyOn(component.dataStateChange, 'emit');

    component.toggleSort('name');

    expect(emitSpy).toHaveBeenCalledWith({
      page: 1,
      pageIndex: 0,
      skip: 0,
      pageSize: 5,
      sort: [{ field: 'name', direction: 'asc' }],
      filter: { logic: 'and', filters: [] },
      globalFilter: '',
      group: [],
    });
  });

  it('emits a unified data state when filtering changes', () => {
    component.columns = [
      { field: 'id', header: 'ID' },
      { field: 'name', header: 'Name', filterable: true },
    ];
    component.filterable = 'row';
    component.page = 3;
    component.pageSize = 10;
    const emitSpy = jest.spyOn(component.dataStateChange, 'emit');
    const filter: NgbCompositeFilterDescriptor = {
      logic: 'and',
      filters: [{ field: 'name', operator: 'contains', value: 'Ada', ignoreCase: true }],
    };

    component.filters = { name: 'Ada' };
    component.onColumnFilterChange();

    expect(component.page).toBe(1);
    expect(emitSpy).toHaveBeenCalledWith({
      page: 1,
      pageIndex: 0,
      skip: 0,
      pageSize: 10,
      sort: [],
      filter,
      globalFilter: '',
      group: [],
    });
  });

  it('emits a unified data state when paging changes', () => {
    component.pageSize = 5;
    const emitSpy = jest.spyOn(component.dataStateChange, 'emit');

    component.onPage(3);

    expect(emitSpy).toHaveBeenCalledWith({
      page: 3,
      pageIndex: 2,
      skip: 10,
      pageSize: 5,
      sort: [],
      filter: { logic: 'and', filters: [] },
      globalFilter: '',
      group: [],
    });
  });

  it('syncs page, sort, and filter from a controlled data state input', () => {
    const filter: NgbCompositeFilterDescriptor = {
      logic: 'and',
      filters: [{ field: 'name', operator: 'startswith', value: 'A', ignoreCase: true }],
    };
    component.state = {
      pageIndex: 2,
      pageSize: 25,
      sort: [{ field: 'name', direction: 'desc' }],
      filter,
      globalFilter: 'active',
    };

    component.ngOnChanges({
      state: new SimpleChange(null, component.state, true),
    });

    expect(component.page).toBe(3);
    expect(component.pageSize).toBe(25);
    expect(component.sort).toEqual({ active: 'name', direction: 'desc' });
    expect(component.localFilter).toEqual(filter);
    expect(component.globalFilter).toBe('active');
  });

  it('uses the reusable local data-operations pipeline when enabled', () => {
    component.columns = [
      { field: 'id', header: 'ID', type: 'number', filterable: true, sortable: true },
      { field: 'name', header: 'Name', filterable: true, sortable: true },
    ];
    component.data = [
      { id: 1, name: 'Beta' },
      { id: 2, name: 'Acme' },
      { id: 3, name: 'Acme Prime' },
    ];
    component.dataOperations = true;
    component.filterable = 'row';
    component.enableSorting = true;
    component.pageable = true;
    component.pageSize = 1;
    component.sort = { active: 'id', direction: 'desc' };
    component.localFilter = {
      logic: 'and',
      filters: [{ field: 'name', operator: 'contains', value: 'acme', ignoreCase: true }],
    };

    fixture.detectChanges();

    expect(component.recordTotal()).toBe(2);
    expect(component.paged).toEqual([{ id: 3, name: 'Acme Prime' }]);
  });
});
