import { Component, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'ngb-splitter-pane',
  standalone: true,
template: `<ng-template #content>
      <div [style.overflow]="scrollable ? 'auto' : 'hidden'" style="height: 100%; width: 100%;">
        <ng-content></ng-content>
      </div>
    </ng-template>`,
  styles: [`:host { display: block; position: relative; }`]
})
export class NgbSplitterPaneComponent {
  @Input() size: string = ''; // e.g., '30%' or '200px'
  @Input() min: string = '0px';
  @Input() max: string = '100%';
  @Input() scrollable: boolean = true;
  @Input() collapsible: boolean = false;
  @Input() collapsed: boolean = false;
  @Output() collapsedChange = new EventEmitter<boolean>();

  @ViewChild('content', { static: true }) template!: TemplateRef<any>;

}
