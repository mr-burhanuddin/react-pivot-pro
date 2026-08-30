# Feature: DnD Row

## Purpose

Drag-and-drop row reordering via `@dnd-kit/core`. State is `rowOrder: string[]` — `transformRows` reorders by that list.

## Entry Points

- **Plugin factory:** `createDndRowPlugin()` — `src/plugins/dndRow.ts:30`
- **API factory:** `createDndRowApi(table)` — `src/plugins/dndRow.ts:72`
- **Wrapper:** `withDndRow(table)` — `src/plugins/dndRow.ts:140`
- **Hook:** `useDndRow(table)` — `src/plugins/dndRow.ts:149`
- **Re-export:** `src/index.ts:42`

## Components

- None — DnD context/sensors are consumer-owned; plugin only handles state + drag end logic.

## State

`DndRowState { rowOrder: string[] }` — `src/plugins/dndRow.ts:5-7`

`DndRowTableState = TableState & DndRowState` — `src/plugins/dndRow.ts:9`

- Default: `unique(state.rowOrder ?? [])` — `src/plugins/dndRow.ts:39-43`
- Cache: `lastRowsRef`, `lastOrderRef`, `lastResultRef` — `src/plugins/dndRow.ts:34-36`

**Transform:** `transformRows` (`src/plugins/dndRow.ts:44-68`) — if empty → passthrough; else `reorderByIds(rows, rowOrder)` — `src/utils/helpers.ts:26-46`.

## API (`DndRowApi` — `src/plugins/dndRow.ts:11-21`)

| Method | Description |
|---|---|
| `getRowOrder()` | Normalized `rowOrder` (known ids first) |
| `getSortableRowIds()` | All row IDs from `table.getCoreRowModel().rows` |
| `setRowOrder(updater)` | `string[] \| (prev)=>...` |
| `reorderRows(activeId, overId)` | Move via `move(currentOrder, fromIdx, toIdx)` |
| `handleDragEnd(event: DragEndEvent)` | Calls `reorderRows(active.id, over.id)` if `over` exists |
| `resetRowOrder()` | Clear to `[]` |

**Consumer pattern:**

```ts
import { DndContext } from '@dnd-kit/core';
<DndContext onDragEnd={table.dndRow.handleDragEnd}>...</DndContext>
```

## Dependencies

- `@dnd-kit/core` types (`DragEndEvent`, `UniqueIdentifier`) — `src/plugins/dndRow.ts:1`
- `src/utils/helpers.ts` (`unique`, `move`, `reorderByIds`)

## Evidence Sources

- `src/plugins/dndRow.ts`
- `src/utils/helpers.ts`
- `package.json:97`
