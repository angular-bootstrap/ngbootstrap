import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { NgbAiResponse } from "./ai.types";
import { NgbPromptBoxComponent } from "./prompt-box.component";

@Component({
  selector: "ngb-ai-prompt",
  standalone: true,
  imports: [NgbPromptBoxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: "./ai.scss",
  template: `
    <section class="ngb-ai-panel ngb-ai-workspace" [attr.aria-label]="label()">
      <header class="ngb-ai-header"><h2 class="h6 mb-0">{{ label() }}</h2><span class="ngb-ai-muted small">{{ responses().length }} {{ responses().length === 1 ? 'draft' : 'drafts' }}</span></header>
      <div class="ngb-ai-workspace-grid">
      <div class="ngb-ai-brief"><span class="ngb-ai-section-label">01 · Brief</span>
      <ngb-prompt-box [label]="promptLabel()" submitLabel="Create draft" [clearOnSubmit]="false" [busy]="busy()" [disabled]="disabled()" [suggestions]="suggestions()" (promptSubmit)="promptSubmit.emit($event)" (stop)="stop.emit()" />
      @if (error()) { <p class="ngb-ai-error" role="alert">{{ error() }}</p> }
      </div>
      <div class="ngb-ai-drafts" role="region" aria-label="Generated drafts" tabindex="0" aria-live="polite" [attr.aria-busy]="busy()">
        <span class="ngb-ai-section-label">02 · Review drafts</span>
        @for (response of responses(); track response.id) {
          <article class="ngb-ai-result">
            <h3 class="h6">{{ response.prompt }}</h3><p class="ngb-ai-text">{{ response.text }}</p>
            <div class="ngb-ai-actions">
              <button type="button" class="btn btn-sm btn-primary" [disabled]="busy() || disabled()" (click)="responseApply.emit(response)">Use draft</button>
              <button type="button" class="btn btn-sm btn-outline-secondary" [disabled]="busy() || disabled()" (click)="regenerate.emit(response)">Try again</button>
              <button type="button" class="btn btn-sm btn-outline-secondary" [disabled]="busy() || disabled()" (click)="responseDismiss.emit(response.id)">Dismiss</button>
            </div>
          </article>
        } @empty { <p class="ngb-ai-muted mt-3">{{ emptyText() }}</p> }
      </div>
      </div>
    </section>
  `,
})
export class NgbAiPromptComponent {
  readonly label = input("Draft workspace");
  readonly promptLabel = input("Describe the draft");
  readonly emptyText = input("Generated drafts appear here for review.");
  readonly responses = input<readonly NgbAiResponse[]>([]);
  readonly suggestions = input<readonly string[]>([]);
  readonly busy = input(false);
  readonly disabled = input(false);
  readonly error = input("");
  readonly promptSubmit = output<string>();
  readonly stop = output<void>();
  readonly responseApply = output<NgbAiResponse>();
  readonly regenerate = output<NgbAiResponse>();
  readonly responseDismiss = output<string>();
}
