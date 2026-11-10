# Tree contributor guidance

Applies alongside the [library rules](../../AGENTS.md). Inspect the component, public exports and `src/tree/tree.component.spec.ts` before changing node behavior.

- Keep keyboard traversal aligned with visible nodes, excluding descendants of collapsed nodes. Preserve one tree-item Tab stop, Up/Down and Home/End traversal, and Left/Right parent/child expansion behavior.
- Preserve stable node IDs, selection/expansion events and disabled-node rules. Test collapsed ancestors, leaves and replacement data; focus must not remain on a hidden or removed node.
- Keep tree/group/treeitem ownership, levels, accessible names and expanded/checked states consistent. Leaves must not advertise expansion. Preserve checkbox and disclosure behavior without adding duplicate keyboard stops.
- Keep custom templates and localized labels compatible. Do not introduce browser-only work during server rendering or claim complete APG support without verifying the corresponding interactions.

Run `corepack pnpm test:ci --testPathPatterns=src/tree` from the library root. Add focused regressions for changed traversal, selection and event counts. For DOM/focus changes, verify nested nodes in a browser; SSR-sensitive changes also require docs hydration checks. Update the separate docs API and accessibility guidance only for implemented behavior.
