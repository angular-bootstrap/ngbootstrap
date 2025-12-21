import {
  AfterContentInit,
  Component,
  ContentChildren,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnChanges,
  QueryList,
  ViewChild,
  ChangeDetectionStrategy,
  SimpleChanges,
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
  template: `
    <div
      #container
      class="d-flex"
      [class.flex-row]="orientation === 'horizontal'"
      [class.flex-column]="orientation === 'vertical'"
      role="group"
    >
      <ng-container *ngFor="let pane of panes.toArray(); let i = index">
        <div
          class="d-flex flex-column overflow-auto"
          [attr.data-pane-id]="paneStates[i]?.id"
          [class.d-none]="pane.collapsed"
          [style.flex-basis.px]="paneStates[i]?.sizePx"
          [style.min-width.px]="orientation === 'horizontal' ? paneStates[i]?.minPx : undefined"
          [style.max-width.px]="orientation === 'horizontal' ? paneStates[i]?.maxPx : undefined"
          [style.min-height.px]="orientation === 'vertical' ? paneStates[i]?.minPx : undefined"
          [style.max-height.px]="orientation === 'vertical' ? paneStates[i]?.maxPx : undefined"
        >
          <ng-container *ngTemplateOutlet="pane.templateRef"></ng-container>
        </div>

        <button
          *ngIf="i < panes.length - 1"
          type="button"
          class="bg-transparent border-0 p-0 d-flex align-items-center justify-content-center"
          [style.width.px]="orientation === 'horizontal' ? handleThickness : undefined"
          [style.height.px]="orientation === 'vertical' ? handleThickness : undefined"
          [class.w-100]="orientation === 'vertical'"
          [class.h-100]="orientation === 'horizontal'"
          role="separator"
          [attr.aria-orientation]="orientation"
          [attr.aria-controls]="paneStates[i]?.id + ' ' + paneStates[i + 1]?.id"
          tabindex="0"
          (mousedown)="startResize(i, $event)"
          (keydown)="onHandleKeydown(i, $event)"
          (dblclick)="toggleFromHandle(i)"
          aria-label="Splitter resize handle"
        >
          <span class="border bg-light" [style.width.px]="orientation === 'horizontal' ? 2 : handleThickness" [style.height.px]="orientation === 'vertical' ? 2 : handleThickness"></span>
        </button>
      </ng-container>
    </div>
  `,
})
export class NgbSplitterComponent implements AfterContentInit, OnDestroy, OnChanges {
  @ContentChildren(NgbSplitterPaneComponent) panes!: QueryList<NgbSplitterPaneComponent>;
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLElement>;

  @Input() orientation: NgbSplitterOrientation = 'horizontal';
  @Input() handleThickness = 12;

  paneStates: PaneState[] = [];
  private resizeSub?: { move: any; up: any };
  private currentDrag?: {
    index: number;
    startPos: number;
    startSizes: [number, number];
  };

