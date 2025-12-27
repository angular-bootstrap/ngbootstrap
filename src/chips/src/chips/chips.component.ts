import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export type NgbChip = {
  id: string | number;
  label: string;
  disabled?: boolean;
};

@Component({
  selector: 'ngb-chips',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
      }

      .ngb-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        align-items: center;
      }

      .ngb-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        max-width: 100%;
      }

      .ngb-chip-label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .ngb-chip-remove {
        border: 0;
        background: transparent;
        padding: 0;
        line-height: 1;
        cursor: pointer;
        font-size: 1rem;
        opacity: 0.85;
      }

      .ngb-chip-remove:disabled {
        cursor: default;
        opacity: 0.4;
      }
    `,
  ],
  template: `
    <div class="ngb-chips" [attr.aria-label]="ariaLabel">
      <span
        *ngFor="let item of items; trackBy: trackById"
        class="badge rounded-pill bg-secondary ngb-chip"
        [class.opacity-50]="!!item.disabled"
      >
        <span class="ngb-chip-label">{{ item.label }}</span>
        <button
          *ngIf="removable"
          type="button"
          class="ngb-chip-remove"
          [disabled]="!!item.disabled"
          (click)="remove.emit(item)"
          [attr.aria-label]="removeLabel || 'Remove'"
        >
          &times;
        </button>
      </span>
    </div>
  `,
})
export class NgbChipsComponent {
  @Input() items: NgbChip[] = [];
  @Input() removable = true;
  @Input() ariaLabel?: string;
  @Input() removeLabel?: string;

  @Output() remove = new EventEmitter<NgbChip>();

  trackById = (_: number, item: NgbChip) => item.id;
}

