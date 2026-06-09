import { Directive, Input, TemplateRef } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { ColumnDef } from '../models/column-def';
import { NgbCompositeFilterDescriptor, NgbFilterDescriptor, NgbFilterOperator } from '../models/filtering';

export interface CellCtx<T = any>   { $implicit: any; row: T; col: ColumnDef<T>; index: number; }
export interface EditCtx<T = any>   { $implicit: AbstractControl | null; control: AbstractControl | null; row: T; col: ColumnDef<T>; form: FormGroup; index: number; isNew: boolean; }
export interface FilterCtx<T = any> {
  $implicit: AbstractControl | null;
  control: AbstractControl | null;
  col: ColumnDef<T>;
  /** Column field name (same as `col.field`). */
  field: string;
  descriptor: NgbFilterDescriptor | null;
  /** Current composite filter root (clone). Use with `filterChange` for custom filter templates. */
  filter: NgbCompositeFilterDescriptor;
  operators: NgbFilterOperator[];
  setOperator: (operator: NgbFilterOperator) => void;
  setValue: (value: any) => void;
  clear: () => void;
  /** Replaces the grid filter state and emits `filterChange` when enabled. */
  filterChange: (filter: NgbCompositeFilterDescriptor) => void;
  /** Sets this column's field filter in the current descriptor and commits. */
  setFieldFilter: (operator: NgbFilterOperator, value?: any) => void;
}
export interface GlobalFilterCtx    { $implicit: AbstractControl; }

export interface PagerCtx<T = any> {
  grid: T;
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

@Directive({ selector: 'ng-template[ngbCell]', standalone: true })
export class NgbCellTemplate<T = any> {
  @Input('ngbCell') field!: string;
  constructor(public readonly template: TemplateRef<CellCtx<T>>) {}
}

@Directive({ selector: 'ng-template[ngbEditor]', standalone: true })
export class NgbEditorTemplate<T = any> {
  @Input('ngbEditor') field!: string;
  constructor(public readonly template: TemplateRef<EditCtx<T>>) {}
}

@Directive({ selector: 'ng-template[ngbFilter]', standalone: true })
export class NgbFilterTemplate<T = any> {
  @Input('ngbFilter') field!: string;
  constructor(public readonly template: TemplateRef<FilterCtx<T>>) {}
}

@Directive({ selector: 'ng-template[ngbFilterMenu]', standalone: true })
export class NgbFilterMenuTemplate<T = any> {
  @Input('ngbFilterMenu') field!: string;
  constructor(public readonly template: TemplateRef<FilterCtx<T>>) {}
}

@Directive({ selector: 'ng-template[ngbGlobalFilter]', standalone: true })
export class NgbGlobalFilterTemplate {
  constructor(public readonly template: TemplateRef<GlobalFilterCtx>) {}
}


@Directive({ selector: 'ng-template[ngbRowDetail]', standalone: true })
export class NgbRowDetailTemplate<T = any> {
  constructor(public readonly template: TemplateRef<{ $implicit: T; index: number }>) {}
}

@Directive({ selector: 'ng-template[ngbPager]', standalone: true })
export class NgbPagerTemplate<T = any> {
  constructor(public readonly template: TemplateRef<PagerCtx<T>>) {}
}

/** Handy constant to import in consumer apps */
export const DATAGRID_TEMPLATE_DIRECTIVES = [
  NgbCellTemplate,
  NgbEditorTemplate,
  NgbFilterTemplate,
  NgbFilterMenuTemplate,
  NgbGlobalFilterTemplate,
  NgbRowDetailTemplate,
  NgbPagerTemplate,
];
