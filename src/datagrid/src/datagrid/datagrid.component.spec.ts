import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component, SimpleChange, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Datagrid } from './datagrid.component';
import { ColumnDef } from '../models/column-def';
import {
  NgbDataGridAggregateDescriptor,
  NgbDataGridGroupDescriptor,
  NgbDataGridGroupResult,
  NgbDataGridGroupingSettings,
  NgbDataGridResponsiveOptions
} from '../datagrid.types';
import { NgbExportService } from '../services/export.services';
import { DATAGRID_TEMPLATE_DIRECTIVES, NgbPagerTemplate } from '../directives/datagrid-templates.directive';
import { NgbGridColumnDirective } from '../directives/grid-column.directive';
import { NgbDatagridAddRowComponent } from './components/datagrid-add-row.component';
import { NgbDatagridDataRowComponent } from './components/datagrid-data-row.component';
import { NgbDatagridEditingToolbarComponent } from './components/datagrid-editing-toolbar.component';
import { NgbDatagridExternalEditorComponent } from './components/datagrid-external-editor.component';
import { NgbDatagridFilterMenuPanelComponent } from './components/datagrid-filter-menu-panel.component';
import { NgbDatagridHeaderComponent } from './components/datagrid-header.component';
import { NgbDatagridRowFilterOperatorPanelComponent } from './components/datagrid-row-filter-operator-panel.component';
import {
  ngbDefaultFilterOperator,
  ngbFlattenFilterDescriptors,
  ngbIsCompositeFilter,
  NgbCompositeFilterDescriptor
} from '../models/filtering';

interface Person {
  id: number;
  name: string;
  email: string;
  score: number;
  active: boolean;
  created: string;
}

interface TransactionRow {
  id: number;
  transactionType: 'Credit' | 'Debit';
  owner: 'Maya' | 'Jon' | 'Ari';
  amount: number;
}

class MockExportService {
  exportPdf = jest.fn().mockResolvedValue(undefined);
  exportExcel = jest.fn().mockResolvedValue(undefined);
}

@Component({
  standalone: true,
  imports: [Datagrid, FormsModule, ReactiveFormsModule, ...DATAGRID_TEMPLATE_DIRECTIVES],
  template: `
    <ngb-datagrid
      [columns]="columns"
      [data]="data"
      [enableFiltering]="true"
      [filterable]="true"
      [filterMode]="mode"
    >
      <ng-template ngbFilter="name" let-control let-descriptor="descriptor" let-operators="operators">
        <span class="custom-filter-context">{{ descriptor?.operator || 'none' }}|{{ operators.length }}|{{ control?.value || '' }}</span>
      </ng-template>
    </ngb-datagrid>
  `
})
class FilterTemplateHostComponent {
  @ViewChild(Datagrid, { static: true }) grid!: Datagrid<Person>;

  mode: 'row' | 'menu' | 'multi' | 'none' = 'row';
  columns: ColumnDef<Person>[] = [];
  data: Person[] = [];
}

@Component({
  standalone: true,
  imports: [Datagrid, ...DATAGRID_TEMPLATE_DIRECTIVES],
  template: `
    <ngb-datagrid [columns]="columns" [data]="data" [enableFiltering]="true" [filterable]="true">
      <ng-template ngbFilter="active" let-filter="filter" let-filterChange="filterChange" let-field="field">
        <button type="button" class="manual-filter-yes" (click)="applyManualFilterChange(filter, filterChange, field, true)">
          Yes
        </button>
        <button type="button" class="manual-filter-no" (click)="applyManualFilterChange(filter, filterChange, field, false)">
          No
        </button>
      </ng-template>
    </ngb-datagrid>
  `
})
class ManualFilterChangeHostComponent {
  @ViewChild(Datagrid, { static: true }) grid!: Datagrid<Person>;
  columns: ColumnDef<Person>[] = [];
  data: Person[] = [];

  applyManualFilterChange(
    filter: NgbCompositeFilterDescriptor,
    filterChange: (next: NgbCompositeFilterDescriptor) => void,
    field: string,
    checked: boolean
  ): void {
    const root: NgbCompositeFilterDescriptor = { logic: 'and', filters: [...filter.filters], ...filter };
    const [existing] = ngbFlattenFilterDescriptors(root).filter((item) => item.field === field);
    if (!existing) {
      root.filters.push({ field, operator: 'eq', value: checked });
    } else {
      existing.value = checked;
    }
    filterChange(root);
  }
}

@Component({
  standalone: true,
  imports: [Datagrid, ...DATAGRID_TEMPLATE_DIRECTIVES],
  template: `
    <ngb-datagrid [columns]="columns" [data]="data" [enableFiltering]="true" [filterable]="true">
      <ng-template ngbFilter="active" let-setFieldFilter="setFieldFilter">
        <button type="button" class="set-active-true" (click)="setFieldFilter('eq', true)">Active only</button>
      </ng-template>
    </ngb-datagrid>
  `
})
class SetFieldFilterHostComponent {
  @ViewChild(Datagrid, { static: true }) grid!: Datagrid<Person>;
  columns: ColumnDef<Person>[] = [];
  data: Person[] = [];
}

@Component({
  standalone: true,
  imports: [Datagrid, NgbGridColumnDirective],
  template: `
    <ngb-datagrid [columns]="columns" [data]="data" [enableSorting]="true">
      <ngb-grid-column field="name" header="Declarative Name" [sortable]="true" [width]="160"></ngb-grid-column>
      <ngb-grid-column field="email" header="Declarative Email" [width]="220"></ngb-grid-column>
    </ngb-datagrid>
  `
})
class DeclarativeColumnsHostComponent {
  @ViewChild(Datagrid, { static: true }) grid!: Datagrid<Person>;
  columns: ColumnDef<Person>[] = [];
  data: Person[] = [];
}

@Component({
  standalone: true,
  imports: [Datagrid],
  template: `
    <ngb-datagrid [columns]="columns" [data]="data" [enableAdd]="true"></ngb-datagrid>
  `
})
class AddRowSelectHostComponent {
  @ViewChild(Datagrid, { static: true }) grid!: Datagrid<any>;
  columns: ColumnDef<any>[] = [
    {
      field: 'status',
      header: 'Status',
      type: 'select',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Processing', value: 'processing' },
      ],
      required: true,
    },
  ];
  data = [{ status: 'new' }];
}

@Component({
  standalone: true,
  imports: [Datagrid, ...DATAGRID_TEMPLATE_DIRECTIVES],
  template: `
    <ngb-datagrid
      [columns]="columns"
      [data]="data"
      [groupable]="groupable"
      [group]="group"
      [groupedData]="groupedData"
      [scrollable]="true"
    >
      <ng-template ngbDatagridGroupHeaderTemplate let-field="field" let-value="value" let-count="count">
        <span class="custom-group-header">{{ field }}={{ value }} ({{ count }})</span>
      </ng-template>

      <ng-template ngbDatagridGroupHeaderColumnTemplate="amount" let-aggregates="aggregates">
        <span class="custom-group-header-amount">sum={{ aggregates['amount']?.sum ?? 'n/a' }}</span>
      </ng-template>

      <ng-template ngbDatagridGroupFooterTemplate="amount" let-aggregates="aggregates">
        <span class="custom-group-footer-amount">footer={{ aggregates['amount']?.sum ?? 'n/a' }}</span>
      </ng-template>
    </ngb-datagrid>
  `
})
class GroupTemplateHostComponent {
  @ViewChild(Datagrid, { static: true }) grid!: Datagrid<TransactionRow>;

  readonly columns: ColumnDef<TransactionRow>[] = [
    { field: 'transactionType', header: 'Type', sortable: true },
    { field: 'owner', header: 'Owner', sortable: true },
    { field: 'amount', header: 'Amount', type: 'number', sortable: true },
  ];

  readonly data: TransactionRow[] = [
    { id: 1, transactionType: 'Credit', owner: 'Maya', amount: 120 },
    { id: 2, transactionType: 'Credit', owner: 'Jon', amount: 180 },
    { id: 3, transactionType: 'Debit', owner: 'Ari', amount: 90 },
    { id: 4, transactionType: 'Debit', owner: 'Ari', amount: 60 },
  ];

  readonly amountAggregates: NgbDataGridAggregateDescriptor[] = [
    { field: 'amount', aggregate: 'sum' },
  ];

  groupable: boolean | NgbDataGridGroupingSettings = true;
  group: NgbDataGridGroupDescriptor[] = [
    { field: 'transactionType', dir: 'asc', aggregates: this.amountAggregates },
  ];
  groupedData: NgbDataGridGroupResult<TransactionRow>[] | null = null;
}

@Component({
  standalone: true,
  imports: [Datagrid, ...DATAGRID_TEMPLATE_DIRECTIVES],
  template: `
    <ngb-datagrid
      [columns]="columns"
      [data]="data"
      [groupable]="true"
      [group]="group"
    >
      <ng-template ngbDatagridGroupHeaderTemplate let-field="field" let-value="value" let-count="count">
        <span class="custom-group-header">{{ field }}={{ value }} ({{ count }})</span>
      </ng-template>
    </ngb-datagrid>
  `
})
class GroupHeaderOnlyTemplateHostComponent {
  @ViewChild(Datagrid, { static: true }) grid!: Datagrid<TransactionRow>;

  readonly columns: ColumnDef<TransactionRow>[] = [
    { field: 'transactionType', header: 'Type', sortable: true },
    { field: 'owner', header: 'Owner', sortable: true },
    { field: 'amount', header: 'Amount', type: 'number', sortable: true },
  ];

  readonly data: TransactionRow[] = [
    { id: 1, transactionType: 'Credit', owner: 'Maya', amount: 120 },
    { id: 2, transactionType: 'Credit', owner: 'Jon', amount: 180 },
    { id: 3, transactionType: 'Debit', owner: 'Ari', amount: 90 },
    { id: 4, transactionType: 'Debit', owner: 'Ari', amount: 60 },
  ];

