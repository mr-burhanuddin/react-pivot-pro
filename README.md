# React Pivot Pro

![npm version](https://img.shields.io/npm/v/react-pivot-pro)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![React](https://img.shields.io/badge/React-18%2B-blue)

Headless, plugin-driven pivot table engine for React + TypeScript.

`react-pivot-pro` provides a typed core table state/model layer with composable feature plugins (sorting, filtering, grouping, pivoting, drag-and-drop) and utility hooks (virtualization, CSV export, clipboard) — without dictating any UI framework or rendering strategy. You own the UI; the library owns data, state, and transformation pipelines.

---

## Features

- **Headless core** — `usePivotTable` manages data and state only; you render what you want
- **Plugin architecture** — 10 built-in plugins, each independently composable
- **Controlled + uncontrolled state** — via Zustand store with `Updater<T>` pattern
- **Multi-column sorting** — with `Int32Array` index-based sort for performance
- **Column + global filtering** — text, number, date, enum, boolean with rich operators
- **Row/column grouping** — multi-level hierarchical grouping with expansion state
- **Pivot matrix** — client-side via pivot engine or server-side via adapter interface
- **Aggregation** — 12 built-in functions (sum, count, avg, min, max, median, stddev, variance, pctOfTotal, pctOfColumn, runningTotal, countDistinct) + custom function support
- **Column visibility, ordering, pinning** — left/right frozen columns
- **Drag-and-drop** — rows and columns via `@dnd-kit/core`
- **Virtualization** — row and column virtualization via `@tanstack/virtual-core`
- **Utilities** — CSV export with injection prevention, clipboard copy

---

## Installation

```bash
npm install react-pivot-pro
```

**Peer/runtime dependencies used by feature modules:**

| Package                  | Required by                                   |
| ------------------------ | --------------------------------------------- |
| `react >= 18.0.0`        | Core                                          |
| `zustand`                | State management                              |
| `@tanstack/virtual-core` | `useVirtualRows`, `useVirtualColumns`         |
| `@dnd-kit/core`          | `createDndRowPlugin`, `createDndColumnPlugin` |

---

## Quick Start

```tsx
import { useMemo } from "react";
import {
  usePivotTable,
  createSortingPlugin,
  withSorting,
  createFilteringPlugin,
  withFiltering,
  type ColumnDef,
} from "react-pivot-pro";

type Sale = {
  id: string;
  region: string;
  product: string;
  amount: number;
};

function SalesTable({ data }: { data: Sale[] }) {
  const columns = useMemo<ColumnDef<Sale>[]>(
    () => [
      { id: "region", accessorKey: "region", enableFiltering: true },
      { id: "product", accessorKey: "product", enableSorting: true },
      { id: "amount", accessorKey: "amount", enableSorting: true },
    ],
    [],
  );

  const base = usePivotTable<Sale>({
    data,
    columns,
    plugins: [createFilteringPlugin(), createSortingPlugin()],
    initialState: {
      sorting: [{ id: "amount", desc: true }],
    },
  });

  const table = withFiltering(withSorting(base));

  return (
    <table>
      <thead>
        <tr>
          {table.columns.map((col) => (
            <th key={col.id}>{col.header ?? col.id}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
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

## Core Concepts

### Headless by Design

The library manages **state → transform → row model**. You own rendering, layout, styling, and user interaction. This means:

- No built-in table component
- No CSS shipped
- No opinion about HTML structure
- Full TypeScript types for every public API

### Plugin System

Each feature is a self-contained plugin that:

1. **Owns its state slice** — via `getInitialState()`
2. **Transforms rows** — via `transformRows(rows, context)`
3. **Transforms columns** — via `transformColumns(columns, context)`
4. **Reacts to state changes** — via `onStateChange(state, previousState, context)`

Plugins run in registration order. Each plugin's output is cached by input reference + state to avoid unnecessary recomputation.

**Pattern:** `createXPlugin()` → pass to `usePivotTable({ plugins: [...] })` → `withX(table)` to augment the instance with feature-specific APIs.

### State Management

- **Internal store** — Zustand vanilla store created inside `usePivotTable`
- **Uncontrolled** — seed with `initialState`, manage via `table.setState()`
- **Controlled** — pass `state` prop for external ownership, changes reported via `onStateChange`
- **Updater pattern** — `setState(updater)` accepts either a value or `(prev) => next`

### Row Model

- `getCoreRowModel()` — raw rows before any plugin transforms
- `getRowModel()` — final rows after all plugin `transformRows()` pipelines
- Each `Row<TData>` has `id`, `index`, `original`, `values`, `getValue(columnId)`, and optional `meta`

---

## API Overview

### Core Hook

```ts
const table = usePivotTable<TData>({ data, columns, plugins?, initialState?, state?, onStateChange? });
```

Returns `PivotTableInstance<TData>` with: `state`, `columns`, `rowModel`, `getState()`, `setState()`, `getCoreRowModel()`, `getRowModel()`, `registerPlugin()`, `unregisterPlugin()`, `getPlugin()`, `getAllPlugins()`.

### Plugin Factories

| Plugin            | Factory                             | Wrapper                       | Hook                         |
| ----------------- | ----------------------------------- | ----------------------------- | ---------------------------- |
| Sorting           | `createSortingPlugin(options?)`     | `withSorting(table)`          | `useSorting(table)`          |
| Filtering         | `createFilteringPlugin(options?)`   | `withFiltering(table)`        | `useFiltering(table)`        |
| Grouping          | `createGroupingPlugin()`            | `withGrouping(table)`         | `useGrouping(table)`         |
| Pivot             | `createPivotPlugin(options?)`       | `withPivot(table)`            | `usePivot(table)`            |
| Aggregation       | `createAggregationPlugin(options?)` | `withAggregation(table)`      | `usePivotAggregation(table)` |
| Column Visibility | `createColumnVisibilityPlugin()`    | `withColumnVisibility(table)` | —                            |
| Column Ordering   | `createColumnOrderingPlugin()`      | `withColumnOrdering(table)`   | —                            |
| Column Pinning    | `createColumnPinningPlugin()`       | `withColumnPinning(table)`    | —                            |
| DnD Row           | `createDndRowPlugin()`              | `withDndRow(table)`           | `useDndRow(table)`           |
| DnD Column        | `createDndColumnPlugin()`           | `withDndColumn(table)`        | `useDndColumn(table)`        |

### Subpath Exports

```ts
// Individual plugin subpaths
import {
  createSortingPlugin,
  withSorting,
} from "react-pivot-pro/plugins/sorting";
import {
  createFilteringPlugin,
  withFiltering,
} from "react-pivot-pro/plugins/filtering";
import {
  createGroupingPlugin,
  withGrouping,
} from "react-pivot-pro/plugins/grouping";
import { createPivotPlugin, withPivot } from "react-pivot-pro/plugins/pivot";
// Aggregation: available from root import only

// Hooks and store
import { useVirtualRows, useVirtualColumns } from "react-pivot-pro/hooks";
import {
  createPivotTableStore,
  createPluginRegistry,
  DEFAULT_MANIFESTS,
} from "react-pivot-pro/store";
import { exportCSV, copyToClipboard } from "react-pivot-pro/utils";
```

### Virtualization

```ts
const { virtualizer, virtualRows, totalSize } = useVirtualRows({
  count,
  getScrollElement,
  estimateSize,
  scrollMode: "element" | "window",
  overscan,
});
```

### Utilities

```ts
// CSV export
const { csv, fileName, blob, download } = exportCSV({
  rows,
  columns,
  fileName,
  delimiter,
  includeHeader,
});

// Clipboard
const ok = await copyToClipboard({ text });
```

---

## Plugin Conflicts

Some plugins share state keys and cannot be active simultaneously:

| Conflicting Pair               | Shared Key                      |
| ------------------------------ | ------------------------------- |
| `pivot` ↔ `grouping`           | `rowGrouping`, `columnGrouping` |
| `columnOrdering` ↔ `dndColumn` | `columnOrder`                   |

Use `createPluginRegistry()` from the store subpath to detect conflicts at runtime.

---

## Performance

- Keep `data`, `columns`, and `plugins` references stable (`useMemo`)
- Compose only the plugins you need
- Virtualize both rows and columns for large datasets
- Use the server-side pivot adapter for high-cardinality pivots
- Debounce text input before updating filter state

---

## Development

```bash
npm install           # Install dependencies
npm run build         # Build library (ESM + CJS + types)
npm run dev           # Watch mode
npm run test          # Run tests
npm run test:run      # Run tests once (CI)
npm run typecheck     # TypeScript type check
npm run lint          # Lint
npm run docs:dev      # Run documentation site
```

---

## Constraints

- **No built-in UI components** — this is headless by design; you render everything
- **React 18+** — relies on modern hooks and concurrent features
- **Plugin conflicts** — `pivot` and `grouping` cannot be used together; `columnOrdering` and `dndColumn` cannot be used together (they share state keys)
- **Aggregation subtotal rows** — the aggregation plugin expects rows with a `_groupKey` value in `row.values` to compute subtotals; without this grouping key, only grand totals are produced
- **Pivot mode** — the pivot plugin replaces all rows with pivot matrix rows when enabled; original data is accessible via `getCoreRowModel()`
- **CSV export** — runs in browser only for `download()`; `serializeCSV()` works server-side

---

## Documentation

- [Feature Guide](docs/features/README.md) — detailed documentation for each plugin
- [API Reference](docs/API-usePivotTable.md) — `usePivotTable` API reference
- [Examples](docs/examples/) — runnable example components
