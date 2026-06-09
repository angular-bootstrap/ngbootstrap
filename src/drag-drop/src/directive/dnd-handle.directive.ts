import { Directive, HostBinding, HostListener, Optional, SkipSelf } from '@angular/core';
import { NgbDndItemDirective } from './dnd-item.directive';

@Directive({
  selector: '[ngbDndHandle]',
  standalone: true
})
export class NgbDndHandleDirective {
  constructor(@Optional() @SkipSelf() private item?: NgbDndItemDirective) {}

  @HostBinding('attr.draggable') draggable = 'true';
  @HostBinding('class.ngb-dnd-handle') hostClass = true;

  @HostListener('dragstart', ['$event'])
  onDragStart(ev: DragEvent): void {
    this.item?.onDragStart(ev);
  }

  @HostListener('dragend')
  onDragEnd(): void {
    this.item?.onDragEnd();
  }
}
