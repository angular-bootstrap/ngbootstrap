import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { Datagrid } from './datagrid.component';
import { ColumnDef } from '../models/column-def';
import { NgbDataGridResponsiveOptions } from '../datagrid.types';
import { NgbExportService } from '../services/export.services';

interface Person {
  id: number;
  name: string;
  email: string;
  score: number;
  active: boolean;
  created: string;
}

class MockExportService {
  exportPdf = jest.fn().mockResolvedValue(undefined);
  exportExcel = jest.fn().mockResolvedValue(undefined);
}

describe('Datagrid', () => {
  let component: Datagrid<Person>;
  let fixture: ComponentFixture<Datagrid<Person>>;
  let exporter: MockExportService;

  const baseColumns: ColumnDef<Person>[] = [
    { field: 'id', header: 'ID', sortable: true, filterable: true, required: true, type: 'number' },
    { field: 'name', header: 'Name', sortable: true, filterable: true, required: true },
    { field: 'email', header: 'Email', sortable: true, filterable: true, type: 'email', required: true },
    { field: 'score', header: 'Score', sortable: true, filterable: true, type: 'number', required: true },
    { field: 'active', header: 'Active', type: 'boolean', sortable: true },
    { field: 'created', header: 'Created', type: 'date', sortable: true }
  ];

  const createRows = (): Person[] => ([
    { id: 1, name: 'Alice', email: 'alice@example.com', score: 90, active: true, created: '2024-01-01' },
    { id: 2, name: 'Bob', email: 'bob@other.com', score: 75, active: false, created: '2024-02-01' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', score: 80, active: true, created: '2024-03-01' }
  ]);

  const triggerColumnsChange = () => {
    component.ngOnChanges({
      columns: new SimpleChange(null, component.columns, true)
    });
  };

  const createEventForTarget = (target: HTMLElement): MouseEvent => {
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: target, configurable: true });
    return event;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Datagrid],
      providers: [{ provide: NgbExportService, useClass: MockExportService }]
    }).compileComponents();

    fixture = TestBed.createComponent(Datagrid<Person>);
    component = fixture.componentInstance;
    exporter = TestBed.inject(NgbExportService) as unknown as MockExportService;
    component.columns = [...baseColumns];
    component.data = createRows();
    component.filters = {};
    component.globalFilter = '';
    component.enableFiltering = true;
    component.enableGlobalFilter = true;
    component.enableSorting = true;
    component.enablePagination = true;
    component.pageSize = 2;
    component.page = 1;
    component.exportOptions = {
      enabled: false,
      type: 'both',
      pages: 'current',
      fileName: 'export'
    };
    triggerColumnsChange();
    fixture.detectChanges();
  });

  afterEach(() => jest.clearAllMocks());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filters rows using per-column and global filters', () => {
    component.enableFiltering = true;
    component.enableGlobalFilter = true;
    component.filters = { name: 'ali' } as Record<string, string>;
    component.globalFilter = 'example.com';

    const filtered = component.filtered;

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Alice');
  });

  it('sorts rows when sorting is active', () => {
    component.enableSorting = true;
    component.sort = { active: 'score', direction: 'desc' };

    const sorted = component.sorted;
    expect(sorted.map(r => r.name)).toEqual(['Alice', 'Charlie', 'Bob']);

    component.sort = { active: 'score', direction: '' };
    expect(component.sorted).toEqual(component.filtered);
  });

  it('paginates rows and exposes indexes', () => {
    component.enablePagination = true;
    component.pageSize = 2;
    component.page = 2;
    component.sort = { active: 'id', direction: 'asc' };

    const paged = component.paged;
    expect(paged).toEqual([component.sorted[2]]);
    expect(component.startIndex).toBe(3);
    expect(component.endIndex).toBe(component.sorted.length);
  });

  it('computes metadata helpers for headers and detail column spans', () => {
    component.enableEdit = true;
    component.rowDetailTpl = {} as any;
    const column = component.columns[1];

    expect(component.detailColspan).toBe(component.columns.length + 2);
    expect(component.headerText(column)).toBe('Name');
    expect(component.columnFilterAriaLabel(column)).toBe('Name filter');
    expect(component.inputAriaLabel(column)).toBe('Name');

    component.sort = { active: 'name', direction: 'asc' };
    expect(component.ariaSortFor('name')).toBe('ascending');
    expect(component.sortButtonAriaLabel(column)).toContain('ascending');
    expect(component.exportAriaLabel('pdf')).toBe(component.exportPdfAriaLabel);
  });

  it('starts add flow with defaults and validators', () => {
    component.enableAdd = true;
    component.startAdd();

    expect(component.addingNew).toBe(true);
    expect(component.addForm.get('name')?.value).toBe('');
    expect(component.addForm.get('score')?.value).toBe('');
    expect(component.saveAttemptedNew).toBe(false);
  });

  it('emits rowAdd when saveAdd succeeds', () => {
    component.enableAdd = true;
    component.startAdd();
    const emitSpy = jest.spyOn(component.rowAdd, 'emit');

    component.addForm.setValue({
      id: 4,
      name: 'Dana',
      email: 'dana@example.com',
      score: 50,
      active: true,
      created: '2024-04-01'
    });

    component.saveAdd();

    expect(emitSpy).toHaveBeenCalledWith({
      newRow: {
        id: 4,
        name: 'Dana',
        email: 'dana@example.com',
        score: 50,
        active: true,
        created: '2024-04-01'
      }
    });
    expect(component.addingNew).toBe(false);
  });

  it('blocks saveAdd when invalid', () => {
    component.enableAdd = true;
    component.startAdd();
    const emitSpy = jest.spyOn(component.rowAdd, 'emit');

    component.addForm.patchValue({ name: '' });
    component.saveAdd();

    expect(emitSpy).not.toHaveBeenCalled();
    expect(component.addingNew).toBe(true);
  });

  it('starts edit mode and emits rowEdit', () => {
    component.enableEdit = true;
    const emitSpy = jest.spyOn(component.rowEdit, 'emit');

    component.startEdit(0);

    expect(component.editingIndex).toBe(0);
    expect(component.editForm.get('name')?.value).toBe('Alice');
    expect(emitSpy).toHaveBeenCalledWith({ row: component.data[0], index: 0 });
  });

  it('emits rowSave with merged payload', () => {
    component.enableEdit = true;
    component.startEdit(0);
    const emitSpy = jest.spyOn(component.rowSave, 'emit');

    component.editForm.patchValue({ name: 'Alice Cooper' });
    component.saveEdit(0);

    expect(emitSpy).toHaveBeenCalledWith({
      original: component.data[0],
      updated: { ...component.data[0], name: 'Alice Cooper' },
      index: 0
    });
    expect(component.editingIndex).toBeNull();
  });

  it('prevents saveEdit when invalid', () => {
    component.enableEdit = true;
    component.startEdit(0);
    const emitSpy = jest.spyOn(component.rowSave, 'emit');

    component.editForm.patchValue({ email: 'bad-email' });
    component.editForm.get('email')?.setErrors({ email: true });
    component.saveEdit(0);

    expect(emitSpy).not.toHaveBeenCalled();
    expect(component.editingIndex).toBe(0);
  });

  it('cancels edit and emits rowCancel', () => {
    component.enableEdit = true;
    component.startEdit(1);
    const emitSpy = jest.spyOn(component.rowCancel, 'emit');

    component.cancelEdit(1);

    expect(emitSpy).toHaveBeenCalledWith({ row: component.data[1], index: 1 });
    expect(component.editingIndex).toBeNull();
  });

  it('emits rowDelete when deleteRow invoked', () => {
    component.enableDelete = true;
    component.pageSize = 3; // ensure paged contains third entry
    const emitSpy = jest.spyOn(component.rowDelete, 'emit');

    component.deleteRow(2);

    expect(emitSpy).toHaveBeenCalledWith({ row: component.data[2], index: 2 });
  });

  it('cycles sort direction and emits sortChange', () => {
    component.enableSorting = true;
    const emitSpy = jest.spyOn(component.sortChange, 'emit');

    component.toggleSort('name');
    expect(component.sort).toEqual({ active: 'name', direction: 'asc' });
    component.toggleSort('name');
    expect(component.sort).toEqual({ active: 'name', direction: 'desc' });
    component.toggleSort('name');
    expect(component.sort).toEqual({ active: 'name', direction: '' });
    expect(emitSpy).toHaveBeenCalledTimes(3);
  });

  it('emits filter events on global and column changes', () => {
    component.enableFiltering = true;
    component.enableGlobalFilter = true;
    component.filters = { name: 'A' } as Record<string, string>;
    component.globalFilter = 'alice';
    component.page = 3;
    const emitSpy = jest.spyOn(component.filtersChange, 'emit');

    component.onGlobalFilterChange();
    expect(component.page).toBe(1);
    expect(emitSpy).toHaveBeenCalledWith({ global: 'alice', columns: { name: 'A' } });

    component.filters = { email: '@example' } as Record<string, string>;
    component.page = 2;
    component.onColumnFilterChange();
    expect(component.page).toBe(1);
    expect(emitSpy).toHaveBeenCalledWith({ global: 'alice', columns: { email: '@example' } });
  });

  it('emits pagination changes when page or size updates', () => {
    const emitSpy = jest.spyOn(component.pageChange, 'emit');

    component.onPageChange(2);
    expect(component.page).toBe(2);
    expect(emitSpy).toHaveBeenCalledWith({ page: 2, pageSize: component.pageSize });

    component.page = 3;
    component.onPageSizeChange();
    expect(component.page).toBe(1);
    expect(emitSpy).toHaveBeenCalledWith({ page: 1, pageSize: component.pageSize });

    component.onPage(4);
    expect(component.page).toBe(4);

    component.onPageSize(25);
    expect(component.page).toBe(1);
    expect(emitSpy).toHaveBeenCalledWith({ page: 1, pageSize: 25 });
  });

  it('toggles expanded rows and honors singleExpand', () => {
    component.toggleExpand(0);
    expect(component.isExpanded(0)).toBe(true);
    component.toggleExpand(0);
    expect(component.isExpanded(0)).toBe(false);

    component.singleExpand = true;
    component.toggleExpand(0);
    component.toggleExpand(1);
    expect(component.isExpanded(0)).toBe(false);
    expect(component.isExpanded(1)).toBe(true);
  });

  it('starts editing when row clicked outside interactive targets', () => {
    component.enableEdit = true;
    component.editOnRowClick = true;
    const target = document.createElement('div');
    const event = createEventForTarget(target);

    component.onRowClick(event, 0);

    expect(component.editingIndex).toBe(0);
  });

  it('ignores row clicks on interactive elements', () => {
    component.enableEdit = true;
    component.editOnRowClick = true;
    const button = document.createElement('button');
    const event = createEventForTarget(button);

    component.onRowClick(event, 0);

    expect(component.editingIndex).toBeNull();
  });

  it('evaluates helper utilities', () => {
    expect(component.asBool(true)).toBe(true);
    expect(component.asBool(false)).toBe(false);
    expect(component.asBool({ enabled: true })).toBe(true);
    expect(component.asBool({ enabled: false })).toBe(false);

    component.responsive = true;
    expect(component.isResponsiveEnabled()).toBe(true);

    const opts: NgbDataGridResponsiveOptions = { enabled: true, breakpoint: 'md' } as any;
    component.responsive = opts;
    expect(component.isResponsiveEnabled()).toBe(true);

    component.responsive = { enabled: false } as any;
    expect(component.isResponsiveEnabled()).toBe(false);
  });

  it('delegates export via triggerExport', () => {
    component.exportOptions.enabled = true;
    const exportSpy = jest.spyOn(component, 'export').mockResolvedValue();

    component.triggerExport('pdf');

    expect(exportSpy).toHaveBeenCalledWith('pdf');
  });

  it('exports PDF using current page data', async () => {
    component.enablePagination = false;
    component.exportOptions = {
      enabled: true,
      type: 'pdf',
      pages: 'current',
      fileName: 'report'
    };

    await component.export('pdf');

    expect(exporter.exportPdf).toHaveBeenCalledWith({
      fileName: 'report',
      columns: component.columns.map(c => c.field),
      rows: component.paged,
      options: undefined
    });
  });

  it('exports Excel using dataProviderAll when pages="all"', async () => {
    component.exportOptions = {
      enabled: true,
      type: 'excel',
      pages: 'all',
      fileName: 'report',
      excel: { sheetName: 'All' }
    };
    const providerRows = [{ id: 10, name: 'Zoe', email: 'zoe@example.com', score: 60, active: true, created: '2024-05-01' }];
    component.dataProviderAll = () => Promise.resolve(providerRows);

    await component.export('excel');

    expect(exporter.exportExcel).toHaveBeenCalledWith({
      fileName: 'report',
      sheetName: 'All',
      columns: component.columns.map(c => ({ key: c.field, title: c.header })),
      rows: providerRows
    });
  });

  it('exports selection data when pages="selection"', async () => {
    component.exportOptions = {
      enabled: true,
      type: 'both',
      pages: 'selection',
      fileName: 'selection'
    };
    const selection = [component.data[1]];
    component.dataProviderSelection = () => selection;

    await component.export('pdf');

    expect(exporter.exportPdf).toHaveBeenCalledWith({
      fileName: 'selection',
      columns: component.columns.map(c => c.field),
      rows: selection,
      options: undefined
    });
  });
});
