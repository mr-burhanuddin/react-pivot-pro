# 07 — API Map

> No REST/HTTP endpoints exist. This is a headless library — its "API" is the TypeScript surface consumed in-process. This document maps that surface.

## Service Map

There are **no HTTP endpoints** in this repository. All APIs are in-memory TypeScript functions/hooks/classes called from consumer React components.

**Evidence:** No `fetch`, `axios`, `http`, `express`, `fastify`, or `route` code in `src/`; no OpenAPI spec; no `pages/api`; no server.

## Public Surface (Barrel)

**Entry:** `src/index.ts:1-78` (`package.json:32-36` `"."`)

```
usePivotTable
createPivotTableStore, PivotTableStore
exportCSV, serializeCSV (+ ExportCsvOptions, ExportCsvResult)
copyToClipboard (+ CopyToClipboardOptions)
legacyAggregationFns, resolveAggregationFn (+ AggregationInput, LegacyAggregationFn)
useVirtualRows, useVirtualColumns
createSortingPlugin, withSorting, useSorting (+ SortingTableState, SortingApi, PivotTableWithSorting)
createFilteringPlugin, withFiltering, useFiltering (+ FilteringTableState, FilteringApi, PivotTableWithFiltering)
createGroupingPlugin, withGrouping, useGrouping (+ GroupingTableState, GroupingApi, PivotTableWithGrouping)
createPivotPlugin, withPivot, usePivot (+ PivotTableState, PivotApi, PivotTableWithPivot)
createColumnVisibilityPlugin, withColumnVisibility (+ ColumnVisibilityTableState, ColumnVisibilityApi, PivotTableWithColumnVisibility)
createColumnOrderingPlugin, withColumnOrdering (+ ColumnOrderingTableState, ColumnOrderingApi, PivotTableWithColumnOrdering)
createColumnPinningPlugin, withColumnPinning (+ ColumnPinningTableState, ColumnPinningApi, PivotTableWithColumnPinning, PinSide)
createDndRowPlugin, withDndRow, useDndRow (+ DndRowTableState, DndRowApi, PivotTableWithDndRow)
createDndColumnPlugin, withDndColumn, useDndColumn (+ DndColumnTableState, DndColumnApi, PivotTableWithDndColumn)
createAggregationPlugin, createAggregationApi, withAggregation, usePivotAggregation, AggregatorDropdown,
  sum, count, avg, min, max, median, stddev, variance, pctOfTotal, runningTotal, countDistinct,
  aggregationFns, AGGREGATOR_LABELS (+ AggregationFnName, AggregationFn, AggregationState, AggregationApi, ...)
createPluginRegistry, DEFAULT_MANIFESTS (via store subpath)
```

Subpath entries mirror this via `package.json:37-71` and `tsup.config.ts:5-17`.

## Core Hook

### `usePivotTable<TData, TState>(options) → PivotTableInstance<TData, TState>`

**Location:** `src/core/usePivotTable.ts:171-440`

**Options (`src/types/table.ts:8-20`):**

| Field | Type | Purpose |
|---|---|---|
| `data` | `TData[]` | Raw row data |
| `columns` | `ColumnDef<TData>[]` | Column definitions |
| `plugins?` | `PivotTablePlugin<TData, TState>[]` | Feature plugins (order = pipeline order) |
| `initialState?` | `Partial<TState>` | Uncontrolled seed |
| `state?` | `Partial<TState>` | Controlled override |
| `onStateChange?` | `(next, prev) => void` | State change callback |
| `getRowId?` | `(row, index) => string` | Custom row ID |
| `defaultColumn?` | `Partial<ColumnDef<TData>>` | Defaults merged into each column |

**Returns `PivotTableInstance` (`src/types/table.ts:22-37`):**

| Field | Type | Purpose |
|---|---|---|
| `state` | `TState` | Merged internal + controlled state |
| `columns` | `Column<TData>[]` | Final columns after `transformColumns` pipeline |
| `rowModel` | `RowModel<TData>` | Final rows (alias for `getRowModel()` result) |
| `getState()` | `() => TState` | Getter (avoids closure staleness) |
| `setState(updater)` | `(Updater<TState>) => void` | State setter (triggers pipeline re-run) |
| `getCoreRowModel()` | `() => RowModel` | Rows before plugin pipeline |
| `getRowModel()` | `() => RowModel` | Rows after pipeline (same as `rowModel`) |
| `registerPlugin(plugin)` | `void` | Dynamically add plugin |
| `unregisterPlugin(name)` | `boolean` | Remove plugin |
| `getPlugin(name)` | `PivotTablePlugin \| undefined` | Lookup plugin |
| `getAllPlugins()` | `PivotTablePlugin[]` | List all registered |

