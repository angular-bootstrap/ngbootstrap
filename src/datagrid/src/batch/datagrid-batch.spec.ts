import { Component, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Datagrid } from '../datagrid/datagrid.component';
import { NgbDatagridToolbarComponent } from '../datagrid/components/datagrid-toolbar.component';
import { NgbGridBatchApplyToolDirective, NgbGridBatchDiscardToolDirective } from './datagrid-batch-tool.directive';
import { NgbDataGridHistoryDirective } from '../views/datagrid-history.directive';
import { ColumnDef } from '../models/column-def';
import { NgbGridBatchEditingDirective } from './datagrid-batch.directive';

interface Row { id: number; name: string; quantity: number; date: Date; }
@Component({ standalone: true, imports: [Datagrid, NgbDataGridHistoryDirective, NgbGridBatchEditingDirective, NgbDatagridToolbarComponent, NgbGridBatchApplyToolDirective, NgbGridBatchDiscardToolDirective], template: `
  <ngb-datagrid #grid ngbGridHistory ngbGridBatchEditing cellSelection="range" [columns]="columns" [data]="rows" [trackBy]="key" [enableEdit]="true">
    <ngb-datagrid-toolbar [grid]="grid"><button ngbGridBatchApplyTool>Apply changes</button><button ngbGridBatchDiscardTool>Discard</button></ngb-datagrid-toolbar>
  </ngb-datagrid>` })
class Host {
  @ViewChild(NgbDataGridHistoryDirective) history!: NgbDataGridHistoryDirective;
  @ViewChild(Datagrid) grid!: Datagrid<Row>;
  @ViewChild(NgbGridBatchEditingDirective) batch!: NgbGridBatchEditingDirective<Row>;
  key = (_index: number, row: Row) => row.id;
  columns: ColumnDef<Row>[] = [
    { field: 'id', header: 'ID', editable: false },
    { field: 'name', header: 'Name', required: true },
    { field: 'quantity', header: 'Quantity', type: 'number' },
    { field: 'date', header: 'Date', type: 'date' },
  ];
  rows: Row[] = [{ id: 1, name: 'One', quantity: 1, date: new Date('2026-01-01') }, { id: 2, name: 'Two', quantity: 2, date: new Date('2026-01-02') }];
}
function setup() {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host); fixture.detectChanges();
  const { grid, batch } = fixture.componentInstance;
  grid.onDataCellFocus(0, 1);
  return { fixture, grid, batch, host: fixture.componentInstance };
}

