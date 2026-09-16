import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from "@angular/core";
import { NgbInlineAiRequest } from "./ai.types";
import { NgbPromptBoxComponent } from "./prompt-box.component";

let nextInlineId = 0;

@Component({
  selector: "ngb-inline-ai-prompt",
  standalone: true,
  imports: [NgbPromptBoxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: "./ai.scss",
  template: `
    <button #trigger type="button" class="btn btn-sm btn-outline-secondary" [disabled]="disabled()" [attr.aria-expanded]="open()" [attr.aria-controls]="open() ? panelId : null" (click)="toggle()">{{ label() }}</button>
    @if (open()) {
      <section [id]="panelId" class="ngb-ai-panel ngb-ai-inline" [attr.aria-label]="label()" (keydown.escape)="close($event)">
        <div class="ngb-ai-header"><strong class="small">Selected context</strong><button type="button" class="btn btn-sm btn-outline-secondary" (click)="close()">Close</button></div>
        <blockquote class="ngb-ai-context">{{ context() }}</blockquote>
        <ngb-prompt-box label="How should this change?" submitLabel="Suggest edit" [suggestions]="suggestions()" [busy]="busy()" [disabled]="disabled()" (promptSubmit)="request($event)" (stop)="stop.emit()" />
        @if (error()) { <p class="ngb-ai-error" role="alert">{{ error() }}</p> }
        <span class="visually-hidden" role="status">{{ response() ? 'Proposed edit ready for review.' : '' }}</span>
        @if (response()) {
          <div class="ngb-ai-result"><strong class="small">Proposed edit</strong><p class="ngb-ai-text">{{ response() }}</p>
            <button type="button" class="btn btn-sm btn-primary" [disabled]="busy() || disabled()" (click)="apply()">Apply edit</button>
          </div>
        }
      </section>
    }
  `,
})
export class NgbInlineAiPromptComponent {
  readonly panelId = `ngb-ai-inline-${nextInlineId++}`;
  readonly label = input("Assist with this text");
  readonly context = input("");
  readonly suggestions = input<readonly string[]>([
    "Make it shorter",
    "Make the next action clear",
  ]);
  readonly response = input("");
  readonly error = input("");
  readonly busy = input(false);
  readonly disabled = input(false);
  readonly promptSubmit = output<NgbInlineAiRequest>();
  readonly responseApply = output<string>();
  readonly stop = output<void>();
  readonly closed = output<void>();
  readonly open = signal(false);
  private readonly trigger =
    viewChild<ElementRef<HTMLButtonElement>>("trigger");
  toggle(): void {
    if (this.disabled()) return;
    if (this.open()) this.close();
    else this.open.set(true);
  }
  request(instruction: string): void {
    if (!this.busy() && !this.disabled() && instruction.trim())
      this.promptSubmit.emit({
        instruction: instruction.trim(),
        context: this.context(),
      });
  }
  apply(): void {
    if (this.disabled() || this.busy() || !this.response().trim()) return;
    this.responseApply.emit(this.response());
    this.close();
  }
  close(event?: Event): void {
    event?.stopPropagation();
    if (this.busy()) this.stop.emit();
    this.open.set(false);
    this.closed.emit();
    this.trigger()?.nativeElement.focus();
  }
}
