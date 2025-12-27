import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  HostListener,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  QueryList,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbSplitterPaneComponent } from './splitter-pane.component';
import { NgbSplitterOrientation } from './splitter.types';

type PaneState = {
  sizePx?: number;
  minPx?: number;
  maxPx?: number;
  id: string;
};

@Component({
  selector: 'ngb-splitter',
  standalone: true,
  imports: [CommonModule, NgbSplitterPaneComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
    :host { display: block; width: 100%; }
    .splitter-container { display: flex; height: 100%; width: 100%; }
    .splitter-container.vertical { flex-direction: column; }
    .splitbar { background: #ccc; width: 5px; position: relative;
    align-items: center;
    justify-content: center; 
    flex: 0 0 auto; z-index: 10;
      &.resizable {
        cursor: col-resize;
      } 
      &:hover {
        filter: brightness(90%); /* Feedback when hovering bar */
      }
    }
    .handle-line {
      /* Thin white line in the middle */
      border-radius: 2px;
      opacity: 0.8;
      left: 45%;
      position: absolute;
      top: 45%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    /* Horizontal Handle: Vertical Line */
    .splitter-container:not(.vertical) .handle-line {
      width: 2px;
      height: 10px; /* Adjust height as needed */
    }
    .pane-wrapper {
      position: relative;
      /* CRITICAL: Allow the pane to shrink beyond its content size */
      min-width: 0; 
      min-height: 0;
      
      /* CRITICAL: Hide content that overflows during small sizes */
      overflow: hidden; 
      
      flex-shrink: 1;
    }
    /* Vertical Handle: Horizontal Line */
    .vertical .handle-line {
      height: 2px;
      width: 10px; /* Adjust width as needed */
    }
    .vertical .splitbar.resizable {
      cursor: row-resize;
    }
    .splitter-container.vertical .splitter-container .splitbar.resizable {
      cursor: col-resize;
    }
    .vertical .splitbar { width: 100%; }
    .collapse-btn { cursor: pointer; background: #666; width: 10px; height: 10px; position: absolute; top: 50%; }
    .collapse-arrow {
      font-size: 0.95rem;
      user-select: none;
      cursor: pointer;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.25rem;
      height: 1.25rem;
      position:absolute;
      top:100%;
    }
    `,
  ],
  template: `
    <div class="splitter-container" [class.vertical]="orientation === 'vertical'"
      [style.min-height]="orientation === 'vertical' ? verticalMinHeight : null"
      [style.height]="orientation === 'vertical' ? verticalMinHeight : null">
      <!-- Iterate through the QueryList of panes -->
      <ng-container *ngFor="let pane of panes; let i = index">
        <div class="pane-wrapper" [style.flex]="getPaneFlex(pane)"
        [style.min-width]="orientation === 'horizontal' ? (pane.min || '0px') : null"
        [style.max-width]="orientation === 'horizontal' ? pane.max : null"
        [style.min-height]="orientation === 'vertical' ? (pane.min || '0px') : null"
        [style.max-height]="orientation === 'vertical' ? pane.max : null"
        >
          <!-- Access the 'template' property we defined in the Pane component -->
          <ng-container [ngTemplateOutlet]="pane.template"></ng-container>
        </div>

        <div *ngIf="i < panes.length - 1" class="splitbar" 
        [class.resizable]="resizable"
        [style.background-color]="barColor"
        [style.width.px]="orientation === 'horizontal' ? handleThickness : '100%'" 
        [style.height.px]="orientation === 'vertical' ? handleThickness : '100%'" 
        role="separator"
        tabindex="0"
        [attr.aria-orientation]="getSeparatorAriaOrientation()"
        [attr.aria-valuenow]="getHandleValueNow(i)"
        [attr.aria-valuemin]="getHandleValueMin(i)"
        [attr.aria-valuemax]="getHandleValueMax(i)"
        (keydown)="onHandleKeyDown($event, i)"
        (mousedown)="onMouseDown($event, i)">
          <div class="handle-line" [style.background-color]="lineColor">
            <span
              *ngIf="pane.collapsible"
              class="collapse-arrow bi"
              [ngClass]="getCollapseIcon(pane)"
              [style.color]="handleIconColor"
              (click)="onHandleToggle($event, i)"
              aria-hidden="true"
            ></span>
          </div>
        </div>
      </ng-container>
    </div>
  `,
})
export class NgbSplitterComponent {
  @ContentChildren(NgbSplitterPaneComponent) panes!: QueryList<NgbSplitterPaneComponent>;
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';
  @Input() handleThickness:number = 12;
  @Input() handleIconColor: string = '#000';
  @Input() verticalMinHeight: string = '280px';

  @Input() resizable: boolean = true; // New Resize Input
  @Input() barColor: string = '#ccc'; // Custom Bar Color
  @Input() lineColor: string = '#000'; // Custom Line Color

  private isDragging = false;
  private currentHandleIndex = -1;

  constructor(private el: ElementRef){

  }

// Listeners for global mouse movement
  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging || !this.resizable) return;
    this.resize(event);
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    this.isDragging = false;
    document.body.style.cursor = 'default';
  }

  onMouseDown(event: MouseEvent, index: number) {
    if (!this.resizable) return;
    event.preventDefault();
    this.isDragging = true;
    this.currentHandleIndex = index;
    document.body.style.cursor = this.orientation === 'horizontal' ? 'col-resize' : 'row-resize';
  }

  private resize(event: MouseEvent) {
    const container = this.el.nativeElement.querySelector('.splitter-container');
    const rect = container.getBoundingClientRect();
    const paneArr = this.panes.toArray();
    const paneWrappers = Array.from(this.el.nativeElement.querySelectorAll('.pane-wrapper')) as HTMLElement[];

    const targetPane = paneArr[this.currentHandleIndex];
    if (!targetPane || !paneWrappers.length) {
      return;
    }

    const isHorizontal = this.orientation === 'horizontal';
    const totalPixels = isHorizontal ? rect.width : rect.height;
    if (totalPixels <= 0) {
      return;
    }

    const mousePos = isHorizontal ? event.clientX - rect.left : event.clientY - rect.top;

    let consumed = 0;
    for (let i = 0; i < this.currentHandleIndex; i++) {
      const prevPaneElement = paneWrappers[i];
      if (!prevPaneElement) {
        continue;
      }
      const prevRect = prevPaneElement.getBoundingClientRect();
      consumed += isHorizontal ? prevRect.width : prevRect.height;
      consumed += this.handleThickness;
    }

    let newSizeValue = ((mousePos - consumed) / totalPixels) * 100;

    const minPercent = this.sizeToPercent(targetPane.min, totalPixels);
    const maxPercent = this.sizeToPercent(targetPane.max, totalPixels);

    if (minPercent !== null) {
      newSizeValue = Math.max(newSizeValue, minPercent);
    }
    if (maxPercent !== null) {
      newSizeValue = Math.min(newSizeValue, maxPercent);
    }

    newSizeValue = Math.max(0, Math.min(100, newSizeValue));
    targetPane.size = `${newSizeValue}%`;
  }

  onHandleToggle(event: Event, index: number) {
    event.stopPropagation();
    event.preventDefault();
    this.togglePane(index);
  }

  getCollapseIcon(pane: NgbSplitterPaneComponent): string {
    if (!pane.collapsible) {
      return '';
    }
    if (this.orientation === 'horizontal') {
      return pane.collapsed ? 'bi-caret-right-fill' : 'bi-caret-left-fill';
    }
    return pane.collapsed ? 'bi-caret-down-fill' : 'bi-caret-up-fill';
  }

  getPaneFlex(pane: NgbSplitterPaneComponent) {
    if (pane.collapsed) {
      return '0 0 0px';
    }
    if (pane.size) {
      return `0 0 ${pane.size}`;
    }
    return '1 1 0px';
  }

  private sizeToPercent(value: string | undefined, totalPixels: number): number | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (trimmed.endsWith('%')) {
      const percent = parseFloat(trimmed);
      return Number.isFinite(percent) ? percent : null;
    }

    const numeric = parseFloat(trimmed);
    if (!Number.isFinite(numeric)) {
      return null;
    }

    if (trimmed.endsWith('px')) {
      return totalPixels > 0 ? (numeric / totalPixels) * 100 : null;
    }

    return numeric;
  }

  togglePane(index: number) {
    const pane = this.panes.toArray()[index];
    pane.collapsed = !pane.collapsed;
    pane.collapsedChange.emit(pane.collapsed);
  }

  getSeparatorAriaOrientation(): 'horizontal' | 'vertical' {
    // For left/right panes, the separator is vertical. For top/bottom panes, it is horizontal.
    return this.orientation === 'horizontal' ? 'vertical' : 'horizontal';
  }

  getHandleValueNow(index: number): number | null {
    const container = this.el.nativeElement.querySelector('.splitter-container');
    const rect = container.getBoundingClientRect();
    const paneWrappers = Array.from(this.el.nativeElement.querySelectorAll('.pane-wrapper')) as HTMLElement[];
    const target = paneWrappers[index];

    const totalPixels = this.orientation === 'horizontal' ? rect.width : rect.height;
    if (!target || totalPixels <= 0) {
      return null;
    }

    const paneRect = target.getBoundingClientRect();
    const panePixels = this.orientation === 'horizontal' ? paneRect.width : paneRect.height;
    return Math.round((panePixels / totalPixels) * 100);
  }

  getHandleValueMin(index: number): number | null {
    const pane = this.panes?.toArray?.()[index];
    const container = this.el.nativeElement.querySelector('.splitter-container');
    const rect = container.getBoundingClientRect();
    const totalPixels = this.orientation === 'horizontal' ? rect.width : rect.height;
    if (!pane || totalPixels <= 0) {
      return null;
    }
    return this.sizeToPercent(pane.min, totalPixels);
  }

  getHandleValueMax(index: number): number | null {
    const pane = this.panes?.toArray?.()[index];
    const container = this.el.nativeElement.querySelector('.splitter-container');
    const rect = container.getBoundingClientRect();
    const totalPixels = this.orientation === 'horizontal' ? rect.width : rect.height;
    if (!pane || totalPixels <= 0) {
      return null;
    }
    return this.sizeToPercent(pane.max, totalPixels);
  }

  onHandleKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Enter') {
      const pane = this.panes.toArray()[index];
      if (pane?.collapsible) {
        event.preventDefault();
        this.togglePane(index);
      }
      return;
    }

    const isHorizontal = this.orientation === 'horizontal';
    const negativeKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
    const positiveKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
    if (event.key !== negativeKey && event.key !== positiveKey) {
      return;
    }

    if (!this.resizable) {
      return;
    }

    event.preventDefault();
    const delta = (event.shiftKey ? 5 : 2) * (event.key === positiveKey ? 1 : -1);
    this.resizeByPercent(index, delta);
  }

  private resizeByPercent(index: number, deltaPercent: number) {
    const container = this.el.nativeElement.querySelector('.splitter-container');
    const rect = container.getBoundingClientRect();
    const paneArr = this.panes.toArray();
    const paneWrappers = Array.from(this.el.nativeElement.querySelectorAll('.pane-wrapper')) as HTMLElement[];

    const targetPane = paneArr[index];
    const targetWrapper = paneWrappers[index];
    if (!targetPane || !targetWrapper) {
      return;
    }

    const totalPixels = this.orientation === 'horizontal' ? rect.width : rect.height;
    if (totalPixels <= 0) {
      return;
    }

    const wrapperRect = targetWrapper.getBoundingClientRect();
    const currentPixels = this.orientation === 'horizontal' ? wrapperRect.width : wrapperRect.height;
    let nextPercent = (currentPixels / totalPixels) * 100 + deltaPercent;

    const minPercent = this.sizeToPercent(targetPane.min, totalPixels);
    const maxPercent = this.sizeToPercent(targetPane.max, totalPixels);
    if (minPercent !== null) {
      nextPercent = Math.max(nextPercent, minPercent);
    }
    if (maxPercent !== null) {
      nextPercent = Math.min(nextPercent, maxPercent);
    }

    nextPercent = Math.max(0, Math.min(100, nextPercent));
    targetPane.size = `${nextPercent}%`;
  }
}
