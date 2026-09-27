import { Component, ViewChild, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { Datagrid } from '../datagrid/datagrid.component';
import { NgbGridUndoToolDirective, NgbGridRedoToolDirective } from './datagrid-history-tool.directive';
import { NgbDatagridToolbarComponent } from '../datagrid/components/datagrid-toolbar.component';
import { NgbDataGridHistoryDirective } from './datagrid-history.directive';

@Component({ standalone: true, imports: [Datagrid, NgbDataGridHistoryDirective],
  template: `<button type="button" [disabled]="!history.canUndo()" (click)="history.undo()">Undo</button>
    <button type="button" [disabled]="!history.canRedo()" (click)="history.redo()">Redo</button>
    <ngb-datagrid ngbGridHistory #history="ngbGridHistory" [historyLimit]="limit" [columns]="columns" [data]="rows" />` })
class Host {
  @ViewChild(Datagrid) grid!: Datagrid;
  @ViewChild(NgbDataGridHistoryDirective) history!: NgbDataGridHistoryDirective;
  limit = 20;
  columns = [{ field: 'id', header: 'ID', width: 100 }, { field: 'due', header: 'Due', type: 'date' as const, width: 150 }];
  rows = [{ id: 1, due: new Date('2026-09-01') }];
}

describe('DataGrid configuration history', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));
  function setup() {
    const fixture = TestBed.createComponent(Host); fixture.detectChanges();
    return { fixture, host: fixture.componentInstance, grid: fixture.componentInstance.grid, history: fixture.componentInstance.history };
  }
  it('starts empty and undoes/redoes a column change with one remote event per action', () => {
    const { grid, history } = setup();
    expect(history.ready()).toBe(true); expect(history.undo()).toMatchObject({ reason: 'empty-history' });
    const baseline = grid.captureView(); grid.setColumnHidden('due', true); const changed = grid.captureView();
    const notification = jest.fn(); grid.dataStateChange.subscribe(notification);
    expect(history.undoCount()).toBe(1);
    expect(history.undo().success).toBe(true); expect(grid.captureView()).toEqual(baseline);
    expect(notification).toHaveBeenCalledTimes(1); expect(history.redoCount()).toBe(1);
    expect(history.redo().success).toBe(true); expect(grid.captureView()).toEqual(changed);
    expect(notification).toHaveBeenCalledTimes(2); expect(history.undoCount()).toBe(1);
    expect(history.redo()).toMatchObject({ reason: 'empty-history' });
  });
  it('handles scoped Ctrl/Meta Undo and Redo shortcuts and emits one result per action', () => {
    const { fixture, grid, history } = setup();
    const host = fixture.nativeElement.querySelector('ngb-datagrid');
    const result = jest.fn(); history.historyKeyboardResult.subscribe(result);
    const press = (key: string, options: KeyboardEventInit) => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options });
      host.dispatchEvent(event); return event;
    };
    grid.setColumnHidden('due', true);
    expect(press('z', { ctrlKey: true }).defaultPrevented).toBe(true);
    expect(history.redoCount()).toBe(1);
    press('Z', { metaKey: true, shiftKey: true }); expect(history.undoCount()).toBe(1);
    press('z', { metaKey: true }); expect(history.redoCount()).toBe(1);
    press('y', { ctrlKey: true }); expect(history.undoCount()).toBe(1);
    press('z', { ctrlKey: true }); press('z', { ctrlKey: true, shiftKey: true });
    expect(result).toHaveBeenCalledTimes(6);
    expect(press('y', { ctrlKey: true }).defaultPrevented).toBe(false);
  });
  it('preserves native editing and ignores outside, nested, disabled and modified shortcuts', () => {
    const { fixture, grid, history } = setup();
    const host = fixture.nativeElement.querySelector('ngb-datagrid');
    grid.setColumnHidden('due', true);
    const press = (target: HTMLElement, options: KeyboardEventInit = {}) => {
      const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true, ...options });
      target.dispatchEvent(event); expect(event.defaultPrevented).toBe(false);
    };
    for (const tag of ['input', 'textarea', 'select', 'ngb-datagrid']) {
      const child = document.createElement(tag); host.append(child); press(child); child.remove();
    }
    const editable = document.createElement('div'); editable.contentEditable = 'true';
    editable.setAttribute('contenteditable', 'true'); host.append(editable); press(editable); editable.remove();
    press(fixture.nativeElement.querySelector('button'));
    for (const options of [{ altKey: true }, { repeat: true }, { isComposing: true }, { ctrlKey: false }]) press(host, options);
    history.historyKeyboard = false; press(host);
    expect(history.undoCount()).toBe(1);
  });
  it('reports active-editor rejection from a shortcut without losing history', () => {
    const { fixture, grid, history } = setup(); grid.setColumnHidden('due', true); grid.editingIndex = 0;
    const result = jest.fn(); history.historyKeyboardResult.subscribe(result);
    fixture.nativeElement.querySelector('ngb-datagrid').dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
    expect(result).toHaveBeenCalledWith(expect.objectContaining({ reason: 'editing' }));
    expect(history.undoCount()).toBe(1);
  });
  it('round trips dates, nested filters, sorting, groups, aggregates, search, page size and layout', () => {
    const { grid, history } = setup(); const baseline = grid.captureView(); const view = grid.captureView();
    view.state = { pageSize: 25, globalFilter: 'late', sort: [{ field: 'due', direction: 'desc' }],
      filter: { logic: 'and', filters: [{ logic: 'or', filters: [{ field: 'due', operator: 'lt', value: new Date('2026-09-01') }] }] },
      group: [{ field: 'due', dir: 'desc' }], aggregates: [{ field: 'id', aggregate: 'count' }] };
    view.columns = [{ ...view.columns[1], width: 220, sticky: 'end' }, view.columns[0]];
    grid.restoreView(view); const applied = grid.captureView();
    history.undo(); expect(grid.captureView()).toEqual(baseline);
    history.redo(); expect(grid.captureView()).toEqual(applied);
    expect(grid.captureView().state.filter.filters[0]).toEqual(view.state.filter.filters[0]);
  });
  it('deduplicates identical views and drops redo after a new change', () => {
    const { grid, history } = setup(); grid.setColumnHidden('due', true); history.record(); grid.restoreView(grid.captureView());
    expect(history.undoCount()).toBe(1); history.undo(); expect(history.canRedo()).toBe(true);
    grid.setColumnHidden('id', true); expect(history.redoCount()).toBe(0); expect(history.undoCount()).toBe(1);
  });
  it('bounds history and trims it when the limit changes', () => {
    const { fixture, host, grid, history } = setup(); host.limit = 2; fixture.detectChanges();
    for (const pageSize of [10, 20, 30]) { const view = grid.captureView(); view.state.pageSize = pageSize; grid.restoreView(view); }
    expect(history.undoCount()).toBe(2); history.undo(); expect(grid.pageSize).toBe(20);
    history.undo(); expect(grid.pageSize).toBe(10); history.redo(); history.redo(); host.limit = 1; fixture.detectChanges();
    expect(history.undoCount()).toBe(1);
    expect(() => { history.historyLimit = 0; }).toThrow('historyLimit');
    expect(() => { history.historyLimit = Infinity; }).toThrow('historyLimit');
  });
  it('keeps stacks intact and sends no request while an editor blocks undo or redo', () => {
    const { grid, history } = setup(); grid.setColumnHidden('due', true);
    const changed = grid.captureView(); const notify = jest.fn(); grid.dataStateChange.subscribe(notify); grid.editingIndex = 0;
    expect(history.undo()).toMatchObject({ reason: 'editing' }); expect(grid.captureView()).toEqual(changed);
    expect(history.undoCount()).toBe(1); expect(notify).not.toHaveBeenCalled();
    grid.editingIndex = null; history.undo(); grid.editingIndex = 0;
    expect(history.redo()).toMatchObject({ reason: 'editing' }); expect(history.redoCount()).toBe(1);
    grid.editingIndex = null; history.redo(); expect(history.error()).toBe('');
  });
  it('clears both stacks without changing the grid or issuing a data request', () => {
    const { grid, history } = setup(); grid.setColumnHidden('due', true); history.undo();
    const state = grid.captureView(); const notify = jest.fn(); grid.dataStateChange.subscribe(notify); history.clear();
    expect(grid.captureView()).toEqual(state); expect(notify).not.toHaveBeenCalled();
    expect(history.canUndo()).toBe(false); expect(history.canRedo()).toBe(false);
  });
  it('records explicit input changes and rejects unsupported values without losing history', () => {
    const { grid, history } = setup(); grid.pageSize = 25; expect(history.record().success).toBe(true); expect(history.undoCount()).toBe(1);
    const spy = jest.spyOn(grid, 'captureView').mockImplementation(() => { throw new Error('Unsupported'); });
    expect(history.record()).toMatchObject({ reason: 'invalid-state' }); expect(history.undo()).toMatchObject({ reason: 'invalid-state' });
    expect(history.undoCount()).toBe(1); spy.mockRestore(); history.undo(); expect(grid.pageSize).not.toBe(25);
  });
  it('reconciles removed columns and keeps row data unchanged', () => {
    const { grid, history } = setup(); const rows = grid.data; grid.setColumnHidden('due', true);
    grid.columns = [{ field: 'id', header: 'ID', width: 100 }, { field: 'owner', header: 'Owner', width: 120 }];
    expect(history.undo()).toEqual({ success: true, ignoredFields: ['due'] });
    expect(grid.captureView().columns.map(col => col.field)).toEqual(['id', 'owner']); expect(grid.data).toBe(rows);
  });
  it('updates native button states and disconnects when destroyed', () => {
    const { fixture, grid, history } = setup(); const buttons = fixture.nativeElement.querySelectorAll('button');
    fixture.detectChanges(); expect(buttons[0].disabled).toBe(true); expect(buttons[1].disabled).toBe(true);
    grid.setColumnHidden('due', true); fixture.detectChanges(); expect(buttons[0].disabled).toBe(false);
    buttons[0].click(); fixture.detectChanges(); expect(buttons[0].disabled).toBe(true); expect(buttons[1].disabled).toBe(false);
    fixture.destroy(); const count = history.undoCount(); grid.viewChange.emit(grid.captureView()); expect(history.undoCount()).toBe(count);
  });
});

