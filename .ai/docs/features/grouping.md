# Feature: Grouping

## Purpose

Hierarchical row grouping (multi-level) with expand/collapse. Groups rows by one or more column values into a tree, then flattens with group header rows.

## Entry Points

- **Plugin factory:** `createGroupingPlugin()` — `src/plugins/grouping.ts:163`
- **API factory:** `createGroupingApi(table)` — `src/plugins/grouping.ts:269`
- **Wrapper:** `withGrouping(table)` — `src/plugins/grouping.ts:318`
- **Hook:** `useGrouping(table)` — `src/plugins/grouping.ts:329`
- **Re-export:** `src/index.ts:27`

## Components

- None (headless).

## Hooks

- `useGrouping(table)` returns `GroupingApi`.

## Services

No HTTP services.

## State

**Extended state:** `GroupingTableState extends TableState { rowGrouping: string[]; columnGrouping: string[]; expandedGroups: Record<string, boolean> }` — `src/plugins/grouping.ts:10-14`

- Default: `rowGrouping: []`, `columnGrouping: []`, `expandedGroups: {}` — `src/plugins/grouping.ts:176-181`
- `columnGrouping` is state-only (not used by row grouping transform) — reserved for pivot coexistence; conflict with `pivot` plugin (`src/store/pluginRegistry.ts:138-143`).
- Cache: `cache: { rows, grouping, expanded, result }` with `areArraysEqual` / `areExpandedMapsEqual` — `src/plugins/grouping.ts:49-66`, `167-172`

**Internals:**
- `buildGroupedTree(rows, grouping, depth, parentPath)` — recursively buckets rows by `row.values[columnId]` — `src/plugins/grouping.ts:68-109`
- `flattenGroupedRows(nodes, grouping, expandedGroups)` — walks tree, emits group header rows (`index: -1`, `original: {}`) then either children or leaf rows depending on `expandedGroups[id] !== false` (default expanded) — `src/plugins/grouping.ts:111-161`

Group row `values` includes: `__group: true`, `__depth`, `__groupingColumnId`, `__groupingValue`, `__rowCount`, plus cloned `firstRow.values` — `src/plugins/grouping.ts:123-132`.

## API (`GroupingApi` — `src/plugins/grouping.ts:16-31`)

| Method | Description |
|---|---|
| `getRowGrouping()` | `string[]` |
| `getColumnGrouping()` | `string[]` |
| `setRowGrouping(updater)` | `string[] \| (prev)=>string[]` |
| `setColumnGrouping(updater)` | `string[] \| (prev)=>string[]` |
| `toggleGroupExpanded(groupId, value?)` | Toggle or set `expandedGroups[groupId]` |
| `getIsGroupExpanded(groupId)` | `expandedGroups[id] !== false` |
| `resetGrouping()` | Clears all three keys |

**Side effect:** `onStateChange` auto-removes grouping for non-existent columns — `src/plugins/grouping.ts:231-265`.

## Dependencies

- `src/utils/helpers.ts` (`areArraysEqual`)
- `src/types/plugin.ts` (`PivotTablePlugin`)

## Evidence Sources

- `src/plugins/grouping.ts`
- `src/store/pluginRegistry.ts:132-137`, `138-143` (conflict with pivot)
