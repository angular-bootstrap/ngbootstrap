import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Datagrid } from '../datagrid/datagrid.component';
import { NgbExportService } from '../services/export.services';

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

  it('reflects named theme variants on the grid root', () => {
    fixture.componentRef.setInput('theme', 'bootstrap-nordic');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ngb-grid')?.getAttribute('data-theme')).toBe('bootstrap-nordic');
  });
});
