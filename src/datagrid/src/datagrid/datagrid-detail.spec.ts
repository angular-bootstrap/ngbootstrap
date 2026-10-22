import { Component, ViewChild, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Datagrid } from './datagrid.component';
import { NgbRowDetailTemplate } from '../directives/datagrid-templates.directive';
import { ColumnDef } from '../models/column-def';
import { NgbDataGridDetailChange, NgbDataGridDetailKey, NgbDataGridDetailKeySelector } from '../models/row-detail';
interface Order { id: number; name: string; details: boolean }
@Component({ standalone: true, imports: [Datagrid, NgbRowDetailTemplate], template: `
  <ngb-datagrid #first [data]="rows" [columns]="columns" [singleExpand]="accordion()"
    [detailRowKey]="keySelector()" [expandedDetailKeys]="keys()" (expandedDetailKeysChange)="keys.set($event)"
    [detailRowPredicate]="allowed()" (detailChange)="changes.push($event)">
    <ng-template ngbRowDetail let-row let-index="index">
      <button class="close-detail" (click)="first.collapseRow(index)">Close {{ row.name }}</button>
      <ngb-datagrid [data]="rows" [columns]="columns">
        <ng-template ngbRowDetail let-child><button>Child {{ child.name }}</button></ng-template>
      </ngb-datagrid>
    </ng-template>
  </ngb-datagrid>
  <ngb-datagrid #second [data]="rows" [columns]="columns">
    <ng-template ngbRowDetail let-row><button>Other {{ row.name }}</button></ng-template>
  </ngb-datagrid>` })
