import {
  Directive, ElementRef, EventEmitter, HostBinding, HostListener, Input, Output, inject, Optional
} from '@angular/core';
import { NgbDndState } from '../service/drag-state.service';
import { NgbDndDropEvent, NgbDndListDirective } from './dnd-list.directive';

interface DndKeyboardDragState<T> {
  list: T[];
  originalIndex: number;
  currentIndex: number;
}

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
  /** index inside its parent list (bind to the rendered row index) */
  @Input() dndIndex?: number;
  /** Explicit source list for recursive templates where DI can be ambiguous. */
  @Input() dndSourceList?: T[];
  @Input() dndDisabled = false;

  @Output() dndDragStart = new EventEmitter<T>();
  @Output() dndDragEnd = new EventEmitter<void>();

  @HostBinding('attr.draggable') get draggable() { return !this.dndDisabled; }
  @HostBinding('class.ngb-dnd-item') hostClass = true;
  @HostBinding('class.ngb-dnd-dragging') dragging = false;
  @HostBinding('attr.aria-grabbed') get ariaGrabbed() { return this.dragging ? 'true' : 'false'; }
  @HostBinding('attr.role') role = 'listitem';
  @HostBinding('attr.tabindex') tabIndex = 0;                 // keyboard focusable

  private sessionId: string | null = null;
  private keyboardDragState: DndKeyboardDragState<T> | null = null;

  private sourceList(): T[] | undefined {
    return this.dndSourceList ?? this.parentList?.list;
  }

  private resolveIndex(list: T[] | undefined): number {
    if (typeof this.dndIndex === 'number') return this.dndIndex;
    return list ? list.indexOf(this.item) : -1;
  }

  private beginDragSession(dataTransfer?: DataTransfer | null): boolean {
    if (this.dndDisabled || this.item == null) {
      return false;
    }

    this.sessionId = this.state.createSession({
      item: this.item,
      group: this.dndGroup ?? this.parentList?.dndGroup,
      fromList: this.sourceList(),
      fromIndex: this.resolveIndex(this.sourceList()),
      fromListRef: this.parentList,
      fromIsPalette: this.parentList?.dndIsPalette === true
    });

    if (dataTransfer) {
      dataTransfer.setData('text/ngb-dnd', this.sessionId);
      dataTransfer.setData('text/plain', 'ngb');
      dataTransfer.effectAllowed = 'copyMove';
      dataTransfer.setDragImage(this.el.nativeElement, 16, 16);
    }

    this.dragging = true;
    this.dndDragStart.emit(this.item);
    this.state.announce?.(this.state.i18n.pickedUp());
    return true;
  }

  private endDragSession(): void {
    this.dragging = false;
    this.state.clear(this.sessionId);
    this.sessionId = null;
    this.keyboardDragState = null;
    this.dndDragEnd.emit();
  }

  @HostListener('dragstart', ['$event'])
  onDragStart(ev: DragEvent) {
    const eventWithFlag = ev as DragEvent & { __ngbDndItemStarted?: boolean };
    if (eventWithFlag.__ngbDndItemStarted) return;
    eventWithFlag.__ngbDndItemStarted = true;

    if (!this.beginDragSession(ev.dataTransfer)) {
      ev.preventDefault();
    }
  }

  @HostListener('dragend')
  onDragEnd() {
    this.endDragSession();
  }

  private moveWithinKeyboardList(offset: -1 | 1): void {
    const keyboardDragState = this.keyboardDragState;
    if (!keyboardDragState) return;

    const list = keyboardDragState.list;
    const from = keyboardDragState.currentIndex;
    let to = from + offset;
    to = Math.max(0, Math.min(list.length - 1, to));
    if (to === from) return;

    const [movedItem] = list.splice(from, 1);
    list.splice(to, 0, movedItem);
    keyboardDragState.currentIndex = to;
    this.dndIndex = to;
    this.state.announce?.(this.state.i18n.moveToIndex(to + 1, list.length));
  }

  private emitKeyboardDrop(): void {
    const keyboardDragState = this.keyboardDragState;
    if (!keyboardDragState || !this.parentList) return;

    const event: NgbDndDropEvent<T> = {
      item: this.item,
      fromIndex: keyboardDragState.originalIndex,
      toIndex: keyboardDragState.currentIndex,
      fromList: keyboardDragState.list,
      toList: keyboardDragState.list,
      sameList: true,
    };

    this.parentList.emitDropEvent(event);
  }

  private cancelKeyboardDrag(): void {
    const keyboardDragState = this.keyboardDragState;
    if (!keyboardDragState) return;

    if (keyboardDragState.currentIndex !== keyboardDragState.originalIndex) {
      const [movedItem] = keyboardDragState.list.splice(keyboardDragState.currentIndex, 1);
      keyboardDragState.list.splice(keyboardDragState.originalIndex, 0, movedItem);
      this.dndIndex = keyboardDragState.originalIndex;
    }

    this.state.announce?.(this.state.i18n.canceled?.() ?? 'Canceled.');
  }

  @HostListener('keydown', ['$event'])
  onKeydown(ev: KeyboardEvent) {
    if (this.dndDisabled) return;

    // start dragging (keyboard mode)
    if (ev.code === 'Space' && !this.dragging) {
      ev.preventDefault();
      const list = this.sourceList();
      const index = this.resolveIndex(list);
      if (!list || index < 0) return;
      this.keyboardDragState = {
        list,
        originalIndex: index,
        currentIndex: index,
      };
      this.beginDragSession();
      return;
    }

    if (!this.dragging) return;

    if (ev.code === 'ArrowUp' || ev.code === 'ArrowDown') {
      ev.preventDefault();
      this.moveWithinKeyboardList(ev.code === 'ArrowUp' ? -1 : 1);
      return;
    }

    if (ev.code === 'Enter') {
      ev.preventDefault();
      this.emitKeyboardDrop();
      this.endDragSession();
      return;
    }

    if (ev.code === 'Escape') {
      ev.preventDefault();
      this.cancelKeyboardDrag();
      this.endDragSession();
    }
  }
}
