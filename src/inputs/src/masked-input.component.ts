import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, forwardRef, inject, Input, OnChanges, Output } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import { NgbInputIds } from './input-ids.service';

type MaskToken = { literal: string } | { pattern: RegExp };
interface MaskResult { text: string; raw: string; complete: boolean; invalid: boolean; }

/** Fixed masks: 0 = ASCII digit, A = ASCII letter, * = ASCII alphanumeric; backslash escapes literals. */
@Component({
  selector: 'ngb-masked-input', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./input.scss'],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NgbMaskedInputComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => NgbMaskedInputComponent), multi: true },
  ],
  template: `
    @if (label) { <label [attr.for]="resolvedId">{{ label }}</label> }
    <div class="ngb-input-shell" [class.invalid]="!!error">
      <input type="text" [id]="resolvedId" [value]="text" [disabled]="isDisabled" [readOnly]="readOnly"
        [required]="required" [placeholder]="placeholder" [attr.inputmode]="inputMode" autocomplete="off"
        [attr.aria-label]="ariaLabel || (label ? null : 'Formatted value')" [attr.aria-labelledby]="ariaLabelledBy || null"
        [attr.aria-describedby]="ariaDescribedBy || null" [attr.aria-invalid]="error ? true : null"
        (input)="onInput($event)" (beforeinput)="onBeforeInput($event)" (blur)="onBlur()"
        (compositionstart)="composing = true" (compositionend)="onCompositionEnd($event)" />
    </div>
  `,
})
export class NgbMaskedInputComponent implements ControlValueAccessor, Validator, OnChanges {
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
  /** Required fixed mask. Use a backslash to escape a token as a literal. */
  @Input() mask = '000-000';
  /** Raw excludes mask literals; formatted includes them. Default raw. */
  @Input() valueMode: 'raw' | 'formatted' = 'raw';
  /** Optional input hint; does not replace an accessible label. */
  @Input() placeholder = '';
  /** Hint for the mobile keyboard; mask validation is independent of this hint. */
  @Input() inputMode: 'text' | 'numeric' | 'tel' = 'text';
  /** Reject an empty value through Angular forms validation. */
  @Input() required = false;
  /** Keep focus and selection available while preventing edits. */
  @Input() readOnly = false;
  /** Disable editing and remove the native controls from keyboard navigation. */
  @Input() disabled = false;
  /** Current model value. Supports value/valueChange binding or Angular forms. */
  @Input() get value(): string | null { return this.current; }
  set value(value: string | null) { this.writeValue(value); }
  /** Emits normalized partial or complete values; incomplete input remains invalid. */
  @Output() valueChange = new EventEmitter<string | null>();
  private readonly generatedId = inject(NgbInputIds).allocate();
  private readonly cdr = inject(ChangeDetectorRef);
  private current: string | null = null;
  private formDisabled = false;
  protected text = '';
  protected error: ValidationErrors | null = null;
  protected composing = false;
  private change: (value: string | null) => void = () => {};
  private touch: () => void = () => {};
  private validatorChange: () => void = () => {};
  protected get resolvedId(): string { return this.inputId || this.generatedId; }
  protected get isDisabled(): boolean { return this.disabled || this.formDisabled; }

