import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
} from "@angular/core";

let nextPromptId = 0;

@Component({
  selector: "ngb-prompt-box",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: "./ai.scss",
  template: `
    <div class="ngb-ai-composer" [attr.aria-busy]="busy()">
      <label class="ngb-ai-label">
        {{ label() }}
        <textarea class="form-control" rows="3" [value]="value()"
          [placeholder]="placeholder()" [disabled]="disabled()" [readOnly]="busy()" [attr.aria-describedby]="descriptionId"
          [attr.maxlength]="limit()" (input)="updateValue($event)"
          (keydown)="onKeydown($event)"></textarea>
      </label>
      @if (suggestions().length) {
        <div class="ngb-ai-actions" role="group" aria-label="Suggested prompts">
          @for (suggestion of suggestions(); track $index) {
            <button type="button" class="btn btn-sm btn-outline-secondary"
              [disabled]="disabled() || busy()" (click)="choose(suggestion)">{{ suggestion }}</button>
          }
        </div>
      }
      <div class="ngb-ai-composer-footer">
        <span class="ngb-ai-muted small">{{ value().length }} / {{ limit() }}</span>
        <button type="button" class="btn btn-sm" [class.btn-outline-secondary]="busy()" [class.btn-primary]="!busy()" [disabled]="disabled() || (!busy() && !canSubmit())" (click)="busy() ? stop.emit() : submit()">{{ busy() ? stopLabel() : submitLabel() }}</button>
      </div>
      <span class="visually-hidden" [id]="descriptionId">{{ submitOnEnter() ? 'Enter sends. Shift+Enter adds a new line.' : 'Enter adds a new line. Use the submit button to send.' }} Maximum {{ limit() }} characters.</span>
    </div>
    <span class="visually-hidden" role="status" aria-live="polite">{{ busy() ? 'Request in progress. Use Stop to cancel.' : '' }}</span>
  `,
})
export class NgbPromptBoxComponent {
  readonly descriptionId = `ngb-ai-prompt-help-${nextPromptId++}`;
  readonly value = model("");
  readonly label = input("Your request");
  readonly placeholder = input("Describe what you need…");
  readonly submitLabel = input("Send");
  readonly stopLabel = input("Stop");
  readonly suggestions = input<readonly string[]>([]);
  readonly disabled = input(false);
  readonly busy = input(false);
  readonly maxLength = input(4000);
  readonly submitOnEnter = input(true);
  readonly clearOnSubmit = input(true);
  readonly promptSubmit = output<string>();
  readonly stop = output<void>();
  readonly limit = computed(() =>
    Number.isFinite(this.maxLength())
      ? Math.max(1, Math.floor(this.maxLength()))
      : 4000
  );
  readonly canSubmit = computed(
    () =>
      !this.disabled() &&
      !this.busy() &&
      !!this.value().trim() &&
      this.value().length <= this.limit()
  );

  updateValue(event: Event): void {
    this.value.set((event.target as HTMLTextAreaElement).value);
  }
  choose(value: string): void {
    if (!this.disabled() && !this.busy())
      this.value.set(value.slice(0, this.limit()));
  }
  submit(): void {
    if (!this.canSubmit()) return;
    const value = this.value().trim();
    if (this.clearOnSubmit()) this.value.set("");
    this.promptSubmit.emit(value);
  }
  onKeydown(event: KeyboardEvent): void {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.isComposing &&
      this.submitOnEnter()
    ) {
      event.preventDefault();
      this.submit();
    }
  }
}