  readonly group: NgbDataGridGroupDescriptor[] = [
    { field: 'transactionType', dir: 'asc' },
  ];
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
    fixture.componentRef.setInput('columns', component.columns);
    fixture.detectChanges();
    component.ngOnChanges({
      columns: new SimpleChange(null, component.columns, true)
    });
  };

  const setGridInput = <K extends keyof Datagrid<Person>>(name: K, value: Datagrid<Person>[K]): void => {
    fixture.componentRef.setInput(name as string, value);
    fixture.detectChanges();
  };

  const createEventForTarget = (target: EventTarget): MouseEvent => {
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: target, configurable: true });
    return event;
  };

  const createEventWithPath = (target: EventTarget, path: EventTarget[]): MouseEvent => {
    const event = createEventForTarget(target);
    Object.defineProperty(event, 'composedPath', {
      value: () => path,
      configurable: true,
    });
    return event;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Datagrid,
        FilterTemplateHostComponent,
        ManualFilterChangeHostComponent,
        SetFieldFilterHostComponent,
        DeclarativeColumnsHostComponent,
        AddRowSelectHostComponent,
        GroupTemplateHostComponent
      ],
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

  it('reflects theme on the grid root element', () => {
    expect(fixture.nativeElement.querySelector('.ngb-grid')?.getAttribute('data-theme')).toBe('bootstrap');

    fixture.componentRef.setInput('theme', 'material');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ngb-grid')?.getAttribute('data-theme')).toBe('material');
  });

  it('copies grid theme onto portaled floating filter panels', () => {
    component.filterable = 'row';
    component.enableFiltering = true;
    triggerColumnsChange();
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector(
      '.filter-row .grid-filter-operator__button--compact'
    ) as HTMLButtonElement | null;
    trigger?.click();
    fixture.detectChanges();

    const panel = document.querySelector('.ngb-datagrid-floating-panel.grid-filter-operator-menu');
    expect(panel?.getAttribute('data-theme')).toBe('bootstrap');
    expect(panel?.parentElement).toBe(document.body);
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

  it('filters rows with global search when column filtering is disabled', () => {
    component.enableFiltering = false;
    component.filterable = 'none';
    component.enableGlobalFilter = true;
    component.globalFilter = 'charlie';

    expect(component.filtered.map((row) => row.name)).toEqual(['Charlie']);
  });

  it('builds search highlight segments for matching text', () => {
    component.searchHighlightTerm = 'ali';
    component.searchHighlightFields = ['name'];

    expect(component.getSearchHighlightSegments('Alice Johnson', 'name')).toEqual([
      { key: '0:m', text: 'Ali', match: true },
      { key: '3:n', text: 'ce Johnson', match: false },
    ]);
    expect(component.getSearchHighlightSegments('Alice Johnson', 'email')).toEqual([
      { key: '0:n', text: 'Alice Johnson', match: false },
    ]);
  });

  it('reuses cached search highlight segments until highlight inputs change', () => {
    component.searchHighlightTerm = 'ali';
    component.searchHighlightFields = ['name'];

    const first = component.getSearchHighlightSegments('Alice Johnson', 'name');
    const second = component.getSearchHighlightSegments('Alice Johnson', 'name');

    expect(second).toBe(first);

    component.searchHighlightTerm = 'john';
    const third = component.getSearchHighlightSegments('Alice Johnson', 'name');

    expect(third).not.toBe(first);
    expect(third).toEqual([
      { key: '0:n', text: 'Alice ', match: false },
      { key: '6:m', text: 'John', match: true },
      { key: '10:n', text: 'son', match: false },
    ]);
  });

  it('sorts rows when sorting is active', () => {
    component.enableSorting = true;
    component.sort = { active: 'score', direction: 'desc' };

    const sorted = component.sorted;
    expect(sorted.map(r => r.name)).toEqual(['Alice', 'Charlie', 'Bob']);

    component.sort = { active: 'score', direction: '' };
    expect(component.sorted).toEqual(component.filtered);
  });

  it('renders neutral sort indicators with non-link sort buttons before sorting', () => {
    fixture.detectChanges();

    const sortButtons = fixture.debugElement.queryAll(By.css('.grid-header thead .grid-sort-button'));
    expect(sortButtons.length).toBe(component.visibleColumns.filter((col) => col.sortable).length);
    expect(sortButtons[0].nativeElement.classList.contains('btn-link')).toBe(false);

    const firstIndicator = sortButtons[0].nativeElement.querySelector('.grid-sort-button__indicator') as HTMLElement | null;
    expect(firstIndicator?.textContent?.trim()).toBe('↕');
    expect(firstIndicator?.classList.contains('grid-sort-button__indicator--active')).toBe(false);
  });

  it('renders the toolbar with scoped search and action shells', () => {
    setGridInput('enableAdd', true);
    setGridInput('exportOptions', { ...component.exportOptions, enabled: true });
    fixture.detectChanges();

    const toolbar = fixture.nativeElement.querySelector('.datagrid-toolbar') as HTMLElement | null;
    const searchShell = toolbar?.querySelector('.datagrid-toolbar__search-shell') as HTMLElement | null;

    expect(toolbar).toBeTruthy();
    expect(searchShell).toBeTruthy();
    expect(component.exportOptions.enabled).toBe(true);
    expect(component.enableAdd).toBe(true);
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

  describe('grouping', () => {
    const groupDragEvent = (field = 'active'): DragEvent =>
      ({
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          effectAllowed: 'none',
          dropEffect: 'none',
          setData: jest.fn(),
          getData: jest.fn((type: string) => (type === 'text/ngb-datagrid-group-field' ? field : '')),
        },
      }) as unknown as DragEvent;

    beforeEach(() => {
      component.enablePagination = false;
      component.groupable = true;
      fixture.detectChanges();
    });

    it('applies initial grouping from the group input', () => {
      component.group = [{ field: 'active', dir: 'asc' }];
      fixture.detectChanges();

      expect(component.renderRows.map((row) => row.kind)).toEqual(['group', 'data', 'group', 'data', 'data']);
      expect(fixture.nativeElement.querySelectorAll('.grid-group-row').length).toBe(2);
      expect(fixture.nativeElement.querySelector('.grid-group-row__label')?.textContent).toContain('Active: No');
    });

    it('emits groupChange and includes group in dataStateChange', () => {
      const groupSpy = jest.spyOn(component.groupChange, 'emit');
      const stateSpy = jest.spyOn(component.dataStateChange, 'emit');

      component.addGroupField('name');

      expect(groupSpy).toHaveBeenCalledWith({
        group: [{ field: 'name', dir: 'asc' }],
      });
      expect(stateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          group: [{ field: 'name', dir: 'asc' }],
        }),
      );
    });

    it('keeps group in the unified state alongside paging, sorting, filtering, and global search', () => {
      const stateSpy = jest.spyOn(component.dataStateChange, 'emit');
      component.group = [{ field: 'active', dir: 'asc' }];
      component.sort = { active: 'score', direction: 'desc' };
      component.pageSize = 1;
      component.page = 1;
      component.globalFilter = 'example.com';
      component.localFilter = {
        logic: 'and',
        filters: [{ field: 'name', operator: 'contains', value: 'a', ignoreCase: true }],
      };

      component.onPage(2);

      expect(stateSpy).toHaveBeenCalledWith({
        page: 2,
        pageIndex: 1,
        skip: 1,
        pageSize: 1,
        sort: [{ field: 'score', direction: 'desc' }],
        group: [{ field: 'active', dir: 'asc' }],
        filter: {
          logic: 'and',
          filters: [{ field: 'name', operator: 'contains', value: 'a', ignoreCase: true }],
        },
        globalFilter: 'example.com',
      });
    });

    it('prevents duplicate grouped fields and removes grouped fields cleanly', () => {
      component.group = [{ field: 'active', dir: 'asc' }];

      component.addGroupField('active');
      expect(component.group).toEqual([{ field: 'active', dir: 'asc' }]);

      component.removeGroupField('active');
      expect(component.group).toEqual([]);
    });

    it('adds a grouped field from the group panel drop flow', () => {
      const dragStart = groupDragEvent('email');
      component.onGroupHandleDragStart(dragStart, 'email');
      component.onGroupPanelDrop(groupDragEvent('email'));

      expect(component.group).toEqual([{ field: 'email', dir: 'asc' }]);
    });

    it('toggles group direction and keeps grouped headers rendered', () => {
      component.group = [{ field: 'active', dir: 'asc' }];

      component.toggleGroupDirection('active');
      fixture.detectChanges();

      expect(component.group).toEqual([{ field: 'active', dir: 'desc' }]);
      expect(fixture.nativeElement.querySelectorAll('.grid-group-row').length).toBe(2);
      expect(fixture.nativeElement.querySelector('.grid-group-row__label')?.textContent).toContain('Active: Yes');
    });

    it('uses local data operations before grouping when automatic local processing is enabled', () => {
      component.dataOperations = true;
      component.pageable = true;
      component.pageSize = 1;
      component.enableSorting = true;
      component.sort = { active: 'score', direction: 'desc' };
      component.enableGlobalFilter = true;
      component.globalFilter = 'example.com';
      component.group = [{ field: 'active', dir: 'desc' }];
      fixture.detectChanges();

      expect(component.recordTotal()).toBe(2);
      expect(component.paged.map((row) => row.id)).toEqual([1]);
      expect(component.renderRows.map((row) => row.kind)).toEqual(['group', 'data']);
      expect(fixture.nativeElement.querySelector('.grid-group-row__label')?.textContent).toContain('Active: Yes');
      expect(fixture.nativeElement.querySelectorAll('tbody tr.grid-data-row').length).toBe(1);
    });

    it('sorts grouped text rows within each group when sorting is active', () => {
      component.enableSorting = true;
      component.group = [{ field: 'active', dir: 'asc' }];
      component.toggleSort('name');
      fixture.detectChanges();

      const readNames = () =>
        Array.from(fixture.nativeElement.querySelectorAll('tbody tr.grid-data-row td:nth-child(2)'))
          .map((cell: Element) => cell.textContent?.trim());

      expect(readNames()).toEqual(['Bob', 'Alice', 'Charlie']);

      component.toggleSort('name');
      fixture.detectChanges();

      expect(readNames()).toEqual(['Bob', 'Charlie', 'Alice']);
    });

    it('collapses and expands grouped rows without mutating the source data', () => {
      component.group = [{ field: 'active', dir: 'asc' }];
      const original = [...component.data];
      fixture.detectChanges();

      const toggles = fixture.nativeElement.querySelectorAll('.grid-group-row__toggle');
      (toggles[1] as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(component.paged.map((row) => row.id)).toEqual([2]);
      expect(fixture.nativeElement.querySelectorAll('tbody tr.grid-data-row').length).toBe(1);
      expect(component.data).toEqual(original);

      (fixture.nativeElement.querySelectorAll('.grid-group-row__toggle')[1] as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(component.paged.map((row) => row.id)).toEqual([2, 1, 3]);
      expect(fixture.nativeElement.querySelectorAll('tbody tr.grid-data-row').length).toBe(3);
    });

    it('does not render the empty state while grouped rows are still visible', () => {
      component.group = [{ field: 'active', dir: 'asc' }];
      fixture.detectChanges();

      const toggles = fixture.nativeElement.querySelectorAll('.grid-group-row__toggle');
      (toggles[0] as HTMLButtonElement).click();
      (toggles[1] as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('.grid-group-row').length).toBe(2);
      expect(fixture.nativeElement.querySelector('.ngb-grid__empty-row')).toBeNull();
    });

    it('does not re-page current server rows while grouping in manual or server-bound mode', () => {
      component.dataOperations = true;
      component.total = 20;
      component.filterManual = true;
      component.pageable = true;
      component.pageSize = 1;
      component.page = 3;
      component.group = [{ field: 'active', dir: 'asc' }];
      component.localFilter = {
        logic: 'and',
        filters: [{ field: 'name', operator: 'contains', value: 'Alice', ignoreCase: true }],
      };
      fixture.detectChanges();

      expect(component.recordTotal()).toBe(20);
      expect(component.paged.map((row) => row.id)).toEqual([2, 1, 3]);
      expect(fixture.nativeElement.querySelectorAll('tbody tr.grid-data-row').length).toBe(3);
      expect(fixture.nativeElement.querySelectorAll('.grid-group-row').length).toBe(2);
    });

    it('renders custom group header template content', () => {
      const hostFixture = TestBed.createComponent(GroupTemplateHostComponent);
      hostFixture.detectChanges();

      const headers = Array.from(hostFixture.nativeElement.querySelectorAll('.custom-group-header')).map((node: Element) =>
        node.textContent?.trim(),
      );

      expect(headers).toEqual(['transactionType=Credit (2)', 'transactionType=Debit (2)']);
    });

    it('renders the group header column template in the configured column cell', () => {
      const hostFixture = TestBed.createComponent(GroupTemplateHostComponent);
      hostFixture.detectChanges();

      const firstGroupCells = hostFixture.nativeElement.querySelectorAll('.grid-group-row')[0].querySelectorAll('td');
      expect(firstGroupCells[0]?.colSpan).toBe(2);
      expect(firstGroupCells[1]?.textContent).toContain('sum=300');
      expect(firstGroupCells[0]?.textContent).not.toContain('sum=300');
    });

    it('spans the group lead cell across the remaining columns when no header column templates exist', () => {
      const hostFixture = TestBed.createComponent(GroupHeaderOnlyTemplateHostComponent);
      hostFixture.detectChanges();

      const firstGroupCells = hostFixture.nativeElement.querySelectorAll('.grid-group-row')[0].querySelectorAll('td');
      expect(firstGroupCells.length).toBe(1);
      expect(firstGroupCells[0]?.colSpan).toBe(3);
    });

    it('renders group footers only when showFooter is enabled', () => {
      const hostFixture = TestBed.createComponent(GroupTemplateHostComponent);
      hostFixture.detectChanges();
      expect(hostFixture.nativeElement.querySelectorAll('.grid-group-footer-row').length).toBe(0);

      hostFixture.componentInstance.groupable = { showFooter: true };
      hostFixture.componentInstance.grid.groupable = { showFooter: true };
      hostFixture.detectChanges();

      expect(hostFixture.componentInstance.grid.showGroupFooters()).toBe(true);
      expect(hostFixture.nativeElement.querySelectorAll('.grid-group-footer-row').length).toBe(2);
      expect(hostFixture.nativeElement.textContent).toContain('footer=300');
      expect(hostFixture.nativeElement.textContent).toContain('footer=150');
    });

    it('renders nested group footers when showFooter is enabled', () => {
      const hostFixture = TestBed.createComponent(GroupTemplateHostComponent);
      hostFixture.componentInstance.groupable = { showFooter: true };
      hostFixture.componentInstance.group = [
        { field: 'transactionType', dir: 'asc', aggregates: hostFixture.componentInstance.amountAggregates },
        { field: 'owner', dir: 'asc', aggregates: hostFixture.componentInstance.amountAggregates },
      ];
      hostFixture.detectChanges();

      expect(hostFixture.nativeElement.querySelectorAll('.grid-group-footer-row').length).toBe(5);
    });

    it('builds sticky header overlay rows from the active grouped branch', () => {
      const hostFixture = TestBed.createComponent(GroupTemplateHostComponent);
      hostFixture.componentInstance.groupable = { stickyHeaders: true };
      hostFixture.componentInstance.group = [
        { field: 'transactionType', dir: 'asc', aggregates: hostFixture.componentInstance.amountAggregates },
        { field: 'owner', dir: 'asc', aggregates: hostFixture.componentInstance.amountAggregates },
      ];
      hostFixture.detectChanges();

      const scroller = hostFixture.nativeElement.querySelector('.table-body-scroll') as HTMLElement;
      Object.defineProperty(scroller, 'scrollTop', { value: 180, writable: true, configurable: true });
      Object.defineProperty(scroller, 'clientHeight', { value: 240, configurable: true });
      scroller.getBoundingClientRect = () => ({ top: 100, bottom: 340, left: 0, right: 600, width: 600, height: 240, x: 0, y: 100, toJSON: () => ({}) }) as DOMRect;

      const groupRows = Array.from(hostFixture.nativeElement.querySelectorAll('table.grid-body--main tbody > tr.grid-group-row')) as HTMLTableRowElement[];
      groupRows.forEach((row, index) => {
        const top = [60, 110, 220, 360, 520][index] ?? (700 + index * 48);
        row.getBoundingClientRect = () => ({
          top,
          bottom: top + 48,
          left: 0,
          right: 600,
          width: 600,
          height: 48,
          x: 0,
          y: top,
          toJSON: () => ({}),
        }) as DOMRect;
      });

      (hostFixture.componentInstance.grid as any).syncStickyGroupOverlays();

      expect(hostFixture.componentInstance.grid.stickyGroupHeaderRows).toHaveLength(2);
      expect(hostFixture.componentInstance.grid.stickyGroupHeaderRows.map((row) => row.group.field)).toEqual([
        'transactionType',
        'owner',
      ]);
      expect(hostFixture.componentInstance.grid.stickyGroupHeaderTranslateY).toBe(180);
    });

    it('builds sticky footer overlay rows only for active groups with footers below the viewport', () => {
      const hostFixture = TestBed.createComponent(GroupTemplateHostComponent);
      hostFixture.componentInstance.groupable = { showFooter: true, stickyHeaders: true, stickyFooters: true };
      hostFixture.componentInstance.group = [
        { field: 'transactionType', dir: 'asc', aggregates: hostFixture.componentInstance.amountAggregates },
        { field: 'owner', dir: 'asc', aggregates: hostFixture.componentInstance.amountAggregates },
      ];
      hostFixture.detectChanges();

      const scroller = hostFixture.nativeElement.querySelector('.table-body-scroll') as HTMLElement;
      Object.defineProperty(scroller, 'scrollTop', { value: 180, writable: true, configurable: true });
      Object.defineProperty(scroller, 'clientHeight', { value: 240, configurable: true });
      scroller.getBoundingClientRect = () => ({ top: 100, bottom: 340, left: 0, right: 600, width: 600, height: 240, x: 0, y: 100, toJSON: () => ({}) }) as DOMRect;

      const groupRows = Array.from(hostFixture.nativeElement.querySelectorAll('table.grid-body--main tbody > tr.grid-group-row')) as HTMLTableRowElement[];
      groupRows.forEach((row, index) => {
        const top = [60, 110, 220, 360, 520][index] ?? (700 + index * 48);
        row.getBoundingClientRect = () => ({
          top,
          bottom: top + 48,
          left: 0,
          right: 600,
          width: 600,
          height: 48,
          x: 0,
          y: top,
          toJSON: () => ({}),
        }) as DOMRect;
      });

      const footerRows = Array.from(hostFixture.nativeElement.querySelectorAll('table.grid-body--main tbody > tr.grid-group-footer-row')) as HTMLTableRowElement[];
      footerRows.forEach((row, index) => {
        const top = [420, 620, 760, 920, 1080][index] ?? (1240 + index * 48);
        row.getBoundingClientRect = () => ({
          top,
          bottom: top + 48,
          left: 0,
          right: 600,
          width: 600,
          height: 48,
          x: 0,
          y: top,
          toJSON: () => ({}),
        }) as DOMRect;
      });

      (hostFixture.componentInstance.grid as any).syncStickyGroupOverlays();

      expect(hostFixture.componentInstance.grid.stickyGroupFooterRows).toHaveLength(2);
      expect(hostFixture.componentInstance.grid.stickyGroupFooterRows.map((row) => row.group.field)).toEqual([
        'transactionType',
        'owner',
      ]);
      expect(hostFixture.componentInstance.grid.stickyGroupFooterTranslateY).toBe(324);
    });

    it('sorts grouped numeric rows while keeping grouped footer totals rendered', () => {
      const hostFixture = TestBed.createComponent(GroupTemplateHostComponent);
      hostFixture.detectChanges();
      hostFixture.componentInstance.grid.enableSorting = true;
      hostFixture.componentInstance.groupable = { showFooter: true };
      hostFixture.componentInstance.grid.groupable = { showFooter: true };
      hostFixture.componentInstance.grid.toggleSort('amount');
      hostFixture.detectChanges();

      const readAmounts = () =>
        Array.from(hostFixture.nativeElement.querySelectorAll('tbody tr.grid-data-row td:nth-child(3)'))
          .map((cell: Element) => Number(cell.textContent?.trim()));

      expect(readAmounts()).toEqual([120, 180, 60, 90]);
      expect(hostFixture.nativeElement.textContent).toContain('footer=300');
      expect(hostFixture.nativeElement.textContent).toContain('footer=150');

      hostFixture.componentInstance.grid.toggleSort('amount');
      hostFixture.detectChanges();

      expect(readAmounts()).toEqual([180, 120, 90, 60]);
      expect(hostFixture.nativeElement.textContent).toContain('footer=300');
      expect(hostFixture.nativeElement.textContent).toContain('footer=150');
    });

    it('does not enable sticky footers when showFooter is false', () => {
      const hostFixture = TestBed.createComponent(GroupTemplateHostComponent);
      hostFixture.componentInstance.groupable = { stickyFooters: true };
      hostFixture.detectChanges();

      expect(hostFixture.componentInstance.grid.showGroupFooters()).toBe(false);
      expect(hostFixture.componentInstance.grid.showStickyGroupFooters()).toBe(false);
      expect(hostFixture.nativeElement.querySelectorAll('.grid-group-footer-row').length).toBe(0);
    });

    it('uses aggregates from developer-provided grouped data in template context', () => {
      const hostFixture = TestBed.createComponent(GroupTemplateHostComponent);
      hostFixture.componentInstance.groupable = { showFooter: true };
      hostFixture.componentInstance.groupedData = [
        {
          field: 'transactionType',
          value: 'Credit',
          dir: 'asc',
          level: 0,
          count: 2,
          aggregates: { amount: { sum: 999 } },
          items: hostFixture.componentInstance.data.slice(0, 2),
        },
        {
          field: 'transactionType',
          value: 'Debit',
          dir: 'asc',
          level: 0,
          count: 2,
          aggregates: { amount: { sum: 555 } },
          items: hostFixture.componentInstance.data.slice(2),
        },
      ];
      hostFixture.detectChanges();

      expect(hostFixture.nativeElement.textContent).toContain('sum=999');
      expect(hostFixture.nativeElement.textContent).toContain('footer=555');
    });

    it('keeps boolean groupable backward compatible and object groupable enables footers', () => {
      component.groupable = true;
      component.group = [{ field: 'active', dir: 'asc' }];
      fixture.detectChanges();

      expect(component.isGroupingEnabled()).toBe(true);
      expect(component.showGroupFooters()).toBe(false);

      component.groupable = { showFooter: true };
      fixture.detectChanges();

      expect(component.isGroupingEnabled()).toBe(true);
      expect(component.showGroupFooters()).toBe(true);
    });
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

  it('renders select controls for select columns in the add row flow', () => {
    const addRowFixture = TestBed.createComponent(AddRowSelectHostComponent);
    addRowFixture.detectChanges();
    const addButton = addRowFixture.nativeElement.querySelector('ngb-datagrid-toolbar button') as HTMLButtonElement | null;
    addButton?.click();
    addRowFixture.detectChanges();

    const addRow = addRowFixture.nativeElement.querySelector('table.grid-body tbody tr') as HTMLElement | null;
    const actionButtons = addRow?.querySelectorAll('button') ?? [];

    expect(addRow?.querySelector('select')).toBeTruthy();
    expect(addRow?.querySelector('input[aria-label="Status"]')).toBeNull();
    expect(Array.from(actionButtons).map((button) => button.textContent?.trim())).toEqual(['Save', 'Cancel']);
  });

  it('shows row-filter clear buttons only for active column filters', () => {
    setGridInput('filterable', 'row');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.filter-row .grid-filter-clear').length).toBe(0);

    component.filterForm.get(component.valueControlName('name'))?.setValue('Alice');
    component.applyRowFilter(component.columns[1]);
    fixture.detectChanges();

    expect(component.hasActiveColumnFilter('name')).toBe(true);
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

  it('opens the external editor when a rendered row edit action is clicked', () => {
    component.editMode = 'external';
    component.enableEdit = true;
    component.enablePagination = false;
    triggerColumnsChange();
    fixture.detectChanges();

    const editButton = fixture.nativeElement.querySelector('.grid-body .grid-row-action') as HTMLButtonElement;
    editButton.click();
    fixture.detectChanges();

    expect(component.externalEditOpen).toBe(true);
    expect(fixture.nativeElement.querySelector('.grid-external-editor__panel')).toBeTruthy();
  });

  it('reserves enough width for edit-state action buttons', () => {
    component.enableEdit = true;
    expect(component.utilityColumnWidth('actions')).toBe(176);
  });

  it('emits rowSave with merged payload', () => {
    component.enableEdit = true;
    component.startEdit(0);
    const emitSpy = jest.spyOn(component.rowSave, 'emit');
    const originalRow = component.data[0];

    component.editForm.patchValue({ name: 'Alice Cooper' });
    component.saveEdit(0);

    expect(emitSpy).toHaveBeenCalledWith({
      original: originalRow,
      updated: { ...originalRow, name: 'Alice Cooper' },
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
    const deleted = component.data[2];

    component.deleteRow(2);

    expect(emitSpy).toHaveBeenCalledWith({ row: deleted, index: 2 });
    expect(component.data.find(r => r.id === deleted.id)).toBeDefined();
  });

  it('uses trackBy callback when provided', () => {
    const row = component.data[0];
    expect(component.trackRow(0, row)).toBe(0);

    component.trackBy = (_i, r) => (r as any).id;
    expect(component.trackRow(0, row)).toBe(1);
  });

  it('preserves selection and sticky state across sort reordering when trackBy is stable', () => {
    component.trackBy = (_i, row) => row.id;
    component.selectionMode = 'multiple';
    component.selectionBehavior = 'both';
    component.stickyRows = true;
    component.enablePagination = false;
    component.enableSorting = true;
    fixture.detectChanges();

    component.toggleSelection(1);
    component.toggleStickyRow(1);

    expect(component.selectedRowIds.has(2)).toBe(true);
    expect(component.stickyRowIds.has(2)).toBe(true);

    component.toggleSort('score');
    component.toggleSort('score');

    const bobIndex = component.paged.findIndex((row) => row.id === 2);
    expect(bobIndex).toBeGreaterThanOrEqual(0);
    expect(component.selectedRowIds.has(2)).toBe(true);
    expect(component.stickyRowIds.has(2)).toBe(true);
    expect(component.isRowSticky(component.paged[bobIndex], bobIndex)).toBe(true);
  });

  it('preserves selection and sticky state across filter changes when trackBy is stable', () => {
    component.trackBy = (_i, row) => row.id;
    component.selectionMode = 'multiple';
    component.selectionBehavior = 'both';
    component.stickyRows = true;
    component.enablePagination = false;
    component.filterable = true;
    component.enableFiltering = true;
    fixture.detectChanges();

    component.toggleSelection(1);
    component.toggleStickyRow(1);

    component.filter = {
      logic: 'and',
      filters: [{ field: 'name', operator: 'eq', value: 'Bob' }],
    };

    expect(component.filtered.map((row) => row.id)).toEqual([2]);
    expect(component.selectedRowIds.has(2)).toBe(true);
    expect(component.stickyRowIds.has(2)).toBe(true);
    expect(component.isRowSelected(component.paged[0], 0)).toBe(true);
    expect(component.isRowSticky(component.paged[0], 0)).toBe(true);

    component.filter = null;

    const bobIndex = component.paged.findIndex((row) => row.id === 2);
    expect(bobIndex).toBeGreaterThanOrEqual(0);
    expect(component.selectedRowIds.has(2)).toBe(true);
    expect(component.stickyRowIds.has(2)).toBe(true);
    expect(component.isRowSelected(component.paged[bobIndex], bobIndex)).toBe(true);
    expect(component.isRowSticky(component.paged[bobIndex], bobIndex)).toBe(true);
  });

  it('uses the custom editService when provided', () => {
    const assignValues = jest.fn((row: any, patch: any) => ({ ...row, ...patch }));
    const create = jest.fn(() => []);
    const update = jest.fn(() => []);
    const remove = jest.fn(() => []);
    const saveChanges = jest.fn(() => []);
    const cancelChanges = jest.fn(() => []);

    component.editService = {
      create,
      update,
      remove,
      assignValues,
      isNew: () => false,
      hasChanges: () => false,
      saveChanges,
      cancelChanges,
    } as any;

    component.enableAdd = true;
    component.startAdd();
    expect(create).toHaveBeenCalled();
    component.addForm.setValue({
      id: 4,
      name: 'Dana',
      email: 'dana@example.com',
      score: 50,
      active: true,
      created: '2024-04-01'
    });
    component.saveAdd();
    expect(saveChanges).toHaveBeenCalled();
    component.startAdd();
    component.cancelAdd();
    expect(cancelChanges).toHaveBeenCalled();

    component.enableEdit = true;
    component.startEdit(0);
    component.editForm.patchValue({ name: 'Alice Cooper' });
    component.saveEdit(0);

    expect(assignValues).toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
    expect(saveChanges).toHaveBeenCalled();

    component.startEdit(0);
    component.cancelEdit(0);
    expect(cancelChanges).toHaveBeenCalled();

    component.enableDelete = true;
    component.pageSize = 3;
    component.deleteRow(2);
    expect(remove).toHaveBeenCalled();
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

  it('includes custom pageSize in resolved options when not in presets', () => {
    component.enablePagination = true;
    component.pageSize = 4;
    component.pageSizeOptions = [5, 10, 25];
    expect(component.resolvedPageSizeOptions).toEqual([4, 5, 10, 25]);
    expect(component.pageSize).toBe(4);
  });

  it('activates pagination when pageable is set without enablePagination', () => {
    component.enablePagination = false;
    component.pageable = { pageSizes: [5, 10] };
    expect(component.paginationActive).toBe(true);
    expect(component.showPagerPageSizes()).toBe(true);
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

  describe('pageable integration', () => {
    beforeEach(() => {
      component.data = [
        { id: 1, name: 'A', email: 'a@x.com', score: 1, active: true, created: '2024-01-01' },
        { id: 2, name: 'B', email: 'b@x.com', score: 2, active: true, created: '2024-01-02' },
        { id: 3, name: 'C', email: 'c@x.com', score: 3, active: true, created: '2024-01-03' },
        { id: 4, name: 'D', email: 'd@x.com', score: 4, active: true, created: '2024-01-04' },
        { id: 5, name: 'E', email: 'e@x.com', score: 5, active: true, created: '2024-01-05' },
        { id: 6, name: 'F', email: 'f@x.com', score: 6, active: true, created: '2024-01-06' },
      ];
      component.enableFiltering = false;
    });

    it('activates pagination from pageable and exposes settings', () => {
      component.pageable = {
        buttonCount: 3,
        info: false,
        pageSizes: [2, 4],
        previousNext: true,
        type: 'numeric',
        position: 'bottom',
      };
      fixture.detectChanges();

      expect(component.paginationActive).toBe(true);
      expect(component.showPagerInfo()).toBe(false);
      expect(component.showPagerPageSizes()).toBe(true);
      expect(component.pagerButtonCount()).toBe(3);
      expect(component.pagerShowsAt('bottom')).toBe(true);
      expect(component.pagerShowsAt('top')).toBe(false);
    });

    it('renders ngb-pager in the footer with page size dropdown', () => {
      component.pageable = { pageSizes: [5, 10] };
      component.pageSize = 7;
      fixture.detectChanges();

      expect(component.resolvedPageSizeOptions).toEqual([5, 7, 10]);
      const select = fixture.nativeElement.querySelector('.ngb-pager__page-size-select');
      expect(select).toBeTruthy();
      expect(select.querySelectorAll('option').length).toBe(3);
    });

    it('does not clamp page size to a minimum preset', () => {
      component.pageable = { pageSizes: [5, 10, 25] };
      component.pageSize = 4;
      component.ngOnChanges({
        pageSize: new SimpleChange(10, 4, false),
        pageable: new SimpleChange(false, component.pageable, false),
      });
      expect(component.pageSize).toBe(4);
      expect(component.resolvedPageSizeOptions).toEqual([4, 5, 10, 25]);
    });

    it('renders top and bottom pagers when position is both', () => {
      component.pageable = { position: 'both', pageSizes: [3] };
      fixture.detectChanges();

      expect(component.pagerShowsAt('top')).toBe(true);
      expect(component.pagerShowsAt('bottom')).toBe(true);
      expect(fixture.nativeElement.querySelectorAll('ngb-pager').length).toBeGreaterThanOrEqual(1);
    });

    it('hides page size control when pageSizes is false', () => {
      component.pageable = { pageSizes: false };
      fixture.detectChanges();

      expect(component.showPagerPageSizes()).toBe(false);
      expect(fixture.nativeElement.querySelector('.ngb-pager__page-size-select')).toBeNull();
    });

    it('enables responsive pager by default on pageable', () => {
      component.pageable = true;
      fixture.detectChanges();
      expect(component.pagerResponsive()).toBe(true);
      expect(fixture.nativeElement.querySelector('.ngb-pager--responsive')).toBeTruthy();
    });

    it('disables responsive pager when responsive is false', () => {
      component.pageable = { responsive: false, pageSizes: [5, 10] };
      fixture.detectChanges();
      expect(component.pagerResponsive()).toBe(false);
      expect(fixture.nativeElement.querySelector('.ngb-pager--wrap')).toBeTruthy();
    });

    it('disables built-in pager when a custom ngbPager template is used', async () => {
      @Component({
        standalone: true,
        imports: [Datagrid, NgbPagerTemplate],
        template: `
          <ngb-datagrid #grid [columns]="columns" [data]="rows" [pageable]="pageable" [pageSize]="5">
            <ng-template ngbPager let-ctx>
              <div class="custom-pager">Page {{ ctx.page }} / {{ ctx.pageCount }}</div>
            </ng-template>
          </ngb-datagrid>
        `,
      })
      class CustomPagerHostComponent {
        columns = [{ field: 'id', header: 'ID' }, { field: 'name', header: 'Name' }];
        rows = Array.from({ length: 12 }, (_, i) => ({
          id: i + 1,
          name: `Row ${i + 1}`,
          email: 'x@y.com',
          score: 1,
          active: true,
          created: '2024-01-01',
        }));
        pageable = { pageSizes: [5, 10], responsive: true };
      }

      const hostFixture = TestBed.createComponent(CustomPagerHostComponent);
      hostFixture.detectChanges();
      await hostFixture.whenStable();

      const grid = hostFixture.debugElement.children[0].componentInstance as Datagrid<Person>;
      expect(grid.hasCustomPagerTemplate()).toBe(true);
      expect(grid.pagerResponsive()).toBe(false);
      expect(hostFixture.nativeElement.querySelector('.custom-pager')).toBeTruthy();
      expect(hostFixture.nativeElement.querySelector('ngb-pager')).toBeNull();
      expect(hostFixture.nativeElement.querySelector('.grid-footer--custom')).toBeTruthy();
    });
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

  it('toggles sticky rows and pins them to the top', () => {
    component.stickyRows = true;
    component.enablePagination = false;
    fixture.detectChanges();
    const targetRow = component.paged[1];

    component.toggleStickyRow(1);

    expect(component.isRowSticky(targetRow, 1)).toBe(true);
    expect(component.stickyIcon(targetRow, 1)).toBe('pin-angle-fill');
    expect(component.sorted[0]).toBe(targetRow);

    component.toggleStickyRow(0);

    expect(component.isRowSticky(targetRow, 0)).toBe(false);
    expect(component.stickyIcon(targetRow, 0)).toBe('pin-fill');
    expect(component.sorted[0]).toBe(component.filtered[0]);
  });

  it('computes sticky offsets and enables scrolling when pagination is off', () => {
    component.stickyRows = true;
    component.enablePagination = false;
    component.scrollable = true;
    component.stickyRowHeight = 50;
    component.stickyHeaderHeight = 40;
    fixture.detectChanges();

    component.toggleStickyRow(0);
    component.toggleStickyRow(1);

    expect(component.shouldEnableScroll).toBe(true);
    expect(component.stickyTop(component.paged[0], 0)).toBe(0);
    expect(component.stickyTop(component.paged[1], 1)).toBe(50);
  });

  it('stacks sticky rows based on sticky order rather than index', () => {
    component.stickyRows = true;
    component.enablePagination = false;
    component.scrollable = true;
    component.stickyRowHeight = 40;
    component.stickyHeaderHeight = 40;
    component.pageSize = 3;
    fixture.detectChanges();

    component.toggleStickyRow(0);
    component.toggleStickyRow(1);

    expect(component.stickyTop(component.paged[0], 0)).toBe(0);
    expect(component.stickyTop(component.paged[1], 1)).toBe(40);
  });

  it('computes sticky header/footer flags based on configuration', () => {
    component.enablePagination = false;
    component.scrollable = true;
    component.stickyHeader = true;
    component.stickyFooter = true;
    expect(component.isHeaderSticky).toBe(true);
    expect(component.isFooterSticky).toBe(true);

    component.stickyHeader = false;
    component.stickyFooter = false;
    expect(component.isHeaderSticky).toBe(false);
    expect(component.isFooterSticky).toBe(false);
  });

  it('reorders rows when row reordering is enabled in raw-order mode', () => {
    component.rowReorderable = true;
    component.enablePagination = false;
    component.sort = { active: null, direction: '' };
    component.localFilter = { logic: 'and', filters: [] };
    const emitSpy = jest.spyOn(component.rowReorder, 'emit');

    component.onRowDrop({
      item: component.data[0],
      fromIndex: 0,
      toIndex: 2,
      fromList: component.data.slice(),
      toList: component.data.slice(),
      sameList: true,
    });

    expect(component.data.map((row) => row.name)).toEqual(['Bob', 'Charlie', 'Alice']);
    expect(emitSpy).toHaveBeenCalledWith({
      row: expect.objectContaining({ name: 'Alice' }),
      fromIndex: 0,
      toIndex: 2,
      data: expect.arrayContaining([
        expect.objectContaining({ name: 'Alice' }),
        expect.objectContaining({ name: 'Bob' }),
        expect.objectContaining({ name: 'Charlie' }),
      ]),
    });
  });

  it('toggles multi-select checkbox rows off without requiring modifier keys', () => {
    component.selectionMode = 'multiple';
    component.selectionBehavior = 'checkbox';
    fixture.detectChanges();

    const checkboxEvent = (checked: boolean) => ({
      target: Object.assign(document.createElement('input'), { type: 'checkbox', checked }),
    }) as unknown as Event;

    component.toggleSelection(0, checkboxEvent(true));
    expect(component.isRowSelected(component.paged[0], 0)).toBe(true);

    component.toggleSelection(0, checkboxEvent(false));
    expect(component.isRowSelected(component.paged[0], 0)).toBe(false);
  });

  it('starts editing when row clicked outside interactive targets', () => {
    component.enableEdit = true;
    component.editOnRowClick = true;
    const editSpy = jest.spyOn(component, 'startEdit');
    const target = document.createElement('div');
    const event = createEventForTarget(target);

    component.onRowClick(event, 0);

    expect(editSpy).toHaveBeenCalledWith(0);
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

  it('commits valid in-cell edits when clicking outside the grid', () => {
    component.enableEdit = true;
    component.editMode = 'incell';
    triggerColumnsChange();
    fixture.detectChanges();

    const nameColumn = component.columns.find((c) => c.field === 'name')!;
    component.startIncellEdit(0, nameColumn.field);
    fixture.detectChanges();

    expect(component.editingCell).toEqual({ rowIndex: 0, field: 'name' });
    component.editForm.get('name')?.setValue('Alice Outside');

    const outside = document.createElement('div');
    document.body.appendChild(outside);
    component.onDocumentClick(createEventForTarget(outside) as any);
    fixture.detectChanges();

    expect(component.data[0].name).toBe('Alice Outside');
    expect(component.editingCell).toBeNull();
    expect(component.editingIndex).toBeNull();
  });

  it('keeps in-cell editing open when the click target is detached but its event path stays inside the grid', () => {
    component.enableEdit = true;
    component.editMode = 'incell';
    triggerColumnsChange();
    fixture.detectChanges();

    const nameColumn = component.columns.find((c) => c.field === 'name')!;
    component.startIncellEdit(0, nameColumn.field);
    fixture.detectChanges();

    const detachedTarget = document.createElement('div');
    const gridRoot = document.createElement('div');
    gridRoot.className = 'ngb-grid';

    component.onDocumentClick(
      createEventWithPath(detachedTarget, [detachedTarget, gridRoot, document.body, document]) as any,
    );
    fixture.detectChanges();

    expect(component.editingCell).toEqual({ rowIndex: 0, field: 'name' });
    expect(component.editingIndex).toBe(0);
  });

  it('navigates in-cell editors with arrow keys and commits on Enter', () => {
    component.enableEdit = true;
    component.editMode = 'incell';
    triggerColumnsChange();
    fixture.detectChanges();

    const nameColumn = component.columns.find((c) => c.field === 'name')!;
    component.startIncellEdit(0, nameColumn.field);
    fixture.detectChanges();

    component.editForm.get('name')?.setValue('Alicia');
    component.onCellKeydown(new KeyboardEvent('keydown', { key: 'Enter' }), 0, nameColumn as any, 0);
    fixture.detectChanges();
    expect(component.data[0].name).toBe('Alicia');
    expect(component.editingCell).toBeNull();

    component.startIncellEdit(0, nameColumn.field);
    fixture.detectChanges();
    component.onCellKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }), 0, nameColumn as any, 0);
    fixture.detectChanges();
    expect(component.editingCell?.rowIndex).toBe(1);
    expect(component.editingCell?.field).toBe('name');
  });

  it('shows toolbar cancel button only while editing', () => {
    component.enableEdit = true;
    component.selectionMode = 'single';
    component.selectionBehavior = 'row';
    component.editMode = 'toolbar';
    triggerColumnsChange();
    fixture.detectChanges();

    expect(component.canCancelToolbarEdit()).toBe(false);
    component.toggleSelection(0);
    expect(component.hasSelectedRows()).toBe(true);
    expect(component.hasSingleSelectedRow()).toBe(true);
    expect(component.getSelectedCount()).toBe(1);
    component.editSelectedRow();
    fixture.detectChanges();
    expect(component.canCancelToolbarEdit()).toBe(true);
    component.cancelToolbarEdit();
    fixture.detectChanges();
    expect(component.canCancelToolbarEdit()).toBe(false);
  });

  it('does not render checkbox utility cells for row-only toolbar selection', () => {
    component.enableEdit = true;
    component.editMode = 'toolbar';
    component.selectionMode = 'single';
    component.selectionBehavior = 'row';
    triggerColumnsChange();
    fixture.detectChanges();

    expect(component.isSelectionEnabled()).toBe(true);
    expect(component.showSelectionColumn()).toBe(false);
    expect(fixture.nativeElement.querySelectorAll('td input[type="checkbox"]').length).toBe(0);
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

  it('validates email input with a safe check (guards extremely long values)', () => {
    const emailCol = component.columns.find(c => c.field === 'email')!;
    const draft: any = { email: '!@!.' + '!.'.repeat(20000) };
    const errors: any = {};

    component.validateInto(emailCol, draft, errors);

    expect(errors.email).toBe('Invalid email');
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

  it('applies Bootstrap-like table options to header/body and wrapper', async () => {
    component.tableOptions = {
      stripedRows: true,
      stripedColumns: true,
      hoverRows: true,
      bordered: true,
      small: true,
      density: 'compact',
      stacked: true,
      groupDividers: true,
      align: 'middle',
      caption: 'My Caption',
      captionSide: 'bottom',
      responsive: 'lg'
    };
    fixture.detectChanges();
    await fixture.whenStable();

    const wrapper = fixture.nativeElement.querySelector('.table-wrapper') as HTMLElement;
    const headerTable = fixture.debugElement.query(By.css('.grid-header'))?.nativeElement as HTMLElement | null;
    const bodyTable = fixture.debugElement.query(By.css('.grid-body'))?.nativeElement as HTMLElement | null;
    const root = fixture.nativeElement.querySelector('.ngb-grid') as HTMLElement | null;
    expect(headerTable).toBeTruthy();
    expect(bodyTable).toBeTruthy();
    const caption = headerTable?.querySelector('caption') as HTMLElement | null;

    expect(wrapper.classList.contains('table-responsive-lg')).toBe(true);

    ['table', 'table-striped', 'table-striped-columns', 'table-hover', 'table-bordered', 'table-sm', 'table-group-divider', 'align-middle']
      .forEach(cls => {
        expect(headerTable.classList.contains(cls)).toBe(true);
        expect(bodyTable.classList.contains(cls)).toBe(true);
      });

    expect(headerTable.classList.contains('table-borderless')).toBe(false);

    expect(caption?.textContent?.trim()).toBe('My Caption');
    expect(caption?.classList.contains('caption-top')).toBe(false);
    expect(root?.classList.contains('ngb-grid--compact')).toBe(true);
    expect(root?.classList.contains('ngb-grid--stacked')).toBe(true);
  });

  it('enables stacked cards layout class and stacked group attributes', async () => {
    component.tableOptions = { stacked: true, stackedLayout: 'cards' };
    component.columns = [
      { field: 'name', header: 'Name', stackedGroup: 'start' },
      { field: 'price', header: 'Price', stackedGroup: 'center' },
      { field: 'qty', header: 'Qty', stackedGroup: 'end' },
    ];
    component.data = [{ name: 'A', price: 1, qty: 2 }];
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement.querySelector('.ngb-grid') as HTMLElement | null;
    expect(root?.classList.contains('ngb-grid--stacked-cards')).toBe(true);

    const cardCell = fixture.nativeElement.querySelector('.ngb-stacked-card-cell') as HTMLElement | null;
    const cardGroup = fixture.nativeElement.querySelector('.ngb-stacked-card__group[data-stacked-group="start"]') as HTMLElement | null;
    expect(cardCell).toBeTruthy();
    expect(cardGroup).toBeTruthy();

    const bodyTable = fixture.nativeElement.querySelector('.grid-table.grid-body') as HTMLElement | null;
    expect(bodyTable?.style.width).toBeFalsy();
    expect(bodyTable?.classList.contains('grid-body')).toBe(true);
  });

  it('switches layout with dataLayoutMode input', async () => {
    fixture.componentRef.setInput('dataLayoutMode', 'tabular');
    fixture.componentRef.setInput('tableOptions', { stacked: true, stackedLayout: 'cards' });
    component.columns = [{ field: 'name', header: 'Name' }];
    component.data = [{ name: 'A' }];
    fixture.detectChanges();
    await fixture.whenStable();

    let root = fixture.nativeElement.querySelector('.ngb-grid') as HTMLElement | null;
    expect(root?.classList.contains('ngb-grid--stacked')).toBe(false);

    fixture.componentRef.setInput('dataLayoutMode', 'stacked');
    fixture.detectChanges();
    await fixture.whenStable();

    root = fixture.nativeElement.querySelector('.ngb-grid') as HTMLElement | null;
    expect(root?.classList.contains('ngb-grid--stacked')).toBe(true);
    expect(component.isStackedLayout()).toBe(true);
  });

  it('uses full-width stacked list rows with field labels', async () => {
    component.tableOptions = { stacked: true, stackedLayout: 'list' };
    component.columns = [
      { field: 'name', header: 'Name' },
      { field: 'price', header: 'Price', type: 'number' },
    ];
    component.data = [{ name: 'A', price: 1 }];
    fixture.detectChanges();
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('.ngb-grid--stacked tbody tr') as HTMLElement | null;
    const labeledCell = fixture.nativeElement.querySelector('td[data-title="Name"]') as HTMLElement | null;
    expect(row).toBeTruthy();
    expect(labeledCell?.getAttribute('data-title')).toBe('Name');
    expect(row?.style.gridTemplateColumns).toBeFalsy();
  });

  it('reuses cached stacked-card column groups until columns change', () => {
    component.tableOptions = { stacked: true, stackedLayout: 'cards' };
    component.columns = [
      { field: 'name', header: 'Name', stackedGroup: 'start' },
      { field: 'price', header: 'Price', stackedGroup: 'center' },
      { field: 'qty', header: 'Qty', stackedGroup: 'end' },
    ] as any;
    component.data = [{ name: 'A', price: 1, qty: 2 }] as any;
    triggerColumnsChange();

    const firstGroups = component.stackedCardGroups();
    const secondGroups = component.stackedCardGroups();
    const firstStartColumns = component.stackedColumnsInGroup('start');
    const secondStartColumns = component.stackedColumnsInGroup('start');

    expect(secondGroups).toBe(firstGroups);
    expect(secondStartColumns).toBe(firstStartColumns);

    component.columns = [...component.columns, { field: 'status', header: 'Status', stackedGroup: 'center' }] as any;
    triggerColumnsChange();

    const refreshedGroups = component.stackedCardGroups();
    const refreshedCenterColumns = component.stackedColumnsInGroup('center');

    expect(refreshedGroups).not.toBe(firstGroups);
    expect(refreshedCenterColumns.map((column) => column.field)).toEqual(['price', 'status']);
  });

  it('clears sorting and applies column visibility', () => {
    component.columns = [
      { field: 'name', header: 'Name' },
      { field: 'price', header: 'Price', hidden: true },
    ];
    component.enableSorting = true;
    component.data = [{ name: 'A', price: 1 }];
    component.toggleSort('name');
    expect(component.sort.active).toBe('name');

    component.clearSorting(false);
    expect(component.sort.active).toBeNull();

    component.applyColumnVisibility({ name: false, price: true });
    expect(component.columns.find((c) => c.field === 'name')?.hidden).toBe(true);
    expect(component.columns.find((c) => c.field === 'price')?.hidden).toBe(false);
    expect(component.visibleColumns.length).toBe(1);
  });

  it('syncs the header horizontal scroll position with the body scroller', () => {
    fixture.detectChanges();
    const bodyScroller = component.bodyScroller?.nativeElement as HTMLElement | undefined;
    const headerScroller = component.headerScroller?.nativeElement as HTMLElement | undefined;

    expect(bodyScroller).toBeTruthy();
    expect(headerScroller).toBeTruthy();

    if (!bodyScroller || !headerScroller) return;

    bodyScroller.scrollLeft = 96;
    component.onBodyHorizontalScroll();

    expect(headerScroller.scrollLeft).toBe(96);
  });

  it('resolves custom row, header, and cell styling hooks', () => {
    component.rowClass = (_row, index) => ({ 'custom-row': index === 0 });
    component.rowStyle = (_row, index) => (index === 0 ? { backgroundColor: 'rgb(255, 247, 237)' } : null);
    component.columns = component.columns.map((column, index) =>
      index === 1
        ? {
            ...column,
            headerClass: 'custom-header',
            headerStyle: { color: 'rgb(30, 64, 175)' },
            cellClass: (row: Person) => ({ 'custom-cell': row.name === 'Alice' }),
            cellStyle: (row: Person) => (row.name === 'Alice' ? { fontWeight: 700 } : null),
          }
        : column
    );
    triggerColumnsChange();
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('.grid-body tbody tr'));
    const firstRow = rows[0]?.nativeElement as HTMLElement | undefined;
    const styledColumn = component.visibleColumns.find((column) => column.field === 'name')!;
    const customCell = fixture.nativeElement.querySelector('.custom-cell') as HTMLElement | null;

    expect(firstRow?.classList.contains('custom-row')).toBe(true);
    expect(firstRow?.style.backgroundColor).toBe('rgb(255, 247, 237)');
    expect(component.resolveHeaderStyle(styledColumn)?.['color']).toBe('rgb(30, 64, 175)');
    expect(component.resolveCellClass(component.paged[0], 0, styledColumn)).toEqual({ 'custom-cell': true });
    expect(component.resolveCellStyle(component.paged[0], 0, styledColumn)?.['fontWeight']).toBe(700);
    expect(customCell?.style.fontWeight ?? '700').toBe('700');
  });

  it('supports row selection modes including select-all and range', () => {
    component.enablePagination = false;
    component.selectionMode = 'multiple';
    component.selectionBehavior = 'both';
    component.selectionKeyMode = 'desktop';
    component.selectionDisabledFn = (_r, idx) => idx === 1;
    fixture.detectChanges();

    component.toggleSelectAllCurrentPage();
    expect(component.selectedRowIds.size).toBe(2); // skips disabled row

    component.selectedRowIds.clear();
    component.toggleSelection(0, new MouseEvent('click'));
    component.toggleSelection(2, new MouseEvent('click', { shiftKey: true }));
    expect(component.selectedRowIds.size).toBe(2); // indexes 0 and 2 (1 disabled)
    expect(component.isPageAllSelected()).toBe(false);
  });

  it('highlights rows and cells using provided highlight indices', async () => {
    component.highlightRowKey = (row: Person) => row.id;
    component.highlightColKey = (_col: ColumnDef<Person>) => _col.field;
    component.highlightedIndex = [
      { row: 2 },
      { row: 2, columnKey: 'score' }
    ];
    component.updateHighlightCache();
    fixture.detectChanges();
    await fixture.whenStable();

    const rows = fixture.debugElement.queryAll(By.css('.grid-body tbody tr'));
    expect(rows.length).toBeGreaterThan(1);
    const highlightedRow = rows[1].nativeElement as HTMLElement;

    expect(highlightedRow.classList.contains('row-highlight')).toBe(true);
    expect(component.isCellHighlighted(component.paged[1], 1, component.visibleColumns[3], 3)).toBe(true); // score column
    expect(component.isCellHighlighted(component.paged[1], 1, component.visibleColumns[0], 0)).toBe(false);
  });

  it('applies title attributes with fallbacks for headers and cells', async () => {
    component.columns = [
      { ...baseColumns[0], title: 'Custom ID Title' },
      { ...baseColumns[1], cellTitle: (row: Person) => `Name: ${row.name}` },
      ...baseColumns.slice(2)
    ];
    triggerColumnsChange();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.headerTitle(component.visibleColumns[0])).toBe('Custom ID Title');
    expect(component.headerTitle(component.visibleColumns[1])).toBe('Name');

    expect(component.cellTitle(component.paged[0], component.visibleColumns[0])).toBe('1');
    expect(component.cellTitle(component.paged[0], component.visibleColumns[1])).toBe('Name: Alice');
  });

  it('evaluates descriptor filters for text, number, boolean, date, and select columns', () => {
    component.columns = [
      ...baseColumns,
      {
        field: 'status' as any,
        header: 'Status',
        type: 'select',
        filterable: true,
        options: [
          { label: 'New', value: 'new' },
          { label: 'Closed', value: 'closed' }
        ]
      }
    ] as any;
    component.data = [
      { ...createRows()[0], status: 'new' },
      { ...createRows()[1], status: 'closed' },
      { ...createRows()[2], status: 'new' }
    ] as any;
    component.filterable = true;
    component.enableFiltering = true;
    component.filter = {
      logic: 'and',
      filters: [
        { field: 'name', operator: 'startswith', value: 'A' },
        { field: 'score', operator: 'gte', value: 90 },
        { field: 'active', operator: 'eq', value: true },
        { field: 'created', operator: 'eq', value: '2024-01-01' },
        { field: 'status', operator: 'eq', value: 'new' }
      ]
    };
    component.ngOnChanges({
      filter: new SimpleChange(null, component.filter, false),
      columns: new SimpleChange(null, component.columns, false)
    });

    expect(component.filtered).toHaveLength(1);
    expect((component.filtered[0] as any).status).toBe('new');
    expect(component.getColumnFilterType(component.columns[3])).toBe('numeric');
  });

  it('supports composite and/or descriptor filters', () => {
    component.filterable = true;
    component.filter = {
      logic: 'or',
      filters: [
        { field: 'name', operator: 'eq', value: 'Bob' },
        {
          logic: 'and',
          filters: [
            { field: 'active', operator: 'eq', value: true },
            { field: 'score', operator: 'gte', value: 80 }
          ]
        }
      ]
    };
    component.ngOnChanges({ filter: new SimpleChange(null, component.filter, false) });

    expect(component.filtered.map((row) => row.name)).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('renders row filter mode and updates emitted descriptor state', () => {
    component.filterable = true;
    component.enableFiltering = true;
    component.filterMode = 'menu';
    component.page = 3;
    triggerColumnsChange();
    fixture.detectChanges();
    const emitSpy = jest.spyOn(component.filterChange, 'emit');

    component.filterForm.get(component.operatorControlName('name'))?.setValue('startswith');
    component.filterForm.get(component.valueControlName('name'))?.setValue('Al');
    component.applyRowFilter(component.columns[1]);

    const row = fixture.nativeElement.querySelector('.filter-row') as HTMLElement | null;
    expect(row).not.toBeNull();
    expect(component.page).toBe(1);
    expect(emitSpy).toHaveBeenCalledWith({
      logic: 'and',
      filters: [{ field: 'name', operator: 'startswith', value: 'Al', ignoreCase: true }]
    });
    expect(component.filtered.map((item) => item.name)).toEqual(['Alice']);
  });

  it('applies text operators with exact and partial-match semantics', () => {
    component.filterable = 'row';
    component.enableFiltering = true;
    triggerColumnsChange();
    fixture.detectChanges();

    const nameCol = component.columns[1];

    component.filterForm.get(component.operatorControlName('name'))?.setValue('eq');
    component.filterForm.get(component.valueControlName('name'))?.setValue('Ali');
    component.applyRowFilter(nameCol);
    expect(component.filtered.map((item) => item.name)).toEqual([]);

    component.filterForm.get(component.valueControlName('name'))?.setValue('Alice');
    component.applyRowFilter(nameCol);
    expect(component.filtered.map((item) => item.name)).toEqual(['Alice']);

    component.filterForm.get(component.operatorControlName('name'))?.setValue('neq');
    component.filterForm.get(component.valueControlName('name'))?.setValue('Alice');
    component.applyRowFilter(nameCol);
    expect(component.filtered.map((item) => item.name)).toEqual(['Bob', 'Charlie']);

    component.filterForm.get(component.operatorControlName('name'))?.setValue('contains');
    component.filterForm.get(component.valueControlName('name'))?.setValue('li');
    component.applyRowFilter(nameCol);
    expect(component.filtered.map((item) => item.name)).toEqual(['Alice', 'Charlie']);

    component.filterForm.get(component.operatorControlName('name'))?.setValue('doesnotcontain');
    component.filterForm.get(component.valueControlName('name'))?.setValue('li');
    component.applyRowFilter(nameCol);
    expect(component.filtered.map((item) => item.name)).toEqual(['Bob']);

    component.filterForm.get(component.operatorControlName('name'))?.setValue('startswith');
    component.filterForm.get(component.valueControlName('name'))?.setValue('Ali');
    component.applyRowFilter(nameCol);
    expect(component.filtered.map((item) => item.name)).toEqual(['Alice']);

    component.filterForm.get(component.operatorControlName('name'))?.setValue('endswith');
    component.filterForm.get(component.valueControlName('name'))?.setValue('ce');
    component.applyRowFilter(nameCol);
    expect(component.filtered.map((item) => item.name)).toEqual(['Alice']);
  });

  it('treats filterable row as the default row filter mode', () => {
    component.filterable = 'row';
    component.enableFiltering = false;
    triggerColumnsChange();
    fixture.detectChanges();

    expect(component.resolvedFilterMode()).toBe('row');
    expect(fixture.nativeElement.querySelector('.filter-row')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.grid-header .grid-filter-menu-host .grid-filter-menu-trigger')).toBeFalsy();
  });

  it('supports multi-checkbox filter menus using composite field filters', () => {
    setGridInput('filterable', 'multi');
    setGridInput('enableFiltering', true);
    triggerColumnsChange();
    fixture.detectChanges();

    expect(component.resolvedFilterMode()).toBe('multi');
    expect(component.visibleColumns.some((col) => component.isRowFilterVisible(col))).toBe(false);

    const nameColumn = component.columns[1];
    component.toggleFilterMenu(nameColumn.field);
    fixture.detectChanges();

    expect(component.multiCheckboxTotalCount(nameColumn)).toBe(3);
    expect(component.multiCheckboxSelectedCount(nameColumn)).toBe(3);
    expect(component.multiCheckboxToggleLabel(nameColumn)).toBe('Deselect All');

    component.toggleMultiCheckboxValue(nameColumn, 'Bob');
    expect(component.multiCheckboxSelectedCount(nameColumn)).toBe(2);
    expect(component.isMultiCheckboxPartiallySelected(nameColumn)).toBe(true);

    component.applyMultiCheckboxFilter(nameColumn);
    fixture.detectChanges();

    expect(component.filtered.map((item) => item.name)).toEqual(['Alice', 'Charlie']);
    expect(component.hasActiveColumnFilter('name')).toBe(true);

    component.toggleFilterMenu(nameColumn.field);
    fixture.detectChanges();
    component.toggleMultiCheckboxAll(nameColumn);
    component.toggleMultiCheckboxAll(nameColumn);
    component.applyMultiCheckboxFilter(nameColumn);
    fixture.detectChanges();

    expect(component.filtered).toEqual([]);

    component.clearAllFilters();
    fixture.detectChanges();
    expect(component.filtered).toEqual(component.data);
  });

  it('cancels multi-checkbox drafts without applying and supports custom footer labels', () => {
    component.filterable = 'multi';
    component.enableFiltering = true;
    component.multiCheckboxFilterOptions = { applyLabel: 'Apply', cancelLabel: 'Dismiss', showCancel: true };
    triggerColumnsChange();
    fixture.detectChanges();

    expect(component.multiCheckboxFilterApplyLabel()).toBe('Apply');
    expect(component.multiCheckboxFilterCancelLabel()).toBe('Dismiss');
    expect(component.multiCheckboxFilterShowCancel()).toBe(true);

    const nameColumn = component.columns[1];
    component.toggleFilterMenu(nameColumn.field);
    fixture.detectChanges();

    component.toggleMultiCheckboxValue(nameColumn, 'Alice');
    component.cancelMultiCheckboxFilter(nameColumn);
    fixture.detectChanges();

    expect(component.openFilterMenuField).toBeNull();
    expect(component.filtered).toEqual(component.data);

    component.toggleFilterMenu(nameColumn.field);
    fixture.detectChanges();
    expect(component.multiCheckboxSelectedCount(nameColumn)).toBe(3);
  });

  it('reuses cached multi-checkbox option collections until data changes', () => {
    component.filterable = 'multi';
    component.enableFiltering = true;
    triggerColumnsChange();
    fixture.detectChanges();

    const nameColumn = component.columns[1];
    const initialOptions = component.multiCheckboxOptions(nameColumn);
    const repeatedOptions = component.multiCheckboxOptions(nameColumn);

    expect(repeatedOptions).toBe(initialOptions);

    component.multiCheckboxSearch[nameColumn.field as string] = 'ali';
    const visibleOptions = component.multiCheckboxVisibleOptions(nameColumn);
    const repeatedVisibleOptions = component.multiCheckboxVisibleOptions(nameColumn);

    expect(repeatedVisibleOptions).toBe(visibleOptions);
    expect(visibleOptions.map((option) => option.label)).toEqual(['Alice']);

    component.data = [
      ...component.data,
      { id: 4, name: 'Dora', email: 'dora@example.com', score: 88, active: true, created: '2024-04-01' },
    ];

    const refreshedOptions = component.multiCheckboxOptions(nameColumn);

    expect(refreshedOptions).not.toBe(initialOptions);
    expect(refreshedOptions.map((option) => option.label)).toContain('Dora');
  });

  it('opens filter menu, applies and clears menu filters, and closes on escape', () => {
    setGridInput('filterable', 'menu');
    setGridInput('enableFiltering', false);
    triggerColumnsChange();
    fixture.detectChanges();

    component.toggleFilterMenu('id');
    fixture.detectChanges();
    expect(component.openFilterMenuField).toBe('id');
    expect(component.ensureMenuDraftConditions(component.columns[0]).length).toBe(2);

    const nameColumn = component.columns[1];
    component.toggleFilterMenu(nameColumn.field);
    fixture.detectChanges();
    expect(component.openFilterMenuField).toBe(nameColumn.field);
    expect(component.getAllowedOperators(nameColumn).length).toBeGreaterThan(0);
    expect(component.ensureMenuDraft(nameColumn).value).toBe('');
    expect(component.hasActiveColumnFilter('name')).toBe(false);
    const draft = component.ensureMenuDraft(nameColumn);
    draft.operator = 'contains';
    draft.value = 'li';
    component.applyMenuFilter(nameColumn);
    fixture.detectChanges();

    expect(component.hasActiveColumnFilter('name')).toBe(true);
    expect(component.filtered.map((item) => item.name)).toEqual(['Alice', 'Charlie']);

    component.toggleFilterMenu(nameColumn.field);
    fixture.detectChanges();
    fixture.detectChanges();
    component.onEscapeKey();
    expect(component.openFilterMenuField).toBeNull();

    component.toggleFilterMenu(nameColumn.field);
    component.clearMenuFilter(nameColumn);
    fixture.detectChanges();
    expect(component.hasActiveColumnFilter('name')).toBe(false);
  });

  it('applies composite AND menu filters for multiple conditions on one column', () => {
    component.filterable = 'menu';
    component.enableFiltering = true;
    triggerColumnsChange();
    fixture.detectChanges();

    const nameColumn = component.columns[1];
    component.ensureMenuDraftConditions(nameColumn);
    component.menuDrafts[nameColumn.field as string] = [
      { operator: 'contains', value: 'li' },
      { operator: 'contains', value: 'ce' },
    ];
    component.applyMenuFilter(nameColumn);
    fixture.detectChanges();

    expect(component.filtered.map((item) => item.name)).toEqual(['Alice']);
    const fieldFilter = component.localFilter.filters.find(
      (filter) => ngbIsCompositeFilter(filter) && filter.logic === 'and'
    );
    expect(fieldFilter).toBeTruthy();
  });

  it('applies composite OR menu filters when join logic is Or', () => {
    component.filterable = 'menu';
    component.enableFiltering = true;
    triggerColumnsChange();
    fixture.detectChanges();

    const nameColumn = component.columns[1];
    component.menuDrafts[nameColumn.field as string] = [
      { operator: 'contains', value: 'li' },
      { operator: 'contains', value: 'bo' },
    ];
    component.setMenuJoinLogic(nameColumn, 'or');
    component.applyMenuFilter(nameColumn);
    fixture.detectChanges();

    expect(component.filtered.map((item) => item.name).sort()).toEqual(['Alice', 'Bob', 'Charlie'].sort());
    const fieldFilter = component.localFilter.filters.find(
      (filter) => ngbIsCompositeFilter(filter) && filter.logic === 'or'
    );
    expect(fieldFilter).toBeTruthy();
  });

  it('renders row filter controls using the new inline field shell', () => {
    component.filterable = 'row';
    component.enableFiltering = true;
    triggerColumnsChange();
    fixture.detectChanges();

    const filterRow = fixture.nativeElement.querySelector('.filter-row') as HTMLElement | null;
    const firstField = filterRow?.querySelector('.grid-filter-inline') as HTMLElement | null;
    const firstControl = filterRow?.querySelector('.grid-filter-control') as HTMLElement | null;
    const clearButton = filterRow?.querySelector('.grid-filter-clear') as HTMLButtonElement | null;

    expect(filterRow).toBeTruthy();
    expect(firstField).toBeTruthy();
    expect(firstControl).toBeTruthy();
    expect(clearButton).toBeNull();
  });

  it('uses input-only row filtering when showFilterOperator is false', () => {
    component.columns = component.columns.map((col) =>
      col.field === 'name' ? { ...col, showFilterOperator: false } : col
    );
    setGridInput('filterable', 'row');
    setGridInput('enableFiltering', true);
    triggerColumnsChange();
    fixture.detectChanges();

    const nameInput = fixture.nativeElement.querySelector('input[aria-label="Name filter"]') as HTMLInputElement | null;
    let clearButtons = Array.from(
      fixture.nativeElement.querySelectorAll('.filter-row .grid-filter-clear')
    ) as HTMLButtonElement[];

    expect(nameInput).toBeTruthy();
    expect(component.isRowFilterOperatorVisible(component.visibleColumns.find((col) => col.field === 'name')!)).toBe(false);
    expect(clearButtons).toHaveLength(0);

    component.upsertColumnFilter('name', 'contains', 'Ali');
    fixture.detectChanges();

    clearButtons = Array.from(
      fixture.nativeElement.querySelectorAll('.filter-row .grid-filter-clear')
    ) as HTMLButtonElement[];
    expect(component.hasActiveColumnFilter('name')).toBe(true);
    expect(clearButtons).toHaveLength(0);
  });

  it('marks the row filter operator button active only when a filter is applied and shows a clear icon beside it', () => {
    component.filterable = 'row';
    component.enableFiltering = true;
    triggerColumnsChange();
    fixture.detectChanges();

    const nameIndex = component.visibleColumns.findIndex((col) => col.field === 'name');
    const operatorButtons = Array.from(
      fixture.nativeElement.querySelectorAll('.filter-row .grid-filter-operator__button--compact')
    ) as HTMLButtonElement[];

    expect(operatorButtons[nameIndex]?.classList.contains('grid-filter-operator__button--active')).toBe(false);

    operatorButtons[nameIndex].click();
    fixture.detectChanges();

    expect(operatorButtons[nameIndex]?.classList.contains('grid-filter-operator__button--active')).toBe(false);

    const nameInput = fixture.nativeElement.querySelector(
      'input[aria-label="Name filter"]'
    ) as HTMLInputElement | null;
    nameInput!.value = 'Ali';
    nameInput!.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const refreshedButtons = Array.from(
      fixture.nativeElement.querySelectorAll('.filter-row .grid-filter-operator__button--compact')
    ) as HTMLButtonElement[];
    const clearButtons = Array.from(
      fixture.nativeElement.querySelectorAll('.filter-row .grid-filter-clear')
    ) as HTMLButtonElement[];

    expect(refreshedButtons[nameIndex]?.classList.contains('grid-filter-operator__button--active')).toBe(true);
    expect(clearButtons).toHaveLength(1);
    expect(clearButtons[0].getAttribute('aria-label')).toBe('Clear filter for Name');
  });

  it('uses contextual placeholders and boolean labels in the default row filter controls', () => {
    component.columns = baseColumns.map((col) =>
      col.field === 'active' || col.field === 'created'
        ? { ...col, filterable: true }
        : { ...col }
    );
    setGridInput('filterable', 'row');
    setGridInput('enableFiltering', true);
    triggerColumnsChange();
    fixture.detectChanges();

    const nameCol = component.visibleColumns.find((col) => col.field === 'name')!;
    const scoreCol = component.visibleColumns.find((col) => col.field === 'score')!;
    const createdCol = component.visibleColumns.find((col) => col.field === 'created')!;
    const activeCol = component.visibleColumns.find((col) => col.field === 'active')!;

    expect(component.rowFilterPlaceholder(nameCol)).toBe('Filter by name...');
    expect(component.rowFilterPlaceholder(scoreCol)).toBe('Filter by score...');
    expect(component.getColumnFilterType(createdCol)).toBe('date');
    expect(component.rowFilterEmptyOptionLabel(activeCol)).toBe('(All)');
    expect(component.booleanFilterOptionLabel(true)).toBe('Yes');
    expect(component.booleanFilterOptionLabel(false)).toBe('No');
    expect(fixture.nativeElement.querySelector('.filter-row .grid-filter-field__icon')).toBeNull();
    expect(component.isRowFilterOperatorVisible(component.visibleColumns.find((col) => col.field === 'active')!)).toBe(false);
  });

  it('opens row filter operator popover and highlights the selected operator', () => {
    component.filterable = 'row';
    component.enableFiltering = true;
    triggerColumnsChange();
    fixture.detectChanges();

    const nameCol = component.visibleColumns.find((col) => col.field === 'name')!;
    const nameIndex = component.visibleColumns.findIndex((col) => col.field === 'name');
    const triggers = Array.from(
      fixture.nativeElement.querySelectorAll('.filter-row .grid-filter-operator__button--compact')
    ) as HTMLButtonElement[];
    triggers[nameIndex].click();
    fixture.detectChanges();

    const items = Array.from(document.querySelectorAll('.grid-filter-operator-menu .dropdown-item')) as HTMLButtonElement[];
    expect(items.length).toBeGreaterThan(0);
    expect(items.some((item) => item.classList.contains('active'))).toBe(true);

    const containsItem = items.find((item) => item.textContent?.trim() === 'Contains');
    containsItem?.click();
    fixture.detectChanges();

    expect(component.rowFilterOperator(nameCol)).toBe('contains');
    expect(component.isRowFilterMenuOpen('name')).toBe(false);
  });

  it('shows the exact string row-filter operator list and order for text columns', () => {
    component.filterable = 'row';
    component.enableFiltering = true;
    triggerColumnsChange();
    fixture.detectChanges();

    const nameCol = component.visibleColumns.find((col) => col.field === 'name')!;
    const items = component.getAllowedOperators(nameCol).map((operator) => component.rowFilterOperatorLabel(nameCol, operator));

    expect(items).toEqual([
      'Is equal to',
      'Is not equal to',
      'Contains',
      'Does not contain',
      'Starts with',
      'Ends with',
    ]);
  });

  it('shows the exact numeric operator list and default selection in row filter mode', () => {
    component.filterable = 'row';
    component.enableFiltering = true;
    triggerColumnsChange();
    fixture.detectChanges();

    const scoreCol = component.visibleColumns.find((col) => col.field === 'score')!;
    const labels = component.getAllowedOperators(scoreCol).map((operator) => component.rowFilterOperatorLabel(scoreCol, operator));

    expect(labels).toEqual([
      'Is equal to',
      'Is not equal to',
      'Is greater than or equal to',
      'Is greater than',
      'Is less than or equal to',
      'Is less than',
    ]);
    expect(component.rowFilterOperator(scoreCol)).toBe('eq');
    expect(component.rowFilterOperatorLabel(scoreCol, component.rowFilterOperator(scoreCol))).toBe('Is equal to');
  });

  it('shows the exact numeric operator list and order in menu filter mode', () => {
    setGridInput('filterable', 'menu');
    setGridInput('enableFiltering', true);
    triggerColumnsChange();
    fixture.detectChanges();

    const scoreCol = component.visibleColumns.find((col) => col.field === 'score')!;
    const labels = component.getAllowedOperators(scoreCol).map((operator) => component.rowFilterOperatorLabel(scoreCol, operator));

    expect(labels).toEqual([
      'Is equal to',
      'Is not equal to',
      'Is greater than or equal to',
      'Is greater than',
      'Is less than or equal to',
      'Is less than',
    ]);
    expect(component.ensureMenuDraftConditions(scoreCol)[0].operator).toBe('eq');
    expect(component.rowFilterOperatorLabel(scoreCol, component.ensureMenuDraftConditions(scoreCol)[0].operator)).toBe('Is equal to');
  });

  it('uses contains as the default operator in menu filter mode for string columns', () => {
    setGridInput('filterable', 'menu');
    setGridInput('enableFiltering', true);
    triggerColumnsChange();
    fixture.detectChanges();

    const nameCol = component.visibleColumns.find((col) => col.field === 'name')!;

    expect(component.ensureMenuDraftConditions(nameCol)[0].operator).toBe('contains');
    expect(component.getAllowedOperators(nameCol).length).toBeGreaterThan(0);
  });

  it('shows the exact date operator list and default selection in row filter mode', () => {
    component.columns = baseColumns.map((col) =>
      col.field === 'created' ? { ...col, filterable: true } : { ...col }
    );
    setGridInput('filterable', 'row');
    setGridInput('enableFiltering', true);
    triggerColumnsChange();
    fixture.detectChanges();

    const createdCol = component.visibleColumns.find((col) => col.field === 'created')!;
    const labels = component.getAllowedOperators(createdCol).map((operator) => component.rowFilterOperatorLabel(createdCol, operator));

    expect(labels).toEqual([
      'Is equal to',
      'Is not equal to',
      'Is after or equal to',
      'Is after',
      'Is before or equal to',
      'Is before',
    ]);
    expect(component.rowFilterOperator(createdCol)).toBe('gte');
    expect(component.rowFilterOperatorLabel(createdCol, component.rowFilterOperator(createdCol))).toBe('Is after or equal to');
  });

  it('shows the exact date operator list and order in menu filter mode', () => {
    component.columns = baseColumns.map((col) =>
      col.field === 'created' ? { ...col, filterable: true } : { ...col }
    );
    setGridInput('filterable', 'menu');
    setGridInput('enableFiltering', true);
    triggerColumnsChange();
    fixture.detectChanges();

    const createdCol = component.visibleColumns.find((col) => col.field === 'created')!;
    const labels = component.getAllowedOperators(createdCol).map((operator) => component.rowFilterOperatorLabel(createdCol, operator));

    expect(labels).toEqual([
      'Is equal to',
      'Is not equal to',
      'Is after or equal to',
      'Is after',
      'Is before or equal to',
      'Is before',
    ]);
    expect(component.ensureMenuDraftConditions(createdCol)[0].operator).toBe('gte');
    expect(component.getAllowedOperators(createdCol).length).toBeGreaterThan(0);
    expect(component.getColumnFilterType(createdCol)).toBe('date');
  });

  it('preserves a non-default row filter operator as the active choice when reopened without a value', () => {
    component.filterable = 'row';
    component.enableFiltering = true;
    triggerColumnsChange();
    fixture.detectChanges();

    const nameCol = component.visibleColumns.find((col) => col.field === 'name')!;
    const nameIndex = component.visibleColumns.findIndex((col) => col.field === 'name');
    const triggers = Array.from(
      fixture.nativeElement.querySelectorAll('.filter-row .grid-filter-operator__button--compact')
    ) as HTMLButtonElement[];

    triggers[nameIndex].click();
    fixture.detectChanges();

    let items = Array.from(document.querySelectorAll('.grid-filter-operator-menu .dropdown-item')) as HTMLButtonElement[];
    component.setRowFilterOperator(nameCol, 'startswith');
    fixture.detectChanges();

    expect(component.rowFilterOperator(nameCol)).toBe('startswith');
    expect(component.hasActiveColumnFilter('name')).toBe(false);

    triggers[nameIndex].click();
    fixture.detectChanges();

    items = Array.from(document.querySelectorAll('.grid-filter-operator-menu .dropdown-item')) as HTMLButtonElement[];
    const activeItems = items.filter((item) => item.classList.contains('active'));
    const containsItem = items.find((item) => item.textContent?.trim() === component.rowFilterOperatorLabel(nameCol, 'contains'));

    expect(activeItems).toHaveLength(1);
    expect(activeItems[0].textContent?.trim()).toBe(component.rowFilterOperatorLabel(nameCol, 'startswith'));
    expect(containsItem?.classList.contains('active')).toBe(false);
  });

  it('uses type defaults and first allowed operator when defaultFilterOperator is empty', () => {
    expect(ngbDefaultFilterOperator('text')).toBe('contains');
    expect(ngbDefaultFilterOperator('numeric')).toBe('eq');
    expect(ngbDefaultFilterOperator('boolean')).toBe('eq');
    expect(ngbDefaultFilterOperator('date')).toBe('gte');

    component.columns = [
      { field: 'name', header: 'Name', filterable: true, defaultFilterOperator: '' },
    ];
    component.data = [{ name: 'A' }];
    component.filterable = 'row';
    component.enableFiltering = true;
    triggerColumnsChange();
    fixture.detectChanges();

    const col = component.visibleColumns[0];
    expect(component.defaultFilterOperator(col)).toBe('eq');
  });

  it('emits filter changes without locally filtering in manual mode', () => {
    component.filterable = true;
    component.filterManual = true;
    component.enableFiltering = true;
    triggerColumnsChange();
    const emitSpy = jest.spyOn(component.filterChange, 'emit');

    (component as any).upsertColumnFilter('name', 'contains', 'Ali');

    expect(component.filtered).toHaveLength(component.data.length);
    expect(emitSpy).toHaveBeenCalled();
  });

  it('treats data as externally filtered when externalFiltering is enabled', () => {
    component.filterable = true;
    component.enableFiltering = true;
    component.externalFiltering = true;
    component.filter = {
      logic: 'and',
      filters: [{ field: 'name', operator: 'contains', value: 'Ali' }]
    };
    component.ngOnChanges({ filter: new SimpleChange(null, component.filter, false) });

    expect(component.filtered).toEqual(component.data);
  });

  it('maps descriptor state back to legacy filtersChange payload', () => {
    component.filterable = true;
    component.enableFiltering = true;
    triggerColumnsChange();
    const emitSpy = jest.spyOn(component.filtersChange, 'emit');

    (component as any).upsertColumnFilter('email', 'contains', '@example.com');

    expect(emitSpy).toHaveBeenCalledWith({
      global: '',
      columns: { email: '@example.com' }
    });
  });

  it('passes descriptor-aware context to custom row filter templates', async () => {
    const hostFixture = TestBed.createComponent(FilterTemplateHostComponent);
    hostFixture.componentInstance.columns = [...baseColumns];
    hostFixture.componentInstance.data = createRows();
    hostFixture.detectChanges();

    hostFixture.componentInstance.grid.filterForm.get(hostFixture.componentInstance.grid.operatorControlName('name'))?.setValue('contains');
    hostFixture.componentInstance.grid.filterForm.get(hostFixture.componentInstance.grid.valueControlName('name'))?.setValue('Ali');
    hostFixture.componentInstance.grid.applyRowFilter(hostFixture.componentInstance.columns[1]);
    hostFixture.detectChanges();

    const ctx = hostFixture.componentInstance.grid.filterContext(hostFixture.componentInstance.columns[1], 'row');
    expect(ctx.field).toBe('name');
    expect(ctx.filter.logic).toBe('and');
    expect(ctx.descriptor?.operator).toBe('contains');
    expect(ctx.descriptor?.value).toBe('Ali');
    expect(ctx.filterChange).toEqual(expect.any(Function));
    expect(ctx.setFieldFilter).toEqual(expect.any(Function));
  });

  it('filters rows when a custom filter calls filterChange manually', async () => {
    const hostFixture = TestBed.createComponent(ManualFilterChangeHostComponent);
    const rows = createRows();
    hostFixture.componentInstance.columns = baseColumns.map((col) =>
      col.field === 'active' ? { ...col, filterable: true } : col
    );
    hostFixture.componentInstance.data = rows;
    hostFixture.detectChanges();

    const emitSpy = jest.spyOn(hostFixture.componentInstance.grid.filterChange, 'emit');
    (hostFixture.nativeElement.querySelector('.manual-filter-yes') as HTMLButtonElement).click();
    hostFixture.detectChanges();
    await hostFixture.whenStable();

    expect(hostFixture.componentInstance.grid.filtered.map((row) => row.id)).toEqual([1, 3]);
    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [expect.objectContaining({ field: 'active', operator: 'eq', value: true })]
      })
    );

    (hostFixture.nativeElement.querySelector('.manual-filter-no') as HTMLButtonElement).click();
    hostFixture.detectChanges();
    await hostFixture.whenStable();

    expect(hostFixture.componentInstance.grid.filtered.map((row) => row.id)).toEqual([2]);
  });

  it('filters rows when a custom filter uses setFieldFilter from FilterCtx', async () => {
    const hostFixture = TestBed.createComponent(SetFieldFilterHostComponent);
    hostFixture.componentInstance.columns = baseColumns.map((col) =>
      col.field === 'active' ? { ...col, filterable: true } : col
    );
    hostFixture.componentInstance.data = createRows();
    hostFixture.detectChanges();

    (hostFixture.nativeElement.querySelector('.set-active-true') as HTMLButtonElement).click();
    hostFixture.detectChanges();
    await hostFixture.whenStable();

    expect(hostFixture.componentInstance.grid.filtered.every((row) => row.active)).toBe(true);
    expect(hostFixture.componentInstance.grid.getColumnFilter('active')).toEqual(
      expect.objectContaining({ field: 'active', operator: 'eq', value: true })
    );
  });

  it('resizes only the dragged column without changing sibling column widths', () => {
    component.columns = [
      { field: 'id', header: 'ID', width: 100 },
      { field: 'name', header: 'Name', width: 160 },
      { field: 'email', header: 'Email', width: 220 },
    ];
    component.data = createRows();
    component.resizable = true;
    component.enableFiltering = false;
    triggerColumnsChange();
    fixture.detectChanges();

    const before = {
      id: component.columnWidth(component.visibleColumns[0]),
      name: component.columnWidth(component.visibleColumns[1]),
      email: component.columnWidth(component.visibleColumns[2]),
    };

    const nameCol = component.visibleColumns[1];
    component.startColumnResize({ clientX: 200, preventDefault: () => undefined, stopPropagation: () => undefined } as MouseEvent, nameCol);
    component.onDocumentMouseMove({ clientX: 240 } as MouseEvent);
    component.onDocumentMouseUp();

    expect(component.columnWidth(component.visibleColumns[0])).toBe(before.id);
    expect(component.columnWidth(component.visibleColumns[1])).toBe(200);
    expect(component.columnWidth(component.visibleColumns[2])).toBe(before.email);
  });

  it('resizes a column when resizable is enabled and updates columnWidth overrides', () => {
    component.columns = baseColumns.map((col) => ({
      ...col,
      width: col.field === 'id' ? 90 : col.field === 'name' ? 160 : col.field === 'email' ? 220 : 140,
      filterable: false,
    }));
    component.resizable = true;
    component.enableFiltering = false;
    triggerColumnsChange();
    fixture.detectChanges();

    const nameCol = component.visibleColumns.find((col) => col.field === 'name')!;
    expect(component.isColumnResizable(nameCol)).toBe(true);
    expect(component.columnWidth(nameCol)).toBe(160);

    component.startColumnResize({ clientX: 100, preventDefault: () => undefined, stopPropagation: () => undefined } as MouseEvent, nameCol);
    component.onDocumentMouseMove({ clientX: 130 } as MouseEvent);
    component.onDocumentMouseUp();

    expect(component.columnWidth(nameCol)).toBe(190);
  });

  it('clamps column resize to minResizableWidth and maxResizableWidth', () => {
    component.columns = [
      { field: 'id', header: 'ID', width: 200, minResizableWidth: 120, maxResizableWidth: 240 },
      { field: 'name', header: 'Name', width: 180 },
    ];
    component.data = createRows();
    component.resizable = true;
    component.enableFiltering = false;
    triggerColumnsChange();
    fixture.detectChanges();

    const idCol = component.visibleColumns.find((col) => col.field === 'id')!;
    component.startColumnResize({ clientX: 0, preventDefault: () => undefined, stopPropagation: () => undefined } as MouseEvent, idCol);
    component.onDocumentMouseMove({ clientX: -500 } as MouseEvent);
    expect(component.columnWidth(idCol)).toBe(120);

    component.onDocumentMouseMove({ clientX: 800 } as MouseEvent);
    expect(component.columnWidth(idCol)).toBe(240);
    component.onDocumentMouseUp();
  });

  it('autoFitColumnsToGrid distributes width across visible data columns', () => {
    const gridWidth = 800;
    jest.spyOn(component as any, 'gridViewportWidth').mockReturnValue(gridWidth);
    component.columns = [
      { field: 'id', header: 'ID', width: 100 },
      { field: 'name', header: 'Name', width: 100 },
      { field: 'email', header: 'Email', width: 100 },
    ];
    component.data = createRows();
    component.resizable = true;
    component.enableFiltering = false;
    triggerColumnsChange();
    fixture.detectChanges();

    component.autoFitColumnsToGrid();

    const total =
      component.columnWidth(component.visibleColumns[0]) +
      component.columnWidth(component.visibleColumns[1]) +
      component.columnWidth(component.visibleColumns[2]);
    expect(total).toBe(gridWidth);
  });

  describe('column reordering', () => {
    const reorderColumns: ColumnDef<Person>[] = [
      { field: 'id', header: 'ID' },
      { field: 'name', header: 'Name' },
      { field: 'email', header: 'Email' },
    ];

    const setupColumnReorder = (columns: ColumnDef<Person>[] = reorderColumns): void => {
      setGridInput('columns', columns);
      setGridInput('data', createRows());
      setGridInput('columnReorderable', true);
      setGridInput('enableFiltering', false);
      triggerColumnsChange();
      fixture.detectChanges();
    };

    const dragEvent = (overrides: Partial<DragEvent> = {}): DragEvent =>
      ({
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: { effectAllowed: 'none', setData: jest.fn(), dropEffect: 'none' },
        ...overrides,
      }) as unknown as DragEvent;

    it('is disabled by default', () => {
      setupColumnReorder();
      component.columnReorderable = false;
      expect(component.isColumnReorderEnabled()).toBe(false);
      component.moveColumn(0, 2);
      expect(component.visibleColumns.map((col) => col.field)).toEqual(['id', 'name', 'email']);
    });

    it('reorders visible columns and emits columnReorder', () => {
      setupColumnReorder();
      expect(component.visibleColumns.map((col) => col.field)).toEqual(['id', 'name', 'email']);

      const emitted: unknown[] = [];
      component.columnReorder.subscribe((event) => emitted.push(event));
      component.moveColumn(0, 2);

      expect(component.visibleColumns.map((col) => col.field)).toEqual(['name', 'email', 'id']);
      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toEqual(
        expect.objectContaining({
          fromIndex: 0,
          toIndex: 2,
          fields: ['name', 'email', 'id'],
          column: expect.objectContaining({ field: 'id' }),
          columns: expect.arrayContaining([
            expect.objectContaining({ field: 'name' }),
            expect.objectContaining({ field: 'email' }),
            expect.objectContaining({ field: 'id' }),
          ]),
        })
      );
    });

    it('keeps reordered column order after change detection', () => {
      setupColumnReorder();
      component.moveColumn(0, 1);
      fixture.detectChanges();
      expect(component.visibleColumns.map((col) => col.field)).toEqual(['name', 'id', 'email']);
    });

    it('does not reorder columns marked reorderable false', () => {
      setupColumnReorder([
        { field: 'id', header: 'ID' },
        { field: 'name', header: 'Name', reorderable: false },
        { field: 'email', header: 'Email' },
      ]);

      const nameCol = component.visibleColumns.find((col) => col.field === 'name')!;
      expect(component.isColumnReorderable(nameCol)).toBe(false);

      component.moveColumn(1, 2);
      expect(component.visibleColumns.map((col) => col.field)).toEqual(['id', 'name', 'email']);
    });

    it('keeps non-reorderable columns at their original positions', () => {
      setupColumnReorder([
        { field: 'id', header: 'ID', reorderable: false },
        { field: 'name', header: 'Name' },
        { field: 'email', header: 'Email' },
      ]);

      component.moveColumn(2, 0);
      expect(component.visibleColumns.map((col) => col.field)).toEqual(['id', 'email', 'name']);
    });

    it('reorders only among visible columns when some are hidden', () => {
      setupColumnReorder([
        { field: 'id', header: 'ID' },
        { field: 'name', header: 'Name', hidden: true },
        { field: 'email', header: 'Email' },
      ]);

      expect(component.visibleColumns.map((col) => col.field)).toEqual(['id', 'email']);
      component.moveColumn(1, 0);
      expect(component.visibleColumns.map((col) => col.field)).toEqual(['email', 'id']);
    });

    it('disables column reorder when any column is pinned', () => {
      setupColumnReorder([
        { field: 'id', header: 'ID', sticky: 'start', width: 80 },
        { field: 'name', header: 'Name', width: 120 },
        { field: 'email', header: 'Email', width: 180 },
      ]);

      expect(component.isColumnReorderEnabled()).toBe(false);
      component.moveColumn(0, 2);
      expect(component.visibleColumns.map((col) => col.field)).toEqual(['id', 'name', 'email']);
    });

    it('disables column reorder when any column is locked', () => {
      setupColumnReorder([
        { field: 'id', header: 'ID', locked: true, width: 80 },
        { field: 'name', header: 'Name', width: 120 },
        { field: 'email', header: 'Email', width: 180 },
      ]);

      expect(component.isColumnReorderEnabled()).toBe(false);
      expect(component.isColumnReorderable(component.visibleColumns[0])).toBe(false);
    });

    it('disables column reorder in stacked layout', async () => {
      component.tableOptions = { stacked: true, stackedLayout: 'cards' };
      setupColumnReorder([{ field: 'name', header: 'Name' }, { field: 'email', header: 'Email' }]);

      expect(component.isColumnReorderEnabled()).toBe(false);
      component.moveColumn(0, 1);
      expect(component.visibleColumns.map((col) => col.field)).toEqual(['name', 'email']);
    });

    it('reorders via drag-and-drop handlers', () => {
      setupColumnReorder();
      const emailCol = component.visibleColumns.find((col) => col.field === 'email')!;

      component.onColumnDragStart(dragEvent(), emailCol, 2);
      expect(component.columnDragField).toBe('email');

      component.onColumnDragOver(dragEvent(), 0);
      expect(component.columnDragOverIndex).toBe(0);

      component.onColumnDrop(dragEvent(), 0);
      expect(component.visibleColumns.map((col) => col.field)).toEqual(['email', 'id', 'name']);
      expect(component.columnDragField).toBeNull();
    });

    it('ignores drag start on non-reorderable columns', () => {
      setupColumnReorder([
        { field: 'id', header: 'ID', reorderable: false },
        { field: 'name', header: 'Name' },
        { field: 'email', header: 'Email' },
      ]);
      const idCol = component.visibleColumns[0];
      const event = dragEvent();
      component.onColumnDragStart(event, idCol, 0);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.columnDragField).toBeNull();
    });

    it('applies column-reorderable grid class and header drag handles', () => {
      setupColumnReorder();
      const root = fixture.nativeElement.querySelector('.ngb-grid') as HTMLElement;
      expect(root.classList.contains('ngb-grid--column-reorderable')).toBe(true);
      expect(component.visibleColumns.filter((col) => component.isColumnReorderable(col)).length).toBe(3);
    });

    it('does not render reorder handles when column reorder is disabled', () => {
      component.columns = reorderColumns;
      component.data = createRows();
      component.columnReorderable = false;
      component.enableFiltering = false;
      triggerColumnsChange();
      fixture.detectChanges();

      const handles = fixture.nativeElement.querySelectorAll('.grid-column-reorder-handle');
      expect(handles.length).toBe(0);
    });

    it('reorderColumn moves a column before the destination index', () => {
      setupColumnReorder();
      const emailCol = component.visibleColumns.find((col) => col.field === 'email')!;

      component.reorderColumn(emailCol, 0, { before: true });

      expect(component.visibleColumns.map((col) => col.field)).toEqual(['email', 'id', 'name']);
    });

    it('reorderColumn moves a column after the destination index when before is false', () => {
      setupColumnReorder();
      const emailCol = component.visibleColumns.find((col) => col.field === 'email')!;

      component.reorderColumn(emailCol, 0, { before: false });

      expect(component.visibleColumns.map((col) => col.field)).toEqual(['id', 'email', 'name']);
    });

    it('reorderColumn accepts a field name and emits columnReorder', () => {
      setupColumnReorder();
      const emitted: unknown[] = [];
      component.columnReorder.subscribe((event) => emitted.push(event));

      component.reorderColumn('email', 0, { before: true });

      expect(component.visibleColumns.map((col) => col.field)).toEqual(['email', 'id', 'name']);
      expect(emitted).toHaveLength(1);
    });

    it('reorderColumn no-ops for unknown columns or invalid destination indexes', () => {
      setupColumnReorder();
      component.reorderColumn('missing', 0);
      component.reorderColumn('id', 99);
      expect(component.visibleColumns.map((col) => col.field)).toEqual(['id', 'name', 'email']);
    });
  });

  it('uses declarative columns and ignores the columns input when both are present', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const hostFixture = TestBed.createComponent(DeclarativeColumnsHostComponent);
    hostFixture.componentInstance.columns = [...baseColumns];
    hostFixture.componentInstance.data = createRows();
    hostFixture.detectChanges();

    expect(hostFixture.componentInstance.grid.resolvedColumns.map((col) => col.header)).toEqual([
      'Declarative Name',
      'Declarative Email'
    ]);
    expect(warnSpy).toHaveBeenCalledWith(
      'ngb-datagrid: declarative columns take precedence over the columns input.'
    );
    warnSpy.mockRestore();
  });

  it('hides columns from rendering and clears active sort when a sorted column becomes hidden', async () => {
    component.columns = baseColumns.map((col) => ({ ...col, width: 140 }));
    component.columns[1].hidden = true;
    component.sort = { active: 'name', direction: 'asc' };
    triggerColumnsChange();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.visibleColumns.map((col) => col.field)).not.toContain('name');
    expect(component.sort).toEqual({ active: null, direction: '' });
    expect(component.visibleColumns.some((col) => component.headerTitle(col).includes('Name'))).toBe(false);
  });

  it('computes sticky start and end offsets for visible columns', () => {
    component.columns = [
      { ...baseColumns[0], width: 120, sticky: 'start' },
      { ...baseColumns[1], width: 180 },
      { ...baseColumns[2], width: 220, sticky: 'end' }
    ] as any;
    component.enablePagination = false;
    triggerColumnsChange();

    expect(component.columnStartOffset(component.visibleColumns[0])).toBe(0);
    expect(component.columnEndOffset(component.visibleColumns[2])).toBe(0);
    expect(component.columnPinnedSide(component.visibleColumns[0])).toBe('start');
    expect(component.columnPinnedSide(component.visibleColumns[2])).toBe('end');
  });

  it('pins locked columns to the leading side and keeps one unlocked column required', () => {
    component.columns = [
      { ...baseColumns[0], width: 120, locked: true },
      { ...baseColumns[1], width: 160 },
      { ...baseColumns[2], width: 220 }
    ];
    triggerColumnsChange();

    expect(component.columnPinnedSide(component.visibleColumns[0])).toBe('start');
    expect(component.columnStartOffset(component.visibleColumns[0])).toBe(0);
  });

  it('pins locked columns to the right side in RTL mode', () => {
    const host = fixture.nativeElement as HTMLElement;
    host.setAttribute('dir', 'rtl');
    fixture.detectChanges();

    component.columns = [
      { ...baseColumns[0], width: 120, locked: true },
      { ...baseColumns[1], width: 160, locked: true },
      { ...baseColumns[2], width: 220 }
    ];
    triggerColumnsChange();

    expect(component.columnPinnedSide(component.visibleColumns[0])).toBe('end');
    expect(component.columnPinnedSide(component.visibleColumns[1])).toBe('end');
    expect(component.columnEndOffset(component.visibleColumns[0])).toBe(160);
    expect(component.columnEndOffset(component.visibleColumns[1])).toBe(0);
  });

  it('throws when sticky or locked columns are missing widths', () => {
    component.columns = [
      { ...baseColumns[0], sticky: true },
      { ...baseColumns[1], width: 160 }
    ];

    expect(() => triggerColumnsChange()).toThrow('sticky/locked columns require explicit width');
  });

  it('throws when locked columns leave no unlocked visible columns', () => {
    component.columns = [
      { ...baseColumns[0], width: 120, locked: true },
      { ...baseColumns[1], width: 160, locked: true }
    ];

    expect(() => triggerColumnsChange()).toThrow('at least one unlocked visible column is required');
  });

  it('throws when sticky column ordering is invalid', () => {
    component.columns = [
      { ...baseColumns[0], width: 120 },
      { ...baseColumns[1], width: 160, sticky: true },
      { ...baseColumns[2], width: 220 }
    ];

    expect(() => triggerColumnsChange()).toThrow('start sticky/locked columns must appear before unlocked columns');
  });

  it('throws when detail rows are combined with pinned columns', () => {
    component.columns = baseColumns.map((col) => ({ ...col, width: 160 }));
    component.columns[0].locked = true;
    component.rowDetailTpl = {} as any;

    expect(() => triggerColumnsChange()).toThrow('detail rows are not supported with sticky or locked columns');
  });

  it('pins leading utility columns when locked or sticky columns are active', () => {
    component.columns = [
      { ...baseColumns[0], width: 120, locked: true },
      { ...baseColumns[1], width: 160 },
      { ...baseColumns[2], width: 220 }
    ];
    component.selectionMode = 'multiple';
    component.selectionBehavior = 'both';
    component.stickyRows = true;
    triggerColumnsChange();
    fixture.detectChanges();

    expect(component.shouldPinLeadingUtilityColumns()).toBe(true);
    expect(component.utilityStickyOffset('selection')).toBe(0);
    expect(component.utilityStickyOffset('detail')).toBe(48);
    expect(component.utilityStickyOffset('sticky-toggle')).toBe(48);
  });

  it('exports only visible columns', async () => {
    component.columns = baseColumns.map((col) => ({ ...col, width: 160 }));
    component.columns[1].hidden = true;
    component.exportOptions = {
      enabled: true,
      type: 'pdf',
      pages: 'current',
      fileName: 'visible-only'
    };
    triggerColumnsChange();

    await component.export('pdf');

    expect(exporter.exportPdf).toHaveBeenCalledWith({
      fileName: 'visible-only',
      columns: component.visibleColumns.map((col) => col.field),
      rows: component.paged,
      options: undefined
    });
  });

  describe('edit modes', () => {
    const nameColumn = () => component.columns.find((col) => col.field === 'name')!;
    const emailColumn = () => component.columns.find((col) => col.field === 'email')!;

    it('incell: cell click starts edit for a single cell and hides actions column', () => {
      component.editMode = 'incell';
      component.enableEdit = true;
      component.enableDelete = true;
      fixture.detectChanges();

      expect(component.showActionsColumn()).toBe(false);
      expect(component.isIncellEditMode()).toBe(true);

      component.onCellClick(createEventForTarget(document.createElement('div')), 0, nameColumn());
      fixture.detectChanges();

      expect(component.editingCell).toEqual({ rowIndex: 0, field: 'name' });
      expect(component.isCellInEditMode(0, nameColumn())).toBe(true);
      expect(component.isCellInEditMode(0, emailColumn())).toBe(false);
    });

    it('incell: text-node clicks still start editing for the full cell surface', () => {
      component.editMode = 'incell';
      component.enableEdit = true;
      fixture.detectChanges();

      const textNode = document.createTextNode('Website Redesign');
      component.onCellClick(createEventForTarget(textNode), 0, nameColumn());
      fixture.detectChanges();

      expect(component.editingCell).toEqual({ rowIndex: 0, field: 'name' });
      expect(component.isCellInEditMode(0, nameColumn())).toBe(true);
    });

    it('incell: switching to another cell updates the roving focused cell', () => {
      component.editMode = 'incell';
      component.enableEdit = true;
      fixture.detectChanges();

      const targetColumn = emailColumn();
      const targetColIndex = component.visibleColumns.findIndex((col) => col.field === targetColumn.field);

      component.startIncellEdit(0, 'name');
      expect(component.focusedCell).toEqual({ rowIndex: 0, colIndex: 1 });

      component.onCellClick(createEventForTarget(document.createElement('div')), 1, targetColumn);
      fixture.detectChanges();

      expect(component.editingCell).toEqual({ rowIndex: 1, field: targetColumn.field });
      expect(component.focusedCell).toEqual({ rowIndex: 1, colIndex: targetColIndex });
    });

    it('incell: Enter commits and Escape cancels', () => {
      component.editMode = 'incell';
      component.enableEdit = true;
      fixture.detectChanges();

      component.startIncellEdit(0, 'name');
      component.editForm.patchValue({ name: 'Alice Updated' });

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onCellKeydown(enterEvent, 0, nameColumn(), 1);
      fixture.detectChanges();

      expect(component.data[0].name).toBe('Alice Updated');
      expect(component.editingCell).toBeNull();

      component.startIncellEdit(0, 'name');
      component.editForm.patchValue({ name: 'Temp Name' });
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      component.onCellKeydown(escapeEvent, 0, nameColumn(), 1);
      fixture.detectChanges();

      expect(component.data[0].name).toBe('Alice Updated');
      expect(component.editingCell).toBeNull();
    });

    it('toolbar: uses selection and hides row edit/delete actions', () => {
      component.editMode = 'toolbar';
      component.enableEdit = true;
      component.enableDelete = true;
      component.enableAdd = true;
      component.selectionMode = 'single';
      component.selectionBehavior = 'row';
      fixture.detectChanges();

      expect(component.showRowEditAction()).toBe(false);
      expect(component.showRowDeleteAction()).toBe(false);
      expect(component.showEditingToolbar()).toBe(true);

      component.toggleSelection(0);
      expect(component.getSingleSelectedPagedIndex()).toBe(0);

      component.editSelectedRow();
      expect(component.editingIndex).toBe(0);
      expect(component.isToolbarEditActive()).toBe(true);

      component.cancelEdit(0);
      expect(component.isToolbarEditActive()).toBe(false);
      component.toggleSelection(0);

      const deleteSpy = jest.spyOn(component.rowDelete, 'emit');
      component.toggleSelection(1);
      component.deleteSelectedRows();
      expect(deleteSpy).toHaveBeenCalledWith({ row: component.data[1], index: 1 });

      component.startAdd();
      expect(component.addingNew).toBe(true);
      expect(component.isToolbarEditActive()).toBe(true);
      component.cancelToolbarEdit();
      expect(component.addingNew).toBe(false);
    });

    it('external: opens dialog for edit and add with save/cancel', () => {
      component.editMode = 'external';
      component.enableEdit = true;
      component.enableAdd = true;
      fixture.detectChanges();

      component.openExternalEdit(0);
      expect(component.externalEditOpen).toBe(true);
      expect(component.externalEditIsNew).toBe(false);

      component.externalForm.patchValue({ name: 'Alice External' });
      const saveSpy = jest.spyOn(component.rowSave, 'emit');
      component.saveExternalEdit();

      expect(saveSpy).toHaveBeenCalled();
      expect(component.data[0].name).toBe('Alice External');
      expect(component.externalEditOpen).toBe(false);

      component.openExternalEdit(0);
      component.externalForm.patchValue({ name: 'Draft Name' });
      component.cancelExternalEdit();
      expect(component.data[0].name).toBe('Alice External');

      const addSpy = jest.spyOn(component.rowAdd, 'emit');
      component.openExternalAdd();
      expect(component.externalEditOpen).toBe(true);
      expect(component.externalEditIsNew).toBe(true);

      component.externalForm.patchValue({
        id: 4,
        name: 'New Person',
        email: 'new@example.com',
        score: 50,
        active: true,
        created: '2024-04-01',
      });
      component.saveExternalEdit();
      expect(addSpy).toHaveBeenCalled();
      expect(component.externalEditOpen).toBe(false);
    });

    it('resets editing state when editMode changes', () => {
      component.editMode = 'incell';
      component.enableEdit = true;
      component.startIncellEdit(0, 'name');
      expect(component.editingCell).not.toBeNull();

      component.ngOnChanges({
        editMode: new SimpleChange('incell', 'inline', false),
      });
      component.editMode = 'inline';

      expect(component.editingCell).toBeNull();
      expect(component.editingIndex).toBeNull();
      expect(component.externalEditOpen).toBe(false);
    });
  });

  describe('change detection strategy', () => {
    it('uses OnPush for bounded datagrid leaf components', () => {
      expect(NgbDatagridAddRowComponent.ɵcmp.onPush).toBe(true);
      expect(NgbDatagridDataRowComponent.ɵcmp.onPush).toBe(true);
      expect(NgbDatagridEditingToolbarComponent.ɵcmp.onPush).toBe(true);
      expect(NgbDatagridExternalEditorComponent.ɵcmp.onPush).toBe(true);
      expect(NgbDatagridFilterMenuPanelComponent.ɵcmp.onPush).toBe(true);
      expect(NgbDatagridHeaderComponent.ɵcmp.onPush).toBe(true);
      expect(NgbDatagridRowFilterOperatorPanelComponent.ɵcmp.onPush).toBe(true);
    });
  });
});
