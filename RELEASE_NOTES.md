# @angular-bootstrap/ngbootstrap 2.1.2

This patch release fixes a circular DataGrid bundle dependency without changing the public component API.

## Fixed

- Removed an unused `NgbGridHighlightDirective` entry from the `Datagrid` component's internal standalone imports.
- Fixed `Cannot access 'Datagrid' before initialization` when Jest, Node, or another direct bundle-loading environment evaluates the published FESM package.

## Changed

- Release validation now imports the built FESM bundle and verifies that `Datagrid` and `NgbGridHighlightDirective` initialize and remain publicly exported.

## Verification

- Security audit: no known vulnerabilities.
- Lint: passed.
- Jest: 27 suites and 319 tests passed.
- Angular package build, direct FESM import, and release package validation: passed.

## Compatibility

- Angular peer support remains `>=21.0.0 <23.0.0`.
- No public DataGrid, drag-and-drop, Form Builder, or component APIs changed in this release.
