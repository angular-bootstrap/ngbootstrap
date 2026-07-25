import { ngbApplyDataGridOperations, ngbCalculateDataGridAggregates, ngbGroupData } from './data-operations';
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
      avg: 375,
      average: 375,
      min: 300,
      max: 450,
    });
  });

  it('returns grouped data for the processed rows when group descriptors are present', () => {
    const result = ngbApplyDataGridOperations(rows, {
      columns,
      state: {
        page: 1,
        pageSize: 4,
        group: [{ field: 'status', dir: 'asc' }],
      },
    });

    expect(result.groupedData).toEqual([
      expect.objectContaining({
        field: 'status',
        value: 'Closed',
        count: 2,
      }),
      expect.objectContaining({
        field: 'status',
        value: 'Open',
        count: 2,
      }),
    ]);
  });

  it('keeps grouping aligned with filtering, sorting, and pagination in one local pass', () => {
    const result = ngbApplyDataGridOperations(rows, {
      columns,
      globalFilterFields: ['customer'],
      state: {
        page: 1,
        pageSize: 1,
        sort: [{ field: 'total', direction: 'desc' }],
        group: [{ field: 'status', dir: 'desc' }],
        filter: {
          logic: 'and',
          filters: [{ field: 'customer', operator: 'contains', value: 'acme', ignoreCase: true }],
        },
      },
    });

    expect(result.total).toBe(2);
    expect(result.data).toEqual([rows[2]]);
    expect(result.groupedData).toEqual([
      expect.objectContaining({
        field: 'status',
        value: 'Open',
        count: 1,
      }),
    ]);
  });

  it('returns developer-provided grouped data unchanged in manual or server mode', () => {
    const groupedData = [
      {
        field: 'status',
        value: 'Open',
        dir: 'asc' as const,
        level: 0,
        count: 2,
        aggregates: {
          total: { sum: 750, count: 2 },
        },
        items: [rows[0], rows[2]],
      },
    ];

    const result = ngbApplyDataGridOperations(rows, {
      columns,
      groupedData,
      state: {
        group: [{ field: 'status', dir: 'asc', aggregates: [{ field: 'total', aggregate: 'sum' }] }],
      },
    });

    expect(result.groupedData).toEqual(groupedData);
  });
});

describe('ngbGroupData', () => {
  it('groups rows by a single field in ascending order by default', () => {
    expect(ngbGroupData(rows, [{ field: 'status' }])).toEqual([
      expect.objectContaining({
        field: 'status',
        value: 'Closed',
        dir: 'asc',
        count: 2,
      }),
      expect.objectContaining({
        field: 'status',
        value: 'Open',
        dir: 'asc',
        count: 2,
      }),
    ]);
  });

  it('supports descending group direction', () => {
    expect(ngbGroupData(rows, [{ field: 'status', dir: 'desc' }]).map((group) => group.value)).toEqual([
      'Open',
      'Closed',
    ]);
  });

  it('supports nested multi-field grouping', () => {
    const grouped = ngbGroupData(rows, [
      { field: 'status', dir: 'asc' },
      { field: 'customer', dir: 'asc' },
    ]);

    expect(grouped[0].items[0]).toEqual(
      expect.objectContaining({
        field: 'customer',
        value: 'Blue River Labs',
        count: 1,
      }),
    );
    expect(grouped[1].items[0]).toEqual(
      expect.objectContaining({
        field: 'customer',
        value: 'Acme Health',
        count: 1,
      }),
    );
  });

  it('calculates per-group sum, count, avg, min, and max aggregates', () => {
    const grouped = ngbGroupData(rows, [
      {
        field: 'status',
        dir: 'asc',
        aggregates: [
          { field: 'total', aggregate: 'sum' },
          { field: 'total', aggregate: 'count' },
          { field: 'total', aggregate: 'avg' },
          { field: 'total', aggregate: 'min' },
          { field: 'total', aggregate: 'max' },
        ],
      },
    ]);

    expect(grouped[0].aggregates?.['total']).toEqual({
      sum: 200,
      count: 2,
      avg: 100,
      average: 100,
      min: 80,
      max: 120,
    });
    expect(grouped[1].aggregates?.['total']).toEqual({
      sum: 750,
      count: 2,
      avg: 375,
      average: 375,
      min: 300,
      max: 450,
    });
  });

  it('propagates aggregates through multi-level grouping', () => {
    const grouped = ngbGroupData(rows, [
      {
        field: 'status',
        dir: 'asc',
        aggregates: [{ field: 'total', aggregate: 'sum' }],
      },
      {
        field: 'customer',
        dir: 'asc',
        aggregates: [{ field: 'total', aggregate: 'count' }],
      },
    ]);

    expect(grouped[0].aggregates?.['total']?.sum).toBe(200);
    expect((grouped[0].items[0] as any).aggregates?.['total']?.count).toBe(1);
    expect(grouped[1].aggregates?.['total']?.sum).toBe(750);
    expect((grouped[1].items[1] as any).aggregates?.['total']?.count).toBe(1);
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
