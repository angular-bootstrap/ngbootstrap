import {
  NgbColumnFilterType,
  NgbCompositeFilterDescriptor,
  NgbFilterDescriptor,
  NgbFilterOperator,
  ngbColumnTypeToFilterType,
  ngbIsCompositeFilter,
  ngbOperatorRequiresFilterValue,
} from './models/filtering';
import {
  NgbDataGridAggregateDescriptor,
  NgbDataGridAggregateResults,
  NgbDataGridDataResult,
  NgbDataGridProcessOptions,
  NgbDataGridSortDescriptor,
  NgbDataGridState,
} from './datagrid.types';

type ColumnMeta<T> = NonNullable<NgbDataGridProcessOptions<T>['columns']>[number];

const EMPTY_FILTER: NgbCompositeFilterDescriptor = { logic: 'and', filters: [] };

export function ngbApplyDataGridOperations<T>(
  data: readonly T[] | null | undefined,
  options: NgbDataGridProcessOptions<T> = {},
): NgbDataGridDataResult<T> {
  const state = options.state ?? {};
  const rows = [...(data ?? [])];
  const columns = options.columns ?? [];
  const filtered = applyGlobalFilter(
    applyCompositeFilter(rows, state.filter ?? EMPTY_FILTER, columns),
    state.globalFilter,
    options.globalFilterFields ?? columns.map((column) => String(column.field)),
  );
  const sorted = applySort(filtered, state.sort ?? []);
  const total = sorted.length;
  const aggregates = ngbCalculateDataGridAggregates(sorted, options.aggregates ?? []);
  const page = options.page === false ? sorted : applyPage(sorted, state);

  return {
    data: page,
    total,
    ...(Object.keys(aggregates).length ? { aggregates } : {}),
  };
}

export function ngbCalculateDataGridAggregates<T>(
  data: readonly T[] | null | undefined,
  descriptors: readonly NgbDataGridAggregateDescriptor[] | null | undefined,
): NgbDataGridAggregateResults {
  const rows = [...(data ?? [])];
  const results: NgbDataGridAggregateResults = {};

  for (const descriptor of descriptors ?? []) {
    const field = descriptor.field;
    const bucket = results[field] ?? {};
    const values = rows
      .map((row) => (row as Record<string, unknown>)?.[field])
      .filter((value) => value !== null && value !== undefined && value !== '');

    switch (descriptor.aggregate) {
      case 'count':
        bucket.count = values.length;
        break;
      case 'sum':
        bucket.sum = numericValues(values).reduce((sum, value) => sum + value, 0);
        break;
      case 'average': {
        const numbers = numericValues(values);
        bucket.average = numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : null;
        break;
      }
      case 'min':
        bucket.min = minMax(values, 'min');
        break;
      case 'max':
        bucket.max = minMax(values, 'max');
        break;
      default:
        break;
    }

    results[field] = bucket;
  }

  return results;
}

function applyCompositeFilter<T>(
  rows: T[],
  filter: NgbCompositeFilterDescriptor,
  columns: readonly ColumnMeta<T>[],
): T[] {
  if (!filter.filters.length) return rows;
  return rows.filter((row) => matchesComposite(row, filter, columns));
}

function matchesComposite<T>(
  row: T,
  filter: NgbCompositeFilterDescriptor,
  columns: readonly ColumnMeta<T>[],
): boolean {
  if (!filter.filters.length) return true;
  const results = filter.filters.map((item) =>
    ngbIsCompositeFilter(item) ? matchesComposite(row, item, columns) : matchesDescriptor(row, item, columns),
  );
  return filter.logic === 'or' ? results.some(Boolean) : results.every(Boolean);
}

