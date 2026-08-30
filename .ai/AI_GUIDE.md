# AI_GUIDE — react-pivot-pro

## Project Summary

`react-pivot-pro` (`package.json:2`, v1.1.4) is a **headless, plugin-driven pivot table engine for React + TypeScript** (`package.json:4`). It manages data ingestion, state, and transformation pipeline; consumers own all rendering. No UI, CSS, or HTML is shipped. Build is `tsup` → ESM+CJS+DTS to `dist/` (`tsup.config.ts`, `package.json:76-79`). Package is `sideEffects:false`, `type:module`, tree-shakeable.

## Architecture Summary

```
Consumer (useMemo data/columns/plugins) → usePivotTable (normalizeColumns, buildCoreRowModel, Zustand store, plugin pipeline) → { columns, rowModel, state, setState } → consumer renders
```

- **Types leaf** (`src/types/`), **utils pure** (`src/utils/`), **store isolated** (`src/store/pivotTableStore.ts` + `pluginRegistry.ts`), **core orchestrates** (`src/core/usePivotTable.ts`), **plugins independent** (`src/plugins/`), **hooks wrap external** (`src/hooks/` wrapping `@tanstack/virtual-core`). No circular deps.
- Plugin pipeline runs in registration order; each plugin's output is cached by input ref + state equality.
- State: Zustand vanilla store inside hook; `mergeStates(internal, controlled)` supports uncontrolled / partially controlled / fully controlled.

## Major Features

10 plugins: `sorting`, `filtering`, `grouping`, `pivot` (client engine `src/core/pivotEngine.ts` + server adapter), `aggregation` (12 fns + custom), `columnVisibility`, `columnOrdering`, `columnPinning`, `dndRow`/`dndColumn` (via `@dnd-kit/core`). Utilities: `exportCSV`/`serializeCSV` (CSV injection guard), `copyToClipboard`. Hooks: `useVirtualRows`/`useVirtualColumns` (via `@tanstack/virtual-core`). Details: `.ai/docs/features/`.

## Common Workflows

### Add a new plugin

1. Create `src/plugins/myFeature.ts` with `MyFeatureTableState extends TableState`, `MyFeatureApi`, `createMyFeaturePlugin(): PivotTablePlugin`, `createMyFeatureApi(table)`, `withMyFeature(table)`.
2. Export from `src/index.ts`.
3. Add manifest to `src/store/pluginRegistry.ts:119-174` if conflict detection needed.
4. Ensure `getInitialState` uses `??` defaults; `transformRows/Columns` handle empty state passthrough; `onStateChange` auto-corrects invalid IDs.

### Add a new aggregation function

1. Add to `src/plugins/aggregation/aggregators.ts` (function + `aggregationFns` + `AGGREGATOR_LABELS`).
2. Add union member to `AggregationFnName` in `src/types/aggregation.ts:4-16`.

### Modify core hook

- `src/core/usePivotTable.ts` is the highest-risk file — changes affect all consumers. Preserve `normalizeColumns`, `buildCoreRowModel`, store lifecycle, version counters, and `mergeStates` semantics.

### Add docs-site page

- `docs-site/src/` (Vite app, separate `package.json`). Not part of library dist.

## Coding Standards

- TypeScript `strict:true`, `target:ESNext`, `module:ESNext`, `moduleResolution:bundler`, `jsx:react-jsx` — `tsconfig.json`.
- `import type` for type-only imports; `Extract<keyof TData, string>` for accessor keys; `TData extends RowData` on all generics — `AGENTS.md`.
- Files: `kebab-case` (`pivotEngine.ts`, `useVirtualRows.ts`); Interfaces: `PascalCase`; Plugin factories: `createXPlugin`/`createXApi`/`withX`/`useX`.
- Barrel exports via `src/index.ts` + per-subpath `package.json:exports` + `tsup.config.ts:5-17`.
- No `any`, no class components, no cross-plugin imports.

## Folder Conventions

`src/core/` (logic) | `src/plugins/` (one file per feature, `aggregation/` subfolder) | `src/hooks/` (virtualization) | `src/store/` (Zustand + registry) | `src/types/` (contracts) | `src/utils/` (pure helpers) | `src/index.ts` (public barrel). Tests co-located (`__tests__/` under feature). No `ui/` folder despite `AGENT.md` mention.

## Dependency Rules

