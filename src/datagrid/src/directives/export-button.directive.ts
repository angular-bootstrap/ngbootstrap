import { Directive, TemplateRef, inject } from '@angular/core';

export interface ExportButtonContext {
  $implicit: (kind: 'pdf' | 'excel') => void; // let-trigger
}

// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({ selector: '[ngbExportButton]' })
export class ExportButtonDirective {
  // Expose the TemplateRef so the grid can render it with a context
  readonly templateRef = inject<TemplateRef<ExportButtonContext>>(TemplateRef as any);
}