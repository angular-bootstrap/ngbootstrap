import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { NgbStepperComponent } from './stepper.component';
import { NgbStepperStep } from './stepper.types';

@Component({
  standalone: true,
  imports: [NgbStepperComponent],
  template: `
    <ngb-stepper
      [steps]="steps"
      [(selectedIndex)]="selectedIndex"
      [orientation]="orientation"
      [labelPosition]="labelPosition"
      [contentPosition]="contentPosition"
      [allowRevisit]="allowRevisit"
      [lazy]="lazy"
      [theme]="theme"
      [responsive]="responsive"
      [disableAnimation]="disableAnimation"
      [animationDuration]="animationDuration"
      [stateIcons]="stateIcons"
      [nextLabel]="nextLabel"
      [previousLabel]="previousLabel"
      [resetLabel]="resetLabel"
      [cancelLabel]="cancelLabel"
      (nextClicked)="onNext($event)"
      (prevClicked)="onPrev($event)"
      (resetClicked)="onReset()"
      (cancelClicked)="onCancel()"
      (selectionChange)="onSelectionChange($event)"
      (selectedIndexChange)="onSelectedIndexChange($event)"
    >
      <ng-template #ngbStepperIcon let-index="index" let-state="state">
        <span class="custom-icon">C{{ index }}-{{ state }}</span>
      </ng-template>

      <ng-template #stepContent let-index="index">
        <div class="step-content">Step {{ index + 1 }} content</div>
      </ng-template>
    </ngb-stepper>
  `,
})
class HostTestComponent {
  @ViewChild(NgbStepperComponent) stepper!: NgbStepperComponent;
  @ViewChild('content', { static: true }) contentTpl!: TemplateRef<any>;

  steps: NgbStepperStep[] = [
    { label: 'Step 1', id: 's1' },
    { label: 'Step 2', id: 's2' },
    { label: 'Step 3', id: 's3', optional: true },
  ];

  selectedIndex = 0;
  orientation: 'horizontal' | 'vertical' = 'horizontal';
  labelPosition: 'top' | 'bottom' | 'left' | 'right' = 'right';
  contentPosition: 'top' | 'bottom' = 'bottom';
  allowRevisit = true;
  lazy = true;
  theme: 'bootstrap' | 'material' | 'tailwind' = 'bootstrap';
  responsive = true;
  disableAnimation = false;
  animationDuration = 150;
  stateIcons = { done: '✓', error: '!', number: '#', active: '•', disabled: '×' };

  nextLabel = 'Next';
  previousLabel = 'Previous';
  resetLabel = 'Reset';
  cancelLabel = 'Cancel';

  nextEvents: number[] = [];
  prevEvents: number[] = [];
  resetEvents = 0;
  cancelEvents = 0;
  selectionEvents: Array<{ previousIndex: number; currentIndex: number }> = [];
  selectedIndexEvents: number[] = [];

  onNext(i: number) {
    this.nextEvents.push(i);
  }

  onPrev(i: number) {
    this.prevEvents.push(i);
  }

  onReset() {
    this.resetEvents++;
  }

  onCancel() {
    this.cancelEvents++;
  }

  onSelectionChange(e: { previousIndex: number; currentIndex: number }) {
    this.selectionEvents.push({ previousIndex: e.previousIndex, currentIndex: e.currentIndex });
  }

  onSelectedIndexChange(i: number) {
    this.selectedIndexEvents.push(i);
  }
}

