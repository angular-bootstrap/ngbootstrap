import {
  NgbDataChartType,
  NgbDataDimensionDef,
  NgbDataMetricDef,
  NgbFullGridChartOptions,
} from './data-chart.types';

export type NgbGridChartMode = 'row-selection' | 'column-selection' | 'full-grid' | 'sparklines';

export interface NgbGridChartSparklineOptions<T = any> {
  /** Field key rendered with an inline sparkline. */
  field: string;
  values: (row: T) => number[];
  width?: number;
  height?: number;
  trendColor?: boolean;
}

export interface NgbGridChartConfig<T = any> {
  mode: NgbGridChartMode;
  /** Tabular rows used by the grid and chart builders. */
  rows: T[];
  /** Primary label column (e.g. product name). */
  dimension: NgbDataDimensionDef<T>;
  /** Optional secondary line under the dimension label (e.g. category). */
  subDimension?: NgbDataDimensionDef<T>;
  /** Metrics available for charts / sparklines. */
  metrics: NgbDataMetricDef<T>[];
  /** Metrics plotted for row-selection mode (defaults to all metrics). */
  rowSelectionMetrics?: NgbDataMetricDef<T>[];
  /** Keys of metrics enabled in column-selection mode. */
  selectedMetricKeys?: string[];
  /** Row ids selected in row-selection mode. */
  selectedRowIds?: Array<string | number>;
  chartType?: NgbDataChartType;
  chartTitle?: string;
  valueFormatter?: (value: number) => string;
  /** Full-grid mode options (metric + grouping). */
  fullGrid?: Partial<NgbFullGridChartOptions<T>>;
  sparkline?: NgbGridChartSparklineOptions<T>;
  /** Extra grid columns appended after metric columns (e.g. growth %). */
  trailingColumns?: Array<{
    field: string;
    header: string;
    type?: 'text' | 'number';
    width?: number;
  }>;
}
