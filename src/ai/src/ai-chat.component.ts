import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from "@angular/core";
import { NgbAiFeedback, NgbAiMessage } from "./ai.types";
import { NgbPromptBoxComponent } from "./prompt-box.component";

@Component({
  selector: "ngb-ai-chat",
  standalone: true,
  imports: [NgbPromptBoxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: "./ai.scss",
  template: `
    <section class="ngb-ai-panel ngb-ai-chat" [attr.aria-label]="label()">
      <header class="ngb-ai-header"><h2 class="h6 mb-0">{{ label() }}</h2><span class="ngb-ai-muted small">{{ busy() ? 'Responding…' : 'Ready' }}</span></header>
      <div class="ngb-ai-transcript" role="log" aria-live="polite" aria-relevant="additions text" [attr.aria-busy]="busy()" tabindex="0" [attr.aria-label]="label() + ' messages'">
        @for (message of messages(); track message.id) {
          <article class="ngb-ai-message" [class.ngb-ai-message-user]="message.role === 'user'">
            <strong class="small">{{ message.role === 'user' ? userLabel() : message.role === 'assistant' ? assistantLabel() : 'Notice' }}</strong>
            <p class="ngb-ai-text">{{ message.content }}</p>
            @if (message.status === 'streaming') { <span class="ngb-ai-muted small">Receiving response…</span> }
            @if (message.status === 'error') {
              <p class="ngb-ai-error" role="alert">{{ message.error || 'The response could not be completed.' }}</p>
              <button type="button" class="btn btn-sm btn-outline-secondary" [disabled]="busy() || disabled()" (click)="retry.emit(message.id)">Retry</button>
            }
            @if (message.role === 'assistant' && message.status !== 'streaming' && message.status !== 'error') {
              <div class="ngb-ai-actions" role="group" aria-label="Response feedback">
                <button type="button" class="btn btn-sm btn-outline-secondary" [disabled]="disabled()" [attr.aria-pressed]="ratings()[message.id] === 'helpful'" (click)="rate(message.id, 'helpful')">Helpful</button>
                <button type="button" class="btn btn-sm btn-outline-secondary" [disabled]="disabled()" [attr.aria-pressed]="ratings()[message.id] === 'unhelpful'" (click)="rate(message.id, 'unhelpful')">Needs work</button>
              </div>
            }
          </article>
        } @empty { <p class="ngb-ai-muted">{{ emptyText() }}</p> }
      </div>
      @if (error()) { <p class="ngb-ai-error" role="alert">{{ error() }}</p> }
      <ngb-prompt-box [busy]="busy()" [disabled]="disabled()" [suggestions]="suggestions()" (promptSubmit)="promptSubmit.emit($event)" (stop)="stop.emit()" />
    </section>
  `,
})
export class NgbAiChatComponent {
  readonly label = input("Workspace assistant");
  readonly userLabel = input("You");
  readonly assistantLabel = input("Assistant");
  readonly emptyText = input("Start a conversation about your work.");
  readonly messages = input<readonly NgbAiMessage[]>([]);
  readonly suggestions = input<readonly string[]>([]);
  readonly busy = input(false);
  readonly disabled = input(false);
  readonly error = input("");
  readonly promptSubmit = output<string>();
  readonly stop = output<void>();
  readonly retry = output<string>();
  readonly feedback = output<NgbAiFeedback>();
  readonly ratings = signal<Record<string, NgbAiFeedback["value"]>>({});
  rate(id: string, value: "helpful" | "unhelpful"): void {
    if (this.disabled()) return;
    const next = this.ratings()[id] === value ? null : value;
    this.ratings.update((current) => ({ ...current, [id]: next }));
    this.feedback.emit({ id, value: next });
  }
}