Types ← utils ← store ← core ← plugins (inward only). Plugins never import each other; shared helpers in `src/utils/helpers.ts`. External: `react` (peer >=18), `zustand` (state), `@tanstack/virtual-core` (virtualization), `@dnd-kit/core` (DnD). Dev: `tsup`, `typescript`, `vitest`.

## Testing Strategy

Vitest (`package.json:83-84`). Run `npm run test` / `test:run`. Tests co-located or in `__tests__/`. Currently only `src/plugins/aggregation/__tests__/aggregators.test.ts` exists — coverage is sparse. Test plugin behavior (transforms + API), not internals. Mock external virtualizer/DnD where needed.

## Known Constraints

- **Plugin conflicts:** `pivot` ↔ `grouping` (shared `rowGrouping`/`columnGrouping`); `columnOrdering` ↔ `dndColumn` (shared `columnOrder`) — enforced by `src/store/pluginRegistry.ts:119-174` but not inside `usePivotTable` itself.
- **Column visibility** does not auto-filter `table.columns` — consumer must use `getVisibleColumnIds()` (see `src/plugins/columnVisibility.ts` — no `transformColumns`).
- **Aggregation subtotals** depend on `row.values._groupKey` being present (otherwise only grand total) — `src/plugins/aggregation/aggregationPlugin.ts:56-58`.
- **Column ID validation** truncates to 128 chars and replaces invalid IDs with `col_${index}` — `src/core/usePivotTable.ts:22-37`.
- **Subpath exports** for `columnVisibility`/`columnOrdering`/`columnPinning`/`dndRow`/`dndColumn` exist in `tsup.config.ts` but not in `package.json:exports` — only root re-exports.

## Refactoring Rules

- Keep `src/types/` leaf and runtime-free.
- Keep plugin contract stable (`PivotTablePlugin` interface — `src/types/plugin.ts:17-36`): `name`, `getInitialState?`, `transformRows?`, `transformColumns?`, `onStateChange?`.
- Preserve Zustand store's `shallowEqualState` bailout (`src/store/pivotTableStore.ts:21-29`).
- Preserve caching invariants (input ref equality checks) in core pipeline and per-plugin caches.
- Preserve `mergeStates` precedence (controlled overrides internal).

## Safe Modification Areas

- New plugins under `src/plugins/` following triad pattern.
- New aggregation functions in `src/plugins/aggregation/aggregators.ts`.
- New utils in `src/utils/` (pure, no React/store).
- Docs under `.ai/docs/` and `docs-site/src/`.
- `src/hooks/` virtualization wrappers (near-identical; keep `horizontal` difference).

## High Risk Areas

- `src/core/usePivotTable.ts` — orchestration, caching, version counters, controlled-state merge.
- `src/store/pivotTableStore.ts` — state equality bailout.
- `src/core/pivotEngine.ts` — pivot matrix algorithm (bucket map, grouping, aggregation).
- `src/plugins/filtering.ts` — operator dispatch + null/empty handling.
- `src/plugins/aggregation/aggregationPlugin.ts` — subtotal/grand-total insertion.

## Common Mistakes

- Not memoizing `data`/`columns`/`plugins` in consumer → pipeline recomputes every render.
- Registering conflicting plugins together (`pivot` + `grouping`) without registry check.
- Using `columnVisibility` expecting `table.columns` to be filtered automatically (it isn't).
- Mutating `data` array in-place instead of replacing reference → `dataVersion` not incremented, stale rows.
- Forgetting `withX(table)` augmentation after passing plugin to `usePivotTable` — table instance lacks `sorting`/`filtering` etc.

## Development Commands

```bash
npm install
npm run build          # tsup → dist/ (ESM+CJS+DTS)
npm run dev            # tsup --watch
npm run build:types    # dts only
npm run typecheck      # tsc --noEmit
npm run lint           # eslint .
npm run test           # vitest watch
npm run test:run       # vitest --run (CI)
npm run clean          # rm -rf dist
npm run docs:dev       # docs-site
```

## Evidence Sources

- `package.json`, `tsconfig.json`, `tsup.config.ts`
- `src/index.ts`, `src/types/*`, `src/core/*`, `src/store/*`, `src/plugins/*`, `src/hooks/*`, `src/utils/*`
- `.ai/docs/01-project-overview.md` through `.ai/docs/09-component-catalog.md`
- `AGENTS.md`, `AGENT.md`, `CONTEXT.md`, `README.md`
