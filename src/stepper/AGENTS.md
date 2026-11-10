# Stepper contributor guidance

Applies alongside the [library rules](../../AGENTS.md). Inspect the component, templates and `src/stepper/stepper.component.spec.ts` before changing navigation.

- Preserve active-index ownership, next/previous/reset/cancel events, linear navigation and `allowRevisit` restrictions. Cancel must not silently change the active step; disabled or blocked steps must not become active through another navigation path.
- Keep orientation-aware arrows and Home/End focus movement separate from activation rules. Skip ineligible tabs and preserve a predictable Tab entry point; test Enter/Space activation and disabled boundaries.
- Maintain tablist/tab/tabpanel ownership, orientation, selected state and matching unique IDs/relationships. Verify multiple instances and dynamic steps when changing identity or rendering.
- Preserve visited/error state, custom icon/content templates and configurable labels. Navigation must not accidentally discard application-owned form state.
- Keep focus visible across themes and responsive orientation changes. SSR-sensitive IDs or DOM changes require deterministic initial markup and browser hydration verification.

Run `corepack pnpm test:ci --testPathPatterns=src/stepper` from the library root. Cover pointer and keyboard paths, restrictions, event counts and reset/cancel behavior. Verify changed focus interactions in a browser and keep docs API/accessibility descriptions aligned with actual behavior.
