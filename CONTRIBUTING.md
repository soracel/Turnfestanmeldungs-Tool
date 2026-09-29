# Contributing

Read the [product rules](docs/product.md), [architecture](docs/architecture.md), and [code standards](docs/code-standards.md) before changing application behaviour. The layered architecture is implemented; see the [migration record](docs/migration.md) for its scope.

## Working on a change

1. Identify the user-visible behaviour or architectural boundary being changed.
2. Keep refactoring, formatting, and new product rules distinguishable in the diff.
3. Use fictional fixtures. Never attach real registration exports to public issues, pull requests, logs, or screenshots.
4. Run `pnpm check` and `pnpm test:e2e` for code changes, plus focused UI verification when interactions change.
5. Update English documentation when behaviour, setup, or the migration status changes. Keep the interface in de-CH unless a task explicitly changes it.

A pull request should explain the concrete problem, resulting behaviour, validation performed, and remaining limitations. Architecture exceptions should explain the reason and migration path rather than silently weakening layer boundaries.

## AI-assisted work

[AGENTS.md](AGENTS.md) contains shared project instructions. Focused skills live under `.agents/skills/` and can be invoked by name:

- `$turnfest-architecture` for a scoped architecture extraction or review.
- `$turnfest-domain` for import, category, scoring, reconciliation, or export behaviour.
- `$turnfest-ui` for component migration and browser interaction work.

Example: “Use $turnfest-architecture to review the session boundary while preserving existing behaviour.”

These are repository-local instruction files, not runtime AI dependencies or externally installed plugins. Codex discovers repository skills under `.agents/skills`; see the [official skills documentation](https://developers.openai.com/codex/skills/). If a new skill is not listed, restart the Codex session. Agents without skill discovery can read the linked files directly.

## Release status

The code is hosted at [soracel/Turnfestanmeldungs-Tool](https://github.com/soracel/Turnfestanmeldungs-Tool). The project uses the [MIT License](LICENSE). Pages publication is still pending. The existing Pages workflow publishes only `dist/` when started manually. Confirm that private input files and local development artifacts are absent from the public source and build before release.
