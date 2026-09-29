# ADR 0001: A browser-only application with a framework-independent core

- Date: 2026-09-29
- Status: implemented

## Context

The prototype works, but its imperative root rendering and shared mutable globals make changes difficult to read and test. CSV processing and competition planning are local computations. GitHub Pages hosting and keeping member data on the device remain product requirements.

## Decision

Retain TypeScript, Vite, Papa Parse, Vitest, pnpm, and static GitHub Pages deployment. Introduce React and React DOM for the presentation layer during migration. Keep domain rules and application transitions as ordinary TypeScript functions and data, independent of React and browser APIs.

Use component-scoped CSS with a small shared token stylesheet. Use application-owned session state with a thin React provider/hook integration; local UI state stays in components. Start without Redux, a dependency-injection container, a routing library, or a backend. Add such tools only when a concrete requirement outweighs their cost.

React supports component decomposition and explicit state ownership, which fits the import forms, registration table, and editable planning board. This is a project choice based on the current code, not a claim that Clean Architecture requires React. See [Thinking in React](https://react.dev/learn/thinking-in-react) and [Managing State](https://react.dev/learn/managing-state).

## Alternatives

| Option                                  | Assessment                                                                                                                                           |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modular vanilla TypeScript              | Small runtime and no framework migration; viable, but still requires maintained DOM lifecycle, focus, escaping, and component conventions            |
| React with Vite                         | Adds dependencies and migration work; provides declarative components and an established component-testing approach                                  |
| Vue or Svelte                           | Viable component alternatives; no existing project requirement establishes an advantage worth a different migration direction                        |
| Next.js or another full-stack framework | Server rendering, server routes, and authentication do not solve the current local analysis problem; unnecessary operational concepts for this scope |

## Consequences

React does not repair a mixed architecture by itself. A large component containing all current globals and policies would reproduce the problem. The dependency rule and session contracts must be extracted before or alongside the UI migration.

The browser bundle will grow. Measure the production build after migration and keep dependencies justified. No personal data is sent to a server, and no server framework or cloud account is introduced. Existing functional behaviour and de-CH UI copy remain the baseline.

Dependencies are resolved in `pnpm-lock.yaml`. Install with `pnpm install --frozen-lockfile`; quality and browser checks run in CI.
