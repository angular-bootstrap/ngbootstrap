import { booleanAttribute, Directive, EventEmitter, HostBinding, HostListener, inject, Input, Output } from '@angular/core';
import { NgbDataGridHistoryDirective, NgbDataGridHistoryResult } from './datagrid-history.directive';

@Directive()
abstract class NgbGridHistoryTool {
  protected readonly history = inject(NgbDataGridHistoryDirective);
  protected abstract readonly action: 'undo' | 'redo';
  /** Application restriction, combined with the history stack's availability. */
  @Input({ transform: booleanAttribute }) disabled = false;
  /** Customize announcements, error presentation or analytics without replaying the action. */
  @Output() historyResult = new EventEmitter<NgbDataGridHistoryResult>();
  @HostBinding('attr.aria-keyshortcuts') get shortcuts(): string | null {
    return this.history.historyKeyboard ? (this.action === 'undo' ? 'Control+z Meta+z' : 'Control+Shift+z Meta+Shift+z Control+y') : null;
  }
  @HostBinding('attr.type') readonly type = 'button';
  @HostBinding('class.datagrid-toolbar__button--secondary') readonly secondaryClass = true;
  @HostBinding('class.datagrid-toolbar__button') readonly toolClass = true;
  @HostBinding('disabled') get unavailable(): boolean {
    return this.disabled || !(this.action === 'undo' ? this.history.canUndo() : this.history.canRedo());
  }
  @HostBinding('attr.aria-busy') get busy(): boolean { return this.history.busy(); }
  @HostListener('click') async activate(): Promise<void> {
    if (this.unavailable) return;
    const result = this.history[this.action]();
    this.historyResult.emit(!result.success && result.reason === 'async-required' ? await this.history[this.action === 'undo' ? 'undoAsync' : 'redoAsync']() : result);
  }
}

/** Native button with application-owned text, icons, classes and accessible label. */
@Directive({ selector: 'button[ngbGridUndoTool]', standalone: true })
export class NgbGridUndoToolDirective extends NgbGridHistoryTool {
  protected readonly action = 'undo' as const;
}

/** Native button with application-owned text, icons, classes and accessible label. */
@Directive({ selector: 'button[ngbGridRedoTool]', standalone: true })
export class NgbGridRedoToolDirective extends NgbGridHistoryTool {
  protected readonly action = 'redo' as const;
}
