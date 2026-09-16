# 2.2.0 release checklist

Status: versioned for 2.2.0; authorized for publication through the existing
GitHub tag workflow. npm availability was checked before versioning.

## Library changes to include

- Five standalone AI controls exported from `@angular-bootstrap/ngbootstrap`:
  Prompt Box, AI Chat, Inline AI Prompt, AI Prompt workspace, and Smart Paste.
- Typed request, message, response, feedback, and field-mapping contracts.
  Loading, errors, cancellation, streaming updates, and explicit review/apply
  remain application-controlled. No AI transport, provider SDK, or credentials.
- Distinct composer, conversation, inline editing, split draft-review, and
  field-review layouts using the shared theme layer.
- Keyboard and accessibility improvements: associated labels and instructions,
  stable Send/Stop button focus, read-only busy inputs, IME-safe Enter handling,
  Escape and focus restoration, expanded-panel relationships, named scroll
  regions, live logs/status, feedback pressed state, and native field controls.
- Shared CSS tokens with Bootstrap defaults, Material and Tailwind variable
  bridges, named palette presets, and safe framework-free fallbacks.
- DataGrid shared-token mappings, theme-picker synchronization, and inherited
  theme values for filter menus rendered outside the grid.
- Theme consumption by stepper, splitter, tree, typeahead, chips, pager,
  pagination, drag/drop styling, and JSON preview.
- Optional Tailwind v4 utility preset, optional peer metadata, stylesheet exports,
  published theme/AI guidance, and stronger package verification.

The docs workspace is a separate repository. Its examples, design kit, theme
reference, Angular resolution changes, and demo routes are not npm library code.

## Verified locally on Angular 22

- Full Jest suite: 29 suites / 414 tests pass, including 42 AI tests.
- Library lint and ng-packagr build pass.
- Package validator loads the built bundle, checks all five AI exports, theme
  assets, stylesheet export, optional peers, and existing DataGrid exports.
- npm pack dry run passes (temporary npm cache used; no upload).
- Docs production build passes.
- Chrome: Tab navigation, Shift+Enter newline, Enter activation, Space activation
  of the inline trigger, Escape closure and focus restoration; no console errors.
- Previous visual checks covered desktop, 390px mobile, and theme switching.

## Release execution

- Version availability: verified; package and release notes set to 2.2.0.
- Clean frozen-lockfile installation: passed after synchronizing the optional
  Tailwind peer and patching vulnerable transitive tooling dependencies.
- Security audit: high-severity threshold passed; three moderate Angular 22.0.8
  development-dependency advisories remain and are disclosed in release notes.
- Angular 21 and 22: isolated tarball consumer strict-template compilation passed.
- Manual VoiceOver/NVDA testing: not available in this execution environment;
  remains a follow-up. Do not claim WCAG certification.
- Publishing follows a successful main-branch CI run, then the version tag.
- Verify registry metadata and install the published package after workflow success.

## Existing publishing workflow

`.github/workflows/release.yml` triggers on `v*.*.*` tags and uses the
`npm-production` environment with npm trusted publishing and provenance. It
checks tag/version agreement and that the version is unpublished, then runs:

```sh
npm publish ./dist/ngbootstrap --access public --provenance
```

Use that workflow after the gates above. Confirm its npm trusted-publisher
configuration and environment approvals are in place. Do not publish the private
docs workspace or run a second manual publish in parallel.

After publication, verify npm metadata, install the published version in a clean
consumer, then update docs dependency/version references and remove preview labels
only for features actually included in the published package.
