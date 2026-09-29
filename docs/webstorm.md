# Running the project in WebStorm

Open the repository root (the directory containing `package.json`) as a WebStorm project. Shared run configurations are stored in `.run/` and use the project's runtime and package manager rather than machine-specific paths.

## First-time setup

1. Open **Settings → Languages & Frameworks → JavaScript Runtime**. In older WebStorm versions this page is named **Node.js**.
2. Select a local **Node.js 24** runtime and **pnpm 11.19.0** as the project package manager. If either is marked “Not found”, browse to its installed location. Keep machine-specific paths in local IDE settings.
3. Install dependencies with `pnpm install --frozen-lockfile` from the project root, or use WebStorm's package installation action with pnpm selected. Existing installations do not need to be reinstalled on every start.
4. Select **Turnfest Dev** in the Run configuration dropdown and press **Run**.
5. Open the local URL printed in the Run window, normally `http://127.0.0.1:5173/`. Vite reloads the browser when source files change. Stop the server with the Run window's **Stop** button.

If port 5173 is occupied, Vite selects the next available port; use the URL actually printed in the Run window. Do not open `index.html` directly through the IDE's built-in HTML server.

## Shared configurations

| Configuration  | Package script | Purpose                                  |
| -------------- | -------------- | ---------------------------------------- |
| Turnfest Dev   | `dev`          | Start the local Vite development server  |
| Turnfest Tests | `test`         | Run the unit and component tests once    |
| Turnfest Check | `check`        | Run the full quality checks and build    |
| Turnfest Build | `build`        | Generate the production files in `dist/` |

If configurations are not listed immediately, reload the project from disk or reopen it. As a fallback, open `package.json` and use the Run icon next to the desired script.

The shared configurations inherit **Project** for both runtime and package manager. On another machine, configure these two project settings once. The `.idea/` directory and local pnpm store are ignored by Git; `.run/` remains shareable.

## Browser debugging

Start **Turnfest Dev**, then create a **JavaScript Debug** configuration pointing to the URL printed by Vite and run it with **Debug**. React code executes in the browser; debugging only the Vite Node.js process does not attach to component code.

See the official [WebStorm npm run configuration documentation](https://www.jetbrains.com/help/webstorm/run-debug-configuration-npm.html) for project runtime/package-manager settings and [JavaScript Debug configuration documentation](https://www.jetbrains.com/help/webstorm/run-debug-configuration-javascript-debug.html) for browser debugging.
