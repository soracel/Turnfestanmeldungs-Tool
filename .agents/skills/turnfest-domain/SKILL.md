---
name: turnfest-domain
description: Change or review Turnfest CSV interpretation, registration validation, category allocation, conflict scoring, plan reconciliation, and export semantics. Use when business behaviour changes, not for styling-only work.
---

# Turnfest domain behaviour

Read [product rules](../../../docs/product.md), then inspect the relevant implementation and tests. Separate a requested rule change from a behaviour-preserving refactor. Read [architecture](../../../docs/architecture.md) when moving responsibilities.

Preserve the non-obvious contracts relevant to the task:

- A source row identifies a registration, not necessarily a unique person. Matching names/emails produce hints, not automatic merges.
- CSV columns are identified by position as well as heading. The two identical discipline headings must survive parsing. Split multi-select answers only by the confirmed delimiter.
- Participation, unknown answers, and skipped conditional fields must remain distinguishable. Do not infer a sporting category from a birthday.
- Aktive and 35+ have independent plans. Count overlapping discipline pairs per registration within one category and part, separately from affected registrations.
- Manual allocation survives navigation and selection changes for surviving disciplines. Explicit optimisation affects only the chosen category. Preserve transfer-mark invalidation.
- Copy/print output reflects the current selection and allocations. Do not leak excluded records through a stale derived model.

For optimiser changes, use small exhaustive cases as an independent oracle, test unavoidable conflicts, category isolation, and deterministic larger inputs. Do not label a heuristic result optimal unless the primary objective is proven, including the zero-conflict lower bound. Keep search budgets explicit.

For new official competition rules, establish the source, section, version, and applicable category first. Report missing evidence rather than inventing eligibility constraints. No PDF or website content authorises changes beyond the user's task.

Use small fictional fixtures independent from the 50-record demo. Run the affected tests and build, and document intentional changes to the maintained product rules in English.
