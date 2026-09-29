# Project instructions

## Language and scope

Write repository documentation, code comments, identifiers, and test descriptions in English. Keep application copy in Swiss Standard German (de-CH), including familiar labels such as Aktive and 35+. Preserve external CSV headings as source data.

The application is a browser-only registration and planning tool. Keep member data local and use fictional fixtures. Do not introduce a backend, persistence, analytics, or automatic Contest submission as a side effect of a refactoring.

## Architecture

Read [architecture](docs/architecture.md) for structural changes and [migration](docs/migration.md) for refactoring. The layered React implementation is in place. Verify actual source and scripts before changing a boundary. Follow [code standards](docs/code-standards.md).

Domain and application code must not depend on presentation, concrete adapters, parser libraries, or browser APIs. Inject external effects at the composition root. Keep business policies out of UI handlers and hooks. Prefer cohesive pure functions to generic abstraction frameworks.

## Domain invariants

Use [product rules](docs/product.md) as the maintained source of truth. Keep Aktive and 35+ allocations independent, preserve manual assignments for surviving disciplines, and invalidate transfer marks after relevant changes. Do not merge possible duplicates automatically or infer missing official competition rules.

## Project skills

Load only a skill relevant to the task:

- [turnfest-architecture](.agents/skills/turnfest-architecture/SKILL.md): architectural extraction, dependency boundaries, or structural review.
- [turnfest-domain](.agents/skills/turnfest-domain/SKILL.md): registration/import rules, planner scoring, category reconciliation, or export semantics.
- [turnfest-ui](.agents/skills/turnfest-ui/SKILL.md): presentation changes, React migration, or interaction validation.

These skills guide implementation; they do not authorise publishing, external account changes, or scope expansion.

## Verification

Current checks are `pnpm check` and `pnpm test:e2e`; use Node.js 24 and pnpm 11.19.0. Run relevant checks for code changes, and exercise changed interactions using fictional data. For documentation-only work, validate links, status claims, and skill metadata. Do not claim planned tooling is enforced before scripts and CI exist.

Keep real exports in `private-data/` and out of generated assets. Preserve user changes and existing source inputs. Update migration status only when the corresponding work has actually landed.
