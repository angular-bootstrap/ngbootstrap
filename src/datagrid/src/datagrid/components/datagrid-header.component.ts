import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDatagridButtonDirective } from '../../foundation/datagrid-button.directive';
import { NgbDatagridControlDirective } from '../../foundation/datagrid-control.directive';
import { NgbDatagridFieldShellComponent } from '../../foundation/datagrid-field-shell.component';
import type { Datagrid } from '../datagrid.component';

@Component({
  selector: 'thead[ngbDatagridHeader]',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbDatagridButtonDirective,
    NgbDatagridControlDirective,
    NgbDatagridFieldShellComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tr>
      @if (grid.showSelectionColumn()) {
      <th
        class="text-center"
        scope="col"
        [style.width.px]="grid.utilityColumnWidth('selection')"
        [class.column-pinned-start]="grid.shouldPinLeadingUtilityColumns()"
        [style.left.px]="grid.utilityStickyOffset('selection')"
      >
        @if (grid.selectionMode === 'multiple' && grid.selectAllEnabled) {
          <input
            type="checkbox"
            [checked]="grid.isPageAllSelected()"
            [indeterminate]="grid.isPageIndeterminate()"
            (change)="grid.toggleSelectAllCurrentPage()"
            [attr.aria-label]="grid.selectAllLabel()"
          />
        }
      </th>
      }
      @if (grid.rowDetailTpl) {
      <th
        [style.width.px]="grid.utilityColumnWidth('detail')"
        scope="col"
        aria-hidden="true"
        [class.column-pinned-start]="grid.shouldPinLeadingUtilityColumns()"
        [style.left.px]="grid.utilityStickyOffset('detail')"
      ></th>
      }
      @if (grid.stickyRowsEnabled) {
      <th
        [style.width.px]="grid.utilityColumnWidth('sticky-toggle')"
        scope="col"
        class="text-center"
        data-title="Sticky"
        [class.column-pinned-start]="grid.shouldPinLeadingUtilityColumns()"
        [style.left.px]="grid.utilityStickyOffset('sticky-toggle')"
      ></th>
      }
      @for (col of grid.visibleColumns; track col.field; let ci = $index) {
      <th
        [attr.data-title]="col.header"
        [class.sortable]="grid.enableSorting && col.sortable"
        [class.filter-menu-active]="grid.hasActiveColumnFilter(col.field)"
        [class.filter-menu-open]="grid.openFilterMenuField === col.field"
        [class.column-pinned-start]="grid.columnPinnedSide(col) === 'start'"
        [class.column-pinned-end]="grid.columnPinnedSide(col) === 'end'"
        [class.column-locked]="col.locked"
        [class.grid-header__column--resizable]="grid.isColumnResizable(col)"
        [class.grid-header__column--reorderable]="grid.isColumnReorderable(col)"
        [class.grid-header__column--drag-over]="grid.columnDragOverIndex === ci && grid.columnDragField"
        (dragover)="grid.onColumnDragOver($event, ci)"
        (dragleave)="grid.onColumnDragLeave($event, ci)"
        (drop)="grid.onColumnDrop($event, ci)"
        [ngClass]="grid.resolveHeaderClass(col)"
        [ngStyle]="grid.resolveHeaderStyle(col)"
        [style.width.px]="grid.columnWidth(col) || null"
        [style.min-width.px]="grid.resizable ? grid.columnWidth(col) : null"
        [style.max-width.px]="grid.resizable ? grid.columnWidth(col) : null"
        [style.left.px]="grid.columnStartOffset(col)"
        [style.right.px]="grid.columnEndOffset(col)"
        scope="col"
        [attr.title]="grid.headerTitle(col)"
        [attr.aria-sort]="grid.enableSorting && col.sortable ? grid.ariaSortFor(col.field) : null"
      >
        <div class="grid-header__cell">
          @if (grid.isColumnGroupable(col)) {
          <span
            class="grid-column-group-handle bi bi-diagram-3"
            [class.grid-column-group-handle--active]="grid.isFieldGrouped(col.field)"
            draggable="true"
            role="button"
            tabindex="0"
            [attr.aria-label]="grid.groupHandleAriaLabel(col)"
            (dragstart)="grid.onGroupHandleDragStart($event, col.field); $event.stopPropagation()"
            (dragend)="grid.onGroupHandleDragEnd()"
            (keydown.enter)="grid.toggleGroupField(col.field); $event.preventDefault(); $event.stopPropagation()"
            (keydown.space)="grid.toggleGroupField(col.field); $event.preventDefault(); $event.stopPropagation()"
          ></span>
          }
          @if (grid.isColumnReorderable(col)) {
          <span
            class="grid-column-reorder-handle bi bi-grip-vertical"
            draggable="true"
            role="button"
            tabindex="0"
            [attr.aria-label]="grid.reorderColumnAriaLabel(col)"
            (dragstart)="grid.onColumnDragStart($event, col, ci); $event.stopPropagation()"
            (dragend)="grid.onColumnDragEnd()"
          ></span>
          }
          @if (grid.enableSorting && col.sortable) {
            <button
              type="button"
              class="grid-sort-button"
              (click)="grid.toggleSort(col.field)"
              [attr.aria-label]="grid.sortButtonAriaLabel(col)"
            >
              <span class="grid-sort-button__label">{{ col.header }}</span>
              <span
                class="grid-sort-button__indicator"
                [class.grid-sort-button__indicator--active]="grid.sort.active === col.field"
                aria-hidden="true"
              >
                {{
                  grid.sort.active === col.field
                    ? grid.sort.direction === 'asc'
                      ? '▲'
                      : grid.sort.direction === 'desc'
                        ? '▼'
                        : '↕'
                    : '↕'
                }}
              </span>
            </button>
          } @else {
            <span>{{ col.header }}</span>
          }

          @if (grid.isMenuFilterVisible(col)) {
          <div class="grid-filter-menu-host">
            <button
              type="button"
              ngbDatagridButton="icon"
              class="grid-filter-menu-trigger"
              [class.grid-filter-menu-trigger--active]="grid.hasActiveColumnFilter(col.field)"
              [class.grid-filter-menu-trigger--check]="grid.isMultiCheckboxMode(col)"
              (click)="grid.toggleFilterMenu(col.field, $any($event.currentTarget)); $event.stopPropagation()"
              [attr.aria-expanded]="grid.openFilterMenuField === col.field"
              [attr.aria-label]="grid.openFilterMenuAriaLabel(col)"
            >
              <span
                class="bi"
                [ngClass]="grid.isMultiCheckboxMode(col) ? 'bi-check2-square' : 'bi-funnel'"
                aria-hidden="true"
              ></span>
            </button>
          </div>
          }
        </div>
        @if (grid.isColumnResizable(col)) {
        <span
          class="grid-column-resize-handle"
          role="separator"
          aria-orientation="vertical"
          [attr.aria-label]="grid.resizeColumnAriaLabel(col)"
          (mousedown)="grid.startColumnResize($event, col)"
        ></span>
        }
      </th>
      }
      @if (grid.showActionsColumn()) {
      <th
        class="text-center"
        scope="col"
        [style.width.px]="grid.utilityColumnWidth('actions')"
      >
        Actions
      </th>
      }
    </tr>

    @if (grid.anyFilterable) {
    <tr class="filter-row" [formGroup]="grid.filterForm">
      @if (grid.showSelectionColumn()) { <th></th> }
      @if (grid.rowDetailTpl) { <th></th> }
      @if (grid.stickyRowsEnabled) { <th></th> }
      @for (col of grid.visibleColumns; track col.field) {
      <th
        [attr.data-title]="col.header"
        [class.column-pinned-start]="grid.columnPinnedSide(col) === 'start'"
        [class.column-pinned-end]="grid.columnPinnedSide(col) === 'end'"
        [style.width.px]="grid.columnWidth(col) || null"
        [style.min-width.px]="grid.resizable ? grid.columnWidth(col) : null"
        [style.max-width.px]="grid.resizable ? grid.columnWidth(col) : null"
        [style.left.px]="grid.columnStartOffset(col)"
        [style.right.px]="grid.columnEndOffset(col)"
      >
        @if (grid.isRowFilterVisible(col)) {
          @if (grid.filterTpls[col.field]; as ft) {
            <ng-container
              [ngTemplateOutlet]="ft.template"
              [ngTemplateOutletContext]="grid.filterContext(col, 'row')"
            >
            </ng-container>
          } @else {
            <div class="grid-filter-inline">
              @switch (grid.getColumnFilterType(col)) {
                @case ('date') {
                <ngb-datagrid-field-shell>
                  <input
                    ngbDatagridControl
                    type="date"
                    [formControlName]="grid.valueControlName(col.field)"
                    (input)="grid.applyRowFilter(col)"
                    [attr.aria-label]="grid.columnFilterAriaLabel(col)"
                  />
                </ngb-datagrid-field-shell>
                }
                @case ('boolean') {
                <select
                  ngbDatagridControl
                  [formControlName]="grid.valueControlName(col.field)"
                  (change)="grid.applyRowFilter(col)"
                >
                  <option [ngValue]="''">{{ grid.rowFilterEmptyOptionLabel(col) }}</option>
                  <option [ngValue]="true">{{ grid.booleanFilterOptionLabel(true) }}</option>
                  <option [ngValue]="false">{{ grid.booleanFilterOptionLabel(false) }}</option>
                </select>
                }
                @case ('select') {
                <select
                  ngbDatagridControl
                  [formControlName]="grid.valueControlName(col.field)"
                  (change)="grid.applyRowFilter(col)"
                >
                  <option [ngValue]="''">{{ grid.rowFilterEmptyOptionLabel(col) }}</option>
                  @for (option of col.options ?? []; track option.value) {
                    <option [ngValue]="option.value">{{ option.label }}</option>
                  }
                </select>
                }
                @default {
                <input
                  ngbDatagridControl
                  [attr.type]="
                    grid.getColumnFilterType(col) === 'numeric'
                      ? 'number'
                      : 'text'
                  "
                  [placeholder]="grid.rowFilterPlaceholder(col)"
                  [formControlName]="grid.valueControlName(col.field)"
                  (input)="grid.applyRowFilter(col)"
                  [attr.aria-label]="grid.columnFilterAriaLabel(col)"
                />
                }
              }

              @if (grid.isRowFilterOperatorVisible(col)) {
              <div class="grid-filter-operator">
                <button
                  type="button"
                  ngbDatagridButton="icon"
                  class="grid-filter-operator__button grid-filter-operator__button--compact"
                  [class.grid-filter-operator__button--active]="grid.hasActiveColumnFilter(col.field)"
                  (click)="grid.toggleRowFilterMenu(col.field, $any($event.currentTarget)); $event.stopPropagation()"
                  [attr.aria-expanded]="grid.isRowFilterMenuOpen(col.field)"
                  [attr.aria-haspopup]="'listbox'"
                  [attr.aria-label]="grid.filterOperatorAriaLabel(col)"
                  [attr.title]="grid.rowFilterMenuTitle(col)"
                >
                  <span class="bi bi-funnel" aria-hidden="true"></span>
                </button>
              </div>
              }

              @if (grid.isRowFilterOperatorVisible(col) && grid.hasActiveColumnFilter(col.field)) {
              <button
                ngbDatagridButton="icon"
                class="grid-filter-clear"
                type="button"
                (click)="grid.clearColumnFilter(col.field)"
                title="Clear filter"
                [attr.aria-label]="grid.clearFilterAriaLabel(col)"
              >
                <span class="bi bi-x-lg" aria-hidden="true"></span>
              </button>
              }
            </div>
          }
        }
      </th>
      }
      @if (grid.showActionsColumn()) { <th></th> }
    </tr>
    }
  `
})
export class NgbDatagridHeaderComponent {
  @Input({ required: true }) grid!: Datagrid<any>;
  @Input() renderTick = 0;
}
