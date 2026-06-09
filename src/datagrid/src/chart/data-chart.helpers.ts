import type { ChartConfiguration, ChartType, TooltipItem } from 'chart.js';
import {
  NgbColumnSelectionChartOptions,
  NgbDataAggregate,
  NgbDataChartConfig,
  NgbDataChartSeries,
  NgbDataChartType,
  NgbDataMetricDef,
  NgbFullGridChartOptions,
  NgbRowSelectionChartOptions,
  NgbSparklinePoint,
} from './data-chart.types';

const DEFAULT_PALETTE = ['#4F7DF3', '#F1645D', '#60C56E', '#F3B13E', '#8B72E8', '#5DC4B6', '#F48F4E', '#D664A0'];

const clampNumber = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const defaultFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export const ngbChartPalette = (index: number): string => DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];

const sum = (values: number[]): number => values.reduce((acc, value) => acc + value, 0);

export const ngbAggregateValues = (values: number[], aggregate: NgbDataAggregate = 'sum'): number => {
  if (!values.length) return 0;
  switch (aggregate) {
    case 'avg':
      return sum(values) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'count':
      return values.length;
    case 'sum':
    default:
      return sum(values);
  }
};

export const ngbBuildRowSelectionChartData = <T>(
  rows: T[],
  options: NgbRowSelectionChartOptions<T>,
): NgbDataChartConfig => ({
  type: options.chartType ?? 'bar',
  title: options.title,
  labels: options.metrics.map((metric) => metric.label),
  valueFormatter: options.valueFormatter,
  series: rows.map((row, index) => ({
    key: `row-${index}`,
    label: options.seriesLabel?.(row, index) ?? `Row ${index + 1}`,
    color: ngbChartPalette(index),
    data: options.metrics.map((metric) => clampNumber(metric.accessor(row))),
  })),
});

export const ngbBuildColumnSelectionChartData = <T>(
  rows: T[],
  options: NgbColumnSelectionChartOptions<T>,
): NgbDataChartConfig => ({
  type: options.chartType ?? 'bar',
  title: options.title,
  labels: rows.map((row) => options.dimension.accessor(row)),
  valueFormatter: options.valueFormatter,
  series: options.metrics.map((metric, index) => ({
    key: metric.key,
    label: metric.label,
    color: metric.color ?? ngbChartPalette(index),
    data: rows.map((row) => clampNumber(metric.accessor(row))),
  })),
});

export const ngbBuildFullGridChartData = <T>(
  rows: T[],
  options: NgbFullGridChartOptions<T>,
): NgbDataChartConfig => {
  const grouped = new Map<string, number[]>();
  rows.forEach((row) => {
    const key = options.dimension.accessor(row);
    const bucket = grouped.get(key) ?? [];
    bucket.push(clampNumber(options.metric.accessor(row)));
    grouped.set(key, bucket);
  });

  const entries = Array.from(grouped.entries()).map(([label, values]) => ({
    label,
    value: ngbAggregateValues(values, options.aggregate ?? 'sum'),
  }));

  if (options.sort) {
    entries.sort((left, right) =>
      options.sort === 'asc' ? left.value - right.value : right.value - left.value,
    );
  }

  const limited = options.limit ? entries.slice(0, options.limit) : entries;

  return {
    type: options.chartType ?? 'bar',
    title: options.title,
    labels: limited.map((entry) => entry.label),
    valueFormatter: options.valueFormatter,
    series: [
      {
        key: options.metric.key,
        label: options.metric.label,
        color: options.metric.color ?? ngbChartPalette(0),
        data: limited.map((entry) => entry.value),
      },
    ],
  };
};

