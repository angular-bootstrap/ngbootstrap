import { Component, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Datagrid } from '../../datagrid/src/datagrid/datagrid.component';
import { NgbEditorTemplate, NgbDataGridGroupFooterTemplateDirective } from '../../datagrid/src/directives/datagrid-templates.directive';
import { NgbDataGridHistoryDirective } from '../../datagrid/src/views/datagrid-history.directive';
import { NgbNumericInputComponent } from './numeric-input.component';
@Component({standalone:true, imports:[Datagrid, ReactiveFormsModule, NgbEditorTemplate, NgbNumericInputComponent, NgbDataGridGroupFooterTemplateDirective, NgbDataGridHistoryDirective],
template:`<ngb-datagrid ngbGridHistory [data]="rows" [columns]="columns" [dataOperations]="true" [enableEdit]="true"
  [groupable]="{showFooter:true}" [group]="groups">
  <ng-template ngbEditor="amount" let-control><ngb-numeric-input label="Amount" [formControl]="control" [min]="0" [max]="1000" [required]="true" /></ng-template>
  <ng-template ngbDatagridGroupFooterTemplate="amount" let-aggregates="aggregates"><span class="test-total">{{ aggregates['amount']?.sum }}</span></ng-template>
</ngb-datagrid>`})
class GridHost {
 @ViewChild(Datagrid) grid!: Datagrid;
 @ViewChild(NgbDataGridHistoryDirective) history!: NgbDataGridHistoryDirective;
 readonly rows = [{id:1,branch:'Central',amount:100},{id:2,branch:'Central',amount:200}];
 readonly columns = [{field:'id',header:'ID'}, {field:'branch',header:'Branch'}, {field:'amount',header:'Amount',editable:true,type:'number' as const,required:true}];
 readonly groups = [{field:'branch',dir:'asc' as const,aggregates:[{field:'amount',aggregate:'sum' as const}]}];
}
describe('Numeric grid editor and totals',()=>{
 it('keeps totals committed through invalid/save/cancel and undo/redo',async()=>{
  const f=TestBed.createComponent(GridHost);f.detectChanges();await f.whenStable();
  const {grid,history}=f.componentInstance;
  const total=()=>f.nativeElement.querySelector('.test-total')?.textContent.trim();
  expect(total()).toBe('300');
  grid.startEdit(0);f.detectChanges();await f.whenStable();
  const input:HTMLInputElement=f.nativeElement.querySelector('ngb-numeric-input input');
  const type=(text:string)=>{input.dispatchEvent(new Event('focus'));input.value=text;input.dispatchEvent(new Event('input'));f.detectChanges();};
  type('-');input.dispatchEvent(new Event('blur'));f.detectChanges();grid.saveEdit(0);f.detectChanges();
  expect(grid.editingIndex).toBe(0);expect(total()).toBe('300');expect(history.undoCount()).toBe(0);
  type('150.25');input.dispatchEvent(new Event('blur'));f.detectChanges();grid.saveEdit(0);f.detectChanges();await f.whenStable();f.detectChanges();
  expect(total()).toBe('350.25');expect(history.undoCount()).toBe(1);
  expect(history.undo().success).toBe(true);f.detectChanges();expect(total()).toBe('300');
  expect(history.redo().success).toBe(true);f.detectChanges();expect(total()).toBe('350.25');
  grid.startEdit(0);f.detectChanges();grid.editForm.get('amount')!.setValue(999);grid.cancelEdit(0);f.detectChanges();
  expect(total()).toBe('350.25');expect(history.undoCount()).toBe(1);
 });
});
