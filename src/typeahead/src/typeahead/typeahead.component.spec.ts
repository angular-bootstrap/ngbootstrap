import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NgbTypeaheadComponent } from './typeahead.component';
import { NgbTypeaheadItem } from './typeahead.types';

@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [NgbTypeaheadComponent],
  template: `
    <div>
    <ngb-typeahead
      [data]="items"
      [multiSelect]="multi"
      [chips]="chips"
      [updateOnTab]="updateOnTab"
      [limit]="limit"
      [vScroll]="vScroll"
      [vItemSize]="vItemSize"
      [debounceTime]="0"
      [characterTyped]="characterTyped"
      (selectedItems)="selected = $event"
      (selectionChange)="selectionChanges = selectionChanges + 1"
      (onScrollEvent)="scrolled = true"
    ></ngb-typeahead>
    <button type="button" class="btn btn-sm btn-secondary ms-2" id="after-typeahead">After</button>
    </div>
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
  vScroll = false;
  vItemSize = 40;
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

  it('exposes listbox options without adding suggestion tab stops', () => {
    host.multi = true;
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'a';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const list = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    expect(list.getAttribute('aria-multiselectable')).toBe('true');
    const options = Array.from(list.querySelectorAll<HTMLElement>('[role="option"]'));
    expect(options.length).toBeGreaterThan(0);
    expect(options.every(option => option.tabIndex === -1)).toBe(true);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(options.some(option => option.id === input.getAttribute('aria-activedescendant'))).toBe(true);
  });

  it('reports virtual positions and never retargets an active option on scroll', () => {
    host.vScroll = true;
    host.limit = 0;
    host.items = Array.from({length: 100}, (_, id) => ({id, label: `Account ${id}`}));
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.focus();
    input.value = 'Account';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const list: HTMLElement = fixture.nativeElement.querySelector('[role="listbox"]');
    expect(list.querySelector('[role="option"]')!.getAttribute('aria-setsize')).toBe('100');
    list.scrollTop = 40 * 30;
    list.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(list.querySelector('[role="option"]')!.getAttribute('aria-posinset')).toBe('31');
    expect(input.hasAttribute('aria-activedescendant')).toBe(false);
    input.dispatchEvent(new KeyboardEvent('keydown', {key: 'End'}));
    fixture.detectChanges();
    const active = document.getElementById(input.getAttribute('aria-activedescendant')!);
    expect(active?.getAttribute('aria-posinset')).toBe('100');
    expect(document.activeElement).toBe(input);
  });

  it('lets empty Tab and Shift+Tab leave chips without selecting a token', () => {
    host.multi = host.chips = true;
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    for (const shiftKey of [false, true]) {
      const event = new KeyboardEvent('keydown', {key: 'Tab', shiftKey, cancelable: true});
      input.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
    input.value = 'India';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Tab', shiftKey: true, cancelable: true}));
    expect(host.selected).toEqual([]);
  });

  it('does not commit tokens during IME composition', () => {
    host.multi = host.chips = true;
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.dispatchEvent(new CompositionEvent('compositionstart'));
    input.value = 'India';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', isComposing: true}));
    expect(host.selected).toEqual([]);
    input.dispatchEvent(new CompositionEvent('compositionend'));
    expect(host.typeahead.query).toBe('India');
  });

  it('names chip removal and returns focus to the input', () => {
    host.multi = host.chips = true;
    fixture.detectChanges();
    host.typeahead.selectItem(host.items[1]);
    fixture.detectChanges();
    const remove: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-label="Remove India"]');
    expect(remove).toBeTruthy();
    remove.focus();
    remove.click();
    fixture.detectChanges();
    expect(host.selected).toEqual([]);
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('input'));
  });

  it('keeps a retained active item by ID after replacement and clears a removed item', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.focus(); input.value = 'a'; input.dispatchEvent(new Event('input'));
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    input.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown'}));
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(host.typeahead.visible[host.typeahead.activeIndex].id).toBe(2);
    host.items = [host.items[1], host.items[0]];
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(host.typeahead.visible[host.typeahead.activeIndex].id).toBe(2);
    host.items = [host.items[1]];
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(host.typeahead.data).toEqual(host.items);
    expect(host.typeahead.activeIndex).toBe(-1);
    expect(input.hasAttribute('aria-activedescendant')).toBe(false);
  });

  it.each([0, 1, 2])('returns input focus after removing chip %i with one selection event', (index) => {
    host.multi = host.chips = true;
    fixture.detectChanges();
    host.items.forEach(item => host.typeahead.selectItem(item));
    fixture.detectChanges();
    const before = host.selectionChanges;
    const button: HTMLButtonElement = fixture.nativeElement.querySelectorAll('ngb-chips button')[index];
    button.focus(); button.click(); fixture.detectChanges();
    expect(host.selected.map(item => item.id)).toEqual(host.items.filter((_, i) => i !== index).map(item => item.id));
    expect(host.selectionChanges).toBe(before + 1);
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('input'));
  });

  it('prevents disabled selection changes and names removal actions for each chip', () => {
    host.multi = host.chips = true;
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(host.typeahead.multiSelect).toBe(true);
    host.items.forEach((item, index) => {host.typeahead.selectItem(item); expect(host.typeahead.selected.length).toBe(index + 1);});
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect([...fixture.nativeElement.querySelectorAll('ngb-chips button')].map((button: any) => button.getAttribute('aria-label')))
      .toEqual(['Remove USA', 'Remove India', 'Remove UAE']);
    const events = host.selectionChanges;
    host.typeahead.setDisabledState(true);
    host.typeahead.removeSelected(host.items[0]);
    host.typeahead.clearSelection();
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(host.selected.length).toBe(3);
    expect(host.selectionChanges).toBe(events);
    expect(fixture.nativeElement.querySelectorAll('ngb-chips button').length).toBe(0);
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

  it('virtualizes rendered options when vScroll is enabled', () => {
    host.items = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      label: `Item ${i}`,
      value: i,
    }));
    host.limit = 0;
    host.vScroll = true;
    host.vItemSize = 40;
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    input.value = 'Item';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.typeahead.filtered.length).toBe(10000);
    const buttons = fixture.debugElement.queryAll(By.css('button.dropdown-item'));
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons.length).toBeLessThan(30);
  });

  it('keeps focus on input when updateOnTab adds a chip', () => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
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

  it('supports keyboard navigation and selection keys', () => {
    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    input.focus();
    input.value = 'a';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.typeahead.overlayVisible).toBe(true);
    expect(host.typeahead.activeIndex).toBe(0);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    expect(host.typeahead.activeIndex).toBe(1);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    expect(host.typeahead.activeIndex).toBe(2);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    fixture.detectChanges();
    expect(host.typeahead.activeIndex).toBe(0);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    fixture.detectChanges();
    expect(host.typeahead.activeIndex).toBeGreaterThanOrEqual(0);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(host.selected.length).toBe(1);
    expect(host.typeahead.overlayVisible).toBe(false);
  });

  it('selects the highlighted item and closes on Tab without preventing default', () => {
    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    input.focus();
    input.value = 'a';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();

    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
    input.dispatchEvent(tabEvent);
    fixture.detectChanges();

    expect(tabEvent.defaultPrevented).toBe(false);
    expect(host.selected.length).toBe(1);
    expect(host.typeahead.overlayVisible).toBe(false);
  });

  it('hides the popup on Escape', () => {
    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    input.focus();
    input.value = 'a';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.typeahead.overlayVisible).toBe(true);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(host.typeahead.overlayVisible).toBe(false);
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
