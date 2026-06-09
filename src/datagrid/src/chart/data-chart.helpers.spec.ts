import {
  ngbAggregateValues,
  ngbBuildChartJsConfig,
  ngbBuildColumnSelectionChartData,
  ngbBuildFullGridChartData,
  ngbBuildRowSelectionChartData,
  ngbBuildSparklinePoints,
} from './data-chart.helpers';

interface SalesRow {
  name: string;
  category: string;
  q1: number;
  q2: number;
  revenue: number;
}

const rows: SalesRow[] = [
  { name: 'Laptop Pro', category: 'Electronics', q1: 38000, q2: 52000, revenue: 198000 },
  { name: 'Standing Desk', category: 'Furniture', q1: 28000, q2: 31000, revenue: 123200 },
  { name: 'Monitor 4K', category: 'Electronics', q1: 44000, q2: 48000, revenue: 193500 },
];

describe('data-chart helpers', () => {
  it('builds row selection chart data using selected rows as series', () => {
    const chart = ngbBuildRowSelectionChartData(rows.slice(0, 2), {
      title: 'Quarterly Sales by Product',
      metrics: [
        { key: 'q1', label: 'Q1', accessor: (row) => row.q1 },
        { key: 'q2', label: 'Q2', accessor: (row) => row.q2 },
      ],
      seriesLabel: (row) => row.name,
    });

    expect(chart.labels).toEqual(['Q1', 'Q2']);
    expect(chart.series.map((series) => series.label)).toEqual(['Laptop Pro', 'Standing Desk']);
    expect(chart.series[0].data).toEqual([38000, 52000]);
  });

  it('builds column selection chart data using metrics as series', () => {
    const chart = ngbBuildColumnSelectionChartData(rows, {
      dimension: { key: 'name', label: 'Product', accessor: (row) => row.name },
      metrics: [
        { key: 'q1', label: 'Q1', accessor: (row) => row.q1 },
        { key: 'q2', label: 'Q2', accessor: (row) => row.q2 },
      ],
    });

    expect(chart.labels).toEqual(['Laptop Pro', 'Standing Desk', 'Monitor 4K']);
    expect(chart.series.map((series) => series.label)).toEqual(['Q1', 'Q2']);
    expect(chart.series[1].data).toEqual([52000, 31000, 48000]);
  });

  it('builds full-grid chart data using grouped aggregate values', () => {
    const chart = ngbBuildFullGridChartData(rows, {
      dimension: { key: 'category', label: 'Category', accessor: (row) => row.category },
      metric: { key: 'revenue', label: 'Revenue', accessor: (row) => row.revenue },
      aggregate: 'sum',
      sort: 'desc',
    });

    expect(chart.labels).toEqual(['Electronics', 'Furniture']);
    expect(chart.series[0].data).toEqual([391500, 123200]);
  });

  it('aggregates values for multiple metric modes', () => {
    expect(ngbAggregateValues([10, 20, 30], 'sum')).toBe(60);
    expect(ngbAggregateValues([10, 20, 30], 'avg')).toBe(20);
    expect(ngbAggregateValues([10, 20, 30], 'min')).toBe(10);
    expect(ngbAggregateValues([10, 20, 30], 'max')).toBe(30);
    expect(ngbAggregateValues([10, 20, 30], 'count')).toBe(3);
  });

  it('builds sparkline points inside the requested bounds', () => {
    const points = ngbBuildSparklinePoints([10, 30, 20, 40], 100, 20, 2);

    expect(points).toHaveLength(4);
    expect(points.every((point) => point.x >= 0 && point.x <= 100)).toBe(true);
    expect(points.every((point) => point.y >= 0 && point.y <= 20)).toBe(true);
  });

  it('builds chart.js config for grouped and circular charts', () => {
    const groupedConfig = ngbBuildChartJsConfig({
      type: 'bar',
      labels: ['Q1', 'Q2'],
      series: [{ key: 'a', label: 'Laptop Pro', data: [38000, 52000] }],
      title: 'Sales',
    });
    const pieConfig = ngbBuildChartJsConfig({
      type: 'pie',
      labels: ['ignore'],
      series: [
        { key: 'a', label: 'Laptop Pro', data: [38000, 52000] },
        { key: 'b', label: 'Standing Desk', data: [28000, 31000] },
      ],
    });

    expect(groupedConfig.type).toBe('bar');
    expect(groupedConfig.data.datasets).toHaveLength(1);
    expect(pieConfig.type).toBe('pie');
    expect(pieConfig.data.labels).toEqual(['Laptop Pro', 'Standing Desk']);
    expect((pieConfig.data.datasets[0].data as number[])[0]).toBe(90000);
  });
});
