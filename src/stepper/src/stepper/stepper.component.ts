import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ContentChildren,
  EventEmitter,
  Input,
  Output,
  QueryList,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgbStepperContentPosition,
  NgbStepperLabelPosition,
  NgbStepperOrientation,
  NgbStepperState,
  NgbStepperStep,
  NgbStepperTheme,
} from './stepper.types';
import { NgbStepLabelDirective } from './step-label.directive';

export interface NgbStepperSelectionChangeEvent {
  previousIndex: number;
  currentIndex: number;
  step: NgbStepperStep | undefined;
}

@Component({
  selector: 'ngb-stepper',
  standalone: true,
  imports: [CommonModule, NgbStepLabelDirective],
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgbStepperComponent implements AfterContentInit {
  /** Steps definition */
  @Input() steps: NgbStepperStep[] = [];

  /** Orientation of the stepper */
  @Input() orientation: NgbStepperOrientation = 'horizontal';

  /** Position of labels around the indicator */
  @Input() labelPosition: NgbStepperLabelPosition = 'right';

  /** Position of content relative to header (horizontal only) */
  @Input() contentPosition: NgbStepperContentPosition = 'bottom';

  /** Allow navigating back to previous steps by clicking header */
  @Input() allowRevisit = true;

  /** Enable lazy loading of step content (default true) */
  @Input() lazy = true;

  /** Theme keyword (only CSS classes, no external deps) */
  @Input() theme: NgbStepperTheme = 'bootstrap';

  /** Whether to apply responsive helper class */
  @Input() responsive = true;

  /** Disable transition / animation helpers */
  @Input() disableAnimation = false;

  /** Animation duration (ms) for step transitions when enabled */
  @Input() animationDuration = 150;

  /** Label strings (for i18n) */
  @Input() nextLabel = 'Next';
  @Input() previousLabel = 'Previous';
  @Input() resetLabel = 'Reset';
  @Input() cancelLabel = 'Cancel';
  @Input() optionalLabel = 'Optional';

  /** Custom mapping from state -> icon text */
  @Input() stateIcons: Record<string, string> = {
    number: '#',
    done: '✓',
    active: '•',
    error: '!',
    disabled: '×',
  };

  /** Current selected index */
  @Input() selectedIndex = 0;

  /** Emits when selectedIndex changes (programmatically or by user) */
  @Output() selectedIndexChange = new EventEmitter<number>();

  /** Emits when selection changes with rich event */
  @Output() selectionChange = new EventEmitter<NgbStepperSelectionChangeEvent>();

  /** Navigation events */
  @Output() nextClicked = new EventEmitter<number>();
  @Output() prevClicked = new EventEmitter<number>();
  @Output() resetClicked = new EventEmitter<void>();
  @Output() cancelClicked = new EventEmitter<void>();

  /** Custom label template (applied for all steps) */
  @ContentChild(NgbStepLabelDirective) stepLabelTplDir?: NgbStepLabelDirective;

  /** Custom icon template for step indicator */
  @ContentChild('ngbStepperIcon', { read: TemplateRef }) customIconTpl?: TemplateRef<any>;

  /** Content template; user will typically use <ng-template #stepContent ...> */
  @ContentChild('stepContent', { read: TemplateRef }) stepContentTpl?: TemplateRef<any>;

  /** Track which steps have been visited */
  private visited = new Set<number>();

  /** Used when allowRevisit=false to block earlier steps */
  visitedFrom = 0;

  ngAfterContentInit(): void {
    if (this.selectedIndex < 0) this.selectedIndex = 0;
    if (this.selectedIndex > this.steps.length - 1 && this.steps.length > 0) {
      this.selectedIndex = this.steps.length - 1;
    }
    this.markVisited(this.selectedIndex);
  }

  get stepLabelTpl(): TemplateRef<any> | null {
    return this.stepLabelTplDir?.template ?? null;
  }

  get labelPositionClass(): string {
    switch (this.labelPosition) {
      case 'top':
        return 'ngb-stepper-label-top';
      case 'bottom':
        return 'ngb-stepper-label-bottom';
      case 'left':
        return 'ngb-stepper-label-left';
      default:
        return 'ngb-stepper-label-right';
    }
  }

  get currentErrorMessage(): string | null {
    const step = this.steps[this.selectedIndex];
    return step?.errorMessage ?? null;
  }

  stepId(i: number): string {
    const s = this.steps[i];
    const base = s?.id || `ngb-step-${i}`;
    return `${base}-label`;
  }

  contentId(i: number): string {
    const s = this.steps[i];
    const base = s?.id || `ngb-step-${i}`;
    return `${base}-content`;
  }

  private markVisited(i: number): void {
    this.visited.add(i);
    this.visitedFrom = Math.max(this.visitedFrom, i);
  }

  stepState(i: number): NgbStepperState {
    const s = this.steps[i];
    if (!s) return 'number';
    if (s.state) return s.state;
    if (this.isStepInError(i)) return 'error';
    if (i === this.selectedIndex) return 'active';
    if (i < this.selectedIndex) return 'done';
    if (s.disabled) return 'disabled';
    return 'number';
  }

  isStepInError(i: number): boolean {
    const s = this.steps[i];
    return !!s?.errorMessage && this.visited.has(i);
  }

  indicatorClass(i: number): string {
    const state = this.stepState(i);
    return state;
  }

  defaultIconForState(state: NgbStepperState, index: number): string {
    if (state === 'number') {
      return String(index + 1);
    }
    return this.stateIcons[state] ?? this.stateIcons['number'] ?? String(index + 1);
  }

  onHeaderClick(i: number): void {
    if (i === this.selectedIndex) return;
    const step = this.steps[i];
    if (!step || step.disabled) return;
    if (!this.allowRevisit && i < this.visitedFrom) return;
    this.changeIndex(i);
  }

  onHeaderKeydown(event: KeyboardEvent | Event, i: number): void {
    event.preventDefault();
    this.onHeaderClick(i);
  }

  next(): void {
    const target = Math.min(this.steps.length - 1, this.selectedIndex + 1);
    if (target === this.selectedIndex) return;
    this.nextClicked.emit(target);
    this.changeIndex(target);
  }

  prev(): void {
    if (!this.allowRevisit) return;
    const target = Math.max(0, this.selectedIndex - 1);
    if (target === this.selectedIndex) return;
    this.prevClicked.emit(target);
    this.changeIndex(target);
  }

  onReset(): void {
    this.resetClicked.emit();
    this.selectedIndex = 0;
    this.selectedIndexChange.emit(this.selectedIndex);
    this.selectionChange.emit({
      previousIndex: 0,
      currentIndex: 0,
      step: this.steps[0],
    });
    this.visited.clear();
    this.visitedFrom = 0;
    this.markVisited(0);
  }

  onCancel(): void {
    this.cancelClicked.emit();
  }

  private changeIndex(nextIndex: number): void {
    const prev = this.selectedIndex;
    this.selectedIndex = nextIndex;
    this.markVisited(nextIndex);
    this.selectedIndexChange.emit(this.selectedIndex);
    this.selectionChange.emit({
      previousIndex: prev,
      currentIndex: nextIndex,
      step: this.steps[nextIndex],
    });
  }
}
