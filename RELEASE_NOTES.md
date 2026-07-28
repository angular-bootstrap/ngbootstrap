# @angular-bootstrap/ngbootstrap 2.1.1

This patch release updates the library development and release dependency graph to patched compatible versions. It does not change the public component API or introduce breaking behavior.

## Security

- Updated Angular 22, ng-packagr, Jest, ESLint, TypeScript tooling, and affected transitive dependencies.
- Added narrowly scoped Jest dependency overrides for patched glob and brace-expansion paths.
- Refreshed the pnpm lockfile so the complete library dependency graph reports no known vulnerabilities.

## Changed

- The security audit now includes build and test tooling in addition to published runtime dependencies.
- The audit command explicitly isolates this public library from a parent pnpm workspace when the repository is developed inside the private docs workspace.

## Verification

- Security audit: no known vulnerabilities.
- Lint: passed.
- Jest: 27 suites and 319 tests passed.
- Angular package build and release package validation: passed.

## Compatibility

- Angular peer support remains `>=21.0.0 <23.0.0`.
- No public DataGrid, drag-and-drop, Form Builder, or component APIs changed in this release.
