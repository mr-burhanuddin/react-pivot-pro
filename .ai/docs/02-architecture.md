# 02 — Architecture

## High-Level Architecture

```mermaid
graph TD
    Consumer[Consumer Component] --> Hook[usePivotTable Hook<br/>src/core/usePivotTable.ts]
    Hook --> Normalize[normalizeColumns<br/>ColumnDef → Column]
    Hook --> CoreModel[buildCoreRowModel<br/>TData[] → RowModel]
    Hook --> Store[Zustand Store<br/>src/store/pivotTableStore.ts]
    Hook --> Pipeline[Plugin Pipeline<br/>transformRows / transformColumns]

    CoreModel --> Pipeline
    Normalize --> Pipeline

    Pipeline --> Sorting[sorting]
    Pipeline --> Filtering[filtering]
    Pipeline --> Grouping[grouping]
    Pipeline --> Pivot[pivot]
    Pipeline --> Aggregation[aggregation]
    Pipeline --> DndRow[dndRow]
    Pipeline --> Vis[ColumnVisibility]
    Pipeline --> Ordering[columnOrdering]
    Pipeline --> Pinning[columnPinning]
    Pipeline --> DndCol[dndColumn]

    Pipeline --> RowModel[Final RowModel]
    Pipeline --> ColModel[Final Column[]]

    RowModel --> Render[Consumer Renders<br/>table.getRowModel().rows]
    ColModel --> Render

    Store --> |state| Pipeline
    Store --> |setState| Consumer
```

## Module Relationships

```
src/index.ts (barrel)
├── src/types/*          — no dependencies (leaf)
├── src/utils/*          — depends on types
├── src/store/*          — depends on types
├── src/core/*           — depends on types, store, utils
├── src/plugins/*        — depends on types, core/pivotEngine, utils
└── src/hooks/*          — depends on @tanstack/virtual-core (external)
```

Dependency direction is strictly **inward**: `types ← utils ← store ← core ← plugins`. No circular imports detected.

| Module | Depends On | Depended By |
|---|---|---|
| `types` | nothing (except `RowData` self-ref) | all |
| `utils` | `types` | `core`, `plugins`, `hooks` (none for hooks) |
| `store` | `types`, `zustand/vanilla` | `core` |
| `core` | `types`, `store`, `utils` | `plugins/pivot`, consumers |
| `plugins` | `types`, `utils`, `core/pivotEngine` | consumers via `index.ts` |
| `hooks` | `@tanstack/virtual-core` | consumers |

## Layering Rules (Observed)

1. **Types are leaf** — `src/types/*.ts` import only from sibling type files (`src/types/table.ts:1-4`). No runtime imports.
2. **Utils are pure** — `src/utils/helpers.ts`, `accessorHelpers.ts`, `aggregationFns.ts`, `exportCSV.ts` are stateless functions, no React, no store.
3. **Store is isolated** — `src/store/pivotTableStore.ts` depends only on `zustand/vanilla` and `types`. No plugin or core import.
4. **Core orchestrates** — `src/core/usePivotTable.ts` is the only file that touches React hooks, Zustand store, column normalization, core row model, and plugin pipeline.
5. **Plugins are independent** — each plugin file is self-contained; no plugin imports another plugin. Shared logic is factored into `utils/helpers.ts` (`unique`, `reorderByIds`, `areArraysEqual`).
6. **Hooks are external adapters** — `src/hooks/useVirtualRows.ts` wraps `@tanstack/virtual-core` `Virtualizer`, no dependency on core/store/types beyond re-export.

## Core Data Flow

```
Input                          Core Layer                     Plugin Layer               Output
─────                          ──────────                     ────────────               ──────
TData[] ──→ buildCoreRowModel ──→ RowModel{rows, flatRows, rowsById}
              (src/core/usePivotTable.ts:91-148)
              pre-computes values via accessorKey/accessorFn
ColumnDef[] ──→ normalizeColumns ──→ Column[] (unique ids)
              (src/core/usePivotTable.ts:39-72)

RowModel.rows ──→ for each plugin in registration order:
                   rows = plugin.transformRows(rows, context) ?? rows
                   (src/core/usePivotTable.ts:358-377, cached)

Column[] ──→ for each plugin in registration order:
               cols = plugin.transformColumns(cols, context) ?? cols
               (src/core/usePivotTable.ts:396-425, cached)

→ { columns: Column[], rowModel: RowModel, state, setState, ... }
```

Execution order = registration order in `options.plugins` array. Known order-sensitive pairs: filtering before sorting reduces work; pivot should be last (replaces all rows).

## State Flow