## Plugin APIs (In-Process)

Each plugin augments the table via `withX(table)`; the augmentation is an in-memory object, not an HTTP service.

### Sorting — `src/plugins/sorting.ts:14-26`

| Method | Signature |
|---|---|
| `getSorting()` | `() => SortingRule[]` |
| `getSortedColumnIds()` | `() => string[]` (memoized) |
| `getIsSorted(colId)` | `(string) => 'asc' \| 'desc' \| false` |
| `setSorting(updater)` | `(SortingRule[] \| (prev)=>SortingRule[]) => void` |
| `toggleSorting(colId, multi?)` | `(string, boolean?) => void` (cycles none → asc → desc → none) |
| `clearSorting()` | `() => void` |

`SortingRule = { id: string; desc: boolean }` — `src/types/state.ts:3-6`

### Filtering — `src/plugins/filtering.ts:15-34`

| Method | Signature |
|---|---|
| `getColumnFilters()` | `() => ColumnFilter[]` |
| `getGlobalFilter()` | `() => unknown` |
| `setColumnFilters(updater)` | `(ColumnFilter[] \| (prev)=>ColumnFilter[]) => void` |
| `setGlobalFilter(value)` | `(unknown) => void` |
| `setColumnFilter(colId, value, filterType?, operator?)` | `(string, unknown, filterType?, operator?) => void` |
| `resetColumnFilters()` | `() => void` |
| `resetGlobalFilter()` | `() => void` |
| `getFilteredColumnIds()` | `() => string[]` (memoized) |

`ColumnFilter = { id, value, filterType?: 'text'|'number'|'date'|'enum'|'boolean', operator?: ... }` — `src/types/state.ts:15-24`

### Grouping — `src/plugins/grouping.ts:16-31`

| Method | Signature |
|---|---|
| `getRowGrouping()` | `() => string[]` |
| `getColumnGrouping()` | `() => string[]` |
| `setRowGrouping(updater)` | `(string[] \| (prev)=>string[]) => void` |
| `setColumnGrouping(updater)` | `(string[] \| (prev)=>string[]) => void` |
| `toggleGroupExpanded(groupId, value?)` | `(string, boolean?) => void` |
| `getIsGroupExpanded(groupId)` | `(string) => boolean` |
| `resetGrouping()` | `() => void` |

### Pivot — `src/plugins/pivot.ts:26-40`

| Method | Signature |
|---|---|
| `getPivotResult()` | `() => PivotEngineResult<TData> \| null` |
| `getPivotColumns()` | `() => PivotColumnHeader[]` |
| `getPivotValues()` | `() => PivotValueDef<TData>[]` |
| `setPivotValues(updater)` | `(PivotValueDef[] \| (prev)=>PivotValueDef[]) => void` |
| `setPivotEnabled(enabled)` | `(boolean) => void` |
| `runServerSidePivot()` | `() => Promise<PivotEngineResult \| null>` (requires `serverAdapter`) |

### Aggregation — `src/types/aggregation.ts:28-58` + `src/plugins/aggregation/aggregators.ts`

| Method | Signature |
|---|---|
| `getColumnAggregator(colId)` | `(string) => AggregationFnName \| 'custom' \| undefined` |
| `getColumnAggregators()` | `() => Record<string, AggregationFnName \| 'custom'>` |
| `setColumnAggregator(colId, updater)` | `(string, AggregationFnName \| 'custom' \| (prev)=>...) => void` |
| `setColumnAggregators(updater)` | `(Record<string, ...> \| (prev)=>...) => void` |
| `registerFn(name, fn)` | `(string, AggregationFn) => void` |
| `unregisterFn(name)` | `(string) => void` |
| `getRegisteredFns()` | `() => Readonly<Record<string, AggregationFn>>` |
| `resetColumnAggregators()` | `() => void` |
| `getAggregatedValue(colId)` | `(string) => number \| null` |
| `getGrandTotal(colId)` | `(string) => number \| null` |
| `AggregatorDropdown` | React component (optional UI) |

`AggregationFnName = 'sum' | 'count' | 'avg' | 'min' | 'max' | 'median' | 'stddev' | 'variance' | 'pctOfTotal' | 'pctOfColumn' | 'runningTotal' | 'countDistinct'`

### Column Visibility — `src/plugins/columnVisibility.ts:9-23`

