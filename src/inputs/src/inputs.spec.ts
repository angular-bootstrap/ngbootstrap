import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgbNumericInputComponent } from './numeric-input.component';
import { NgbMaskedInputComponent } from './masked-input.component';
@Component({standalone: true, imports: [ReactiveFormsModule, NgbNumericInputComponent, NgbMaskedInputComponent], template: `
<ngb-numeric-input label="Amount" [formControl]="amount" [min]="0" [max]="10000" />
<ngb-masked-input label="Reference" mask="AA-0000" [formControl]="reference" />`})
class Host { amount = new FormControl<number | null>(10); reference = new FormControl<string | null>('AB1234'); }
function numeric(options: Partial<NgbNumericInputComponent> = {}) {
 const f = TestBed.createComponent(NgbNumericInputComponent);
 for (const [k,v] of Object.entries(options)) f.componentRef.setInput(k,v);
 f.detectChanges(); const input: HTMLInputElement = f.nativeElement.querySelector('input');
 const type = (text: string) => { input.dispatchEvent(new Event('focus')); input.value=text; input.dispatchEvent(new Event('input')); f.detectChanges(); };
 return {f,input,c:f.componentInstance,type};
}
function masked(mask='000-000', mode: 'raw'|'formatted'='raw') {
 const f=TestBed.createComponent(NgbMaskedInputComponent); f.componentRef.setInput('mask',mask); f.componentRef.setInput('valueMode',mode); f.detectChanges();
 const input: HTMLInputElement=f.nativeElement.querySelector('input');
 const type=(text:string)=>{input.value=text;input.setSelectionRange(text.length,text.length);input.dispatchEvent(new Event('input'));f.detectChanges();};
 return {f,input,c:f.componentInstance,type};
}
describe('Numeric input',()=>{
 it.each([['en-US','1,234.56',1234.56],['de-DE','1.234,56',1234.56],['fr-FR','1\u202f234,56',1234.56],['en-IN','1,23,456.7',123456.7],['en-US','0',0],['en-US','',null]])('parses %s %s',(locale,text,value)=>{
  const {c,type}=numeric({locale:locale as string});type(text as string);expect(c.commit()).toBe(true);expect(c.value).toBe(value);
 });
 it.each(['-','.','12abc','1,23','Infinity','1.2.3','1.2,3'])('rejects %s without replacing its model',text=>{
  const {c,type}=numeric({value:10});type(text);expect(c.commit()).toBe(false);expect(c.value).toBe(10);
 });
 it('parses negative currency, rounds once and does not react to wheel',()=>{
  const {c,input,type}=numeric({format:'currency',value:1});type('-$1,234.567');expect(c.commit()).toBe(true);expect(c.value).toBe(-1234.57);
  input.dispatchEvent(new WheelEvent('wheel',{deltaY:-1}));expect(c.value).toBe(-1234.57);
 });
 it('validates drafts in forms, commits once, and supports touched/disabled',()=>{
  const f=TestBed.createComponent(Host);f.detectChanges();const h=f.componentInstance;const input:HTMLInputElement=f.nativeElement.querySelector('input');
  const seen:unknown[]=[];h.amount.valueChanges.subscribe(v=>seen.push(v));
  input.dispatchEvent(new Event('focus'));input.value='-';input.dispatchEvent(new Event('input'));f.detectChanges();
  expect(h.amount.invalid).toBe(true);expect(h.amount.value).toBe(10);
  input.value='20.25';input.dispatchEvent(new Event('input'));input.dispatchEvent(new Event('blur'));f.detectChanges();
  expect(h.amount.value).toBe(20.25);expect(h.amount.valid).toBe(true);expect(h.amount.touched).toBe(true);
  expect(seen.filter(v=>v===20.25)).toHaveLength(1);h.amount.disable();f.detectChanges();expect(input.disabled).toBe(true);
 });
 it('uses fraction models for percentages and model units for bounded steps',()=>{
  const {c,input,type}=numeric({format:'percent',value:.05,step:.01,min:0,max:.1});type('7.25%');expect(c.commit()).toBe(true);expect(c.value).toBe(.0725);
  input.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp'}));expect(c.value).toBe(.0825);type('12');expect(c.commit()).toBe(false);
 });
 it('buffers composition and exposes the input label',()=>{
  const {c,input,f}=numeric({label:'Amount',value:5});expect(f.nativeElement.querySelector('label').htmlFor).toBe(input.id);
  input.dispatchEvent(new Event('compositionstart'));input.value='20';input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',isComposing:true}));expect(c.value).toBe(5);
  input.dispatchEvent(new Event('compositionend'));c.commit();expect(c.value).toBe(20);
 });
 it('preserves read-only values and rejects invalid configuration',()=>{
  const {c,input,f}=numeric({readOnly:true,value:2});input.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp'}));expect(c.value).toBe(2);
  f.componentRef.setInput('min',10);f.componentRef.setInput('max',1);f.detectChanges();expect(c.validate(new FormControl())).toEqual({numericConfiguration:true});
 });
});
describe('Masked input',()=>{
 it.each(['raw','formatted'] as const)('accepts paste and emits %s',mode=>{
  const {c,input,type}=masked('AA-0000',mode);type('AB-1234');expect(input.value).toBe('AB-1234');expect(c.value).toBe(mode==='raw'?'AB1234':'AB-1234');expect(c.validate(new FormControl())).toBeNull();
 });
 it('validates incomplete and required values',()=>{
  const {c,type,f}=masked();type('123');expect(c.validate(new FormControl())?.['mask']).toBeTruthy();f.componentRef.setInput('required',true);f.detectChanges();type('');expect(c.validate(new FormControl())).toEqual({required:true});
 });
 it('preserves invalid paste visibly without corrupting the model',()=>{
  const {c,type,input}=masked();type('123456');type('123x56');expect(c.value).toBe('123456');expect(input.value).toBe('123x56');expect(c.validate(new FormControl())?.['mask']).toBeTruthy();
 });
 it('deletes across literals with a predictable caret',()=>{
  const {c,type,input,f}=masked();type('123456');input.setSelectionRange(4,4);input.dispatchEvent(new InputEvent('beforeinput',{inputType:'deleteContentBackward',cancelable:true}));f.detectChanges();expect(c.value).toBe('12456');expect(input.value).toBe('124-56');expect(input.selectionStart).toBe(2);
 });
 it('preserves raw values that match escaped literal tokens',()=>{
  const {c,input,f}=masked('\\000');c.writeValue('01');f.detectChanges();expect(input.value).toBe('001');expect(c.validate(new FormControl())).toBeNull();
 });
 it('buffers composition and normalizes selection replacement',()=>{
  const {c,input,type,f}=masked();type('123456');
  input.dispatchEvent(new Event('compositionstart'));input.value='987654';input.dispatchEvent(new Event('input'));expect(c.value).toBe('123456');
  input.dispatchEvent(new Event('compositionend'));f.detectChanges();expect(input.value).toBe('987-654');expect(c.value).toBe('987654');
  input.setSelectionRange(0,3);input.setRangeText('111',0,3,'end');input.dispatchEvent(new Event('input'));f.detectChanges();expect(c.value).toBe('111654');
 });
 it('includes trailing literals',()=>{const {type,input}=masked('(000)');type('123');expect(input.value).toBe('(123)');});
 it('supports external form writes, touched and disabled',()=>{
  const f=TestBed.createComponent(Host);f.detectChanges();const h=f.componentInstance;const input:HTMLInputElement=f.nativeElement.querySelector('ngb-masked-input input');expect(input.value).toBe('AB-1234');h.reference.setValue('CD4567');f.detectChanges();expect(input.value).toBe('CD-4567');input.dispatchEvent(new Event('blur'));expect(h.reference.touched).toBe(true);h.reference.disable();f.detectChanges();expect(input.disabled).toBe(true);
 });
});
