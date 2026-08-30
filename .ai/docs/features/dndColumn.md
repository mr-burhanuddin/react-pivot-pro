# Feature: DnD Column

## Purpose

Drag-and-drop column reordering via `@dnd-kit/core`. Analogous to DnD Row but for columns; shares `columnOrder` state key with `columnOrdering`.

## Entry Points

- **Plugin factory:** `createDndColumnPlugin()` — `src/plugins/dndColumn.ts:30`
- **API factory:** `createDndColumnApi(table)` — `src/plugins/dndColumn.ts:72`
- **Wrapper:** `withDndColumn(table)` — `src/plugins/dndColumn.ts:140`
- **Hook:** `useDndColumn(table)` — `src/plugins/dndColumn.ts:149`
- **Re-export:** `src/index.ts:45`

## Components

- None — DnD context is consumer-owned.

## State

`DndColumnState { columnOrder: string[] }` — `src/plugins/dndColumn.ts:5-7`

`DndColumnTableState = TableState & DndColumnState` — `src/plugins/dndColumn.ts:9`

- Default: `unique(state.columnOrder ?? [])` — `src/plugins/dndColumn.ts:39-43`
- Shares `columnOrder` with `columnOrdering` — mutual `conflictsWith` in `src/store/pluginRegistry.ts:150-173`.

**Transform:** `transformColumns` (`src/plugins/dndColumn.ts:44-68`) — cached by `lastColumnsRef`/`lastOrderRef`; `reorderByIds(columns, columnOrder)`.

## API (`DndColumnApi` — `src/plugins/dndColumn.ts:11-21`)

| Method | Description |
|---|---|
| `getColumnOrder()` | Normalized order |
| `getSortableColumnIds()` | `table.columns.map(c=>c.id)` |
| `setColumnOrder(updater)` | `string[] \| (prev)=>...` |
| `reorderColumns(activeId, overId)` | Move via `move` helper (guarded: `over` must exist, ids must be distinct) |
| `handleDragEnd(event: DragEndEvent)` | Calls `reorderColumns` |
| `resetColumnOrder()` | Clear to `[]` |

## Dependencies

- `@dnd-kit/core`
- `src/utils/helpers.ts` (`unique`, `move`, `reorderByIds`)

## Evidence Sources

- `src/plugins/dndColumn.ts`
- `src/store/pluginRegistry.ts:150-173`
- `src/utils/helpers.ts`
