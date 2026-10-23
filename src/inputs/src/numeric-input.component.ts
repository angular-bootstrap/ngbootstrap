import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, forwardRef, inject, Input, OnChanges, Output } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import { NgbInputIds } from './input-ids.service';

/** Locale-aware numeric editing. Percent models use fractions: 0.05 displays as 5%. */
@Component({
  selector: 'ngb-numeric-input', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./input.scss'],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NgbNumericInputComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => NgbNumericInputComponent), multi: true },
  ],
  template: `
    @if (label) { <label [attr.for]="resolvedId">{{ label }}</label> }
    <div class="ngb-input-shell" [class.invalid]="!!error">
      <input type="text" role="spinbutton" inputmode="decimal" autocomplete="off" [id]="resolvedId"
        [value]="text" [disabled]="isDisabled" [readOnly]="readOnly" [required]="required"
        [attr.aria-label]="ariaLabel || (label ? null : 'Numeric value')" [attr.aria-labelledby]="ariaLabelledBy || null"
        [attr.aria-describedby]="ariaDescribedBy || null" [attr.aria-invalid]="error ? true : null"
        [attr.aria-valuenow]="value" [attr.aria-valuetext]="text || null" [attr.aria-valuemin]="min" [attr.aria-valuemax]="max"
        (focus)="onFocus()" (blur)="onBlur()" (input)="onInput($event)" (keydown)="onKeydown($event)"
        (compositionstart)="composing = true" (compositionend)="onCompositionEnd($event)" />
      @if (showButtons) {
        <button type="button" [disabled]="isDisabled || readOnly || (min !== null && value !== null && value <= min)" [attr.aria-label]="'Decrease ' + (label || ariaLabel || 'value')" (click)="increment(-1)">−</button>
        <button type="button" [disabled]="isDisabled || readOnly || (max !== null && value !== null && value >= max)" [attr.aria-label]="'Increase ' + (label || ariaLabel || 'value')" (click)="increment(1)">+</button>
      }
    </div>
  `,
})
export class NgbNumericInputComponent implements ControlValueAccessor, Validator, OnChanges {
  /** Native input ID for external label association; generated when omitted. */
  @Input() inputId = '';
  /** Visible label associated with the native input. */
  @Input() label = '';
  /** Accessible name when a visible label is not supplied. */
  @Input() ariaLabel = '';
  /** Space-separated IDs of accessible naming elements. */
  @Input() ariaLabelledBy = '';
  /** Space-separated IDs of help or error messages. */
  @Input() ariaDescribedBy = '';
  /** Explicit locale shared by server and browser. */
  @Input() locale = 'en-US';
  /** Display decimal numbers, currency amounts or fractional percentage models. */
  @Input() format: 'decimal' | 'currency' | 'percent' = 'decimal';
  /** ISO currency code used by currency formatting. */
  @Input() currency = 'USD';
  /** Maximum display fraction digits. Committed values round to this scale. */
  @Input() precision = 2;
  /** Inclusive minimum model value; null removes the bound. */
  @Input() min: number | null = null;
  /** Inclusive maximum model value; null removes the bound. */
  @Input() max: number | null = null;
  /** Increment in model units (0.01 is one percentage point for percent format). */
  @Input() step = 1;
  /** Display native increment and decrement buttons. */
  @Input() showButtons = true;
  /** Reject an empty value through Angular forms validation. */
  @Input() required = false;
  /** Keep focus and selection available while preventing edits. */
  @Input() readOnly = false;
  /** Disable editing and remove the native controls from keyboard navigation. */
  @Input() disabled = false;
  /** Current model value. Supports value/valueChange binding or Angular forms. */
  @Input() get value(): number | null { return this.current; }
  set value(value: number | null) { this.writeValue(value); }
  /** Emits once when a valid draft commits or a step changes the value. */
  @Output() valueChange = new EventEmitter<number | null>();
  private readonly generatedId = inject(NgbInputIds).allocate();
  private readonly cdr = inject(ChangeDetectorRef);
  private current: number | null = null;
  private formDisabled = false;
  private focused = false;
  private draft = false;
  protected composing = false;
  protected text = '';
  protected error: ValidationErrors | null = null;
  private change: (value: number | null) => void = () => {};
  private touch: () => void = () => {};
  private validatorChange: () => void = () => {};
  protected get resolvedId(): string { return this.inputId || this.generatedId; }
  protected get isDisabled(): boolean { return this.disabled || this.formDisabled; }

  ngOnChanges(): void { if (!this.draft) this.display(); this.refreshValidity(); }
  writeValue(value: number | null): void { this.current = value; this.draft = false; this.display(); this.error = this.check(value); this.cdr.markForCheck(); }
  registerOnChange(fn: (value: number | null) => void): void { this.change = fn; }
  registerOnTouched(fn: () => void): void { this.touch = fn; }
  setDisabledState(disabled: boolean): void { this.formDisabled = disabled; this.cdr.markForCheck(); }
  registerOnValidatorChange(fn: () => void): void { this.validatorChange = fn; }
  validate(_control: AbstractControl): ValidationErrors | null { return this.check(this.draft ? this.parse(this.text) : this.current); }

