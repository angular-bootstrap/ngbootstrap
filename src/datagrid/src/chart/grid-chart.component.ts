import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { ColumnDef } from '../models/column-def';
import { Datagrid } from '../datagrid/datagrid.component';
import { NgbCellTemplate } from '../directives/datagrid-templates.directive';
import { NgbDataChartComponent } from './data-chart.component';
import { NgbDataSparklineComponent } from './data-sparkline.component';
import {
  ngbBuildColumnSelectionChartData,
  ngbBuildFullGridChartData,
  ngbBuildRowSelectionChartData,
} from './data-chart.helpers';
import { NgbDataChartConfig, NgbDataMetricDef } from './data-chart.types';
import { NgbGridChartConfig } from './grid-chart.types';

export interface NgbGridChartSelectionChange<T> {
  selected: T[];
  selectedRowIds: Array<string | number>;
}

@Component({
  selector: 'ngb-grid-chart',
  standalone: true,
  imports: [CommonModule, Datagrid, NgbCellTemplate, NgbDataChartComponent, NgbDataSparklineComponent],
  template: `
    <div class="ngb-grid-chart" [class.ngb-grid-chart--full]="config?.mode === 'full-grid'">
      @if (config?.mode === 'sparklines') {
        <ngb-datagrid
          [columns]="sparklineColumns"
          [data]="config?.rows ?? []"
          [theme]="'bootstrap'"
          [enableSorting]="false"
          [enableFiltering]="false"
          [enableGlobalFilter]="false"
          [enablePagination]="false"
          [tableOptions]="tableOptions"
        >
          @if (dimensionTemplate) {
            <ng-template [ngbCell]="config!.dimension.key" let-row="row">
              <div class="ngb-grid-chart__dimension">
                <strong>{{ config!.dimension.accessor(row) }}</strong>
                @if (config?.subDimension) {
                  <span class="ngb-grid-chart__subdimension">{{ config!.subDimension!.accessor(row) }}</span>
                }
              </div>
            </ng-template>
          }
          @if (sparklineField) {
            <ng-template [ngbCell]="sparklineField" let-row="row">
              <ngb-data-sparkline
                [values]="sparklineValues(row)"
                [width]="config?.sparkline?.width ?? 112"
                [height]="config?.sparkline?.height ?? 30"
                [color]="sparklineColor(row)"
                ariaLabel="Trend sparkline"
              ></ngb-data-sparkline>
            </ng-template>
          }
          <ng-template ngbCell="growthPct" let-value>
            <span class="ngb-grid-chart__growth" [class.ngb-grid-chart__growth--up]="value >= 0" [class.ngb-grid-chart__growth--down]="value < 0">
              {{ value > 0 ? '+' : '' }}{{ value | number:'1.1-1' }}%
            </span>
          </ng-template>
        </ngb-datagrid>
      } @else if (config?.mode === 'full-grid') {
        <div class="ngb-grid-chart__full-layout">
          <div class="ngb-grid-chart__chart-pane">
            <ngb-data-chart [config]="chartConfig" [ariaLabel]="chartAriaLabel"></ngb-data-chart>
          </div>
          <div class="ngb-grid-chart__summary-pane">
            <ng-content select="[gridChartSummary]"></ng-content>
          </div>
        </div>
      } @else {
        <div class="ngb-grid-chart__split-layout">
          <div class="ngb-grid-chart__grid-pane">
            <ngb-datagrid
              [columns]="gridColumns"
              [data]="config?.rows ?? []"
              [theme]="'bootstrap'"
              [enableSorting]="false"
              [enableFiltering]="false"
              [enableGlobalFilter]="false"
              [enablePagination]="false"
              [selectionMode]="config?.mode === 'row-selection' ? 'multiple' : 'none'"
              [selectionBehavior]="config?.mode === 'row-selection' ? 'checkbox' : 'row'"
              [trackBy]="rowTrackBy"
              [tableOptions]="tableOptions"
              (selectionChange)="onGridSelectionChange($event)"
            >
              @if (dimensionTemplate) {
                <ng-template [ngbCell]="config!.dimension.key" let-row="row">
                  <div class="ngb-grid-chart__dimension">
                    @if (config?.mode === 'row-selection' && isRowSelected(row)) {
                      <span class="ngb-grid-chart__series-dot" [style.background]="seriesColor(row)"></span>
                    }
                    <div>
                      <strong>{{ config!.dimension.accessor(row) }}</strong>
                      @if (config?.subDimension) {
                        <div class="ngb-grid-chart__subdimension">{{ config!.subDimension!.accessor(row) }}</div>
                      }
                    </div>
                  </div>
                </ng-template>
              }
            </ngb-datagrid>
          </div>
          <div class="ngb-grid-chart__chart-pane">
            <ngb-data-chart [config]="chartConfig" [ariaLabel]="chartAriaLabel"></ngb-data-chart>
            <ng-content select="[gridChartFooter]"></ng-content>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .ngb-grid-chart__split-layout,
    .ngb-grid-chart__full-layout {
      display: grid;
      gap: 1rem;
      align-items: stretch;
    }
    .ngb-grid-chart__split-layout {
      grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
    }
    .ngb-grid-chart--full .ngb-grid-chart__full-layout {
      grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr);
    }
    .ngb-grid-chart__grid-pane,
    .ngb-grid-chart__chart-pane,
    .ngb-grid-chart__summary-pane {
      min-width: 0;
    }
    .ngb-grid-chart__chart-pane {
      display: flex;
      flex-direction: column;
      gap: .5rem;
    }
    .ngb-grid-chart__dimension {
      display: inline-flex;
      align-items: flex-start;
      gap: .55rem;
      min-width: 0;
    }
    .ngb-grid-chart__subdimension {
      display: block;
      font-size: .82rem;
      color: #6b7280;
      font-weight: 500;
    }
    .ngb-grid-chart__series-dot {
      width: .55rem;
      height: .55rem;
      border-radius: 999px;
      margin-top: .35rem;
      flex: 0 0 auto;
    }
    .ngb-grid-chart__growth {
      font-weight: 700;
    }
    .ngb-grid-chart__growth--up { color: #16a34a; }
    .ngb-grid-chart__growth--down { color: #ef4444; }
    @media (max-width: 960px) {
      .ngb-grid-chart__split-layout,
      .ngb-grid-chart--full .ngb-grid-chart__full-layout {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgbGridChartComponent<T = any> implements OnChanges, AfterViewInit, AfterViewChecked {
  @Input({ required: true }) config!: NgbGridChartConfig<T>;
  @Input() ariaLabel = 'Grid chart';

  @Output() selectionChange = new EventEmitter<NgbGridChartSelectionChange<T>>();

  @ViewChild(Datagrid) private grid?: Datagrid<T>;

  gridColumns: ColumnDef<T>[] = [];
  chartConfig: NgbDataChartConfig | null = null;
  dimensionTemplate = true;
  sparklineField: string | null = null;
  sparklineColumns: ColumnDef<T>[] = [];

  readonly tableOptions = { responsive: true, hoverRows: true, zebraStripes: true };
  readonly rowTrackBy = (index: number, row: T) => this.resolveRowId(row, index);

  private readonly cdr = inject(ChangeDetectorRef);
  private selectedIds = new Set<string | number>();
  private activeMetricKeys = new Set<string>();
  private lastMode: NgbGridChartConfig<T>['mode'] | null = null;
  private lastMetricKeys = '';
  private lastChartType = '';
  private lastRowIds = '';
  private lastSparklineKey = '';
  private lastFullGridKey = '';
  private selectionSeedPending = false;
  private sparklineSeriesByRowId = new Map<string | number, number[]>();

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['config'] || !this.config) return;
    this.syncSelectionFromConfig();
    this.applyConfigChanges();
  }

  ngAfterViewInit(): void {
    if (this.config?.mode === 'row-selection') {
      this.scheduleSeedSelection();
    }
  }

  ngAfterViewChecked(): void {
    if (this.selectionSeedPending) {
      this.seedGridSelection();
    }
  }

  get chartAriaLabel(): string {
    return this.config?.chartTitle ?? this.ariaLabel;
  }

  sparklineValues(row: T): number[] {
    const id = this.resolveRowId(row, this.config.rows.indexOf(row));
    const cached = this.sparklineSeriesByRowId.get(id);
    if (cached) return cached;
    return this.config?.sparkline?.values(row) ?? [];
  }

  sparklineColor(row: T): string | null {
    if (!this.config?.sparkline?.trendColor) return null;
    const values = this.sparklineValues(row);
    if (values.length < 2) return null;
    const delta = values[values.length - 1] - values[0];
    if (delta > 0) return '#58c46a';
    if (delta < 0) return '#ef5350';
    return '#9aa5b5';
  }

  isRowSelected(row: T): boolean {
    const id = this.resolveRowId(row, this.config.rows.indexOf(row));
    return this.selectedIds.has(id);
  }

  seriesColor(row: T): string {
    const selected = this.selectedRows();
    const index = selected.indexOf(row);
    const palette = ['#4F7DF3', '#F1645D', '#60C56E', '#F3B13E', '#8B72E8', '#5DC4B6', '#F48F4E', '#D664A0'];
    return palette[Math.max(0, index) % palette.length];
  }

  onGridSelectionChange(event: { selected: T[] }): void {
    this.selectedIds = new Set(event.selected.map((row) => this.resolveRowId(row, this.config.rows.indexOf(row))));
    this.rebuildChartOnly();
    this.selectionChange.emit({
      selected: event.selected,
      selectedRowIds: Array.from(this.selectedIds),
    });
    this.cdr.markForCheck();
  }

  private applyConfigChanges(): void {
    const mode = this.config.mode;
    const metricKeys = [...this.activeMetricKeys].sort().join('|');
    const rowIds = [...this.selectedIds].sort().join('|');
    const chartType = this.config.chartType ?? 'bar';
    const sparklineValuesKey = mode === 'sparklines' && this.config.sparkline?.values
      ? this.config.rows
        .map((row) => this.config.sparkline!.values(row).join(','))
        .join(';')
      : '';
    const sparklineKey = `${this.config.sparkline?.field ?? ''}:${this.config.sparkline?.trendColor ? 1 : 0}:${sparklineValuesKey}`;
    const fullGridDimension = this.config.fullGrid?.dimension ?? this.config.dimension;
    const fullGridMetricKey = this.config.fullGrid?.metric?.key ?? '';
    const fullGridKey = mode === 'full-grid'
      ? `${fullGridMetricKey}|${fullGridDimension.key}|${chartType}`
      : '';

    const modeChanged = mode !== this.lastMode;
    const metricsChanged = metricKeys !== this.lastMetricKeys;
    const rowIdsChanged = rowIds !== this.lastRowIds;
    const chartTypeChanged = chartType !== this.lastChartType;
    const sparklineChanged = sparklineKey !== this.lastSparklineKey;
    const fullGridChanged = fullGridKey !== this.lastFullGridKey;

    this.lastMode = mode;
    this.lastMetricKeys = metricKeys;
    this.lastRowIds = rowIds;
    this.lastChartType = chartType;
    this.lastSparklineKey = sparklineKey;
    this.lastFullGridKey = fullGridKey;

    if (mode === 'sparklines') {
      if (modeChanged || sparklineChanged || metricsChanged) {
        this.sparklineField = this.config.sparkline?.field ?? null;
        this.sparklineColumns = this.buildSparklineColumns();
        this.rebuildSparklineCache();
      }
      this.chartConfig = null;
      this.cdr.markForCheck();
      return;
    }

    if (mode === 'full-grid') {
      if (modeChanged || fullGridChanged || chartTypeChanged) {
        this.rebuildChartOnly();
      }
      this.cdr.markForCheck();
      return;
    }

    if (modeChanged || metricsChanged) {
      this.gridColumns = mode === 'column-selection'
        ? this.buildColumnSelectionColumns()
        : this.buildRowSelectionColumns();
    }

    if (modeChanged || metricsChanged || rowIdsChanged || chartTypeChanged) {
      this.rebuildChartOnly();
    }

    if (mode === 'row-selection' && (modeChanged || rowIdsChanged)) {
      this.scheduleSeedSelection();
    }

    this.cdr.markForCheck();
  }

  private rebuildSparklineCache(): void {
    this.sparklineSeriesByRowId.clear();
    if (!this.config?.sparkline?.values) return;
    this.config.rows.forEach((row, index) => {
      const id = this.resolveRowId(row, index);
      this.sparklineSeriesByRowId.set(id, this.config.sparkline!.values(row));
    });
  }

  private syncSelectionFromConfig(): void {
    const keys = this.config.selectedMetricKeys ?? this.config.metrics.map((metric) => metric.key);
    this.activeMetricKeys = new Set(keys);
    const rowIds = this.config.selectedRowIds ?? [];
    this.selectedIds = new Set(rowIds);
  }

  private rebuildChartOnly(): void {
    if (!this.config || this.config.mode === 'sparklines') return;

    if (this.config.mode === 'row-selection') {
      this.chartConfig = ngbBuildRowSelectionChartData(this.selectedRows(), {
        metrics: this.rowMetrics(),
        seriesLabel: (row) => this.config.dimension.accessor(row),
        chartType: this.config.chartType,
        title: this.config.chartTitle,
        valueFormatter: this.config.valueFormatter,
      });
      return;
    }

    if (this.config.mode === 'column-selection') {
      this.chartConfig = ngbBuildColumnSelectionChartData(this.config.rows, {
        dimension: this.config.dimension,
        metrics: this.activeMetrics(),
        chartType: this.config.chartType,
        title: this.config.chartTitle,
        valueFormatter: this.config.valueFormatter,
      });
      return;
    }

    if (this.config.mode === 'full-grid' && this.config.fullGrid) {
      this.chartConfig = ngbBuildFullGridChartData(this.config.rows, {
        dimension: this.config.fullGrid.dimension ?? this.config.dimension,
        metric: this.config.fullGrid.metric ?? this.config.metrics[0],
        aggregate: this.config.fullGrid.aggregate,
        chartType: this.config.chartType ?? this.config.fullGrid.chartType,
        title: this.config.chartTitle ?? this.config.fullGrid.title,
        sort: this.config.fullGrid.sort,
        limit: this.config.fullGrid.limit,
        valueFormatter: this.config.valueFormatter ?? this.config.fullGrid.valueFormatter,
      });
    }
  }

  private selectedRows(): T[] {
    return this.config.rows.filter((row, index) => this.selectedIds.has(this.resolveRowId(row, index)));
  }

  private activeMetrics(): NgbDataMetricDef<T>[] {
    return this.config.metrics.filter((metric) => this.activeMetricKeys.has(metric.key));
  }

  private rowMetrics(): NgbDataMetricDef<T>[] {
    return this.config.rowSelectionMetrics ?? this.config.metrics;
  }

  private resolveRowId(row: T, index: number): string | number {
    const candidate = (row as { id?: string | number }).id;
    return candidate ?? index;
  }

  private scheduleSeedSelection(): void {
    this.selectionSeedPending = true;
    Promise.resolve().then(() => this.seedGridSelection());
    setTimeout(() => this.seedGridSelection());
    requestAnimationFrame(() => this.seedGridSelection());
  }

  private seedGridSelection(): void {
    if (this.config?.mode !== 'row-selection' || !this.grid) return;
    const ids = this.config.rows
      .map((row, index) => this.resolveRowId(row, index))
      .filter((id) => this.selectedIds.has(id));
    this.grid.setSelectionIds(ids, { emit: false });
    this.selectionSeedPending = false;
    this.cdr.markForCheck();
  }

  private buildRowSelectionColumns(): ColumnDef<T>[] {
    return [
      {
        field: this.config.dimension.key as Extract<keyof T, string>,
        header: this.config.dimension.label,
        width: 280,
      },
      ...this.rowMetrics().map((metric) => ({
        field: metric.key as Extract<keyof T, string>,
        header: metric.label,
        type: 'number' as const,
        width: 140,
      })),
    ];
  }

  private buildColumnSelectionColumns(): ColumnDef<T>[] {
    const productCol: ColumnDef<T> = {
      field: this.config.dimension.key as Extract<keyof T, string>,
      header: this.config.dimension.label.toUpperCase(),
      width: 210,
    };
    const metricCols = this.config.metrics.map((metric) => {
      const active = this.activeMetricKeys.has(metric.key);
      const tint = metric.color ?? '#94a3b8';
      return {
        field: metric.key as Extract<keyof T, string>,
        header: metric.label.toUpperCase(),
        type: 'number' as const,
        width: 150,
        headerStyle: active
          ? { background: `${tint}18`, color: '#334155', fontWeight: 700 }
          : { color: '#94a3b8', fontWeight: 700 },
        cellStyle: active
          ? { background: `${tint}10`, color: '#111827' }
          : { color: '#cbd5e1' },
      } as ColumnDef<T>;
    });
    const trailing = (this.config.trailingColumns ?? []).map((col) => ({
      field: col.field as Extract<keyof T, string>,
      header: col.header.toUpperCase(),
      type: col.type ?? 'number',
      width: col.width ?? 130,
    })) as ColumnDef<T>[];
    return [productCol, ...metricCols, ...trailing];
  }

  private buildSparklineColumns(): ColumnDef<T>[] {
    const cols: ColumnDef<T>[] = [
      {
        field: this.config.dimension.key as Extract<keyof T, string>,
        header: this.config.dimension.label.toUpperCase(),
        width: 220,
      },
    ];
    if (this.config.subDimension) {
      cols.push({
        field: this.config.subDimension.key as Extract<keyof T, string>,
        header: this.config.subDimension.label.toUpperCase(),
        width: 180,
      });
    }
    const quarterMetrics = this.config.metrics.filter((metric) => metric.key.startsWith('q'));
    cols.push(
      ...quarterMetrics.map((metric) => ({
        field: metric.key as Extract<keyof T, string>,
        header: metric.label.toUpperCase(),
        type: 'number' as const,
        width: 150,
      })),
    );
    if (this.config.sparkline?.field) {
      cols.push({
        field: this.config.sparkline.field as Extract<keyof T, string>,
        header: 'Trend',
        width: 170,
      });
    }
    cols.push(
      ...(this.config.trailingColumns ?? []).map((col) => ({
        field: col.field as Extract<keyof T, string>,
        header: col.header.toUpperCase(),
        type: col.type ?? 'number',
        width: col.width ?? 130,
      })) as ColumnDef<T>[],
    );
    return cols;
  }
}
