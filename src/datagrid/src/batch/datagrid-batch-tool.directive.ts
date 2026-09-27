import { Directive, EventEmitter, HostBinding, HostListener, inject, Output } from '@angular/core';
import { NgbGridBatchEditingDirective } from './datagrid-batch.directive';
import { NgbGridBatchResult } from './batch-types';

@Directive()
abstract class BatchTool {
  protected readonly batch = inject(NgbGridBatchEditingDirective);
  @HostBinding('attr.type') readonly type = 'button';
  @HostBinding('class.datagrid-toolbar__button') readonly buttonClass = true;
  @HostBinding('class.datagrid-toolbar__button--secondary') readonly secondaryClass = true;
}

/** Native button with application-owned label; disabled while validation is pending. */
@Directive({ selector: 'button[ngbGridBatchApplyTool]', standalone: true })
export class NgbGridBatchApplyToolDirective extends BatchTool {
  @Output() batchResult = new EventEmitter<NgbGridBatchResult>();
  @HostBinding('disabled') get disabled(): boolean { return !this.batch.canApply(); }
  @HostBinding('attr.aria-busy') get busy(): boolean { return this.batch.validating(); }
  @HostListener('click') async apply(): Promise<void> {
    if (!this.disabled) this.batchResult.emit(await this.batch.applyBatch());
  }
}

/** Discard remains available during async validation and cancels stale completion. */
@Directive({ selector: 'button[ngbGridBatchDiscardTool]', standalone: true })
export class NgbGridBatchDiscardToolDirective extends BatchTool {
  @HostBinding('disabled') get disabled(): boolean { return !this.batch.hasPending() && !this.batch.validating(); }
  @HostListener('click') discard(): void { if (!this.disabled) this.batch.discardBatch(); }
}
