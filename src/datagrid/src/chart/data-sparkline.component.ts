import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgbSparklinePoint } from './data-chart.types';
import { ngbBuildSparklinePoints } from './data-chart.helpers';

@Component({
  selector: 'ngb-data-sparkline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      class="ngb-data-sparkline"
      [attr.viewBox]="'0 0 ' + width + ' ' + height"
      [attr.width]="width"
      [attr.height]="height"
      [attr.aria-label]="ariaLabel"
      role="img"
      preserveAspectRatio="none"
    >
      @if (points.length > 1) {
        <path [attr.d]="path" fill="none" [attr.stroke]="strokeColor" [attr.stroke-width]="strokeWidth" stroke-linecap="round" stroke-linejoin="round"></path>
        @if (showEndDot) {
          <circle [attr.cx]="points[points.length - 1].x" [attr.cy]="points[points.length - 1].y" [attr.r]="endDotRadius" [attr.fill]="strokeColor"></circle>
        }
      } @else if (points.length === 1) {
        <circle [attr.cx]="points[0].x" [attr.cy]="points[0].y" [attr.r]="endDotRadius" [attr.fill]="strokeColor"></circle>
      }
    </svg>
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; }
    .ngb-data-sparkline { display: block; overflow: visible; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgbDataSparklineComponent implements OnChanges {
  @Input() values: number[] = [];
  /** Cached series used by getters so template bindings stay stable between checks. */
  series: number[] = [];
  @Input() width = 112;
  @Input() height = 28;
  @Input() strokeWidth = 2;
  @Input() positiveColor = '#58c46a';
  @Input() negativeColor = '#ef5350';
  @Input() neutralColor = '#9aa5b5';
  @Input() color: string | null = null;
  @Input() showEndDot = true;
  @Input() endDotRadius = 2.5;
  @Input() ariaLabel = 'Sparkline chart';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['values']) {
      this.series = [...(this.values ?? [])];
    }
  }

  get points(): NgbSparklinePoint[] {
    return ngbBuildSparklinePoints(this.series, this.width, this.height);
  }

  get path(): string {
    if (this.points.length < 2) return '';
    return this.points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  }

  get strokeColor(): string {
    if (this.color) return this.color;
    if (this.series.length < 2) return this.neutralColor;
    const delta = this.series[this.series.length - 1] - this.series[0];
    if (delta > 0) return this.positiveColor;
    if (delta < 0) return this.negativeColor;
    return this.neutralColor;
  }
}
