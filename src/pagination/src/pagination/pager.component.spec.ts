import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbPagerComponent } from './pager.component';

describe('NgbPagerComponent', () => {
  let fixture: ComponentFixture<NgbPagerComponent>;
  let component: NgbPagerComponent;

  beforeAll(() => {
    if (typeof ResizeObserver === 'undefined') {
      (globalThis as any).ResizeObserver = class {
        private cb?: ResizeObserverCallback;
        observe() {
          this.cb?.([{ contentRect: { width: 600 } } as ResizeObserverEntry], this);
        }
        disconnect() {}
        constructor(cb: ResizeObserverCallback) {
          this.cb = cb;
        }
      };
    }
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgbPagerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NgbPagerComponent);
    component = fixture.componentInstance;
    component.collectionSize = 6;
    component.pageSize = 5;
    component.page = 1;
  });

  const detect = () => fixture.detectChanges();

  it('renders centered pagination with info and page sizes', () => {
    component.settings = { pageSizes: [5, 10], info: true };
    detect();

    const root = fixture.nativeElement.querySelector('.ngb-pager') as HTMLElement;
    expect(root).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.ngb-pager__pagination')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('1–5 of 6');
    const select = fixture.nativeElement.querySelector('.ngb-pager__page-size-select');
    expect(select).toBeTruthy();
  });

  it('includes the active pageSize in the dropdown when not in pageSizes', () => {
    component.settings = { pageSizes: [5, 10] };
    component.pageSize = 7;
    detect();

    expect(component.resolvedPageSizeOptions).toEqual([5, 7, 10]);
    const select = fixture.nativeElement.querySelector('.ngb-pager__page-size-select');
    expect(select.querySelectorAll('option').length).toBe(3);
  });

  it('hides page size control when pageSizes is false', () => {
    component.settings = { pageSizes: false };
    detect();

    expect(fixture.nativeElement.querySelector('.ngb-pager__page-size-select')).toBeNull();
  });

  it('uses wrap layout when responsive is false', () => {
    component.settings = { responsive: false, pageSizes: [5, 10] };
    detect();

    expect(fixture.nativeElement.querySelector('.ngb-pager--wrap')).toBeTruthy();
  });

  it('emits page and page size changes', () => {
    const pageSpy = jest.spyOn(component.pageChange, 'emit');
    const sizeSpy = jest.spyOn(component.pageSizeChange, 'emit');

    component.onPageChange(2);
    component.onPageSizeChange(25);

    expect(pageSpy).toHaveBeenCalledWith(2);
    expect(sizeSpy).toHaveBeenCalledWith(25);
  });

  it('uses a custom info label when provided', () => {
    component.settings = { info: true };
    component.infoLabel = 'Custom range';
    detect();

    expect(fixture.nativeElement.textContent).toContain('Custom range');
    expect(fixture.nativeElement.textContent).not.toContain('1–5 of 6');
  });
});
