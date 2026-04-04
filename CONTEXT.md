# react-pivot-pro

## Project Overview
`react-pivot-pro` is a headless, plugin-driven pivot table engine for React and TypeScript. Its design philosophy is strictly headless: the library manages state and data transformation, while the consumer owns the UI rendering. It is intended for highly customizable analytics and operation dashboards.

## Architecture

### Core Engine (`src/core/`)
- **pivotEngine.ts** (229 lines): Processes raw data into pivot matrix structure
  - `createPivotEngineResult<TData>()` (line 146): Main function to create pivot result
  - `PivotGroupByDef<TData>` (line 8): Defines row/column grouping
  - `PivotValueDef<TData>` (line 13): Defines values to aggregate
  - `PivotNode<TData>` (line 19): Tree node for hierarchical data
  - `PivotEngineResult<TData>` (line 40): Complete pivot output
- **usePivotTable.ts** (291 lines): Main React hook - primary interface
  - `normalizeColumns()` (line 19): Normalizes column definitions with guaranteed IDs
  - `mergeStates()` (line 30): Merges internal and controlled state
  - `buildCoreRowModel()` (line 41): Builds core row model from raw data
  - Instance methods: `state`, `setState()`, `getCoreRowModel()`, `getRowModel()`, `registerPlugin()` (line 213), `unregisterPlugin()` (line 227), `getPlugin()` (line 235), `getAllPlugins()` (line 239)
  - Plugin pipeline (lines 248-276): Transforms rows through registered plugins

### State Management (`src/store/`)
- **pivotTableStore.ts** (36 lines): Zustand vanilla store
  - `createPivotTableStore<TState>()` (line 21): Factory function
  - Supports controlled/uncontrolled state patterns
  - `Updater` type for functional state updates

### Types (`src/types/`)
- **table.ts**: `PivotTableOptions`, `PivotTableInstance`, `RowData`
- **column.ts**: `ColumnDef<TData, TValue>` with accessorKey, accessorFn, header, cell, etc.
- **row.ts**: `Row<TData>`, `RowModel<TData>`
- **state.ts**: `TableState` with sorting, filters, columnVisibility, rowSelection, expanded
- **plugin.ts**: `PivotTablePlugin<TData, TState>` interface

### Hooks (`src/hooks/`)
- **useVirtualRows.ts** (212 lines): Vertical virtualization wrapper for `@tanstack/virtual-core`
- **useVirtualColumns.ts** (212 lines): Horizontal virtualization (same API, `horizontal: true`)

### Plugins (`src/plugins/`)
| Plugin | Lines | Purpose |
|--------|-------|---------|
| sorting.ts | 256 | Multi-column sorting with cache |
| filtering.ts | 272 | Column and global filtering |
| grouping.ts | 294 | Hierarchical row grouping |
| pivot.ts | 270 | Pivot matrix generation |
| columnVisibility.ts | 105 | Column visibility state |
| columnOrdering.ts | 115 | Explicit column ordering |
| columnPinning.ts | 129 | Left/right column pinning |
| dndRow.ts | 194 | Row drag-and-drop (uses @dnd-kit/core) |
| dndColumn.ts | 134 | Column drag-and-drop |

Each plugin follows the pattern:
1. Plugin factory: `createXPlugin()` - Creates plugin instance
2. API factory: `createXApi()` - Creates feature API
3. Wrapper: `withX()` - Augments table instance with API (e.g., line 246-255 in sorting.ts)

### Utilities (`src/utils/`)
- **exportCSV.ts**: CSV export with cell escaping, configurable delimiter
- **clipboard.ts**: Clipboard operations
- **fullscreen.ts**: Fullscreen API wrapper
- **aggregationFns.ts**: Built-in aggregators (count, sum, avg, min, max, median, unique, first, last)

## Entry Point (`src/index.ts`)
```typescript
export { usePivotTable } from './core/usePivotTable';
export * from './types';
export { createPivotTableStore } from './store/pivotTableStore';
```

## Usage Pattern
```typescript
const table = usePivotTable({
  data: myData,
  columns: [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'value', header: 'Value' },
  ],
  plugins: [createSortingPlugin(), createFilteringPlugin()],
});

// Augment with plugin APIs
const sortableTable = withSorting(table, options);
```

## Build & Tooling
- **tsup.config.ts**: Outputs ESM, CJS, and dts to `dist/`
- **tsconfig.json**: `target: ESNext`, `moduleResolution: bundler`, `jsx: react-jsx`, `ignoreDeprecations: 6.0`
- **docs-site/vite.config.ts**: Aliases `@pivot/*` to root `src/`

## Key Dependencies
- `@dnd-kit/core`: Drag and drop
- `@tanstack/virtual-core`: Virtualization
- `zustand`: State management
- `react`: ^19.2.4

## Common Patterns
- **Caching**: Plugins cache output keyed by input rows and state
- **Virtualization**: Stable Virtualizer instance with `setOptions()` updates
- **Controlled/Uncontrolled**: State can be controlled via `options.state` or managed internally
