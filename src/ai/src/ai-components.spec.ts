import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { NgbPromptBoxComponent } from "./prompt-box.component";
import { NgbAiChatComponent } from "./ai-chat.component";
import { NgbAiPromptComponent } from "./ai-prompt.component";
import { NgbInlineAiPromptComponent } from "./inline-ai-prompt.component";
import { NgbSmartPasteComponent } from "./smart-paste.component";

function buttons<T>(f: ComponentFixture<T>): HTMLButtonElement[] {
  return [...f.nativeElement.querySelectorAll("button")];
}
function click<T>(f: ComponentFixture<T>, label: string): void {
  const button = buttons(f).find((b) => b.textContent?.trim() === label);
  expect(button).toBeDefined();
  button!.click();
  f.detectChanges();
}
function set<T>(f: ComponentFixture<T>, name: string, value: unknown): void {
  f.componentRef.setInput(name, value);
  f.detectChanges();
}
function composer<T>(f: ComponentFixture<T>): NgbPromptBoxComponent {
  return f.debugElement.query(By.directive(NgbPromptBoxComponent))
    .componentInstance;
}

beforeEach(() =>
  TestBed.configureTestingModule({
    imports: [
      NgbPromptBoxComponent,
      NgbAiChatComponent,
      NgbAiPromptComponent,
      NgbInlineAiPromptComponent,
      NgbSmartPasteComponent,
    ],
  })
);

describe("Prompt Box", () => {
  let f: ComponentFixture<NgbPromptBoxComponent>;
  beforeEach(() => {
    f = TestBed.createComponent(NgbPromptBoxComponent);
    f.detectChanges();
  });
  it("emits a trimmed request and clears the editable model", () => {
    const submit = jest.fn();
    const changed = jest.fn();
    f.componentInstance.promptSubmit.subscribe(submit);
    f.componentInstance.value.subscribe(changed);
    set(f, "value", "  Explain this order  ");
    click(f, "Send");
    expect(submit).toHaveBeenCalledWith("Explain this order");
    expect(f.componentInstance.value()).toBe("");
    expect(changed).toHaveBeenCalledWith("");
  });
  it.each(["", "   ", "\n\t"])("rejects empty input %p", (value) => {
    set(f, "value", value);
    const emit = jest.fn();
    f.componentInstance.promptSubmit.subscribe(emit);
    f.componentInstance.submit();
    expect(emit).not.toHaveBeenCalled();
  });
  it.each(["disabled", "busy"])("blocks submission when %s", (prop) => {
    set(f, "value", "Request");
    set(f, prop, true);
    const emit = jest.fn();
    f.componentInstance.promptSubmit.subscribe(emit);
    f.componentInstance.submit();
    expect(emit).not.toHaveBeenCalled();
    expect(f.nativeElement.querySelector("textarea").disabled).toBe(prop === "disabled");
    expect(f.nativeElement.querySelector("textarea").readOnly).toBe(prop === "busy");
  });
  it("enforces the limit on externally supplied values", () => {
    set(f, "maxLength", 3);
    set(f, "value", "long");
    expect(f.componentInstance.canSubmit()).toBe(false);
  });
  it("retains text when clearOnSubmit is false", () => {
    set(f, "value", "draft");
    set(f, "clearOnSubmit", false);
    click(f, "Send");
    expect(f.componentInstance.value()).toBe("draft");
  });
  it("chooses a suggestion without making a request", () => {
    set(f, "suggestions", ["Summarize"]);
    const emit = jest.fn();
    f.componentInstance.promptSubmit.subscribe(emit);
    click(f, "Summarize");
    expect(f.componentInstance.value()).toBe("Summarize");
    expect(emit).not.toHaveBeenCalled();
  });
  it("submits Enter, but preserves Shift+Enter and IME composition", () => {
    const emit = jest.fn();
    f.componentInstance.promptSubmit.subscribe(emit);
    set(f, "value", "Hello");
    for (const options of [{ shiftKey: true }, { isComposing: true }])
      f.componentInstance.onKeydown(
        new KeyboardEvent("keydown", { key: "Enter", ...options })
      );
    expect(emit).not.toHaveBeenCalled();
    f.nativeElement
      .querySelector("textarea")
      .dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
      );
    expect(emit).toHaveBeenCalledTimes(1);
  });
  it("supports multiline-only submission and cancellation", () => {
    set(f, "submitOnEnter", false);
    set(f, "value", "Hello");
    f.componentInstance.onKeydown(
      new KeyboardEvent("keydown", { key: "Enter" })
    );
    expect(f.componentInstance.value()).toBe("Hello");
    const stop = jest.fn();
    f.componentInstance.stop.subscribe(stop);
    set(f, "busy", true);
    click(f, "Stop");
    expect(stop).toHaveBeenCalledTimes(1);
  });
});