@Component({ standalone: true, imports: [Datagrid, NgbDataGridHistoryDirective, NgbGridUndoToolDirective, NgbGridRedoToolDirective, NgbDatagridToolbarComponent],
  template: `<ngb-datagrid #grid ngbGridHistory [columns]="columns" [data]="rows" [enableGlobalFilter]="true">
    <ngb-datagrid-toolbar [grid]="grid">
      <button ngbGridUndoTool class="custom-undo" [disabled]="restricted()" (historyResult)="results.push($event)">Revert layout</button>
      <button ngbGridRedoTool aria-label="Reapply layout" (historyResult)="results.push($event)"><span aria-hidden="true">↪</span></button>
    </ngb-datagrid-toolbar>
  </ngb-datagrid>` })
class ToolbarHost extends Host {
  restricted = signal(false);
  results: unknown[] = [];
}

describe('Projected grid history tools', () => {
  it('inherits grid history, respects custom content and restrictions, and emits one result per action', () => {
    TestBed.configureTestingModule({ imports: [ToolbarHost] });
    const fixture = TestBed.createComponent(ToolbarHost); fixture.detectChanges(); fixture.detectChanges();
    const host = fixture.componentInstance;
    const toolbar = fixture.nativeElement.querySelector('ngb-datagrid ngb-datagrid-toolbar');
    expect(fixture.nativeElement.querySelectorAll('ngb-datagrid-toolbar')).toHaveLength(1);
    expect(toolbar.querySelectorAll('input[type=search]')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('.ngb-grid__layout-toolbar-host')).toBeNull();
    expect(fixture.nativeElement.querySelector('ngb-datagrid-layout-toolbar')).toBeNull();
    expect(fixture.nativeElement.querySelector('ngb-datagrid-editing-toolbar')).toBeNull();
    const undo = toolbar.querySelector('[ngbGridUndoTool]'); const redo = toolbar.querySelector('[ngbGridRedoTool]');
    expect(undo.textContent).toBe('Revert layout'); expect(undo.classList.contains('custom-undo')).toBe(true);
    expect(redo.getAttribute('aria-label')).toBe('Reapply layout'); expect(undo.type).toBe('button');
    expect(undo.disabled).toBe(true); expect(redo.disabled).toBe(true);
    host.grid.setColumnHidden('due', true); fixture.detectChanges();
    host.restricted.set(true); fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); expect(fixture.debugElement.query(By.directive(NgbGridUndoToolDirective)).injector.get(NgbGridUndoToolDirective).disabled).toBe(true); expect(undo.disabled).toBe(true); undo.click(); expect(host.results).toHaveLength(0);
    host.restricted.set(false); fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); expect(undo.disabled).toBe(false);
    const notify = jest.fn(); host.grid.dataStateChange.subscribe(notify);
    undo.click(); fixture.detectChanges(); expect(redo.disabled).toBe(false); expect(undo.disabled).toBe(true);
    redo.click(); fixture.detectChanges(); expect(notify).toHaveBeenCalledTimes(2);
    expect(host.results).toEqual([{ success: true, ignoredFields: [] }, { success: true, ignoredFields: [] }]);
    host.grid.editingIndex = 0; undo.click(); fixture.detectChanges();
    expect(host.results[2]).toMatchObject({ success: false, reason: 'editing' }); expect(host.history.undoCount()).toBe(1);
  });
});

