# React Pivot Pro

![npm version](https://img.shields.io/npm/v/react-pivot-pro)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![React](https://img.shields.io/badge/React-18%2B-blue)

Headless, plugin-driven pivot table engine for React + TypeScript. Manages state and data transformation while you own the UI.

## Project Overview

`react-pivot-pro` provides a typed core table state/model layer with composable feature plugins and utility hooks — without dictating any UI framework or rendering strategy.

- **Headless core** — `usePivotTable` (`src/core/usePivotTable.ts`) returns `{ columns, rowModel, state, setState }`; you render headers/rows.
- **Plugin architecture** — 10 built-in plugins, each independently composable, run in registration order with per-plugin caching.
- **Pivoting** — client-side matrix via `createPivotEngineResult` (`src/core/pivotEngine.ts`) or server-side via `PivotServerAdapter` (`src/core/pivotEngine.ts`).
- **Aggregation** — 12 built-ins (`sum count avg min max median stddev variance pctOfTotal pctOfColumn runningTotal countDistinct` — `src/plugins/aggregation/aggregators.ts`) + custom.
- **Virtualization** — `useVirtualRows` / `useVirtualColumns` via `@tanstack/virtual-core` (`src/hooks/useVirtualRows.ts`).
- **DnD** — rows/columns via `@dnd-kit/core` (`src/plugins/dndRow.ts`, `dndColumn.ts`).
- **Utilities** — `exportCSV`/`serializeCSV` with formula-injection guard (`src/utils/exportCSV.ts`), `copyToClipboard` (`src/utils/clipboard.ts`).

## Architecture

```
Consumer (data/columns/plugins) → usePivotTable (normalizeColumns → buildCoreRowModel → Zustand store → plugin pipeline) → { columns, rowModel, state, setState }
                                         ↓ plugin pipeline order = registration order
                          sorting, filtering, grouping, pivot, aggregation, dndRow  (rows)
                          columnOrdering, columnPinning, dndColumn, columnVisibility, aggregation (columns)
```

- **Layering:** `types` (leaf) → `utils` (pure) → `store` (Zustand vanilla) → `core` (orchestration) → `plugins` (independent) → `hooks` (external adapter). No circular deps. See `.ai/docs/02-architecture.md`.
- **State:** Zustand vanilla store inside hook (`src/store/pivotTableStore.ts`), `mergeStates(internal, controlled)` for uncontrolled/controlled modes (`src/core/usePivotTable.ts`).
- **Caching:** pipeline `Map` + per-plugin closures keyed by input ref + state equality; invalidated by `pluginVersion`/`dataVersion`/`stateVersion`.
- **Conflicts:** `pivot↔grouping` and `columnOrdering↔dndColumn` share state keys; detected via `createPluginRegistry` (`src/store/pluginRegistry.ts`).

## Tech Stack

| Layer | Tech | Version | Evidence |
|---|---|---|---|
| Language | TypeScript | ^6.0.2 | `package.json`, `tsconfig.json` strict, `target:ESNext`, `jsx:react-jsx` |
| Runtime | React (peer) | >=18.0.0 | `package.json` |
| State | Zustand | ^5.0.12 | `package.json` |
| Virtualization | @tanstack/virtual-core | ^3.13.23 | `package.json` |
| Drag & Drop | @dnd-kit/core | ^6.3.1 | `package.json` |
| Build | tsup | ^8.5.1 | `tsup.config.ts`, `package.json` |
| Test | Vitest | ^4.1.2 | `package.json` |
| Docs site | Vite (standalone) | — | `docs-site/vite.config.ts` |
| Deploy | Vercel | — | `vercel.json` |

No backend: no HTTP server, DB, or ORM (`package.json`). Pivot server offload is via consumer-provided `PivotServerAdapter`.

## Installation

```bash
npm install react-pivot-pro
```

**Peers:**

| Package | Required by |
|---|---|
| `react >=18.0.0` | core (required) — `package.json` |
| `react-dom >=18.0.0` | optional — `package.json` `peerDependenciesMeta` |
| `zustand` | state — `package.json` (installed with library) |
| `@tanstack/virtual-core` | `useVirtualRows`/`useVirtualColumns` — `package.json` |
| `@dnd-kit/core` | `createDndRowPlugin`/`createDndColumnPlugin` — `package.json` |

## Running

This is a **library**, not an app — no dev server. Build outputs to `dist/`:

```bash
npm install           # install deps
npm run build         # tsup → dist/ (ESM + CJS + DTS) — tsup.config.ts
npm run dev           # tsup --watch
npm run build:types   # dts only
npm run typecheck     # tsc --noEmit (strict)
npm run lint          # eslint .
npm run test          # vitest watch
npm run test:run      # vitest --run (CI)
npm run clean         # rm -rf dist
npm run docs:dev      # docs-site Vite dev
npm run docs:build    # docs-site build
```

Node >=18 — `package.json`. Outputs: `dist/index.{js,cjs,d.ts}` + per-plugin bundles; `sideEffects:false`, `type:module`.

## Environment Setup

No `.env` required for the library. No secrets are read. `docs-site` may have its own env (see `docs-site/`).

## Scripts

| Script | Command | Purpose |
|---|---|---|
| `build` | `tsup` + postbuild strip `.d.cts` | Library build — `package.json` |
| `dev` | `tsup --watch` | Watch mode |
| `build:types` | `tsup --dts-only` | Types only |
| `typecheck` | `tsc --noEmit` | Strict type check |
| `lint` | `eslint .` | Lint |
| `test` | `vitest` | Tests |
| `test:run` | `vitest --run` | CI single run |
| `clean` | `rm -rf dist` | Clean output |
| `docs:dev` | `npm run dev --prefix docs-site` | Docs site |
| `docs:build` | `npm run build --prefix docs-site` | Docs site build |

Run a single test: `npm run test -- src/plugins/aggregation/__tests__/aggregators.test.ts` or `npm run test -- -t "pivot"` — see `.ai/AI_GUIDE.md` Development Commands.

## Folder Structure

```
react-pivot-pro/
├── src/
│   ├── core/               # usePivotTable hook + pivotEngine (src/core/)
│   ├── hooks/              # useVirtualRows / useVirtualColumns (src/hooks/)
│   ├── plugins/            # 10 plugins (src/plugins/*.ts + aggregation/)
│   ├── store/              # Zustand store + plugin registry (src/store/)
│   ├── types/              # Public type contracts (src/types/*.ts)
│   ├── utils/              # helpers, accessorHelpers, aggregationFns, exportCSV, clipboard
│   └── index.ts            # Public barrel — src/index.ts
├── docs-site/              # Vite docs app (separate package.json)
├── .ai/
│   ├── AI_GUIDE.md / PROJECT_RULES.md / ARCHITECTURE.md
│   ├── docs/               # Markdown knowledge base (01-09 + features/ + examples/)
│   ├── context/            # Compressed AI context (project, architecture, patterns, feature-map, glossary, tech-stack)
│   └── personas/           # architect, frontend-engineer, backend-engineer, code-reviewer, ai-first-builder
├── dist/                   # Build output (generated)
├── tsup.config.ts          # 16 entries (index + 9 plugins + hooks/store)
├── tsconfig.json           # ESNext, bundler, strict, react-jsx, declaration
└── package.json            # exports map for "." + 9 plugin subpaths + hooks/store/utils
```

## Features

| Feature | Plugin / Hook | State Keys | Docs |
|---|---|---|---|
| Sorting | `createSortingPlugin` | `sorting` | `.ai/docs/features/sorting.md` |
| Filtering | `createFilteringPlugin` | `filters`, `globalFilter` | `.ai/docs/features/filtering.md` |
| Grouping | `createGroupingPlugin` | `rowGrouping`, `columnGrouping`, `expandedGroups` | `.ai/docs/features/grouping.md` |
| Pivot | `createPivotPlugin` + `createPivotEngineResult` | `rowGrouping`, `columnGrouping`, `pivotValues`, `pivotEnabled` | `.ai/docs/features/pivot.md` |
| Aggregation | `createAggregationPlugin` + 12 fns | `columnAggregators` | `.ai/docs/features/aggregation.md` |
| Column visibility | `createColumnVisibilityPlugin` | `columnVisibility` | `.ai/docs/features/columnVisibility.md` |
| Column ordering | `createColumnOrderingPlugin` | `columnOrder` | `.ai/docs/features/columnOrdering.md` |
| Column pinning | `createColumnPinningPlugin` | `columnPinning` | `.ai/docs/features/columnPinning.md` |
| DnD Row | `createDndRowPlugin` | `rowOrder` | `.ai/docs/features/dndRow.md` |
| DnD Column | `createDndColumnPlugin` | `columnOrder` | `.ai/docs/features/dndColumn.md` |
| Virtualization | `useVirtualRows`/`useVirtualColumns` | — | `.ai/docs/features/virtualization.md` |
| Export/Clipboard | `exportCSV`/`serializeCSV`/`copyToClipboard` | — | `.ai/docs/features/exportAndClipboard.md` |

All plugins follow `createXPlugin` → `createXApi` → `withX` → `useX` triad (see `.ai/docs/03-patterns.md`). Constraints: `pivot↔grouping` and `columnOrdering↔dndColumn` cannot be used together.

## Development Workflow

1. Read `.ai/PROJECT_RULES.md` and `.ai/ARCHITECTURE.md` (Required Reading — `AGENTS.md`).
2. Stabilize `data`/`columns`/`plugins` refs with `useMemo` in consumers (pipeline invalidates on ref change).
3. Add feature under `src/plugins/` following triad; add `getInitialState` with `??` defaults; implement `transformRows`/`transformColumns` with empty-state passthrough and `onStateChange` auto-correct for deleted columns.
4. Export from `src/index.ts`; add manifest to `src/store/pluginRegistry.ts` if conflicts need detection.
5. Before commit: `npm run typecheck && npm run lint && npm run test:run`.

## Quick Start

```tsx
import { useMemo } from "react";
import { usePivotTable, createSortingPlugin, withSorting, createFilteringPlugin, withFiltering, type ColumnDef } from "react-pivot-pro";

type Sale = { id: string; region: string; product: string; amount: number };

function SalesTable({ data }: { data: Sale[] }) {
  const columns = useMemo<ColumnDef<Sale>[]>(() => [
    { id: "region", accessorKey: "region", enableFiltering: true },
    { id: "product", accessorKey: "product", enableSorting: true },
    { id: "amount", accessorKey: "amount", enableSorting: true },
  ], []);

  const base = usePivotTable<Sale>({
    data, columns,
    plugins: [createFilteringPlugin(), createSortingPlugin()],
    initialState: { sorting: [{ id: "amount", desc: true }] },
  });

  const table = withFiltering(withSorting(base));

  return (
    <table>
      <thead><tr>{table.columns.map(col => <th key={col.id}>{col.header ?? col.id}</th>)}</tr></thead>
      <tbody>{table.getRowModel().rows.map(row => (
        <tr key={row.id}>{table.columns.map(col => <td key={col.id}>{String(row.getValue(col.id) ?? "")}</td>)}</tr>
      ))}</tbody>
    </table>
  );
}
```

## Testing

- Runner: Vitest — `package.json` (`npm run test` / `test:run`).
- Location: co-located, e.g., `src/plugins/aggregation/__tests__/aggregators.test.ts`.
- Coverage: sparse (single test file observed). Test plugin behavior (transforms + APIs), not internals.

## Deployment

- Library: `npm publish` runs `prepublishOnly` → `npm run build` — `package.json`. Output `dist/` is the sole published directory (`files: ["dist"]`).
- Docs site: Vercel via `vercel.json`.

## Documentation Index

- `.ai/docs/01-project-overview.md` — purpose, tech, layout, entry points, build/runtime
- `.ai/docs/02-architecture.md` — modules, layering, data/state flow, caching
- `.ai/docs/03-patterns.md` — plugin triad, Updater, Zustand, caching, virtualization, safety guards
- `.ai/docs/04-dos-and-donts.md` — required/anti-patterns, naming, file/import/TS rules
- `.ai/docs/05-frontend-architecture.md` — headless model, hooks, state flow, virtualization, docs-site
- `.ai/docs/06-backend-architecture.md` — no-backend verdict + pivot adapter interface
- `.ai/docs/07-api-map.md` — all public APIs, request/response models, UI→API mapping
- `.ai/docs/08-state-management.md` — store, state shape, ownership, update flow, controlled modes
- `.ai/docs/09-component-catalog.md` — reusable hooks/plugins/utilities by domain
- `.ai/docs/features/*.md` — per-feature (sorting, filtering, grouping, pivot, aggregation, columnVisibility/Ordering/Pinning, dndRow/dndColumn, virtualization, exportAndClipboard)
- `.ai/docs/API-usePivotTable.md` — `usePivotTable` API reference
- `.ai/AI_GUIDE.md`, `.ai/PROJECT_RULES.md`, `.ai/ARCHITECTURE.md` — required reading (AGENTS.md)
- `.ai/personas/*.md` — architect, frontend-engineer, backend-engineer, code-reviewer, ai-first-builder
- `.ai/context/*.md` — project, architecture, patterns, feature-map, glossary, tech-stack

## Evidence Sources

- `package.json`, `tsconfig.json`, `tsup.config.ts`
- `src/index.ts`, `src/types/*`, `src/core/*`, `src/store/*`, `src/plugins/*`, `src/hooks/*`, `src/utils/*`
- `vercel.json`, `docs-site/package.json` + `vite.config.ts`
- `AGENTS.md`, `AGENT.md`, `CONTEXT.md`, `.ai/`
