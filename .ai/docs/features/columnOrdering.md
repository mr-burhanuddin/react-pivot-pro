# Feature: Column Ordering

## Purpose

Explicit column ordering — reorders `table.columns` via `columnOrder: string[]` state.

## Entry Points

- **Plugin factory:** `createColumnOrderingPlugin()` — `src/plugins/columnOrdering.ts:36`
- **API factory:** `createColumnOrderingApi(table)` — `src/plugins/columnOrdering.ts:81`
- **Wrapper:** `withColumnOrdering(table)` — `src/plugins/columnOrdering.ts:150`
- **Re-export:** `src/index.ts:36`

## Components

- None.

## State

`ColumnOrderingState { columnOrder: string[] }` — `src/plugins/columnOrdering.ts:10-12`

`ColumnOrderingTableState = TableState & ColumnOrderingState` — `src/plugins/columnOrdering.ts:14`

- Default: `unique(state.columnOrder ?? [])` — `src/plugins/columnOrdering.ts:42-44`
- Conflict: shares `columnOrder` key with `dndColumn` — `src/store/pluginRegistry.ts:119-173` declares mutual `conflictsWith`.

**Transform:** `transformColumns` (`src/plugins/columnOrdering.ts:46-77`):
- If empty → passthrough.
- Else partitions: `orderedColumns` (ids in `columnOrder` that exist) then `remaining` (rest in original order).

## API (`ColumnOrderingApi` — `src/plugins/columnOrdering.ts:16-27`)

| Method | Description |
|---|---|
| `getColumnOrder()` | `unique(columnOrder)` |
| `getOrderedColumnIds()` | Normalized order (known in `table.columns` first, then remainder) |
| `setColumnOrder(updater)` | `string[] \| (prev)=>string[]` (deduplicated) |
| `reorderColumn(colId, targetIndex)` | Move column to index (bounded) |
| `resetColumnOrder()` | Clear to `[]` |

## Dependencies

- `src/utils/helpers.ts` (`unique`, `reorderByIds`)

## Evidence Sources

- `src/plugins/columnOrdering.ts`
- `src/utils/helpers.ts`
- `src/store/pluginRegistry.ts:150-155`, `163-173`
