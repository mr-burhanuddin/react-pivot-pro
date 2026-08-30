# `usePivotTable` API Reference

Headless hook for table state, row-model generation, and plugin execution.

## Signature

```ts
function usePivotTable<
  TData extends RowData,
  TState extends TableState = TableState,
>(options: PivotTableOptions<TData, TState>): PivotTableInstance<TData, TState>;
```

## Core Types

| Type                              | Definition                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| `RowData`                         | `Record<string, unknown>`                                                                         |
| `Updater<T>`                      | `T \| ((previous: T) => T)`                                                                       |
| `TableState`                      | `{ sorting, filters, columnVisibility, rowSelection, expanded }` — see [State Shape](#tablestate) |
| `RowModel<TData>`                 | `{ rows: Row<TData>[], flatRows: Row<TData>[], rowsById: Record<string, Row<TData>> }`            |
| `PivotTablePlugin<TData, TState>` | Plugin contract — see [Plugin Contract](#plugintableplugintdata-tstate)                           |

---

## `PivotTableOptions<TData, TState>`

| Property        | Type                                            | Required | Description                                                                         |
| --------------- | ----------------------------------------------- | -------- | ----------------------------------------------------------------------------------- |
| `data`          | `TData[]`                                       | Yes      | Raw data rows. Reference stability matters — changing ref triggers recomputation.   |
| `columns`       | `ColumnDef<TData>[]`                            | Yes      | Column definitions. Normalized internally (IDs guaranteed).                         |
| `state`         | `Partial<TState>`                               | No       | Controlled state override. Merges with internal state at read time.                 |
| `initialState`  | `Partial<TState>`                               | No       | Seeds the internal Zustand store. Combined with plugin `getInitialState()` results. |
| `onStateChange` | `(next: TState, prev: TState) => void`          | No       | Called after every `setState()` (after store update, before re-render).             |
| `plugins`       | `PivotTablePlugin<TData, TState>[]`             | No       | Plugin pipeline in execution order. Changing ref triggers full pipeline reset.      |
| `getRowId`      | `(originalRow: TData, index: number) => string` | No       | Custom row ID generator. Defaults to `String(index)`.                               |
| `defaultColumn` | `Partial<ColumnDef<TData>>`                     | No       | Defaults merged into every column definition before normalization.                  |

---

## Return: `PivotTableInstance<TData, TState>`

| Property             | Type                                                | Description                                                                        |
| -------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `state`              | `TState`                                            | Active merged state (internal + controlled).                                       |
| `columns`            | `Column<TData>[]`                                   | Normalized columns after all `transformColumns` plugins. Each has guaranteed `id`. |
| `rowModel`           | `RowModel<TData>`                                   | Final row model after all `transformRows` plugins.                                 |
| `getState()`         | `() => TState`                                      | Returns current merged state (same as `.state`).                                   |
| `setState()`         | `(updater: Updater<TState>) => void`                | Entry point for state updates. Accepts value or function.                          |
| `getCoreRowModel()`  | `() => RowModel<TData>`                             | Pre-plugin row model (raw data rows with computed values).                         |
| `getRowModel()`      | `() => RowModel<TData>`                             | Post-plugin row model (same as `.rowModel`).                                       |
| `registerPlugin()`   | `(plugin: PivotTablePlugin<TData, TState>) => void` | Dynamically add a plugin at runtime. Triggers pipeline reset.                      |
| `unregisterPlugin()` | `(name: string) => boolean`                         | Remove a plugin by name. Returns `true` if found and removed.                      |
| `getPlugin()`        | `(name: string) => PivotTablePlugin \| undefined`   | Fetch plugin instance by name.                                                     |
| `getAllPlugins()`    | `() => PivotTablePlugin[]`                          | List all registered plugins in order.                                              |

---

## `TableState`

The base state shape. Plugins extend this with additional keys:

```ts
interface TableState {
  sorting: SortingRule[]; // { id: string; desc: boolean }
  filters: ColumnFilter[]; // Column-level filters
  columnVisibility: Record<string, boolean>;
  rowSelection: Record<string, boolean>;
  expanded: Record<string, boolean>;
}
```

Additional state keys contributed by plugins:

| Key                 | Plugin                       | Type                                            |
| ------------------- | ---------------------------- | ----------------------------------------------- |
| `globalFilter`      | Filtering                    | `unknown`                                       |
| `rowGrouping`       | Grouping / Pivot             | `string[]`                                      |
| `columnGrouping`    | Grouping / Pivot             | `string[]`                                      |
| `expandedGroups`    | Grouping                     | `Record<string, boolean>`                       |
| `pivotValues`       | Pivot                        | `PivotValueDef[]`                               |
| `pivotEnabled`      | Pivot                        | `boolean`                                       |
| `columnAggregators` | Aggregation                  | `Record<string, AggregationFnName \| 'custom'>` |
| `columnOrder`       | Column Ordering / DnD Column | `string[]`                                      |
| `columnPinning`     | Column Pinning               | `{ left: string[]; right: string[] }`           |
| `rowOrder`          | DnD Row                      | `string[]`                                      |

---

## `ColumnDef<TData, TValue>`

```ts
interface ColumnDef<TData extends RowData, TValue = unknown> {
  id?: string; // Auto-generated if missing
  accessorKey?: Extract<keyof TData, string>; // Property path for value extraction
  accessorFn?: (originalRow: TData, index: number) => TValue; // Custom extractor
  header?: string; // Display name
  meta?: Record<string, unknown>; // Plugin annotations
  enableSorting?: boolean; // Hint for sorting plugin
  enableFiltering?: boolean; // Hint for filtering plugin
  cell?: (val: TValue, row: TData) => React.ReactNode; // Render hint
  width?: number;
  pivot?: { aggregator: "sum" | "count" | "avg" | "min" | "max" };
}
```

**Value resolution order:** `accessorFn` → `accessorKey` → `undefined`.

---

## `Row<TData>`

```ts
interface Row<TData extends RowData> {
  id: string;
  index: number; // -1 for synthetic group rows
  original: TData; // Original data object ({} for group/total rows)
  values: Record<string, unknown>; // Pre-computed column values
  getValue<TValue>(columnId: string): TValue | undefined;
  meta?: RowMeta; // { isSubtotal?, isGrandTotal?, ... }
}
```

---

## `PivotTablePlugin<TData, TState>`

```ts
interface PivotTablePlugin<TData extends RowData, TState extends TableState> {
  name: string;
  getInitialState?: (state: TState) => Partial<TState>;
  transformRows?: (rows: Row<TData>[], context: PluginContext) => Row<TData>[];
  transformColumns?: (
    cols: Column<TData>[],
    context: PluginContext,
  ) => Column<TData>[];
  onStateChange?: (
    state: TState,
    prevState: TState,
    context: PluginContext,
  ) => void;
}

interface PivotTablePluginContext<TData, TState> {
  columns: Column<TData>[];
  data: TData[];
  state: TState;
  setState: (updater: Updater<TState>) => void;
  getColumnById: (id: string) => Column<TData> | undefined;
}
```

---

## Controlled vs Uncontrolled State

### Uncontrolled (recommended for most use cases)

```ts
const table = usePivotTable({
  data,
  columns,
  initialState: { sorting: [{ id: "name", desc: false }] },
});

// Mutate via table.setState
table.setState((prev) => ({ ...prev, sorting: [{ id: "name", desc: true }] }));
```

### Controlled

```ts
const [state, setState] = useState<TableState>({ sorting: [], filters: [] });

const table = usePivotTable({
  data,
  columns,
  state, // External ownership
  onStateChange: (next) => setState(next), // Sync external state
});

// Updates must flow through external setState
table.setState((prev) => {
  /* ... */
}); // Triggers onStateChange → consumer updates external state
```

**Note:** When using controlled state, the `state` prop overrides internal state at read time via `mergeStates()`. Internal mutations are visible only if the consumer propagates them through `onStateChange`.

---

## Example

```tsx
import { useMemo, useState } from "react";
import {
  usePivotTable,
  createSortingPlugin,
  withSorting,
  createFilteringPlugin,
  withFiltering,
  type ColumnDef,
  type TableState,
} from "react-pivot-pro";

type User = {
  id: string;
  name: string;
  team: string;
  score: number;
};

export function UsersTable({ data }: { data: User[] }) {
  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      { id: "name", accessorKey: "name", enableFiltering: true },
      {
        id: "team",
        accessorKey: "team",
        enableSorting: true,
        enableFiltering: true,
      },
      { id: "score", accessorKey: "score", enableSorting: true },
    ],
    [],
  );

  const base = usePivotTable<User>({
    data,
    columns,
    plugins: [createFilteringPlugin(), createSortingPlugin()],
    initialState: {
      sorting: [{ id: "score", desc: true }],
    },
  });

  const table = withFiltering(withSorting(base));
  const rows = table.getRowModel().rows;

  return (
    <table>
      <thead>
        <tr>
          {table.columns.map((col) => (
            <th
              key={col.id}
              onClick={() => table.sorting.toggleSorting(col.id, true)}
            >
              {col.header ?? col.id}{" "}
              {table.sorting.getIsSorted(col.id) === "asc"
                ? "▲"
                : table.sorting.getIsSorted(col.id) === "desc"
                  ? "▼"
                  : ""}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            {table.columns.map((col) => (
              <td key={col.id}>{String(row.getValue(col.id) ?? "")}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## Notes

- **Plugin execution order** is deterministic and matches the order in the `plugins` array
- **Reference stability** matters: keep `data`, `columns`, and `plugins` stable via `useMemo` to avoid unnecessary recomputation
- **Core row model** is useful for features that should ignore downstream transforms (e.g., pagination over raw data)
- **Column normalization** warns on duplicate IDs in development mode and auto-generates unique IDs
- **State merging**: `mergeStates(internal, controlled)` spreads controlled over internal — controlled wins for overlapping keys
