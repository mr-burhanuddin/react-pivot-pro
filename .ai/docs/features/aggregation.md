# Feature: Aggregation

## Purpose

Row-level aggregation — inserts subtotal rows and a grand total row, and annotates columns with aggregator metadata. Supports 12 built-in functions plus custom registered functions.

## Entry Points

- **Plugin factory:** `createAggregationPlugin(options?)` — `src/plugins/aggregation/aggregationPlugin.ts:144`
- **API factory:** `createAggregationApi(table)` — `src/plugins/aggregation/aggregationApi.ts` (re-exported via `src/plugins/aggregation/index.ts`)
- **Wrapper:** `withAggregation(table)` — `src/plugins/aggregation/index.ts`
- **Hook:** `usePivotAggregation(table)` — `src/plugins/aggregation/index.ts`
- **UI helper:** `AggregatorDropdown` — `src/plugins/aggregation/AggregatorDropdown.tsx`
- **Functions:** `sum, count, avg, min, max, median, stddev, variance, pctOfTotal, pctOfColumn, runningTotal, countDistinct`, `aggregationFns`, `AGGREGATOR_LABELS` — `src/plugins/aggregation/aggregators.ts:9-191`
- **Re-export:** `src/index.ts:48-77`

## Components

- `AggregatorDropdown` — React component for per-column aggregator selection (optional).

## Hooks

- `usePivotAggregation(table)` returns `AggregationApi`.

## Services

No HTTP services.

## State

**Extended state:** `AggregationState { columnAggregators: Record<string, AggregationFnName | 'custom'> }` — `src/types/aggregation.ts:22-24`

`AggregationTableState = TableState & AggregationState` — `src/types/aggregation.ts:26`

`AggregationFnName = 'sum' | 'count' | 'avg' | 'min' | 'max' | 'median' | 'stddev' | 'variance' | 'pctOfTotal' | 'pctOfColumn' | 'runningTotal' | 'countDistinct'` — `src/types/aggregation.ts:4-16`

- Default: `columnAggregators: {}` or `{ [col]: defaultAggregator }` for each `autoAggregateColumns` — `src/plugins/aggregation/aggregationPlugin.ts:159-169`
- Options: `AggregationPluginOptions { defaultAggregator?, autoAggregateColumns?, workerThreshold? }` — `src/types/aggregation.ts:67-71` (note: `workerThreshold` is defined but not observed in use)
- Cache: `cache: { rows, result, columnAggregators: string }` serialized via `JSON.stringify` — `src/plugins/aggregation/aggregationPlugin.ts:13-22`, `151-155`, `175-182`

**Built-in functions** (`src/plugins/aggregation/aggregators.ts:9-176`):

| Name | Behavior | Null handling |
|---|---|---|
| `sum` | Sum | skips null/NaN |
| `count` | `values.length` | counts all |
| `avg` | Mean | skips null/NaN |
| `min` | Minimum | skips null/NaN |
| `max` | Maximum | skips null/NaN |
| `median` | Median (sorted copy) | skips null/NaN |
| `stddev` | Sample stddev (sqrt variance) | skips null/NaN, null if n<=1 |
| `variance` | Sample variance | skips null/NaN, null if n<=1 |
| `pctOfTotal` | Sum (placeholder) | skips null/NaN |
| `pctOfColumn` | Returns 100 (placeholder) | — |
| `runningTotal` | Cumulative sum (returns last) | skips null/NaN |
| `countDistinct` | Distinct non-null count | skips null/undefined |

## API (`AggregationApi` — `src/types/aggregation.ts:28-58`)

| Method | Description |
|---|---|
| `getColumnAggregator(colId)` | `AggregationFnName \| 'custom' \| undefined` |
| `getColumnAggregators()` | Full record |
| `setColumnAggregator(colId, updater)` | Set per-column |
| `setColumnAggregators(updater)` | Bulk set |
| `registerFn(name, fn)` | Register custom `AggregationFn` (per-column via `columnId` key) |
| `unregisterFn(name)` | Remove custom fn |
| `getRegisteredFns()` | `Readonly<Record<string, AggregationFn>>` |
| `resetColumnAggregators()` | Clear to `{}` |
| `getAggregatedValue(colId)` | Aggregated value for column |
| `getGrandTotal(colId)` | Grand total for column |

**Transforms:**
- `transformRows` (`src/plugins/aggregation/aggregationPlugin.ts:171-198`): if no aggregators → passthrough; else `applyAggregations` → `computeSubtotals` (groups by `row.values._groupKey`) + `computeGrandTotals` appends `id: 'grandTotal'` — `src/plugins/aggregation/aggregationPlugin.ts:25-142`
- `transformColumns` (`src/plugins/aggregation/aggregationPlugin.ts:199-221`): annotates each column with `meta: { aggregator, aggregatorLabel }`.

**Dependencies:**

- `src/types/aggregation.ts`
- `src/plugins/aggregation/aggregators.ts` (`resolveAggregationFn`)
- Custom fns stored in `customFnsRef` closure — `src/plugins/aggregation/aggregationPlugin.ts:150`

## Evidence Sources

- `src/types/aggregation.ts`
- `src/plugins/aggregation/aggregationPlugin.ts`, `aggregators.ts`, `aggregationApi.ts`, `index.ts`, `AggregatorDropdown.tsx`
- `src/utils/accessorHelpers.ts` (not directly)
