import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ngb-json-preview',
  standalone: true,
  template: `
    <pre class="ngb-json-preview" [style.max-height.px]="maxHeight"><code>{{ formattedJson }}</code></pre>
  `,
  styles: [`
    :host {
      display: block;
    }

    .ngb-json-preview {
      margin: 0;
      overflow: auto;
      padding: 0.75rem 1rem;
      border: 0;
      background: var(--bs-body-bg, #fff);
      color: var(--bs-body-color, #212529);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      font-size: 0.875rem;
      line-height: 1.4;
      white-space: pre;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgbJsonPreviewComponent {
  @Input() value: unknown = null;
  @Input() indent = 2;
  @Input() fallback = 'null';
  @Input() maxHeight = 320;

  get formattedJson(): string {
    if (typeof this.value === 'string') {
      return this.value;
    }

    try {
      return JSON.stringify(this.value, null, this.indent) ?? this.fallback;
    } catch {
      return this.fallback;
    }
  }
}