export const ngbBuildSparklinePoints = (values: number[], width = 112, height = 28, padding = 2): NgbSparklinePoint[] => {
  if (!values.length) return [];
  if (values.length === 1) {
    return [{ x: width / 2, y: height / 2 }];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const xStep = (width - padding * 2) / (values.length - 1);
  const yRange = max - min || 1;

  return values.map((value, index) => ({
    x: padding + index * xStep,
    y: height - padding - ((value - min) / yRange) * (height - padding * 2),
  }));
};

const tooltipFormatter = (value: number, formatter?: (value: number) => string): string =>
  formatter ? formatter(value) : defaultFormatter.format(value);

const chartLayoutOptions = (_height: number) => ({
  animation: false as const,
  responsive: true,
  maintainAspectRatio: false,
  resizeDelay: 50,
  layout: { padding: { top: 4, right: 8, bottom: 4, left: 4 } },
});

export const ngbBuildChartJsConfig = (
  config: NgbDataChartConfig,
  height = config.height ?? 320,
): ChartConfiguration => {
  const type = config.type === 'area' ? 'line' : (config.type as ChartType);
  const legendPosition = config.legendPosition ?? 'top';
  const showLegend = config.showLegend ?? true;
  const layout = chartLayoutOptions(height);

  if (config.type === 'pie' || config.type === 'doughnut') {
    if (config.series.length === 1 && config.labels.length > 1) {
      const series = config.series[0];
      const colors = config.labels.map((_, index) => ngbChartPalette(index));
      return {
        type,
        data: {
          labels: config.labels,
          datasets: [{
            label: series.label,
            data: series.data.map((value) => clampNumber(value)),
            backgroundColor: colors,
            borderColor: colors,
            borderWidth: 1,
          }],
        },
        options: {
          ...layout,
          plugins: {
            legend: { display: showLegend, position: legendPosition },
            title: { display: !!config.title, text: config.title },
            tooltip: {
              callbacks: {
                label: (ctx: TooltipItem<any>) => {
                  const label = ctx.label ? `${ctx.label}: ` : '';
                  return `${label}${tooltipFormatter(clampNumber(ctx.parsed), config.valueFormatter)}`;
                },
              },
            },
          },
        },
      };
    }

    const series = config.series.map((item, index) => ({
      label: item.label,
      value: sum(item.data),
      color: item.color ?? ngbChartPalette(index),
    }));
    return {
      type,
      data: {
        labels: series.map((item) => item.label),
        datasets: [{
          label: config.title ?? '',
          data: series.map((item) => item.value),
          backgroundColor: series.map((item) => item.color),
          borderColor: series.map((item) => item.color),
          borderWidth: 1,
        }],
      },
      options: {
        ...layout,
        plugins: {
          legend: { display: showLegend, position: legendPosition },
          title: { display: !!config.title, text: config.title },
          tooltip: {
            callbacks: {
              label: (ctx: TooltipItem<any>) => {
                const label = ctx.label ? `${ctx.label}: ` : '';
                return `${label}${tooltipFormatter(clampNumber(ctx.parsed), config.valueFormatter)}`;
              },
            },
          },
        },
      },
    };
  }

  const series = config.series.map((item, index) => {
    const color = item.color ?? ngbChartPalette(index);
    return {
      label: item.label,
      data: item.data.map((value) => clampNumber(value)),
      borderColor: color,
      backgroundColor: config.type === 'area' ? `${color}66` : `${color}cc`,
      fill: config.type === 'area',
      tension: config.type === 'line' || config.type === 'area' ? 0.3 : 0,
      pointRadius: config.type === 'bar' ? 0 : 3,
      borderWidth: 2,
    };
  });

  return {
    type,
    data: {
      labels: config.labels,
      datasets: series,
    },
    options: {
      ...layout,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          stacked: !!config.stacked,
          grid: { color: '#eef2f7' },
          ticks: { color: '#5b6578' },
        },
        y: {
          stacked: !!config.stacked,
          beginAtZero: true,
          grid: { color: '#eef2f7' },
          ticks: {
            color: '#5b6578',
            callback: (value) => tooltipFormatter(clampNumber(value), config.valueFormatter),
          },
        },
      },
      plugins: {
        legend: { display: showLegend, position: legendPosition },
        title: { display: !!config.title, text: config.title },
        tooltip: {
          callbacks: {
            label: (ctx: TooltipItem<any>) => {
              const label = ctx.dataset.label ? `${ctx.dataset.label}: ` : '';
              return `${label}${tooltipFormatter(clampNumber(ctx.parsed?.y ?? ctx.parsed), config.valueFormatter)}`;
            },
          },
        },
      },
    },
  };
};
