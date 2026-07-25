import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, Input, ViewChild } from '@angular/core';
import { ColumnDef } from '../../models/column-def';
import { NgbDatagridFloatingPanelDirective } from '../../foundation/datagrid-floating-panel.directive';
import type { Datagrid } from '../datagrid.component';

@Component({
  selector: 'ngb-datagrid-row-filter-operator-panel',
  standalone: true,
  imports: [CommonModule, NgbDatagridFloatingPanelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="dropdown-menu show ngb-datagrid-floating-panel grid-filter-operator-menu"
      ngbDatagridFloatingPanel
      [ngbDatagridFloatingPanelAnchor]="anchor"
      ngbDatagridFloatingPanelPlacement="operator"
      role="listbox"
      [attr.aria-label]="'Filter operators for ' + col.header"
      (click)="$event.stopPropagation()"
    >
      @for (operator of grid.getAllowedOperators(col); track operator) {
        <button
          type="button"
          class="dropdown-item"
          role="option"
          [class.active]="grid.rowFilterOperator(col) === operator"
          [attr.aria-selected]="grid.rowFilterOperator(col) === operator"
          (click)="grid.setRowFilterOperator(col, operator)"
        >
          {{ grid.rowFilterOperatorLabel(col, operator) }}
        </button>
      }
    </div>
  `,
})
export class NgbDatagridRowFilterOperatorPanelComponent<T = unknown> implements AfterViewInit {
  @Input({ required: true }) grid!: Datagrid<T>;
  @Input({ required: true }) col!: ColumnDef<T>;
  @Input({ required: true }) anchor!: HTMLElement;

  @ViewChild(NgbDatagridFloatingPanelDirective, { static: true })
  private floatingPanel?: NgbDatagridFloatingPanelDirective;

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      this.floatingPanel?.reposition();
      requestAnimationFrame(() => this.floatingPanel?.reposition());
    });
  }
}
