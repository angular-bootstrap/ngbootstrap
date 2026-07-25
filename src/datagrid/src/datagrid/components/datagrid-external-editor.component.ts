import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbDatagridButtonDirective } from '../../foundation/datagrid-button.directive';
import { NgbDatagridControlDirective } from '../../foundation/datagrid-control.directive';
import type { Datagrid } from '../datagrid.component';

@Component({
  selector: 'ngb-datagrid-external-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbDatagridButtonDirective, NgbDatagridControlDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (grid.externalEditOpen) {
    <div
      class="grid-external-editor"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="grid.externalEditIsNew ? 'Add record' : 'Edit record'"
    >
      <button type="button" class="grid-external-editor__backdrop" (click)="grid.cancelExternalEdit()" aria-label="Close dialog"></button>

      <div class="grid-external-editor__panel">
        <div class="grid-external-editor__header">
          <h3 class="grid-external-editor__title">{{ grid.externalEditIsNew ? 'Add Record' : 'Edit Record' }}</h3>
          <button type="button" class="grid-external-editor__close" (click)="grid.cancelExternalEdit()" aria-label="Close">
            <span class="bi bi-x-lg" aria-hidden="true"></span>
          </button>
        </div>

        <form class="grid-external-editor__form" [formGroup]="grid.externalForm" (ngSubmit)="grid.saveExternalEdit()">
          @for (col of grid.externalEditableColumns; track col.field) {
          <label class="grid-external-editor__field">
            <span class="grid-external-editor__label">{{ col.header }}</span>
            @switch (col.type) {
              @case ('boolean') {
              <div class="form-check m-0">
                <input type="checkbox" class="form-check-input" [formControlName]="col.field" [attr.aria-label]="col.header" />
              </div>
              }
              @case ('select') {
              <select ngbDatagridControl [formControlName]="col.field" [attr.aria-label]="col.header">
                @for (o of col.options ?? []; track o.value) {
                  <option [ngValue]="o.value">{{ o.label }}</option>
                }
              </select>
              }
              @default {
              <input
                ngbDatagridControl
                [attr.type]="col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : col.type === 'email' ? 'email' : 'text'"
                [formControlName]="col.field"
                [attr.aria-label]="col.header"
              />
              }
            }
            @if (grid.externalForm.get(col.field)?.touched && grid.externalForm.get(col.field)?.invalid) {
              <span class="grid-external-editor__error">Invalid value</span>
            }
          </label>
          }

          <div class="grid-external-editor__actions">
            <button type="submit" ngbDatagridButton="primary" [disabled]="grid.externalForm.invalid">Save</button>
            <button type="button" ngbDatagridButton="neutral" (click)="grid.cancelExternalEdit()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
    }
  `,
})
export class NgbDatagridExternalEditorComponent {
  @Input({ required: true }) grid!: Datagrid<any>;
}
