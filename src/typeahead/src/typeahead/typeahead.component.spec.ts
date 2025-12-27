import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NgbTypeaheadComponent } from './typeahead.component';
import { NgbTypeaheadItem } from './typeahead.types';

@Component({
  standalone: true,
  imports: [NgbTypeaheadComponent],
  template: `
    <ngb-typeahead
      [data]="items"
      [multiSelect]="multi"
      [chips]="chips"
      [updateOnTab]="updateOnTab"
      [limit]="limit"
      [debounceTime]="0"
      [characterTyped]="characterTyped"
      (selectedItems)="selected = $event"
      (selectionChange)="selectionChanges = selectionChanges + 1"
      (onScrollEvent)="scrolled = true"
    ></ngb-typeahead>
  `,
})
class HostComponent {
  @ViewChild(NgbTypeaheadComponent) typeahead!: NgbTypeaheadComponent;
  items: NgbTypeaheadItem[] = [
    { id: 1, label: 'USA', value: 'usa' },
    { id: 2, label: 'India', value: 'india' },
    { id: 3, label: 'UAE', value: 'uae' },
  ];
  limit = 10;
  multi = false;
  chips = false;
  updateOnTab = true;
  characterTyped = 1;
  selected: NgbTypeaheadItem[] = [];
  selectionChanges = 0;
  scrolled = false;
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, NgbTypeaheadComponent],
  template: `
    <form [formGroup]="form">
      <ngb-typeahead [data]="items" formControlName="country" [debounceTime]="0" [characterTyped]="1"></ngb-typeahead>
    </form>
  `,
})
class ReactiveHostSingleComponent {
  items: NgbTypeaheadItem[] = [
    { id: 1, label: 'USA', value: 'usa' },
    { id: 2, label: 'India', value: 'india' },
    { id: 3, label: 'UAE', value: 'uae' },
  ];
  form = new FormGroup({
    country: new FormControl('india'),
  });
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, NgbTypeaheadComponent],
  template: `
    <form [formGroup]="form">
      <ngb-typeahead
        [data]="items"
        [multiSelect]="true"
        formControlName="tags"
        [debounceTime]="0"
        [characterTyped]="1"
      ></ngb-typeahead>
    </form>
  `,
})
class ReactiveHostMultiComponent {
  @ViewChild(NgbTypeaheadComponent) typeahead!: NgbTypeaheadComponent;
  items: NgbTypeaheadItem[] = [
    { id: 1, label: 'USA', value: 'usa' },
    { id: 2, label: 'India', value: 'india' },
    { id: 3, label: 'UAE', value: 'uae' },
  ];
  form = new FormGroup({
    tags: new FormControl(['usa']),
  });
}

