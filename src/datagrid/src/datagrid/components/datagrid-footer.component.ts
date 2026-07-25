import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { NgbPagerComponent } from '../../../../pagination';
import { NgbDatagridPagerPosition, ngbDatagridPagerSettings } from '../../models/datagrid-pageable';
import type { Datagrid } from '../datagrid.component';

@Component({
  selector: 'ngb-datagrid-footer',
  standalone: true,
  imports: [CommonModule, NgbPagerComponent],
  template: `
    @if (grid().paginationActive && grid().pagerShowsAt(placement())) {
      @if (grid().hasCustomPagerTemplate()) {
      <div
        class="grid-footer grid-footer--custom"
        [class.grid-footer--top]="isTop()"
        [class.grid-footer--bottom]="isBottom()"
        [class.sticky-footer]="grid().isFooterSticky && isBottom()"
      >
        <ng-container
          *ngTemplateOutlet="grid().pagerTpl!.template; context: grid().pagerContext()"
        ></ng-container>
      </div>
      } @else {
        <div
          class="grid-footer"
          [class.grid-footer--top]="isTop()"
          [class.grid-footer--bottom]="isBottom()"
          [class.sticky-footer]="grid().isFooterSticky && isBottom()"
        >
          <ngb-pager
            [page]="grid().page"
            [pageSize]="grid().pageSize"
            [collectionSize]="grid().pagerCollectionSize()"
            [settings]="pagerSettings"
            [infoLabel]="grid().paginationRangeLabel()"
            [rowsPerPageLabel]="grid().rowsPerPageLabel()"
            [responsive]="grid().pagerResponsive()"
            (pageChange)="grid().onPage($event)"
            (pageSizeChange)="grid().onPageSize($event)"
          />
        </div>
      }
    }
  `,
})
export class NgbDatagridFooterComponent {
  readonly grid = input.required<Datagrid<any>>();
  readonly placement = input<NgbDatagridPagerPosition>('bottom');
  readonly isTop = computed(() => this.placement() === 'top');
  readonly isBottom = computed(() => this.placement() === 'bottom');

  get pagerSettings() {
    return ngbDatagridPagerSettings(this.grid().resolvedPageable());
  }
}
