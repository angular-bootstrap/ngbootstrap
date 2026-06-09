import { Directive, HostBinding, Input } from '@angular/core';

export type NgbDatagridButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'neutral'
  | 'icon';

@Directive({
  selector: 'button[ngbDatagridButton], a[ngbDatagridButton]',
  standalone: true,
})
export class NgbDatagridButtonDirective {
  @Input('ngbDatagridButton') variant: NgbDatagridButtonVariant = 'secondary';

  @HostBinding('class.datagrid-toolbar__button') get toolbarButtonClass(): boolean {
    return this.variant === 'primary' || this.variant === 'secondary';
  }

  @HostBinding('class.datagrid-toolbar__button--primary') get toolbarPrimary(): boolean {
    return this.variant === 'primary';
  }

  @HostBinding('class.datagrid-toolbar__button--secondary') get toolbarSecondary(): boolean {
    return this.variant === 'secondary';
  }

  @HostBinding('class.grid-row-action') get rowActionClass(): boolean {
    return this.variant === 'success' || this.variant === 'danger' || this.variant === 'neutral';
  }

  @HostBinding('class.grid-row-action--success') get rowSuccess(): boolean {
    return this.variant === 'success';
  }

  @HostBinding('class.grid-row-action--danger') get rowDanger(): boolean {
    return this.variant === 'danger';
  }

  @HostBinding('class.grid-row-action--neutral') get rowNeutral(): boolean {
    return this.variant === 'neutral';
  }

  @HostBinding('class.grid-filter-menu-trigger') get iconButtonClass(): boolean {
    return this.variant === 'icon';
  }
}
