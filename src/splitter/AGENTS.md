# Splitter contributor guidance

Applies alongside the [library rules](../../AGENTS.md). Inspect both pane and splitter components before changing layout or resizing.

- Preserve horizontal/vertical pointer and keyboard resizing, pane min/max constraints, collapsibility and resize/collapse event contracts. Test both neighboring panes and constrained container sizes; do not allow invalid or negative geometry.
- Keep separator orientation consistent with the physical divider, not simply the container orientation. Names, value ranges and `aria-controls` must describe the pane actually resized.
- Preserve `paneId` and `ariaLabel` behavior. Generated relationships must resolve to unique rendered panes; only named panes receive the current region semantics. Check multiple splitters and dynamic panes.
- Defer browser measurements until after rendering. Preserve deterministic initial server/client markup and clean up resize listeners and drag state on destruction.
- Retain focus on the resize control through keyboard resizing/collapse. Preserve theme tokens and visible focus; do not make decorative collapse indicators additional unnamed controls.

From the library root run `corepack pnpm test:ci --testPathPatterns=src/splitter` and `corepack pnpm test:ci --runTestsByPath src/inputs/src/accessible-controls.spec.ts`. For geometry or ID changes, verify browser resizing and production SSR/hydration in the docs workspace; mocked dimensions alone are insufficient.
