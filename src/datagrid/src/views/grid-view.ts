import { NgbDataGridState } from '../datagrid.types';

export interface NgbDataGridColumnView {
  field: string;
  hidden: boolean;
  width: number;
  sticky: boolean | 'start' | 'end';
  locked: boolean;
}
export interface NgbDataGridViewSnapshot {
  version: 1;
  state: Required<Pick<NgbDataGridState, 'sort' | 'filter' | 'globalFilter' | 'group' | 'pageSize'>> & Pick<NgbDataGridState, 'aggregates'>;
  /** Array order is the saved display order, including hidden columns. */
  columns: NgbDataGridColumnView[];
}
export interface NgbDataGridSavedView {
  id: string;
  name: string;
  snapshot: NgbDataGridViewSnapshot;
}
export type NgbDataGridViewRestoreResult =
  | { success: true; ignoredFields: string[] }
  | { success: false; reason: 'invalid-snapshot' | 'editing'; message: string };
export interface NgbDataGridViewStore {
  list(key: string): Promise<NgbDataGridSavedView[]>;
  save(key: string, view: NgbDataGridSavedView): Promise<void>;
  delete(key: string, id: string): Promise<void>;
}

const operators = new Set(['contains', 'doesnotcontain', 'eq', 'neq', 'startswith', 'endswith', 'gt', 'gte', 'lt', 'lte', 'isnull', 'isnotnull', 'isempty', 'isnotempty']);
const aggregates = new Set(['count', 'sum', 'average', 'avg', 'min', 'max']);
const unsafeKeys = new Set(['__proto__', 'constructor', 'prototype']);
const DATE = '$ngbDate';
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
}
function field(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && !unsafeKeys.has(value);
}
function fromEntries(entries: [string, unknown][]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of entries) result[key] = value;
  return result;
}
function encode(value: unknown, ancestors = new Set<object>(), depth = 0): unknown {
  if (depth > 50) throw new Error('View values are too deeply nested.');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof Date && Number.isFinite(value.getTime())) return { [DATE]: value.toISOString() };
  if (typeof value !== 'object' || value === null || ancestors.has(value)) throw new Error('Unsupported view value.');
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) throw new Error('Only plain view values can be saved.');
  ancestors.add(value);
  try {
    if (Array.isArray(value)) return value.map(item => encode(item, ancestors, depth + 1));
    return fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).map(([key, item]) => {
      if (unsafeKeys.has(key) || key === DATE) throw new Error('Unsupported view key.');
      return [key, encode(item, ancestors, depth + 1)];
    }));
  } finally { ancestors.delete(value); }
}
function decode(value: unknown, depth = 0): unknown {
  if (depth > 50) throw new Error('View values are too deeply nested.');
  if (Array.isArray(value)) return value.map(item => decode(item, depth + 1));
  if (!record(value)) return value;
  if (DATE in value) {
    if (Object.keys(value).length !== 1 || typeof value[DATE] !== 'string') throw new Error('Invalid saved date.');
    const date = new Date(value[DATE]);
    if (!Number.isFinite(date.getTime()) || date.toISOString() !== value[DATE]) throw new Error('Invalid saved date.');
    return date;
  }
  return fromEntries(Object.entries(value).map(([key, item]) => {
    if (unsafeKeys.has(key)) throw new Error('Unsupported view key.');
    return [key, decode(item, depth + 1)];
  }));
}
function validFilter(value: unknown, depth = 0): boolean {
  if (depth > 30 || !record(value)) return false;
  if ('filters' in value) return ['and', 'or'].includes(String(value['logic'])) && Array.isArray(value['filters']) && value['filters'].every(item => validFilter(item, depth + 1));
  return field(value['field']) && operators.has(String(value['operator'])) &&
    (value['ignoreCase'] === undefined || typeof value['ignoreCase'] === 'boolean');
}
export function ngbValidateGridView(value: unknown): asserts value is NgbDataGridViewSnapshot {
  if (!record(value) || value['version'] !== 1 || !record(value['state']) || !Array.isArray(value['columns'])) throw new Error('Unsupported grid view version or shape.');
  if (Object.keys(value).some(key => !['version', 'state', 'columns'].includes(key))) throw new Error('Unknown grid view properties.');
  const state = value['state'];
  if (Object.keys(state).some(key => !['sort', 'filter', 'globalFilter', 'group', 'pageSize', 'aggregates'].includes(key))) throw new Error('Unknown grid state properties.');
  if (!Number.isSafeInteger(state['pageSize']) || Number(state['pageSize']) < 1 || typeof state['globalFilter'] !== 'string' ||
      !Array.isArray(state['sort']) || state['sort'].length > 1 || !state['sort'].every(item => record(item) && field(item['field']) && ['asc', 'desc'].includes(String(item['direction']))) ||
      !record(state['filter']) || !Array.isArray(state['filter']['filters']) || !validFilter(state['filter']) || !Array.isArray(state['group']) || !state['group'].every(item => record(item) && field(item['field']) &&
        (item['dir'] === undefined || ['asc', 'desc'].includes(String(item['dir']))) &&
        (item['aggregates'] === undefined || (Array.isArray(item['aggregates']) && item['aggregates'].every(a => record(a) && field(a['field']) && aggregates.has(String(a['aggregate']))))))) {
    throw new Error('Invalid grid data state.');
  }
  if (state['aggregates'] !== undefined && (!Array.isArray(state['aggregates']) || !state['aggregates'].every(a => record(a) && field(a['field']) && aggregates.has(String(a['aggregate']))))) throw new Error('Invalid grid aggregates.');
  const fields = new Set<string>();
  for (const col of value['columns']) {
    if (!record(col) || !field(col['field']) || fields.has(col['field']) || typeof col['hidden'] !== 'boolean' || typeof col['locked'] !== 'boolean' ||
        !(typeof col['sticky'] === 'boolean' || col['sticky'] === 'start' || col['sticky'] === 'end') ||
        typeof col['width'] !== 'number' || !Number.isFinite(col['width']) || col['width'] < 0) throw new Error('Invalid grid column state.');
    fields.add(col['field']);
  }
  encode(value);
}
export function ngbSerializeGridView(view: NgbDataGridViewSnapshot): string {
  ngbValidateGridView(view);
  return JSON.stringify(encode(view));
}
export function ngbDeserializeGridView(json: string): NgbDataGridViewSnapshot {
  const value = decode(JSON.parse(json));
  ngbValidateGridView(value);
  return value;
}
export function ngbCloneGridView(view: NgbDataGridViewSnapshot): NgbDataGridViewSnapshot {
  return ngbDeserializeGridView(ngbSerializeGridView(view));
}