describe('NgbStepperComponent', () => {
  let fixture: ComponentFixture<HostTestComponent>;
  let host: HostTestComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostTestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostTestComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create host and stepper', () => {
    expect(host).toBeTruthy();
    expect(host.stepper).toBeTruthy();
  });

  it('navigates with next and prev and emits events', () => {
    expect(host.stepper.selectedIndex).toBe(0);

    host.stepper.next();
    fixture.detectChanges();

    expect(host.stepper.selectedIndex).toBe(1);
    expect(host.nextEvents).toContain(1);
    expect(host.selectionEvents.at(-1)).toEqual({ previousIndex: 0, currentIndex: 1 });
    expect(host.selectedIndexEvents.at(-1)).toBe(1);

    host.stepper.prev();
    fixture.detectChanges();

    expect(host.stepper.selectedIndex).toBe(0);
    expect(host.prevEvents).toContain(0);
  });

  it('reset returns to first step and clears visited', () => {
    host.stepper.next();
    host.stepper.next();
    fixture.detectChanges();

    expect(host.stepper.selectedIndex).toBe(2);

    host.stepper.onReset();
    fixture.detectChanges();

    expect(host.stepper.selectedIndex).toBe(0);
    expect(host.resetEvents).toBe(1);
  });

  it('cancel emits cancel event but does not change index', () => {
    host.stepper.onCancel();
    fixture.detectChanges();

    expect(host.stepper.selectedIndex).toBe(0);
    expect(host.cancelEvents).toBe(1);
  });

  it('honors allowRevisit=false by blocking backward header clicks', () => {
    host.stepper.next();
    host.stepper.next();
    fixture.detectChanges();

    host.allowRevisit = false;
    fixture.detectChanges();

    host.stepper.onHeaderClick(0);
    fixture.detectChanges();

    expect(host.stepper.selectedIndex).toBe(2);
  });

  it('blocks prev navigation and disables the button when allowRevisit=false', () => {
    host.stepper.next();
    fixture.detectChanges();

    host.allowRevisit = false;
    fixture.detectChanges();

    const prevButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('.ngb-stepper-buttons button:nth-of-type(3)');
    expect(prevButton.disabled).toBe(true);

    host.stepper.prev();
    fixture.detectChanges();

    expect(host.stepper.selectedIndex).toBe(1);
    expect(host.prevEvents.length).toBe(0);
  });

  it('allows clicking headers when allowRevisit=true', () => {
    host.stepper.next();
    host.stepper.next();
    fixture.detectChanges();

    host.stepper.allowRevisit = true;
    fixture.detectChanges();

    host.stepper.onHeaderClick(0);
    fixture.detectChanges();

    expect(host.stepper.selectedIndex).toBe(0);
  });

  it('computes step states and default icons', () => {
    expect(host.stepper.stepState(0)).toBe('active');
    expect(host.stepper.defaultIconForState('number', 0)).toBe('1');

    host.steps[0].errorMessage = 'Error';
    host.stepper.next();
    fixture.detectChanges();

    expect(host.stepper.isStepInError(0)).toBe(true);
    expect(host.stepper.stepState(0)).toBe('error');
  });

  it('applies orientation and label position classes', () => {
    host.orientation = 'vertical';
    host.labelPosition = 'left';
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('.ngb-stepper');
    expect(root.classList).toContain('vertical');

    const labelContainer = fixture.nativeElement.querySelector('.ngb-stepper-label-container');
    expect(labelContainer.className).toContain('ngb-stepper-label-left');
  });

  it('supports theme switching via CSS classes', () => {
    const root: HTMLElement = fixture.nativeElement.querySelector('.ngb-stepper');
    expect(root.classList).toContain('bootstrap');

    host.theme = 'material';
    fixture.detectChanges();
    expect(root.classList).toContain('material');

    host.theme = 'tailwind';
    fixture.detectChanges();
    expect(root.classList).toContain('tailwind');
  });

  it('exposes animation duration via CSS variable and can be disabled', () => {
    const panel: HTMLElement = fixture.nativeElement.querySelector('.fade-step');

    host.animationDuration = 300;
    host.disableAnimation = false;
    fixture.detectChanges();
    expect(panel.style.getPropertyValue('--ngb-stepper-animation-duration')).toBe('300ms');

    host.disableAnimation = true;
    fixture.detectChanges();
    expect(panel.style.getPropertyValue('--ngb-stepper-animation-duration')).toBe('0ms');
  });

  it('toggles responsive helper class', () => {
    const root: HTMLElement = fixture.nativeElement.querySelector('.ngb-stepper');
    expect(root.classList).toContain('ngb-responsive');

    host.responsive = false;
    fixture.detectChanges();
    expect(root.classList).not.toContain('ngb-responsive');
  });

  it('applies basic accessibility attributes for tabs and panels', () => {
    const root: HTMLElement = fixture.nativeElement.querySelector('.ngb-stepper');
    expect(root.getAttribute('role')).toBe('tablist');
    expect(root.getAttribute('aria-orientation')).toBe(host.orientation);

    const tabs: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.ngb-stepper-step');
    const firstTab = tabs[0];
    const panel: HTMLElement = fixture.nativeElement.querySelector('.ngb-stepper-content [role="tabpanel"]');

    expect(firstTab.getAttribute('role')).toBe('tab');
    expect(firstTab.getAttribute('aria-selected')).toBe('true');
    expect(firstTab.getAttribute('tabindex')).toBe('0');

    const tabId = firstTab.getAttribute('id');
    expect(panel.getAttribute('aria-labelledby')).toBe(tabId);
  });

  it('supports basic i18n by customizing button labels', () => {
    host.nextLabel = 'Weiter';
    host.previousLabel = 'Zurück';
    host.resetLabel = 'Zurücksetzen';
    host.cancelLabel = 'Abbrechen';
    fixture.detectChanges();

    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('.ngb-stepper-buttons button');
    const [cancelBtn, resetBtn, prevBtn, nextBtn] = Array.from(buttons);

    expect(cancelBtn.textContent?.trim()).toBe('Abbrechen');
    expect(resetBtn.textContent?.trim()).toBe('Zurücksetzen');
    expect(prevBtn.textContent?.trim()).toBe('Zurück');
    expect(nextBtn.textContent?.trim()).toBe('Weiter');
  });

  it('renders custom icon template instead of default icon text', () => {
    const firstIcon: HTMLElement = fixture.nativeElement.querySelector(
      '.ngb-stepper-step:first-child .ngb-stepper-indicator .custom-icon',
    );
    expect(firstIcon).toBeTruthy();
    expect(firstIcon.textContent?.trim()).toBe('C0-active');
  });

  it('shows error message for current step when errorMessage is set', () => {
    host.steps[1].errorMessage = 'Step 2 invalid';
    host.stepper.next();
    fixture.detectChanges();

    const errorEl: HTMLElement | null = fixture.nativeElement.querySelector('.ngb-stepper-error');
    expect(errorEl).toBeTruthy();
    expect(errorEl?.textContent?.trim()).toBe('Step 2 invalid');

    const secondHeader: HTMLElement = fixture.nativeElement.querySelectorAll('.ngb-stepper-step')[1];
    expect(secondHeader.classList).toContain('error');
  });
});
