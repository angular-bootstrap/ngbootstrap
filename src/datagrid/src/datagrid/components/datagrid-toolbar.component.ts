import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbDatagridButtonDirective } from '../../foundation/datagrid-button.directive';
import { NgbDatagridFieldShellComponent } from '../../foundation/datagrid-field-shell.component';
import type { Datagrid } from '../datagrid.component';

@Component({
  selector: 'ngb-datagrid-toolbar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbDatagridButtonDirective, NgbDatagridFieldShellComponent],
  template: `
    @if (grid.exportOptions?.enabled || (grid.enableAdd && !grid.isToolbarEditMode()) || grid.enableGlobalFilter) {
    <div
      class="datagrid-toolbar"
    >
      @if (grid.enableGlobalFilter) {
      <div class="datagrid-toolbar__search">
        @if (grid.globalTpl) {
          <ng-container
            [ngTemplateOutlet]="grid.globalTpl?.template"
            [ngTemplateOutletContext]="{ $implicit: grid.globalFilterCtrl }"
          >
          </ng-container>
        } @else {
          <div class="datagrid-toolbar__search-label">Search</div>
          <ngb-datagrid-field-shell icon="search">
            <div class="datagrid-toolbar__search-shell">
              <span class="bi bi-search datagrid-toolbar__search-icon" aria-hidden="true"></span>
              <input
                type="search"
                class="datagrid-toolbar__search-input"
                [placeholder]="grid.globalFilterPlaceholder"
                [formControl]="grid.globalFilterCtrl"
                [attr.aria-label]="grid.globalFilterAriaLabel"
              />
            </div>
          </ngb-datagrid-field-shell>
        }
      </div>
      }

      @if (grid.exportOptions?.enabled || (grid.enableAdd && !grid.isToolbarEditMode())) {
      <div class="datagrid-toolbar__actions">
        @if (grid.exportOptions?.enabled && grid.exportButtonTpl) {
          <ng-container
            [ngTemplateOutlet]="grid.exportButtonTpl"
            [ngTemplateOutletContext]="{ $implicit: grid.triggerExport.bind(grid) }"
          >
          </ng-container>
        } @else {
          @if (grid.exportOptions?.enabled && (grid.exportOptions.type === 'pdf' || grid.exportOptions.type === 'both')) {
          <button
            type="button"
            ngbDatagridButton="secondary"
            class="datagrid-toolbar__button"
            [disabled]="grid.exporting"
            (click)="grid.export('pdf')"
            [attr.aria-label]="grid.exportAriaLabel('pdf')"
          >
            <span class="bi bi-filetype-pdf" aria-hidden="true"></span>
            <span>PDF</span>
          </button>
          }
          @if (grid.exportOptions?.enabled && (grid.exportOptions.type === 'excel' || grid.exportOptions.type === 'both')) {
          <button
            type="button"
            ngbDatagridButton="secondary"
            class="datagrid-toolbar__button"
            [disabled]="grid.exporting"
            (click)="grid.export('excel')"
            [attr.aria-label]="grid.exportAriaLabel('excel')"
          >
            <span class="bi bi-file-earmark-spreadsheet" aria-hidden="true"></span>
            <span>Excel</span>
          </button>
          }
        }

        @if (grid.enableAdd) {
        <button
          type="button"
          ngbDatagridButton="primary"
          class="datagrid-toolbar__button"
          (click)="grid.startAdd()"
          [disabled]="grid.addingNew"
          [attr.aria-label]="grid.addButtonAriaLabel || grid.addButtonText"
        >
          <span class="bi bi-plus-lg" aria-hidden="true"></span>
          <span>{{ grid.addButtonText }}</span>
        </button>
        }
      </div>
      }
    </div>
    }
  `
})
export class NgbDatagridToolbarComponent {
  @Input({ required: true }) grid!: Datagrid<any>;
}
