import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  QueryList,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbTypeaheadItem, NgbTypeaheadI18n } from './typeahead.types';

@Component({
  selector: 'ngb-typeahead',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-2">
      <input
        #inputEl
        type="text"
        class="form-control"
        [attr.placeholder]="i18n?.placeholder || 'Type to search'"
        [ngModel]="query"
        (ngModelChange)="onInput($event)"
        (keydown)="onKeydown($event)"
        aria-autocomplete="list"
        role="combobox"
        [attr.aria-expanded]="filtered.length > 0"
      />
    </div>

    <div
      #scroller
      class="border rounded list-group"
      style="max-height: 240px; overflow: auto;"
      role="listbox"
      (scroll)="onScroll($event)"
    >
      <div [style.height.px]="beforePadding"></div>
      <button
        *ngFor="let item of visible; trackBy: trackById"
        type="button"
        class="list-group-item list-group-item-action d-flex align-items-center justify-content-between"
        [class.active]="isSelected(item)"
        [attr.aria-selected]="isSelected(item)"
        (click)="selectItem(item)"
        [disabled]="item.disabled"
      >
        <ng-container *ngIf="itemTemplate; else defaultTpl" [ngTemplateOutlet]="itemTemplate" [ngTemplateOutletContext]="{ $implicit: item }"></ng-container>
        <ng-template #defaultTpl>
          <span>{{ item.label }}</span>
          <span *ngIf="multiSelect && isSelected(item)" class="badge bg-secondary">✓</span>
        </ng-template>
      </button>
      <div [style.height.px]="afterPadding"></div>

      <div *ngIf="!filtered.length" class="list-group-item text-muted text-center">
        {{ i18n?.noResults || 'No results' }}
      </div>
    </div>

    <div *ngIf="multiSelect && selected.length" class="mt-2 small text-muted">
      {{ selectionSummary }}
      <button type="button" class="btn btn-link btn-sm ps-1" (click)="clearSelection()">
        {{ i18n?.clearSelection || 'Clear' }}
      </button>
    </div>
  `,
})
export class NgbTypeaheadComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() data: NgbTypeaheadItem[] = [];
  @Input() debounceTime = 200;
  @Input() characterTyped = 1;
  @Input() limit = 10;
  @Input() selectExact = false;
  @Input() multiSelect = false;
  @Input() i18n?: NgbTypeaheadI18n;

  @ContentChild(TemplateRef) itemTemplate?: TemplateRef<any>;

  @Output() selectedItems = new EventEmitter<NgbTypeaheadItem[]>();
  @Output() selectionChange = new EventEmitter<NgbTypeaheadItem[]>();
  @Output() onChange = new EventEmitter<string>();
  @Output() onScrollEvent = new EventEmitter<void>();

  @ViewChild('scroller', { static: true }) scroller!: ElementRef<HTMLElement>;
  @ViewChild('inputEl', { static: true }) inputEl!: ElementRef<HTMLInputElement>;
  @ViewChildren('itemButton') itemButtons?: QueryList<ElementRef<HTMLButtonElement>>;

  query = '';
  filtered: NgbTypeaheadItem[] = [];
  visible: NgbTypeaheadItem[] = [];
  selected: NgbTypeaheadItem[] = [];

  viewportHeight = 240;
  itemHeight = 40;
  beforePadding = 0;
  afterPadding = 0;
  private debounceId?: ReturnType<typeof setTimeout>;

  ngAfterViewInit(): void {
    this.applyFilter('');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && !changes['data'].firstChange) {
      this.applyFilter(this.query);
    }
  }

  ngOnDestroy(): void {
    if (this.debounceId) {
      clearTimeout(this.debounceId);
    }
  }

  get selectionSummary() {
    if (!this.selected.length) return '';
    if (this.selected.length <= 2) {
      return this.selected.map((s) => s.label).join(', ');
    }
    const firstTwo = this.selected.slice(0, 2).map((s) => s.label).join(', ');
    return `${firstTwo} (+${this.selected.length - 2})`;
  }

  onInput(value: string) {
    this.query = value;
    this.onChange.emit(value);
    if (this.debounceId) clearTimeout(this.debounceId);
    if (this.debounceTime <= 0) {
      this.applyFilter(value);
    } else {
      this.debounceId = setTimeout(() => this.applyFilter(value), this.debounceTime);
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.focusSibling(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const first = this.visible[0];
      if (first) this.selectItem(first);
    }
  }

  onScroll(event: Event) {
    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop;
    this.onScrollEvent.emit();
    this.updateViewport(scrollTop);
  }

  selectItem(item: NgbTypeaheadItem) {
    if (!item || item.disabled) return;
    this.validateItem(item);
    if (this.multiSelect) {
      const exists = this.selected.find((s) => s.id === item.id);
      if (exists) {
        this.selected = this.selected.filter((s) => s.id !== item.id);
      } else {
        this.selected = [...this.selected, item];
      }
    } else {
      this.selected = [item];
    }
    this.selectedItems.emit(this.selected);
    this.selectionChange.emit(this.selected);
  }

  clearSelection() {
    this.selected = [];
    this.selectedItems.emit(this.selected);
    this.selectionChange.emit(this.selected);
  }

  isSelected(item: NgbTypeaheadItem) {
    return this.selected.some((s) => s.id === item.id);
  }

  trackById = (_: number, item: NgbTypeaheadItem) => item.id;

  private applyFilter(value: string) {
    const term = (value || '').toLowerCase();
    const meetsThreshold = term.length >= this.characterTyped;
    const base = meetsThreshold ? this.data.filter((d) => (d.label || '').toLowerCase().includes(term)) : [];
    const limited = this.limit ? base.slice(0, this.limit) : base;
    this.filtered = limited;
    if (this.selectExact && limited.length === 1) {
      this.selectItem(limited[0]);
    }
    this.updateViewport(this.scroller?.nativeElement.scrollTop || 0);
  }

  private updateViewport(scrollTop: number) {
    const total = this.filtered.length;
    const visibleCount = Math.ceil(this.viewportHeight / this.itemHeight) + 2;
    const start = Math.max(Math.floor(scrollTop / this.itemHeight), 0);
    const end = Math.min(start + visibleCount, total);
    this.beforePadding = start * this.itemHeight;
    this.afterPadding = Math.max(total - end, 0) * this.itemHeight;
    this.visible = this.filtered.slice(start, end);
  }

  private focusSibling(direction: 1 | -1) {
    const buttons = this.scroller?.nativeElement.querySelectorAll<HTMLButtonElement>('button.list-group-item');
    if (!buttons || buttons.length === 0) return;
    const active = document.activeElement as HTMLButtonElement;
    const index = Array.prototype.indexOf.call(buttons, active);
    const next = buttons[index + direction] || buttons[(index + direction + buttons.length) % buttons.length];
    next?.focus();
  }

  private validateItem(item: NgbTypeaheadItem) {
    if (this.itemTemplate) {
      if (item.id == null || (item.value == null && item.value !== 0)) {
        throw new Error('Custom templates require items to provide both id and value.');
      }
    }
  }
}
