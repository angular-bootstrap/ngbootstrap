import { TestBed } from '@angular/core/testing';
import { Datagrid } from './datagrid.component';

interface Row { id: number; name: string; hidden: string; }

describe('DataGrid cell ranges', () => {
  function setup(enabled = true) {
    TestBed.configureTestingModule({ imports: [Datagrid] });
    const fixture = TestBed.createComponent(Datagrid<Row>);
    const grid = fixture.componentInstance;
    grid.columns = [{ field: 'id', header: 'ID' }, { field: 'hidden', header: 'Hidden', hidden: true }, { field: 'name', header: 'Name' }];
    grid.data = [{ id: 10, name: 'One', hidden: '' }, { id: 20, name: 'Two', hidden: '' }, { id: 30, name: 'Three', hidden: '' }];
    grid.trackBy = (_i, row) => row.id;
    grid.cellSelection = enabled ? 'range' : 'none';
    fixture.detectChanges();
    const cells = () => [...fixture.nativeElement.querySelectorAll('tr.grid-data-row td[data-col-index]')] as HTMLElement[];
    const key = (row: number, col: number, key: string, shiftKey = false) => grid.onDataCellKeydown(new KeyboardEvent('keydown', { key, shiftKey, cancelable: true }), row, col, grid.visibleColumns[col]);
    return { grid, fixture, cells, key };
  }

  it('is opt-in and excludes hidden fields from range addresses', () => {
    const { grid, key } = setup(false);
    grid.onDataCellFocus(0, 0); key(0, 0, 'ArrowRight', true);
    expect(grid.cellRange).toBeNull();
    grid.cellSelection = 'range'; grid.onDataCellFocus(0, 0); key(0, 0, 'ArrowRight', true);
    expect(grid.cellRange).toEqual({ anchor: { rowId: 10, field: 'id' }, focus: { rowId: 10, field: 'name' } });
  });

  it('extends and contracts rectangles, collapses on plain arrows, and clears with Escape', () => {
    const { grid, key } = setup();
    grid.onDataCellFocus(0, 0); key(0, 0, 'ArrowRight', true); key(0, 1, 'ArrowDown', true);
    expect(grid.isCellInRange(1, 0)).toBe(true);
    expect(grid.isCellInRange(2, 0)).toBe(false);
    key(1, 1, 'ArrowUp', true); expect(grid.isCellInRange(1, 0)).toBe(false);
    key(0, 1, 'ArrowDown'); expect(grid.isCellInRange(0, 0)).toBe(false);
    key(1, 1, 'Escape'); expect(grid.cellRange).toBeNull();
  });

  it('supports reverse dragging and stops after mouse release', () => {
    const { grid } = setup();
    grid.onCellMouseDown(new MouseEvent('mousedown', { button: 0 }), 2, grid.visibleColumns[1]);
    grid.onCellRangeEnter(new MouseEvent('mouseenter', { buttons: 1 }), 0, 0);
    expect(grid.isCellInRange(1, 0)).toBe(true);
    expect(grid.cellRange?.anchor.rowId).toBe(30);
    grid.endCellRangeDrag();
    grid.onCellRangeEnter(new MouseEvent('mouseenter', { buttons: 1 }), 1, 1);
    expect(grid.cellRange?.focus.rowId).toBe(10);
  });

  it('renders selected cells, roving focus and multi-select ARIA without changing row selection', async () => {
    const { grid, fixture, cells, key } = setup();
    grid.keyboardNavigation = false;
    cells()[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
    await fixture.whenStable();
    key(0, 0, 'End', true); fixture.detectChanges(); await fixture.whenStable();
    expect(cells().filter(c => c.getAttribute('aria-selected') === 'true')).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('[role="grid"]').getAttribute('aria-multiselectable')).toBe('true');
    expect(cells().filter(c => c.getAttribute('tabindex') === '0')).toHaveLength(1);
    expect(grid.selectedRowIds.size).toBe(0);
  });

  it('does not intercept arrows inside custom input controls or active editors', () => {
    const { grid, fixture, cells } = setup();
    grid.onDataCellFocus(0, 0);
    const input = document.createElement('input'); cells()[0].append(input);
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true, cancelable: true });
    input.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(grid.cellRange?.focus.field).toBe('id');
    grid.enableEdit = true; grid.startEdit(0);
    grid.onDataCellKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true }), 0, 0, grid.visibleColumns[0]);
    expect(grid.cellRange?.focus.field).toBe('id');
    fixture.detectChanges();
  });

  it('clears ranges on paging, schema changes and data replacement with a single null event', () => {
    const { grid } = setup(); const emitted = jest.fn(); grid.cellRangeChange.subscribe(emitted);
    for (const change of [() => { grid.page = 2; }, () => { grid.columns = [...grid.columns]; }, () => { grid.data = [...grid.data]; }]) {
      grid.page = 1; grid.onDataCellFocus(0, 0); emitted.mockClear(); change();
      expect(grid.cellRange).toBeNull(); expect(emitted).toHaveBeenCalledTimes(1); expect(emitted).toHaveBeenCalledWith(null);
    }
  });

  it('supports Shift-click and clamps Home/End selection to visible columns', () => {
    const { grid, key } = setup();
    grid.onCellMouseDown(new MouseEvent('mousedown', { button: 0 }), 0, grid.visibleColumns[0]);
    grid.endCellRangeDrag();
    grid.onCellMouseDown(new MouseEvent('mousedown', { button: 0, shiftKey: true }), 2, grid.visibleColumns[1]);
    grid.endCellRangeDrag();
    expect(grid.isCellInRange(1, 1)).toBe(true);
    key(2, 1, 'Home', true);
    expect(grid.cellRange?.focus.field).toBe('id');
    expect(grid.isCellInRange(1, 1)).toBe(false);
    key(2, 0, 'ArrowLeft', true);
    expect(grid.cellRange?.focus.field).toBe('id');
  });

  it('disables range behavior in stacked and sticky-row layouts', () => {
    const { grid } = setup();
    grid.stickyRows = true;
    expect(grid.cellRangeEnabled()).toBe(false);
    grid.onDataCellFocus(0, 0); expect(grid.cellRange).toBeNull();
    grid.stickyRows = false;
    grid.groupable = true; grid.group = [{ field: 'name' }];
    expect(grid.cellRangeEnabled()).toBe(false);
    grid.group = []; grid.rowReorderable = true;
    expect(grid.cellRangeEnabled()).toBe(false);
    grid.rowReorderable = false;
    jest.spyOn(grid, 'isStackedLayout').mockReturnValue(true);
    expect(grid.cellRangeEnabled()).toBe(false);
  });

  it('returns detached snapshots and clears when disabled', () => {
    const { grid } = setup(); grid.onDataCellFocus(0, 0);
    const range = grid.cellRange!; range.anchor.field = 'changed';
    expect(grid.cellRange?.anchor.field).toBe('id');
    grid.cellSelection = 'none'; expect(grid.cellRange).toBeNull();
  });
});
