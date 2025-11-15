import {
  Directive, ElementRef, EventEmitter, HostBinding, HostListener, Input, Output, inject, Optional
} from '@angular/core';
import { NgbDndState } from '../service/drag-state.service';
import { NgbDndListDirective } from './dnd-list.directive';

@Directive({
  selector: '[ngbDndItem]',
  standalone: true
})
export class NgbDndItemDirective<T = unknown> {
  private el = inject(ElementRef<HTMLElement>);
  private state = inject(NgbDndState);
  constructor(@Optional() private parentList?: NgbDndListDirective<T>) {}

  /** required: the value carried by this row/panel */
  @Input('ngbDndItem') item!: T;
  /** optional: constrain cross-list drops */
  @Input() dndGroup?: string;
  /** index inside its parent list (bind to *ngFor index) */
  @Input() dndIndex?: number;
  @Input() dndDisabled = false;

  @Output() dndDragStart = new EventEmitter<T>();
  @Output() dndDragEnd = new EventEmitter<void>();

  @HostBinding('attr.draggable') get draggable() { return !this.dndDisabled; }
  @HostBinding('class.ngb-dnd-dragging') dragging = false;
  @HostBinding('attr.aria-grabbed') get ariaGrabbed() { return this.dragging ? 'true' : 'false'; }
  @HostBinding('attr.role') role = 'listitem';
  @HostBinding('attr.tabindex') tabIndex = 0;                 // keyboard focusable

  private sessionId: string | null = null;

  @HostListener('dragstart', ['$event'])
    onDragStart(ev: DragEvent) {
    if (this.dndDisabled || this.item == null) { ev.preventDefault(); return; }

    this.sessionId = this.state.createSession({
        item: this.item,
        group: this.dndGroup ?? this.parentList?.dndGroup,
        fromList: this.parentList?.list,
        fromIndex: this.dndIndex,
        fromIsPalette: this.parentList?.dndIsPalette === true

    });

    // ✅ set both a custom and a plain text payload; keep plain text non-empty
    ev.dataTransfer?.setData('text/ngb-dnd', this.sessionId);
    ev.dataTransfer?.setData('text/plain', 'ngb'); // some browsers require non-empty
    if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'copyMove';

    ev.dataTransfer?.setDragImage(this.el.nativeElement, 16, 16);

    this.dragging = true;
    this.dndDragStart.emit(this.item);
    }

  @HostListener('dragend')
  onDragEnd() {
    this.dragging = false;
    this.state.clear(this.sessionId);
    this.sessionId = null;
    this.dndDragEnd.emit();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(ev: KeyboardEvent) {
    if (this.dndDisabled) return;

    // start dragging (keyboard mode)
    if (ev.code === 'Space' && !this.dragging) {
      ev.preventDefault();
      this.onDragStart(new DragEvent('dragstart')); // reuse logic
      return;
    }

    if (!this.dragging) return;

    // move within same list
    const parent = this.parentList;
    if (!parent || typeof this.dndIndex !== 'number') return;

    if (ev.code === 'ArrowUp' || ev.code === 'ArrowDown') {
      ev.preventDefault();
      const list = parent.list;
      const from = this.dndIndex!;
      let to = ev.code === 'ArrowUp' ? from - 1 : from + 1;
      to = Math.max(0, Math.min(list.length - 1, to));
      if (to !== from) {
        const [it] = list.splice(from, 1);
        list.splice(to, 0, it);
        this.dndIndex = to;
        // announce (see live region below)
        this.state.announce?.(this.state.i18n.moveToIndex(to + 1, list.length));
      }
    }

    if (ev.code === 'Enter') { ev.preventDefault(); this.onDragEnd(); }   // drop
    if (ev.code === 'Escape') { ev.preventDefault(); this.onDragEnd(); }  // cancel
  }


}
