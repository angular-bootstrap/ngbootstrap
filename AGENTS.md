# AGENTS.md

## Scope

This folder is the source for the `@angular-bootstrap/ngbootstrap` Angular library.

## Rules

- Treat `src/**` public exports, components, directives, services, inputs, outputs, and types as the source of truth.
- Keep code Angular 21/22 compatible and prefer built-in control flow (`@if`, `@for`, `@switch`) in templates.
- Keep Angular packages as peer dependencies. Mark optional integrations as optional peers.
- Add or update focused specs for behavior changes.
- Validate with the relevant Jest test and `pnpm build` before handing off.

## Commands

- `pnpm test -- <spec> --runInBand`
- `pnpm build`
