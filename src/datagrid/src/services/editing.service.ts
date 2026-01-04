import { signal } from '@angular/core';

export type NgbDatagridTrackByFn<T> = (index: number, row: T) => any;

export interface NgbDatagridEditService<T> {
  /**
   * Create a new row in the provided data set.
   * Implementations may mark the row as "new" until `saveChanges` is called.
   */
  create(data: readonly T[], newRow: T, rowIndex: number, rowId: any): T[];

  /**
   * Update an existing row in the provided data set.
   * Implementations may snapshot the original row to support `cancelChanges` and `hasChanges`.
   */
  update(data: readonly T[], updatedRow: T, rowIndex: number, rowId: any): T[];

  /**
   * Remove a row from the provided data set.
   */
  remove(data: readonly T[], rowIndex: number, rowId: any): T[];

  /**
   * Used by the datagrid while editing to compute a new row instance.
   * Default behavior is a shallow merge of the values into the row.
   */
  assignValues(row: T, values: Partial<T>): T;

  /**
   * Whether this row is considered newly created (not yet saved).
   */
  isNew(rowId: any): boolean;

  /**
   * Whether the row differs from its captured baseline (after `update`/`create` starts tracking).
   */
  hasChanges(rowId: any, currentRow: T): boolean;

  /**
   * Commit current changes (and clear tracking state) for the row.
   */
  saveChanges(data: readonly T[], rowIndex: number, rowId: any, currentRow: T): T[];

  /**
   * Revert tracked changes for the row (or remove it if it was new).
   */
  cancelChanges(data: readonly T[], rowIndex: number, rowId: any): T[];
}

const clone = <T>(value: T): T => {
  try {
    // Prefer structuredClone when available.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return (globalThis as any).structuredClone ? (globalThis as any).structuredClone(value) : JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
};

const shallowEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
};

export class NgbDatagridDefaultEditService<T> implements NgbDatagridEditService<T> {
  private originals = signal<Array<{ id: any; row: T }>>([]);
  private newRows = signal<any[]>([]);

  create(data: readonly T[], newRow: T, _rowIndex: number, rowId: any): T[] {
    this.newRows.update((ids) => (ids.some((id) => Object.is(id, rowId)) ? ids : [...ids, rowId]));
    // Baseline for a new row is itself until saved/cancelled.
    this.originals.update((items) => {
      if (items.some((it) => Object.is(it.id, rowId))) return items;
      return [...items, { id: rowId, row: clone(newRow) }];
    });
    return [...data, newRow];
  }

  update(data: readonly T[], updatedRow: T, rowIndex: number, rowId: any): T[] {
    // Snapshot original the first time we see this rowId.
    const hasBaseline = this.originals().some((it) => Object.is(it.id, rowId));
    if (!hasBaseline) {
      const current = data[rowIndex];
      if (current != null) {
        this.originals.update((items) => [...items, { id: rowId, row: clone(current as any) }]);
      }
    }
    return this.replaceRow(data, updatedRow, rowIndex);
  }

  remove(data: readonly T[], rowIndex: number, rowId: any): T[] {
    this.newRows.update((ids) => ids.filter((id) => !Object.is(id, rowId)));
    this.originals.update((items) => items.filter((it) => !Object.is(it.id, rowId)));
    return this.removeRow(data, rowIndex);
  }

  assignValues(row: T, values: Partial<T>): T {
    return { ...(row as any), ...(values as any) } as T;
  }

  isNew(rowId: any): boolean {
    return this.newRows().some((id) => Object.is(id, rowId));
  }

  hasChanges(rowId: any, currentRow: T): boolean {
    const baseline = this.originals().find((it) => Object.is(it.id, rowId))?.row;
    if (!baseline) return false;
    return !shallowEqual(baseline as any, currentRow as any);
  }

  saveChanges(data: readonly T[], _rowIndex: number, rowId: any, currentRow: T): T[] {
    this.newRows.update((ids) => ids.filter((id) => !Object.is(id, rowId)));
    // Once saved, clear baseline tracking (no longer "dirty").
    this.originals.update((items) => items.filter((it) => !Object.is(it.id, rowId)));
    // Data is already updated by `create` or `update` at this point.
    return data.slice();
  }

  cancelChanges(data: readonly T[], rowIndex: number, rowId: any): T[] {
    if (this.newRows().some((id) => Object.is(id, rowId))) {
      this.newRows.update((ids) => ids.filter((id) => !Object.is(id, rowId)));
      this.originals.update((items) => items.filter((it) => !Object.is(it.id, rowId)));
      return this.removeRow(data, rowIndex);
    }
    const baseline = this.originals().find((it) => Object.is(it.id, rowId))?.row;
    this.originals.update((items) => items.filter((it) => !Object.is(it.id, rowId)));
    if (!baseline) return data.slice();
    return this.replaceRow(data, baseline, rowIndex);
  }

  private replaceRow(data: readonly T[], updatedRow: T, rowIndex: number): T[] {
    if (rowIndex < 0 || rowIndex >= data.length) return data.slice();
    const copy = data.slice();
    (copy as any)[rowIndex] = updatedRow;
    return copy;
  }

  private removeRow(data: readonly T[], rowIndex: number): T[] {
    if (rowIndex < 0 || rowIndex >= data.length) return data.slice();
    return data.filter((_, i) => i !== rowIndex);
  }
}
