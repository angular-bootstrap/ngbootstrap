import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbDatagridButtonDirective } from '../foundation/datagrid-button.directive';
import { NgbDatagridControlDirective } from '../foundation/datagrid-control.directive';
import { ColumnType } from '../models/column-def';
import {
  NgbColumnFilterType,
  NgbCompositeFilterDescriptor,
  NgbFilterOperator,
  ngbAllowedFilterOperators,
  ngbColumnTypeToFilterType,
  ngbDefaultFilterOperator,
  ngbFilterOperatorLabel,
  ngbOperatorRequiresFilterValue,
} from '../models/filtering';

export interface NgbAdvancedSearchField {
  field: string;
  label: string;
  type?: ColumnType;
  filterType?: NgbColumnFilterType;
  defaultFilterOperator?: NgbFilterOperator | '';
  allowedFilterOperators?: NgbFilterOperator[];
}

export interface NgbAdvancedSearchOperator {
  value: NgbFilterOperator;
  label: string;
}

export interface NgbAdvancedSearchRule {
  field: string;
  operator: NgbFilterOperator;
  value: any;
}

@Component({
  selector: 'ngb-advanced-search',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbDatagridButtonDirective, NgbDatagridControlDirective],
  template: `
    <div class="ngb-advanced-search">
      <div class="ngb-advanced-search__logic">
        <span>{{ matchLabel }}</span>
        <button
          type="button"
          [ngbDatagridButton]="logic === 'and' ? 'primary' : 'secondary'"
          (click)="setLogic('and')"
        >
          AND
        </button>
        <button
          type="button"
          [ngbDatagridButton]="logic === 'or' ? 'primary' : 'secondary'"
          (click)="setLogic('or')"
        >
          OR
        </button>
        <span>{{ rulesLabel }}</span>
      </div>

      <div class="ngb-advanced-search__rules">
        @for (rule of rules; track $index; let i = $index) {
        <div class="ngb-advanced-search__rule">
          <span class="ngb-advanced-search__join">{{ i === 0 ? whenLabel : logic.toUpperCase() }}</span>
          <select
            ngbDatagridControl
            [ngModel]="rule.field"
            [ngModelOptions]="{ standalone: true }"
            (ngModelChange)="setRuleField(rule, $event)"
            [attr.aria-label]="fieldAriaLabel"
          >
            @for (field of fields; track field.field) {
              <option [value]="field.field">{{ field.label }}</option>
            }
          </select>
          <select
            ngbDatagridControl
            [ngModel]="rule.operator"
            [ngModelOptions]="{ standalone: true }"
            (ngModelChange)="setRuleOperator(rule, $event)"
            [attr.aria-label]="operatorAriaLabel"
          >
            @for (operator of operatorOptionsFor(rule); track operator.value) {
              <option [ngValue]="operator.value">{{ operator.label }}</option>
            }
          </select>
          <input
            ngbDatagridControl
            [attr.type]="inputType(rule)"
            [(ngModel)]="rule.value"
            [ngModelOptions]="{ standalone: true }"
            (ngModelChange)="emitRules()"
            [placeholder]="valuePlaceholder"
            [disabled]="!operatorRequiresValue(rule.operator)"
            [attr.aria-label]="valueAriaLabel"
          />
          <button
            type="button"
            ngbDatagridButton="danger"
            (click)="removeRule(i)"
            [disabled]="rules.length <= minRules"
            [attr.aria-label]="removeRuleAriaLabel"
          >
            {{ removeRuleLabel }}
          </button>
        </div>
        }
      </div>

      <div class="ngb-advanced-search__actions">
        <button type="button" ngbDatagridButton="secondary" (click)="addRule()">
          {{ addRuleLabel }}
        </button>
        <button type="button" ngbDatagridButton="success" (click)="apply()">
          {{ applyLabel }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .ngb-advanced-search {
        display: grid;
        gap: 1rem;
        color: var(--dg-text, #1f2937);
      }

      .ngb-advanced-search__logic,
      .ngb-advanced-search__actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.625rem;
      }

      .ngb-advanced-search__logic {
        font-weight: 700;
      }

      .ngb-advanced-search__rules {
        display: grid;
        gap: 0.75rem;
      }

      .ngb-advanced-search__rule {
        display: grid;
        grid-template-columns: auto minmax(9rem, 1fr) minmax(10rem, 1fr) minmax(10rem, 1fr) auto;
        align-items: center;
        gap: 0.625rem;
      }

      .ngb-advanced-search__join {
        min-width: 3.5rem;
        font-size: 0.8125rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--dg-text-muted, #64748b);
      }

      .ngb-advanced-search .grid-filter-control {
        min-height: var(--dg-control-height, 2.5rem);
        border: 1px solid var(--dg-border, #d5dbe5);
        border-radius: var(--dg-radius-md, 0.5rem);
        background: var(--dg-surface, #fff);
        color: var(--dg-text, #1f2937);
        padding: 0 0.75rem;
      }

      .ngb-advanced-search .datagrid-toolbar__button,
      .ngb-advanced-search .grid-row-action {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.45rem;
        min-height: var(--dg-control-height, 2.5rem);
        padding: 0 0.9rem;
        border: 1px solid var(--dg-border, #d5dbe5);
        border-radius: var(--dg-radius-md, 0.5rem);
        background: var(--dg-surface, #fff);
        color: var(--dg-text, #1f2937);
        font: inherit;
        font-weight: 700;
      }

      .ngb-advanced-search .datagrid-toolbar__button--primary {
        border-color: var(--dg-accent, #2563eb);
        background: var(--dg-accent, #2563eb);
        color: #fff;
      }

      .ngb-advanced-search .grid-row-action--success {
        border-color: #16a34a;
        background: #16a34a;
        color: #fff;
      }

      .ngb-advanced-search .grid-row-action--danger {
        border-color: #dc2626;
        background: #dc2626;
        color: #fff;
      }

      .ngb-advanced-search button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      @media (max-width: 768px) {
        .ngb-advanced-search__rule {
          grid-template-columns: 1fr;
        }

        .ngb-advanced-search__join {
          min-width: 0;
        }
      }
    `,
  ],
})
export class NgbAdvancedSearchComponent {
  private _fields: NgbAdvancedSearchField[] = [];
  private _operators: NgbAdvancedSearchOperator[] | null = null;
  private fieldConfigCache = new Map<string, NgbAdvancedSearchField>();
  private filterTypeCache = new Map<string, NgbColumnFilterType>();
  private inputTypeCache = new Map<string, string>();
  private operatorOptionsCache = new Map<string, NgbAdvancedSearchOperator[]>();

