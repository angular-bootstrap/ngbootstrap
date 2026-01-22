import { Directive, Input, OnChanges, OnInit, Optional, SimpleChanges } from '@angular/core';
import { Datagrid } from '../datagrid.component';

export interface HighlightItem {
  row: any;
  columnKey?: any;
}

type RowKeyFn = (row: any, rowIndex: number) => any;
type ColKeyFn = (column: any, columnIndex: number) => any;

@Directive({
  selector: '[ngbGridHighlight]',
  standalone: true
})
export class NgbGridHighlightDirective implements OnInit, OnChanges {
  @Input('ngbGridHighlight') rowKey?: string | RowKeyFn;
  @Input() highlightColumnIndex?: string | ColKeyFn;
  @Input() highlightedIndex: HighlightItem[] = [];

  constructor(@Optional() private grid: Datagrid<any>) {}

  ngOnInit(): void {
    this.apply();
  }

  ngOnChanges(_ch: SimpleChanges): void {
    this.apply();
  }

  private apply() {
    if (!this.grid) return;
    this.grid.highlightRowKey = this.rowKey;
    this.grid.highlightColKey = this.highlightColumnIndex;
    this.grid.highlightedIndex = this.highlightedIndex ?? [];
    this.grid.updateHighlightCache();
  }
}
