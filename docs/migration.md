# Architecture migration record

Status: implemented on 2026-09-29. The former imperative renderers and mixed `data.ts`/`planner.ts` modules have been retired. The application remains browser-only and preserves the existing import, planning, and Contest preparation workflows.

## Completed slices

| Slice                        | Result                                                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Baseline and quality tooling | Preserved the 18 existing behavioural cases and the deterministic 50-record demo. Added formatting, lint, strict core compilation, and CI scripts.                 |
| Independent domain           | Registration validation, structured issues, category policies, conflict scoring, and bounded optimisation use ordinary TypeScript without DOM/parser dependencies. |
| Application session          | Typed lifecycle, commands, injected effects, stable import/row identities, derived models, reconciliation, and stale import protection replace module globals.     |
| React presentation           | Import, mapping, overview, review, registrations, planning, and Contest views render declaratively. Search and move controls preserve focus.                       |
| Delivery boundaries          | Tested ESLint import constraints, production browser workflows at `/turnfest/`, and retained the manual Pages workflow. No deployment was performed.               |

## Verification

- `pnpm check` (28 tests passing): strict TypeScript for the application, separate DOM-free core compilation, ESLint, Prettier, unit/component tests, and production build.
- `pnpm test:e2e` (2 tests passing): Chromium production tests covering demo import, explicit CSV mapping, category switching, manual allocation, copied current plans, print invocation/content, narrow layout, and reset.
- The Check workflow runs both commands. The manual Pages workflow runs quality checks before publishing only `dist/`.
- Boundary tests deliberately import presentation/adapters into domain code (including type-only and alias forms) and assert rejection.
- Planner tests retain an independent exhaustive oracle and deterministic large-graph checks. Session tests cover failed/stale imports, reset, invalid commands, immutable updates, exclusions, remapping, and clipboard failure.

The browser tests fake clipboard writes and the print-dialog invocation so they can inspect output without operating system dialogs. Print media rendering is exercised separately. Native clipboard permissions and printer dialogs still depend on the user's browser and operating system.

## Implementation decisions

The composition root is `src/bootstrap/main.tsx`. The application controller owns all session state; React subscribes through `useSyncExternalStore`. Raw CSV records stay in the application source table while planning receives a limited participant projection. Export and Contest views share the same derived model.

The optimiser's scoring and deterministic limits are unchanged: at most 12 disciplines for bounded exact search, 100,000 search nodes, up to six greedy starts, and eight local improvement passes. Search metadata distinguishes proven primary optimality from heuristic, exhausted, or manually edited results.

Global design tokens and foundation/print styles live in `presentation/styles/base.css`; planning-specific styles use a CSS module. No backend, storage layer, routing framework, dependency-injection container, or automatic Contest submission was introduced.

## Remaining product work

Choosing a license, official Contest field verification, and event-rule validation remain separate product decisions. They are not architecture migration blockers. See [product rules](product.md) for unresolved requirements and [architecture](architecture.md) for the maintained module boundaries.

The verified default production build contains only `index.html`, a JavaScript bundle (about 291 kB, 92 kB gzip), and a stylesheet (about 17 kB, 4 kB gzip). No CSV/PDF or private-data files are copied to `dist/`.
