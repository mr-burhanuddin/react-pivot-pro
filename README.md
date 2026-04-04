# React Pivot Pro

Headless, plugin-driven pivot table engine for React + TypeScript.

`react-pivot-pro` gives you a typed core table state/model layer, composable feature plugins (sorting, filtering, grouping, pivoting, DnD), and utility hooks (virtualization, export, clipboard/fullscreen) without forcing any UI framework.

## Features

### Core engine
- Headless `usePivotTable` hook
- Controlled + uncontrolled state
- Fully typed table state, row model, and plugin contracts
- Plugin registration and composition

### Data features
- Multi-column sorting
- Column + global filtering
- Column visibility, ordering, and pinning
- Multi-level row/column grouping
- Pivot matrix generation with multi-value aggregation
- Custom aggregation functions
- Client-side pivot + server-side adapter interface

### Interaction + utilities
- DnD helpers for column and row reordering (`@dnd-kit`)
- Row and column virtualization hooks (`@tanstack/virtual-core`)
- CSV export utility
- Clipboard + fullscreen utilities

## Installation

```bash
npm install react-pivot-pro
```

Peer/runtime deps used by feature modules:
- `react`
- `zustand`
- `@tanstack/virtual-core`
- `@dnd-kit/core`

## Quick Start

```tsx
import { useMemo } from 'react';
import { usePivotTable, type ColumnDef } from 'react-pivot-pro';
import { createSortingPlugin, withSorting } from 'react-pivot-pro/src/plugins/sorting';
import { createFilteringPlugin, withFiltering } from 'react-pivot-pro/src/plugins/filtering';

type Sale = {
  id: string;
  region: string;
  product: string;
  amount: number;
  quantity: number;
};

export function useSalesTable(data: Sale[]) {
  const columns = useMemo<ColumnDef<Sale>[]>(() => [
    { id: 'region', accessorKey: 'region', enableSorting: true, enableFiltering: true },
    { id: 'product', accessorKey: 'product', enableSorting: true, enableFiltering: true },
    { id: 'amount', accessorKey: 'amount', enableSorting: true },
    { id: 'quantity', accessorKey: 'quantity', enableSorting: true },
  ], []);

  const table = usePivotTable<Sale>({
    data,
    columns,
    plugins: [createFilteringPlugin(), createSortingPlugin()],
    initialState: {
      sorting: [{ id: 'amount', desc: true }],
      filters: [],
      columnVisibility: {},
      rowSelection: {},
      expanded: {},
    },
  });

  const withFeatures = withFiltering(withSorting(table));
  return withFeatures;
}
```

## Core Concepts

### Headless by design
Core only manages data/state/transform pipelines. You own rendering, layout, styling, and interactions.

### Plugins
Each plugin:
- owns its feature state slice
- can transform rows
- can react to state changes
- can expose feature APIs via `withX(table)`

Register plugins in `usePivotTable({ plugins: [...] })`, then augment instance APIs with `withX(...)`.

## Pivot Example

```tsx
import { usePivotTable, type ColumnDef } from 'react-pivot-pro';
import { createGroupingPlugin, withGrouping } from 'react-pivot-pro/src/plugins/grouping';
import { createPivotPlugin, withPivot } from 'react-pivot-pro/src/plugins/pivot';

type Sale = {
  region: string;
  category: string;
  month: string;
  amount: number;
  quantity: number;
};

export function usePivotedSales(data: Sale[]) {
  const columns: ColumnDef<Sale>[] = [
    { id: 'region', accessorKey: 'region' },
    { id: 'category', accessorKey: 'category' },
    { id: 'month', accessorKey: 'month' },
    { id: 'amount', accessorKey: 'amount' },
    { id: 'quantity', accessorKey: 'quantity' },
  ];

  const table = usePivotTable<Sale>({
    data,
    columns,
    plugins: [
      createGroupingPlugin(),
      createPivotPlugin({
        defaultValues: [
          { id: 'amount', aggregation: 'sum' },
          { id: 'quantity', aggregation: 'avg' },
        ],
      }),
    ],
    initialState: {
      rowGrouping: ['region'],
      columnGrouping: ['month'],
      pivotEnabled: true,
      pivotValues: [
        { id: 'amount', aggregation: 'sum' },
        { id: 'quantity', aggregation: 'avg' },
      ],
      sorting: [],
      filters: [],
      columnVisibility: {},
      rowSelection: {},
      expanded: {},
      expandedGroups: {},
    } as any,
  });

  const pivotTable = withPivot(withGrouping(table));
  const pivotResult = pivotTable.pivot.getPivotResult();
  return { table: pivotTable, pivotResult };
}
```

## API Overview

### Core
- `usePivotTable(options)`
- `table.state`, `table.setState(updater)`
- `table.getCoreRowModel()`, `table.getRowModel()`
- `table.registerPlugin(...)`, `table.unregisterPlugin(...)`

### Key plugin factories
- Sorting: `createSortingPlugin`, `withSorting`
- Filtering: `createFilteringPlugin`, `withFiltering`
- Grouping: `createGroupingPlugin`, `withGrouping`
- Pivot: `createPivotPlugin`, `withPivot`
- Column features: `createColumnVisibilityPlugin`, `createColumnOrderingPlugin`, `createColumnPinningPlugin`
- DnD: `createDndColumnPlugin`, `createDndRowPlugin`

### Virtualization hooks
- `useVirtualRows(options)`
- `useVirtualColumns(options)`

### Utilities
- `exportCSV(options)` / `serializeCSV(options)`
- `copyToClipboard({ text })`
- `fullscreen.request()`, `fullscreen.exit()`, `fullscreen.toggle()`

## Performance Notes

- Prefer stable references for `data`, `columns`, and plugin arrays (`useMemo`).
- Compose only the plugins you need.
- Virtualize both rows and columns for large datasets.
- Keep custom aggregation functions pure and allocation-light.
- For very large pivot workloads, use the server adapter path in the pivot plugin.

## Roadmap

- Stronger built-in plugin export surface from package root
- Tree data + subtotal/rollup strategies
- More aggregation presets and typed value formatters
- Worker/off-main-thread pivot execution
- Devtools for plugin/state inspection

## Contributing

1. Fork and create a feature branch.
2. Keep changes modular and headless-first.
3. Add/adjust types first, then implementation.
4. Include tests for plugin behavior and row-model transforms.
5. Open a PR with:
   - problem statement
   - API impact
   - performance notes
   - migration notes (if breaking)

Guidelines:
- No UI coupling in core/plugins/hooks.
- Avoid `any`; preserve strict typing.
- Optimize for stable references and minimal recomputation.

## Documentation

- [Docs Index](./docs/README.md)
- [`usePivotTable` API](./docs/API-usePivotTable.md)
- [Feature Catalog](./docs/features/README.md)
- [Examples](./docs/examples)
