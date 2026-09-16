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
        font-family: var(--ngb-font-family, inherit);
        color: var(--ngb-on-surface, inherit);
        display: block;
      }

      .ngb-chips {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ngb-space-1, 0.35rem);
        align-items: center;
      }

      .ngb-chip {
        background-color: var(--ngb-selected-bg, var(--bs-secondary, #6c757d));
        color: var(--ngb-on-surface, #fff);
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        max-width: 100%;
      }

      .ngb-chip-disabled { opacity: var(--ngb-disabled-opacity, 0.5); }
      .ngb-chip-label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .ngb-chip-remove {
        border: 0;
        background: transparent;
        color: inherit;
        padding: 0;
        line-height: 1;
        cursor: pointer;
        font-size: 1rem;
        opacity: 0.85;
      }

      .ngb-chip-remove:focus-visible { outline: 2px solid var(--ngb-focus-ring, #86b7fe); outline-offset: 2px; }

      .ngb-chip-remove:disabled {
        cursor: default;
        opacity: var(--ngb-disabled-opacity, 0.4);
      }
    `,
  ],
  template: `
    <div class="ngb-chips" [attr.aria-label]="ariaLabel">
      @for (item of items; track trackById($index, item)) {
        <span class="badge rounded-pill ngb-chip" [class.ngb-chip-disabled]="!!item.disabled">
          <span class="ngb-chip-label">{{ item.label }}</span>
          @if (removable) {
            <button
              type="button"
              class="ngb-chip-remove"
              [disabled]="!!item.disabled"
              (click)="remove.emit(item)"
              [attr.aria-label]="removeLabel || 'Remove'"
            >
              &times;
            </button>
          }
        </span>
      }
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
