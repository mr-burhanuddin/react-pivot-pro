# `usePivotTable` API

Headless hook for table state, row-model generation, and plugin execution.

## Signature

```ts
function usePivotTable<
  TData extends RowData,
  TState extends TableState = TableState
>(options: PivotTableOptions<TData, TState>): PivotTableInstance<TData, TState>
```

## Core Types

| Type | Definition |
|---|---|
| `RowData` | `Record<string, unknown>` |
| `Updater<T>` | `T \| ((previous: T) => T)` |
| `TableState` | `{ sorting; filters; columnVisibility; rowSelection; expanded }` |
| `RowModel<TData>` | `{ rows; flatRows; rowsById }` |
| `PivotTablePlugin<TData, TState>` | Plugin contract with `getInitialState`, `transformRows`, `onStateChange` |

## `PivotTableOptions<TData, TState>`

| Property | Type | Required | Description |
|---|---|---|---|
| `data` | `TData[]` | Yes | Raw rows |
| `columns` | `ColumnDef<TData>[]` | Yes | Column definitions |
| `state` | `Partial<TState>` | No | Controlled state override |
| `initialState` | `Partial<TState>` | No | Initial internal state |
| `onStateChange` | `(next: TState, previous: TState) => void` | No | Fired after `setState` |
| `plugins` | `PivotTablePlugin<TData, TState>[]` | No | Plugin pipeline in execution order |
| `getRowId` | `(originalRow: TData, index: number) => string` | No | Custom row id |
| `defaultColumn` | `Partial<ColumnDef<TData>>` | No | Defaults merged into each column |

## Return: `PivotTableInstance<TData, TState>`

| Property | Type | Description |
|---|---|---|
| `state` | `TState` | Active merged state |
| `columns` | `Column<TData>[]` | Normalized columns with guaranteed `id` |
| `rowModel` | `RowModel<TData>` | Final transformed row model |
| `getState` | `() => TState` | Returns current state |
| `setState` | `(updater: Updater<TState>) => void` | State update entrypoint |
| `getCoreRowModel` | `() => RowModel<TData>` | Pre-plugin rows |
| `getRowModel` | `() => RowModel<TData>` | Post-plugin rows |
| `registerPlugin` | `(plugin: PivotTablePlugin<TData, TState>) => void` | Runtime plugin registration |
| `unregisterPlugin` | `(pluginName: string) => boolean` | Runtime plugin removal |
| `getPlugin` | `(pluginName: string) => PivotTablePlugin<TData, TState> \| undefined` | Fetch plugin by name |
| `getAllPlugins` | `() => PivotTablePlugin<TData, TState>[]` | List active plugins |

## Example

```tsx
import { useMemo } from 'react';
import { usePivotTable, type ColumnDef } from '../src';
import { createSortingPlugin, withSorting } from '../src/plugins/sorting';
import { createFilteringPlugin, withFiltering } from '../src/plugins/filtering';

type User = {
  id: string;
  name: string;
  team: string;
  score: number;
};

export function UsersTable() {
  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      { id: 'name', accessorKey: 'name', enableSorting: true, enableFiltering: true },
      { id: 'team', accessorKey: 'team', enableSorting: true, enableFiltering: true },
      { id: 'score', accessorKey: 'score', enableSorting: true },
    ],
    [],
  );

  const tableBase = usePivotTable<User>({
    data: [
      { id: 'u1', name: 'Ava', team: 'Platform', score: 92 },
      { id: 'u2', name: 'Noah', team: 'Product', score: 88 },
    ],
    columns,
    plugins: [createFilteringPlugin(), createSortingPlugin()],
    initialState: {
      sorting: [{ id: 'score', desc: true }],
      filters: [],
      columnVisibility: {},
      rowSelection: {},
      expanded: {},
      globalFilter: '',
    } as any,
  });

  const table = withFiltering(withSorting(tableBase));
  const rows = table.getRowModel().rows;

  return (
    <table>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{String(row.getValue('name'))}</td>
            <td>{String(row.getValue('team'))}</td>
            <td>{String(row.getValue('score'))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Notes

- Controlled + uncontrolled are both supported:
  - `initialState` seeds internal store.
  - `state` overrides internal state fields at read time.
- Plugin execution order is deterministic and matches registration order.
- Keep `data`, `columns`, and `plugins` references stable (`useMemo`) to avoid unnecessary recomputation.
- Use `getCoreRowModel()` for features that should ignore downstream transforms.
