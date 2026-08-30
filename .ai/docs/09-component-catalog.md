# 09 — Component Catalog

> This library is headless — most exports are hooks, plugins, and utilities, not components. The only reusable UI component is `AggregatorDropdown`.

## Hooks (Reusable Logic Components)

### `usePivotTable<TData, TState>(options) → PivotTableInstance`

- **Purpose:** Core engine hook — normalizes columns, builds core row model, manages store, runs plugin pipeline, returns table instance.
- **Props (PivotTableOptions):** `data`, `columns`, `plugins?`, `initialState?`, `state?`, `onStateChange?`, `getRowId?`, `defaultColumn?` — `src/types/table.ts:8-20`
- **Returns:** `{ state, columns, rowModel, getState, setState, getCoreRowModel, getRowModel, registerPlugin, unregisterPlugin, getPlugin, getAllPlugins }` — `src/types/table.ts:22-37`
- **Dependencies:** `react`, `zustand`, `src/store/pivotTableStore.ts`, `src/utils/accessorHelpers.ts`
- **Usage:** `src/index.ts:1` re-export; see `README.md:62-86` quick start.

### `useVirtualRows` / `useVirtualColumns`

- **Purpose:** Virtualize table rows/columns for large datasets. Thin wrappers around `@tanstack/virtual-core` `Virtualizer`.
- **Props:** `count`, `getScrollElement`, `estimateSize`, `scrollMode?`, `overscan?`, `paddingStart/End?`, `enabled?`, `getItemKey?`, `rangeExtractor?`, etc. — `src/hooks/useVirtualRows.ts:16-39`
- **Returns:** `{ virtualizer, virtualRows/virtualColumns, totalSize }`
- **Dependencies:** `react` (`useLayoutEffect`, `useReducer`, `useMemo`, `useRef`), `@tanstack/virtual-core`
- **Usage:**

```ts
import { useVirtualRows } from 'react-pivot-pro/hooks';
const { virtualRows, totalSize } = useVirtualRows({
  count: table.getRowModel().rows.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 36,
});
```

## Plugin Components (Stateful Features)

Each plugin is a reusable logic component with consistent triad API. Grouped by domain.

### Data Transformation

| Plugin | Factory | Purpose | State Keys |
|---|---|---|---|
| Sorting | `createSortingPlugin` | Multi-column sort via `Int32Array` index sort | `sorting` |
| Filtering | `createFilteringPlugin` | Column + global filtering (text/number/date/enum/boolean) | `filters`, `globalFilter` |
| Grouping | `createGroupingPlugin` | Hierarchical row grouping with expand/collapse | `rowGrouping`, `columnGrouping`, `expandedGroups` |
| Pivot | `createPivotPlugin` | Pivot matrix (client or server via adapter) | `rowGrouping`, `columnGrouping`, `pivotValues`, `pivotEnabled` |
| Aggregation | `createAggregationPlugin` | Subtotals + grand totals, column annotator | `columnAggregators` |

### Column Layout

| Plugin | Factory | Purpose | State Keys |
|---|---|---|---|
| Column Visibility | `createColumnVisibilityPlugin` | Show/hide columns | `columnVisibility` |
| Column Ordering | `createColumnOrderingPlugin` | Explicit column order | `columnOrder` |
| Column Pinning | `createColumnPinningPlugin` | Freeze columns left/right | `columnPinning` |

### Interaction

| Plugin | Factory | Purpose | State Keys |
|---|---|---|---|
| DnD Row | `createDndRowPlugin` | Row reorder via `@dnd-kit/core` | `rowOrder` |
| DnD Column | `createDndColumnPlugin` | Column reorder via `@dnd-kit/core` | `columnOrder` |

**Common plugin usage:**

```ts
import { usePivotTable, createSortingPlugin, withSorting } from 'react-pivot-pro';
const base = usePivotTable({ data, columns, plugins: [createSortingPlugin()] });
const table = withSorting(base);
table.sorting.toggleSorting('amount');
```

Full per-feature docs: `.ai/docs/features/`

## UI Component(s)

### `AggregatorDropdown`

- **Purpose:** Optional dropdown UI for selecting an aggregation function per column (aggregation feature helper).
- **Location:** `src/plugins/aggregation/AggregatorDropdown.tsx`
- **Props:** Unable to determine without reading — file not expanded in this phase; inferred from aggregation APIs to accept `columnId`, `table`, and callback for `setColumnAggregator`.
- **Dependencies:** `react`, `src/types/aggregation.ts`, `src/plugins/aggregation/aggregators.ts` (`AGGREGATOR_LABELS`)
- **Note:** Only UI component in `src/`. Consumer can ignore it and build custom UI via `table.aggregation.*` APIs.

## Utility Modules (Non-Component, Reusable)

| Module | Location | Purpose |
|---|---|---|
| `exportCSV` / `serializeCSV` | `src/utils/exportCSV.ts` | CSV serialization + browser download (sanitizes formula injection) |
| `copyToClipboard` | `src/utils/clipboard.ts` | Clipboard copy helper |
| `legacyAggregationFns` / `resolveAggregationFn` | `src/utils/aggregationFns.ts` | Pivot engine aggregation (count, sum, avg, min, max, median, unique, first, last) |
| `aggregationFns` (plugin) | `src/plugins/aggregation/aggregators.ts` | Aggregation plugin functions (12 fns + labels) |
| `getValueByAccessorKey` / `isSafeKey` | `src/utils/accessorHelpers.ts` | Safe nested key access (prototype pollution guard) |
| `reorderByIds` / `move` / `unique` / `areArraysEqual` | `src/utils/helpers.ts` | Shared collection helpers |
| `createPivotTableStore` | `src/store/pivotTableStore.ts` | Zustand store factory |
| `createPluginRegistry` | `src/store/pluginRegistry.ts` | Plugin conflict detection registry |
| `createPivotEngineResult` | `src/core/pivotEngine.ts` | Stateless pivot matrix engine |

## Domain Grouping

```
core:        usePivotTable, createPivotEngineResult
store:       createPivotTableStore, createPluginRegistry
hooks:       useVirtualRows, useVirtualColumns
plugins/data: sorting, filtering, grouping, pivot, aggregation (+AggregatorDropdown)
plugins/layout: columnVisibility, columnOrdering, columnPinning
plugins/interaction: dndRow, dndColumn
utils:       exportCSV, copyToClipboard, aggregationFns, accessorHelpers, helpers
```

## Evidence Sources

- `src/index.ts`
- `src/core/usePivotTable.ts`, `pivotEngine.ts`
- `src/hooks/useVirtualRows.ts`, `useVirtualColumns.ts`
- `src/plugins/sorting.ts`, `filtering.ts`, `grouping.ts`, `pivot.ts`, `aggregation/*`, `columnVisibility.ts`, `columnOrdering.ts`, `columnPinning.ts`, `dndRow.ts`, `dndColumn.ts`
- `src/store/pivotTableStore.ts`, `pluginRegistry.ts`
- `src/utils/exportCSV.ts`, `clipboard.ts`, `aggregationFns.ts`, `accessorHelpers.ts`, `helpers.ts`
- `src/types/*.ts`
