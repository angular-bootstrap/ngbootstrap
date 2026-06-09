import {
  ngbFindFieldFilterDescriptor,
  ngbFlattenFilterDescriptors,
  ngbIsCompositeFilter,
  ngbSetFieldFilter,
  NgbCompositeFilterDescriptor
} from './filtering';

describe('filtering utilities', () => {
  it('flattens nested composite filters', () => {
    const composite: NgbCompositeFilterDescriptor = {
      logic: 'and',
      filters: [
        { field: 'name', operator: 'contains', value: 'Ali' },
        {
          logic: 'or',
          filters: [
            { field: 'active', operator: 'eq', value: true },
            { field: 'score', operator: 'gte', value: 80 }
          ]
        }
      ]
    };

    const flat = ngbFlattenFilterDescriptors(composite);
    expect(flat.map((item) => item.field)).toEqual(['name', 'active', 'score']);
  });

  it('finds a field descriptor in nested composites', () => {
    const composite: NgbCompositeFilterDescriptor = {
      logic: 'and',
      filters: [
        {
          logic: 'or',
          filters: [{ field: 'active', operator: 'eq', value: false }]
        }
      ]
    };

    expect(ngbFindFieldFilterDescriptor(composite, 'active')?.value).toBe(false);
    expect(ngbFindFieldFilterDescriptor(composite, 'missing')).toBeNull();
  });

  it('sets and removes field filters immutably', () => {
    const base: NgbCompositeFilterDescriptor = { logic: 'and', filters: [] };
    const withValue = ngbSetFieldFilter(base, 'active', 'eq', true);
    expect(ngbFindFieldFilterDescriptor(withValue, 'active')).toEqual({
      field: 'active',
      operator: 'eq',
      value: true,
      ignoreCase: true
    });

    const cleared = ngbSetFieldFilter(withValue, 'active', 'eq', '');
    expect(ngbFindFieldFilterDescriptor(cleared, 'active')).toBeNull();
    expect(withValue.filters).toHaveLength(1);
  });

  it('supports operators that do not require a value', () => {
    const base: NgbCompositeFilterDescriptor = { logic: 'and', filters: [] };
    const next = ngbSetFieldFilter(base, 'email', 'isnull');
    const descriptor = ngbFindFieldFilterDescriptor(next, 'email');
    expect(descriptor?.operator).toBe('isnull');
    expect(descriptor?.value).toBeUndefined();
    expect(ngbIsCompositeFilter(next)).toBe(true);
  });
});
