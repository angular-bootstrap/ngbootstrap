export type NgbStepperOrientation = 'horizontal' | 'vertical';

export type NgbStepperLabelPosition = 'top' | 'bottom' | 'left' | 'right';

export type NgbStepperContentPosition = 'top' | 'bottom';

export type NgbStepperTheme = 'bootstrap' | 'material' | 'tailwind';

export type NgbStepperState =
  | 'number'
  | 'done'
  | 'active'
  | 'error'
  | 'disabled'
  | string;

export interface NgbStepperStep {
  /** Unique id for the step, otherwise index is used */
  id?: string;
  /** Simple text label (used when no custom label template is provided) */
  label?: string;
  /** Optional description / helper text */
  description?: string;
  /** Current state of the step (maps to icon + CSS classes) */
  state?: NgbStepperState;
  /** Error message to display when step is invalid and visited */
  errorMessage?: string | null;
  /** Whether this step is optional (used only for styling / a11y text) */
  optional?: boolean;
  /** Whether this step is disabled */
  disabled?: boolean;
}

