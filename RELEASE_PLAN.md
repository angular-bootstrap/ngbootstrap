# Release checklist

This is the reusable maintainer checklist, not an authorization to publish. Current release notes are in [RELEASE_NOTES.md](RELEASE_NOTES.md); historical changes are in [CHANGELOG.md](CHANGELOG.md).

## Prepare

- Confirm release scope and authorization, target branch and semantic version. Do not merge unrelated branches or release unfinished APIs to meet a calendar date.
- Read [AGENTS.md](AGENTS.md), inspect the diff and verify all documented capabilities against source and tests.
- Align `package.json`, changelog and release notes. Keep historical entries intact. Confirm the proposed version is not already on npm; an existing npm version cannot be overwritten.
- Use Node 22 and pinned pnpm with a clean frozen-lockfile installation. Check Angular peers, optional integrations and absence of unnecessary runtime dependencies.

## Validate before pushing a release

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm lint
corepack pnpm test:ci
corepack pnpm build
corepack pnpm release:verify
corepack pnpm pack:dry-run
corepack pnpm security:audit
corepack pnpm --ignore-workspace audit --audit-level=moderate
git diff --check
```

- Inspect tarball contents and install the candidate tarball in an isolated consumer; verify standalone imports and strict templates across supported Angular majors when compatibility is affected. Never publish the private docs workspace.
- Verify changed Grid/AI workflows, all affected theme mappings, keyboard/focus, SSR and hydration. Record the actual browser and commands used. Manual screen-reader checks are optional and must not be reported as completed unless performed.
- Review moderate/high dependency findings, apply compatible fixes and rerun affected checks. The existing CI audit has a high threshold; its success alone does not mean zero advisories. Report unresolved release risks.
- Coordinate the separate docs app: installation/API/examples, accessibility limits, navigation, package version, production build, route tests and SEO audit. Keep future functionality marked planned.
- For Ask ngbootstrap, align the dependency, docs version and source index with the released library. When advancing beyond the 2.5.2 source snapshot, migrate the Ask allowlist, Markdown selectors and retrieval tests from root guide paths to `docs/guides/` paths. Keep older immutable citations intact. Use committed public sources and immutable citations; run `ask:version:check` and the repository's retrieval tests there. Preserve existing secrets, budget and persistence configuration.

## Publish through the existing workflow

1. Review and commit only intended changes. Push the authorized branch and verify CI before creating the matching `vMAJOR.MINOR.PATCH` release tag.
2. `.github/workflows/release.yml` handles tag/version checks, unpublished-version checks, validation and npm publication through the `npm-production` environment using OIDC trusted publishing and provenance.
3. Respect existing environment approvals. Do not create credentials, bypass protection rules or run a competing manual `npm publish`.
4. Inspect the workflow result and npm registry metadata. Registry availability can lag workflow completion; verify installation from npm before declaring publication complete.
5. Create/update the GitHub release with a plain version title, such as `v2.5.2`, and accurate notes. Update the private docs dependency/version and deploy through its existing process.
6. Verify deployed HTTPS pages, navigation, examples, SEO and Ask version/grounding as applicable. Do not incur AI-provider charges without a defined authorized test budget.

## If verification fails

Stop the release/deployment step, preserve the failure evidence and fix the cause. Do not move an already published tag or pretend a failed check passed. A published package correction requires a new version. Report the published/deployed state, remaining risks and follow-up work clearly.
