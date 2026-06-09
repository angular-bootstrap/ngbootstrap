import { ColumnType } from './column-def';

export type NgbFilterMode = 'row' | 'menu' | 'multi' | 'none';
export type NgbFilterable = boolean | 'row' | 'menu' | 'multi' | 'none';

export type NgbFilterOperator =
  | 'contains'
  | 'doesnotcontain'
  | 'eq'
  | 'neq'
  | 'startswith'
  | 'endswith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'isnull'
  | 'isnotnull'
  | 'isempty'
  | 'isnotempty';

export interface NgbFilterDescriptor {
  field: string;
  operator: NgbFilterOperator;
  value?: any;
  ignoreCase?: boolean;
}

/** Single condition in a column filter menu or layout-toolbar filter tool. */
export interface NgbMenuFilterConditionDraft {
  operator: NgbFilterOperator;
  value: any;
}

export interface NgbCompositeFilterDescriptor {
  logic: 'and' | 'or';
  filters: Array<NgbFilterDescriptor | NgbCompositeFilterDescriptor>;
}

export interface NgbFilterState {
  global?: string;
  root: NgbCompositeFilterDescriptor;
}

export type NgbColumnFilterType = 'text' | 'numeric' | 'boolean' | 'date' | 'select';

export const NGB_TEXT_FILTER_OPERATORS: NgbFilterOperator[] = [
  'eq',
  'neq',
  'contains',
  'doesnotcontain',
  'startswith',
  'endswith'
];

export const NGB_NUMERIC_FILTER_OPERATORS: NgbFilterOperator[] = [
  'eq',
  'neq',
  'gte',
  'gt',
  'lte',
  'lt'
];

export const NGB_BOOLEAN_FILTER_OPERATORS: NgbFilterOperator[] = ['eq', 'neq', 'isnull', 'isnotnull'];

export const NGB_DATE_FILTER_OPERATORS: NgbFilterOperator[] = [
  'eq',
  'neq',
  'gte',
  'gt',
  'lte',
  'lt'
];

export const NGB_SELECT_FILTER_OPERATORS: NgbFilterOperator[] = [
  'contains',
  'doesnotcontain',
  'eq',
  'neq',
  'isempty',
  'isnotempty',
  'isnull',
  'isnotnull'
];

export function ngbColumnTypeToFilterType(type?: ColumnType): NgbColumnFilterType {
  switch (type) {
    case 'number':
      return 'numeric';
    case 'boolean':
      return 'boolean';
    case 'date':
      return 'date';
    case 'select':
      return 'select';
    default:
      return 'text';
  }
}

export function ngbDefaultFilterOperator(type: NgbColumnFilterType): NgbFilterOperator {
  switch (type) {
    case 'numeric':
    case 'boolean':
      return 'eq';
    case 'date':
      return 'gte';
    default:
      return 'contains';
  }
}

export function ngbAllowedFilterOperators(type: NgbColumnFilterType): NgbFilterOperator[] {
  switch (type) {
    case 'numeric':
      return [...NGB_NUMERIC_FILTER_OPERATORS];
    case 'boolean':
      return [...NGB_BOOLEAN_FILTER_OPERATORS];
    case 'date':
      return [...NGB_DATE_FILTER_OPERATORS];
    case 'select':
      return [...NGB_SELECT_FILTER_OPERATORS];
    default:
      return [...NGB_TEXT_FILTER_OPERATORS];
  }
}

