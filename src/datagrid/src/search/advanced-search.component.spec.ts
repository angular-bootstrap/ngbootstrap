import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbAdvancedSearchComponent } from './advanced-search.component';

describe('NgbAdvancedSearchComponent', () => {
  let fixture: ComponentFixture<NgbAdvancedSearchComponent>;
  let component: NgbAdvancedSearchComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgbAdvancedSearchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NgbAdvancedSearchComponent);
    component = fixture.componentInstance;
  });

  it('builds a composite filter descriptor from completed rules', () => {
    component.logic = 'or';
    component.fields = [
      { field: 'name', label: 'Name' },
      { field: 'salary', label: 'Salary', type: 'number' },
    ];
    component.rules = [
      { field: 'name', operator: 'contains', value: 'Ashley' },
      { field: 'salary', operator: 'gt', value: '90000' },
      { field: 'name', operator: 'eq', value: '' },
    ];

    expect(component.toFilterDescriptor()).toEqual({
      logic: 'or',
      filters: [
        { field: 'name', operator: 'contains', value: 'Ashley', ignoreCase: true },
        { field: 'salary', operator: 'gt', value: 90000, ignoreCase: false },
      ],
    });
  });

  it('emits filterChange when search is applied', () => {
    const emitted: unknown[] = [];
    component.filterChange.subscribe((value) => emitted.push(value));
    component.fields = [{ field: 'status', label: 'Status' }];
    component.rules = [{ field: 'status', operator: 'eq', value: 'Active' }];

    component.apply();

    expect(emitted).toEqual([
      {
        logic: 'and',
        filters: [{ field: 'status', operator: 'eq', value: 'Active', ignoreCase: true }],
      },
    ]);
  });

  it('does not remove the final required rule', () => {
    component.minRules = 1;
    component.rules = [{ field: 'name', operator: 'contains', value: '' }];

    component.removeRule(0);

    expect(component.rules.length).toBe(1);
  });

  it('uses type-specific operator lists and labels from the shared filtering model', () => {
    component.fields = [
      { field: 'name', label: 'Name' },
      { field: 'salary', label: 'Salary', type: 'number' },
      { field: 'joinDate', label: 'Join Date', type: 'date' },
      { field: 'status', label: 'Status', type: 'select' },
    ];

    expect(component.operatorOptionsFor({ field: 'name', operator: 'contains', value: '' })).toEqual([
      { value: 'eq', label: 'Is equal to' },
      { value: 'neq', label: 'Is not equal to' },
      { value: 'contains', label: 'Contains' },
      { value: 'doesnotcontain', label: 'Does not contain' },
      { value: 'startswith', label: 'Starts with' },
      { value: 'endswith', label: 'Ends with' },
    ]);
    expect(component.operatorOptionsFor({ field: 'salary', operator: 'eq', value: '' }).map((item) => item.label)).toEqual([
      'Is equal to',
      'Is not equal to',
      'Is greater than or equal to',
      'Is greater than',
      'Is less than or equal to',
      'Is less than',
    ]);
    expect(component.operatorOptionsFor({ field: 'joinDate', operator: 'gte', value: '' }).map((item) => item.label)).toEqual([
      'Is equal to',
      'Is not equal to',
      'Is after or equal to',
      'Is after',
      'Is before or equal to',
      'Is before',
    ]);
    expect(component.operatorOptionsFor({ field: 'status', operator: 'contains', value: '' }).map((item) => item.value)).toEqual([
      'contains',
      'doesnotcontain',
      'eq',
      'neq',
      'isempty',
      'isnotempty',
      'isnull',
      'isnotnull',
    ]);
  });

  it('uses the selected field type default when adding a rule', () => {
    component.fields = [{ field: 'joinDate', label: 'Join Date', type: 'date' }];

    component.addRule();

    expect(component.rules).toEqual([{ field: 'joinDate', operator: 'gte', value: '' }]);
  });

  it('resets an invalid operator when the rule field changes type', () => {
    const emitted: unknown[] = [];
    component.rulesChange.subscribe((value) => emitted.push(value));
    component.fields = [
      { field: 'name', label: 'Name' },
      { field: 'salary', label: 'Salary', type: 'number' },
    ];
    const rule = { field: 'name', operator: 'contains' as const, value: 'Engineer' };
    component.rules = [rule];

    component.setRuleField(rule, 'salary');

    expect(rule).toEqual({ field: 'salary', operator: 'eq', value: '' });
    expect(emitted).toEqual([[rule]]);
  });

  it('builds large composite descriptors without dropping completed rules', () => {
    component.fields = [{ field: 'name', label: 'Name' }];
    component.rules = Array.from({ length: 1000 }, (_, index) => ({
      field: 'name',
      operator: 'contains' as const,
      value: `employee-${index}`,
    }));

    const startedAt = performance.now();
    const descriptor = component.toFilterDescriptor();
    const duration = performance.now() - startedAt;

    expect(descriptor.filters.length).toBe(1000);
    expect(duration).toBeLessThan(50);
  });
});
