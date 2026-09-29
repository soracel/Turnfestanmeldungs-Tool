---
name: turnfest-ui
description: Implement or review Turnfest UI components, migrate legacy HTML rendering to React, and validate planning/import interactions. Use for presentation work while preserving the de-CH interface and browser-only data handling.
---

# Turnfest presentation

Read [code standards](../../../docs/code-standards.md). For React migration, read [the stack decision](../../../docs/decisions/0001-browser-architecture.md) and [migration plan](../../../docs/migration.md), then verify installed dependencies. A planned library is not an available dependency.

Keep components focused on rendering typed data and emitting user intent. Put validation, scoring, reconciliation, and transfer invalidation in their domain/application owners. Use the existing controller where available; do not hide the old global application inside one React component or hook.

When replacing legacy UI, keep React and imperative DOM code in disjoint roots. Preserve the visual language, de-CH labels, category separation, and session-only behaviour unless the request changes them. Render imported values as text, with stable IDs for keys; avoid raw HTML injection.

Validate the changed interaction, not only the initial screenshot. Depending on the feature, exercise import errors, search focus, switching categories, moving a discipline, seeing the affected names, excluding a record, or copying/printing the current plan. Ensure keyboard operation, visible focus, labelled controls, and usable narrow layouts. Manual move controls must remain accessible even if drag-and-drop is added.

Use fictional demo data for browser checks. Do not add remote fonts, analytics, persistent storage, or automatic exports. Keep output and clipboard effects behind browser adapters and triggered by explicit user actions.

Run available tests/build and applicable component or browser checks. State which checks were performed and which could not be run. Keep repository explanations in English; do not translate application copy as a side effect of code cleanup.
