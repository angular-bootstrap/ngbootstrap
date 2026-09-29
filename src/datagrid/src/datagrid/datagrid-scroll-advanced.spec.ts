import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Datagrid } from './datagrid.component';
import { NgbRowDetailTemplate } from '../directives/datagrid-templates.directive';

interface Row { id: number; team: string }
@Component({standalone: true, imports: [Datagrid, NgbRowDetailTemplate], template: `
  <ngb-datagrid [data]="rows" [columns]="columns" scrollable="virtual" [height]="240" [detailRowHeight]="120">
    <ng-template ngbRowDetail let-row>Details for {{row.id}}</ng-template>
  </ngb-datagrid>`})
class DetailHost {
  @ViewChild(Datagrid) grid!: Datagrid<Row>;
  rows = Array.from({length: 100}, (_, id) => ({id, team: 'A'}));
  columns = [{field: 'id' as const, header: 'ID', width: 160}];
}

describe('DataGrid advanced scrolling', () => {
  let fixture: ComponentFixture<Datagrid<Row>>;
  let grid: Datagrid<Row>;
  const refresh = () => {fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();};
  beforeEach(async () => {
    await TestBed.configureTestingModule({imports: [Datagrid, DetailHost]}).compileComponents();
    fixture = TestBed.createComponent(Datagrid<Row>); grid = fixture.componentInstance;
    grid.columns = [{field: 'id', header: 'ID', width: 140}, {field: 'team', header: 'Team', width: 400}];
    grid.data = Array.from({length: 100}, (_, id) => ({id, team: id < 50 ? 'A' : 'B'}));
    grid.scrollable = 'virtual'; grid.height = 240; refresh();
  });
  it('virtualizes local groups and changes offsets when groups collapse', () => {
    grid.groupable = true; grid.group = [{field: 'team'}]; refresh();
    expect(grid.virtualScrollActive).toBe(true);
    expect(grid.renderRows.length).toBe(102);
    expect(grid.virtualContentHeight).toBe(102 * 48);
    expect(grid.collapseGroup(0)).toBe(true); refresh();
    expect(grid.renderRows.length).toBe(52);
    expect(grid.virtualContentHeight).toBe(52 * 48);
    expect(grid.scrollToRow(40)).toBe(true);
    expect(grid.virtualTopPadding).toBeGreaterThan(0);
    grid.setAllGroupsExpanded(false); refresh(); expect(grid.renderRows.length).toBe(2);
    grid.setAllGroupsExpanded(true); refresh(); expect(grid.renderRows.length).toBe(102);
    expect(grid.collapseGroup([5])).toBe(false);
  });
  it('supports complete server-provided group trees', () => {
    grid.groupable = true; grid.group = [{field: 'team'}];
    grid.groupedData = [{field: 'team', value: 'Remote', count: 100, items: grid.data, aggregates: {}}]; refresh();
    expect(grid.renderRows.length).toBe(101);
    expect(grid.collapseGroup(0)).toBe(true); refresh();
    expect(grid.renderRows.length).toBe(1);
    expect(grid.expandGroup(0)).toBe(true); refresh(); expect(grid.renderRows.length).toBe(101);
  });
  it('includes fixed detail geometry in offsets and keyboard jumps', () => {
    const host = TestBed.createComponent(DetailHost); host.detectChanges(); const detail = host.componentInstance.grid;
    expect(detail.rowDetailTpl).toBeDefined();
    expect(detail.virtualScrollActive).toBe(true);
    detail.toggleExpand(0); host.detectChanges();
    expect(detail.virtualContentHeight).toBe(4920);
    detail.scrollToRow(10); host.detectChanges();
    expect(host.nativeElement.querySelector('.table-body-scroll').scrollTop).toBe(600);
    detail.toggleExpand(0); host.detectChanges(); expect(detail.virtualContentHeight).toBe(4800);
    host.destroy();
  });
  it('keeps remote window offsets and emits a debounced range once', () => {
    jest.useFakeTimers();
    grid.virtualRemote = true; grid.virtualSkip = 0; grid.total = 10000; grid.virtualDebounce = 50;
    grid.data = grid.data.slice(0, 60); refresh();
    const emit = jest.spyOn(grid.virtualRangeChange, 'emit');
    const dataState = jest.spyOn(grid.dataStateChange, 'emit');
    grid.scrollToRow(5000); grid.onBodyHorizontalScroll(); grid.onBodyHorizontalScroll();
    jest.advanceTimersByTime(49); expect(emit).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1); expect(emit).toHaveBeenCalledTimes(1);
    const request = emit.mock.calls[0][0]!;
    expect(request.skip).toBe(4995); expect(request.take).toBeGreaterThanOrEqual(15);
    expect(dataState).not.toHaveBeenCalled();
    refresh(); expect(fixture.nativeElement.querySelectorAll('.ngb-grid__loading-row').length).toBeGreaterThan(0);
    fixture.componentRef.setInput('virtualSkip', request.skip);
    fixture.componentRef.setInput('data', Array.from({length: request.take}, (_, i) => ({id: request.skip + i, team: 'Remote'}))); refresh();
    expect(fixture.nativeElement.querySelector('.table-body-scroll').scrollTop).toBe(5000 * 48);
    expect(fixture.nativeElement.querySelectorAll('.ngb-grid__loading-row').length).toBe(0);
    expect(fixture.nativeElement.querySelector('tr[data-row-index]').getAttribute('aria-rowindex')).toBe('4997');
    jest.useRealTimers();
  });
  it('coalesces obsolete requests and cancels timers on destruction', () => {
    jest.useFakeTimers();
    grid.virtualRemote = true; grid.total = 10000; grid.virtualDebounce = 50; grid.data = [];
    const emit = jest.spyOn(grid.virtualRangeChange, 'emit');
    grid.scrollToRow(1000); grid.scrollToRow(2000); jest.advanceTimersByTime(50);
    expect(emit).toHaveBeenCalledTimes(1); expect(emit.mock.calls[0][0]!.skip).toBe(1995);
    grid.scrollToRow(3000); fixture.destroy(); jest.advanceTimersByTime(50);
    expect(emit).toHaveBeenCalledTimes(1); jest.useRealTimers();
  });
  it('restores keyboard focus when a requested remote endpoint arrives', async () => {
    jest.useFakeTimers();
    grid.virtualRemote = true; grid.total = 10000; grid.virtualSkip = 0; grid.data = grid.data.slice(0, 60); refresh();
    const emit = jest.spyOn(grid.virtualRangeChange, 'emit');
    const cell = fixture.nativeElement.querySelector('td[data-col-index="0"]'); cell.focus();
    cell.dispatchEvent(new KeyboardEvent('keydown', {key: 'End', ctrlKey: true, bubbles: true}));
    jest.advanceTimersByTime(80);
    const request = emit.mock.calls[0][0]!;
    fixture.componentRef.setInput('virtualSkip', request.skip);
    fixture.componentRef.setInput('data', Array.from({length: request.take}, (_, i) => ({id: request.skip + i, team: 'A'}))); refresh();
    jest.runAllTicks(); await Promise.resolve();
    jest.runAllTicks(); await Promise.resolve();
    expect(document.activeElement?.closest('tr')?.textContent).toContain('9999');
    jest.useRealTimers();
  });
  it('requests one fresh remote query when typing in search, even after rebuilding columns', () => {
    jest.useFakeTimers();
    grid.virtualRemote = true; grid.total = 10000; grid.virtualDebounce = 50;
    fixture.componentRef.setInput('enableGlobalFilter', true);
    fixture.componentRef.setInput('columns', [...grid.columns]); refresh();
    fixture.componentRef.setInput('columns', [...grid.columns]); refresh();
    const emit = jest.spyOn(grid.virtualRangeChange, 'emit');
    const state = jest.spyOn(grid.dataStateChange, 'emit');
    grid.globalFilterCtrl.setValue('search');
    // A scroll event from resetting scrollTop must not cancel a forced query refresh.
    grid.onBodyHorizontalScroll(); jest.advanceTimersByTime(50);
    expect(state).toHaveBeenCalledTimes(1); expect(emit).toHaveBeenCalledTimes(1);
    expect(emit.mock.calls[0][0]).toMatchObject({skip: 0, state: {globalFilter: 'search'}});
    jest.useRealTimers();
  });
  it('does not sort or filter an already processed remote range locally', () => {
    grid.virtualRemote = true; grid.virtualSkip = 400; grid.total = 1000;
    grid.data = [{id: 402, team: 'B'}, {id: 401, team: 'A'}]; grid.globalFilter = 'no match';
    grid.enableSorting = true; grid.sort = {active: 'id', direction: 'asc'}; refresh();
    expect(grid.paged.map(r => r.id)).toEqual([402, 401]);
  });
  it('emits bottom once per appended collection and re-arms on scrolling away', () => {
    grid.scrollable = 'scrollable'; refresh();
    const body = fixture.nativeElement.querySelector('.table-body-scroll');
    Object.defineProperties(body, {clientHeight: {value: 240}, scrollHeight: {value: 1000}});
    const emit = jest.spyOn(grid.scrollBottom, 'emit');
    body.scrollTop = 760; grid.onBodyHorizontalScroll(); grid.onBodyHorizontalScroll(); expect(emit).toHaveBeenCalledTimes(1);
    grid.data = [...grid.data, {id: 100, team: 'C'}]; grid.onBodyHorizontalScroll(); expect(emit).toHaveBeenCalledTimes(2);
    body.scrollTop = 0; grid.onBodyHorizontalScroll(); body.scrollTop = 760; grid.onBodyHorizontalScroll(); expect(emit).toHaveBeenCalledTimes(3);
  });
  it('scrolls by item identity and rejects invalid requests', () => {
    expect(grid.scrollToItem({idField: 'id', id: 80})).toBe(true);
    expect(grid.scrollToItem({idField: 'id', id: 1000})).toBe(false);
    expect(grid.scrollTo({column: -1})).toBe(false);
    expect(grid.scrollTo({row: 50, column: 1})).toBe(true);
    expect(grid.scrollTo({})).toBe(false);
  });
  it('renders one table in non-scrollable mode and honors a conditional maximum', () => {
    grid.scrollable = 'none'; refresh();
    expect(fixture.nativeElement.querySelectorAll('.grid-header').length).toBe(0);
    expect(fixture.nativeElement.querySelector('.grid-body thead')).not.toBeNull();
    grid.scrollable = 'scrollable'; grid.height = null; grid.maxHeight = 320; refresh();
    expect(grid.bodyViewportHeight).toBeNull(); expect(grid.bodyMaxHeight).toBe(320);
  });
});
