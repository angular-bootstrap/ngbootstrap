import { CommonModule } from '@angular/common';
import {
  AfterContentInit,
  Component,
  ContentChildren,
  Input,
  OnChanges,
  QueryList,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import type { Datagrid } from '../datagrid/datagrid.component';
import { NgbDatagridColumnChooserToolComponent } from './datagrid-column-chooser-tool.component';
import { NgbDatagridFilterToolComponent } from './datagrid-filter-tool.component';
import { NgbDatagridSortToolComponent } from './datagrid-sort-tool.component';
import type { NgbDatagridToolHost } from './datagrid-tool-host';
import { NgbDatagridLayoutToolbarCoordinator } from './datagrid-layout-toolbar-coordinator';

@Component({
  selector: 'ngb-datagrid-layout-toolbar',
  standalone: true,
  imports: [CommonModule],
  providers: [NgbDatagridLayoutToolbarCoordinator],
  template: `
    <div class="ngb-layout-toolbar" role="toolbar" [attr.aria-label]="ariaLabel">
      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ['./datagrid-layout-toolbar.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class NgbDatagridLayoutToolbarComponent implements AfterContentInit, OnChanges {
  /**
   * Grid instance for toolbar tools. Child tools inherit this via `bindHostGrid`
   * and do not need their own `[grid]` binding.
   */
  @Input({ required: true }) grid!: Datagrid<any>;
  @Input() ariaLabel = 'Grid layout toolbar';

  @ContentChildren(NgbDatagridFilterToolComponent) private filterTools?: QueryList<NgbDatagridFilterToolComponent>;
  @ContentChildren(NgbDatagridSortToolComponent) private sortTools?: QueryList<NgbDatagridSortToolComponent>;
  @ContentChildren(NgbDatagridColumnChooserToolComponent) private columnTools?: QueryList<NgbDatagridColumnChooserToolComponent>;

  ngAfterContentInit(): void {
    this.syncToolHosts();
    this.filterTools?.changes.subscribe(() => this.syncToolHosts());
    this.sortTools?.changes.subscribe(() => this.syncToolHosts());
    this.columnTools?.changes.subscribe(() => this.syncToolHosts());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['grid']) this.syncToolHosts();
  }

  private syncToolHosts(): void {
    if (!this.grid) return;
    const tools: NgbDatagridToolHost[] = [
      ...(this.filterTools ?? []),
      ...(this.sortTools ?? []),
      ...(this.columnTools ?? []),
    ];
    tools.forEach((tool) => tool.bindHostGrid(this.grid));
  }
}

@Component({
  selector: 'ngb-datagrid-layout-toolbar-spacer',
  standalone: true,
  template: `<div class="ngb-layout-toolbar__spacer" aria-hidden="true"></div>`,
  styleUrls: ['./datagrid-layout-toolbar.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class NgbDatagridLayoutToolbarSpacerComponent {}
