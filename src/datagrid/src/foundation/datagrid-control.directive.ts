import { Directive, HostBinding, Input } from '@angular/core';

@Directive({
  selector: 'input[ngbDatagridControl], select[ngbDatagridControl], textarea[ngbDatagridControl]',
  standalone: true,
})
export class NgbDatagridControlDirective {
  @Input() ngbDatagridControlMode: 'filter' | 'edit' = 'filter';

  @HostBinding('class.grid-filter-control') get filterClass(): boolean {
    return this.ngbDatagridControlMode === 'filter';
  }

  @HostBinding('class.grid-edit-control') get editClass(): boolean {
    return this.ngbDatagridControlMode === 'edit';
  }
}