describe("AI Chat", () => {
  let f: ComponentFixture<NgbAiChatComponent>;
  beforeEach(() => {
    f = TestBed.createComponent(NgbAiChatComponent);
    f.detectChanges();
  });
  it("renders an accessible empty transcript", () => {
    const log = f.nativeElement.querySelector('[role="log"]');
    expect(log.getAttribute("aria-live")).toBe("polite");
    expect(log.textContent).toContain("Start a conversation");
  });
  it("renders response content as text, never executable HTML", () => {
    set(f, "messages", [
      { id: "a", role: "assistant", content: "<img src=x onerror=alert(1)>" },
    ]);
    expect(f.nativeElement.querySelector("img")).toBeNull();
    expect(f.nativeElement.textContent).toContain("<img src=x");
  });
  it("forwards prompt and stop events", () => {
    const send = jest.fn(),
      stop = jest.fn();
    f.componentInstance.promptSubmit.subscribe(send);
    f.componentInstance.stop.subscribe(stop);
    composer(f).value.set("Find orders");
    composer(f).submit();
    composer(f).stop.emit();
    expect(send).toHaveBeenCalledWith("Find orders");
    expect(stop).toHaveBeenCalledTimes(1);
  });
  it("supports immutable streamed updates without feedback until complete", () => {
    set(f, "messages", [
      { id: "a", role: "assistant", content: "First", status: "streaming" },
    ]);
    expect(buttons(f).some((b) => b.textContent === "Helpful")).toBe(false);
    set(f, "messages", [
      {
        id: "a",
        role: "assistant",
        content: "First answer",
        status: "complete",
      },
    ]);
    expect(f.nativeElement.textContent).toContain("First answer");
    expect(buttons(f).some((b) => b.textContent === "Helpful")).toBe(true);
  });
  it("emits retry with the failed message id", () => {
    const retry = jest.fn();
    f.componentInstance.retry.subscribe(retry);
    set(f, "messages", [
      {
        id: "failed",
        role: "assistant",
        content: "",
        status: "error",
        error: "Connection lost",
      },
    ]);
    expect(
      f.nativeElement.querySelector('[role="alert"]').textContent
    ).toContain("Connection lost");
    click(f, "Retry");
    expect(retry).toHaveBeenCalledWith("failed");
  });
  it("toggles feedback and exposes aria-pressed", () => {
    set(f, "messages", [{ id: "a", role: "assistant", content: "Answer" }]);
    const feedback = jest.fn();
    f.componentInstance.feedback.subscribe(feedback);
    click(f, "Helpful");
    expect(feedback).toHaveBeenLastCalledWith({ id: "a", value: "helpful" });
    expect(
      buttons(f)
        .find((b) => b.textContent === "Helpful")
        ?.getAttribute("aria-pressed")
    ).toBe("true");
    click(f, "Helpful");
    expect(feedback).toHaveBeenLastCalledWith({ id: "a", value: null });
  });
});

