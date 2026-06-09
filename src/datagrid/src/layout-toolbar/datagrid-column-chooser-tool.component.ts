import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbDatagridButtonDirective } from '../foundation/datagrid-button.directive';
import { NgbDatagridControlDirective } from '../foundation/datagrid-control.directive';
import type { Datagrid } from '../datagrid/datagrid.component';
import type { NgbDatagridToolHost } from './datagrid-tool-host';
import { resolveDatagridToolGrid } from './datagrid-tool-host';
import { NgbDatagridLayoutToolbarCoordinator } from './datagrid-layout-toolbar-coordinator';

@Component({
  selector: 'ngb-datagrid-column-chooser-tool',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbDatagridButtonDirective, NgbDatagridControlDirective],
  template: `
    @if (chooserColumns.length) {
    <div class="ngb-layout-tool">
      <button
        type="button"
        class="ngb-layout-tool__trigger"
        [class.ngb-layout-tool__trigger--open]="open"
        (click)="togglePanel($event)"
        [attr.aria-expanded]="open"
        aria-haspopup="dialog"
      >
        <span class="bi bi-layout-three-columns" aria-hidden="true"></span>
        <span>{{ label }}</span>
      </button>

      @if (open) {
      <div class="ngb-layout-tool__panel ngb-layout-tool__panel--end ngb-layout-tool__panel--wide" (click)="$event.stopPropagation()">
        <div class="ngb-column-chooser__search">
          <input
            ngbDatagridControl
            type="search"
            [(ngModel)]="searchTerm"
            placeholder="Search..."
            aria-label="Search columns"
          />
        </div>

        <div class="ngb-column-chooser__list">
          <label class="ngb-column-chooser__option">
            <input type="checkbox" [checked]="allVisible" [indeterminate]="partiallyVisible" (change)="toggleAll()" />
            <span>Select all</span>
          </label>

          @for (col of filteredColumns; track col.field) {
            <label class="ngb-column-chooser__option">
              <input type="checkbox" [checked]="draftVisibility[col.field]" (change)="toggleColumn(col.field)" />
              <span>{{ col.header }}</span>
            </label>
          }
        </div>

        <div class="ngb-column-chooser__summary">{{ selectedCount }} Selected items</div>

        <div class="ngb-column-chooser__actions">
          <button type="button" ngbDatagridButton="primary" (click)="apply()">
            <span class="bi bi-check-lg" aria-hidden="true"></span>
            <span>Apply</span>
          </button>
          <button type="button" ngbDatagridButton="secondary" (click)="resetDraft()">
            <span class="bi bi-arrow-counterclockwise" aria-hidden="true"></span>
            <span>Reset</span>
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
export class NgbDatagridColumnChooserToolComponent implements OnChanges, OnInit, OnDestroy, NgbDatagridToolHost {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly coordinator = inject(NgbDatagridLayoutToolbarCoordinator, { optional: true });

  @Input() grid?: Datagrid<any>;
  @Input() label = 'Columns';

  private toolbarGrid?: Datagrid<any>;

  open = false;
  searchTerm = '';
  draftVisibility: Record<string, boolean> = {};

  bindHostGrid(grid: Datagrid<any>): void {
    this.toolbarGrid = grid;
    this.resetDraft(false);
    this.cdr.markForCheck();
  }

  private resolvedGrid(): Datagrid<any> | null {
    return this.grid ?? this.toolbarGrid ?? null;
  }

  get activeGrid(): Datagrid<any> {
    return resolveDatagridToolGrid(this.grid, this.toolbarGrid, 'ngb-datagrid-column-chooser-tool');
  }

  get chooserColumns() {
    const grid = this.resolvedGrid();
    return grid?.resolvedColumns ?? [];
  }

  get filteredColumns() {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) return this.chooserColumns;
    return this.chooserColumns.filter((col) =>
      col.header.toLowerCase().includes(query) || (col.field as string).toLowerCase().includes(query)
    );
  }

  get selectedCount(): number {
    return Object.values(this.draftVisibility).filter(Boolean).length;
  }

  get allVisible(): boolean {
    return this.chooserColumns.every((col) => this.draftVisibility[col.field as string]);
  }

  get partiallyVisible(): boolean {
    const count = this.selectedCount;
    return count > 0 && count < this.chooserColumns.length;
  }

  ngOnInit(): void {
    this.coordinator?.register('columns', () => this.closePanel());
    if (this.resolvedGrid()) {
      this.resetDraft(false);
    }
  }

  ngOnDestroy(): void {
    this.coordinator?.unregister('columns');
  }

  ngOnChanges(): void {
    this.resetDraft(false);
  }

  togglePanel(event: MouseEvent): void {
    event.stopPropagation();
    const willOpen = !this.open;
    if (willOpen) this.coordinator?.openExclusive('columns');
    this.open = willOpen;
    if (this.open) this.resetDraft(false);
    this.cdr.markForCheck();
  }

  private closePanel(): void {
    if (!this.open) return;
    this.open = false;
    this.cdr.markForCheck();
  }

  toggleColumn(field: string): void {
    this.draftVisibility[field] = !this.draftVisibility[field];
    this.cdr.markForCheck();
  }

  toggleAll(): void {
    const next = !this.allVisible;
    for (const col of this.chooserColumns) {
      this.draftVisibility[col.field as string] = next;
    }
    this.cdr.markForCheck();
  }

  apply(): void {
    this.activeGrid.applyColumnVisibility(this.draftVisibility);
    this.open = false;
    this.cdr.markForCheck();
  }

  resetDraft(mark = true): void {
    const next: Record<string, boolean> = {};
    for (const col of this.chooserColumns) {
      next[col.field as string] = !col.hidden;
    }
    this.draftVisibility = next;
    if (mark) this.cdr.markForCheck();
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent): void {
    if (!this.open) return;
    if ((event.target as HTMLElement | null)?.closest('ngb-datagrid-column-chooser-tool')) return;
    this.closePanel();
  }
}