| Method | Signature |
|---|---|
| `getColumnVisibility()` | `() => Record<string, boolean>` |
| `getIsColumnVisible(colId)` | `(string) => boolean` |
| `getVisibleColumnIds()` | `() => string[]` |
| `setColumnVisibility(updater)` | `(Record<string,boolean> \| (prev)=>...) => void` |
| `toggleColumnVisibility(colId, value?)` | `(string, boolean?) => void` |
| `resetColumnVisibility()` | `() => void` |

### Column Ordering — `src/plugins/columnOrdering.ts:16-27`

| Method | Signature |
|---|---|
| `getColumnOrder()` | `() => string[]` |
| `getOrderedColumnIds()` | `() => string[]` |
| `setColumnOrder(updater)` | `(string[] \| (prev)=>string[]) => void` |
| `reorderColumn(colId, targetIndex)` | `(string, number) => void` |
| `resetColumnOrder()` | `() => void` |

### Column Pinning — `src/plugins/columnPinning.ts:23-37`

| Method | Signature |
|---|---|
| `getColumnPinning()` | `() => { left: string[]; right: string[] }` |
| `setColumnPinning(updater)` | `({left,right} \| (prev)=>...) => void` |
| `pinColumn(colId, side)` | `(string, 'left'\|'right'\|false) => void` |
| `getPinnedColumns(side)` | `('left'\|'right') => string[]` |
| `getCenterColumnIds()` | `() => string[]` |
| `resetColumnPinning()` | `() => void` |

### DnD Row — `src/plugins/dndRow.ts:11-21`

| Method | Signature |
|---|---|
| `getRowOrder()` | `() => string[]` |
| `getSortableRowIds()` | `() => string[]` |
| `setRowOrder(updater)` | `(string[] \| (prev)=>string[]) => void` |
| `reorderRows(activeId, overId)` | `(UniqueIdentifier, UniqueIdentifier) => void` |
| `handleDragEnd(event)` | `(DragEndEvent) => void` |
| `resetRowOrder()` | `() => void` |

### DnD Column — `src/plugins/dndColumn.ts:11-21`

| Method | Signature |
|---|---|
| `getColumnOrder()` | `() => string[]` |
| `getSortableColumnIds()` | `() => string[]` |
| `setColumnOrder(updater)` | `(string[] \| (prev)=>string[]) => void` |
| `reorderColumns(activeId, overId)` | `(UniqueIdentifier, UniqueIdentifier) => void` |
| `handleDragEnd(event)` | `(DragEndEvent) => void` |
| `resetColumnOrder()` | `() => void` |

## Utilities

### CSV — `src/utils/exportCSV.ts:7-144`

```ts
serializeCSV<TRecord>(options: ExportCsvOptions<TRecord>): string
exportCSV<TRecord>(options: ExportCsvOptions<TRecord>): ExportCsvResult { csv, fileName, blob, download }
// ExportCsvOptions: { rows, columns?, includeHeader?, delimiter?, lineBreak?, fileName?, quoteAllFields?, sanitizeValues? }
```

### Clipboard — `src/utils/clipboard.ts` (re-exported via `src/index.ts:9`)

```ts
copyToClipboard(options: CopyToClipboardOptions): Promise<boolean>
// CopyToClipboardOptions: { text: string }
```

### Virtualization — `src/hooks/useVirtualRows.ts:50`, `useVirtualColumns.ts:50`

```ts
useVirtualRows<TScrollElement, TItemElement>(options: UseVirtualRowsOptions): UseVirtualRowsResult { virtualizer, virtualRows, totalSize }
useVirtualColumns<TScrollElement, TItemElement>(options: UseVirtualColumnsOptions): UseVirtualColumnsResult { virtualizer, virtualColumns, totalSize }
// Options: { count, getScrollElement, estimateSize, scrollMode?, overscan?, paddingStart/End?, ... }
```

### Aggregation Fns (Legacy + Current)

```ts
// src/utils/aggregationFns.ts:23-73
legacyAggregationFns: Record<string, LegacyAggregationFn>  // count, sum, avg, min, max, median, unique, first, last
resolveAggregationFn(input?, customFns?): LegacyAggregationFn

// src/plugins/aggregation/aggregators.ts:9-191
sum, count, avg, min, max, median, stddev, variance, pctOfTotal, pctOfColumn, runningTotal, countDistinct
aggregationFns: Record<AggregationFnName, AggregationFn>
AGGREGATOR_LABELS: Record<AggregationFnName, string>
resolveAggregationFn(name, customFns, columnId): AggregationFn | null
```

## Pivot Engine (Pure Function)

**Location:** `src/core/pivotEngine.ts:9-242`