describe('Saved edit history', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));
  function setup() {
    const fixture = TestBed.createComponent(Host); fixture.detectChanges();
    const { grid, history } = fixture.componentInstance;
    grid.enableEdit = true;
    grid.columns = [{ field: 'id', header: 'ID', editable: false }, { field: 'name', header: 'Name', editable: true, required: true }];
    grid.data = [{ id: 1, name: 'Before', nested: { dates: [new Date('2026-09-01')] } }, { id: 2, name: 'Other' }];
    history.clear();
    return { fixture, grid, history };
  }
  function save(grid: Datagrid, name: string) {
    grid.startEdit(0); grid.editForm.get('name')!.setValue(name); grid.saveEdit(0);
  }
  it('undoes/redoes a saved edit and emits one rowSave marker without a configuration reload', () => {
    const { grid, history } = setup(); const rows = jest.fn(), state = jest.fn();
    grid.rowSave.subscribe(rows); grid.dataStateChange.subscribe(state);
    save(grid, 'After'); expect(history.undoCount()).toBe(1);
    expect(history.undo().success).toBe(true); expect(grid.data[0].name).toBe('Before');
    expect(grid.data[0].nested.dates[0]).toEqual(new Date('2026-09-01'));
    expect(rows.mock.calls[1][0]).toMatchObject({ index: 0, historyAction: 'undo', updated: { name: 'Before' } });
    expect(history.redo().success).toBe(true); expect(grid.data[0].name).toBe('After');
    expect(rows.mock.calls[2][0]).toMatchObject({ historyAction: 'redo', updated: { name: 'After' } });
    expect(rows).toHaveBeenCalledTimes(3); expect(state).not.toHaveBeenCalled(); expect(grid.data[1].name).toBe('Other');
  });
  it('keeps successive saves and configuration changes in one chronological stack', () => {
    const { grid, history } = setup(); save(grid, 'Second'); save(grid, 'Third'); grid.setColumnHidden('name', true);
    expect(history.undoCount()).toBe(3); history.undo(); expect(grid.columns[1].hidden).toBe(false);
    history.undo(); expect(grid.data[0].name).toBe('Second'); history.undo(); expect(grid.data[0].name).toBe('Before');
    history.redo(); history.redo(); expect(grid.data[0].name).toBe('Third'); history.redo(); expect(grid.columns[1].hidden).toBe(true);
  });
  it('does not record invalid saves, cancel or unchanged values, and clears redo on a new save', () => {
    const { grid, history } = setup(); save(grid, ''); expect(history.undoCount()).toBe(0);
    grid.cancelEdit(0); save(grid, 'Before'); expect(history.undoCount()).toBe(0);
    save(grid, 'Second'); history.undo(); save(grid, 'Branch'); expect(history.redoCount()).toBe(0); expect(history.undoCount()).toBe(1);
  });
  it('rejects historical values that violate current validation without consuming the entry', () => {
    const { grid, history } = setup(); grid.data[0].name = ''; history.clear(); save(grid, 'Valid');
    expect(history.undo()).toMatchObject({ reason: 'validation' }); expect(grid.data[0].name).toBe('Valid'); expect(history.undoCount()).toBe(1);
  });
  it('keeps form controls attached until focused inline editors are removed', async () => {
    const { fixture, grid } = setup(); fixture.detectChanges(); grid.startEdit(0); fixture.detectChanges(); await fixture.whenStable();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[aria-label="Name"]'); input.focus();
    grid.editForm.get('name')!.setValue('Focused save'); const form = grid.editForm;
    grid.saveEdit(0); expect(grid.editForm).toBe(form);
    input.dispatchEvent(new Event('blur')); fixture.detectChanges(); await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('input[aria-label="Name"]')).toBeNull();
    expect(Object.keys(grid.editForm.controls)).toHaveLength(0);
  });
  it('records in-cell and external saves', () => {
    const { grid, history } = setup();
    grid.startIncellEdit(0, 'name'); grid.editForm.get('name')!.setValue('Cell'); grid.commitIncellEdit();
    expect(history.undoCount()).toBe(1); history.undo(); expect(grid.data[0].name).toBe('Before'); history.redo();
    grid.openExternalEdit(0); grid.externalForm.get('name')!.setValue('Dialog'); grid.saveExternalEdit();
    expect(history.undoCount()).toBe(2); history.undo(); expect(grid.data[0].name).toBe('Cell');
  });
  it('preserves an active editor and rejects conflicting external row changes', () => {
    const { grid, history } = setup(); save(grid, 'After'); grid.startEdit(0);
    expect(history.undo()).toMatchObject({ reason: 'editing' }); expect(history.undoCount()).toBe(1); grid.cancelEdit(0);
    grid.data[0].name = 'External change'; expect(history.undo()).toMatchObject({ reason: 'row-conflict' });
    expect(grid.data[0].name).toBe('External change'); expect(history.undoCount()).toBe(1);
  });
  it('supports immutable reloads with a unique stable trackBy and rejects deleted rows', () => {
    const { grid, history } = setup(); grid.trackBy = (_i, row) => row.id; save(grid, 'After');
    grid.data = [...grid.data].reverse().map(row => ({ ...row }));
    expect(history.undo().success).toBe(true); expect(grid.data[1].name).toBe('Before');
    grid.data = grid.data.filter(row => row.id !== 1); expect(history.redo()).toMatchObject({ reason: 'row-conflict' });
  });
  it('clears stacks after inserts/deletes and reports unsupported rows without breaking save', () => {
    const { grid, history } = setup(); save(grid, 'After'); grid.rowAdd.emit({ newRow: {} }); expect(history.undoCount()).toBe(0);
    save(grid, 'Next'); grid.rowDelete.emit({ row: {}, index: 1 }); expect(history.undoCount()).toBe(0);
    grid.data[0].callback = () => 1; save(grid, 'Still saved'); expect(grid.data[0].name).toBe('Still saved');
    expect(history.undoCount()).toBe(0); expect(history.error()).toContain('unsupported');
  });
});
