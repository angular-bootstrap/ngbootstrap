import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'ngb-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (totalPages >= 1) {
      <nav
        class="ngb-pagination"
        [class.ngb-pagination--responsive]="responsive"
        aria-label="Pagination"
      >
      @if (pagerType === 'input') {
        <div class="ngb-pagination__input-group">
          @if (previousNext) {
            <button
              class="btn btn-sm btn-outline-secondary"
              type="button"
              [disabled]="page === 1"
              (click)="go(page - 1)"
              aria-label="Previous page"
            >
              ‹
            </button>
          }
          <label class="ngb-pagination__input-label">
            <span class="visually-hidden">Page</span>
            <input
              class="form-control form-control-sm ngb-pagination__page-input"
              type="number"
              [min]="1"
              [max]="totalPages"
              [ngModel]="page"
              (ngModelChange)="go($event)"
              aria-label="Current page"
            />
          </label>
          <span class="ngb-pagination__input-total" aria-hidden="true">/ {{ totalPages }}</span>
          @if (previousNext) {
            <button
              class="btn btn-sm btn-outline-secondary"
              type="button"
              [disabled]="page === totalPages"
              (click)="go(page + 1)"
              aria-label="Next page"
            >
              ›
            </button>
          }
        </div>
      } @else {
        <ul class="pagination pagination-sm justify-content-center mb-0">
          @if (previousNext) {
            <li class="page-item" [class.disabled]="page === 1">
              <button
                class="page-link"
                type="button"
                (click)="go(page - 1)"
                aria-label="Previous page"
              >
                <span aria-hidden="true">«</span>
              </button>
            </li>
          }

          @for (p of pages; track p) {
            <li
              class="page-item"
              [class.active]="p === page"
              [class.disabled]="p === '…'"
            >
              @if (p === '…') {
                <span class="page-link" aria-hidden="true">…</span>
              } @else {
                <button
                  class="page-link"
                  type="button"
                  (click)="go(p)"
                  [attr.aria-current]="p === page ? 'page' : null"
                >
                  {{ p }}
                </button>
              }
            </li>
          }

          @if (previousNext) {
            <li class="page-item" [class.disabled]="page === totalPages">
              <button
                class="page-link"
                type="button"
                (click)="go(page + 1)"
                aria-label="Next page"
              >
                <span aria-hidden="true">»</span>
              </button>
            </li>
          }
        </ul>
      }
      </nav>
    }
  `,
  styles: [`
    .ngb-pagination--responsive .pagination {
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.15rem;
    }

    .ngb-pagination .page-link,
    .ngb-pagination .btn {
      border-color: var(--dg-pager-control-border, var(--bs-border-color));
      background-color: var(--dg-pager-control-bg, var(--bs-body-bg));
      color: var(--dg-pager-link-text, var(--dg-primary, var(--bs-primary)));
    }

    .ngb-pagination .page-link:hover,
    .ngb-pagination .btn:hover {
      border-color: var(--dg-border-strong, var(--bs-border-color));
      background-color: var(--dg-pager-control-hover-bg, var(--bs-tertiary-bg));
      color: var(--dg-primary-hover, var(--bs-link-hover-color));
    }

    .ngb-pagination .page-item.active .page-link {
      border-color: var(--dg-pager-active-border, var(--dg-primary, var(--bs-primary)));
      background-color: var(--dg-pager-active-bg, var(--dg-primary, var(--bs-primary)));
      color: var(--dg-pager-active-text, var(--dg-on-primary, #fff));
    }

    .ngb-pagination .page-item.disabled .page-link,
    .ngb-pagination .btn:disabled {
      border-color: var(--dg-pager-control-border, var(--bs-border-color));
      background-color: var(--dg-pager-control-bg, var(--bs-body-bg));
      color: var(--dg-text-subtle, var(--bs-secondary-color));
      opacity: 0.55;
    }

    .ngb-pagination__input-group {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .ngb-pagination__page-input {
      width: 4.25rem;
      text-align: center;
      border-color: var(--dg-pager-control-border, var(--bs-border-color));
      background-color: var(--dg-pager-control-bg, var(--bs-body-bg));
      color: var(--dg-text, var(--bs-body-color));
    }

    .ngb-pagination__input-label {
      margin: 0;
    }

    .ngb-pagination__input-total {
      font-size: 0.875rem;
      color: var(--dg-pager-text, var(--bs-secondary-color));
      white-space: nowrap;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgbPaginationComponent {
  @Input() page = 1;
  @Input() pageSize = 10;
  @Input() collectionSize = 0;
  /** @deprecated Use `buttonCount`. Kept for compatibility. */
  @Input() maxSize = 5;
  @Input() buttonCount?: number;
  @Input() previousNext = true;
  @Input() pagerType: 'numeric' | 'input' = 'numeric';
  @Input() responsive = true;
  @Output() pageChange = new EventEmitter<number>();

  get effectiveButtonCount(): number {
    const count = this.buttonCount ?? this.maxSize;
    return Math.max(3, count | 0);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.collectionSize / Math.max(1, this.pageSize)));
  }

  get pages(): Array<number | '…'> {
    const total = this.totalPages;
    const max = this.effectiveButtonCount;
    if (total <= max) return Array.from({ length: total }, (_, i) => i + 1);

    const half = Math.floor(max / 2);
    let start = Math.max(1, this.page - half);
    let end = start + max - 1;
    if (end > total) {
      end = total;
      start = end - max + 1;
    }

    const nums = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    const head = start > 1 ? [1, start > 2 ? ('…' as const) : 2] : [];
    const tail = end < total ? [end < total - 1 ? ('…' as const) : total - 1, total] : [];
    return [...head, ...nums, ...tail];
  }

  go(p: number | string): void {
    const next = typeof p === 'string' ? Number(p) : p;
    if (!Number.isFinite(next)) return;
    const page = Math.trunc(next);
    if (page < 1 || page > this.totalPages || page === this.page) return;
    this.pageChange.emit(page);
  }
}