```ts
createPivotEngineResult<TData>(options: PivotEngineOptions<TData>): PivotEngineResult<TData>
// PivotEngineOptions: { data, rowGroupBy: PivotGroupByDef[], columnGroupBy: PivotGroupByDef[], values: PivotValueDef[], aggregationFns? }
// PivotEngineResult: { rowTree, rowHeaders, columnHeaders, matrix, matrixByRowKey, grandTotals }
// PivotServerAdapter: { execute(request: PivotEngineRequest): Promise<PivotEngineResult> }
```

## Store (Internal, also public via subpath)

**Location:** `src/store/pivotTableStore.ts:31`, `src/store/pluginRegistry.ts:20`

```ts
createPivotTableStore<TState>(initialState: TState): StoreApi<PivotTableStore<TState>>
// PivotTableStore: { state, setState(updater), resetState(nextState) }

createPluginRegistry<TState>(): PluginRegistry<TState>
// PluginRegistry: { register(plugin, manifest), unregister(name), getPlugin(name), getManifest(name), getAll(), getAllManifests(), hasConflict(name) }
DEFAULT_MANIFESTS: Record<string, PluginManifest>
```

## UI → Service → Endpoint Mapping

Since no HTTP endpoints exist, the mapping is **UI → Hook/Plugin API → In-Memory State/Mutation**.

| UI Concern | Hook/Plugin API | State Key / Mutation |
|---|---|---|
| Render table | `usePivotTable` → `table.columns`, `table.getRowModel()` | `columns`, `RowModel` |
| Sort header click | `table.sorting.toggleSorting(colId, multi)` | `sorting: SortingRule[]` |
| Filter input | `table.filtering.setColumnFilter(colId, value, type, op)` | `filters: ColumnFilter[]` |
| Global search | `table.filtering.setGlobalFilter(value)` | `globalFilter: unknown` |
| Group rows | `table.grouping.setRowGrouping([...])` | `rowGrouping: string[]` |
| Expand/collapse group | `table.grouping.toggleGroupExpanded(groupId)` | `expandedGroups: Record<string, boolean>` |
| Pivot matrix | `table.pivot.setPivotValues([...])`, `setPivotEnabled(true)` | `pivotValues`, `pivotEnabled`, `rowGrouping`, `columnGrouping` |
| Server pivot | `table.pivot.runServerSidePivot()` | `PivotServerAdapter.execute(request)` |
| Aggregation select | `table.aggregation.setColumnAggregator(colId, 'sum')` | `columnAggregators: Record<string, AggregationFnName>` |
| Hide column | `table.columnVisibility.toggleColumnVisibility(colId)` | `columnVisibility: Record<string, boolean>` |
| Reorder columns | `table.columnOrdering.reorderColumn(colId, idx)` / `dndColumn.handleDragEnd` | `columnOrder: string[]` |
| Pin column | `table.columnPinning.pinColumn(colId, 'left'|'right')` | `columnPinning: {left,right}` |
| Drag row | `table.dndRow.handleDragEnd(event)` | `rowOrder: string[]` |
| Virtualize | `useVirtualRows({ count: table.getRowModel().rows.length, ... })` | `@tanstack/virtual-core` Virtualizer |
| Export | `exportCSV({ rows, columns })` | pure function, returns `{csv, blob, download}` |
| Copy | `copyToClipboard({ text })` | `navigator.clipboard` |

## Request / Response Models

No HTTP request/response models exist.

**In-memory data models:**

- `ColumnDef<TData, TValue>` / `Column<TData>` — `src/types/column.ts:3-19`
- `Row<TData>` / `RowModel<TData>` — `src/types/row.ts:9-22`
- `TableState` — `src/types/state.ts:26-32` (`sorting`, `filters`, `columnVisibility`, `rowSelection`, `expanded`)
- Extended states per plugin (see plugin sections above)
- `PivotEngineOptions` / `PivotEngineResult` / `PivotEngineRequest` — `src/core/pivotEngine.ts:9-54`

## Evidence Sources

- `src/index.ts`
- `src/types/table.ts`, `column.ts`, `row.ts`, `state.ts`, `plugin.ts`, `aggregation.ts`
- `src/core/usePivotTable.ts`, `pivotEngine.ts`
- `src/plugins/sorting.ts`, `filtering.ts`, `grouping.ts`, `pivot.ts`, `aggregation/*`, `columnVisibility.ts`, `columnOrdering.ts`, `columnPinning.ts`, `dndRow.ts`, `dndColumn.ts`
- `src/hooks/useVirtualRows.ts`, `useVirtualColumns.ts`
- `src/utils/exportCSV.ts`, `clipboard.ts`, `aggregationFns.ts`
- `src/store/pivotTableStore.ts`, `pluginRegistry.ts`
- `package.json` (exports)
- `tsup.config.ts`
