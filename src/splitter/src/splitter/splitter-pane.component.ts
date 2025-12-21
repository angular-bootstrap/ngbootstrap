import { Component, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'ngb-splitter-pane',
  standalone: true,
  template: `<ng-template #paneTpl><ng-content></ng-content></ng-template>`,
})
export class NgbSplitterPaneComponent {
  @ViewChild('paneTpl', { static: true }) templateRef!: TemplateRef<any>;

  @Input() size?: string;
  @Input() min?: string;
  @Input() max?: string;
  @Input() collapsible = false;
  @Input() collapsed = false;

  @Output() collapsedChange = new EventEmitter<boolean>();

  toggleCollapsed(next?: boolean) {
    const value = next ?? !this.collapsed;
    if (value !== this.collapsed) {
      this.collapsed = value;
      this.collapsedChange.emit(this.collapsed);
    }
  }
}
