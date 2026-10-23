import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgbTypeaheadComponent } from '../../typeahead/src/typeahead/typeahead.component';
import { NgbSplitterComponent } from '../../splitter/src/splitter/splitter.component';
import { NgbSplitterPaneComponent } from '../../splitter/src/splitter/splitter-pane.component';

@Component({standalone: true, imports: [NgbSplitterComponent, NgbSplitterPaneComponent], template: `
<ngb-splitter><ngb-splitter-pane paneId="accounts" ariaLabel="Accounts">Accounts</ngb-splitter-pane>
<ngb-splitter-pane ariaLabel="Transactions">Transactions</ngb-splitter-pane></ngb-splitter>`})
class SplitterHost {}
describe('Control naming', () => {
  it.each([false, true])('labels the Typeahead native input (chips=%s)', chips => {
    const f = TestBed.createComponent(NgbTypeaheadComponent);
    for (const [key, value] of Object.entries({chips, multiSelect: chips, inputId:'branch', ariaLabel:'Branch', ariaLabelledBy:'branch-label', ariaDescribedBy:'branch-help'})) f.componentRef.setInput(key, value);
    f.detectChanges();
    const input: HTMLInputElement = f.nativeElement.querySelector('input');
    expect(input.id).toBe('branch');
    expect(input.getAttribute('aria-label')).toBe('Branch');
    expect(input.getAttribute('aria-labelledby')).toBe('branch-label');
    expect(input.getAttribute('aria-describedby')).toBe('branch-help');
  });
  it('names each separator and identifies its primary pane', () => {
    const f = TestBed.createComponent(SplitterHost); f.detectChanges();
    const separator: HTMLElement = f.nativeElement.querySelector('[role=separator]');
    expect(separator.getAttribute('aria-label')).toBe('Resize Accounts');
    expect(separator.getAttribute('aria-controls')).toBe('accounts');
    expect(f.nativeElement.querySelector('#accounts').getAttribute('aria-label')).toBe('Accounts');
  });
});
