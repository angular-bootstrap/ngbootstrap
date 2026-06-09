import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbSearchHighlightComponent } from './search-highlight.component';

describe('NgbSearchHighlightComponent', () => {
  let fixture: ComponentFixture<NgbSearchHighlightComponent>;
  let component: NgbSearchHighlightComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgbSearchHighlightComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NgbSearchHighlightComponent);
    component = fixture.componentInstance;
    component.fields = [
      { field: 'name', label: 'Name' },
      { field: 'email', label: 'Email' },
      { field: 'department', label: 'Department' },
    ];
    component.selectedFields = ['name', 'email'];
    fixture.detectChanges();
  });

  it('emits termChange and selectionChange when the search term changes', () => {
    const terms: string[] = [];
    const selections: unknown[] = [];
    component.termChange.subscribe((value) => terms.push(value));
    component.selectionChange.subscribe((value) => selections.push(value));

    component.setTerm('engineering');

    expect(component.term).toBe('engineering');
    expect(terms).toEqual(['engineering']);
    expect(selections).toEqual([{ term: 'engineering', selectedFields: ['name', 'email'] }]);
  });

  it('toggles selected fields and emits selectedFieldsChange', () => {
    const selectedFields: string[][] = [];
    const selections: unknown[] = [];
    component.selectedFieldsChange.subscribe((value) => selectedFields.push(value));
    component.selectionChange.subscribe((value) => selections.push(value));

    component.toggleField('email');
    component.toggleField('department');

    expect(component.selectedFields).toEqual(['name', 'department']);
    expect(selectedFields).toEqual([['name'], ['name', 'department']]);
    expect(selections).toEqual([
      { term: '', selectedFields: ['name'] },
      { term: '', selectedFields: ['name', 'department'] },
    ]);
  });

  it('does not remove the final selected field unless empty selection is allowed', () => {
    component.selectedFields = ['name'];

    component.toggleField('name');

    expect(component.selectedFields).toEqual(['name']);

    component.allowEmptySelection = true;
    component.toggleField('name');

    expect(component.selectedFields).toEqual([]);
  });

  it('renders field buttons with pressed state', () => {
    fixture.detectChanges();

    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];

    expect(buttons.map((button) => button.textContent?.trim())).toEqual(['Name', 'Email', 'Department']);
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[2].getAttribute('aria-pressed')).toBe('false');
  });
});
