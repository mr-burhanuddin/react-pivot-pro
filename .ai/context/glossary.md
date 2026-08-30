# Glossary

| Term | Definition | Evidence |
|---|---|---|
| `RowData` | `Record<string, unknown>` — generic constraint for all data rows | `src/types/table.ts:6` |
| `ColumnDef` | Consumer-provided column definition `{id?, accessorKey?, accessorFn?, header?, meta?, enableSorting?, enableFiltering?, cell?, width?, pivot?}` | `src/types/column.ts:3-14` |
| `Column` | Normalized `ColumnDef` with guaranteed `id: string` | `src/types/column.ts:16-19`, `src/core/usePivotTable.ts:39-72` |
| `Row` | `{ id, index, original, values, getValue(colId), meta? }` | `src/types/row.ts:9-16` |
| `RowModel` | `{ rows, flatRows, rowsById }` | `src/types/row.ts:18-22` |
| `TableState` | Base state `{ sorting, filters, columnVisibility, rowSelection, expanded }` | `src/types/state.ts:26-32` |
| `PivotTableInstance` | Return of `usePivotTable`: `{ state, columns, rowModel, getState, setState, getCoreRowModel, getRowModel, registerPlugin, unregisterPlugin, getPlugin, getAllPlugins }` | `src/types/table.ts:22-37` |
| `PivotTablePlugin` | Feature plugin `{ name, getInitialState?, transformRows?, transformColumns?, onStateChange? }` | `src/types/plugin.ts:17-36` |
| `PivotTablePluginContext` | Plugin context `{ columns, data, state, setState, getColumnById }` | `src/types/plugin.ts:6-15` |
| `Updater` | `T \| ((prev:T)=>T)` — functional update pattern | `src/types/state.ts:1` |
| `SortingRule` | `{ id, desc }` | `src/types/state.ts:3-6` |
| `ColumnFilter` | `{ id, value, filterType?, operator? }` | `src/types/state.ts:15-24` |
| `PivotEngineResult` | `{ rowTree, rowHeaders, columnHeaders, matrix, matrixByRowKey, grandTotals }` | `src/core/pivotEngine.ts:41-48` |
| `PivotServerAdapter` | `{ execute(request): Promise<PivotEngineResult> }` | `src/core/pivotEngine.ts:56-58` |
| `AggregationFnName` | 12-name union: `sum\|count\|avg\|min\|max\|median\|stddev\|variance\|pctOfTotal\|pctOfColumn\|runningTotal\|countDistinct` | `src/types/aggregation.ts:4-16` |
| `AggregationState` | `{ columnAggregators: Record<string, AggregationFnName\|'custom'> }` | `src/types/aggregation.ts:22-24` |
| `PivotTableStore` | Zustand store `{ state, setState, resetState }` | `src/store/pivotTableStore.ts:5-9` |
| `PluginRegistry` | Conflict-aware registry `{ register, unregister, getPlugin, hasConflict }` | `src/store/pluginRegistry.ts:10-18` |
| `PinSide` | `'left' \| 'right' \| false` | `src/plugins/columnPinning.ts:21` |
| `Headless` | Library manages state/transforms, not rendering | `package.json:4`, `src/index.ts` (no UI exports) |

## Evidence Sources

- `src/types/*.ts`, `src/core/pivotEngine.ts`, `src/store/*`, `src/plugins/*`