  ngAfterContentInit(): void {
    this.initStates();
    this.panes.changes.subscribe(() => this.initStates());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['orientation'] && !changes['orientation'].firstChange) {
      this.initStates();
    }
  }

  ngOnDestroy(): void {
    this.detachDragListeners();
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.initStates();
  }

  startResize(index: number, event: MouseEvent) {
    event.preventDefault();
    const total = this.getContainerSize();
    const sizes = this.computePaneSizes(total);
    this.currentDrag = {
      index,
      startPos: this.pointerPosition(event),
      startSizes: [sizes[index], sizes[index + 1]],
    };
    const move = (e: MouseEvent) => this.onDrag(e);
    const up = () => this.stopDrag();
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up, { once: true });
    this.resizeSub = { move, up };
  }

  onHandleKeydown(index: number, event: KeyboardEvent) {
    const isHorizontal = this.orientation === 'horizontal';
    const delta = this.handleThickness;
    if (
      (isHorizontal && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) ||
      (!isHorizontal && (event.key === 'ArrowUp' || event.key === 'ArrowDown'))
    ) {
      event.preventDefault();
      const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
      this.adjustPaneSizes(index, delta * direction);
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleFromHandle(index);
    }
  }

  toggleFromHandle(index: number) {
    const panesArray = this.panes.toArray();
    const target = panesArray[index].collapsible ? panesArray[index] : panesArray[index + 1];
    if (target?.collapsible) {
      target.toggleCollapsed();
      this.initStates();
    }
  }

  private onDrag(event: MouseEvent) {
    if (!this.currentDrag) {
      return;
    }
    event.preventDefault();
    const delta = this.pointerPosition(event) - this.currentDrag.startPos;
    this.adjustPaneSizes(this.currentDrag.index, delta, this.currentDrag.startSizes);
  }

  private stopDrag() {
    this.detachDragListeners();
    this.currentDrag = undefined;
  }

  private adjustPaneSizes(index: number, delta: number, startSizes?: [number, number]) {
    const total = this.getContainerSize();
    const sizes = startSizes ?? this.computePaneSizes(total);
    const panesArray = this.panes.toArray();
    const first = panesArray[index];
    const second = panesArray[index + 1];

    if (first.collapsed || second.collapsed) {
      return;
    }

    let firstSize = sizes[0] + delta;
    let secondSize = sizes[1] - delta;

    const firstLimits = this.getLimits(first, total);
    const secondLimits = this.getLimits(second, total);

    firstSize = this.clamp(firstSize, firstLimits.minPx, firstLimits.maxPx);
    secondSize = this.clamp(secondSize, secondLimits.minPx, secondLimits.maxPx);

    if (firstSize + secondSize > 0) {
      this.paneStates[index].sizePx = firstSize;
      this.paneStates[index + 1].sizePx = secondSize;
    }
  }

  private initStates() {
    const total = this.getContainerSize();
    const sizes = this.computePaneSizes(total);
    const panesArray = this.panes.toArray();

    this.paneStates = panesArray.map((pane, idx) => {
      const limits = this.getLimits(pane, total);
      return {
        id: `ngb-splitter-pane-${idx}`,
        sizePx: pane.collapsed ? 0 : sizes[idx],
        minPx: limits.minPx,
        maxPx: limits.maxPx,
      };
    });
  }

  private computePaneSizes(total: number): number[] {
    const panesArray = this.panes?.toArray() ?? [];
    if (!panesArray.length) return [];

    const resolved: Array<number | undefined> = panesArray.map((pane) =>
      pane.collapsed ? 0 : this.resolveSize(pane.size, total)
    );
    const specifiedTotal = resolved.reduce((sum, val) => sum + (val ?? 0), 0);
    const unspecified = resolved.filter((v) => v == null).length;
    const remaining = Math.max(total - specifiedTotal, 0);
    const autoSize = unspecified > 0 ? remaining / unspecified : 0;

    return resolved.map((val) => {
      if (val != null) {
        return val;
      }
      if (autoSize) {
        return autoSize;
      }
      return total / panesArray.length;
    });
  }

  private resolveSize(value: string | undefined, total: number): number | undefined {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (trimmed.endsWith('%')) {
      const pct = Number.parseFloat(trimmed.slice(0, -1));
      return (pct / 100) * total;
    }
    if (trimmed.endsWith('px')) {
      return Number.parseFloat(trimmed.replace('px', ''));
    }
    const asNumber = Number.parseFloat(trimmed);
    return Number.isFinite(asNumber) ? asNumber : undefined;
  }

  private getLimits(pane: NgbSplitterPaneComponent, total: number) {
    return {
      minPx: pane.collapsed ? 0 : this.resolveSize(pane.min, total),
      maxPx: pane.collapsed ? 0 : this.resolveSize(pane.max, total),
    };
  }

  private clamp(value: number, min?: number, max?: number) {
    let next = value;
    if (min != null) next = Math.max(min, next);
    if (max != null) next = Math.min(max, next);
    return next;
  }

  private pointerPosition(event: MouseEvent) {
    return this.orientation === 'horizontal' ? event.clientX : event.clientY;
  }

  private getContainerSize() {
    const rect = this.container?.nativeElement.getBoundingClientRect();
    return rect && this.orientation === 'horizontal' ? rect.width : rect?.height || 0;
  }

  private detachDragListeners() {
    if (this.resizeSub) {
      document.removeEventListener('mousemove', this.resizeSub.move);
      document.removeEventListener('mouseup', this.resizeSub.up);
      this.resizeSub = undefined;
    }
  }
}