describe('DataGrid clipboard batches', () => {
  it('wires native Apply and Discard tools with correct busy/disabled state', async () => {
    const { grid, batch, fixture } = setup();
    const apply = fixture.nativeElement.querySelector('button[ngbGridBatchApplyTool]') as HTMLButtonElement;
    const discard = fixture.nativeElement.querySelector('button[ngbGridBatchDiscardTool]') as HTMLButtonElement;
    expect(apply.type).toBe('button'); expect(apply.disabled).toBe(true); expect(discard.disabled).toBe(true);
    batch.stagePaste('Draft'); fixture.detectChanges();
    expect(apply.disabled).toBe(false); expect(discard.disabled).toBe(false);
    let resolve!: (errors: []) => void; batch.batchValidator = () => new Promise(done => { resolve = done; });
    apply.click(); fixture.detectChanges();
    expect(apply.disabled).toBe(true); expect(apply.getAttribute('aria-busy')).toBe('true');
    discard.click(); resolve([]); await fixture.whenStable();
    expect(grid.data[0].name).toBe('One'); expect(batch.pendingCount()).toBe(0);
  });
  it('emits clipboard text and stages native paste only for grid content', () => {
    const { fixture, batch } = setup(); const root = fixture.nativeElement.querySelector('ngb-datagrid');
    const copy = new Event('copy', { bubbles: true, cancelable: true });
    const setData = jest.fn(); Object.defineProperty(copy, 'clipboardData', { value: { setData } });
    root.dispatchEvent(copy); expect(copy.defaultPrevented).toBe(true); expect(setData).toHaveBeenCalledWith('text/plain', 'One');
    const paste = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(paste, 'clipboardData', { value: { getData: () => 'Pasted' } });
    root.dispatchEvent(paste); expect(paste.defaultPrevented).toBe(true); expect(batch.pendingCount()).toBe(1);
  });
  it('converts with detached hooks and rejects oversized pastes without removing earlier drafts', () => {
    const { grid, batch } = setup();
    grid.columns[1].clipboardParse = (text, row) => { row.quantity = 999; return text.toUpperCase(); };
    batch.stagePaste('draft'); expect(grid.data[0].quantity).toBe(1);
    grid.columns[1].clipboardFormat = value => `Value: ${value}`;
    expect(batch.copySelection()).toEqual({ success: true, text: 'Value: DRAFT' });
    expect(batch.stagePaste('x'.repeat(1_048_577)).success).toBe(false); expect(batch.pendingCount()).toBe(1);
  });
  it('replays a batch and neighboring single-row edits in one history', async () => {
    const { grid, batch, host } = setup();
    grid.startEdit(0); grid.editForm.get('name')!.setValue('Saved'); grid.saveEdit(0);
    expect(host.history.undoCount()).toBe(1);
    grid.onDataCellFocus(0, 1); batch.stagePaste('Batch');
    expect(host.history.undo()).toMatchObject({ reason: 'editing' });
    await batch.applyBatch(); expect(host.history.undoCount()).toBe(2);
    expect(host.history.undo()).toMatchObject({ reason: 'async-required' });
    expect((await host.history.undoAsync()).success).toBe(true); expect(grid.data[0].name).toBe('Saved');
    expect(host.history.undo().success).toBe(true); expect(grid.data[0].name).toBe('One');
    expect(host.history.redo().success).toBe(true); expect(grid.data[0].name).toBe('Saved');
    expect((await host.history.redoAsync()).success).toBe(true); expect(grid.data[0].name).toBe('Batch');
  });
  it('replays all rows atomically, preserves Dates and emits one directional batch event', async () => {
    const { grid, batch, host } = setup();
    batch.stagePaste('First\t10\nSecond\t20'); await batch.applyBatch();
    const save = jest.fn(), row = jest.fn(), state = jest.fn();
    grid.batchSave.subscribe(save); grid.rowSave.subscribe(row); grid.dataStateChange.subscribe(state);
    grid.data = grid.data.map(value => ({ ...value }));
    expect((await host.history.undoAsync()).success).toBe(true);
    expect(grid.data.map(r => r.quantity)).toEqual([1, 2]);
    expect(grid.data[0].date).toEqual(new Date('2026-01-01'));
    expect(save).toHaveBeenCalledTimes(1); expect(save.mock.calls[0][0].historyAction).toBe('undo');
    expect(save.mock.calls[0][0].changes[0].original.quantity).toBe(10);
    expect((await host.history.redoAsync()).success).toBe(true);
    expect(grid.data.map(r => r.quantity)).toEqual([10, 20]);
    expect(save).toHaveBeenCalledTimes(2); expect(save.mock.calls[1][0].historyAction).toBe('redo');
    expect(row).not.toHaveBeenCalled(); expect(state).not.toHaveBeenCalled();
  });
  it('rejects conflicts and current validation without partial replay or losing the command', async () => {
    const { grid, batch, host } = setup();
    batch.stagePaste('First\t10\nSecond\t20'); await batch.applyBatch();
    grid.data[1].quantity = 99;
    expect(await host.history.undoAsync()).toMatchObject({ reason: 'row-conflict' });
    expect(grid.data[0].quantity).toBe(10); expect(host.history.undoCount()).toBe(1);
    grid.data[1].quantity = 20;
    batch.batchValidator = async () => [{ rowId: 2, field: 'quantity', message: 'Rejected' }];
    expect(await host.history.undoAsync()).toMatchObject({ reason: 'validation' });
    expect(grid.data.map(r => r.quantity)).toEqual([10, 20]); expect(batch.pendingCount()).toBe(0);
    batch.batchValidator = undefined;
    expect((await host.history.undoAsync()).success).toBe(true);
  });
  it('blocks concurrent history and cancels replay on data refresh', async () => {
    const { grid, batch, host } = setup(); batch.stagePaste('First'); await batch.applyBatch();
    let resolve!: (errors: []) => void;
    batch.batchValidator = () => new Promise(done => { resolve = done; });
    const pending = host.history.undoAsync(); expect(host.history.busy()).toBe(true);
    expect(await host.history.undoAsync()).toMatchObject({ reason: 'busy' });
    expect(host.history.clear()).toMatchObject({ reason: 'busy' });
    grid.data = grid.data.map(row => ({ ...row })); resolve([]);
    expect((await pending).success).toBe(false); expect(grid.data[0].name).toBe('First');
    expect(batch.pendingCount()).toBe(0); expect(host.history.undoCount()).toBe(1);
    expect(host.history.busy()).toBe(false);
  });
  it('preserves new user drafts when an earlier replay is cancelled', async () => {
    const { grid, batch, host } = setup(); batch.stagePaste('First'); await batch.applyBatch();
    let resolve!: (errors: []) => void;
    batch.batchValidator = () => new Promise(done => { resolve = done; });
    const pending = host.history.undoAsync(); batch.discardBatch();
    grid.onDataCellFocus(0, 1); batch.stagePaste('New draft'); resolve([]); await pending;
    expect(batch.pendingCount()).toBe(1); expect(grid.batchCellValue(grid.data[0], 'name')).toBe('New draft');
  });
  it('uses scoped keyboard shortcuts for asynchronous batch history', async () => {
    const { fixture, grid, batch, host } = setup(); batch.stagePaste('First'); await batch.applyBatch();
    const root = fixture.nativeElement.querySelector('ngb-datagrid');
    const results = jest.fn(); host.history.historyKeyboardResult.subscribe(results);
    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true }));
    await fixture.whenStable(); expect(grid.data[0].name).toBe('One'); expect(results).toHaveBeenCalledTimes(1);
    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true, shiftKey: true, bubbles: true, cancelable: true }));
    await fixture.whenStable(); expect(grid.data[0].name).toBe('First'); expect(results).toHaveBeenCalledTimes(2);
  });
  it('clears history visibly when a batch snapshot exceeds its memory budget', async () => {
    const { grid, batch, host } = setup();
    Object.assign(grid.data[0], { metadata: 'x'.repeat(3 * 1024 * 1024) });
    batch.stagePaste('First'); await batch.applyBatch();
    expect(grid.data[0].name).toBe('First'); expect(host.history.undoCount()).toBe(0);
    expect(host.history.error()).toContain('10 MiB');
  });
  it('drops the redo branch after a fresh batch and bounds retained steps', async () => {
    const { grid, batch, host } = setup(); host.history.historyLimit = 1;
    for (const text of ['First', 'Second']) { grid.onDataCellFocus(0, 1); batch.stagePaste(text); await batch.applyBatch(); }
    expect(host.history.undoCount()).toBe(1); await host.history.undoAsync();
    grid.onDataCellFocus(0, 1); batch.stagePaste('Third'); await batch.applyBatch();
    expect(host.history.redoCount()).toBe(0); expect(host.history.undoCount()).toBe(1);
  });
  it('stages a rectangle without mutation and applies once with no per-row/data-state events', async () => {
    const { grid, batch } = setup(); const original = grid.data;
    const save = jest.fn(), row = jest.fn(), state = jest.fn();
    grid.batchSave.subscribe(save); grid.rowSave.subscribe(row); grid.dataStateChange.subscribe(state);
    expect(batch.stagePaste('Updated\t10\nOther\t20')).toEqual({ success: true, changedCells: 4 });
    expect(grid.data).toBe(original); expect(grid.data[0].name).toBe('One');
    expect(grid.batchCellValue(grid.data[0], 'name')).toBe('Updated');
    expect(await batch.applyBatch()).toEqual({ success: true, changedCells: 4 });
    expect(grid.data.map(r => r.quantity)).toEqual([10, 20]);
    expect(original[0].quantity).toBe(1); expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][0].changes).toHaveLength(2); expect(row).not.toHaveBeenCalled(); expect(state).not.toHaveBeenCalled();
    expect(batch.pendingCount()).toBe(0);
  });
  it('keeps invalid drafts, displays cell errors and permits a corrected paste', async () => {
    const { grid, batch, fixture } = setup();
    expect(batch.stagePaste('')).toMatchObject({ reason: 'validation' });
    expect(await batch.applyBatch()).toMatchObject({ reason: 'validation' });
    expect(grid.data[0].name).toBe('One'); expect(batch.pendingCount()).toBe(1);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('td[aria-invalid="true"]')).not.toBeNull();
    expect(batch.stagePaste('Corrected').success).toBe(true);
    expect((await batch.applyBatch()).success).toBe(true);
  });
  it('rejects read-only cells, overflows, identity changes and invalid conversions atomically', () => {
    const { grid, batch } = setup();
    expect(batch.stagePaste('ok\tnot-a-number')).toMatchObject({ reason: 'parse' });
    expect(batch.pendingCount()).toBe(0);
    expect(batch.stagePaste('a\tb\tc\td')).toMatchObject({ reason: 'selection' });
    grid.onDataCellFocus(0, 0);
    expect(batch.stagePaste('3')).toMatchObject({ reason: 'protected' });
    grid.columns[0].editable = true; grid.columns[0].type = 'number';
    expect(batch.stagePaste('3')).toMatchObject({ reason: 'identity' });
    expect(grid.data[0].id).toBe(1);
  });
  it('requires unique stable keys and rejects missing trackBy', () => {
    const { grid, batch } = setup(); grid.trackBy = undefined;
    expect(batch.stagePaste('x')).toMatchObject({ reason: 'identity' });
    grid.trackBy = () => 1;
    expect(batch.stagePaste('x')).toMatchObject({ reason: 'identity' });
  });
  it('discards drafts without mutation and blocks view restore/row editors while pending', () => {
    const { grid, batch } = setup(); batch.stagePaste('Draft');
    expect(grid.restoreView(grid.captureView())).toMatchObject({ reason: 'editing' });
    grid.startEdit(0); expect(grid.editingIndex).toBeNull();
    batch.discardBatch(); expect(batch.pendingCount()).toBe(0);
    expect(grid.batchCellValue(grid.data[0], 'name')).toBe('One');
    expect(grid.restoreView(grid.captureView()).success).toBe(true);
  });
  it('validates async results and cancels stale completion after discard', async () => {
    const { grid, batch } = setup(); batch.stagePaste('Draft');
    let resolve!: (errors: []) => void; let signal!: AbortSignal;
    batch.batchValidator = (_changes, abort) => { signal = abort; return new Promise(done => { resolve = done; }); };
    const pending = batch.applyBatch(); expect(batch.validating()).toBe(true);
    expect(await batch.applyBatch()).toMatchObject({ reason: 'busy' });
    batch.discardBatch(); expect(signal.aborted).toBe(true); resolve([]);
    expect(await pending).toMatchObject({ reason: 'cancelled' }); expect(grid.data[0].name).toBe('One');
  });
  it('rejects in-place conflicts and cancels validation after an input refresh', async () => {
    const { grid, batch } = setup(); batch.stagePaste('Draft'); grid.data[0].quantity = 100;
    expect(await batch.applyBatch()).toMatchObject({ reason: 'conflict' });
    batch.discardBatch(); batch.stagePaste('Next');
    let resolve!: (errors: []) => void;
    batch.batchValidator = () => new Promise(done => { resolve = done; });
    const pending = batch.applyBatch(); grid.data = [...grid.data]; resolve([]);
    expect(await pending).toMatchObject({ reason: 'cancelled' }); expect(batch.pendingCount()).toBe(1);
    expect(await batch.applyBatch()).toMatchObject({ reason: 'conflict' });
  });
  it('honors boolean/select conversion and rechecks editability after validation', async () => {
    const { grid, batch } = setup();
    grid.columns[1].type = 'select'; grid.columns[1].options = [{ label: 'Allowed', value: 'Allowed' }];
    expect(batch.stagePaste('Unknown')).toMatchObject({ reason: 'parse' });
    expect(batch.stagePaste('Allowed').success).toBe(true);
    batch.batchValidator = () => { grid.columns[1].editable = false; return []; };
    expect(await batch.applyBatch()).toMatchObject({ reason: 'protected' });
    expect(grid.data[0].name).toBe('One'); batch.discardBatch();
    grid.onDataCellFocus(0, 2); grid.columns[2].type = 'boolean';
    expect(batch.stagePaste('maybe')).toMatchObject({ reason: 'parse' });
    expect(batch.stagePaste('false').success).toBe(true);
    expect(grid.batchCellValue(grid.data[0], 'quantity')).toBe(false);
  });
  it('rejects HTML-only paste instead of clearing an existing value', () => {
    const { fixture, batch, grid } = setup();
    const event = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', { value: { types: ['text/html'], getData: () => '' } });
    fixture.nativeElement.querySelector('ngb-datagrid').dispatchEvent(event);
    expect(batch.pendingCount()).toBe(0); expect(grid.data[0].name).toBe('One');
  });
  it('preserves dates and quoted text through clipboard formatting and parsing', async () => {
    const { grid, batch } = setup();
    grid.onDataCellFocus(0, 3);
    expect(batch.copySelection()).toEqual({ success: true, text: '2026-01-01T00:00:00.000Z' });
    expect(batch.stagePaste('2026-02-30')).toMatchObject({ reason: 'parse' });
    expect(batch.stagePaste('2026-02-02').success).toBe(true); await batch.applyBatch();
    expect(grid.data[0].date).toEqual(new Date('2026-02-02'));
  });
  it('retains drafts when custom validation rejects or throws and protects callback inputs', async () => {
    const { grid, batch } = setup(); batch.stagePaste('Draft');
    batch.batchValidator = changes => { changes[0].updated.quantity = 999; return [{ rowId: 1, field: 'name', message: 'Not permitted' }]; };
    expect(await batch.applyBatch()).toMatchObject({ reason: 'validation' }); expect(grid.data[0].quantity).toBe(1);
    batch.batchValidator = () => { throw new Error('Service unavailable'); };
    expect(await batch.applyBatch()).toMatchObject({ reason: 'validation' }); expect(batch.pendingCount()).toBe(1);
    batch.batchValidator = undefined; await batch.applyBatch(); expect(grid.data[0].quantity).toBe(1);
  });
  it('preserves native input clipboard handling and reports denied clipboard access', () => {
    const { fixture, batch } = setup(); const root = fixture.nativeElement.querySelector('ngb-datagrid');
    const result = jest.fn(); batch.batchResult.subscribe(result);
    const input = document.createElement('input'); root.append(input);
    input.dispatchEvent(new Event('paste', { bubbles: true, cancelable: true })); expect(result).not.toHaveBeenCalled();
    root.dispatchEvent(new Event('paste', { bubbles: true, cancelable: true }));
    expect(result).toHaveBeenCalledWith(expect.objectContaining({ reason: 'clipboard' }));
  });
});

it('round trips a batch at the 10000-cell limit', async () => {
  const { grid, batch, host } = setup();
  const fields = Array.from({ length: 10 }, (_, i) => `value${i}`);
  grid.columns = fields.map(field => ({ field, header: field })) as unknown as ColumnDef<Row>[];
  grid.pageSize = 1000;
  grid.data = Array.from({ length: 1000 }, (_, id) => {
    const row: Record<string, unknown> = { id };
    for (const field of fields) row[field] = 'before';
    return row as unknown as Row;
 });
  grid.onDataCellFocus(0, 0);
  const text = Array.from({ length: 1000 }, () => fields.map(() => 'after').join('\t')).join('\n');
  expect(batch.stagePaste(text)).toEqual({ success: true, changedCells: 10000 });
  expect((await batch.applyBatch()).success).toBe(true);
  expect((await host.history.undoAsync()).success).toBe(true);
  expect(grid.data.every(row => (row as unknown as Record<string, unknown>)['value9'] === 'before')).toBe(true);
  expect((await host.history.redoAsync()).success).toBe(true);
  expect(grid.data.every(row => (row as unknown as Record<string, unknown>)['value9'] === 'after')).toBe(true);
});
