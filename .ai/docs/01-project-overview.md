# 01 — Project Overview

## Project Purpose

`react-pivot-pro` is a **headless, plugin-driven pivot table engine for React + TypeScript**. It manages state and data transformation (sorting, filtering, grouping, pivoting, aggregation, column visibility/ordering/pinning, drag-and-drop) while consumers own all UI rendering. It does not ship any table component, CSS, or HTML.

> Evidence: `package.json:4` description field; `src/index.ts:1` public export is `usePivotTable` hook only; no UI components in `src/`.

## Detected Technologies

| Technology | Evidence | Version |
|---|---|---|
| TypeScript | `tsconfig.json`, `package.json:devDependencies` | ^6.0.2 |
| React (peer) | `package.json:92` peerDependencies | >=18.0.0 |
| Zustand | `package.json:99`, `src/store/pivotTableStore.ts:1` | ^5.0.12 |
| @tanstack/virtual-core | `package.json:98`, `src/hooks/useVirtualRows.ts:2` | ^3.13.23 |
| @dnd-kit/core | `package.json:97`, `src/plugins/dndRow.ts:1` | ^6.3.1 |
| tsup (build) | `tsup.config.ts`, `package.json:77-79` | ^8.5.1 |
| Vitest (test) | `package.json:83-84` | ^4.1.2 |

No backend framework detected. No database, ORM, or server runtime.

## Detected Frameworks

- **React + TypeScript** — library target, not an application.
- **Vite** — used only inside `docs-site/` (`docs-site/vite.config.ts`).
- No Next.js, Express, NestJS, or other app framework in root.

## Repository Layout

```
react-pivot-pro/
├── src/
│   ├── core/               # Engine + main hook
│   │   ├── usePivotTable.ts
│   │   └── pivotEngine.ts
│   ├── hooks/              # Virtualization hooks
│   │   ├── useVirtualRows.ts
│   │   ├── useVirtualColumns.ts
│   │   └── index.ts
│   ├── plugins/            # Feature plugins (10)
│   │   ├── sorting.ts
│   │   ├── filtering.ts
│   │   ├── grouping.ts
│   │   ├── pivot.ts
│   │   ├── columnVisibility.ts
│   │   ├── columnOrdering.ts
│   │   ├── columnPinning.ts
│   │   ├── dndRow.ts
│   │   ├── dndColumn.ts
│   │   └── aggregation/
│   │       ├── aggregationPlugin.ts
│   │       ├── aggregationApi.ts
│   │       ├── aggregators.ts
│   │       ├── AggregatorDropdown.tsx
│   │       └── index.ts
│   ├── store/              # Zustand store + registry
│   │   ├── pivotTableStore.ts
│   │   ├── pluginRegistry.ts
│   │   └── index.ts
│   ├── types/              # Public type definitions
│   │   ├── table.ts
│   │   ├── column.ts
│   │   ├── row.ts
│   │   ├── plugin.ts
│   │   ├── state.ts
│   │   ├── aggregation.ts
│   │   └── index.ts
│   ├── utils/              # Helpers
│   │   ├── helpers.ts
│   │   ├── accessorHelpers.ts
│   │   ├── aggregationFns.ts
│   │   ├── exportCSV.ts
│   │   └── clipboard.ts
│   └── index.ts            # Public barrel
├── docs-site/              # Vite docs site (not part of library)
├── .ai/docs/               # Markdown knowledge base (01-09 + features/ + examples/)
├── dist/                   # Build output (generated)
├── tsup.config.ts
├── tsconfig.json
├── package.json
└── vercel.json
```

## Important Folders

| Folder | Purpose | Evidence |
|---|---|---|
| `src/core` | Core hook + pivot engine | `src/core/usePivotTable.ts`, `src/core/pivotEngine.ts` |
| `src/plugins` | All feature plugins | 10 plugin files listed above |
| `src/store` | Zustand store + plugin registry | `src/store/pivotTableStore.ts`, `src/store/pluginRegistry.ts` |
| `src/types` | Public TypeScript contracts | `src/types/*.ts` |
| `src/hooks` | Virtualization wrappers | `src/hooks/useVirtualRows.ts`, `src/hooks/useVirtualColumns.ts` |
| `src/utils` | Pure helpers, CSV, clipboard | `src/utils/*.ts` |
| `docs-site` | Documentation site | `docs-site/package.json`, `docs-site/src/` |
| `dist` | Build artifacts | `package.json:76-79`, `.gitignore` |

## Entry Points

| Entry | File | Export Config |
|---|---|---|
| Main | `src/index.ts` | `package.json:32-36` `"."` |
| plugins/sorting | `src/plugins/sorting.ts` | `package.json:37-41` |
| plugins/filtering | `src/plugins/filtering.ts` | `package.json:42-46` |
| plugins/grouping | `src/plugins/grouping.ts` | `package.json:47-51` |
| plugins/pivot | `src/plugins/pivot.ts` | `package.json:52-56` |
| hooks | `src/hooks/index.ts` | `package.json:57-61` |
| store | `src/store/index.ts` | `package.json:62-66` |
| utils | `src/utils/index.ts` | `package.json:67-71` |
| tsup additional | `src/plugins/columnVisibility.ts`, `columnOrdering.ts`, `columnPinning.ts`, `dndRow.ts`, `dndColumn.ts`, `hooks/index.ts`, `store/index.ts` | `tsup.config.ts:6-17` |

> All `tsup.config.ts:6-17` entries are exported via `package.json:exports` (including `columnVisibility`, `columnOrdering`, `columnPinning`, `dndRow`, `dndColumn`).

## Build Process

```bash
npm run build        # tsup → ESM + CJS + DTS, then postbuild removes .d.cts
npm run dev          # tsup --watch
npm run build:types  # tsup --dts-only
npm run typecheck    # tsc --noEmit (strict)
npm run clean        # rm -rf dist
```

- `tsup.config.ts:18-25` — `format: ['esm','cjs']`, `splitting: false`, `treeshake: true`, `minify: true`, `dts: true`, `external: ['react','react-dom','react/jsx-runtime']`
- `tsconfig.json:2-14` — `target: ESNext`, `module: ESNext`, `moduleResolution: bundler`, `strict: true`, `jsx: react-jsx`, `declaration: true`, `rootDir: src`, `outDir: dist`
- Output: `dist/` with `index.js` (ESM), `index.cjs` (CJS), `index.d.ts` + per-plugin bundles.

## Runtime Process

This is a **library**, not a runnable application. No server, no deployment runtime. Consumers import and call `usePivotTable()` inside a React 18+ application.

- Peer dependency: `react >=18.0.0`, `react-dom >=18.0.0` (optional) — `package.json:92-95`
- Node engine: `>=18.0.0` — `package.json:117`
- `sideEffects: false` — `package.json:76` (tree-shakeable)
- `type: module` — `package.json:27` (ESM package)

## Documentation Site Runtime

`docs-site/` is a separate Vite app:

```bash
npm run docs:dev     # npm run dev --prefix docs-site
npm run docs:build   # npm run build --prefix docs-site
```

Deploy target: Vercel (`vercel.json` at root).

## Evidence Sources

- `package.json`
- `tsconfig.json`
- `tsup.config.ts`
- `src/index.ts`
- `src/core/usePivotTable.ts`
- `src/core/pivotEngine.ts`
- `src/store/pivotTableStore.ts`
- `src/hooks/useVirtualRows.ts`
- `src/plugins/sorting.ts` and siblings
- `.gitignore`
- `vercel.json`
- `docs-site/package.json`
- `docs-site/vite.config.ts`
