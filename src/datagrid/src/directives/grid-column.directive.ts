import { Directive, Input } from '@angular/core';
import { ColumnDef, ColumnType } from '../models/column-def';
import { NgbColumnFilterType, NgbFilterOperator } from '../models/filtering';

@Directive({
  selector: 'ngb-grid-column',
  standalone: true
})
export class NgbGridColumnDirective<T = any> implements ColumnDef<T> {
  @Input() field!: Extract<keyof T, string>;
  @Input() header!: string;
  @Input() title?: string;
  @Input() cellTitle?: string | ((row: T) => string);
  @Input() sortable?: boolean;
  @Input() filterable?: boolean;
  @Input() filterType?: NgbColumnFilterType;
  @Input() defaultFilterOperator?: NgbFilterOperator;
  @Input() allowedFilterOperators?: NgbFilterOperator[];
  @Input() showFilterMenu?: boolean;
  @Input() showFilterRow?: boolean;
  @Input() showFilterOperator?: boolean;
  @Input() editable?: boolean;
  @Input() type?: ColumnType;
  @Input() options?: Array<{ label: string; value: any }>;
  @Input() width?: number;
  @Input() stackedGroup?: 'start' | 'center' | 'end';
  @Input() required?: boolean;
  @Input() hidden?: boolean;
  @Input() sticky?: boolean | 'start' | 'end';
  @Input() locked?: boolean;
  @Input() reorderable?: boolean;
  @Input() resizable?: boolean;
  @Input() minResizableWidth?: number;
  @Input() maxResizableWidth?: number;

  toColumnDef(): ColumnDef<T> {
    return {
      field: this.field,
      header: this.header,
      title: this.title,
      cellTitle: this.cellTitle,
      sortable: this.sortable,
      filterable: this.filterable,
      filterType: this.filterType,
      defaultFilterOperator: this.defaultFilterOperator,
      allowedFilterOperators: this.allowedFilterOperators,
      showFilterMenu: this.showFilterMenu,
      showFilterRow: this.showFilterRow,
      showFilterOperator: this.showFilterOperator,
      editable: this.editable,
      type: this.type,
      options: this.options,
      width: this.width,
      stackedGroup: this.stackedGroup,
      required: this.required,
      hidden: this.hidden,
      sticky: this.sticky,
      locked: this.locked,
      reorderable: this.reorderable,
      resizable: this.resizable,
      minResizableWidth: this.minResizableWidth,
      maxResizableWidth: this.maxResizableWidth
    };
  }
}

export const DATAGRID_COLUMN_DIRECTIVES = [NgbGridColumnDirective];
