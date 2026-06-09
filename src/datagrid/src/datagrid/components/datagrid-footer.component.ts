import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbPagerComponent } from '../../../../pagination';
import { NgbDatagridPagerPosition, ngbDatagridPagerSettings } from '../../models/datagrid-pageable';

@Component({
  selector: 'ngb-datagrid-footer',
  standalone: true,
  imports: [CommonModule, NgbPagerComponent],
  template: `
    @if (grid.paginationActive && grid.pagerShowsAt(placement)) {
      @if (grid.hasCustomPagerTemplate()) {
      <div
        class="grid-footer grid-footer--custom"
        [class.grid-footer--top]="placement === 'top'"
        [class.grid-footer--bottom]="placement === 'bottom'"
        [class.sticky-footer]="grid.isFooterSticky && placement === 'bottom'"
      >
        <ng-container
          *ngTemplateOutlet="grid.pagerTpl!.template; context: grid.pagerContext()"
        ></ng-container>
      </div>
      } @else {
        <div
          class="grid-footer"
          [class.grid-footer--top]="placement === 'top'"
          [class.grid-footer--bottom]="placement === 'bottom'"
          [class.sticky-footer]="grid.isFooterSticky && placement === 'bottom'"
        >
          <ngb-pager
            [page]="grid.page"
            [pageSize]="grid.pageSize"
            [collectionSize]="grid.pagerCollectionSize()"
            [settings]="pagerSettings"
            [infoLabel]="grid.paginationRangeLabel()"
            [rowsPerPageLabel]="grid.rowsPerPageLabel()"
            [responsive]="grid.pagerResponsive()"
            (pageChange)="grid.onPage($event)"
            (pageSizeChange)="grid.onPageSize($event)"
          />
        </div>
      }
    }
  `,
})
export class NgbDatagridFooterComponent {
  @Input({ required: true }) grid!: any;

  @Input() placement: NgbDatagridPagerPosition = 'bottom';

  get pagerSettings() {
    return ngbDatagridPagerSettings(this.grid.resolvedPageable());
  }
}
