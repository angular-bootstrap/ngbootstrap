import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Datagrid } from '../datagrid/datagrid.component';
import { NgbExportService } from '../services/export.services';
import { NGB_DATAGRID_THEME_OPTIONS } from '../datagrid.types';

class MockExportService {
  registerPdfAdapter() {}
  registerExcelAdapter() {}
}

describe('Datagrid named theme input', () => {
  let fixture: ComponentFixture<Datagrid<{ id: number; name: string }>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Datagrid],
      providers: [{ provide: NgbExportService, useClass: MockExportService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Datagrid<{ id: number; name: string }>);
    fixture.componentInstance.columns = [
      { field: 'id', header: 'ID' },
      { field: 'name', header: 'Name' },
    ];
    fixture.componentInstance.data = [{ id: 1, name: 'Nordic row' }];
  });

  it.each(NGB_DATAGRID_THEME_OPTIONS)('reflects $label on the grid root', ({ value }) => {
    fixture.componentRef.setInput('theme', value);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ngb-grid')?.getAttribute('data-theme')).toBe(value);
  });
});