class DetailHost {
  @ViewChild('first') first!: Datagrid<Order>;
  @ViewChild('second') second!: Datagrid<Order>;
  rows: Order[] = [{ id: 1, name: 'Paper', details: true }, { id: 2, name: 'Pens', details: true }, { id: 3, name: 'Draft', details: false }];
  columns: ColumnDef<Order>[] = [{ field: 'name', header: 'Order' }];
  accordion = signal(false);
  keys = signal<readonly NgbDataGridDetailKey[]>([]);
  keySelector = signal<NgbDataGridDetailKeySelector<Order> | undefined>(undefined);
  allowed = signal<(row: Order) => boolean>((row: Order) => row.details);
  changes: NgbDataGridDetailChange<Order>[] = [];
}
describe('DataGrid master-detail', () => {
  let fixture: ComponentFixture<DetailHost>; let host: DetailHost;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DetailHost] }).compileComponents();
    fixture = TestBed.createComponent(DetailHost); host = fixture.componentInstance; fixture.detectChanges();
  });
  it('offers eligible rows and links controls only to rendered detail targets', () => {
    const grid = fixture.nativeElement.querySelector('ngb-datagrid') as HTMLElement;
    const buttons = grid.querySelectorAll<HTMLButtonElement>('.grid-detail-toggle');
    expect(buttons.length).toBe(2); expect(buttons[0].hasAttribute('aria-controls')).toBe(false);
    buttons[0].click(); fixture.detectChanges();
    const id = buttons[0].getAttribute('aria-controls')!;
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true');
    expect(grid.querySelector(`[id="${id}"]`)?.getAttribute('role')).toBe('row');
    expect(host.changes).toEqual([{ row: host.rows[0], index: 0, expanded: true }]);
  });
  it('rejects invalid or unavailable rows and emits once per transition', () => {
    for (const i of [-1, 3, 0.5, NaN, 2]) expect(host.first.expandRow(i)).toBe(false);
    expect(host.first.expandRow(0)).toBe(true); expect(host.first.expandRow(0)).toBe(false);
    expect(host.first.collapseRow(0)).toBe(true); expect(host.first.collapseRow(0)).toBe(false);
    expect(host.changes.map(e => e.expanded)).toEqual([true, false]);
  });
  it('emits accordion collapse before expansion', () => {
    host.accordion.set(true); fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); expect(host.first.singleExpand).toBe(true); host.first.expandRow(0); host.first.expandRow(1); fixture.detectChanges();
    expect(host.first.isExpanded(0)).toBe(false); expect(host.first.isExpanded(1)).toBe(true);
    expect(host.changes.map(e => [e.index, e.expanded])).toEqual([[0, true], [0, false], [1, true]]);
  });
  it('assigns unique targets across sibling and nested grids', () => {
    host.first.expandRow(0); host.second.expandRow(0); fixture.detectChanges();
    (fixture.nativeElement.querySelector('ngb-datagrid ngb-datagrid .grid-detail-toggle') as HTMLButtonElement).click(); fixture.detectChanges();
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('.grid-detail-toggle[aria-controls]')) as HTMLElement[];
    const ids = buttons.map(b => b.getAttribute('aria-controls'));
    expect(ids.length).toBe(3); expect(new Set(ids).size).toBe(3);
    for (const id of ids) expect(fixture.nativeElement.querySelectorAll(`[id="${id}"]`).length).toBe(1);
  });
  it('restores disclosure focus after closing focused detail content', () => {
    host.first.expandRow(0); fixture.detectChanges();
    const disclosure = fixture.nativeElement.querySelector('.grid-detail-toggle') as HTMLButtonElement;
    const close = fixture.nativeElement.querySelector('.close-detail') as HTMLButtonElement;
    close.focus(); expect(document.activeElement).toBe(close); close.click(); fixture.detectChanges();
    expect(document.activeElement).toBe(disclosure); expect(disclosure.hasAttribute('aria-controls')).toBe(false);
  });
  it('refreshes disclosures and virtual offsets when the predicate changes', () => {
    host.first.expandRow(0); fixture.detectChanges();
    host.allowed.set(() => false); fixture.detectChanges();
    const grid = fixture.nativeElement.querySelector('ngb-datagrid') as HTMLElement;
    expect(grid.querySelector('.grid-detail-toggle')).toBeNull();
    expect(grid.querySelector('tr[ngbDatagridDetailRow]')).toBeNull();
  });
  it('recomputes fixed-height virtual offsets after expanding and collapsing', () => {
    host.first.scrollable = 'virtual';
    const before = host.first.virtualContentHeight;
    host.first.expandRow(0);
    expect(host.first.virtualContentHeight).toBe(before + host.first.resolvedDetailRowHeight);
    host.first.collapseRow(0);
    expect(host.first.virtualContentHeight).toBe(before);
  });
  it('leaves focus alone when it is outside the collapsed content', () => {
    host.first.expandRow(0); fixture.detectChanges();
    const disclosure = fixture.nativeElement.querySelector('.grid-detail-toggle') as HTMLButtonElement;
    disclosure.focus(); host.first.collapseRow(0); fixture.detectChanges(); expect(document.activeElement).toBe(disclosure);
  });
  it('retains keyed expansion across paging, reorder and immutable data replacement', () => {
    host.keySelector.set(row => row.id); host.keys.set([1]); fixture.detectChanges();
    expect(host.first.isExpanded(0)).toBe(true);
    host.first.pageSize = 1; host.first.enablePagination = true; host.first.onPage(2);
    expect(host.first.isExpanded(0)).toBe(false); expect(host.keys()).toEqual([1]);
    host.first.onPage(1); expect(host.first.isExpanded(0)).toBe(true);
    host.first.enablePagination = false;
    host.first.data = [...host.rows].reverse().map(row => ({ ...row }));
    expect(host.first.isExpanded(2)).toBe(true); expect(host.first.isExpanded(0)).toBe(false);
  });
  it('keeps key arrays detached and validates keys without changing legacy index state', () => {
    host.keySelector.set(row => row.id); const initial = [1]; host.keys.set(initial); fixture.detectChanges();
    host.first.expandRow(1); expect(initial).toEqual([1]); expect(host.keys()).toEqual([1, 2]);
    expect(host.first.expanded.size).toBe(0);
    host.first.collapseRow(0); expect(host.keys()).toEqual([2]);
    host.first.expandedDetailKeys = [2, 2, NaN, '']; expect(host.first.expandedDetailKeys).toEqual([2]);
    host.first.detailRowKey = () => NaN; expect(host.first.expandRow(0)).toBe(false);
  });
  it('accordion key mode clears off-page keys when explicitly expanding another row', () => {
    host.keySelector.set(row => row.id); host.keys.set([999, 1]); host.accordion.set(true); fixture.detectChanges();
    host.first.expandRow(1); expect(host.keys()).toEqual([2]);
    expect(host.changes.map(e => [e.index, e.expanded])).toEqual([[0, false], [1, true]]);
  });
  it('enters a child grid with Enter and returns to the detail cell with Escape', () => {
    host.first.expandRow(0); fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('.grid-detail-row__cell') as HTMLElement;
    cell.focus(); const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    cell.dispatchEvent(enter); expect(enter.defaultPrevented).toBe(true);
    const child = cell.querySelector('ngb-datagrid')!;
    expect((document.activeElement as HTMLElement).closest('ngb-datagrid')).toBe(child);
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    document.activeElement!.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(true); expect(document.activeElement).toBe(cell);
    expect(host.first.isExpanded(0)).toBe(true);
  });
  it('preserves interactive controls and composition instead of capturing their Escape/Enter', () => {
    host.first.expandRow(0); fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('.grid-detail-row__cell') as HTMLElement;
    const input = document.createElement('input'); cell.querySelector('ngb-datagrid')!.append(input); input.focus();
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    input.dispatchEvent(escape); expect(escape.defaultPrevented).toBe(false); expect(document.activeElement).toBe(input);
    cell.focus(); const composing = new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true });
    cell.dispatchEvent(composing); expect(composing.defaultPrevented).toBe(false); expect(document.activeElement).toBe(cell);
  });
  it('keeps parent arrow navigation out of earlier nested grids', async () => {
    host.first.expandRow(0); fixture.detectChanges();
    host.first.focusCell(1, 0); await fixture.whenStable();
    expect((document.activeElement as HTMLElement).closest('ngb-datagrid')).toBe(fixture.nativeElement.querySelector('ngb-datagrid'));
    expect((document.activeElement as HTMLElement).closest('tr')?.getAttribute('data-row-index')).toBe('1');
  });

});
