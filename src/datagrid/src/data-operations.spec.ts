import { ngbApplyDataGridOperations, ngbCalculateDataGridAggregates } from './data-operations';
import { NgbCompositeFilterDescriptor } from './models/filtering';

interface OrderRow {
  id: number;
  customer: string;
  status: 'Open' | 'Closed';
  total: number;
  orderedAt: string;
}

const rows: OrderRow[] = [
  { id: 1, customer: 'Acme Health', status: 'Open', total: 300, orderedAt: '2026-05-01' },
  { id: 2, customer: 'Northwind Supply', status: 'Closed', total: 120, orderedAt: '2026-05-03' },
  { id: 3, customer: 'Acme Retail', status: 'Open', total: 450, orderedAt: '2026-05-05' },
  { id: 4, customer: 'Blue River Labs', status: 'Closed', total: 80, orderedAt: '2026-05-07' },
];

const columns = [
  { field: 'id', type: 'number' },
  { field: 'customer', type: 'text' },
  { field: 'status', type: 'select' },
  { field: 'total', type: 'number' },
  { field: 'orderedAt', type: 'date' },
];

describe('ngbApplyDataGridOperations', () => {
  it('filters, sorts, and pages data from a unified state', () => {
    const filter: NgbCompositeFilterDescriptor = {
      logic: 'and',
      filters: [{ field: 'customer', operator: 'contains', value: 'acme', ignoreCase: true }],
    };

    const result = ngbApplyDataGridOperations(rows, {
      columns,
      state: {
        page: 1,
        pageSize: 1,
        sort: [{ field: 'total', direction: 'desc' }],
        filter,
      },
    });

    expect(result.total).toBe(2);
    expect(result.data).toEqual([rows[2]]);
  });

  it('applies global search across configured fields', () => {
    const result = ngbApplyDataGridOperations(rows, {
      globalFilterFields: ['customer'],
      state: { globalFilter: 'river' },
    });

    expect(result.total).toBe(1);
    expect(result.data[0].customer).toBe('Blue River Labs');
  });

  it('supports date and number operators using column metadata', () => {
    const result = ngbApplyDataGridOperations(rows, {
      columns,
      state: {
        filter: {
          logic: 'and',
          filters: [
            { field: 'orderedAt', operator: 'gte', value: '2026-05-03' },
            { field: 'total', operator: 'gt', value: 100 },
          ],
        },
      },
    });

    expect(result.data.map((row) => row.id)).toEqual([2, 3]);
  });

  it('calculates aggregates from the filtered full result before page slicing', () => {
    const result = ngbApplyDataGridOperations(rows, {
      columns,
      aggregates: [
        { field: 'total', aggregate: 'count' },
        { field: 'total', aggregate: 'sum' },
        { field: 'total', aggregate: 'average' },
        { field: 'total', aggregate: 'min' },
        { field: 'total', aggregate: 'max' },
      ],
      state: {
        page: 1,
        pageSize: 1,
        filter: {
          logic: 'and',
          filters: [{ field: 'status', operator: 'eq', value: 'Open', ignoreCase: true }],
        },
      },
    });

    expect(result.data.length).toBe(1);
    expect(result.total).toBe(2);
    expect(result.aggregates?.['total']).toEqual({
      count: 2,
      sum: 750,
      average: 375,
      min: 300,
      max: 450,
    });
  });
});

describe('ngbCalculateDataGridAggregates', () => {
  it('can calculate aggregates independently from a grid', () => {
    expect(ngbCalculateDataGridAggregates(rows, [
      { field: 'customer', aggregate: 'count' },
      { field: 'orderedAt', aggregate: 'min' },
      { field: 'orderedAt', aggregate: 'max' },
    ])).toEqual({
      customer: { count: 4 },
      orderedAt: { min: '2026-05-01', max: '2026-05-07' },
    });
  });
});
