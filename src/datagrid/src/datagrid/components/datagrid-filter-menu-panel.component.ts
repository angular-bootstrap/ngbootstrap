import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ColumnDef } from '../../models/column-def';
import { NgbDatagridButtonDirective } from '../../foundation/datagrid-button.directive';
import { NgbDatagridControlDirective } from '../../foundation/datagrid-control.directive';
import { NgbDatagridFieldShellComponent } from '../../foundation/datagrid-field-shell.component';
import { NgbDatagridSurfaceCardComponent } from '../../foundation/datagrid-surface-card.component';
import { NgbDatagridFloatingPanelDirective } from '../../foundation/datagrid-floating-panel.directive';
import type { Datagrid } from '../datagrid.component';

@Component({
  selector: 'ngb-datagrid-filter-menu-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgbDatagridButtonDirective,
    NgbDatagridControlDirective,
    NgbDatagridFieldShellComponent,
    NgbDatagridSurfaceCardComponent,
    NgbDatagridFloatingPanelDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="grid-filter-menu-popover ngb-grid__filter-menu-overlay"
      ngbDatagridFloatingPanel
      [ngbDatagridFloatingPanelAnchor]="anchor"
      ngbDatagridFloatingPanelPlacement="menu"
      (click)="$event.stopPropagation()"
    >
      <ngb-datagrid-surface-card>
        @if (grid.isMultiCheckboxMode(col)) {
        <div class="grid-filter-menu-surface__header">
          <div class="grid-filter-menu-surface__eyebrow">Filter</div>
          <div class="grid-filter-menu-surface__title">{{ col.header }}</div>
        </div>
        }

        @if (grid.filterMenuTpls[col.field]; as menuTpl) {
          <ng-container
            [ngTemplateOutlet]="menuTpl.template"
            [ngTemplateOutletContext]="grid.filterContext(col, 'menu')"
          >
          </ng-container>
        } @else {
          @if (grid.isMultiCheckboxMode(col)) {
            <div class="grid-filter-menu-surface__multi">
              <input
                ngbDatagridControl
                class="grid-filter-menu-surface__search"
                type="text"
                placeholder="Search..."
                [(ngModel)]="grid.multiCheckboxSearch[col.field]"
                [attr.aria-label]="'Search values for ' + col.header"
              />

              <div class="grid-multi-filter-list">
                <label class="grid-multi-filter-option grid-multi-filter-option--summary">
                  <span class="grid-multi-filter-option__main">
                    <input
                      type="checkbox"
                      [checked]="grid.isMultiCheckboxAllSelected(col)"
                      [indeterminate]="grid.isMultiCheckboxPartiallySelected(col)"
                      (change)="grid.toggleMultiCheckboxAll(col)"
                    />
                    <span>{{ grid.multiCheckboxToggleLabel(col) }}</span>
                  </span>
                  <span class="grid-multi-filter-option__count">
                    {{ grid.multiCheckboxSelectedCount(col) }} of {{ grid.multiCheckboxTotalCount(col) }}
                  </span>
                </label>

                @for (option of grid.multiCheckboxVisibleOptions(col); track option.value) {
                <label class="grid-multi-filter-option">
                  <span class="grid-multi-filter-option__main">
                    <input
                      type="checkbox"
                      [checked]="grid.isMultiCheckboxChecked(col, option.value)"
                      (change)="grid.toggleMultiCheckboxValue(col, option.value)"
                    />
                    <span>{{ option.label }}</span>
                  </span>
                </label>
                }
              </div>

              <div class="grid-filter-menu-surface__actions grid-filter-menu-surface__actions--multi">
                <button type="button" class="grid-filter-apply" (click)="grid.applyMultiCheckboxFilter(col)">
                  {{ grid.multiCheckboxFilterApplyLabel() }}
                </button>
                @if (grid.multiCheckboxFilterShowCancel()) {
                <button
                  type="button"
                  class="grid-filter-cancel"
                  (click)="grid.cancelMultiCheckboxFilter(col)"
                >
                  {{ grid.multiCheckboxFilterCancelLabel() }}
                </button>
                }
              </div>
            </div>
          } @else {
            <div class="grid-filter-multi-panel">
              @for (condition of grid.ensureMenuDraftConditions(col); track $index; let conditionIndex = $index) {
                @if (conditionIndex > 0) {
                <div class="grid-filter-join-select">
                  <select
                    ngbDatagridControl
                    class="grid-filter-join-select__control"
                    [ngModel]="grid.ensureMenuJoinLogic(col)"
                    (ngModelChange)="grid.setMenuJoinLogic(col, $event)"
                    aria-label="Combine conditions with"
                  >
                    <option [ngValue]="'and'">And</option>
                    <option [ngValue]="'or'">Or</option>
                  </select>
                </div>
                }

                <select
                  ngbDatagridControl
                  class="grid-filter-operator-select"
                  [(ngModel)]="condition.operator"
                  [attr.aria-label]="'Filter operator for ' + col.header"
                >
                  @for (operator of grid.getAllowedOperators(col); track operator) {
                    <option [ngValue]="operator">{{ grid.rowFilterOperatorLabel(col, operator) }}</option>
                  }
                </select>

                @switch (grid.getColumnFilterType(col)) {
                  @case ('date') {
                  <ngb-datagrid-field-shell>
                    <input
                      ngbDatagridControl
                      class="grid-filter-value-input"
                      type="date"
                      [(ngModel)]="condition.value"
                      [disabled]="!grid.operatorRequiresValue(condition.operator)"
                      [attr.aria-label]="grid.columnFilterAriaLabel(col)"
                    />
                  </ngb-datagrid-field-shell>
                  }
                  @case ('boolean') {
                  <select
                    ngbDatagridControl
                    class="grid-filter-value-select"
                    [(ngModel)]="condition.value"
                    [disabled]="!grid.operatorRequiresValue(condition.operator)"
                  >
                    <option [ngValue]="''">Select</option>
                    <option [ngValue]="true">True</option>
                    <option [ngValue]="false">False</option>
                  </select>
                  }
                  @case ('select') {
                  <select
                    ngbDatagridControl
                    class="grid-filter-value-select"
                    [(ngModel)]="condition.value"
                    [disabled]="!grid.operatorRequiresValue(condition.operator)"
                  >
                    <option [ngValue]="''">Select</option>
                    @for (option of col.options ?? []; track option.value) {
                      <option [ngValue]="option.value">{{ option.label }}</option>
                    }
                  </select>
                  }
                  @default {
                  <input
                    ngbDatagridControl
                    class="grid-filter-value-input"
                    [attr.type]="grid.getColumnFilterType(col) === 'numeric' ? 'number' : 'text'"
                    [(ngModel)]="condition.value"
                    [disabled]="!grid.operatorRequiresValue(condition.operator)"
                    [attr.aria-label]="grid.columnFilterAriaLabel(col)"
                    [attr.placeholder]="col.filterPlaceholder || grid.rowFilterPlaceholder(col)"
                  />
                  }
                }
              }

              <div class="grid-filter-menu-surface__actions grid-filter-menu-surface__actions--split">
                <button
                  type="button"
                  class="grid-filter-apply grid-filter-apply--secondary"
                  [disabled]="!grid.canApplyMenuFilter(col)"
                  (click)="grid.applyMenuFilter(col)"
                >
                  Filter
                </button>
                <button
                  type="button"
                  class="grid-filter-cancel grid-filter-cancel--secondary"
                  [disabled]="!grid.canClearMenuFilter(col)"
                  (click)="grid.clearMenuFilter(col)"
                >
                  Clear
                </button>
              </div>
            </div>
          }
        }
      </ngb-datagrid-surface-card>
    </div>
  `,
})
export class NgbDatagridFilterMenuPanelComponent<T = unknown> implements AfterViewInit, OnChanges {
  @Input({ required: true }) grid!: Datagrid<T>;
  @Input({ required: true }) col!: ColumnDef<T>;
  @Input({ required: true }) anchor!: HTMLElement;

  @ViewChild(NgbDatagridFloatingPanelDirective, { static: true })
  private floatingPanel?: NgbDatagridFloatingPanelDirective;

  ngOnChanges(changes: SimpleChanges): void {
    if ('anchor' in changes && this.floatingPanel) {
      this.scheduleReposition();
    }
  }

  ngAfterViewInit(): void {
    this.scheduleReposition();
  }

  private scheduleReposition(): void {
    requestAnimationFrame(() => {
      this.floatingPanel?.reposition();
      requestAnimationFrame(() => this.floatingPanel?.reposition());
    });
  }
}
