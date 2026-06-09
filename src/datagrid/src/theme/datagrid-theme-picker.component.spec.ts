import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbDatagridThemePickerComponent } from './datagrid-theme-picker.component';
import { NGB_DATAGRID_THEME_OPTIONS } from '../datagrid.types';

describe('NgbDatagridThemePickerComponent', () => {
  let fixture: ComponentFixture<NgbDatagridThemePickerComponent>;
  let component: NgbDatagridThemePickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgbDatagridThemePickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NgbDatagridThemePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders grouped theme options with public labels', () => {
    const groupLabels = component.groupedThemes.map((group) => group.label);
    const optionLabels = component.groupedThemes.flatMap((group) => group.items.map((theme) => theme.label));

    expect(groupLabels).toEqual(['Bootstrap', 'Material', 'Tailwind']);
    expect(optionLabels).toContain('Classic');
    expect(optionLabels).toContain('Midnight');
    expect(optionLabels).toContain('Aqua Rose');
    expect(optionLabels).toContain('Indigo');
    expect(optionLabels).toContain('Graphite');
  });

  it('emits selected theme values', () => {
    const emitSpy = jest.spyOn(component.valueChange, 'emit');

    component.select(NGB_DATAGRID_THEME_OPTIONS.find((theme) => theme.value === 'bootstrap-nordic')!);

    expect(component.value).toBe('bootstrap-nordic');
    expect(emitSpy).toHaveBeenCalledWith('bootstrap-nordic');
    expect(component.open).toBe(false);
  });
});
