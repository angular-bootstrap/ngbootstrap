import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostListener,
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
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgbTypeaheadItem, NgbTypeaheadI18n } from './typeahead.types';
import { NgbChipsComponent } from '../../../chips/src/chips/chips.component';

@Component({
  selector: 'ngb-typeahead',
  standalone: true,
  imports: [CommonModule, NgbChipsComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NgbTypeaheadComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
      }

      .typeahead-root {
        position: relative;
      }

      .typeahead-chips-control {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.35rem;
        min-height: calc(1.5em + 0.75rem + 2px);
        padding: 0.375rem 0.75rem;
      }

      .typeahead-chips-control input {
        border: 0;
        outline: 0;
        flex: 1 1 9rem;
        min-width: 6rem;
        padding: 0;
        margin: 0;
        background: transparent;
      }

      .typeahead-chips-control input:focus {
        outline: 0;
        box-shadow: none;
      }

      .typeahead-panel {
        position: absolute;
        top: calc(100% + 0.25rem);
        left: 0;
        right: 0;
        z-index: 1050;
        max-height: 240px;
        overflow: auto;

        opacity: 0;
        transform: translateY(-0.25rem);
        pointer-events: none;
        transition:
          opacity 120ms ease,
          transform 120ms ease;
      }

      .typeahead-panel.show {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      .typeahead-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .typeahead-item-checkbox {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.15rem;
        height: 1.15rem;
      }
    `,
  ],
  template: `
    <div class="typeahead-root">
      <div class="input-group mb-2">
        <ng-container *ngIf="chips && multiSelect; else plainInput">
          <div class="form-control typeahead-chips-control" (click)="disabled ? null : focusInput()">
            <ngb-chips
              [items]="selected"
              [removable]="true"
              (remove)="removeSelected($event)"
              ariaLabel="Selected items"
            ></ngb-chips>
            <input
              #inputEl
              type="text"
              [disabled]="disabled"
              [attr.placeholder]="selected.length ? '' : (i18n?.placeholder || 'Type to search')"
              [value]="query"
              (input)="onNativeInput($event)"
              (focus)="onInputFocus($event)"
              (blur)="onInputBlur($event)"
              (keydown)="onKeydown($event)"
              (keyup)="onKeyup($event)"
              aria-autocomplete="list"
              role="combobox"
              [attr.aria-expanded]="overlayVisible"
              [attr.aria-controls]="overlayId"
              [attr.aria-activedescendant]="activeDescendantId"
            />
          </div>
        </ng-container>
        <ng-template #plainInput>
          <input
            #inputEl
            type="text"
            class="form-control"
            [disabled]="disabled"
            [attr.placeholder]="i18n?.placeholder || 'Type to search'"
            [value]="displayQuery"
            (input)="onNativeInput($event)"
            (focus)="onInputFocus($event)"
            (blur)="onInputBlur($event)"
            (keydown)="onKeydown($event)"
            (keyup)="onKeyup($event)"
            aria-autocomplete="list"
            role="combobox"
            [attr.aria-expanded]="overlayVisible"
            [attr.aria-controls]="overlayId"
            [attr.aria-activedescendant]="activeDescendantId"
          />
        </ng-template>

        <button
          *ngIf="showClearButton && (query || (!multiSelect && selected.length))"
          type="button"
          class="btn btn-outline-secondary"
          (click)="onClearClick($event)"
          [disabled]="disabled"
          [attr.aria-label]="i18n?.clear || 'Clear'"
        >
          &times;
        </button>

        <button
          *ngIf="showDropdownButton"
          type="button"
          class="btn btn-outline-secondary"
          (click)="onDropdownButtonClick($event)"
          [disabled]="disabled"
          [attr.aria-label]="i18n?.dropdownButtonLabel || 'Toggle suggestions'"
        >
          &#9662;
        </button>
      </div>

      <div
        #scroller
        class="dropdown-menu w-100 p-0 typeahead-panel"
        [class.show]="overlayVisible"
        [id]="overlayId"
        role="listbox"
        (scroll)="onScroll($event)"
      >
        <div [style.height.px]="beforePadding"></div>

        <button
          *ngFor="let item of visible; trackBy: trackById; let idx = index"
          type="button"
          class="dropdown-item"
          [class.active]="idx === activeIndex"
          [class.fw-semibold]="isSelected(item)"
          [attr.aria-selected]="isSelected(item)"
          [attr.id]="getOptionId(idx)"
          (click)="selectItem(item)"
          [disabled]="item.disabled"
        >
          <div class="typeahead-item">
            <span *ngIf="multiSelect" class="typeahead-item-checkbox">
              <input
                type="checkbox"
                class="form-check-input m-0"
                [checked]="isSelected(item)"
                [disabled]="item.disabled"
                tabindex="-1"
                aria-hidden="true"
              />
            </span>
            <ng-container *ngIf="resolvedItemTemplate as tpl; else defaultTpl">
              <ng-container
                [ngTemplateOutlet]="tpl"
                [ngTemplateOutletContext]="{
                  $implicit: item,
                  item: item,
                  query: query,
                  selected: isSelected(item),
                  index: idx
                }"
              ></ng-container>
            </ng-container>
            <ng-template #defaultTpl>
              <span>{{ item.label }}</span>
            </ng-template>
          </div>
        </button>

        <div [style.height.px]="afterPadding"></div>

        <div *ngIf="showNoResults" class="dropdown-item text-muted text-center">
          {{ i18n?.noResults || 'No results' }}
        </div>
      </div>

      <div *ngIf="multiSelect && selected.length" class="mt-2 small text-muted">
        {{ selectionSummary }}
        <button type="button" class="btn btn-link btn-sm ps-1" (click)="clearSelection()">
          {{ i18n?.clearSelection || 'Clear' }}
        </button>
      </div>
    </div>
  `,
})
export class NgbTypeaheadComponent implements AfterViewInit, OnChanges, OnDestroy, ControlValueAccessor {
  @Input() data: NgbTypeaheadItem[] = [];
  @Input() debounceTime = 200;
  @Input() characterTyped = 1;
  @Input() limit = 10;
  @Input() selectExact = false;
  @Input() multiSelect = false;
  @Input() matchSelection = false;
  @Input() showDropdownButton = false;
  @Input() showClearButton = false;
  @Input() updateOnBlur = false;
  @Input() updateOnTab = true;
  @Input() separator: string | string[] = ',';
  @Input() chips = false;
  // `TemplateRef` types can become non-assignable in monorepo setups with multiple Angular installations.
  // Using `any` keeps the API flexible while still supporting Angular templates at runtime.
  @Input() itemTemplate?: any;
  @Input() i18n?: NgbTypeaheadI18n;

  @ContentChild(TemplateRef) projectedItemTemplate?: any;

  @Output() completeMethod = new EventEmitter<string>();
  @Output() onSelect = new EventEmitter<NgbTypeaheadItem>();
  @Output() onUnselect = new EventEmitter<NgbTypeaheadItem>();
  @Output() onAdd = new EventEmitter<NgbTypeaheadItem>();
  @Output() onFocus = new EventEmitter<FocusEvent>();
  @Output() onBlur = new EventEmitter<FocusEvent>();
  @Output() onDropdownClick = new EventEmitter<MouseEvent>();
  @Output() onClear = new EventEmitter<Event>();
  @Output() onInputKeydown = new EventEmitter<KeyboardEvent>();
  @Output() onKeyUp = new EventEmitter<KeyboardEvent>();
  @Output() onShow = new EventEmitter<Event>();
  @Output() onHide = new EventEmitter<Event>();
  @Output() onLazyLoad = new EventEmitter<void>();

  @Output() selectedItems = new EventEmitter<NgbTypeaheadItem[]>();
  @Output() selectionChange = new EventEmitter<NgbTypeaheadItem[]>();
  @Output() onChange = new EventEmitter<string>();
  @Output() onScrollEvent = new EventEmitter<void>(); // legacy, kept for compatibility

  @ViewChild('scroller', { static: true }) scroller!: ElementRef<HTMLElement>;
  @ViewChild('inputEl') inputEl?: ElementRef<HTMLInputElement>;
  @ViewChildren('itemButton') itemButtons?: QueryList<ElementRef<HTMLButtonElement>>;

  disabled = false;
  query = '';
  filtered: NgbTypeaheadItem[] = [];
  visible: NgbTypeaheadItem[] = [];
  selected: NgbTypeaheadItem[] = [];
  overlayVisible = false;
  private openedByDropdown = false;
  private hasSearched = false;
  activeIndex = -1;
  private inputFocused = false;
  private pointerDownInside = false;
  private lastFilterTerm = '';
  private keepOpenOnEmpty = false;
  readonly overlayId = `ngb-typeahead-overlay-${Math.random().toString(36).slice(2)}`;

  viewportHeight = 240;
  itemHeight = 40;
  beforePadding = 0;
  afterPadding = 0;
  private debounceId?: ReturnType<typeof setTimeout>;

  private onControlChange: (value: any) => void = () => {};
  private onControlTouched: () => void = () => {};
  private controlValue: any = null;

  ngAfterViewInit(): void {
    // do not open overlay on init; just ensure viewport state is consistent
    this.applyFilter('');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && !changes['data'].firstChange) {
      this.applyFilter(this.query);
    }
    if (changes['data'] && this.controlValue != null && !this.inputFocused && !this.overlayVisible) {
      this.applyControlValue(this.controlValue);
    }
  }

  ngOnDestroy(): void {
    if (this.debounceId) {
      clearTimeout(this.debounceId);
    }
  }

  constructor(
    private host: ElementRef<HTMLElement>,
    private cdr: ChangeDetectorRef,
  ) {}

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent) {
    const target = event.target as Node | null;
    if (!target) return;

    const inside = this.host.nativeElement.contains(target);
    this.pointerDownInside = inside;
    if (inside) return;
    if (!this.overlayVisible) return;

    this.commitInputOnClose();
    this.hideOverlay(event);
  }

  @HostListener('document:focusin', ['$event'])
  onDocumentFocusIn(event: FocusEvent) {
    if (!this.overlayVisible) return;
    const target = event.target as Node | null;
    if (!target) return;
    if (this.host.nativeElement.contains(target)) return;

    this.commitInputOnClose();
    this.hideOverlay(event);
  }

  get activeDescendantId(): string | null {
    if (!this.overlayVisible) return null;
    if (this.activeIndex < 0 || this.activeIndex >= this.visible.length) return null;
    return this.getOptionId(this.activeIndex);
  }

  get showNoResults(): boolean {
    return this.overlayVisible && this.hasSearched && this.filtered.length === 0;
  }

  get displayQuery(): string {
    if (!this.multiSelect) {
      return this.query;
    }
    if (this.chips) {
      return this.query;
    }
    const term = (this.query || '').trim();
    const prefix = this.selected.map((s) => s.label).join(', ');
    if (!prefix) {
      return this.query;
    }
    if (term) {
      return `${prefix}, ${term}`;
    }
    return prefix;
  }

  get selectionSummary() {
    if (!this.selected.length) return '';
    if (this.selected.length <= 2) {
      return this.selected.map((s) => s.label).join(', ');
    }
    const firstTwo = this.selected.slice(0, 2).map((s) => s.label).join(', ');
    return `${firstTwo} (+${this.selected.length - 2})`;
  }

  get resolvedItemTemplate(): any {
    return this.itemTemplate ?? this.projectedItemTemplate;
  }

  writeValue(value: any): void {
    this.controlValue = value;
    this.applyControlValue(value);
  }

  private applyControlValue(value: any): void {
    if (this.multiSelect) {
      const asArray = Array.isArray(value) ? value : value == null ? [] : [value];
      const next = asArray.map((v) => this.coerceToItem(v)).filter(Boolean) as NgbTypeaheadItem[];
      const seen = new Set<string | number>();
      this.selected = next.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
      this.query = '';
      this.keepOpenOnEmpty = false;
      this.applyFilter('');
      this.cdr.markForCheck();
      return;
    }

    if (value == null) {
      this.selected = [];
      this.query = '';
      this.keepOpenOnEmpty = false;
      this.applyFilter('');
      this.cdr.markForCheck();
      return;
    }

    const item = this.coerceToItem(value);
    if (!item) return;
    this.selected = [item];
    this.query = item.label;
    if (this.inputEl?.nativeElement) {
      this.inputEl.nativeElement.value = item.label;
    }
    this.keepOpenOnEmpty = false;
    this.applyFilter(this.query);
    this.cdr.markForCheck();
  }

  registerOnChange(fn: any): void {
    this.onControlChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onControlTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.hideOverlay();
    }
    this.cdr.markForCheck();
  }

  onInput(value: string) {
    if (this.disabled) return;
    this.keepOpenOnEmpty = false;
    const trimmed = (value ?? '').trim();
    if (!this.multiSelect && this.selected.length) {
      const selectedLabel = (this.selected[0]?.label ?? '').trim();
      if (trimmed.toLowerCase() !== selectedLabel.toLowerCase()) {
        const previous = this.selected[0];
        this.selected = [];
        this.selectedItems.emit(this.selected);
        this.selectionChange.emit(this.selected);
        if (previous) {
          this.onUnselect.emit(previous);
        }
        this.propagateControlValue();
      }
    }

    if (this.chips && this.multiSelect) {
      const tokens = this.splitBySeparators(value);
      if (tokens.tokensToAdd.length) {
        for (const token of tokens.tokensToAdd) {
          this.addToken(token);
        }
      }
      this.query = tokens.remaining;
    } else {
      this.query = value;
    }
    this.onChange.emit(value);
    // Input events imply the user is interacting with the field; treat as focused so the overlay can open immediately.
    this.inputFocused = true;
    if (this.debounceId) clearTimeout(this.debounceId);
    if (this.debounceTime <= 0) {
      this.applyFilter(value);
      this.completeMethod.emit(value);
    } else {
      this.debounceId = setTimeout(() => {
        this.applyFilter(value);
        this.completeMethod.emit(value);
        this.cdr.markForCheck();
      }, this.debounceTime);
    }
  }

  onNativeInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    const value = target?.value ?? '';
    if (this.multiSelect && !this.chips && this.selected.length) {
      const prefix = this.selected.map((s) => s.label).join(', ');
      const normalizedPrefix = prefix.trim();
      if (normalizedPrefix && value.toLowerCase().startsWith(normalizedPrefix.toLowerCase())) {
        let rest = value.slice(normalizedPrefix.length);
        rest = rest.replace(/^[\s,]+/, '');
        this.onInput(rest);
        return;
      }
    }
    this.onInput(value);
  }

  onKeydown(event: KeyboardEvent) {
    if (this.disabled) return;
    this.onInputKeydown.emit(event);
    if (this.chips && this.multiSelect && event.key === 'Tab' && this.updateOnTab) {
      event.preventDefault();
      this.addToken((this.query || '').trim());
      this.focusInput();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveActive(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const active = this.visible[this.activeIndex] || this.visible[0];
      if (active) this.selectItem(active);
    } else if (event.key === 'Escape') {
      if (this.overlayVisible) {
        event.preventDefault();
        this.hideOverlay(event);
      }
    }
  }

  onKeyup(event: KeyboardEvent) {
    this.onKeyUp.emit(event);
  }

  onInputFocus(event: FocusEvent) {
    if (this.disabled) return;
    this.onFocus.emit(event);
    this.inputFocused = true;
    if (this.multiSelect && !this.overlayVisible) {
      // When multi-select is displaying the selection summary, start searching with a clean query.
      this.query = '';
      // After a multi-select session, re-opening the field should show the list again even with an empty query.
      if (!this.chips && this.selected.length) {
        this.keepOpenOnEmpty = true;
        this.applyFilter('');
        this.activatePreferredOption();
        return;
      }
    }
    // Opening behavior: only show overlay when threshold met, or dropdown button explicitly used.
    if (this.query.length >= this.characterTyped) {
      this.showOverlay(event);
    }
  }

  onInputBlur(event: FocusEvent) {
    this.onBlur.emit(event);
    this.onControlTouched();
    this.inputFocused = false;
    // Do not close on blur directly: scrolling/clicking within the overlay can blur the input.
    // Closing/commit is handled by outside click (document:mousedown) and focus moving outside (document:focusin).

    if (this.chips && this.multiSelect && this.updateOnBlur) {
      this.addToken((this.query || '').trim());
    }
  }

  onScroll(event: Event) {
    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop;
    this.onScrollEvent.emit();
    this.updateViewport(scrollTop);

    const remaining = target.scrollHeight - (target.scrollTop + target.clientHeight);
    if (remaining < 48) {
      this.onLazyLoad.emit();
    }
  }

  selectItem(item: NgbTypeaheadItem) {
    if (this.disabled) return;
    if (!item || item.disabled) return;
    this.validateItem(item);
    if (this.multiSelect) {
      const exists = this.selected.find((s) => s.id === item.id);
      if (exists) {
        this.selected = this.selected.filter((s) => s.id !== item.id);
        this.onUnselect.emit(item);
      } else {
        this.selected = [...this.selected, item];
        this.onSelect.emit(item);
      }
      this.propagateControlValue();
      // After selecting/unselecting, show the chosen values in the input and keep the panel open.
      this.keepOpenOnEmpty = true;
      if (this.chips) {
        this.query = '';
      } else {
        this.query = '';
      }
      this.applyFilter('');
    } else {
      if (this.selected.length && this.selected[0]?.id !== item.id) {
        this.onUnselect.emit(this.selected[0]);
      }
      this.selected = [item];
      this.query = item.label;
      if (this.inputEl?.nativeElement) {
        this.inputEl.nativeElement.value = item.label;
      }
      this.onSelect.emit(item);
      this.propagateControlValue();
      this.hideOverlay();
    }
    this.selectedItems.emit(this.selected);
    this.selectionChange.emit(this.selected);
    this.cdr.markForCheck();
  }

  focusInput() {
    this.inputEl?.nativeElement?.focus();
  }

  removeSelected(item: NgbTypeaheadItem) {
    if (this.disabled) return;
    if (!item) return;
    const exists = this.selected.find((s) => s.id === item.id);
    if (!exists) return;
    this.selected = this.selected.filter((s) => s.id !== item.id);
    this.onUnselect.emit(item);
    this.propagateControlValue();
    this.selectedItems.emit(this.selected);
    this.selectionChange.emit(this.selected);
    this.cdr.markForCheck();
  }

  clearSelection() {
    const previous = [...this.selected];
    this.selected = [];
    this.selectedItems.emit(this.selected);
    this.selectionChange.emit(this.selected);
    if (!this.multiSelect && previous[0]) {
      this.onUnselect.emit(previous[0]);
    }
    this.propagateControlValue();
    this.cdr.markForCheck();
  }

  isSelected(item: NgbTypeaheadItem) {
    return this.selected.some((s) => s.id === item.id);
  }

  trackById = (_: number, item: NgbTypeaheadItem) => item.id;

  getOptionId(index: number): string {
    return `${this.overlayId}-opt-${index}`;
  }

  onDropdownButtonClick(event: MouseEvent) {
    if (this.disabled) return;
    this.onDropdownClick.emit(event);
    if (this.overlayVisible) {
      this.hideOverlay(event);
      this.openedByDropdown = false;
    } else {
      this.openedByDropdown = true;
      if (this.scroller?.nativeElement) {
        this.scroller.nativeElement.scrollTop = 0;
      }
      this.showOverlay(event, true);
      // Show all items when the dropdown button is used, regardless of current query.
      this.applyFilter('');
      this.activatePreferredOption();
    }
    this.inputEl?.nativeElement.focus();
    this.cdr.markForCheck();
  }

  onClearClick(event: Event) {
    if (this.disabled) return;
    this.onClear.emit(event);
    this.query = '';
    this.clearSelection();
    this.applyFilter('');
    this.hideOverlay(event);
    this.inputEl?.nativeElement.focus();
    this.cdr.markForCheck();
  }

  private applyFilter(value: string) {
    const term = (value || '').toLowerCase();
    if (term !== this.lastFilterTerm) {
      this.lastFilterTerm = term;
      if (this.scroller?.nativeElement) {
        this.scroller.nativeElement.scrollTop = 0;
      }
    }
    const meetsThreshold = term.length >= this.characterTyped || this.openedByDropdown || (this.multiSelect && this.keepOpenOnEmpty);
    this.hasSearched = term.length >= this.characterTyped || this.openedByDropdown;

    const base = meetsThreshold ? this.data.filter((d) => (d.label || '').toLowerCase().includes(term)) : [];
    const limited = this.limit ? base.slice(0, this.limit) : base;
    this.filtered = limited;
    if (this.selectExact && limited.length === 1) {
      this.selectItem(limited[0]);
    }
    this.updateViewport(this.scroller?.nativeElement.scrollTop || 0);

    if (meetsThreshold && !this.overlayVisible && (this.inputFocused || this.openedByDropdown)) {
      this.showOverlay();
    }
    if (!meetsThreshold && this.overlayVisible && !this.openedByDropdown) {
      this.hideOverlay();
    }
    this.cdr.markForCheck();
  }

  private updateViewport(scrollTop: number) {
    const total = this.filtered.length;
    const visibleCount = Math.ceil(this.viewportHeight / this.itemHeight) + 2;
    const start = Math.max(Math.floor(scrollTop / this.itemHeight), 0);
    const end = Math.min(start + visibleCount, total);
    this.beforePadding = start * this.itemHeight;
    this.afterPadding = Math.max(total - end, 0) * this.itemHeight;
    this.visible = this.filtered.slice(start, end);
    this.activeIndex = this.visible.length ? Math.min(this.activeIndex, this.visible.length - 1) : -1;
  }

  private activatePreferredOption() {
    if (!this.filtered.length || !this.scroller?.nativeElement) {
      this.activeIndex = -1;
      return;
    }

    const trimmed = (this.query || '').trim().toLowerCase();
    let preferredIndex = -1;
    if (trimmed) {
      preferredIndex = this.filtered.findIndex((d) => (d.label || '').trim().toLowerCase() === trimmed);
    }
    if (preferredIndex === -1 && this.selected.length) {
      const firstSelected = this.selected[0];
      preferredIndex = this.filtered.findIndex((d) => d.id === firstSelected.id);
    }

    if (preferredIndex === -1) {
      preferredIndex = 0;
    }

    const scrollTop = Math.max(0, preferredIndex * this.itemHeight - this.itemHeight);
    this.scroller.nativeElement.scrollTop = scrollTop;
    this.updateViewport(scrollTop);

    const start = Math.max(Math.floor(scrollTop / this.itemHeight), 0);
    this.activeIndex = Math.max(0, Math.min(preferredIndex - start, this.visible.length - 1));
  }

  private moveActive(direction: 1 | -1) {
    if (!this.overlayVisible) {
      this.showOverlay();
    }
    if (!this.visible.length) return;

    const nextIndex = this.activeIndex < 0 ? 0 : (this.activeIndex + direction + this.visible.length) % this.visible.length;
    this.activeIndex = nextIndex;

    const buttons = this.scroller?.nativeElement.querySelectorAll<HTMLButtonElement>('button.dropdown-item');
    buttons?.[this.activeIndex]?.focus();
  }

  private validateItem(item: NgbTypeaheadItem) {
    if (item.id == null) {
      throw new Error('Typeahead items must include an id.');
    }
  }

  private showOverlay(event?: Event, openedByDropdown = false) {
    this.openedByDropdown = openedByDropdown;
    if (this.overlayVisible) return;
    this.overlayVisible = true;
    this.activeIndex = this.visible.length ? 0 : -1;
    this.onShow.emit(event ?? new Event('show'));
    this.cdr.markForCheck();
  }

  private hideOverlay(event?: Event) {
    if (!this.overlayVisible) return;
    this.overlayVisible = false;
    this.openedByDropdown = false;
    this.activeIndex = -1;
    this.onHide.emit(event ?? new Event('hide'));
    this.cdr.markForCheck();
  }

  private commitInputOnClose() {
    const trimmed = (this.query || '').trim();
    if (!trimmed) {
      return;
    }

    if (this.matchSelection) {
      const exact = this.data.find((d) => (d.label || '').toLowerCase() === trimmed.toLowerCase());
      if (!exact) {
        this.query = '';
        if (!this.multiSelect) {
          this.clearSelection();
        }
      } else if (!this.multiSelect) {
        this.selected = [exact];
        this.selectionChange.emit(this.selected);
        this.selectedItems.emit(this.selected);
        this.propagateControlValue();
      }
      return;
    }

    if (this.updateOnBlur && !this.multiSelect && this.selected.length === 0) {
      const added: NgbTypeaheadItem = { id: trimmed, label: trimmed, value: trimmed };
      this.selected = [added];
      this.onAdd.emit(added);
      this.selectionChange.emit(this.selected);
      this.selectedItems.emit(this.selected);
      this.propagateControlValue();
    }
  }

  private splitBySeparators(value: string): { tokensToAdd: string[]; remaining: string } {
    const separators = Array.isArray(this.separator) ? this.separator : [this.separator];
    const safe = separators.filter((s) => s != null && `${s}`.length > 0).map((s) => `${s}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!safe.length) {
      return { tokensToAdd: [], remaining: value };
    }
    const regex = new RegExp(`(?:${safe.join('|')})`);
    if (!regex.test(value)) {
      return { tokensToAdd: [], remaining: value };
    }
    const parts = value.split(new RegExp(`(?:${safe.join('|')})`, 'g')).map((p) => p.trim());
    const endsWithSeparator = separators.some((sep) => value.endsWith(sep));
    const tokensToAdd = (endsWithSeparator ? parts : parts.slice(0, -1)).filter(Boolean);
    const remaining = endsWithSeparator ? '' : (parts[parts.length - 1] || '');
    return { tokensToAdd, remaining };
  }

  private addToken(raw: string) {
    const token = (raw || '').trim();
    if (!this.chips || !this.multiSelect) return;
    if (!token) return;

    const match = this.data.find((d) => (d.label || '').trim().toLowerCase() === token.toLowerCase());
    const item: NgbTypeaheadItem = match ?? { id: token, label: token, value: token };

    if (this.matchSelection && !match) {
      this.query = '';
      return;
    }

    if (this.selected.some((s) => s.id === item.id)) {
      this.query = '';
      return;
    }

    this.selected = [...this.selected, item];
    this.onAdd.emit(item);
    this.propagateControlValue();
    this.selectedItems.emit(this.selected);
    this.selectionChange.emit(this.selected);
    this.query = '';
    this.keepOpenOnEmpty = true;
    this.applyFilter('');
  }

  private propagateControlValue() {
    if (this.multiSelect) {
      const next = this.selected.map((item) => (item.value !== undefined ? item.value : item));
      this.controlValue = next;
      this.onControlChange(next);
      return;
    }
    const first = this.selected[0];
    const next = first ? (first.value !== undefined ? first.value : first) : null;
    this.controlValue = next;
    this.onControlChange(next);
  }

  private coerceToItem(value: any): NgbTypeaheadItem | null {
    if (value == null) return null;
    if (typeof value === 'object' && (value as NgbTypeaheadItem).id != null && (value as NgbTypeaheadItem).label != null) {
      return value as NgbTypeaheadItem;
    }
    const match = this.data.find((d) => d.value === value || d.id === value || (d.label || '').toLowerCase() === `${value}`.toLowerCase());
    if (match) return match;
    return { id: `${value}`, label: `${value}`, value };
  }
}
