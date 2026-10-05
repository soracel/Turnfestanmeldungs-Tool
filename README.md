# Turnfest Registration Planner

A browser-based tool for analysing club members' Google Forms registrations and preparing manual entry into the Swiss Gymnastics Federation's STV Contest tool. The first event is Biel 2027.

**Status:** Working browser-only application with a layered TypeScript core and React UI. CSV import, registration review, category summaries, three-part club competition planning, and a printable/copyable Contest preparation list are implemented. Verified Contest field mappings and competition-rule validation are still pending.

Repository documentation is written in **English**. The application interface remains **Swiss Standard German (de-CH)**.

## Run locally

Use Node.js 24 (the CI baseline) and pnpm 11.19.0. The current package declares Node.js >=22.12.0; use Node.js 24 for the complete toolchain.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
pnpm preview
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173/`. Select **Demodaten ausprobieren** to load 50 fictional registrations, or select a local CSV file up to 10 MB. Confirm column mappings and the multi-select delimiter before analysis. Duplicate discipline headings remain separate columns.

## WebStorm

Shared configurations are available in `.run/`: select **Turnfest Dev** and press **Run**. Configure Node.js 24 and pnpm once in the project settings; see the [WebStorm setup guide](docs/webstorm.md).

## Features

- Search and filter registrations; inspect original values and validation hints.
- Exclude individual records from analysis without deleting the source data.
- Edit all registration fields and download the selected, corrected records as CSV for later reimport.
- Review categories, disciplines, overnight stays, and judge availability.
- Allocate club disciplines to three parts independently for **Aktive** and **35+**.
- Generate an allocation that minimises overlapping participants; move disciplines manually and see conflicts immediately.
- Copy or print the preparation list, including category allocations and outstanding issues.

The demo intentionally includes duplicate registrations, missing information, an invalid birthday, and an unavoidable scheduling conflict. Demo discipline names are examples, not a verified event programme.

## Data handling

Imported data stays in browser memory. Reloading, discarding data, or importing a new file clears the session. Changing column mappings also resets selections and plans. CSV downloads, clipboard, and print output contain member data only when explicitly requested through the UI. To retain corrections and exclusions across reloads, use **Bereinigte CSV exportieren** under **Anmeldungen** and import that file next time. Confirm column mappings again; CSV does not retain planning allocations or transfer marks.

Keep real exports in `private-data/`. The supplied original CSV and local competition PDF are excluded by `.gitignore`; neither is a public test fixture. No backend, analytics service, external fonts, or persistent member-data store is used. The Vite configuration disables automatic copying from `public/` and blocks direct development-server access to CSV/PDF files and `private-data/`.

## Documentation

| Document                                                      | Purpose                                                                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [Product and domain](docs/product.md)                         | Scope, terminology, verified behaviour, and unresolved event questions             |
| [Architecture](docs/architecture.md)                          | Current problems, target layers, dependency rules, state ownership, and boundaries |
| [Code standards](docs/code-standards.md)                      | Readability, TypeScript, UI, error handling, and testing conventions               |
| [Migration plan](docs/migration.md)                           | Incremental refactoring steps and acceptance gates                                 |
| [Stack decision](docs/decisions/0001-browser-architecture.md) | Rationale for React, alternatives, and trade-offs                                  |
| [Contributing](CONTRIBUTING.md)                               | Local workflow and review expectations                                             |
| [Agent instructions](AGENTS.md)                               | Repository rules and project-specific AI skills                                    |

The architecture is implemented with TypeScript, React, Vite, Papa Parse, and a framework-independent core. ESLint dependency checks, a DOM-free core compilation, Prettier, Vitest, React Testing Library, and Playwright protect the boundaries and workflows.

## Source map

| Path                  | Responsibility                                                              |
| --------------------- | --------------------------------------------------------------------------- |
| `src/bootstrap/`      | Adapter wiring and React entry point                                        |
| `src/domain/`         | Registration validation and pure planning policies                          |
| `src/application/`    | Import mapping, session commands, reconciliation, selectors, ports          |
| `src/infrastructure/` | CSV parser, browser effects, text export                                    |
| `src/presentation/`   | React components, de-CH messages, shared and scoped styles                  |
| `src/demo/`           | 50 fictional registrations                                                  |
| `tests/`              | Domain, adapter, session, component, boundary, and production browser tests |
| `tooling/`            | Enforced dependency-direction rule                                          |

## GitHub Pages

Repository: [soracel/Turnfestanmeldungs-Tool](https://github.com/soracel/Turnfestanmeldungs-Tool).

To publish the website, select **Settings → Pages → Source → GitHub Actions**, then run **Publish GitHub Pages** manually. The workflow runs tests and builds the site before uploading only `dist/`. Relative asset paths support a repository subpath. The separate **Check** workflow runs quality checks and production browser tests on pushes and pull requests.

GitHub Pages supports static HTML, CSS, and JavaScript, including public repositories on GitHub Free. See [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

## License and independence

This project is open source under the [MIT License](LICENSE). Copyright (c) 2026 soracel. This is an independent club project, not an official STV service. No Contest API or automatic submission capability has been confirmed.
