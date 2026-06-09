import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'tr[ngbDatagridDetailRow]',
  standalone: true,
  imports: [CommonModule],
  template: `
    <td [attr.colspan]="grid.detailColspan" role="region" class="grid-detail-row__cell">
      <div class="grid-detail-row__content">
        <ng-container
          [ngTemplateOutlet]="grid.rowDetailTpl.template"
          [ngTemplateOutletContext]="{ $implicit: row, index: index }"
        >
        </ng-container>
      </div>
    </td>
  `
})
export class NgbDatagridDetailRowComponent {
  @Input({ required: true }) grid!: any;
  @Input({ required: true }) row!: any;
  @Input({ required: true }) index!: number;
}
