# Feature: Column Visibility

## Purpose

Show/hide columns via boolean map in state. Filtering is not yet implemented as a `transformColumns` (visibility is API-only, consumer filters columns via `getVisibleColumnIds` or similar).

## Entry Points

- **Plugin factory:** `createColumnVisibilityPlugin()` — `src/plugins/columnVisibility.ts:32`
- **API factory:** `createColumnVisibilityApi(table)` — `src/plugins/columnVisibility.ts:45`
- **Wrapper:** `withColumnVisibility(table)` — `src/plugins/columnVisibility.ts:98`
- **Re-export:** `src/index.ts:33`

No `useColumnVisibility` hook — use `createColumnVisibilityApi`.

## Components

- None.

## State

`ColumnVisibilityState { columnVisibility: Record<string, boolean> }` — `src/plugins/columnVisibility.ts:3-5`

`ColumnVisibilityTableState = TableState & ColumnVisibilityState` — `src/plugins/columnVisibility.ts:7`

- Default: `{}` — `src/plugins/columnVisibility.ts:37-42`
- Semantics: `columnVisibility[colId] !== false` → visible; missing key = visible — `src/plugins/columnVisibility.ts:56`

**Note:** This plugin has **no `transformColumns`** — it does not hide columns in `table.columns`. Consumers use `getIsColumnVisible` / `getVisibleColumnIds` to filter rendering. If automatic hiding is needed, consumer must filter `table.columns` manually.

## API (`ColumnVisibilityApi` — `src/plugins/columnVisibility.ts:9-23`)

| Method | Description |
|---|---|
| `getColumnVisibility()` | Full visibility map |
| `getIsColumnVisible(colId)` | `visibility[colId] !== false` |
| `getVisibleColumnIds()` | Visible IDs derived from `table.columns` |
| `setColumnVisibility(updater)` | `Record<string,boolean> \| (prev)=>...` |
| `toggleColumnVisibility(colId, value?)` | Toggle or set explicit value |
| `resetColumnVisibility()` | Clear to `{}` |

## Dependencies

- `src/types/table.ts` (`TableState`)

## Evidence Sources

- `src/plugins/columnVisibility.ts`
- `src/types/state.ts`