describe("AI Prompt workspace", () => {
  let f: ComponentFixture<NgbAiPromptComponent>;
  const response = {
    id: "r1",
    prompt: "Summarize",
    text: "Three orders need review.",
  };
  beforeEach(() => {
    f = TestBed.createComponent(NgbAiPromptComponent);
    f.detectChanges();
  });
  it("shows an empty state and a recoverable error", () => {
    expect(f.nativeElement.textContent).toContain("Generated drafts");
    set(f, "error", "Try again later");
    expect(
      f.nativeElement.querySelector('[role="alert"]').textContent
    ).toContain("Try again later");
  });
  it("forwards request text", () => {
    const emit = jest.fn();
    f.componentInstance.promptSubmit.subscribe(emit);
    composer(f).value.set("Draft a summary");
    composer(f).submit();
    expect(emit).toHaveBeenCalledWith("Draft a summary");
  });
  it("emits apply, regenerate and dismissal without mutating input history", () => {
    const values = [response];
    set(f, "responses", values);
    const apply = jest.fn(),
      retry = jest.fn(),
      dismiss = jest.fn();
    f.componentInstance.responseApply.subscribe(apply);
    f.componentInstance.regenerate.subscribe(retry);
    f.componentInstance.responseDismiss.subscribe(dismiss);
    click(f, "Use draft");
    click(f, "Try again");
    click(f, "Dismiss");
    expect(apply).toHaveBeenCalledWith(response);
    expect(retry).toHaveBeenCalledWith(response);
    expect(dismiss).toHaveBeenCalledWith("r1");
    expect(values).toEqual([response]);
  });
  it("disables result actions while generating", () => {
    set(f, "responses", [response]);
    set(f, "busy", true);
    expect(
      buttons(f)
        .filter((b) =>
          ["Use draft", "Try again", "Dismiss"].includes(b.textContent!.trim())
        )
        .every((b) => b.disabled)
    ).toBe(true);
  });
});

describe("Inline AI Prompt", () => {
  let f: ComponentFixture<NgbInlineAiPromptComponent>;
  beforeEach(() => {
    f = TestBed.createComponent(NgbInlineAiPromptComponent);
    f.detectChanges();
  });
  it("opens an inline region and emits instruction with original context", () => {
    set(f, "context", "Original wording");
    click(f, "Assist with this text");
    const request = jest.fn();
    f.componentInstance.promptSubmit.subscribe(request);
    composer(f).value.set("Shorten");
    composer(f).submit();
    expect(request).toHaveBeenCalledWith({
      instruction: "Shorten",
      context: "Original wording",
    });
  });
  it("only applies explicitly and leaves the original input unchanged", () => {
    set(f, "context", "Original");
    set(f, "response", "Improved");
    const apply = jest.fn();
    f.componentInstance.responseApply.subscribe(apply);
    click(f, "Assist with this text");
    expect(apply).not.toHaveBeenCalled();
    click(f, "Apply edit");
    expect(apply).toHaveBeenCalledWith("Improved");
    expect(f.componentInstance.context()).toBe("Original");
    expect(f.componentInstance.open()).toBe(false);
  });
  it("Escape cancels pending work and restores trigger focus", () => {
    click(f, "Assist with this text");
    set(f, "busy", true);
    const stop = jest.fn();
    f.componentInstance.stop.subscribe(stop);
    f.nativeElement
      .querySelector("section")
      .dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
      );
    f.detectChanges();
    expect(stop).toHaveBeenCalledTimes(1);
    expect(f.componentInstance.open()).toBe(false);
    expect(document.activeElement).toBe(
      f.nativeElement.querySelector("button")
    );
  });
  it("closing through the trigger also cancels pending work", () => {
    click(f, "Assist with this text");
    set(f, "busy", true);
    const stop = jest.fn();
    f.componentInstance.stop.subscribe(stop);
    click(f, "Assist with this text");
    expect(stop).toHaveBeenCalledTimes(1);
  });
  it("does not open or apply when disabled", () => {
    set(f, "disabled", true);
    set(f, "response", "New");
    const apply = jest.fn();
    f.componentInstance.responseApply.subscribe(apply);
    f.componentInstance.toggle();
    f.componentInstance.apply();
    expect(f.componentInstance.open()).toBe(false);
    expect(apply).not.toHaveBeenCalled();
  });
});

