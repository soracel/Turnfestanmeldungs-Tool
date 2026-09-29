---
name: turnfest-architecture
description: Refactor or review architectural boundaries in the Turnfest Registration Planner. Use for layer extraction, session orchestration, dependency direction, and migration planning, not routine content edits.
---

# Turnfest architecture

Read the repository's [architecture](../../../docs/architecture.md), [migration status](../../../docs/migration.md), and [code standards](../../../docs/code-standards.md). Check the actual source and package scripts before choosing a migration slice; the target React stack may not exist yet.

For the requested change:

1. Identify the current responsibility and its target owner. Name the dependency being removed and the observable behaviour to preserve.
2. Extract the smallest useful slice. Inner modules must not import legacy facades that transitively depend on Papa Parse, HTML rendering, or browser APIs. Introduce an application-owned port only for a real effect or replaceable implementation.
3. Move state transitions out of DOM handlers without changing their policy. Preserve manual allocations, separate categories, invalidate transfer marks, and reject stale import results. Consult [product rules](../../../docs/product.md) when these paths are involved.
4. Use temporary facades only at the outside boundary; identify their callers and removal condition. Do not create empty target folders or convert functions into classes merely to resemble an architecture diagram.
5. Run the relevant existing tests and build. Add transition or boundary tests where extraction changes the risk. If adding a boundary lint rule, demonstrate that a forbidden import fails.

Report the migrated boundary, behaviour preserved, checks performed, and remaining legacy dependencies. Update migration status accurately. For review-only tasks, report actionable findings with file locations and effects; do not implement an unsolicited rewrite.
