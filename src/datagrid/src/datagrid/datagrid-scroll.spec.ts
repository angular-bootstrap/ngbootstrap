import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Datagrid } from './datagrid.component';

interface Row { id: number; name: string }
describe('DataGrid scroll modes', () => {
  let fixture: ComponentFixture<Datagrid<Row>>;
  let grid: Datagrid<Row>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Datagrid] }).compileComponents();
    fixture = TestBed.createComponent(Datagrid<Row>);
    grid = fixture.componentInstance;
    grid.columns = [{ field: 'id', header: 'ID', type: 'number', width: 100 }, { field: 'name', header: 'Name', width: 200 }];
    grid.data = Array.from({ length: 10000 }, (_, id) => ({ id, name: `Record ${id}` }));
    grid.scrollable = 'virtual';
    grid.height = 240;
    grid.virtualRowHeight = 48;
    grid.virtualOverscan = 2;
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
  });
  const rows = (f: ComponentFixture<unknown>) => f.nativeElement.querySelectorAll('tr.grid-data-row');
  it('renders a bounded window and logical row indexes while retaining all loaded rows', () => {
    expect(rows(fixture).length).toBe(10);
    expect(grid.paged.length).toBe(10000);
    expect(grid.virtualTopPadding + grid.virtualBottomPadding + rows(fixture).length * 48).toBe(480000);
    expect(rows(fixture)[0].getAttribute('aria-rowindex')).toBe('2');
    expect(fixture.nativeElement.querySelector('[role="grid"]').getAttribute('aria-rowcount')).toBe('10001');
  });
  it('updates the window on scroll without notifying remote data consumers', () => {
    const notify = jest.spyOn(grid.dataStateChange, 'emit');
    const body = fixture.nativeElement.querySelector('.table-body-scroll');
    body.scrollTop = 4800;
    body.dispatchEvent(new Event('scroll'));
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(rows(fixture).length).toBe(10);
    expect(rows(fixture)[0].getAttribute('data-row-index')).toBe('98');
    expect(rows(fixture)[0].getAttribute('aria-rowindex')).toBe('100');
    expect(notify).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('td[tabindex="0"]')).not.toBeNull();
  });
  it('resets the window when data shrinks and supports an empty grid', () => {
    const body = fixture.nativeElement.querySelector('.table-body-scroll');
    body.scrollTop = 400000; grid.onBodyHorizontalScroll();
    grid.data = [{ id: 1, name: 'Only row' }]; fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(body.scrollTop).toBe(0);
    expect(rows(fixture).length).toBe(1);
    expect(grid.virtualBottomPadding).toBe(0);
    fixture.componentRef.setInput('data', []); fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(rows(fixture).length).toBe(0);
    expect(fixture.nativeElement.querySelector('.ngb-grid__empty')).not.toBeNull();
  });
  it('keeps boolean scroll inputs compatible and supports none', () => {
    grid.data = grid.data.slice(0, 30);
    for (const mode of [true, false, 'scrollable', 'none'] as const) {
      grid.scrollable = mode; fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
      expect(rows(fixture).length).toBe(30);
      expect(grid.shouldEnableScroll).toBe(mode === true || mode === 'scrollable');
    }
  });
  it('bounds invalid sizes and overscan', () => {
    grid.height = NaN; grid.virtualRowHeight = NaN; grid.virtualOverscan = Infinity;
    expect(grid.bodyViewportHeight).toBe(384);
    expect(grid.resolvedVirtualRowHeight).toBe(48);
    expect(grid.viewportRows.length).toBe(19);
    grid.virtualRowHeight = -2; grid.virtualOverscan = -1;
    expect(grid.resolvedVirtualRowHeight).toBe(32);
    expect(grid.viewportRows.length).toBe(13);
  });
  it('reports incompatible editing and resumes virtualization after disabling it', () => {
    grid.data = grid.data.slice(0, 30);
    fixture.componentRef.setInput('enableEdit', true); fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(grid.virtualScrollActive).toBe(false);
    expect(rows(fixture).length).toBe(30);
    expect(fixture.nativeElement.querySelector('.ngb-grid__scroll-notice').textContent).toContain('external editing');
    fixture.componentRef.setInput('enableEdit', false); fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(grid.virtualScrollActive).toBe(true);
    expect(rows(fixture).length).toBe(10);
  });
  it('uses the current page rather than inventing unloaded remote rows', () => {
    grid.enablePagination = true; grid.pageSize = 20; grid.page = 2;
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(grid.paged[0].id).toBe(20);
    expect(grid.virtualBottomPadding).toBe(480);
    expect(rows(fixture)[0].getAttribute('aria-rowindex')).toBe('22');
    fixture.componentRef.setInput('data', grid.data.slice(0, 8)); fixture.componentRef.setInput('total', 100000);
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(grid.paged.length).toBe(8);
    expect(rows(fixture).length).toBe(8);
  });
  it('renders and focuses an offscreen row through keyboard navigation', async () => {
    grid.focusCell(9000, 1); fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); await Promise.resolve();
    const target = fixture.nativeElement.querySelector('tr[data-row-index="9000"] td[data-col-index="1"]');
    expect(target).not.toBeNull();
    expect(document.activeElement).toBe(target);
    expect(rows(fixture).length).toBeLessThanOrEqual(10);
    expect(grid.scrollToRow(-1)).toBe(false);
    expect(grid.scrollToRow(10000)).toBe(false);
  });
  it('supports external editing and grouping but falls back for stacked rows', () => {
    fixture.componentRef.setInput('data', grid.data.slice(0, 30));
    fixture.componentRef.setInput('enableEdit', true);
    fixture.componentRef.setInput('editMode', 'external'); fixture.detectChanges();
    expect(grid.virtualScrollActive).toBe(true);
    grid.groupable = true; grid.group = [{ field: 'name' }];
    expect(grid.virtualScrollFallbackReason).toBeNull();
    grid.group = []; fixture.componentRef.setInput('tableOptions', { stacked: true }); fixture.detectChanges();
    expect(grid.virtualScrollActive).toBe(false);
  });
  it('keeps sorting and filtering over the full data and resets a scrolled window', () => {
    fixture.componentRef.setInput('enableSorting', true);
    fixture.componentRef.setInput('enableGlobalFilter', true); fixture.detectChanges();
    const body = fixture.nativeElement.querySelector('.table-body-scroll');
    body.scrollTop = 400000; grid.onBodyHorizontalScroll();
    grid.sort = { active: 'id', direction: 'desc' };
    grid.globalFilter = 'Record 9999'; fixture.componentRef.setInput('loading', true); fixture.detectChanges();
    expect(grid.paged.map(row => row.id)).toEqual([9999]);
    expect(grid.virtualStartIndex).toBe(0);
    expect(body.scrollTop).toBe(0);
  });
  it('clamps overscroll at the last row without blank space', () => {
    const body = fixture.nativeElement.querySelector('.table-body-scroll');
    body.scrollTop = 900000; grid.onBodyHorizontalScroll(); fixture.detectChanges();
    expect(grid.viewportRows[grid.viewportRows.length - 1]?.key).toBeDefined();
    expect(grid.viewportRows[grid.viewportRows.length - 1]).toMatchObject({ row: { id: 9999 }, pagedIndex: 9999 });
    expect(grid.virtualBottomPadding).toBe(0);
  });

});
