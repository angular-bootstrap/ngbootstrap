import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ControlContainer, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { ColumnDef } from '../../models/column-def';
import { NgbDatagridButtonDirective } from '../../foundation/datagrid-button.directive';
import { NgbDatagridControlDirective } from '../../foundation/datagrid-control.directive';
import type { Datagrid } from '../datagrid.component';

@Component({
  selector: 'tr[ngbDatagridDataRow]',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbDatagridButtonDirective, NgbDatagridControlDirective],
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }],
  template: `
    @if (grid.showSelectionColumn()) {
    <td
      class="text-center align-middle"
      [style.width.px]="grid.isStackedLayout() ? null : grid.utilityColumnWidth('selection')"
      [class.column-pinned-start]="grid.shouldPinLeadingUtilityColumns() && !grid.isStackedLayout()"
      [style.left.px]="grid.isStackedLayout() ? null : grid.utilityStickyOffset('selection')"
    >
      <input
        type="checkbox"
        [checked]="selected"
        [disabled]="
          grid.selectionMode === 'none' ||
          grid.selectionBehavior === 'row' ||
          grid.isSelectionDisabled(row, index)
        "
        (click)="$event.stopPropagation()"
        (change)="grid.toggleSelection(index, $event)"
        [attr.aria-label]="grid.rowSelectionLabel(index)"
      />
    </td>
    }

    @if (grid.rowDetailTpl) {
    <td
      class="text-center align-middle"
      [style.width.px]="grid.isStackedLayout() ? null : grid.utilityColumnWidth('detail')"
      [class.column-pinned-start]="grid.shouldPinLeadingUtilityColumns() && !grid.isStackedLayout()"
      [style.left.px]="grid.isStackedLayout() ? null : grid.utilityStickyOffset('detail')"
    >
      <button
        type="button"
        class="grid-detail-toggle"
        (click)="$event.stopPropagation(); grid.toggleExpand(index)"
        [attr.aria-expanded]="grid.isExpanded(index)"
        [attr.aria-controls]="'dg-row-detail-' + index"
        [attr.aria-label]="grid.isExpanded(index) ? grid.collapseRowAriaLabel : grid.expandRowAriaLabel"
      >
        <span
          class="bi"
          [ngClass]="grid.isExpanded(index) ? 'bi-chevron-down' : 'bi-chevron-right'"
          aria-hidden="true"
        ></span>
      </button>
    </td>
    }

    @if (grid.stickyRowsEnabled) {
    <td
      class="text-center align-middle"
      data-title="Sticky"
      [style.width.px]="grid.isStackedLayout() ? null : grid.utilityColumnWidth('sticky-toggle')"
      [class.column-pinned-start]="grid.shouldPinLeadingUtilityColumns() && !grid.isStackedLayout()"
      [style.left.px]="grid.isStackedLayout() ? null : grid.utilityStickyOffset('sticky-toggle')"
    >
      <button
        type="button"
        class="btn btn-link p-0 no-edit-trigger sticky-toggle"
        (click)="$event.stopPropagation(); grid.toggleStickyRow(index)"
        [attr.aria-pressed]="grid.isRowSticky(row, index)"
        [attr.aria-label]="grid.stickyRowToggleAriaLabel()"
      >
        @if (grid.stickyIcon(row, index); as icon) {
          <span class="bi" [ngClass]="'bi-' + icon" aria-hidden="true"></span>
        }
      </button>
    </td>
    }

    @if (grid.isStackedCardsLayout()) {
      <td [attr.colspan]="grid.stackedCardColspan()" class="ngb-stacked-card-cell">
        <div class="ngb-stacked-card">
          <div class="ngb-stacked-card__layout">
            @for (group of grid.stackedCardGroups(); track group) {
            <div
              class="ngb-stacked-card__group"
              [attr.data-stacked-group]="group"
            >
              @for (col of grid.stackedColumnsInGroup(group); track col.field) {
              <div
                class="ngb-stacked-card__field"
                [class.cell-highlight]="grid.isCellHighlighted(row, index, col, grid.visibleColumnIndex(col))"
                [class.grid-cell--editing]="grid.isCellInEditMode(index, col)"
                [class.grid-cell--incell]="grid.isIncellEditMode()"
                [ngClass]="grid.resolveCellClass(row, index, col)"
                [ngStyle]="grid.resolveCellStyle(row, index, col)"
                (click)="grid.onCellClick($event, index, col)"
              >
                <div class="ngb-stacked-card__label">{{ col.header }}</div>
                <div class="ngb-stacked-card__value">
                  <ng-container
                    *ngTemplateOutlet="
                      dataCell;
                      context: { col: col, ci: grid.visibleColumnIndex(col) }
                    "
                  ></ng-container>
                </div>
              </div>
              }
            </div>
            }
          </div>
        </div>
      </td>
    } @else {
      @for (col of grid.visibleColumns; track col.field; let ci = $index) {
      <td
        role="gridcell"
        [attr.data-col-index]="ci"
        [attr.aria-colindex]="grid.ariaColIndexForDataColumn(ci)"
        [attr.tabindex]="grid.cellTabIndex(index, ci)"
        [attr.data-title]="grid.isStackedLayout() ? col.header : null"
        [attr.title]="grid.cellTitle(row, col)"
        [class.cell-highlight]="grid.isCellHighlighted(row, index, col, ci)"
        [class.grid-cell--focused]="grid.isCellFocused(index, ci)"
        [class.grid-cell--editing]="grid.isCellInEditMode(index, col)"
        [class.grid-cell--incell]="grid.isIncellEditMode()"
        [class.column-pinned-start]="grid.columnPinnedSide(col) === 'start'"
        [class.column-pinned-end]="grid.columnPinnedSide(col) === 'end'"
        [class.column-locked]="col.locked"
        [ngClass]="grid.resolveCellClass(row, index, col)"
        [ngStyle]="grid.resolveCellStyle(row, index, col)"
        [style.width.px]="grid.resizable && !grid.isStackedLayout() ? grid.columnWidth(col) : null"
        [style.min-width.px]="grid.resizable && !grid.isStackedLayout() ? grid.columnWidth(col) : null"
        [style.max-width.px]="grid.resizable && !grid.isStackedLayout() ? grid.columnWidth(col) : null"
        [style.left.px]="grid.isStackedLayout() ? null : grid.columnStartOffset(col)"
        [style.right.px]="grid.isStackedLayout() ? null : grid.columnEndOffset(col)"
        (focus)="grid.onDataCellFocus(index, ci)"
        (keydown)="grid.onDataCellKeydown($event, index, ci, col)"
        (click)="grid.onCellClick($event, index, col)"
      >
        <ng-container *ngTemplateOutlet="dataCell; context: { col: col, ci: ci }"></ng-container>
      </td>
      }
    }

    @if (grid.showActionsColumn()) {
    <td
      class="text-center grid-actions-cell"
      [style.width.px]="grid.isStackedLayout() ? null : grid.utilityColumnWidth('actions')"
    >
      <ng-container *ngTemplateOutlet="actionsCell"></ng-container>
    </td>
    }

    <ng-template #dataCell let-col="col" let-ci="ci">
      @if (grid.isCellInEditMode(index, col)) {
        @if (grid.editTpls[col.field]; as et) {
          <ng-container
            [ngTemplateOutlet]="et.template"
            [ngTemplateOutletContext]="{
              $implicit: grid.editForm.get(col.field),
              control: grid.editForm.get(col.field),
              row: row,
              col: col,
              form: grid.editForm,
              index: index,
              isNew: false,
            }"
          >
          </ng-container>
        } @else {
          @switch (col.type) {
            @case ('boolean') {
            <div class="form-check m-0 grid-edit-boolean">
              <input
                type="checkbox"
                class="form-check-input grid-edit-checkbox"
                [formControlName]="col.field"
                [attr.aria-label]="grid.inputAriaLabel(col)"
                [attr.aria-invalid]="
                  (grid.editForm?.touched || grid.saveAttemptedEdit) &&
                  grid.editForm?.get(col.field)?.invalid
                    ? 'true'
                    : null
                "
                [attr.aria-describedby]="
                  (grid.editForm?.touched || grid.saveAttemptedEdit) &&
                  grid.editForm?.get(col.field)?.invalid
                    ? 'edit-error-' + col.field
                    : null
                "
              />
            </div>
            }
            @case ('select') {
            <select
              ngbDatagridControl
              [ngbDatagridControlMode]="'edit'"
              [formControlName]="col.field"
              [attr.aria-label]="grid.inputAriaLabel(col)"
            >
              @for (o of col.options ?? []; track o.value) {
                <option [ngValue]="o.value">{{ o.label }}</option>
              }
            </select>
            }
            @default {
            <input
              ngbDatagridControl
              [ngbDatagridControlMode]="'edit'"
              [attr.type]="
                col.type === 'number'
                  ? 'number'
                  : col.type === 'email'
                    ? 'email'
                    : col.type === 'date'
                      ? 'date'
                      : 'text'
              "
              [formControlName]="col.field"
              (keydown)="grid.onCellKeydown($event, index, col, ci)"
              [attr.autofocus]="grid.isCellInEditMode(index, col) ? '' : null"
              [attr.aria-label]="grid.inputAriaLabel(col)"
              [attr.aria-invalid]="
                (grid.editForm?.touched || grid.saveAttemptedEdit) &&
                grid.editForm?.get(col.field)?.invalid
                  ? 'true'
                  : null
              "
              [attr.aria-describedby]="
                (grid.editForm?.touched || grid.saveAttemptedEdit) &&
                grid.editForm?.get(col.field)?.invalid
                  ? 'edit-error-' + col.field
                  : null
              "
            />
            }
          }

          @if ((grid.editForm?.touched || grid.saveAttemptedEdit) && grid.editForm?.get(col.field)?.errors; as e) {
            <div class="invalid-feedback d-block" [attr.id]="'edit-error-' + col.field" role="alert">
              @if (e['required']) { <span>Required</span> }
              @if (e['email']) { <span>Invalid email</span> }
              @if (e['number']) { <span>Invalid number</span> }
              @if (e['date']) { <span>Invalid date</span> }
            </div>
          }
        }
      } @else {
        @if (grid.cellTpls[col.field]; as ct) {
          <ng-container
            [ngTemplateOutlet]="ct.template"
            [ngTemplateOutletContext]="{
              $implicit: valueFor(row, col),
              row: row,
              col: col,
              index: index,
            }"
          >
          </ng-container>
        } @else {
          <div class="grid-cell-content">
            @switch (col.type) {
              @case ('boolean') {
              <span class="grid-boolean-pill" [class.grid-boolean-pill--true]="valueFor(row, col)">
                {{ grid.booleanDisplayLabel(!!valueFor(row, col)) }}
              </span>
              }
              @default {
              <span class="grid-cell-text">
                @if (grid.isSearchHighlightEnabled() && grid.shouldHighlightSearchInColumn(col.field)) {
                  @for (part of grid.getSearchHighlightSegments(valueFor(row, col), col.field); track $index) {
                    @if (part.match) {
                      <mark class="grid-search-highlight">{{ part.text }}</mark>
                    } @else {
                      {{ part.text }}
                    }
                  }
                } @else {
                  {{ grid.formatCellDisplayValue(valueFor(row, col)) }}
                }
                @if (grid.showStickyRowBadge && grid.stickyRowBadgeField === col.field && grid.isRowSticky(row, index)) {
                <span
                  class="grid-sticky-badge"
                >{{ grid.stickyRowBadgeLabel }}</span>
                }
              </span>
              }
            }
          </div>
        }
      }
    </ng-template>

    <ng-template #actionsCell>
      @if (grid.editingIndex !== index) {
        <div class="grid-actions-cell__inner">
          @if (grid.showRowEditAction()) {
          <button
            type="button"
            class="grid-row-action no-edit-trigger"
            [class.grid-row-action--secondary]="grid.actionDisplay !== 'icons'"
            [class.grid-row-action--icon]="grid.actionDisplay === 'icons'"
            [class.grid-row-action--edit-icon]="grid.actionDisplay === 'icons'"
            (click)="grid.startEdit(index)"
            [attr.aria-label]="grid.editRowAriaLabel(index)"
          >
            @if (grid.actionDisplay === 'icons') {
              <span class="bi bi-pencil" aria-hidden="true"></span>
            } @else {
              <span>Edit</span>
            }
          </button>
          }
          @if (grid.showRowDeleteAction()) {
          <button
            type="button"
            ngbDatagridButton="danger"
            class="no-edit-trigger"
            [class.grid-row-action--icon]="grid.actionDisplay === 'icons'"
            (click)="grid.deleteRow(index)"
            [attr.aria-label]="grid.deleteRowAriaLabel(index)"
          >
            @if (grid.actionDisplay === 'icons') {
              <span class="bi bi-trash" aria-hidden="true"></span>
            } @else {
              <span>Delete</span>
            }
          </button>
          }
        </div>
      } @else {
        <div class="grid-actions-cell__inner">
          <button
            type="button"
            ngbDatagridButton="success"
            (click)="grid.saveEdit(index)"
            [disabled]="grid.editForm.invalid"
          >
            Save
          </button>
          <button
            type="button"
            ngbDatagridButton="neutral"
            (click)="grid.cancelEdit(index)"
          >
            Cancel
          </button>
        </div>
      }
    </ng-template>
  `,
})
export class NgbDatagridDataRowComponent<T = unknown> {
  @Input({ required: true }) grid!: Datagrid<T>;
  @Input({ required: true }) row!: T;
  @Input({ required: true }) index!: number;
  @Input() selected = false;

  valueFor(row: T, col: ColumnDef): unknown {
    return (row as Record<string, unknown>)[col.field];
  }
}
