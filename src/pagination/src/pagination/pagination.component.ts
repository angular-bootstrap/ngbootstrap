import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'ngb-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav *ngIf="totalPages >= 1" aria-label="Pagination">
      <ul class="pagination pagination-sm justify-content-center mb-0">
        <li class="page-item" [class.disabled]="page === 1">
          <button class="page-link" type="button" (click)="go(page - 1)" aria-label="Previous"> <span aria-hidden="true">«</span> </button>
        </li>

        <li class="page-item" *ngFor="let p of pages" [class.active]="p === page" [class.disabled]="p === '…'">
          <span *ngIf="p === '…'" class="page-link">…</span>
          <button *ngIf="p !== '…'" class="page-link" type="button" (click)="go(p)">{{ p }}</button>
        </li>

        <li class="page-item" [class.disabled]="page === totalPages">
          <button class="page-link" type="button" (click)="go(page + 1)" aria-label="Next"> <span aria-hidden="true">»</span> </button>
        </li>
      </ul>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgbPaginationComponent {
  @Input() page = 1;
  @Input() pageSize = 10;
  @Input() collectionSize = 0;
  @Input() maxSize = 5;
  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.collectionSize / Math.max(1, this.pageSize)));
  }

  get pages(): Array<number | '…'> {
    const total = this.totalPages;
    const max = Math.max(3, this.maxSize | 0);
    if (total <= max) return Array.from({ length: total }, (_, i) => i + 1);

    const half = Math.floor(max / 2);
    let start = Math.max(1, this.page - half);
    let end = start + max - 1;
    if (end > total) { end = total; start = end - max + 1; }

    const nums = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    const head = start > 1 ? [1, start > 2 ? '…' as const : 2] : [];
    const tail = end < total ? [end < total - 1 ? '…' as const : total - 1, total] : [];
    return [...head, ...nums, ...tail];
  }

  go(p: number) {
    if (p < 1 || p > this.totalPages || p === this.page) return;
    this.pageChange.emit(p);
  }
}