```
options.initialState ──┐
                       ├──→ merged with createDefaultTableState() + plugin.getInitialState() → initialStateRef
                       │
createPivotTableStore(initialState) → Zustand vanilla store { state, setState, resetState }
                       │
         ┌─────────────┼──────────────┐
         │             │              │
   table.state   table.setState  options.state (controlled override)
         │             │              │
         └─────────────┼──────────────┘
                       ▼
               mergeStates(internal, controlled)  (src/core/usePivotTable.ts:74-82)
                       │
                       ▼
               options.onStateChange(next, prev)  (src/core/usePivotTable.ts:237)
                       │
                       ▼
               pluginCache.clear() + setStateVersion++ → pipeline recomputes
```

## Ownership Boundaries

| Concern | Owner | Evidence |
|---|---|---|
| Column normalization & ID generation | `usePivotTable` | `src/core/usePivotTable.ts:39-72` |
| Core row model (values pre-compute) | `usePivotTable` | `src/core/usePivotTable.ts:91-148` |
| State storage | `pivotTableStore` (Zustand) | `src/store/pivotTableStore.ts:31-52` |
| Plugin registry & conflict detection | `pluginRegistry` | `src/store/pluginRegistry.ts:20-117` |
| Row transforms | Individual plugins | `src/plugins/*.ts` `transformRows` |
| Column transforms | Individual plugins | `src/plugins/*.ts` `transformColumns` |
| Aggregation math | `aggregators.ts` + `aggregationPlugin.ts` | `src/plugins/aggregation/*` |
| Pivot matrix | `pivotEngine.ts` | `src/core/pivotEngine.ts:160-242` |
| Virtualization | `useVirtualRows/Columns` | `src/hooks/*` |
| CSV / Clipboard | `utils/exportCSV.ts`, `utils/clipboard.ts` | `src/utils/*` |

## Plugin Pipeline & Caching

Each plugin's output is cached at two levels:

1. **Pipeline cache** (`src/core/usePivotTable.ts:84-89`, `364-376`): `Map<string, PluginCacheEntry>` keyed by `plugin_${name}_v${pluginVersion}` (rows) and `plugin_${name}_columns_v${pluginVersion}` (columns). Hit = input reference equality (`cached.inputRows === transformedRows`).

2. **Plugin internal cache** (e.g., `src/plugins/sorting.ts:80-84`, `src/plugins/filtering.ts:299-305`, `src/plugins/grouping.ts:167-172`): plugin-local object caching `rows`, `result`, plus plugin-specific state keys.

Cache invalidation triggers: `pluginVersion++` (plugin added/removed), `dataVersion++` (data ref change), `stateVersion++` (any `setState`), or plugin-specific state change.

## Abstraction Layers

| Layer | Abstraction | File |
|---|---|---|
| Data | `Row<TData>`, `RowModel`, `Column<TData>`, `ColumnDef` | `src/types/row.ts`, `column.ts` |
| State | `TableState`, `Updater<T>`, `PivotTableStore` | `src/types/state.ts`, `store/pivotTableStore.ts` |
| Plugin | `PivotTablePlugin`, `PivotTablePluginContext` | `src/types/plugin.ts` |
| Table | `PivotTableInstance`, `PivotTableOptions` | `src/types/table.ts` |
| Engine | `PivotEngineResult`, `PivotServerAdapter` | `src/core/pivotEngine.ts` |
| Hooks | `UseVirtualRowsOptions`, `UseVirtualColumnsOptions` | `src/hooks/*` |

## External Boundaries

- No backend, no API clients, no HTTP calls.
- `@tanstack/virtual-core` is wrapped, not exposed directly — consumers interact via `useVirtualRows`/`useVirtualColumns`.
- `@dnd-kit/core` types (`DragEndEvent`, `UniqueIdentifier`) are re-exported through plugin APIs but DnD context setup is consumer-owned.
- `zustand` is internal; consumers never import it directly (store is created inside `usePivotTable`).

## Evidence Sources

- `src/index.ts`
- `src/types/index.ts`, `table.ts`, `column.ts`, `row.ts`, `plugin.ts`, `state.ts`, `aggregation.ts`
- `src/core/usePivotTable.ts`
- `src/core/pivotEngine.ts`
- `src/store/pivotTableStore.ts`, `pluginRegistry.ts`
- `src/plugins/sorting.ts`, `filtering.ts`, `grouping.ts`, `pivot.ts`, `aggregation/*`, `columnVisibility.ts`, `columnOrdering.ts`, `columnPinning.ts`, `dndRow.ts`, `dndColumn.ts`
- `src/hooks/useVirtualRows.ts`, `useVirtualColumns.ts`
- `src/utils/helpers.ts`, `accessorHelpers.ts`, `aggregationFns.ts`
- `tsup.config.ts`
- `package.json`
