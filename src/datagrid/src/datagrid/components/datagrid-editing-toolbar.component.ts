import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbDatagridButtonDirective } from '../../foundation/datagrid-button.directive';

@Component({
  selector: 'ngb-datagrid-editing-toolbar',
  standalone: true,
  imports: [CommonModule, NgbDatagridButtonDirective],
  template: `
    @if (grid.showEditingToolbar()) {
    <div class="datagrid-editing-toolbar">
      <div class="datagrid-editing-toolbar__start">
        @if (grid.enableAdd) {
        <button
          type="button"
          ngbDatagridButton="success"
          (click)="grid.startAdd()"
          [disabled]="editActive"
          [attr.aria-disabled]="editActive ? 'true' : null"
          [attr.aria-label]="grid.addButtonAriaLabel"
        >
          <span class="bi bi-plus-lg" aria-hidden="true"></span>
          <span>{{ grid.addButtonText }}</span>
        </button>
        }
        <button
          type="button"
          class="datagrid-editing-toolbar__save"
          ngbDatagridButton="primary"
          [hidden]="!editActive"
          (click)="grid.saveToolbarEdit()"
          [disabled]="saveDisabled"
          [attr.aria-disabled]="saveDisabled ? 'true' : null"
          [attr.aria-hidden]="editActive ? null : 'true'"
        >
          <span>Save</span>
        </button>
        @if (grid.enableDelete && selectedCount > 0 && !editActive) {
        <button
          type="button"
          ngbDatagridButton="danger"
          (click)="grid.deleteSelectedRows()"
          [disabled]="selectedCount === 0"
          [attr.aria-disabled]="selectedCount === 0 ? 'true' : null"
        >
          <span class="bi bi-trash" aria-hidden="true"></span>
          <span>Delete</span>
        </button>
        }
      </div>

      @if (selectedCount > 0) {
      <div class="datagrid-editing-toolbar__hint">
        {{ grid.toolbarEditHint }}
      </div>
      }

      <div class="datagrid-editing-toolbar__end">
        @if (grid.enableEdit && selectedCount > 0 && !editActive) {
        <button
          type="button"
          ngbDatagridButton="primary"
          (click)="grid.editSelectedRow()"
          [disabled]="selectedCount !== 1"
          [attr.aria-disabled]="selectedCount !== 1 ? 'true' : null"
        >
          <span class="bi bi-pencil" aria-hidden="true"></span>
          <span>Edit</span>
        </button>
        }
        <button
          type="button"
          class="datagrid-editing-toolbar__cancel"
          ngbDatagridButton="neutral"
          [hidden]="!editActive"
          (click)="grid.cancelToolbarEdit()"
          [attr.aria-hidden]="editActive ? null : 'true'"
        >
          <span>Cancel</span>
        </button>
      </div>
    </div>
    }
  `,
})
export class NgbDatagridEditingToolbarComponent {
  @Input({ required: true }) grid!: any;

  @Input() selectedCount = 0;

  @Input() editActive = false;

  @Input() saveDisabled = true;
}
