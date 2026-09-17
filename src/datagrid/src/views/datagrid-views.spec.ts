import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Datagrid } from '../datagrid/datagrid.component';
import { NgbDataGridViewsComponent } from './datagrid-views.component';
import { NgbMemoryGridViewStore } from './grid-view';

function createGrid(): ComponentFixture<Datagrid> {
  const fixture = TestBed.createComponent(Datagrid);
  fixture.componentRef.setInput('columns', [
    { field: 'id', header: 'Invoice', locked: true, width: 100 },
    { field: 'amount', header: 'Amount', width: 120, minResizableWidth: 80, maxResizableWidth: 240 },
    { field: 'due', header: 'Due', type: 'date', filterable: true, width: 150 },
  ]);
  fixture.componentRef.setInput('data', [{ id: 1, amount: 10, due: new Date('2026-09-01') }]);
  fixture.detectChanges(); return fixture;
}

describe('DataGrid saved view restoration', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Datagrid] }));
  it('restores nested filters, grouping, search, sorting, layout and page size with one remote notification', () => {
    const fixture = createGrid(); const grid = fixture.componentInstance;
    const view = grid.captureView();
    view.state = { pageSize: 25, globalFilter: 'overdue', sort: [{ field: 'amount', direction: 'desc' }], group: [{ field: 'due', aggregates: [{ field: 'amount', aggregate: 'sum' }] }],
      filter: { logic: 'and', filters: [{ logic: 'or', filters: [{ field: 'due', operator: 'lt', value: new Date('2026-09-01') }] }] } };
    view.columns = [view.columns[0], { ...view.columns[2], hidden: true, sticky: 'end' }, { ...view.columns[1], width: 200 }];
    grid.page = 5;
    const data = jest.fn(); const change = jest.fn(); grid.dataStateChange.subscribe(data); grid.viewChange.subscribe(change);
    expect(grid.restoreView(view).success).toBe(true);
    expect(grid.page).toBe(1); expect(data).toHaveBeenCalledTimes(1); expect(change).toHaveBeenCalledTimes(1);
    expect(grid.captureView().state).toMatchObject(view.state);
    expect(grid.captureView().columns).toEqual(view.columns);
    expect(grid.data).toHaveLength(1);
  });
  it('ignores removed fields, appends new defaults and honors width and locking constraints', () => {
    const grid = createGrid().componentInstance; const view = grid.captureView();
    view.columns[0].hidden = true; view.columns[0].sticky = 'end'; view.columns[1].width = 999;
    view.columns.push({ field: 'removed', hidden: false, sticky: false, width: 90, locked: false });
    view.state.sort = [{ field: 'removed', direction: 'asc' }];
    grid.columns = [...grid.columns, { field: 'status', header: 'Status', hidden: true, width: 140 }];
    expect(grid.restoreView(view)).toEqual({ success: true, ignoredFields: ['removed'] });
    const result = grid.captureView();
    expect(result.columns[0].hidden).toBe(false); expect(result.columns[0].sticky).toBe(false);
    expect(result.columns[1].width).toBe(240); expect(result.columns.at(-1)?.field).toBe('status'); expect(result.columns.at(-1)?.hidden).toBe(true);
    expect(result.state.sort).toEqual([]);
  });
  it('rejects invalid snapshots atomically and refuses to discard an edit', () => {
    const grid = createGrid().componentInstance; const initial = grid.captureView(); const emit = jest.fn(); grid.dataStateChange.subscribe(emit);
    expect(grid.restoreView({ ...initial, version: 99 }).success).toBe(false); expect(grid.captureView()).toEqual(initial);
    grid.editingIndex = 0;
    expect(grid.restoreView(initial)).toMatchObject({ success: false, reason: 'editing' });
    expect(emit).not.toHaveBeenCalled();
  });
  it('formats restored dates for native date inputs while keeping Date snapshot values', () => {
    const fixture = createGrid(); const grid = fixture.componentInstance;
    fixture.componentRef.setInput('filterable', 'row'); fixture.detectChanges();
    const view = grid.captureView(); const date = new Date('2026-09-01T00:00:00Z');
    view.state.filter = { logic: 'and', filters: [{ field: 'due', operator: 'lt', value: date }] };
    grid.restoreView(view); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[type="date"]').value).toBe('2026-09-01');
    expect(grid.captureView().state.filter).toEqual(view.state.filter);
  });
  it('refreshes OnPush header and row cells together after visibility changes and restoration', () => {
    const fixture = createGrid(); const grid = fixture.componentInstance; const original = grid.captureView();
    const counts = () => [fixture.nativeElement.querySelectorAll('.grid-header thead tr:first-child th').length, fixture.nativeElement.querySelectorAll('.grid-data-row:first-child td').length];
    grid.setColumnHidden('due', true); fixture.detectChanges(); expect(counts()).toEqual([2, 2]);
    grid.restoreView(original); fixture.detectChanges(); expect(counts()).toEqual([3, 3]);
  });
  it('preserves restored widths and order when toggling visibility', () => {
    const grid = createGrid().componentInstance; const view = grid.captureView();
    view.columns = [view.columns[0], view.columns[2], { ...view.columns[1], width: 220 }];
    grid.restoreView(view); grid.setColumnHidden('due', true); grid.setColumnHidden('due', false);
    expect(grid.captureView().columns).toEqual(view.columns);
  });
  it('allows filtering and sort clearing after restoring a view', () => {
    const grid = createGrid().componentInstance; const view = grid.captureView();
    view.state.filter = { logic: 'and', filters: [{ field: 'amount', operator: 'gt', value: 5 }] };
    view.state.sort = [{ field: 'amount', direction: 'desc' }];
    grid.restoreView(view); const changed = jest.fn(); grid.viewChange.subscribe(changed);
    grid.clearAllFilters(); grid.clearSorting();
    expect(grid.captureView().state.filter?.filters).toEqual([]);
    expect(grid.captureView().state.sort).toEqual([]); expect(changed).toHaveBeenCalledTimes(2);
  });
  it('keeps ARIA row semantics when drag and drop directives are attached', () => {
    const fixture = createGrid();
    expect(fixture.nativeElement.querySelector('.grid-body tbody').getAttribute('role')).toBe('rowgroup');
    expect(fixture.nativeElement.querySelector('.grid-data-row').getAttribute('role')).toBe('row');
    expect(fixture.nativeElement.querySelector('[role="grid"] .grid-header')).toBeTruthy();
  });
});

