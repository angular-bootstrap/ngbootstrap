import { Directive, Input, OnChanges, OnInit, Optional, SimpleChanges } from '@angular/core';
import { NgbDatagridRowId } from '../../services/editing.service';
import { Datagrid } from '../datagrid.component';

export interface HighlightItem {
  row: NgbDatagridRowId;
  columnKey?: unknown;
}

type RowKeyFn = (row: unknown, rowIndex: number) => NgbDatagridRowId;
type ColKeyFn = (column: unknown, columnIndex: number) => unknown;

@Directive({
  selector: '[ngbGridHighlight]',
  standalone: true
})
export class NgbGridHighlightDirective implements OnInit, OnChanges {
  @Input('ngbGridHighlight') rowKey?: string | RowKeyFn;
  @Input() highlightColumnIndex?: string | ColKeyFn;
  @Input() highlightedIndex: HighlightItem[] = [];

  constructor(@Optional() private grid: Datagrid<unknown>) {}

  ngOnInit(): void {
    this.apply();
  }

  ngOnChanges(_ch: SimpleChanges): void {
    this.apply();
  }

  private apply() {
    if (!this.grid) return;
    this.grid.highlightRowKey = this.rowKey ?? null;
    this.grid.highlightColKey = this.highlightColumnIndex ?? null;
    this.grid.highlightedIndex = this.highlightedIndex ?? [];
    this.grid.updateHighlightCache();
  }
}