describe("Smart Paste", () => {
  let f: ComponentFixture<NgbSmartPasteComponent>;
  const fields = [
    { key: "name", label: "Name", value: "Existing" },
    { key: "email", label: "Email" },
  ];
  beforeEach(() => {
    f = TestBed.createComponent(NgbSmartPasteComponent);
    set(f, "fields", fields);
  });
  it("emits the source and a copied field schema, without reading clipboard or changing fields", () => {
    const request = jest.fn();
    f.componentInstance.mappingRequest.subscribe(request);
    f.componentInstance.request("  Avery, a@example.com  ");
    expect(request).toHaveBeenCalledWith({
      text: "Avery, a@example.com",
      fields,
    });
    expect(request.mock.calls[0][0].fields[0]).not.toBe(fields[0]);
    expect(fields[0].value).toBe("Existing");
  });
  it("binds source text in both directions through the composer", () => {
    set(f, "source", "Initial source");
    expect(f.nativeElement.querySelector("textarea").value).toBe(
      "Initial source"
    );
    const changed = jest.fn();
    f.componentInstance.source.subscribe(changed);
    const textarea = f.nativeElement.querySelector("textarea");
    textarea.value = "Revised source";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    expect(f.componentInstance.source()).toBe("Revised source");
    expect(changed).toHaveBeenCalledWith("Revised source");
  });
  it("does not apply when every proposal is excluded", () => {
    set(f, "suggestions", [{ field: "name", value: "Avery" }]);
    const apply = jest.fn();
    f.componentInstance.valuesApply.subscribe(apply);
    f.componentInstance.toggle("name");
    f.componentInstance.apply();
    expect(apply).not.toHaveBeenCalled();
  });
  it("ignores unknown and duplicate suggestions, preserving schema order", () => {
    set(f, "suggestions", [
      { field: "unknown", value: "x" },
      { field: "email", value: "a@example.com" },
      { field: "name", value: "Avery" },
      { field: "name", value: "Duplicate" },
    ]);
    expect(f.componentInstance.selected()).toEqual([
      { field: "name", value: "Avery" },
      { field: "email", value: "a@example.com" },
    ]);
  });
  it("requires explicit apply and allows excluding and editing proposals", () => {
    const apply = jest.fn();
    f.componentInstance.valuesApply.subscribe(apply);
    set(f, "suggestions", [
      { field: "name", value: "Avery" },
      { field: "email", value: "a@example.com" },
    ]);
    expect(apply).not.toHaveBeenCalled();
    const inputs = f.nativeElement.querySelectorAll('input[type="text"]');
    inputs[0].value = "Avery Chen";
    inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
    f.nativeElement.querySelectorAll('input[type="checkbox"]')[1].click();
    f.detectChanges();
    click(f, "Apply 1 values");
    expect(apply).toHaveBeenCalledWith([
      { field: "name", value: "Avery Chen" },
    ]);
  });
  it("resets edits and selections when new suggestions arrive", () => {
    set(f, "suggestions", [{ field: "name", value: "One" }]);
    f.componentInstance.toggle("name");
    set(f, "suggestions", [{ field: "name", value: "Two" }]);
    expect(f.componentInstance.selected()).toEqual([
      { field: "name", value: "Two" },
    ]);
  });
  it("supports field keys that are Object prototype names", () => {
    set(f, "fields", [{ key: "toString", label: "Label" }]);
    set(f, "suggestions", [{ field: "toString", value: "Safe value" }]);
    expect(f.componentInstance.selected()).toEqual([
      { field: "toString", value: "Safe value" },
    ]);
  });
  it.each(["disabled", "busy"])(
    "blocks mapping and applying while %s",
    (prop) => {
      set(f, "suggestions", [{ field: "name", value: "Avery" }]);
      set(f, prop, true);
      const apply = jest.fn(),
        request = jest.fn();
      f.componentInstance.valuesApply.subscribe(apply);
      f.componentInstance.mappingRequest.subscribe(request);
      f.componentInstance.request("Source");
      f.componentInstance.apply();
      expect(apply).not.toHaveBeenCalled();
      expect(request).not.toHaveBeenCalled();
    }
  );
});

