# ARCHITECTURE

> Shims `AGENTS.md:27` required reading. Summary backed by `src/` evidence; delegate to `.ai/docs/02-architecture.md` for full detail.

## High-Level

```
Consumer (data/columns/plugins) → usePivotTable (normalizeColumns → buildCoreRowModel → Zustand store → plugin pipeline) → { columns, rowModel, state, setState } → consumer renders
```

`usePivotTable` at `src/core/usePivotTable.ts:171-440` orchestrates: column normalization (`normalizeColumns` `src/core/usePivotTable.ts:39-72`), core row model (`buildCoreRowModel` `src/core/usePivotTable.ts:91-148` pre-computes `values` via `accessorKey`/`accessorFn`), Zustand vanilla store (`src/store/pivotTableStore.ts:31-52`), plugin pipeline (registration order: `transformRows` then `transformColumns` with `Map` cache `src/core/usePivotTable.ts:84-89,358-425`).

## Module Relationships

```
src/index.ts (barrel)
├── src/types/*  — leaf, no runtime deps — src/types/table.ts:1-4
├── src/utils/*  — pure, depends on types — src/utils/accessorHelpers.ts
├── src/store/*  — types + zustand/vanilla — src/store/pivotTableStore.ts:1
├── src/core/*   — types + store + utils — src/core/usePivotTable.ts:1-3
├── src/plugins/* — types + utils + core/pivotEngine — src/plugins/pivot.ts:1, src/core/pivotEngine.ts:160
└── src/hooks/*  — @tanstack/virtual-core external — src/hooks/useVirtualRows.ts:2
```

Strictly inward: `types ← utils ← store ← core ← plugins`; no circular deps; plugins never import each other (shared `src/utils/helpers.ts`).

## State Flow

```
options.initialState + createDefaultTableState() + plugin.getInitialState() → initialStateRef → createPivotTableStore(initialState) → internalState via useStore → mergeStates(internal, options.state) → table.state
└→ stableSetState(updater) → store.setState(next) → onStateChange(next,prev) → cache.clear() → setStateVersion++ → pipeline recomputes
```

`mergeStates` gives controlled precedence — `src/core/usePivotTable.ts:74-82`; base `TableState { sorting, filters, columnVisibility, rowSelection, expanded }` — `src/types/state.ts:26-32` plus per-plugin slices.

## Plugin Contract

```ts
interface PivotTablePlugin { name, getInitialState?, transformRows?, transformColumns?, onStateChange? } — src/types/plugin.ts:17-36
context { columns, data, state, setState, getColumnById } — src/types/plugin.ts:6-15
```

Each feature: `createXPlugin` → `PivotTablePlugin`, `createXApi(table)` → `XApi`, `withX(table)` → `Object.assign(table,{x:api})`, optional `useX` — all 10 plugins `src/plugins/*.ts` (see `.ai/docs/03-patterns.md` triad table). Conflicts via `DEFAULT_MANIFESTS` + shared `stateKeys`: `pivot↔grouping`, `columnOrdering↔dndColumn` — `src/store/pluginRegistry.ts:119-174`.

## Caching

Pipeline `Map<string,PluginCacheEntry>` keyed `plugin_${name}_v${pluginVersion}`; hit on `cached.inputRows===transformedRows` and `cached.inputColumns===transformedColumns` — `src/core/usePivotTable.ts:364-376`. Per-plugin closures cache `rows`/`result` + slice equality (`areSortingRulesEqual`, `areFiltersEqual`, `JSON.stringify` for aggregators). Invalidation on `pluginVersion`/`dataVersion`/`stateVersion` or slice change.

## Engine

`createPivotEngineResult` stateless (`src/core/pivotEngine.ts:160-242`) builds bucket `rowKey→columnKey→TData[]`, aggregates via `resolveAggregationFn`. `PivotServerAdapter { execute(request):Promise<PivotEngineResult> }` (`src/core/pivotEngine.ts:56-58`) for server offload via `pivot.runServerSidePivot()` (`src/plugins/pivot.ts:271-280`). No backend in repo — `docs/06-backend-architecture.md`.

## Boundaries

- No HTTP, no DB; `@tanstack/virtual-core` and `@dnd-kit/core` wrapped — consumers provide `DndContext` — `src/hooks/*`, `src/plugins/dndRow.ts:1`
- `zustand` internal only; no React Context — `src/store/pivotTableStore.ts`
- Headless: no table component/CSS/HTML in `src/` except `AggregatorDropdown.tsx`

## Detailed Reference

- `.ai/docs/02-architecture.md` — full diagrams, ownership, layering
- `.ai/docs/01-project-overview.md` — layout, build, runtime
- `.ai/docs/08-state-management.md` — ownership, flow, controlled modes

## Evidence Sources

- `src/index.ts`, `src/types/*`, `src/core/usePivotTable.ts`, `pivotEngine.ts`, `src/store/*`, `src/plugins/*`, `src/hooks/*`, `src/utils/*`, `tsup.config.ts`, `package.json`
