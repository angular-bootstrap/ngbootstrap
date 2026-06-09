import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgbGridChartComponent } from './grid-chart.component';
import { NgbGridChartConfig } from './grid-chart.types';

interface SalesRow {
  id: number;
  product: string;
  category: string;
  q1Sales: number;
  q2Sales: number;
}

@Component({
  standalone: true,
  imports: [NgbGridChartComponent],
  template: `<ngb-grid-chart [config]="config"></ngb-grid-chart>`,
})
class GridChartHostComponent {
  readonly rows: SalesRow[] = [
    { id: 1, product: 'Laptop Pro', category: 'Electronics', q1Sales: 38000, q2Sales: 52000 },
    { id: 2, product: 'Wireless Mouse', category: 'Accessories', q1Sales: 12000, q2Sales: 11000 },
    { id: 3, product: 'Standing Desk', category: 'Furniture', q1Sales: 28000, q2Sales: 31000 },
    { id: 4, product: 'Monitor 4K', category: 'Electronics', q1Sales: 44000, q2Sales: 48000 },
  ];

  config: NgbGridChartConfig<SalesRow> = {
    mode: 'row-selection',
    rows: this.rows,
    dimension: { key: 'product', label: 'Product', accessor: (row) => row.product },
    subDimension: { key: 'category', label: 'Category', accessor: (row) => row.category },
    metrics: [
      { key: 'q1Sales', label: 'Q1 Sales', accessor: (row) => row.q1Sales },
      { key: 'q2Sales', label: 'Q2 Sales', accessor: (row) => row.q2Sales },
    ],
    selectedRowIds: [1, 3, 4],
    chartType: 'bar',
  };
}

describe('NgbGridChartComponent', () => {
  let fixture: ComponentFixture<GridChartHostComponent>;

  beforeAll(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: jest.fn(() => null),
    });
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GridChartHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GridChartHostComponent);
  });

  it('renders initial selected row ids as checked grid checkboxes', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = Array.from(
      fixture.nativeElement.querySelectorAll('ngb-grid-chart .ngb-grid tbody tr.grid-data-row'),
    ) as HTMLTableRowElement[];
    const checkedRows = rows.filter((row) => row.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked);

    expect(checkedRows.map((row) => row.textContent)).toEqual([
      expect.stringContaining('Laptop Pro'),
      expect.stringContaining('Standing Desk'),
      expect.stringContaining('Monitor 4K'),
    ]);
  });
});
