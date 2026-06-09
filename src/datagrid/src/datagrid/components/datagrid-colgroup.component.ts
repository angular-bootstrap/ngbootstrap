import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'colgroup[ngbDatagridColgroup]',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (grid.showSelectionColumn()) {
      <col [style.width.px]="grid.utilityColumnWidth('selection')" />
    }
    @if (grid.rowDetailTpl) {
      <col [style.width.px]="grid.utilityColumnWidth('detail')" data-fixed="true" />
    }
    @if (grid.stickyRowsEnabled) {
      <col [style.width.px]="grid.utilityColumnWidth('sticky-toggle')" />
    }
    @for (col of grid.visibleColumns; track col.field) {
      <col
        [style.width.px]="grid.columnWidth(col) || null"
        [attr.data-fixed]="grid.resizable ? 'true' : null"
      />
    }
    @if (grid.showActionsColumn()) {
      <col [style.width.px]="grid.utilityColumnWidth('actions')" />
    }
  `
})
export class NgbDatagridColgroupComponent {
  @Input({ required: true }) grid!: any;
}