function matchesDescriptor<T>(
  row: T,
  descriptor: NgbFilterDescriptor,
  columns: readonly ColumnMeta<T>[],
): boolean {
  const raw = (row as Record<string, unknown>)?.[descriptor.field];
  const column = columns.find((item) => String(item.field) === descriptor.field);
  const filterType = resolveFilterType(column, raw, descriptor.value);
  const cellValue = normalizeFilterValue(raw, filterType);
  const compareValue = normalizeFilterValue(descriptor.value, filterType);
  const ignoreCase = descriptor.ignoreCase ?? (filterType === 'text' || filterType === 'select');

  if (descriptor.operator === 'isnull') return raw == null;
  if (descriptor.operator === 'isnotnull') return raw != null;
  if (descriptor.operator === 'isempty') return raw === '';
  if (descriptor.operator === 'isnotempty') return raw !== '' && raw != null;
  if (ngbOperatorRequiresFilterValue(descriptor.operator) && (descriptor.value === '' || descriptor.value == null)) {
    return true;
  }

  if (filterType === 'numeric' || filterType === 'date') {
    const left = cellValue as number | null;
    const right = compareValue as number | null;
    if (left == null || right == null) return false;
    return compareByOperator(left, right, descriptor.operator);
  }

  if (filterType === 'boolean') {
    switch (descriptor.operator) {
      case 'eq':
        return cellValue === compareValue;
      case 'neq':
        return cellValue !== compareValue;
      default:
        return false;
    }
  }

  const left = String(cellValue ?? '');
  const right = String(compareValue ?? '');
  const normalizedLeft = ignoreCase ? left.toLowerCase() : left;
  const normalizedRight = ignoreCase ? right.toLowerCase() : right;
  switch (descriptor.operator) {
    case 'contains':
      return normalizedLeft.includes(normalizedRight);
    case 'doesnotcontain':
      return !normalizedLeft.includes(normalizedRight);
    case 'eq':
      return normalizedLeft === normalizedRight;
    case 'neq':
      return normalizedLeft !== normalizedRight;
    case 'startswith':
      return normalizedLeft.startsWith(normalizedRight);
    case 'endswith':
      return normalizedLeft.endsWith(normalizedRight);
    default:
      return false;
  }
}

function applyGlobalFilter<T>(rows: T[], rawFilter: string | null | undefined, fields: readonly string[]): T[] {
  const filter = String(rawFilter ?? '').trim().toLowerCase();
  if (!filter) return rows;
  return rows.filter((row) => {
    const source = row as Record<string, unknown>;
    const searchFields = fields.length ? fields : Object.keys(source);
    return searchFields.some((field) => String(source[field] ?? '').toLowerCase().includes(filter));
  });
}

function applySort<T>(rows: T[], descriptors: readonly NgbDataGridSortDescriptor[]): T[] {
  const sort = descriptors.filter((descriptor) => descriptor.field && descriptor.direction);
  if (!sort.length) return rows;
  return [...rows].sort((left, right) => {
    for (const descriptor of sort) {
      const result = compareValues(
        (left as Record<string, unknown>)?.[descriptor.field],
        (right as Record<string, unknown>)?.[descriptor.field],
      );
      if (result !== 0) return descriptor.direction === 'asc' ? result : -result;
    }
    return 0;
  });
}

function applyPage<T>(rows: T[], state: NgbDataGridState): T[] {
  const pageSize = Number(state.pageSize);
  if (!Number.isFinite(pageSize) || pageSize <= 0) return rows;
  const skip = Number.isFinite(Number(state.skip))
    ? Math.max(0, Math.trunc(Number(state.skip)))
    : Math.max(0, (Math.max(1, Math.trunc(Number(state.page) || 1)) - 1) * pageSize);
  return rows.slice(skip, skip + pageSize);
}

function resolveFilterType<T>(
  column: ColumnMeta<T> | undefined,
  raw: unknown,
  value: unknown,
): NgbColumnFilterType {
  if (column?.filterType) return column.filterType as NgbColumnFilterType;
  if (column?.type) return ngbColumnTypeToFilterType(column.type as any);
  if (typeof raw === 'number' || typeof value === 'number') return 'numeric';
  if (typeof raw === 'boolean' || typeof value === 'boolean') return 'boolean';
  if (raw instanceof Date || value instanceof Date) return 'date';
  return 'text';
}

function normalizeFilterValue(value: unknown, type: NgbColumnFilterType): unknown {
  if (value === '' || value === undefined || value === null) return null;
  switch (type) {
    case 'numeric': {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    }
    case 'date': {
      const parsed = value instanceof Date ? value.getTime() : Date.parse(String(value));
      return Number.isNaN(parsed) ? null : parsed;
    }
    case 'boolean':
      if (value === 'true') return true;
      if (value === 'false') return false;
      return !!value;
    default:
      return String(value);
  }
}

function compareByOperator(left: number, right: number, operator: NgbFilterOperator): boolean {
  switch (operator) {
    case 'eq':
      return left === right;
    case 'neq':
      return left !== right;
    case 'gt':
      return left > right;
    case 'gte':
      return left >= right;
    case 'lt':
      return left < right;
    case 'lte':
      return left <= right;
    default:
      return false;
  }
}

function compareValues(left: unknown, right: unknown): number {
  if (left == null && right == null) return 0;
  if (left == null) return -1;
  if (right == null) return 1;
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
    return leftNumber - rightNumber;
  }
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
}

function numericValues(values: unknown[]): number[] {
  return values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
}

function minMax(values: unknown[], mode: 'min' | 'max'): number | string | Date | null {
  if (!values.length) return null;
  return values.reduce((winner, candidate) => {
    const result = compareValues(candidate, winner);
    return mode === 'min' ? (result < 0 ? candidate : winner) : (result > 0 ? candidate : winner);
  }) as number | string | Date | null;
}