describe('Views control', () => {
  let fixture: ComponentFixture<NgbDataGridViewsComponent>;
  let control: NgbDataGridViewsComponent;
  let grid: Datagrid;
  let store: NgbMemoryGridViewStore;
  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [Datagrid, NgbDataGridViewsComponent] });
    grid = createGrid().componentInstance; store = new NgbMemoryGridViewStore();
    fixture = TestBed.createComponent(NgbDataGridViewsComponent); control = fixture.componentInstance;
    fixture.componentRef.setInput('grid', grid); fixture.componentRef.setInput('storageKey', 'invoices'); fixture.componentRef.setInput('store', store);
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
  });
  it('saves, marks dirty, updates, renames, resets and confirms deletion without changing rows', async () => {
    control.begin('save'); control.name = 'Overdue'; await control.saveName(); expect(control.views()).toHaveLength(1);
    const initial = grid.captureView(); const altered = grid.captureView(); altered.state.pageSize = 25; grid.restoreView(altered);
    expect(control.dirty()).toBe(true); await control.update(); expect(control.dirty()).toBe(false);
    control.begin('rename'); control.name = 'Due soon'; await control.saveName(); expect(control.views()[0].name).toBe('Due soon');
    control.reset(); expect(grid.captureView()).toEqual(initial);
    control.selectView(control.views()[0].id); expect(grid.pageSize).toBe(25);
    await control.remove(); expect(control.views()).toHaveLength(1);
    control.confirmDelete.set(true); await control.remove(); expect(control.views()).toHaveLength(0); expect(grid.pageSize).toBe(25);
  });
  it('rejects duplicate and empty names without saving', async () => {
    control.begin('save'); control.name = ''; await control.saveName(); expect(control.error()).toContain('name');
    control.name = 'Invoices'; await control.saveName(); control.begin('save'); control.name = ' invoices '; await control.saveName();
    expect(control.error()).toContain('already exists'); expect(control.views()).toHaveLength(1);
  });
  it('retains grid configuration on persistence failure and announces the error', async () => {
    const initial = grid.captureView(); jest.spyOn(store, 'save').mockRejectedValue(new Error('Storage denied'));
    control.begin('save'); control.name = 'Overdue'; await control.saveName(); fixture.detectChanges();
    expect(grid.captureView()).toEqual(initial); expect(control.views()).toEqual([]);
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Storage denied');
  });
  it('retains the dirty indicator if the grid changes while a save is pending', async () => {
    let finish!: () => void;
    jest.spyOn(store, 'save').mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
    control.begin('save'); control.name = 'Invoices'; const saving = control.saveName();
    const changed = grid.captureView(); changed.state.pageSize = 50; grid.restoreView(changed);
    finish(); await saving;
    expect(control.views()[0].snapshot.state.pageSize).not.toBe(50); expect(control.dirty()).toBe(true);
  });
  it('does not apply a view or reset while an editor is active', async () => {
    control.begin('save'); control.name = 'Invoices'; await control.saveName();
    const id = control.selected(); grid.editingIndex = 0; control.reset();
    expect(control.selected()).toBe(id); expect(control.error()).toContain('Save or cancel');
  });
  it('focuses the name field and returns focus on Escape; uses native controls for keyboard operation', async () => {
    control.begin('save'); fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input'); expect(document.activeElement).toBe(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); fixture.detectChanges();
    await fixture.whenStable(); expect(control.mode()).toBeNull(); expect(document.activeElement).toBe(fixture.nativeElement.querySelector('select'));
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeTruthy();
  });
});
