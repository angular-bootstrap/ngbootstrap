import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ColumnDef } from '../models/column-def';
import type { NgbMenuFilterConditionDraft } from '../models/filtering';
import { NgbDatagridButtonDirective } from '../foundation/datagrid-button.directive';
import { NgbDatagridControlDirective } from '../foundation/datagrid-control.directive';
import type { Datagrid } from '../datagrid/datagrid.component';
import type { NgbFilterOperator } from '../models/filtering';
import type { NgbDatagridToolHost } from './datagrid-tool-host';
import { resolveDatagridToolGrid } from './datagrid-tool-host';
import { NgbDatagridLayoutToolbarCoordinator } from './datagrid-layout-toolbar-coordinator';

@Component({
  selector: 'ngb-datagrid-filter-tool',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbDatagridButtonDirective, NgbDatagridControlDirective],
  template: `
    @if (filterableColumns.length) {
    <div class="ngb-layout-tool">
      <button
        type="button"
        class="ngb-layout-tool__trigger"
        [class.ngb-layout-tool__trigger--open]="open"
        (click)="togglePanel($event)"
        [attr.aria-expanded]="open"
        aria-haspopup="dialog"
      >
        <span class="bi bi-funnel" aria-hidden="true"></span>
        <span>{{ label }}</span>
      </button>

      @if (open) {
      <div class="ngb-layout-tool__panel ngb-layout-tool__panel--wide" (click)="$event.stopPropagation()">
        <div class="ngb-filter-accordion">
          @for (col of filterableColumns; track col.field) {
          <section class="ngb-filter-accordion__section">
            <button
              type="button"
              class="ngb-filter-accordion__header"
              (click)="toggleSection(col.field)"
              [attr.aria-expanded]="expandedField === col.field"
            >
              <span>{{ col.header }}</span>
              <span class="bi" [ngClass]="expandedField === col.field ? 'bi-chevron-up' : 'bi-chevron-down'" aria-hidden="true"></span>
            </button>

            @if (expandedField === col.field) {
            <div class="ngb-filter-accordion__body grid-filter-multi-panel">
              @for (condition of menuConditions(col); track $index; let conditionIndex = $index) {
                @if (conditionIndex > 0) {
                <div class="grid-filter-join-select">
                  <select
                    ngbDatagridControl
                    class="grid-filter-join-select__control"
                    [ngModel]="activeGrid.ensureMenuJoinLogic(col)"
                    (ngModelChange)="activeGrid.setMenuJoinLogic(col, $event)"
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
                  @for (op of operatorsFor(col); track op) {
                    <option [ngValue]="op">{{ activeGrid.rowFilterOperatorLabel(col, op) }}</option>
                  }
                </select>

                @switch (activeGrid.getColumnFilterType(col)) {
                  @case ('date') {
                  <input
                    ngbDatagridControl
                    class="grid-filter-value-input"
                    type="date"
                    [(ngModel)]="condition.value"
                    [disabled]="!activeGrid.operatorRequiresValue(condition.operator)"
                    [attr.aria-label]="'Filter value for ' + col.header"
                  />
                  }
                  @case ('boolean') {
                  <select
                    ngbDatagridControl
                    class="grid-filter-value-select"
                    [(ngModel)]="condition.value"
                    [disabled]="!activeGrid.operatorRequiresValue(condition.operator)"
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
                    [disabled]="!activeGrid.operatorRequiresValue(condition.operator)"
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
                    [type]="activeGrid.getColumnFilterType(col) === 'numeric' ? 'number' : 'text'"
                    [(ngModel)]="condition.value"
                    [disabled]="!activeGrid.operatorRequiresValue(condition.operator)"
                    [attr.aria-label]="'Filter value for ' + col.header"
                  />
                  }
                }
              }

              <div class="ngb-filter-accordion__actions grid-filter-menu-surface__actions--split">
                <button
                  type="button"
                  class="grid-filter-apply grid-filter-apply--secondary"
                  ngbDatagridButton="secondary"
                  [disabled]="!activeGrid.canApplyMenuFilter(col)"
                  (click)="applyColumn(col)"
                >
                  Filter
                </button>
                <button
                  type="button"
                  class="grid-filter-cancel grid-filter-cancel--secondary"
                  ngbDatagridButton="secondary"
                  [disabled]="!activeGrid.canClearMenuFilter(col)"
                  (click)="clearColumn(col)"
                >
                  Clear
                </button>
              </div>
            </div>
            }
          </section>
          }
        </div>

        <div class="ngb-layout-tool__footer">
          <button type="button" class="w-100" ngbDatagridButton="secondary" (click)="clearAll()">
            <span class="bi bi-funnel-fill" aria-hidden="true"></span>
            <span>Clear all filters</span>
          </button>
        </div>
      </div>
      }
    </div>
    }
  `,
  styleUrls: ['./datagrid-layout-toolbar.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class NgbDatagridFilterToolComponent implements NgbDatagridToolHost, OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly coordinator = inject(NgbDatagridLayoutToolbarCoordinator, { optional: true });

  /** Optional override when the tool is not inside `ngb-datagrid-layout-toolbar`. */
  @Input() grid?: Datagrid<any>;
  @Input() label = 'Filter';

  private toolbarGrid?: Datagrid<any>;

  open = false;
  expandedField: string | null = null;

  ngOnInit(): void {
    this.coordinator?.register('filter', () => this.closePanel());
  }

  ngOnDestroy(): void {
    this.coordinator?.unregister('filter');
  }

  bindHostGrid(grid: Datagrid<any>): void {
    this.toolbarGrid = grid;
  }

  private resolvedGrid(): Datagrid<any> | null {
    return this.grid ?? this.toolbarGrid ?? null;
  }

  get activeGrid(): Datagrid<any> {
    return resolveDatagridToolGrid(this.grid, this.toolbarGrid, 'ngb-datagrid-filter-tool');
  }

  get filterableColumns(): ColumnDef<any>[] {
    const grid = this.resolvedGrid();
    if (!grid) return [];
    return grid.visibleColumns.filter((col) => col.filterable && grid.isFilteringEnabled());
  }

  menuConditions(col: ColumnDef<any>): NgbMenuFilterConditionDraft[] {
    return this.activeGrid.ensureMenuDraftConditions(col);
  }

  togglePanel(event: MouseEvent): void {
    event.stopPropagation();
    const willOpen = !this.open;
    if (willOpen) this.coordinator?.openExclusive('filter');
    this.open = willOpen;
    if (this.open && !this.expandedField && this.filterableColumns.length) {
      this.expandedField = this.filterableColumns[0].field as string;
    }
    this.cdr.markForCheck();
  }

  private closePanel(): void {
    if (!this.open) return;
    this.open = false;
    this.cdr.markForCheck();
  }

  toggleSection(field: string): void {
    this.expandedField = this.expandedField === field ? null : field;
    this.cdr.markForCheck();
  }

  operatorsFor(col: ColumnDef<any>): NgbFilterOperator[] {
    return this.activeGrid.getAllowedOperators(col);
  }

  applyColumn(col: ColumnDef<any>): void {
    this.activeGrid.applyMenuFilter(col);
    this.cdr.markForCheck();
  }

  clearColumn(col: ColumnDef<any>): void {
    this.activeGrid.clearMenuFilter(col);
    this.cdr.markForCheck();
  }

  clearAll(): void {
    this.activeGrid.clearAllFilters();
    this.cdr.markForCheck();
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent): void {
    if (!this.open) return;
    if ((event.target as HTMLElement | null)?.closest('ngb-datagrid-filter-tool')) return;
    this.closePanel();
  }
}