  @Input() set fields(value: NgbAdvancedSearchField[] | null | undefined) {
    this._fields = value ?? [];
    this.rebuildFieldCaches();
  }
  get fields(): NgbAdvancedSearchField[] {
    return this._fields;
  }

  @Input() set operators(value: NgbAdvancedSearchOperator[] | null | undefined) {
    this._operators = value ?? null;
    this.operatorOptionsCache.clear();
  }
  get operators(): NgbAdvancedSearchOperator[] | null {
    return this._operators;
  }
  @Input() rules: NgbAdvancedSearchRule[] = [];
  @Input() logic: 'and' | 'or' = 'and';
  @Input() minRules = 1;
  @Input() matchLabel = 'Match';
  @Input() rulesLabel = 'of the following rules';
  @Input() whenLabel = 'When';
  @Input() addRuleLabel = '+ Add Rule';
  @Input() applyLabel = 'Search';
  @Input() removeRuleLabel = 'Remove';
  @Input() removeRuleAriaLabel = 'Remove rule';
  @Input() fieldAriaLabel = 'Search field';
  @Input() operatorAriaLabel = 'Search operator';
  @Input() valueAriaLabel = 'Search value';
  @Input() valuePlaceholder = 'Value...';

  @Output() rulesChange = new EventEmitter<NgbAdvancedSearchRule[]>();
  @Output() logicChange = new EventEmitter<'and' | 'or'>();
  @Output() filterChange = new EventEmitter<NgbCompositeFilterDescriptor>();

  setLogic(logic: 'and' | 'or'): void {
    this.logic = logic;
    this.logicChange.emit(logic);
  }

  addRule(): void {
    const field = this.fields[0]?.field ?? '';
    this.rules = [
      ...this.rules,
      {
        field,
        operator: this.defaultOperatorForField(field),
        value: '',
      },
    ];
    this.emitRules();
  }