function copyView(view: NgbDataGridSavedView): NgbDataGridSavedView {
  if (!view || !field(view.id) || typeof view.name !== 'string' || !view.name.trim()) throw new Error('A view needs an ID and a name.');
  return { id: view.id, name: view.name.trim(), snapshot: ngbCloneGridView(view.snapshot) };
}
function upsert(views: NgbDataGridSavedView[], view: NgbDataGridSavedView): NgbDataGridSavedView[] {
  const copy = copyView(view);
  if (views.some(item => item.id !== copy.id && item.name.toLowerCase() === copy.name.toLowerCase())) throw new Error('A view with this name already exists.');
  return [...views.filter(item => item.id !== copy.id), copy];
}
function requireKey(key: string): void {
  if (typeof key !== 'string' || !key.trim()) throw new Error('Provide a storage key for this grid and user.');
}
export class NgbMemoryGridViewStore implements NgbDataGridViewStore {
  private readonly collections = new Map<string, NgbDataGridSavedView[]>();
  async list(key: string): Promise<NgbDataGridSavedView[]> { requireKey(key); return (this.collections.get(key) ?? []).map(copyView); }
  async save(key: string, view: NgbDataGridSavedView): Promise<void> { requireKey(key); this.collections.set(key, upsert(this.collections.get(key) ?? [], view)); }
  async delete(key: string, id: string): Promise<void> { requireKey(key); this.collections.set(key, (this.collections.get(key) ?? []).filter(view => view.id !== id)); }
}
/** Opt-in persistence. Storage is resolved lazily, never during import or SSR. */
export class NgbLocalStorageGridViewStore implements NgbDataGridViewStore {
  constructor(private readonly storage: () => Pick<Storage, 'getItem' | 'setItem'> = () => globalThis.localStorage) {}
  async list(key: string): Promise<NgbDataGridSavedView[]> {
    requireKey(key);
    const raw = this.storage().getItem(`ngb:grid-views:${key}`);
    if (raw === null) return [];
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error('Saved views are malformed.');
    const views = data.map(item => {
      if (!record(item) || typeof item['snapshot'] !== 'string') throw new Error('Saved view is malformed.');
      return copyView({ id: item['id'] as string, name: item['name'] as string, snapshot: ngbDeserializeGridView(item['snapshot']) });
    });
    if (new Set(views.map(item => item.id)).size !== views.length || new Set(views.map(item => item.name.toLowerCase())).size !== views.length) throw new Error('Saved views contain duplicates.');
    return views;
  }
  private write(key: string, views: NgbDataGridSavedView[]): void {
    this.storage().setItem(`ngb:grid-views:${key}`, JSON.stringify(views.map(view => ({ ...view, snapshot: ngbSerializeGridView(view.snapshot) }))));
  }
  async save(key: string, view: NgbDataGridSavedView): Promise<void> { this.write(key, upsert(await this.list(key), view)); }
  async delete(key: string, id: string): Promise<void> { this.write(key, (await this.list(key)).filter(view => view.id !== id)); }
}
