import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Datagrid } from './datagrid.component';

describe('Datagrid', () => {
  let component: Datagrid;
  let fixture: ComponentFixture<Datagrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Datagrid],
    }).compileComponents();

    fixture = TestBed.createComponent(Datagrid);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