export function ngbFilterOperatorLabel(operator: NgbFilterOperator, type: NgbColumnFilterType = 'text'): string {
  if (type === 'date') {
    switch (operator) {
      case 'eq': return 'Is equal to';
      case 'neq': return 'Is not equal to';
      case 'gte': return 'Is after or equal to';
      case 'gt': return 'Is after';
      case 'lte': return 'Is before or equal to';
      case 'lt': return 'Is before';
      default: break;
    }
  }
  if (type === 'numeric') {
    switch (operator) {
      case 'eq': return 'Is equal to';
      case 'neq': return 'Is not equal to';
      case 'gte': return 'Is greater than or equal to';
      case 'gt': return 'Is greater than';
      case 'lte': return 'Is less than or equal to';
      case 'lt': return 'Is less than';
      default: break;
    }
  }
  if (type === 'text' || type === 'select') {
    switch (operator) {
      case 'eq': return 'Is equal to';
      case 'neq': return 'Is not equal to';
      case 'contains': return 'Contains';
      case 'doesnotcontain': return 'Does not contain';
      case 'startswith': return 'Starts with';
      case 'endswith': return 'Ends with';
      default: break;
    }
  }
  const labels: Record<NgbFilterOperator, string> = {
    contains: 'Contains',
    doesnotcontain: 'Does not contain',
    eq: 'Equals',
    neq: 'Does not equal',
    startswith: 'Starts with',
    endswith: 'Ends with',
    gt: 'Greater than',
    gte: 'Greater than or equal',
    lt: 'Less than',
    lte: 'Less than or equal',
    isnull: 'Is null',
    isnotnull: 'Is not null',
    isempty: 'Is empty',
    isnotempty: 'Is not empty'
  };
  return labels[operator];
}

export function ngbIsCompositeFilter(
  filter: NgbFilterDescriptor | NgbCompositeFilterDescriptor
): filter is NgbCompositeFilterDescriptor {
  return Array.isArray((filter as NgbCompositeFilterDescriptor).filters);
}

/** Recursively collects leaf filter descriptors from a composite filter tree. */
export function ngbFlattenFilterDescriptors(
  composite: NgbCompositeFilterDescriptor | null | undefined
): NgbFilterDescriptor[] {
  if (!composite?.filters?.length) return [];
  const descriptors: NgbFilterDescriptor[] = [];
  for (const item of composite.filters) {
    if (ngbIsCompositeFilter(item)) {
      descriptors.push(...ngbFlattenFilterDescriptors(item));
    } else {
      descriptors.push(item);
    }
  }
  return descriptors;
}

/** Returns the first leaf descriptor for `field`, searching nested composite nodes. */
export function ngbFindFieldFilterDescriptor(
  composite: NgbCompositeFilterDescriptor | null | undefined,
  field: string
): NgbFilterDescriptor | null {
  return ngbFlattenFilterDescriptors(composite).find((descriptor) => descriptor.field === field) ?? null;
}

function ngbWithoutFieldFilters(
  filters: Array<NgbFilterDescriptor | NgbCompositeFilterDescriptor>,
  field: string
): Array<NgbFilterDescriptor | NgbCompositeFilterDescriptor> {
  return filters.filter((filter) => {
    if (ngbIsCompositeFilter(filter)) {
      return !filter.filters.every((item) => !ngbIsCompositeFilter(item) && item.field === field);
    }
    return filter.field !== field;
  });
}

export function ngbOperatorRequiresFilterValue(operator: NgbFilterOperator): boolean {
  return !['isnull', 'isnotnull', 'isempty', 'isnotempty'].includes(operator);
}

/**
 * Returns a new composite filter with the field set (or removed when value is empty).
 * Supports manual `filterChange(root)` updates from custom filter templates.
 */
export function ngbSetFieldFilter(
  composite: NgbCompositeFilterDescriptor,
  field: string,
  operator: NgbFilterOperator,
  value?: any,
  options?: { requiresValue?: (operator: NgbFilterOperator) => boolean }
): NgbCompositeFilterDescriptor {
  const requiresValue = options?.requiresValue ?? ngbOperatorRequiresFilterValue;
  const filters = ngbWithoutFieldFilters([...composite.filters], field);
  if (requiresValue(operator)) {
    const normalized = value === undefined ? null : value;
    if (normalized === null || normalized === '') {
      return { logic: composite.logic, filters };
    }
    filters.push({ field, operator, value: normalized, ignoreCase: true });
  } else {
    filters.push({ field, operator, ignoreCase: true });
  }
  return { logic: composite.logic, filters };
}