describe('AI accessibility contracts', () => {
  it('associates unique keyboard instructions with each labeled composer', () => {
    const first = TestBed.createComponent(NgbPromptBoxComponent);
    const second = TestBed.createComponent(NgbPromptBoxComponent);
    first.detectChanges(); second.detectChanges();
    const input = first.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    expect(input.labels?.length).toBe(1);
    const description = input.getAttribute('aria-describedby');
    expect(first.nativeElement.querySelector(`#${description}`).textContent).toContain('Shift+Enter');
    expect(second.nativeElement.querySelector('textarea').getAttribute('aria-describedby')).not.toBe(description);
    set(first, 'submitOnEnter', false);
    expect(first.nativeElement.querySelector(`#${description}`).textContent).toContain('Use the submit button');
  });
  it('keeps the composer focused and read-only while busy', () => {
    const f = TestBed.createComponent(NgbPromptBoxComponent); f.detectChanges();
    const input = f.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    input.focus(); set(f, 'busy', true);
    expect(document.activeElement).toBe(input);
    expect(input.disabled).toBe(false); expect(input.readOnly).toBe(true);
    expect(f.nativeElement.querySelector('[role=status]').textContent).toContain('Stop');
  });
  it('keeps the action button mounted when Send becomes Stop', () => {
    const f = TestBed.createComponent(NgbPromptBoxComponent);
    set(f, 'value', 'Review');
    const action = buttons(f)[0]; action.focus();
    set(f, 'busy', true);
    expect(buttons(f)[0]).toBe(action); expect(document.activeElement).toBe(action);
    expect(action.textContent).toBe('Stop'); expect(action.disabled).toBe(false);
    const stop = jest.fn(); f.componentInstance.stop.subscribe(stop); action.click();
    expect(stop).toHaveBeenCalledTimes(1);
  });
  it('does not intercept Tab or Shift+Enter in the composer', () => {
    const f = TestBed.createComponent(NgbPromptBoxComponent); f.detectChanges();
    for (const options of [{key:'Tab'}, {key:'Enter', shiftKey:true}, {key:'Enter', isComposing:true}]) {
      const event = new KeyboardEvent('keydown', {...options, cancelable:true, bubbles:true});
      f.nativeElement.querySelector('textarea').dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
  });
  it('links the expanded inline panel and announces a completed proposal', () => {
    const f = TestBed.createComponent(NgbInlineAiPromptComponent); f.detectChanges();
    const trigger = buttons(f)[0]; expect(trigger.getAttribute('aria-expanded')).toBe('false');
    trigger.click(); f.detectChanges();
    const id = trigger.getAttribute('aria-controls');
    expect(f.nativeElement.querySelector(`#${id}`)).not.toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    set(f, 'response', 'Revised paragraph');
    expect(f.nativeElement.textContent).toContain('Proposed edit ready for review.');
    f.componentInstance.close(); f.detectChanges();
    expect(trigger.hasAttribute('aria-controls')).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });
  it('exposes drafts as a named keyboard-focusable scroll region', () => {
    const f = TestBed.createComponent(NgbAiPromptComponent); f.detectChanges();
    const region = f.nativeElement.querySelector('[role=region]');
    expect(region.getAttribute('aria-label')).toBe('Generated drafts');
    expect(region.tabIndex).toBe(0);
    set(f, 'busy', true); expect(region.getAttribute('aria-busy')).toBe('true');
  });
  it('announces paste proposals and labels both selection and editing controls', () => {
    const f = TestBed.createComponent(NgbSmartPasteComponent);
    set(f, 'fields', [{key:'name', label:'Name'}]);
    set(f, 'suggestions', [{field:'name', value:'Avery'}]);
    expect(f.nativeElement.textContent).toContain('1 proposed fields ready for review.');
    for (const input of f.nativeElement.querySelectorAll('input')) expect(input.labels.length).toBe(1);
    set(f, 'busy', true); expect(f.nativeElement.querySelector('fieldset').disabled).toBe(true);
  });
});
