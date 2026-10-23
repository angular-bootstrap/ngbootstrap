import { afterNextRender, Injector, ChangeDetectionStrategy, Component, ElementRef, HostListener, Input, ViewChild, inject } from '@angular/core';
import type { Datagrid } from '../datagrid.component';

/** Internal field picker and grouping-order disclosure used by the grid toolbar and chips. */
@Component({
  selector: 'ngb-datagrid-group-control',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="ngb-group-control" (keydown)="onKeydown($event)" (focusout)="onFocusOut($event)">
      <button #trigger type="button" class="ngb-group-control__trigger"
        [class.ngb-group-control__picker]="!field"
        [attr.aria-label]="field ? 'Actions for ' + grid.groupColumnHeader(field) + ' grouping' : 'Group rows'"
        [attr.aria-expanded]="open" (click)="toggle()">
        <span [class]="field ? 'bi bi-three-dots-vertical' : 'bi bi-collection'" aria-hidden="true"></span>
        @if (!field) { <span>Group</span> }
      </button>
      @if (open) {
        <div class="ngb-group-control__popup" role="group" [attr.aria-label]="field ? 'Grouping order' : 'Group by field'">
          @if (field) {
            <button type="button" [disabled]="position() <= 0" (click)="move('previous')">
              <span aria-hidden="true">‹</span> Move as previous
            </button>
            <button type="button" [disabled]="position() < 0 || position() >= grid.group.length - 1" (click)="move('next')">
              <span aria-hidden="true">›</span> Move as next
            </button>
          } @else {
            @for (column of grid.resolvedColumns; track column.field) {
              @if (grid.isColumnGroupable(column)) {
                <button type="button" [attr.aria-pressed]="grid.isFieldGrouped(column.field)"
                  [attr.aria-label]="(grid.isFieldGrouped(column.field) ? 'Remove ' : 'Add ') + grid.groupColumnHeader(column.field) + ' grouping'"
                  (click)="grid.toggleGroupField(column.field)">
                  <span aria-hidden="true">{{ grid.isFieldGrouped(column.field) ? '−' : '+' }}</span>
                  {{ grid.groupColumnHeader(column.field) }}
                </button>
              }
            }
          }
        </div>
      }
    </div>
  `,
})
export class NgbDatagridGroupControlComponent<T> {
  @Input({ required: true }) grid!: Datagrid<T>;
  @Input() field = '';
  @ViewChild('trigger') trigger?: ElementRef<HTMLButtonElement>;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  open = false;

  toggle(): void {
    this.open = !this.open;
    if (!this.open) return;
    afterNextRender(() => {
      const popup = this.host.nativeElement.querySelector<HTMLElement>('.ngb-group-control__popup');
      const viewport = this.host.nativeElement.ownerDocument.defaultView;
      if (!popup || !viewport) return;
      const rect = popup.getBoundingClientRect();
      const shift = Math.max(8 - rect.left, Math.min(0, viewport.innerWidth - 8 - rect.right));
      popup.style.transform = `translateX(${shift}px)`;
    }, { injector: this.injector });
  }

  @HostListener('window:resize')
  onResize(): void { this.close(); }

  position(): number { return this.grid.group.findIndex(group => group.field === this.field); }

  move(direction: 'previous' | 'next'): void {
    this.grid.moveGroupField(this.field, direction);
    this.close();
    afterNextRender(() => this.trigger?.nativeElement.focus(), { injector: this.injector });
  }

  private close(restore = false): void {
    this.open = false;
    if (restore) this.trigger?.nativeElement.focus();
  }

  @HostListener('document:click', ['$event'])
  outsideClick(event: Event): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  onFocusOut(event: FocusEvent): void {
    if (event.relatedTarget && !this.host.nativeElement.contains(event.relatedTarget as Node)) this.close();
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close(true);
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const buttons = [...this.host.nativeElement.querySelectorAll<HTMLButtonElement>('.ngb-group-control__popup button:not(:disabled)')];
    if (!buttons.length) return;
    event.preventDefault();
    event.stopPropagation();
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
      : event.key === 'ArrowDown' ? (current + 1) % buttons.length
      : (current <= 0 ? buttons.length : current) - 1;
    buttons[index].focus();
  }
}
