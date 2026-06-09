import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ControlContainer, FormGroupDirective, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDatagridButtonDirective } from '../../foundation/datagrid-button.directive';
import { NgbDatagridControlDirective } from '../../foundation/datagrid-control.directive';

@Component({
  selector: 'tr[ngbDatagridAddRow]',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbDatagridButtonDirective, NgbDatagridControlDirective],
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }],
  template: `
    @if (grid.showSelectionColumn()) {
    <td
      [style.width.px]="grid.utilityColumnWidth('selection')"
      [class.column-pinned-start]="grid.shouldPinLeadingUtilityColumns()"
      [style.left.px]="grid.utilityStickyOffset('selection')"
    ></td>
    }
    @if (grid.rowDetailTpl) {
    <td
      [style.width.px]="grid.utilityColumnWidth('detail')"
      [class.column-pinned-start]="grid.shouldPinLeadingUtilityColumns()"
      [style.left.px]="grid.utilityStickyOffset('detail')"
    ></td>
    }
    @if (grid.stickyRowsEnabled) {
    <td
      class="text-center"
      [style.width.px]="grid.utilityColumnWidth('sticky-toggle')"
      [class.column-pinned-start]="grid.shouldPinLeadingUtilityColumns()"
      [style.left.px]="grid.utilityStickyOffset('sticky-toggle')"
    ></td>
    }

    @for (col of grid.visibleColumns; track col.field) {
    <td
      [attr.data-title]="col.header"
      [class.column-pinned-start]="grid.columnPinnedSide(col) === 'start'"
      [class.column-pinned-end]="grid.columnPinnedSide(col) === 'end'"
      [style.left.px]="grid.columnStartOffset(col)"
      [style.right.px]="grid.columnEndOffset(col)"
    >
      @switch (col.type) {
        @case ('boolean') {
        <div
          class="form-check m-0 grid-edit-boolean"
          [class.is-invalid]="
            (grid.addForm.get(col.field)?.touched || grid.saveAttemptedNew) &&
            grid.addForm.get(col.field)?.invalid
          "
        >
          <input
            type="checkbox"
            class="form-check-input grid-edit-checkbox"
            [formControlName]="col.field"
            [attr.aria-label]="grid.inputAriaLabel(col)"
            [attr.aria-invalid]="
              (grid.addForm.get(col.field)?.touched || grid.saveAttemptedNew) &&
              grid.addForm.get(col.field)?.invalid
                ? 'true'
                : null
            "
            [attr.aria-describedby]="
              (grid.addForm.get(col.field)?.touched || grid.saveAttemptedNew) &&
              grid.addForm.get(col.field)?.invalid
                ? 'add-error-' + col.field
                : null
            "
          />
        </div>
        }

        @case ('select') {
        <select
          ngbDatagridControl
          [ngbDatagridControlMode]="'edit'"
          [class.is-invalid]="
            (grid.addForm.get(col.field)?.touched || grid.saveAttemptedNew) &&
            grid.addForm.get(col.field)?.invalid
          "
          [formControlName]="col.field"
          [attr.aria-label]="grid.inputAriaLabel(col)"
          [attr.aria-invalid]="
            (grid.addForm.get(col.field)?.touched || grid.saveAttemptedNew) &&
            grid.addForm.get(col.field)?.invalid
              ? 'true'
              : null
          "
          [attr.aria-describedby]="
            (grid.addForm.get(col.field)?.touched || grid.saveAttemptedNew) &&
            grid.addForm.get(col.field)?.invalid
              ? 'add-error-' + col.field
              : null
          "
        >
          @for (option of col.options ?? []; track option.value) {
            <option [ngValue]="option.value">{{ option.label }}</option>
          }
        </select>
        }

        @default {
        <input
          ngbDatagridControl
          [ngbDatagridControlMode]="'edit'"
          [class.is-invalid]="
            (grid.addForm.get(col.field)?.touched || grid.saveAttemptedNew) &&
            grid.addForm.get(col.field)?.invalid
          "
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
          [attr.aria-label]="grid.inputAriaLabel(col)"
          [attr.aria-invalid]="
            (grid.addForm.get(col.field)?.touched || grid.saveAttemptedNew) &&
            grid.addForm.get(col.field)?.invalid
              ? 'true'
              : null
          "
          [attr.aria-describedby]="
            (grid.addForm.get(col.field)?.touched || grid.saveAttemptedNew) &&
            grid.addForm.get(col.field)?.invalid
              ? 'add-error-' + col.field
              : null
          "
        />
        }
      }

      @if ((grid.addForm.get(col.field)?.touched || grid.saveAttemptedNew) && grid.addForm.get(col.field)?.errors; as e) {
        <div class="invalid-feedback d-block" [attr.id]="'add-error-' + col.field" role="alert">
          @if (e['required']) { Required }
          @if (e['email']) { Invalid email }
          @if (e['number']) { Invalid number }
          @if (e['date']) { Invalid date }
        </div>
      }
    </td>
    }

    @if (grid.showActionsColumn()) {
    <td class="text-center grid-actions-cell" [style.width.px]="grid.utilityColumnWidth('actions')">
      <div class="grid-actions-cell__inner">
        <button type="button" ngbDatagridButton="success" (click)="grid.saveAdd()" [disabled]="grid.addForm.invalid">
          Save
        </button>
        <button type="button" ngbDatagridButton="neutral" (click)="grid.cancelAdd()">
          Cancel
        </button>
      </div>
    </td>
    }
  `
})
export class NgbDatagridAddRowComponent {
  @Input({ required: true }) grid!: any;
}
