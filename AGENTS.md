# Repository Guidelines

## Project Structure & Module Organization

SIGHT is KHLUG's React 18 and TypeScript frontend, built with Vite.

- `src/pages/` contains route pages; `src/App.tsx` defines routing.
- `src/features/` groups feature containers and related UI; `src/components/` holds reusable components and editors.
- `src/api/` contains domain API calls and Axios clients; `src/hooks/` contains hooks, including TanStack Query data fetching.
- `src/layouts/` and `src/util/` hold shared layouts and utilities.
- `public/` holds static assets; `dev/mockApi/` holds development handlers, fixtures, and sample assets; `docs/` holds project documentation.

## Build, Test, and Development Commands

Use Node `v24.15.0` from `.nvmrc` and Yarn `4.5.1` from `package.json`.

- `corepack enable` enables package-manager shims; `yarn install` installs dependencies.
- `yarn dev` starts Vite with the development mock API.
- `yarn build` runs TypeScript project checks and creates the production bundle.
- `yarn lint` runs ESLint.
- `yarn preview` serves the production build locally, without the mock API.

For group-page development, set `VITE_API_BASE_URL` and `VITE_API_V2_BASE_URL` to `/__mock-api`, then open `http://localhost:5173/dev/group/1`. Restart Vite to reset in-memory mock data.

## Coding Style & Naming Conventions

Follow neighboring files: two-space indentation, double-quoted TypeScript strings, and semicolons. Use PascalCase component names, `use`-prefixed camelCase hooks, and colocated CSS modules such as `style.module.css`. Keep API calls in `src/api/` and use TanStack Query for server state.

TypeScript is strict and checks unused locals and parameters. ESLint includes TypeScript, React Hooks, React Refresh, and TanStack Query rules; no dedicated formatter is configured. Outside `WindowLayer/`, consume window-management exports through `GroupDetailContainer/actions.ts` rather than importing `WindowLayer/windowManager` directly.

## Testing Guidelines

Jest is installed, but no test script, configuration, test files, or coverage threshold is established. Run `yarn lint` and `yarn build`, then manually verify affected flows using the mock page. Include reproduction steps and results in PRs. When introducing automated tests, document their runner setup and naming convention.

## Commit & Pull Request Guidelines

History uses `feat:`, `fix:`, `chore:`, and `docs:` prefixes, often with Korean summaries. Keep commits focused and descriptions specific.

PRs should explain behavior changes, link relevant issues, list validation, and include screenshots for UI changes. Follow `README.md` when promoting `dev/group-page` to `feat/group-page`: preserve development mocks on the development branch and apply the documented cleanup on the PR branch.
