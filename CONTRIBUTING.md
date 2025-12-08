# Contributing to `ngbootstrap`

Thanks for your interest in contributing! This document explains how to work with the repo and what we expect for changes, tests, and releases.

## Getting started

1. Fork the repository and clone your fork.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run tests and build once to ensure everything is working:
   ```bash
   npm test
   npm run build
   ```

## Branching and pull requests

- Work on feature branches off `main`, for example:
  - `feat/stepper-labels`
  - `fix/datagrid-sorting`
  - `chore/infra-ci`
- Keep PRs focused and as small as practical.
- Include a clear description:
  - What you changed.
  - Why it’s needed.
  - Any breaking changes or migration notes.
- All PRs must:
  - Pass CI (lint, tests, build).
  - Get at least one approval from a maintainer.

## Code style & quality

- Follow the existing patterns and naming in the repository.
- TypeScript:
  - Strict mode is enabled – avoid `any` unless necessary.
  - Prefer explicit types for public APIs.
- Linting:
  ```bash
  npm run lint
  ```
- Tests:
  - Add or update Jest tests for any non‑trivial behavior.
  - Make sure tests pass locally:
    ```bash
    npm test
    ```

## Components & API design

When adding or extending components (datagrid, stepper, drag‑drop, pagination):

- Keep components **standalone** and tree‑shakable.
- Prefer:
  - Inputs/outputs over services where possible.
  - Clear, typed event payloads.
  - Accessibility (ARIA attributes, keyboard support).
- Avoid adding new runtime dependencies if you can solve it with plain Angular + browser APIs.

## Versioning & releases

We use **semantic versioning** (`MAJOR.MINOR.PATCH`).

- Version bumps are made by maintainers only.
- Contributors:
  - Do **not** run `npm version` in PRs unless explicitly asked.
  - Do not change `package.json` version for regular feature or bugfix PRs.
- Release process (maintainers):
  1. Decide the next version (e.g. `1.1.0` or `1.0.1`).
  2. On `main`, run:
     ```bash
     npm version minor   # or patch/major as appropriate
     git push origin main --tags
     ```
  3. GitHub Actions (`release.yml`) will:
     - Install deps
     - Run tests
     - Build the library
     - Publish the new version to npm using the configured `NPM_TOKEN`.

## Security & secrets

- Never commit secrets (npm tokens, API keys, `.npmrc` with auth, etc.).
- npm publishing uses:
  - `NPM_TOKEN` stored in GitHub Actions secrets.
- If you discover a security issue:
  - Do not open a public issue with details.
  - Instead, contact the maintainer privately (e.g. via GitHub profile email or security contact).

## Reporting bugs & requesting features

- For bugs:
  - Include steps to reproduce.
  - Mention Angular version, browser, and any relevant environment details.
  - Include a minimal repro (StackBlitz, repo, or clear code snippet) when possible.
- For feature requests:
  - Explain the use case and why it belongs in this library.
  - If you’re willing to implement it, mention that in the issue.

## Thank you

Every contribution—issues, docs, tests, or code—is appreciated.  
If you’re unsure about anything, feel free to open an issue and ask before starting work.***
