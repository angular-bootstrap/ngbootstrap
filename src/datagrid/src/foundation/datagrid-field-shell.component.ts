import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'ngb-datagrid-field-shell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid-filter-field" [class.grid-filter-field--with-icon]="!!icon">
      <ng-content></ng-content>
      @if (icon) {
        <span class="bi grid-filter-field__icon" [ngClass]="'bi-' + icon" aria-hidden="true"></span>
      }
    </div>
  `
})
export class NgbDatagridFieldShellComponent {
  @Input() icon?: string;
}
