import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  output,
  signal,
} from "@angular/core";
import {
  NgbSmartPasteField,
  NgbSmartPasteRequest,
  NgbSmartPasteSuggestion,
} from "./ai.types";
import { NgbPromptBoxComponent } from "./prompt-box.component";

@Component({
  selector: "ngb-smart-paste",
  standalone: true,
  imports: [NgbPromptBoxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: "./ai.scss",
  template: `
    <section class="ngb-ai-panel" [attr.aria-label]="label()">
      <header class="ngb-ai-header"><h2 class="h6 mb-0">{{ label() }}</h2><span class="ngb-ai-muted small">Review before applying</span></header>
      <ngb-prompt-box label="Paste source text" submitLabel="Find field values" [submitOnEnter]="false" [clearOnSubmit]="false" [value]="source()" (valueChange)="source.set($event)" [busy]="busy()" [disabled]="disabled() || !fields().length" (promptSubmit)="request($event)" (stop)="stop.emit()" />
      @if (error()) { <p class="ngb-ai-error" role="alert">{{ error() }}</p> }
      <span class="visually-hidden" role="status" aria-live="polite">{{ candidates().length ? candidates().length + ' proposed fields ready for review.' : '' }}</span>
      @if (candidates().length) {
        <fieldset class="ngb-ai-review" [disabled]="busy() || disabled()">
          <legend class="h6">Choose values to apply</legend>
          @for (candidate of candidates(); track candidate.field.key) {
            <div class="ngb-ai-field">
              <label class="ngb-ai-check"><input type="checkbox" class="form-check-input" [checked]="!excluded().has(candidate.field.key)" (change)="toggle(candidate.field.key)" /> {{ candidate.field.label }}</label>
              <span class="ngb-ai-muted small">Current: {{ candidate.field.value || 'Empty' }}</span>
              <label class="ngb-ai-label small">Proposed {{ candidate.field.label }}
                <input type="text" class="form-control form-control-sm" [value]="edits().get(candidate.field.key) ?? candidate.value" (input)="edit(candidate.field.key, $event)" />
              </label>
            </div>
          }
        </fieldset>
        <button type="button" class="btn btn-sm btn-primary" [disabled]="busy() || disabled() || !selected().length" (click)="apply()">Apply {{ selected().length }} values</button>
      } @else { <p class="ngb-ai-muted mt-3">{{ emptyText() }}</p> }
    </section>
  `,
})
export class NgbSmartPasteComponent {
  readonly label = input("Fill from a note");
  readonly emptyText = input(
    "Paste a note, then review the proposed field values here."
  );
  readonly fields = input<readonly NgbSmartPasteField[]>([]);
  readonly suggestions = input<readonly NgbSmartPasteSuggestion[]>([]);
  readonly disabled = input(false);
  readonly busy = input(false);
  readonly error = input("");
  readonly mappingRequest = output<NgbSmartPasteRequest>();
  readonly valuesApply = output<readonly NgbSmartPasteSuggestion[]>();
  readonly stop = output<void>();
  readonly source = model("");
  readonly excluded = signal(new Set<string>());
  readonly edits = signal(new Map<string, string>());
  readonly candidates = computed(() => {
    const seen = new Set<string>();
    const result: { field: NgbSmartPasteField; value: string }[] = [];
    for (const field of this.fields()) {
      if (seen.has(field.key)) continue;
      seen.add(field.key);
      const candidate = this.suggestions().find(
        (s) => s.field === field.key && typeof s.value === "string"
      );
      if (candidate) result.push({ field, value: candidate.value });
    }
    return result;
  });
  readonly selected = computed(() =>
    this.candidates()
      .filter((c) => !this.excluded().has(c.field.key))
      .map((c) => ({
        field: c.field.key,
        value: this.edits().get(c.field.key) ?? c.value,
      }))
  );
  constructor() {
    effect(() => {
      this.suggestions();
      this.fields();
      this.excluded.set(new Set());
      this.edits.set(new Map());
    });
  }
  request(text: string): void {
    if (this.disabled() || this.busy() || !text.trim() || !this.fields().length)
      return;
    this.mappingRequest.emit({
      text: text.trim(),
      fields: this.fields().map((field) => ({ ...field })),
    });
  }
  toggle(key: string): void {
    this.excluded.update((current) => {
      const next = new Set(current);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }
  edit(key: string, event: Event): void {
    this.edits.update((current) =>
      new Map(current).set(key, (event.target as HTMLInputElement).value)
    );
  }
  apply(): void {
    if (!this.disabled() && !this.busy() && this.selected().length)
      this.valuesApply.emit(this.selected());
  }
}
