import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'ngb-datagrid-surface-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid-filter-menu-surface">
      <ng-content></ng-content>
    </div>
  `
})
export class NgbDatagridSurfaceCardComponent {}