describe('NgbTypeaheadComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, ReactiveHostSingleComponent, ReactiveHostMultiComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('filters on input and selects single item', () => {
    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    input.value = 'Ind';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const btn = fixture.debugElement.queryAll(By.css('button.dropdown-item'))[0].nativeElement as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();

    expect(host.selected.map((s) => s.label)).toEqual(['India']);
    expect(host.selectionChanges).toBeGreaterThan(0);
  });

  it('writes the selected label back to the input and hides the suggestion list', () => {
    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    input.value = 'usa';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const btn = fixture.debugElement.query(By.css('button.dropdown-item')).nativeElement as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();

    expect(input.value).toBe('USA');
    expect(host.typeahead.overlayVisible).toBe(false);
  });

  it('supports multi select', () => {
    host.multi = true;
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    input.value = 'a';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const buttons = fixture.debugElement.queryAll(By.css('button.dropdown-item'));
    buttons[0].nativeElement.click();
    buttons[1].nativeElement.click();
    fixture.detectChanges();
    expect(host.selected.length).toBe(2);
  });

  it('reopens the overlay on focus after multi-select selection', () => {
    host.multi = true;
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    input.value = 'a';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const first = fixture.debugElement.query(By.css('button.dropdown-item')).nativeElement as HTMLButtonElement;
    first.click();
    fixture.detectChanges();

    expect(host.selected.length).toBe(1);

    (host.typeahead as any).hideOverlay();
    fixture.detectChanges();
    expect(host.typeahead.overlayVisible).toBe(false);

    input.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(host.typeahead.overlayVisible).toBe(true);
  });

  it('shows selected labels as a prefix when typing again in multi-select', () => {
    host.multi = true;
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    input.value = 'u';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const first = fixture.debugElement.query(By.css('button.dropdown-item')).nativeElement as HTMLButtonElement;
    first.click();
    fixture.detectChanges();

    expect(host.selected.map((s) => s.label)).toEqual(['USA']);
    expect(input.value).toBe('USA');

    // User types again; the component should keep selected labels and add a separator before the new query.
    input.value = 'USAi';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(input.value).toBe('USA, i');
  });

  it('emits scroll', () => {
    const scroller = fixture.debugElement.query(By.css('[role="listbox"]')).nativeElement as HTMLElement;
    scroller.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(host.scrolled).toBe(true);
  });

  it('handles 10k items within reasonable time', () => {
    host.items = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      label: `Item ${i}`,
      value: i,
    }));
    host.limit = 50;
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    const start = performance.now();
    input.value = 'Item 9';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const duration = performance.now() - start;

    expect(host.typeahead.filtered.length).toBe(50);
    expect(duration).toBeLessThan(150);
  });

  it('keeps focus on input when updateOnTab adds a chip', () => {
    host.multi = true;
    host.chips = true;
    host.updateOnTab = true;
    host.characterTyped = 999;
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    input.focus();
    input.value = 'foo';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    fixture.detectChanges();

    expect(host.selected.map((s) => s.label)).toEqual(['foo']);
    expect(document.activeElement).toBe(input);
  });

  it('supports formControlName (single select)', fakeAsync(() => {
    const reactiveFixture = TestBed.createComponent(ReactiveHostSingleComponent);
    reactiveFixture.detectChanges();
    tick();
    reactiveFixture.detectChanges();
    const reactiveHost = reactiveFixture.componentInstance;

    const input = reactiveFixture.debugElement.query(By.css('input.form-control')).nativeElement as HTMLInputElement;
    expect(input.value).toBe('India');

    input.value = 'ua';
    input.dispatchEvent(new Event('input'));
    reactiveFixture.detectChanges();

    const btn = reactiveFixture.debugElement.query(By.css('button.dropdown-item')).nativeElement as HTMLButtonElement;
    btn.click();
    reactiveFixture.detectChanges();

    expect(reactiveHost.form.value.country).toBe('uae');
  }));

  it('supports formControlName (multi select)', fakeAsync(() => {
    const reactiveFixture = TestBed.createComponent(ReactiveHostMultiComponent);
    reactiveFixture.detectChanges();
    tick();
    reactiveFixture.detectChanges();
    const reactiveHost = reactiveFixture.componentInstance;

    expect(reactiveHost.typeahead.selected.map((s) => s.value)).toEqual(['usa']);

    const input = reactiveFixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    input.value = 'in';
    input.dispatchEvent(new Event('input'));
    reactiveFixture.detectChanges();

    const btn = reactiveFixture.debugElement.query(By.css('button.dropdown-item')).nativeElement as HTMLButtonElement;
    btn.click();
    reactiveFixture.detectChanges();

    expect(reactiveHost.form.value.tags).toEqual(['usa', 'india']);
  }));

  it('disables the input when the form control is disabled', fakeAsync(() => {
    const reactiveFixture = TestBed.createComponent(ReactiveHostSingleComponent);
    reactiveFixture.detectChanges();
    tick();
    reactiveFixture.detectChanges();
    const reactiveHost = reactiveFixture.componentInstance;

    reactiveHost.form.get('country')!.disable();
    reactiveFixture.detectChanges();
    tick();
    reactiveFixture.detectChanges();

    const input = reactiveFixture.debugElement.query(By.css('input.form-control')).nativeElement as HTMLInputElement;
    expect(input.disabled).toBe(true);
  }));
});
