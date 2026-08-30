# Feature: Pivot

## Purpose

Pivot matrix generation — classifies rows by row/column group-bys and aggregates value buckets into a matrix. Supports client-side execution via pivot engine and server-side via adapter.

## Entry Points

- **Plugin factory:** `createPivotPlugin(options?)` — `src/plugins/pivot.ts:95`
- **API factory:** `createPivotApi(table, options?)` — `src/plugins/pivot.ts:191`
- **Wrapper:** `withPivot(table, options?)` — `src/plugins/pivot.ts:284`
- **Hook:** `usePivot(table, options?)` — `src/plugins/pivot.ts:296`
- **Engine:** `createPivotEngineResult(options)` — `src/core/pivotEngine.ts:160`
- **Re-export:** `src/index.ts:30`

## Components

- None (headless).

## Hooks

- `usePivot(table, options?)` returns `PivotApi`.

## Services

- **PivotEngine (pure function):** `src/core/pivotEngine.ts:160-242` — stateless matrix builder, usable client or server.
- **PivotServerAdapter (interface):** `src/core/pivotEngine.ts:56-58` `{ execute(request): Promise<PivotEngineResult> }` — consumer-provided, called by `pivot.runServerSidePivot()`.

## State

**Extended state:** `PivotTableState extends TableState { rowGrouping: string[]; columnGrouping: string[]; pivotValues: PivotValueDef[]; pivotEnabled: boolean }` — `src/plugins/pivot.ts:19-24`

- Defaults: `rowGrouping: []`, `columnGrouping: []`, `pivotValues: options.defaultValues ?? []`, `pivotEnabled: false` — `src/plugins/pivot.ts:108-117`
- Shares `rowGrouping`/`columnGrouping` keys with `grouping` plugin — `createPluginRegistry` declares `conflictsWith: ['grouping']` — `src/store/pluginRegistry.ts:138-143`

**Types:**
- `PivotGroupByDef { id, accessor? }` — `src/core/pivotEngine.ts:9-12`
- `PivotValueDef { id, accessor?, aggregation? }` — `src/core/pivotEngine.ts:14-18` (`aggregation` is `AggregationInput = key | fn`)
- `PivotEngineResult { rowTree, rowHeaders, columnHeaders, matrix, matrixByRowKey, grandTotals }` — `src/core/pivotEngine.ts:41-48`

**Cache:** closure variables `lastRowsRef`, `lastRowGroupingRef`, `lastColumnGroupingRef`, `lastPivotValuesRef`, `lastResultRef` + array equality checks — `src/plugins/pivot.ts:101-104`. Also `lastRequestCache`/`lastCoreRowsRef` inside `createPivotApi` for `getPivotResult`.

## API (`PivotApi` — `src/plugins/pivot.ts:26-40`)

| Method | Description |
|---|---|
| `getPivotResult()` | `PivotEngineResult \| null` (cached, returns null if `pivotEnabled=false` or `values` empty) |
| `getPivotColumns()` | `PivotColumnHeader[]` (`result.columnHeaders`) |
| `getPivotValues()` | Current `PivotValueDef[]` |
| `setPivotValues(updater)` | `PivotValueDef[] \| (prev)=>...` |
| `setPivotEnabled(bool)` | Toggle pivot mode |
| `runServerSidePivot()` | `Promise<PivotEngineResult \| null>` via `options.serverAdapter.execute(request)` |

**Transform:** `transformRows` (`src/plugins/pivot.ts:118-187`):
- If `!pivotEnabled || !clientSide || values.length===0` → passthrough.
- Else calls `createPivotEngineResult({ data: rows.map(r=>r.original), rowGroupBy, columnGroupBy, values })` and maps `rowHeaders` to `Row` objects with `id: pivot::${rowKey}`, `values: { __pivot: true, __rowKey, ...matrixByRowKey }`.

## Dependencies

- `src/core/pivotEngine.ts` (engine + types)
- `src/utils/aggregationFns.ts` (`resolveAggregationFn`)
- `src/store/pluginRegistry.ts` (conflict manifest)

## Evidence Sources

- `src/plugins/pivot.ts`
- `src/core/pivotEngine.ts`
- `src/store/pluginRegistry.ts:138-143`
