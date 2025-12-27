import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgbSplitterComponent } from './splitter.component';
import { NgbSplitterPaneComponent } from './splitter-pane.component';

@Component({
  standalone: true,
  imports: [NgbSplitterComponent, NgbSplitterPaneComponent],
  template: `
    <ngb-splitter [orientation]="orientation">
      <ngb-splitter-pane size="200px" min="120px" [collapsible]="true" (collapsedChange)="collapsedEvents.push($event)">
        <div>Pane A</div>
      </ngb-splitter-pane>
      <ngb-splitter-pane size="200px">
        <div>Pane B</div>
      </ngb-splitter-pane>
    </ngb-splitter>
  `,
})
class HostComponent {
  @ViewChild(NgbSplitterComponent) splitter!: NgbSplitterComponent;
  orientation: 'horizontal' | 'vertical' = 'horizontal';
  collapsedEvents: boolean[] = [];
}

describe('NgbSplitterComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  function mockRects(options: { width: number; height: number }) {
    const container = fixture.nativeElement.querySelector('.splitter-container') as HTMLElement;
    container.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: options.width,
        height: options.height,
      }) as DOMRect;

    const wrappers = Array.from(fixture.nativeElement.querySelectorAll('.pane-wrapper')) as HTMLElement[];
    wrappers.forEach((wrapper, index) => {
      wrapper.getBoundingClientRect = () =>
        ({
          left: 0,
          top: 0,
          width: options.width / (index === 0 ? 3 : 3),
          height: options.height / (index === 0 ? 3 : 3),
        }) as DOMRect;
    });
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render panes and handles', () => {
    const handles = fixture.debugElement.queryAll(By.css('.splitbar[role="separator"]'));
    expect(host.splitter).toBeTruthy();
    expect(handles.length).toBe(1);
  });

  it('should toggle collapsible pane via Enter on handle', () => {
    const handle = fixture.debugElement.query(By.css('.splitbar[role="separator"]')).nativeElement as HTMLElement;
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(host.collapsedEvents[0]).toBe(true);
  });

  it('adjusts pane sizes while dragging the handle', () => {
    mockRects({ width: 600, height: 300 });

    const handle = fixture.debugElement.query(By.css('.splitbar[role="separator"]')).nativeElement as HTMLElement;
    host.splitter.onMouseDown(new MouseEvent('mousedown', { clientX: 300, clientY: 0 }), 0);
    host.splitter.onMouseMove(new MouseEvent('mousemove', { clientX: 330, clientY: 0 }));
    host.splitter.onMouseUp();
    fixture.detectChanges();

    const firstPane = host.splitter.panes.toArray()[0];
    expect(firstPane.size).toMatch(/%$/);
  });

  it('should apply orientation classes', () => {
    const container = fixture.nativeElement.querySelector('.splitter-container') as HTMLElement;
    expect(container.classList.contains('vertical')).toBe(false);
    host.orientation = 'vertical';
    fixture.detectChanges();
    const verticalContainer = fixture.nativeElement.querySelector('.splitter-container') as HTMLElement;
    expect(verticalContainer.classList.contains('vertical')).toBe(true);
    expect(container.style.minHeight).toBeTruthy();
  });

  it('resizes vertically when orientation is vertical', () => {
    host.orientation = 'vertical';
    fixture.detectChanges();

    mockRects({ width: 600, height: 400 });

    host.splitter.onMouseDown(new MouseEvent('mousedown', { clientX: 0, clientY: 200 }), 0);
    host.splitter.onMouseMove(new MouseEvent('mousemove', { clientX: 0, clientY: 250 }));
    host.splitter.onMouseUp();
    fixture.detectChanges();

    const firstPane = host.splitter.panes.toArray()[0];
    expect(firstPane.size).toMatch(/%$/);
  });

  it('renders collapse caret icons for collapsible panes', () => {
    const icon = fixture.nativeElement.querySelector('.collapse-arrow') as HTMLElement | null;
    expect(icon).toBeTruthy();
    expect(icon?.className).toContain('bi-caret-left-fill');

    const handle = fixture.debugElement.query(By.css('.splitbar[role="separator"]')).nativeElement as HTMLElement;
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    const iconAfter = fixture.nativeElement.querySelector('.collapse-arrow') as HTMLElement | null;
    expect(iconAfter?.className).toContain('bi-caret-right-fill');
  });

  it('sets accessibility attributes on handles', () => {
    fixture.detectChanges();

    mockRects({ width: 600, height: 300 });
    fixture.detectChanges();

    const handle = fixture.nativeElement.querySelector('.splitbar[role=\"separator\"]') as HTMLElement | null;
    expect(handle?.getAttribute('aria-orientation')).toBe('vertical');
    expect(host.splitter.getHandleValueNow(0)).not.toBeNull();
    expect(host.splitter.getHandleValueMin(0)).not.toBeNull();
    expect(host.splitter.getHandleValueMax(0)).not.toBeNull();
  });
});
