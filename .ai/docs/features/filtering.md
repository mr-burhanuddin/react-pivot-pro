# Feature: Filtering

## Purpose

Column and global filtering with typed operators. Supports text, number, date, enum, and boolean filter types with rich operators.

## Entry Points

- **Plugin factory:** `createFilteringPlugin(options?)` — `src/plugins/filtering.ts:292`
- **API factory:** `createFilteringApi(table)` — `src/plugins/filtering.ts:412`
- **Wrapper:** `withFiltering(table)` — `src/plugins/filtering.ts:484`
- **Hook:** `useFiltering(table)` — `src/plugins/filtering.ts:405`
- **Re-export:** `src/index.ts:24`

## Components

- None (headless).

## Hooks

- `useFiltering(table)` returns `FilteringApi`.

## Services

No HTTP services.

## State

**Extended state:** `FilteringTableState extends TableState { filters: ColumnFilter[]; globalFilter?: unknown }` — `src/plugins/filtering.ts:10-13`

`ColumnFilter = { id, value, filterType?: 'text'|'number'|'date'|'enum'|'boolean', operator?: ... }` — `src/types/state.ts:15-24`

Filter types/operators:

| Type | Operators | Evidence |
|---|---|---|
| `text` | `contains` (default), `startsWith`, `endsWith`, `equals`, `notEquals` | `src/plugins/filtering.ts:95-120`, `243` |
| `number` | `eq` (default), `neq`, `gt`, `gte`, `lt`, `lte`, `between` | `src/plugins/filtering.ts:123-164`, `248-249` |
| `date` | `eq` (default), `neq`, `gt`, `gte`, `lt`, `lte`, `between` | `src/plugins/filtering.ts:167-211`, `250-251` |
| `enum` | `in` (default), `notIn` (array value) | `src/plugins/filtering.ts:214-234`, `252-253` |
| `boolean` | exact match | `src/plugins/filtering.ts:237-241`, `254-255` |

- Cache: `cache: { rows, filterableIds, filters, globalFilter, result }` — `src/plugins/filtering.ts:299-305`; invalidates when any part changes.

**Options:** `FilteringPluginOptions { rowFilterFn?, globalFilterFn? }` — `src/plugins/filtering.ts:50-53` (defaults to case-insensitive substring match).

## API (`FilteringApi` — `src/plugins/filtering.ts:15-34`)

| Method | Description |
|---|---|
| `getColumnFilters()` | Current `ColumnFilter[]` |
| `getGlobalFilter()` | Current global filter value |
| `setColumnFilters(updater)` | Replace all filters |
| `setGlobalFilter(value)` | Set global filter |
| `setColumnFilter(colId, value, filterType?, operator?)` | Upsert single column filter (removes if value null/empty) |
| `resetColumnFilters()` | Clear `filters` |
| `resetGlobalFilter()` | Clear `globalFilter` |
| `getFilteredColumnIds()` | Column IDs with active filters (memoized) |

**Transform:** `transformRows` filters rows sequentially: column filters via `applyColumnFilter` dispatch, then global filter via `globalFilterFn` — `src/plugins/filtering.ts:314-376`. Respects `column.enableFiltering !== false`.

**Side effect:** `onStateChange` auto-removes filters for non-existent columns — `src/plugins/filtering.ts:377-401`.

## Dependencies

- `src/types/state.ts` (`ColumnFilter`)
- `src/utils/accessorHelpers.ts` (indirect via row values)
- `src/types/row.ts` (`Row`) for `globalFilterFn` signature

## Evidence Sources

- `src/plugins/filtering.ts`
- `src/types/state.ts:15-24`
- `src/core/usePivotTable.ts`
