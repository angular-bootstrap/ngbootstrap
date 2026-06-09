export type NgbDataChartType = 'bar' | 'line' | 'area' | 'pie' | 'doughnut';
export type NgbDataAggregate = 'sum' | 'avg' | 'min' | 'max' | 'count';

export interface NgbDataMetricDef<T = any> {
  key: string;
  label: string;
  accessor: (row: T) => number;
  color?: string;
}

export interface NgbDataDimensionDef<T = any> {
  key: string;
  label: string;
  accessor: (row: T) => string;
}

export interface NgbDataChartSeries {
  key: string;
  label: string;
  data: number[];
  color?: string;
}

export interface NgbDataChartConfig {
  type: NgbDataChartType;
  labels: string[];
  series: NgbDataChartSeries[];
  title?: string;
  height?: number;
  emptyState?: string;
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom';
  stacked?: boolean;
  valueFormatter?: (value: number) => string;
}

export interface NgbFullGridChartOptions<T = any> {
  dimension: NgbDataDimensionDef<T>;
  metric: NgbDataMetricDef<T>;
  aggregate?: NgbDataAggregate;
  chartType?: NgbDataChartType;
  title?: string;
  limit?: number;
  sort?: 'asc' | 'desc' | null;
  valueFormatter?: (value: number) => string;
}

export interface NgbRowSelectionChartOptions<T = any> {
  metrics: NgbDataMetricDef<T>[];
  seriesLabel?: (row: T, index: number) => string;
  chartType?: NgbDataChartType;
  title?: string;
  valueFormatter?: (value: number) => string;
}

export interface NgbColumnSelectionChartOptions<T = any> {
  dimension: NgbDataDimensionDef<T>;
  metrics: NgbDataMetricDef<T>[];
  chartType?: NgbDataChartType;
  title?: string;
  valueFormatter?: (value: number) => string;
}

export interface NgbSparklinePoint {
  x: number;
  y: number;
}