  removeRule(index: number): void {
    if (this.rules.length <= this.minRules) return;
    this.rules = this.rules.filter((_, i) => i !== index);
    this.emitRules();
  }

  apply(): void {
    this.filterChange.emit(this.toFilterDescriptor());
  }

  emitRules(): void {
    this.rulesChange.emit([...this.rules]);
  }

  setRuleField(rule: NgbAdvancedSearchRule, field: string): void {
    rule.field = field;
    const operators = this.operatorOptionsFor(rule).map((operator) => operator.value);
    if (!operators.includes(rule.operator)) {
      rule.operator = this.defaultOperatorForField(field);
      rule.value = '';
    }
    this.emitRules();
  }

  setRuleOperator(rule: NgbAdvancedSearchRule, operator: NgbFilterOperator): void {
    rule.operator = operator;
    if (!this.operatorRequiresValue(operator)) {
      rule.value = '';
    }
    this.emitRules();
  }

  inputType(rule: NgbAdvancedSearchRule): string {
    const cached = this.inputTypeCache.get(rule.field);
    if (cached) return cached;
    const field = this.fieldConfig(rule.field);
    if (field?.type === 'number') return 'number';
    if (field?.type === 'date') return 'date';
    return 'text';
  }

  operatorRequiresValue(operator: NgbFilterOperator): boolean {
    return ngbOperatorRequiresFilterValue(operator);
  }

  operatorOptionsFor(rule: NgbAdvancedSearchRule): NgbAdvancedSearchOperator[] {
    if (this.operators?.length) return this.operators;
    const type = this.filterTypeForField(rule.field);
    const cacheKey = `${rule.field}:${type}`;
    const cached = this.operatorOptionsCache.get(cacheKey);
    if (cached) return cached;
    const options = this.allowedOperatorsForField(rule.field).map((operator) => ({
      value: operator,
      label: ngbFilterOperatorLabel(operator, type),
    }));
    this.operatorOptionsCache.set(cacheKey, options);
    return options;
  }

  toFilterDescriptor(): NgbCompositeFilterDescriptor {
    const filters: NgbCompositeFilterDescriptor['filters'] = [];
    for (const rule of this.rules) {
      const requiresValue = ngbOperatorRequiresFilterValue(rule.operator);
      if (requiresValue && (rule.value === '' || rule.value == null)) continue;

      const inputType = this.inputTypeCache.get(rule.field) ?? this.inputType(rule);
      filters.push({
        field: rule.field,
        operator: rule.operator,
        value: requiresValue ? (inputType === 'number' ? Number(rule.value) : rule.value) : undefined,
        ignoreCase: inputType !== 'number',
      });
    }

    return {
      logic: this.logic,
      filters,
    };
  }

  private fieldConfig(field: string): NgbAdvancedSearchField | undefined {
    return this.fieldConfigCache.get(field);
  }

  private filterTypeForField(field: string): NgbColumnFilterType {
    const cached = this.filterTypeCache.get(field);
    if (cached) return cached;
    const config = this.fieldConfig(field);
    return config?.filterType ?? ngbColumnTypeToFilterType(config?.type);
  }

  private allowedOperatorsForField(field: string): NgbFilterOperator[] {
    const config = this.fieldConfig(field);
    if (config?.allowedFilterOperators?.length) return [...config.allowedFilterOperators];
    return ngbAllowedFilterOperators(this.filterTypeForField(field));
  }

  private defaultOperatorForField(field: string): NgbFilterOperator {
    const config = this.fieldConfig(field);
    const allowed = this.allowedOperatorsForField(field);
    if (config?.defaultFilterOperator === '') {
      return allowed[0] ?? ngbDefaultFilterOperator(this.filterTypeForField(field));
    }
    if (config?.defaultFilterOperator) return config.defaultFilterOperator;
    return ngbDefaultFilterOperator(this.filterTypeForField(field));
  }

  private rebuildFieldCaches(): void {
    this.fieldConfigCache = new Map(this._fields.map((field) => [field.field, field]));
    this.filterTypeCache.clear();
    this.inputTypeCache.clear();
    this.operatorOptionsCache.clear();

    for (const field of this._fields) {
      const filterType = field.filterType ?? ngbColumnTypeToFilterType(field.type);
      this.filterTypeCache.set(field.field, filterType);
      this.inputTypeCache.set(
        field.field,
        field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text',
      );
    }
  }
}
