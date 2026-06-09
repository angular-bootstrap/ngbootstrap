import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbDatagridButtonDirective } from '../foundation/datagrid-button.directive';
import { NgbDatagridControlDirective } from '../foundation/datagrid-control.directive';

export interface NgbSearchHighlightField {
  field: string;
  label: string;
  disabled?: boolean;
}

export interface NgbSearchHighlightSelectionChange {
  term: string;
  selectedFields: string[];
}

@Component({
  selector: 'ngb-search-highlight',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbDatagridButtonDirective, NgbDatagridControlDirective],
  template: `
    <div class="ngb-search-highlight">
      <label class="ngb-search-highlight__search">
        <span class="ngb-search-highlight__icon" aria-hidden="true">{{ searchIcon }}</span>
        <input
          type="search"
          ngbDatagridControl
          [ngModel]="term"
          [ngModelOptions]="{ standalone: true }"
          (ngModelChange)="setTerm($event)"
          [placeholder]="placeholder"
          [attr.aria-label]="searchAriaLabel"
        />
      </label>

      @if (fields.length) {
      <div class="ngb-search-highlight__fields">
        <span class="ngb-search-highlight__label">{{ fieldsLabel }}</span>
        <div class="ngb-search-highlight__chips" role="group" [attr.aria-label]="fieldsAriaLabel">
          @for (field of fields; track field.field) {
            <button
              type="button"
              [ngbDatagridButton]="isFieldSelected(field.field) ? 'primary' : 'secondary'"
              [disabled]="field.disabled || (!allowEmptySelection && isFieldSelected(field.field) && selectedFields.length <= 1)"
              [attr.aria-pressed]="isFieldSelected(field.field)"
              (click)="toggleField(field.field)"
            >
              {{ field.label }}
            </button>
          }
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .ngb-search-highlight {
        display: grid;
        gap: 1rem;
        color: var(--dg-text, #1f2937);
      }

      .ngb-search-highlight__search {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        min-width: min(100%, 18rem);
      }

      .ngb-search-highlight__search .grid-filter-control {
        width: 100%;
        min-height: var(--dg-control-height, 2.5rem);
        border: 1px solid var(--dg-border, #d5dbe5);
        border-radius: var(--dg-radius-md, 0.5rem);
        background: var(--dg-surface, #fff);
        color: var(--dg-text, #1f2937);
        padding: 0 0.75rem;
      }

      .ngb-search-highlight__icon {
        color: var(--dg-text-muted, #64748b);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2rem;
        font-size: 1.9rem;
        line-height: 1;
        font-weight: 700;
      }

      .ngb-search-highlight__fields {
        display: grid;
        gap: 0.5rem;
      }

      .ngb-search-highlight__label {
        font-size: 0.875rem;
        font-weight: 700;
        color: var(--dg-text, #1f2937);
      }

      .ngb-search-highlight__chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .ngb-search-highlight .datagrid-toolbar__button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: var(--dg-control-height, 2.5rem);
        padding: 0 0.9rem;
        border: 1px solid var(--dg-border, #d5dbe5);
        border-radius: var(--dg-radius-md, 0.5rem);
        background: var(--dg-surface, #fff);
        color: var(--dg-text, #1f2937);
        font: inherit;
        font-weight: 700;
      }

      .ngb-search-highlight .datagrid-toolbar__button--primary {
        border-color: var(--dg-accent, #2563eb);
        background: var(--dg-accent, #2563eb);
        color: #fff;
      }

      .ngb-search-highlight button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }
    `,
  ],
})
export class NgbSearchHighlightComponent {
  @Input() fields: NgbSearchHighlightField[] = [];
  @Input() selectedFields: string[] = [];
  @Input() term = '';
  @Input() placeholder = 'Type to highlight matches...';
  @Input() searchAriaLabel = 'Type to highlight matches';
  @Input() fieldsLabel = 'Search in:';
  @Input() fieldsAriaLabel = 'Highlight fields';
  @Input() searchIcon = '🔍';
  @Input() allowEmptySelection = false;

  @Output() termChange = new EventEmitter<string>();
  @Output() selectedFieldsChange = new EventEmitter<string[]>();
  @Output() selectionChange = new EventEmitter<NgbSearchHighlightSelectionChange>();

  setTerm(term: string): void {
    this.term = term;
    this.termChange.emit(term);
    this.emitSelectionChange();
  }

  isFieldSelected(field: string): boolean {
    return this.selectedFields.includes(field);
  }

  toggleField(field: string): void {
    const selected = this.isFieldSelected(field);
    if (selected && !this.allowEmptySelection && this.selectedFields.length <= 1) return;
    this.selectedFields = selected
      ? this.selectedFields.filter((item) => item !== field)
      : [...this.selectedFields, field];
    this.selectedFieldsChange.emit([...this.selectedFields]);
    this.emitSelectionChange();
  }

  private emitSelectionChange(): void {
    this.selectionChange.emit({
      term: this.term,
      selectedFields: [...this.selectedFields],
    });
  }
}
