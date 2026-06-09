import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Datagrid } from './datagrid.component';
import { ColumnDef } from '../models/column-def';
import { NGB_DATAGRID_DEFAULT_LABELS } from '../models/datagrid-labels';

interface Person {
  id: number;
  name: string;
  email: string;
  score: number;
  active: boolean;
  created: string;
}

const baseColumns: ColumnDef<Person>[] = [
  { field: 'id', header: 'ID', sortable: true, width: 80 },
  { field: 'name', header: 'Name', sortable: true, filterable: true, width: 160 },
  { field: 'email', header: 'Email', width: 200 },
  { field: 'score', header: 'Score', type: 'number', sortable: true, width: 100 },
  { field: 'active', header: 'Active', type: 'boolean', width: 90 },
  { field: 'created', header: 'Created', type: 'date', width: 140 },
];

function createRows(): Person[] {
  return [
    { id: 1, name: 'Alice', email: 'alice@example.com', score: 90, active: true, created: '2024-01-01' },
    { id: 2, name: 'Bob', email: 'bob@example.com', score: 75, active: false, created: '2024-02-01' },
  ];
}

describe('Datagrid globalization', () => {
  let fixture: ComponentFixture<Datagrid<Person>>;
  let component: Datagrid<Person>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Datagrid],
    }).compileComponents();

    fixture = TestBed.createComponent(Datagrid<Person>);
    component = fixture.componentInstance;
    component.columns = [...baseColumns];
    component.data = createRows();
    component.enablePagination = true;
    component.pageSize = 5;
    fixture.detectChanges();
  });

  it('applies dir on the root when set explicitly', () => {
    component.dir = 'rtl';
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.ngb-grid') as HTMLElement;
    expect(root.getAttribute('dir')).toBe('rtl');
    expect(root.classList.contains('ngb-grid--rtl')).toBe(true);
  });

  it('formats pagination range with locale and custom labels', () => {
    component.locale = 'de-DE';
    component.labels = { paginationRange: '{start} bis {end} von {total}' };
    fixture.detectChanges();
    expect(component.paginationRangeLabel()).toBe('1 bis 2 von 2');
  });

  it('uses labels bag for boolean display text', () => {
    component.labels = { booleanYes: 'Ja', booleanNo: 'Nein' };
    expect(component.booleanDisplayLabel(true)).toBe('Ja');
    expect(component.booleanDisplayLabel(false)).toBe('Nein');
  });
});

describe('Datagrid accessibility', () => {
  let fixture: ComponentFixture<Datagrid<Person>>;
  let component: Datagrid<Person>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Datagrid],
    }).compileComponents();

    fixture = TestBed.createComponent(Datagrid<Person>);
    component = fixture.componentInstance;
    component.columns = [...baseColumns];
    component.data = createRows();
    component.enableSorting = true;
    component.selectionMode = 'multiple';
    fixture.detectChanges();
  });

  it('exposes aria-rowcount and aria-colcount on the data grid', () => {
    const grid = fixture.nativeElement.querySelector('table.grid-body[role="grid"]') as HTMLElement;
    expect(grid.getAttribute('aria-rowcount')).toBe(String(component.ariaRowCount()));
    expect(grid.getAttribute('aria-colcount')).toBe(String(component.ariaColCount()));
  });

  it('sets aria-sort on sortable headers', () => {
    component.toggleSort('name');
    fixture.detectChanges();
    const nameColumn = component.visibleColumns.find((column) => column.field === 'name');
    expect(nameColumn).toBeTruthy();
    expect(component.ariaSortFor('name')).toBe('ascending');
  });

  it('announces sort changes in the status region', () => {
    component.toggleSort('name');
    fixture.detectChanges();
    const live = fixture.nativeElement.querySelector('.ngb-grid__status') as HTMLElement;
    expect(live.textContent).toContain('Name');
    expect(live.getAttribute('aria-live')).toBe('polite');
  });

  it('renders an empty state when there is no data', () => {
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();
    expect(component.emptyStateLabel()).toBe(NGB_DATAGRID_DEFAULT_LABELS.emptyState);
    const empty = fixture.nativeElement.querySelector('.ngb-grid__empty') as HTMLElement | null;
    const emptyRow = fixture.nativeElement.querySelector('.ngb-grid__empty-row') as HTMLElement | null;
    expect(empty ?? emptyRow).toBeTruthy();
    expect((empty ?? emptyRow)!.textContent).toContain(NGB_DATAGRID_DEFAULT_LABELS.emptyState);
  });
});

describe('Datagrid keyboard navigation', () => {
  let fixture: ComponentFixture<Datagrid<Person>>;
  let component: Datagrid<Person>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Datagrid],
    }).compileComponents();

    fixture = TestBed.createComponent(Datagrid<Person>);
    component = fixture.componentInstance;
    component.columns = [...baseColumns];
    component.data = createRows();
    component.enablePagination = true;
    component.pageSize = 1;
    component.selectionMode = 'multiple';
    component.selectionBehavior = 'both';
    component.keyboardNavigation = true;
    fixture.detectChanges();
  });

  it('moves focused cell with arrow keys', () => {
    component.focusCell(0, 0);
    fixture.detectChanges();
    component.onDataCellKeydown(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      0,
      0,
      component.visibleColumns[0]
    );
    expect(component.focusedCell).toEqual({ rowIndex: 0, colIndex: 1 });
  });

  it('toggles row selection with Space on a focused cell', () => {
    component.focusCell(0, 0);
    const event = new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true });
    jest.spyOn(event, 'preventDefault');
    component.onDataCellKeydown(event, 0, 0, component.visibleColumns[0]);
    expect(component.isRowSelected(component.paged[0], 0)).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('changes page with Alt+PageDown when paginated', () => {
    component.page = 1;
    fixture.detectChanges();
    component.onDataCellKeydown(
      new KeyboardEvent('keydown', { key: 'PageDown', altKey: true, bubbles: true }),
      0,
      0,
      component.visibleColumns[0]
    );
    expect(component.page).toBe(2);
  });
});
