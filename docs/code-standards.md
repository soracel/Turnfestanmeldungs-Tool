# Code standards

These conventions govern new and extracted code. Existing violations are migration work, not evidence that a tool already enforces the rules.

## Readability and responsibilities

- Write documentation, comments, identifiers, and test descriptions in English. Keep user-facing copy in de-CH. Preserve exact external CSV headings as data.
- Name functions after behaviour: `moveDiscipline`, `calculateConflicts`, `reconcileCategoryPlan`. Prefer `registration` over `m`, except for short mathematical indices inside an algorithm.
- Give each module one cohesive reason to change. Split policy from parsing, browser effects, formatting, and rendering.
- Keep one main action per statement. Use early returns and named intermediate values instead of nested ternaries and compressed event handlers.
- Keep public types explicit and inference local. Avoid `any`, unjustified casts, and non-null assertions at boundaries; validate external values before constructing a domain type.
- Extract a function when it names a meaningful operation. Do not extract every expression, add one-method classes everywhere, or invent a generic repository without storage.
- Prefer composition to inheritance. Apply dependency inversion at real effects and replaceable policies, not every function call.
- Explain the reason for search limits, category independence, and tie-breaking. Do not add comments that merely restate the code.

## State and errors

Keep state transitions in the application layer. Components emit intent and render results. Never mutate shared maps, sets, arrays, or props in place. Compute derived data through selectors and avoid effect-driven synchronisation between duplicated state values.

Use discriminated unions for lifecycle states and expected failure results. Return issue codes and source references rather than German sentences from inner layers. Catch errors at the boundary that can handle them. Do not silently recover malformed input into an empty successful import.

Business decisions belong in domain policies. Workflow decisions, including invalidating transfer marks, belong in application use cases. File reading, clipboard, and printing belong in adapters.

## Presentation

Use readable JSX and scoped CSS modules in the target UI, with shared CSS custom properties for colour, spacing, and typography. Do not put business conditions into style helpers. Minification belongs in the build output, never the authored stylesheet.

Keep semantic headings, labelled inputs, keyboard-operable moves, visible focus, and accessible conflict feedback. Test narrow layouts and print output after relevant changes. Preserve input focus and selections rather than rebuilding the entire root on each keystroke.

## Testing policy

Test observable behaviour and business invariants rather than private helper structure or generated wording. Preserve existing fixture-based tests during extraction; keep fixtures independent from the large demo.

| Change               | Relevant evidence                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| CSV adapter          | Duplicate headers, quoting, embedded newlines, BOM, malformed rows, empty cells                                  |
| Registration rules   | Date boundaries with injected date, answer normalisation, duplicate hints without merging                        |
| Planner              | Category isolation, manual conflicts, unavoidable conflicts, small exhaustive oracle, deterministic larger cases |
| Session transitions  | Import races, reset, exclusions, overrides, reconciliation, transfer invalidation                                |
| UI component         | User command, selected state, accessible feedback, focus after updates                                           |
| Export or deployment | Current selection/plan in output, static subpath build, no private fixture in assets                             |
| Documentation only   | Accurate status, valid links and examples, consistent terminology                                                |

Use minimal fakes for ports. Test real adapters where library behaviour matters. Avoid large snapshots as the sole proof of correctness. Do not introduce new tests just to mirror a reversible cosmetic edit.

## Tooling and review gates

Run `pnpm check` for strict TypeScript, DOM-free core compilation, ESLint (including inward dependencies and React hooks), Prettier, Vitest/component tests, and the Vite build. Run `pnpm test:e2e` for production workflows under a repository subpath; install Chromium once with `pnpm exec playwright install chromium`. CI installs the browser and runs both commands.

`tooling/boundaries.mjs` checks relative paths, the reserved `@/` alias, and type-only imports. Tests demonstrate forbidden dependencies fail. New aliases require corresponding resolver support before use. Application and domain modules cannot import external libraries or browser types.

Keep formatting-only changes separate from behavioural extraction. A refactoring review should establish unchanged user behaviour, correct dependency direction, state ownership, appropriate tests, and an updated migration status. Pin installed tool versions through the lockfile; do not use an undocumented global toolchain.
