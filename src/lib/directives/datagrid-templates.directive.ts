import { Directive, Input, TemplateRef } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { ColumnDef } from '../models/column-def';

export interface CellCtx<T = any>   { $implicit: any; row: T; col: ColumnDef<T>; index: number; }
export interface EditCtx<T = any>   { $implicit: AbstractControl | null; control: AbstractControl | null; row: T; col: ColumnDef<T>; form: FormGroup; index: number; isNew: boolean; }
export interface FilterCtx<T = any> { $implicit: AbstractControl | null; control: AbstractControl | null; col: ColumnDef<T>; }
export interface GlobalFilterCtx    { $implicit: AbstractControl; }

@Directive({ selector: 'ng-template[ngbCell]' })
export class NgbCellTemplate<T = any> {
  @Input('ngbCell') field!: string;
  constructor(public readonly template: TemplateRef<CellCtx<T>>) {}
}

@Directive({ selector: 'ng-template[ngbEditor]' })
export class NgbEditorTemplate<T = any> {
  @Input('ngbEditor') field!: string;
  constructor(public readonly template: TemplateRef<EditCtx<T>>) {}
}

@Directive({ selector: 'ng-template[ngbFilter]' })
export class NgbFilterTemplate<T = any> {
  @Input('ngbFilter') field!: string;
  constructor(public readonly template: TemplateRef<FilterCtx<T>>) {}
}

@Directive({ selector: 'ng-template[ngbGlobalFilter]' })
export class NgbGlobalFilterTemplate {
  constructor(public readonly template: TemplateRef<GlobalFilterCtx>) {}
}


@Directive({ selector: 'ng-template[ngbRowDetail]' })
export class NgbRowDetailTemplate<T = any> {
  constructor(public readonly template: TemplateRef<{ $implicit: T; index: number }>) {}
}


/** Handy constant to import in consumer apps */
export const DATAGRID_TEMPLATE_DIRECTIVES = [
  NgbCellTemplate, NgbEditorTemplate, NgbFilterTemplate, NgbGlobalFilterTemplate, NgbRowDetailTemplate
];