  private formatter(edit = false): Intl.NumberFormat {
    return new Intl.NumberFormat(this.locale, { style: edit ? 'decimal' : this.format, currency: this.currency,
      useGrouping: !edit, minimumFractionDigits: 0, maximumFractionDigits: this.precision });
  }
  private display(): void {
    if (this.current === null) { this.text = ''; return; }
    try { this.text = this.formatter(this.focused).format(this.focused && this.format === 'percent' ? this.current * 100 : this.current); }
    catch { this.text = String(this.current); }
  }
  private parse(text: string): number | null {
    let source = text.trim();
    if (!source) return null;
    try {
      const parts = this.formatter().formatToParts(-12345.6);
      source = source.replace(/[\u200e\u200f\u061c]/g, '');
      const minusSign = parts.find(p => p.type === 'minusSign')?.value ?? '-';
      const negative = source.startsWith(minusSign);
      if (negative) source = source.slice(minusSign.length).trim();
      for (const part of parts.filter(p => p.type === 'currency' || p.type === 'percentSign')) {
        if (source.startsWith(part.value)) source = source.slice(part.value.length).trim();
        else if (source.endsWith(part.value)) source = source.slice(0, -part.value.length).trim();
      }
      if (negative) source = '-' + source;
      // Intl supplies locale separators and numeral glyphs; do not use permissive parseFloat.
      const decimalParts = new Intl.NumberFormat(this.locale).formatToParts(12345.6);
      const decimal = decimalParts.find(p => p.type === 'decimal')?.value ?? '.';
      const group = decimalParts.find(p => p.type === 'group')?.value;
      const minus = parts.find(p => p.type === 'minusSign')?.value ?? '-';
      source = source.split(minus).join('-').replace(/[\u200e\u200f\u061c]/g, '');
      for (let i = 0; i < 10; i++) source = source.split(new Intl.NumberFormat(this.locale, {useGrouping: false}).format(i)).join(String(i));
      if (group && source.split(decimal).slice(1).some(part => part.includes(group))) return NaN;
      if (group && source.includes(group)) {
        const integer = source.split(decimal)[0];
        const plain = integer.split(group).join('');
        if (!/^[+-]?\d+$/.test(plain)) return NaN;
        const expected = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 }).format(Number(plain));
        let normalized = expected;
        for (let i = 0; i < 10; i++) normalized = normalized.split(new Intl.NumberFormat(this.locale, {useGrouping: false}).format(i)).join(String(i));
        if (integer.replace(/^\+/, '') !== normalized.replace(/[\u200e\u200f\u061c]/g, '').split(minus).join('-')) return NaN;
        source = source.split(group).join('');
      }
      source = source.split(decimal).join('.');
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(source)) return NaN;
      return Number(source) / (this.format === 'percent' ? 100 : 1);
    } catch { return NaN; }
  }
  private check(value: number | null): ValidationErrors | null {
    try { this.formatter(); } catch { return { numericConfiguration: true }; }
    if (!Number.isInteger(this.precision) || this.precision < 0 || this.precision > 12 || !Number.isFinite(this.step) || this.step <= 0
      || (this.min !== null && !Number.isFinite(this.min)) || (this.max !== null && !Number.isFinite(this.max))
      || (this.min !== null && this.max !== null && this.min > this.max)) return { numericConfiguration: true };
    if (value === null) return this.required ? { required: true } : null;
    if (typeof value !== 'number' || !Number.isFinite(value)) return { number: true };
    if (this.min !== null && value < this.min) return { min: { min: this.min, actual: value } };
    if (this.max !== null && value > this.max) return { max: { max: this.max, actual: value } };
    return null;
  }
  private refreshValidity(): void { this.error = this.check(this.draft ? this.parse(this.text) : this.current); this.validatorChange(); }
  private publish(value: number | null): void {
    if (Object.is(value, this.current)) return;
    this.current = value; this.change(value); this.valueChange.emit(value);
  }
  /** Commit a valid draft; invalid text remains visible and leaves the model unchanged. */
  commit(): boolean {
    if (this.isDisabled || this.readOnly || this.composing) return false;
    let value = this.draft ? this.parse(this.text) : this.current;
    this.error = this.check(value);
    if (this.error) { this.validatorChange(); return false; }
    if (value !== null) value = Number(value.toFixed(this.precision + (this.format === 'percent' ? 2 : 0)));
    this.error = this.check(value);
    if (this.error) { this.validatorChange(); return false; }
    const changed = !Object.is(value, this.current);
    this.draft = false; this.publish(value); this.display();
    if (!changed) this.validatorChange();
    return true;
  }
  protected onInput(event: Event): void {
    if (this.isDisabled || this.readOnly) return;
    this.text = (event.target as HTMLInputElement).value; this.draft = true;
    if (!this.composing) this.refreshValidity();
  }
  protected onFocus(): void { this.focused = true; if (!this.draft) this.display(); }
  protected onBlur(): void { this.focused = false; this.commit(); this.touch(); }
  protected onCompositionEnd(event: Event): void { this.composing = false; this.onInput(event); if (!this.focused) this.commit(); }
  protected onKeydown(event: KeyboardEvent): void {
    if (event.isComposing || this.composing || event.ctrlKey || event.metaKey || event.altKey || this.isDisabled || this.readOnly) return;
    if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); this.commit(); }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); event.stopPropagation(); this.increment(event.key === 'ArrowUp' ? 1 : -1); }
  }
  protected increment(direction: number): void {
    if (this.isDisabled || this.readOnly || this.composing) return;
    const base = this.draft ? this.parse(this.text) : this.current;
    if (this.check(base) && base !== null) return;
    if (this.check(null)?.['numericConfiguration']) return;
    const next = Number(((base ?? 0) + direction * this.step).toFixed(this.precision + (this.format === 'percent' ? 2 : 0)));
    const bounded = Math.min(this.max ?? Infinity, Math.max(this.min ?? -Infinity, next));
    if (this.check(bounded)) return;
    const changed = !Object.is(bounded, this.current);
    this.draft = false; this.error = null; this.publish(bounded); this.display();
    if (!changed) this.validatorChange();
    this.touch();
  }
}
