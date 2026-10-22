import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import type { Datagrid } from '../datagrid.component';

@Component({
  selector: 'tr[ngbDatagridDetailRow]',
  standalone: true,
  imports: [CommonModule],
  template: `
    <td [attr.colspan]="grid.detailColspan" role="gridcell" class="grid-detail-row__cell"
      [attr.tabindex]="grid.keyboardNavigation ? 0 : null" (keydown)="onDetailKeydown($event)">
      <div class="grid-detail-row__content">
        <ng-container
          [ngTemplateOutlet]="grid.rowDetailTpl!.template"
          [ngTemplateOutletContext]="{ $implicit: row, index: index }"
        >
        </ng-container>
      </div>
    </td>
  `
})
export class NgbDatagridDetailRowComponent {
  @Input({ required: true }) grid!: Datagrid<any>;
  @Input({ required: true }) row!: unknown;
  @Input({ required: true }) index!: number;

  onDetailKeydown(event: KeyboardEvent): void {
    if (!this.grid.keyboardNavigation || event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const cell = event.currentTarget as HTMLElement;
    const target = event.target as HTMLElement;
    if (event.key === 'Enter' && target === cell) {
      const child = cell.querySelector<HTMLElement>('ngb-datagrid');
      const first = child && Array.from(child.querySelectorAll<HTMLElement>('.grid-data-row td[data-col-index][tabindex="0"]'))
        .find(candidate => candidate.closest('ngb-datagrid') === child);
      if (first) { event.preventDefault(); event.stopPropagation(); first.focus(); }
    } else if (event.key === 'Escape' && target !== cell && target.closest('ngb-datagrid') !== cell.closest('ngb-datagrid')) {
      // Editors, links and controls own their keys; an editor's first Escape may cancel its draft.
      if (target.closest('input, textarea, select, button, a, [contenteditable]')) return;
      event.preventDefault(); event.stopPropagation(); cell.focus();
    }
  }
}
