import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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
      [limit]="limit"
      [debounceTime]="0"
      [characterTyped]="1"
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
  selected: NgbTypeaheadItem[] = [];
  selectionChanges = 0;
  scrolled = false;
}

describe('NgbTypeaheadComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
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

    const btn = fixture.debugElement.queryAll(By.css('button.list-group-item'))[0].nativeElement as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();

    expect(host.selected.map((s) => s.label)).toEqual(['India']);
    expect(host.selectionChanges).toBeGreaterThan(0);
  });

  it('supports multi select', () => {
    host.multi = true;
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    input.value = 'a';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const buttons = fixture.debugElement.queryAll(By.css('button.list-group-item'));
    buttons[0].nativeElement.click();
    buttons[1].nativeElement.click();
    fixture.detectChanges();
    expect(host.selected.length).toBe(2);
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
});
