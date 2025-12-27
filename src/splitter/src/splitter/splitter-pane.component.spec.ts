import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbSplitterPaneComponent } from './splitter-pane.component';

@Component({
  standalone: true,
  imports: [NgbSplitterPaneComponent],
  template: `
    <ngb-splitter-pane
      [collapsible]="collapsible"
      [collapsed]="collapsed"
      [scrollable]="scrollable"
      (collapsedChange)="events.push($event)"
    >
      <div class="stub-content">Pane slot</div>
    </ngb-splitter-pane>
  `,
})
class HostComponent {
  @ViewChild(NgbSplitterPaneComponent) pane!: NgbSplitterPaneComponent;
  collapsible = true;
  collapsed = false;
  scrollable = true;
  events: boolean[] = [];
}

describe('NgbSplitterPaneComponent', () => {
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

  it('should expose its projected content through template', () => {
    expect(host.pane.template).toBeTruthy();
    const view = host.pane.template.createEmbeddedView(null);
    view.detectChanges();
    const wrapper = view.rootNodes[0] as HTMLElement | undefined;
    const projected = wrapper?.querySelector?.('.stub-content') as HTMLElement | null | undefined;
    expect(projected?.textContent).toContain('Pane slot');
  });

  it('should wire collapsedChange output', () => {
    host.pane.collapsedChange.emit(true);
    host.pane.collapsedChange.emit(false);
    expect(host.events).toEqual([true, false]);
  });

  it('should render scrollable template wrapper', () => {
    const view = host.pane.template.createEmbeddedView(null);
    view.detectChanges();

    const wrapper = view.rootNodes[0] as HTMLDivElement | undefined;
    expect(wrapper?.style.overflow).toBe('auto');

    host.scrollable = false;
    fixture.detectChanges();
    const viewAfter = host.pane.template.createEmbeddedView(null);
    viewAfter.detectChanges();

    const wrapperAfter = viewAfter.rootNodes[0] as HTMLDivElement | undefined;
    expect(wrapperAfter?.style.overflow).toBe('hidden');
  });
});
