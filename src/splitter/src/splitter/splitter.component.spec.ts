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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render panes and handles', () => {
    const handles = fixture.debugElement.queryAll(By.css('button[role="separator"]'));
    expect(host.splitter).toBeTruthy();
    expect(handles.length).toBe(1);
  });

  it('should toggle collapsible pane via handle', () => {
    const handle = fixture.debugElement.query(By.css('button[role="separator"]')).nativeElement as HTMLButtonElement;
    handle.dispatchEvent(new Event('dblclick'));
    fixture.detectChanges();
    expect(host.collapsedEvents[0]).toBe(true);
  });

  it('should apply orientation classes', () => {
    const container = fixture.debugElement.query(By.css('ngb-splitter > div')).nativeElement as HTMLElement;
    expect(container.classList.contains('flex-row')).toBe(true);
    host.orientation = 'vertical';
    fixture.detectChanges();
    expect(container.classList.contains('flex-column')).toBe(true);
  });
});
