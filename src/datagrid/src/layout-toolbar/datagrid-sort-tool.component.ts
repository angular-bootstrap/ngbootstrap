import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import type { ColumnDef } from '../models/column-def';
import type { Datagrid } from '../datagrid/datagrid.component';
import type { NgbDatagridToolHost } from './datagrid-tool-host';
import { resolveDatagridToolGrid } from './datagrid-tool-host';
import { NgbDatagridLayoutToolbarCoordinator } from './datagrid-layout-toolbar-coordinator';

@Component({
  selector: 'ngb-datagrid-sort-tool',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (sortableColumns.length) {
    <div class="ngb-layout-tool">
      <button
        type="button"
        class="ngb-layout-tool__trigger"
        [class.ngb-layout-tool__trigger--open]="open"
        (click)="togglePanel($event)"
        [attr.aria-expanded]="open"
        aria-haspopup="menu"
      >
        <span class="bi bi-arrow-down-up" aria-hidden="true"></span>
        <span>{{ label }}</span>
      </button>

      @if (open) {
      <div class="ngb-layout-tool__panel" (click)="$event.stopPropagation()">
        @for (col of sortableColumns; track col.field) {
        <button
          type="button"
          class="ngb-sort-list__item"
          [class.ngb-sort-list__item--active]="activeGrid.sort.active === col.field"
          (click)="toggleSort(col)"
        >
          <span>{{ col.header }}</span>
          @if (activeGrid.sort.active === col.field) {
          <span>
            {{ activeGrid.sort.direction === 'asc' ? '▲' : activeGrid.sort.direction === 'desc' ? '▼' : '' }}
          </span>
          }
        </button>
        }

        <div class="ngb-layout-tool__footer">
          <button type="button" class="w-100 btn btn-link text-decoration-none" (click)="clearSorting()">
            <span class="bi bi-x-lg" aria-hidden="true"></span>
            <span>Clear sorting</span>
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
export class NgbDatagridSortToolComponent implements NgbDatagridToolHost, OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly coordinator = inject(NgbDatagridLayoutToolbarCoordinator, { optional: true });

  @Input() grid?: Datagrid<any>;
  @Input() label = 'Sort';

  private toolbarGrid?: Datagrid<any>;

  open = false;

  ngOnInit(): void {
    this.coordinator?.register('sort', () => this.closePanel());
  }

  ngOnDestroy(): void {
    this.coordinator?.unregister('sort');
  }

  bindHostGrid(grid: Datagrid<any>): void {
    this.toolbarGrid = grid;
  }

  private resolvedGrid(): Datagrid<any> | null {
    return this.grid ?? this.toolbarGrid ?? null;
  }

  get activeGrid(): Datagrid<any> {
    return resolveDatagridToolGrid(this.grid, this.toolbarGrid, 'ngb-datagrid-sort-tool');
  }

  get sortableColumns(): ColumnDef<any>[] {
    const grid = this.resolvedGrid();
    if (!grid) return [];
    return grid.visibleColumns.filter((col) => grid.enableSorting && col.sortable !== false);
  }

  togglePanel(event: MouseEvent): void {
    event.stopPropagation();
    const willOpen = !this.open;
    if (willOpen) this.coordinator?.openExclusive('sort');
    this.open = willOpen;
    this.cdr.markForCheck();
  }

  private closePanel(): void {
    if (!this.open) return;
    this.open = false;
    this.cdr.markForCheck();
  }

  toggleSort(col: ColumnDef<any>): void {
    this.activeGrid.toggleSort(col.field as string);
    this.cdr.markForCheck();
  }

  clearSorting(): void {
    this.activeGrid.clearSorting();
    this.cdr.markForCheck();
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent): void {
    if (!this.open) return;
    if ((event.target as HTMLElement | null)?.closest('ngb-datagrid-sort-tool')) return;
    this.closePanel();
  }
}