  private tokens(): MaskToken[] {
    if (!this.mask || this.mask.length > 256) return [];
    const tokens: MaskToken[] = [];
    for (let i = 0; i < this.mask.length; i++) {
      const char = this.mask[i];
      if (char === '\\') { if (++i >= this.mask.length) return []; tokens.push({literal: this.mask[i]}); }
      else if (char === '0') tokens.push({pattern: /^[0-9]$/});
      else if (char === 'A') tokens.push({pattern: /^[a-zA-Z]$/});
      else if (char === '*') tokens.push({pattern: /^[a-zA-Z0-9]$/});
      else tokens.push({literal: char});
    }
    return tokens.some(t => 'pattern' in t) ? tokens : [];
  }
  private apply(source: string, rawOnly = false): MaskResult {
    const tokens = this.tokens();
    if (!tokens.length) return {text: source, raw: source, complete: false, invalid: true};
    let index = 0, raw = '', text = '', filled = 0;
    const count = tokens.filter(t => 'pattern' in t).length;
    for (const token of tokens) {
      if (index >= source.length) {
        if (filled === count && 'literal' in token) { text += token.literal; continue; }
        break;
      }
      if ('literal' in token) {
        text += token.literal;
        if (!rawOnly && source[index] === token.literal) index++;
      } else {
        if (!token.pattern.test(source[index])) return {text: source, raw, complete: false, invalid: true};
        text += source[index]; raw += source[index++]; filled++;
      }
    }
    return {text, raw, complete: filled === count, invalid: index < source.length};
  }
  private validation(result: MaskResult): ValidationErrors | null {
    if (!this.tokens().length) return { maskConfiguration: true };
    if (result.invalid) return { mask: { pattern: this.mask, invalidCharacters: true } };
    if (!result.raw) return this.required ? {required: true} : null;
    return result.complete ? null : {mask: {pattern: this.mask, incomplete: true}};
  }
  ngOnChanges(): void { this.writeValue(this.current); this.validatorChange(); }
  writeValue(value: string | null): void {
    this.current = value;
    const result = this.apply(value ?? '', this.valueMode === 'raw');
    this.text = result.text; this.error = this.validation(result); this.cdr.markForCheck();
  }
  registerOnChange(fn: (value: string | null) => void): void { this.change = fn; }
  registerOnTouched(fn: () => void): void { this.touch = fn; }
  registerOnValidatorChange(fn: () => void): void { this.validatorChange = fn; }
  setDisabledState(disabled: boolean): void { this.formDisabled = disabled; this.cdr.markForCheck(); }
  validate(_control: AbstractControl): ValidationErrors | null { return this.error; }
  protected onInput(event: Event): void {
    if (this.isDisabled || this.readOnly) return;
    const input = event.target as HTMLInputElement;
    if (this.composing) { this.text = input.value; return; }
    const source = input.value, caret = input.selectionStart ?? source.length;
    const result = this.apply(source);
    this.error = this.validation(result);
    this.text = result.invalid ? source : result.text;
    let changed = false;
    if (!result.invalid) {
      const value = (this.valueMode === 'raw' ? result.raw : result.text) || null;
      if (value !== this.current) { changed = true; this.current = value; this.change(value); this.valueChange.emit(value); }
      const position = this.apply(source.slice(0, caret)).text.length;
      input.value = this.text;
      input.setSelectionRange(position, position);
    }
    if (!changed) this.validatorChange();
  }
  protected onBeforeInput(event: Event): void {
    const inputEvent = event as InputEvent;
    if (this.isDisabled || this.readOnly || this.composing || inputEvent.isComposing) return;
    if (!['deleteContentBackward', 'deleteContentForward'].includes(inputEvent.inputType)) return;
    const input = event.target as HTMLInputElement;
    if (input.selectionStart !== input.selectionEnd) return;
    const direction = inputEvent.inputType === 'deleteContentBackward' ? -1 : 1;
    const caret = input.selectionStart ?? 0;
    const tokens = this.tokens();
    let at = direction === -1 ? caret - 1 : caret;
    while (at >= 0 && at < input.value.length && tokens[at] && 'literal' in tokens[at]) at += direction;
    if (at < 0 || at >= input.value.length || !tokens[at]) return;
    event.preventDefault();
    // Remove one editable character from the raw sequence, then rebuild literals.
    let raw = '';
    for (let i = 0; i < input.value.length; i++) if (i !== at && tokens[i] && 'pattern' in tokens[i]) raw += input.value[i];
    const result = this.apply(raw, true);
    input.value = result.text;
    input.setSelectionRange(at, at);
    this.onInput(event);
  }
  protected onCompositionEnd(event: Event): void { this.composing = false; this.onInput(event); }
  protected onBlur(): void { this.touch(); }
}
