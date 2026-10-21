# Contributing

Help build MIT-licensed Angular UI for data-heavy apps. Read [AGENTS.md](AGENTS.md) for the repository's coding, testing, accessibility and pre-push checklist.

## Set up

Fork/clone the repository, use Node 22 and the pnpm version pinned in `package.json` through Corepack:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm test:ci
corepack pnpm build
```

Build output is `dist/ngbootstrap`. Keep the existing pnpm lockfile; do not install with npm or regenerate it with a different pnpm major version.

## Make a focused change

1. Check the working tree and read the affected component and feature guides.
2. Reproduce the issue or describe the intended behavior and supported combinations.
3. Implement against real public exports, preserving Angular 21/22 and existing event contracts.
4. Add focused regression coverage, including relevant keyboard, error and async paths. For example: `corepack pnpm test -- src/ai --runInBand`.
5. Update examples, limitations and API guidance. Library functionality comes before updates to the separate docs app.
6. Run the applicable pre-push checks in [AGENTS.md](AGENTS.md), inspect the diff and submit a focused contribution using the repository's review process.

Describe the problem, resulting behavior, tests run, compatibility impact and remaining limitations. Avoid unrelated formatting changes. Do not change package versions for ordinary contributions unless the maintainer requests a release.

## Documentation and accessibility

Use original, copy-paste-friendly examples with scoped imports. Explain application-owned persistence, validation and provider calls. Test documented keys and focus transitions; distinguish automated semantics checks from optional manual screen-reader testing. Do not claim full WCAG/APG compliance without evidence.

SEO belongs to the separate ngbootstrap.com workspace. Coordinate relevant navigation, API links, metadata and sitemap updates there; no SEO command runs in this package. See [RELEASE_PLAN.md](RELEASE_PLAN.md) for release coordination.

## Security and dependencies

Do not commit secrets, authentication configuration or real customer data. Avoid new runtime dependencies without a demonstrated need. Review moderate and high advisories, apply compatible patches and rerun affected checks. Report exploitable security issues privately to the maintainer using an available verified contact rather than posting exploit details in a public issue.

Publishing uses GitHub's existing `npm-production` environment and npm trusted publishing with provenance. It does not require a contributor npm token. Maintainers follow [RELEASE_PLAN.md](RELEASE_PLAN.md).

## Issues

For bugs, include the package/Angular versions, browser, minimal reproduction, expected behavior and actual behavior. For features, describe the developer workflow and constraints. Keep feature requests distinct from promises of delivery.
