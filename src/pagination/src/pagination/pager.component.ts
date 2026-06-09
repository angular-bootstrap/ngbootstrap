import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbPaginationComponent } from './pagination.component';
import {
  NgbPagerDensity,
  NgbPagerSettings,
  ngbFormatPagerRangeLabel,
  ngbPagerButtonCountForDensity,
  ngbResolvePagerDensity,
  ngbResolvePagerPageSizeOptions,
  ngbResolvePagerSettings,
} from './pager-settings';

@Component({
  selector: 'ngb-pager',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbPaginationComponent],
  template: `
    <div
      #pagerRoot
      class="ngb-pager"
      [class.ngb-pager--wrap]="!responsiveEnabled"
      [class.ngb-pager--responsive]="responsiveEnabled"
      [class.ngb-pager--density-compact]="pagerDensity === 'compact' || pagerDensity === 'minimal'"
      [class.ngb-pager--density-minimal]="pagerDensity === 'minimal'"
    >
      @if (showInfoSetting) {
        <div
          class="ngb-pager__range ngb-pager__part--info small text-muted"
          [class.ngb-pager__part--hidden]="!showInfo"
          [attr.aria-hidden]="showInfo ? null : true"
        >
          {{ displayInfoLabel }}
        </div>
      } @else {
        <div class="ngb-pager__range ngb-pager__part--info ngb-pager__part--spacer" aria-hidden="true"></div>
      }

      <div class="ngb-pager__pagination ngb-pager__part--nav">
        <ngb-pagination
          [page]="page"
          [pageSize]="pageSize"
          [collectionSize]="collectionSize"
          [buttonCount]="effectiveButtonCount"
          [previousNext]="previousNextEnabled"
          [pagerType]="pagerType"
          [responsive]="!responsiveEnabled"
          (pageChange)="onPageChange($event)"
        >
        </ngb-pagination>
      </div>

      @if (showPageSizesSetting) {
        <div
          class="ngb-pager__page-size ngb-pager__part--sizes"
          [class.ngb-pager__part--hidden]="!showPageSizes"
          [attr.aria-hidden]="showPageSizes ? null : true"
        >
          <label class="ngb-pager__page-size-label" [attr.for]="pageSizeSelectId">
            {{ rowsPerPageLabel }}
          </label>
          <select
            [id]="pageSizeSelectId"
            class="form-select form-select-sm ngb-pager__page-size-select"
            [ngModel]="pageSize"
            (ngModelChange)="onPageSizeChange($event)"
            [disabled]="!showPageSizes"
            [attr.aria-label]="rowsPerPageLabel"
          >
            @for (s of resolvedPageSizeOptions; track s) {
              <option [ngValue]="s">{{ s }}</option>
            }
          </select>
        </div>
      } @else {
        <div class="ngb-pager__page-size ngb-pager__part--sizes ngb-pager__part--spacer" aria-hidden="true"></div>
      }
    </div>
  `,
  styles: [`
    .ngb-pager {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      align-items: center;
      gap: 0.5rem 0.75rem;
      width: 100%;
      color: var(--dg-pager-text, var(--bs-secondary-color));
    }

    .ngb-pager__range {
      justify-self: start;
      min-width: 0;
      color: var(--dg-pager-text, var(--bs-secondary-color)) !important;
    }

    .ngb-pager__pagination {
      display: flex;
      justify-content: center;
      justify-self: center;
      min-width: 0;
    }

    .ngb-pager__page-size {
      display: inline-flex;
      align-items: center;
      justify-self: end;
      gap: 0.5rem;
      min-width: 0;
    }

    .ngb-pager__page-size-label {
      margin: 0;
      white-space: nowrap;
      font-size: 0.875rem;
      line-height: 1.25;
      color: var(--dg-pager-text, var(--bs-secondary-color));
    }

    .ngb-pager__page-size-select {
      width: auto;
      min-width: 4.5rem;
      flex: 0 0 auto;
      border-color: var(--dg-pager-control-border, var(--bs-border-color));
      background-color: var(--dg-pager-control-bg, var(--bs-body-bg));
      background-image: var(--dg-pager-select-icon);
      background-position: right 0.75rem center;
      background-repeat: no-repeat;
      background-size: 16px 12px;
      color: var(--dg-text, var(--bs-body-color));
      padding-right: 2.25rem;
      appearance: none;
    }

    .ngb-pager--wrap {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
    }

    .ngb-pager--wrap .ngb-pager__range {
      flex: 1 1 100%;
      justify-self: auto;
    }

    .ngb-pager--wrap .ngb-pager__pagination {
      flex: 1 1 100%;
      justify-content: center;
      justify-self: auto;
    }

    .ngb-pager--wrap .ngb-pager__page-size {
      flex: 0 0 auto;
      justify-self: auto;
    }

    .ngb-pager--responsive {
      flex-wrap: nowrap;
      overflow: hidden;
    }

    .ngb-pager__part--hidden {
      visibility: hidden;
      pointer-events: none;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgbPagerComponent implements AfterViewInit, OnDestroy {
  private static nextId = 0;

  private readonly uid = NgbPagerComponent.nextId++;

  readonly pageSizeSelectId = `ngb-pager-page-size-${this.uid}`;

  pagerDensity: NgbPagerDensity = 'full';

  private resizeObserver?: ResizeObserver;

  @ViewChild('pagerRoot') pagerRoot?: ElementRef<HTMLElement>;

  @Input() page = 1;
  @Input() pageSize = 10;
  @Input() collectionSize = 0;
  @Input() settings: boolean | NgbPagerSettings | null = true;
  /** Overrides the default range label when `info` is enabled. */
  @Input() infoLabel?: string;
  @Input() rangeLabelTemplate = '{start}–{end} of {total}';
  @Input() rowsPerPageLabel = 'Rows per page';
  /** When set, overrides `settings.responsive`. */
  @Input() responsive?: boolean;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  constructor(private readonly cdr: ChangeDetectorRef) {}

  get resolved(): NgbPagerSettings {
    return ngbResolvePagerSettings(this.settings) ?? ngbResolvePagerSettings(true)!;
  }

  get responsiveEnabled(): boolean {
    return this.responsive ?? this.resolved.responsive !== false;
  }

  get showInfoSetting(): boolean {
    return this.resolved.info !== false;
  }

  get showPageSizesSetting(): boolean {
    const pageSizes = this.resolved.pageSizes;
    return Array.isArray(pageSizes) && pageSizes.length > 0;
  }

  get showInfo(): boolean {
    return this.pagerDensity === 'full';
  }

  get showPageSizes(): boolean {
    return this.pagerDensity !== 'minimal';
  }

  get previousNextEnabled(): boolean {
    return this.resolved.previousNext !== false;
  }

  get pagerType(): 'numeric' | 'input' {
    return this.resolved.type ?? 'numeric';
  }

  get effectiveButtonCount(): number {
    const base = this.resolved.buttonCount ?? 10;
    return ngbPagerButtonCountForDensity(base, this.pagerDensity, this.responsiveEnabled);
  }

  get resolvedPageSizeOptions(): number[] {
    return ngbResolvePagerPageSizeOptions(this.resolved.pageSizes, this.pageSize);
  }

  get displayInfoLabel(): string {
    if (this.infoLabel != null && this.infoLabel !== '') {
      return this.infoLabel;
    }
    const total = this.collectionSize;
    const start = total ? (this.page - 1) * this.pageSize + 1 : 0;
    const end = Math.min(this.page * this.pageSize, total);
    return ngbFormatPagerRangeLabel(start, end, total, this.rangeLabelTemplate);
  }

  ngAfterViewInit(): void {
    this.observeWidth();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSizeChange.emit(size);
  }

  private observeWidth(): void {
    if (!this.responsiveEnabled || !this.pagerRoot?.nativeElement) {
      this.pagerDensity = 'full';
      return;
    }

    const element = this.pagerRoot.nativeElement;
    const apply = (width: number) => {
      const next = ngbResolvePagerDensity(width);
      if (next !== this.pagerDensity) {
        this.pagerDensity = next;
        this.cdr.markForCheck();
      }
    };

    apply(element.getBoundingClientRect().width);

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? element.getBoundingClientRect().width;
      apply(width);
    });
    this.resizeObserver.observe(element);
  }
}
