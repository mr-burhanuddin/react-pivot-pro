# Feature: Sorting

## Purpose

Multi-column sorting. Sorts rows by one or more columns with ascending/descending toggle, using an `Int32Array` index sort for performance (avoids object creation during comparison).

## Entry Points

- **Plugin factory:** `createSortingPlugin(options?)` — `src/plugins/sorting.ts:74`
- **API factory:** `createSortingApi(table, options?)` — `src/plugins/sorting.ts:168`
- **Wrapper:** `withSorting(table, options?)` — `src/plugins/sorting.ts:258`
- **Hook:** `useSorting(table)` — `src/plugins/sorting.ts:161` (alias for `createSortingApi`)
- **Re-export:** `src/index.ts:21`

## Components

- None (headless).

## Hooks

- `useSorting(table)` returns `SortingApi`.

## Services

No HTTP services.

## State

**Extended state:** `SortingTableState extends TableState { sorting: SortingRule[] }` — `src/plugins/sorting.ts:10-12`

`SortingRule = { id: string; desc: boolean }` — `src/types/state.ts:3-6`

- Default: `[]` (no sort) — `src/plugins/sorting.ts:88-91`
- Ordering: `sorting` array order = sort priority (first entry = primary sort).
- Cache: internal `cache: { rows, sorting, result }` with `areSortingRulesEqual` equality — `src/plugins/sorting.ts:39-84`

**Options:** `SortingPluginOptions { isMultiSortEvent?: (multi: boolean|undefined) => boolean }` — `src/plugins/sorting.ts:35-37` (default `Boolean(multi)`)

## API (`SortingApi` — `src/plugins/sorting.ts:14-26`)

| Method | Description |
|---|---|
| `getSorting()` | Current `SortingRule[]` |
| `getSortedColumnIds()` | Column IDs in sort order (memoized on reference) |
| `getIsSorted(colId)` | `'asc' \| 'desc' \| false` for a column |
| `setSorting(updater)` | Set sorting via value or `(prev)=>next` |
| `toggleSorting(colId, multi?)` | Cycle none → asc → desc → none (or remove). `multi=true` keeps other sorts. |
| `clearSorting()` | Reset to `[]` |

**Transform:** `transformRows` pre-extracts column values into `sortValues[colIdx][rowIdx]` then sorts an `Int32Array` of indices — `src/plugins/sorting.ts:92-141`.

**Side effect:** `onStateChange` auto-removes rules for columns that no longer exist — `src/plugins/sorting.ts:142-157`.

## Dependencies

- `src/types/state.ts` (`SortingRule`)
- `src/utils/helpers.ts` (none directly, but internal `comparePrimitives`, `areSortingRulesEqual`)

## Evidence Sources

- `src/plugins/sorting.ts`
- `src/types/state.ts:3-6`
- `src/core/pivotEngine.ts` (not used by sorting — sorting is column-value based)
