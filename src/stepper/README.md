# @angular-bootstrap/ngbootstrap/stepper

Import from `@angular-bootstrap/ngbootstrap/stepper` or the root `@angular-bootstrap/ngbootstrap` package.

## Connect steps

Add `NgbStepperComponent` to your standalone component imports. Define `steps: NgbStepperStep[]` and a numeric `selectedIndex` in the parent:

```html
<ngb-stepper [steps]="steps" [(selectedIndex)]="selectedIndex"
  (selectionChange)="onSelectionChange($event)" />
```

Each step may provide an ID, label, description, state, error message and disabled/optional flags. Use stable IDs. Configure `orientation`, `labelPosition`, `contentPosition`, `allowRevisit` and `lazy` for the workflow. Applications own form validation, persistence and completion rules; a visual error state does not validate a form.

## Keyboard and semantics

The component exposes tablist/tab/tabpanel relationships and selected/disabled states. Enter/Space activate a focused step; native Previous/Next controls provide sequential navigation. The selected header is the tab stop. Arrow/Home/End tab navigation is not implemented, so this is not a complete APG tabs keyboard model. Verify custom labels, focus after step changes and validation announcements in the consuming application.

Use the action label inputs for localized copy and `disableAnimation` when appropriate. Shared [theme tokens](../../docs/guides/theming.md) style the controls; Bootstrap remains the default. See [contributor checks](../../CONTRIBUTING.md) for changes to behavior.
