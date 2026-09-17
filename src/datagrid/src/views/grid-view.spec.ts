import { NgbDataGridViewSnapshot, NgbLocalStorageGridViewStore, NgbMemoryGridViewStore, ngbCloneGridView, ngbDeserializeGridView, ngbSerializeGridView } from './grid-view';

const snapshot = (): NgbDataGridViewSnapshot => ({
  version: 1,
  state: { pageSize: 25, globalFilter: 'invoice', sort: [{ field: 'amount', direction: 'desc' }],
    filter: { logic: 'and', filters: [{ logic: 'or', filters: [{ field: 'due', operator: 'lt', value: new Date('2026-09-01T00:00:00Z') }, { field: 'status', operator: 'eq', value: 'overdue' }] }] },
    group: [{ field: 'status', dir: 'asc', aggregates: [{ field: 'amount', aggregate: 'sum' }] }], aggregates: [{ field: 'amount', aggregate: 'sum' }] },
  columns: [{ field: 'amount', hidden: false, width: 120, sticky: 'end', locked: false }, { field: 'due', hidden: true, width: 0, sticky: false, locked: false }],
});

describe('grid view serialization', () => {
  it('round-trips every supported property and nested Date filters without sharing references', () => {
    const source = snapshot();
    const copy = ngbDeserializeGridView(ngbSerializeGridView(source));
    expect(copy).toEqual(source);
    expect(copy).not.toBe(source);
    const nested = copy.state.filter!.filters[0] as { filters: { value: Date }[] };
    expect(nested.filters[0].value).toBeInstanceOf(Date);
  });
  it.each([0, 2, '1', null])('rejects invalid version %s', version => {
    expect(() => ngbCloneGridView({ ...snapshot(), version } as NgbDataGridViewSnapshot)).toThrow();
  });
  it.each([NaN, Infinity, () => true, new Map(), new Date('invalid')])('rejects unsupported values', value => {
    const view = snapshot(); view.state.filter = { logic: 'and', filters: [{ field: 'due', operator: 'eq', value }] };
    expect(() => ngbSerializeGridView(view)).toThrow();
  });
  it('rejects cyclic objects, prototype keys, duplicate columns, and malformed dates', () => {
    const cyclic: Record<string, unknown> = {}; cyclic['self'] = cyclic;
    const view = snapshot(); view.state.filter = { logic: 'and', filters: [{ field: 'due', operator: 'eq', value: cyclic }] };
    expect(() => ngbSerializeGridView(view)).toThrow();
    expect(() => ngbDeserializeGridView('{"__proto__":{}}')).toThrow();
    view.state.filter.filters = []; view.columns.push(view.columns[0]);
    expect(() => ngbSerializeGridView(view)).toThrow();
    expect(() => ngbDeserializeGridView(ngbSerializeGridView(snapshot()).replace('2026-09-01T00:00:00.000Z', 'yesterday'))).toThrow();
  });
});

describe('view stores', () => {
  it('namespaces memory collections, enforces unique names, clones values, and deletes', async () => {
    const store = new NgbMemoryGridViewStore(); const view = { id: 'one', name: 'Invoices', snapshot: snapshot() };
    await store.save('user/grid', view);
    view.snapshot.state.pageSize = 100;
    expect((await store.list('user/grid'))[0].snapshot.state.pageSize).toBe(25);
    expect(await store.list('other/grid')).toEqual([]);
    await expect(store.save('user/grid', { ...view, id: 'two', name: ' invoices ' })).rejects.toThrow('already exists');
    await expect(store.save('user/grid', { ...view, name: ' ' })).rejects.toThrow();
    await expect(store.list('')).rejects.toThrow('storage key');
    await store.delete('user/grid', 'one'); expect(await store.list('user/grid')).toEqual([]);
  });
  it('does not lose concurrent memory saves', async () => {
    const store = new NgbMemoryGridViewStore();
    await Promise.all(['one', 'two'].map(id => store.save('grid', { id, name: id, snapshot: snapshot() })));
    expect(await store.list('grid')).toHaveLength(2);
  });
  it('loads local storage lazily and preserves dates', async () => {
    const storage = { getItem: jest.fn(), setItem: jest.fn() }; const factory = jest.fn(() => storage);
    const store = new NgbLocalStorageGridViewStore(factory); expect(factory).not.toHaveBeenCalled();
    storage.getItem.mockReturnValue(null);
    await store.save('tenant/invoices', { id: 'one', name: 'Overdue', snapshot: snapshot() });
    expect(storage.setItem.mock.calls[0][0]).toBe('ngb:grid-views:tenant/invoices');
    storage.getItem.mockReturnValue(storage.setItem.mock.calls[0][1]);
    expect((await store.list('tenant/invoices'))[0].snapshot).toEqual(snapshot());
  });
  it('surfaces denied storage, malformed data, and quota failures', async () => {
    const denied = new NgbLocalStorageGridViewStore(() => { throw new Error('Storage denied'); });
    await expect(denied.list('grid')).rejects.toThrow('Storage denied');
    const storage = { getItem: jest.fn().mockReturnValue('broken'), setItem: jest.fn(() => { throw new Error('Quota exceeded'); }) };
    const store = new NgbLocalStorageGridViewStore(() => storage);
    await expect(store.list('grid')).rejects.toThrow();
    storage.getItem.mockReturnValue(null);
    await expect(store.save('grid', { id: 'one', name: 'View', snapshot: snapshot() })).rejects.toThrow('Quota exceeded');
  });
});
