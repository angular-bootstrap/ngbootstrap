import { Directive, TemplateRef, Input } from '@angular/core';

@Directive({
  selector: '[ngbStepLabel]',
  standalone: true,
})
export class NgbStepLabelDirective {
  @Input('ngbStepLabel') for?: string | number;

  constructor(public template: TemplateRef<unknown>) {}
}

