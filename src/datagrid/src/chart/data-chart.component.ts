import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { NgbDataChartConfig } from './data-chart.types';
import { ngbBuildChartJsConfig } from './data-chart.helpers';

type ChartInstance = { destroy(): void };
type ChartConstructor = new (context: CanvasRenderingContext2D, config: unknown) => ChartInstance;

@Component({
  selector: 'ngb-data-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ngb-data-chart" [style.height.px]="chartHeight">
      @if (hasData()) {
        <canvas #canvas [attr.aria-label]="ariaLabel" role="img"></canvas>
      } @else {
        <div class="ngb-data-chart__empty">{{ config?.emptyState || emptyState }}</div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .ngb-data-chart {
      position: relative;
      width: 100%;
      height: 320px;
      overflow: hidden;
    }
    .ngb-data-chart canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
    }
    .ngb-data-chart__empty {
      min-height: inherit;
      display: grid;
      place-items: center;
      color: #6b7280;
      font-size: .95rem;
      border: 1px dashed #d7deea;
      border-radius: .75rem;
      background: #f8fafc;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgbDataChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() config: NgbDataChartConfig | null = null;
  @Input() ariaLabel = 'Data chart';
  @Input() emptyState = 'No chart data available.';

  @ViewChild('canvas') private canvas?: ElementRef<HTMLCanvasElement>;

  private chart?: ChartInstance;
  private chartConstructor?: ChartConstructor;
  private viewReady = false;
  private configSignature = '';
  private rendering = false;

  get chartHeight(): number {
    return this.config?.height ?? 320;
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.viewReady) return;
    if (changes['config']) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  hasData(): boolean {
    return !!this.config?.series?.some((series) => series.data.some((value) => Number.isFinite(value)));
  }

  private async renderChart(): Promise<void> {
    if (this.rendering) return;
    if (!this.canvas || typeof window === 'undefined') {
      this.destroyChart();
      return;
    }

    if (!this.hasData() || !this.config) {
      this.destroyChart();
      this.configSignature = '';
      return;
    }

    const signature = this.buildConfigSignature(this.config);
    const context = this.canvas.nativeElement.getContext('2d');
    if (!context) return;

    if (this.chart && signature === this.configSignature) {
      return;
    }

    this.rendering = true;
    try {
      const Chart = await this.loadChartConstructor();
      if (!Chart) {
        this.destroyChart();
        return;
      }
      this.destroyChart();
      this.chart = new Chart(context, ngbBuildChartJsConfig(this.config, this.chartHeight));
      this.configSignature = signature;
    } finally {
      this.rendering = false;
    }
  }

  private async loadChartConstructor(): Promise<ChartConstructor | null> {
    if (this.chartConstructor) return this.chartConstructor;
    try {
      const chartModule = await import('chart.js');
      chartModule.Chart.register(...chartModule.registerables);
      this.chartConstructor = chartModule.Chart as ChartConstructor;
      return this.chartConstructor;
    } catch {
      return null;
    }
  }

  private buildConfigSignature(config: NgbDataChartConfig): string {
    return JSON.stringify({
      type: config.type,
      title: config.title,
      labels: config.labels,
      series: config.series,
      stacked: config.stacked,
      showLegend: config.showLegend,
      legendPosition: config.legendPosition,
    });
  }

  private destroyChart(): void {
    this.chart?.destroy();
    this.chart = undefined;
  }
}
