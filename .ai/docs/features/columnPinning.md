# Feature: Column Pinning

## Purpose

Freeze columns to left or right. Reorders `table.columns` as `[leftPinned..., center..., rightPinned...]` and annotates pinned columns with `meta.pinned`.

## Entry Points

- **Plugin factory:** `createColumnPinningPlugin()` — `src/plugins/columnPinning.ts:56`
- **API factory:** `createColumnPinningApi(table)` — `src/plugins/columnPinning.ts:102`
- **Wrapper:** `withColumnPinning(table)` — `src/plugins/columnPinning.ts:160`
- **Re-export:** `src/index.ts:39`

## Components

- None.

## State

`ColumnPinningState { columnPinning: { left: string[], right: string[] } }` — `src/plugins/columnPinning.ts:10-16`

`ColumnPinningTableState = TableState & ColumnPinningState` — `src/plugins/columnPinning.ts:19`

`PinSide = 'left' | 'right' | false` — `src/plugins/columnPinning.ts:21`

- Default: `normalizePinning(state.columnPinning)` where left is `unique`, right is `unique` minus ids already in left — `src/plugins/columnPinning.ts:46-54`
- If both empty → passthrough.

**Transform:** `transformColumns` (`src/plugins/columnPinning.ts:66-98`):
- Iterates columns, buckets into `leftColumns` / `centerColumns` / `rightColumns`.
- Pinned columns cloned with `meta: { ...col.meta, pinned: 'left' | 'right' }`.
- Returns `[...left, ...center, ...right]`.

## API (`ColumnPinningApi` — `src/plugins/columnPinning.ts:23-37`)

| Method | Description |
|---|---|
| `getColumnPinning()` | Normalized `{left,right}` |
| `setColumnPinning(updater)` | `{left,right} \| (prev)=>...` |
| `pinColumn(colId, side)` | Move column to `side` (`false` = unpin) |
| `getPinnedColumns(side)` | `string[]` for `side` |
| `getCenterColumnIds()` | Center IDs (not in left or right) |
| `resetColumnPinning()` | Clear to `{left:[], right:[]}` |

## Dependencies

- `src/utils/helpers.ts` (`unique`)
- `src/types/column.ts` (`Column` meta)

## Evidence Sources

- `src/plugins/columnPinning.ts`
