/** Internal detached row copy. Reject unsupported values instead of retaining mutable references. */
export function copyHistoryRow<T>(value: T, seen = new Set<object>()): T {
  if (value === null || value === undefined || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof Date && Number.isFinite(value.getTime())) return new Date(value.getTime()) as T;
  if (typeof value !== 'object' || seen.has(value as object)) throw new Error('Unsupported history row value');
  const object = value as object;
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) throw new Error('Unsupported history row type');
  seen.add(object);
  try {
    if (Array.isArray(value)) return value.map(item => copyHistoryRow(item, seen)) as T;
    if (Object.getOwnPropertySymbols(object).length) throw new Error('Unsupported symbol keys');
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
      if (!('value' in descriptor)) throw new Error('Unsupported accessor');
      Object.defineProperty(result, key, { value: copyHistoryRow(descriptor.value, seen), enumerable: true, writable: true, configurable: true });
    }
    return result as T;
  } finally { seen.delete(object); }
}
export function sameHistoryRow(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a instanceof Date || b instanceof Date) return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
  const left = Object.keys(a).sort(), right = Object.keys(b).sort();
  return left.length === right.length && left.every((key, i) => key === right[i] && sameHistoryRow((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
}
