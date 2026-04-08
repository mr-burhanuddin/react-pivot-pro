# CONTEXT — react-pivot-pro Architecture Deep Dive

This document explains how the system works end-to-end. Read it to understand how to extend or debug the library without guessing.

---

## 1. System Purpose

`react-pivot-pro` is a **headless pivot table engine**. It manages:

1. **Data ingestion** — raw `TData[]` arrays with column definitions
2. **State management** — sorting, filtering, grouping, visibility, ordering, pinning, aggregation, pivot configuration
3. **Transformation pipeline** — plugins transform rows and columns in registration order
4. **Output** — a `RowModel<TData>` and `Column<TData>[]` that consumers render however they want

It does **not** render anything. No table component, no CSS, no HTML.

---

## 2. Mental Model

```
┌─────────────────────────────────────────────────────────┐
│                    Consumer Component                    │
│  usePivotTable({ data, columns, plugins, initialState }) │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   usePivotTable Hook                     │
│                                                         │
│  1. normalizeColumns(columns) → Column<TData>[]         │
│  2. buildCoreRowModel(data, columns) → RowModel         │
│  3. createPivotTableStore(initialState) → Zustand store │
│  4. Plugin pipeline:                                     │
│     for each plugin in order:                            │
│       rows = plugin.transformRows(rows, context) ?? rows │
│       cols = plugin.transformColumns(cols, context)     │
│     (each step cached by input ref + state)              │
│  5. Return PivotTableInstance                           │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Consumer Renders What They Want              │
│  table.columns → <th> headers                           │
│  table.getRowModel().rows → <tr> rows                    │
│  table.sorting / .filtering / .pivot → UI controls       │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow

### 3.1 Input → Output

```
TData[] (raw data)
    │
    ▼
normalizeColumns() ── ColumnDef[] → Column[] (guaranteed unique ids)
    │
    ▼
buildCoreRowModel() ── RowModel { rows, flatRows, rowsById }
    │                  each Row has: id, index, original, values, getValue()
    │
    ▼
Plugin Pipeline (transformRows)
    │  sorting → filtered rows
    │  filtering → filtered rows
    │  grouping → expanded tree with group rows
    │  pivot → pivot matrix rows
    │  aggregation → subtotal + grand total rows
    │  dndRow → reordered rows
    │
    ▼
Final RowModel → consumer renders

Column[] (normalized)
    │
    ▼
Plugin Pipeline (transformColumns)
    │  columnOrdering → reordered columns
    │  columnPinning → [leftPinned, center, rightPinned]
    │  columnVisibility → filtered columns
    │  dndColumn → reordered columns
    │  aggregation → annotated with meta.aggregator
    │
    ▼
Final Column[] → consumer renders
```

### 3.2 State Flow

```
options.initialState ──┐
                       │
                       ▼
             createPivotTableStore(initialState)
                       │
                       ├── plugin.getInitialState() merges in plugin state
                       │
                       ▼
             Zustand store: { state, setState, resetState }
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
    table.state   table.setState  options.state
    (read-only)   (entry point)   (controlled override)
          │            │            │
          └────────────┼────────────┘
                       │
                       ▼
            mergeStates(internal, controlled)
                       │
                       ▼
            options.onStateChange(next, prev)
                       │
                       ▼
            Plugin cache invalidation + re-render
```

---

## 4. Key Abstractions

### 4.1 `Row<TData>`

```ts
interface Row<TData> {
  id: string; // Unique identifier (from getRowId or index)
  index: number; // Position in the model (-1 for group rows)
  original: TData; // Original data object
  values: Record<string, unknown>; // Pre-computed column values
  getValue<T>(columnId: string): T | undefined; // Typed accessor
  meta?: RowMeta; // Plugin annotations (isSubtotal, isGrandTotal, pinned)
}
```

- `values` are computed once in `buildCoreRowModel()` from `accessorKey` or `accessorFn`
- Plugin transforms can mutate `values` or replace rows entirely
- Group rows have `index: -1`, `original: {}`, and `meta.isSubtotal` / `meta.isGrandTotal` flags

### 4.2 `Column<TData>`

```ts
interface ColumnDef<TData, TValue> {
  id?: string; // Auto-normalized if missing
  accessorKey?: keyof TData; // Property path for value extraction
  accessorFn?: (row, index) => TValue; // Custom value extractor
  header?: string; // Display name
  enableSorting?: boolean; // Plugin hint
  enableFiltering?: boolean; // Plugin hint
  meta?: Record<string, unknown>; // Plugin annotations
  cell?: (val, row) => React.ReactNode; // Render hint (consumer owns rendering)
  width?: number;
  pivot?: { aggregator: "sum" | "count" | "avg" | "min" | "max" };
}

interface Column<TData> extends Omit<ColumnDef, "id"> {
  id: string; // Guaranteed after normalization
}
```

**Column normalization** (`normalizeColumns()`):

- Generates IDs from `accessorKey` or index if missing
- Validates ID pattern: `/^[a-zA-Z_$][a-zA-Z0-9_$]*$/`
- Deduplicates by appending `_index` suffix
- Warns on duplicates in development

### 4.3 `PivotTablePlugin<TData, TState>`

```ts
interface PivotTablePlugin<TData, TState> {
  name: string;
  getInitialState?: (state: TState) => Partial<TState>;
  transformRows?: (rows: Row<TData>[], context: PluginContext) => Row<TData>[];
  transformColumns?: (
    cols: Column<TData>[],
    context: PluginContext,
  ) => Column<TData>[];
  onStateChange?: (state, prevState, context) => void;
}
```

- **`name`** — unique identifier; used for caching and registration
- **`getInitialState`** — seeds plugin state into the store (called once at store creation and when plugin is added dynamically)
- **`transformRows`** — receives current rows, returns transformed rows (called every render if inputs changed)
- **`transformColumns`** — same for columns
- **`onStateChange`** — side-effect hook; can call `context.setState()` to auto-correct invalid state (e.g., filter on deleted column)

### 4.4 `PivotTablePluginContext<TData, TState>`

The context object passed to every plugin method:

```ts
interface PivotTablePluginContext<TData, TState> {
  columns: Column<TData>[]; // Normalized columns
  data: TData[]; // Original data array
  state: TState; // Current merged state
  setState: (updater: Updater<TState>) => void;
  getColumnById: (id: string) => Column<TData> | undefined;
}
```

---

## 5. Execution Flow (Lifecycle)

### 5.1 Initial Mount

```
1. usePivotTable() called with options
2. normalizeColumns() → stable Column[] (memoized)
3. initialStateRef computed: defaultTableState + plugin.getInitialState() for each plugin
4. createPivotTableStore(initialState) → Zustand store
5. buildCoreRowModel(data, columns, getRowId) → core rows with pre-computed values
6. Plugin pipeline:
   For each registered plugin in order:
     - transformRows(rows, context) → cached by (inputRows ref, pluginVersion)
     - transformColumns(columns, context) → cached by (inputColumns ref, pluginVersion)
7. Return PivotTableInstance
```

### 5.2 State Update (`table.setState()`)

```
1. stableSetState(updater) called
2. Read internal state from store
3. Merge with controlled state (options.state)
4. Apply updater: if function, call with merged state; else use value directly
5. store.setState(nextState) — Zustand shallow-equals check prevents unnecessary updates
6. options.onStateChange(next, prev) fired
7. Plugin cache cleared → next render recomputes pipeline
8. setStateVersion incremented → triggers rowModel/columnModel memoization checks
```

### 5.3 Plugin Change

```
1. options.plugins reference changes
2. useEffect compares old vs new plugin map (by reference, not name)
3. If new plugin detected:
   - Added plugins' getInitialState() merged into store
   - Cache cleared
   - pluginVersion incremented → full pipeline recomputation
4. If plugin removed:
   - Cache cleared
   - pluginVersion incremented
   - State is NOT cleaned up (plugin state remains in store)
```

### 5.4 Data Change

```
1. options.data reference changes
2. stableDataRef updated, dataVersion incremented
3. coreRowModel recomputed (useMemo depends on dataVersion)
4. Plugin pipeline reruns with new core rows
```

---

## 6. Caching Strategy

Each plugin's output is cached using a two-level strategy:

### Row Transform Cache

```ts
// Inside useDeepCompareMemo:
cacheKey = `plugin_${plugin.name}_v${pluginVersion}`
Hit if: cached.inputRows === currentTransformedRows  (reference equality)
```

### Plugin Internal Cache

Most plugins maintain their own internal cache:

```ts
const cache = {
  rows: null as Row<TData>[] | null,   // Input rows reference
  result: null as Row<TData>[] | null,  // Output rows
  // ... plugin-specific state keys
};

// In transformRows:
if (cache.rows === rows && cache.result && /* state unchanged */) {
  return cache.result;  // Skip computation
}
```

**Cache invalidation happens when:**

- `pluginVersion` changes (plugin added/removed)
- `dataVersion` changes (data ref changes)
- `stateVersion` changes (state updated)
- Plugin-specific state changes (e.g., `sorting` array changes for sorting plugin)

---

## 7. Plugin System Details

### 7.1 Plugin Registration Order

Plugins execute in the order they appear in the `plugins` array. This matters because:

- **Filtering → Sorting**: filter first reduces rows, then sort operates on fewer rows
- **Grouping → Aggregation**: group first creates hierarchical structure, aggregation adds subtotals
- **Pivot**: replaces all rows with matrix rows; should be last in the row pipeline

### 7.2 Plugin Conflicts

The `createPluginRegistry()` utility detects conflicts via:

1. **Explicit `conflictsWith`** — declared incompatibilities
2. **Shared `stateKeys`** — if two plugins write to the same state key

Known conflicts:

| Plugin A         | Plugin B    | Reason                                   |
| ---------------- | ----------- | ---------------------------------------- |
| `pivot`          | `grouping`  | Both use `rowGrouping`, `columnGrouping` |
| `columnOrdering` | `dndColumn` | Both use `columnOrder`                   |

### 7.3 Building a Custom Plugin

```ts
import type {
  PivotTablePlugin,
  PivotTablePluginContext,
  Row,
  RowData,
} from "react-pivot-pro";

interface MyPluginState {
  myFeature: string[];
}

export function createMyPlugin<TData extends RowData>(): PivotTablePlugin<
  TData,
  MyPluginState
> {
  return {
    name: "myFeature",
    getInitialState: (state) => ({
      ...state,
      myFeature: state.myFeature ?? [],
    }),
    transformRows: (rows, context) => {
      // Transform rows based on myFeature state
      return rows;
    },
    onStateChange: (state, prevState, context) => {
      // Side effects when state changes
    },
  };
}
```

---

## 8. Pivot Engine

The pivot engine (`src/core/pivotEngine.ts`) is a standalone data transformation function, independent of React:

```ts
createPivotEngineResult<TData>({
  data: TData[],
  rowGroupBy: PivotGroupByDef<TData>[],
  columnGroupBy: PivotGroupByDef<TData>[],
  values: PivotValueDef<TData>[],
  aggregationFns?: Record<string, AggregationFn>,
}): PivotEngineResult<TData>
```

**Algorithm:**

1. Build row and column path keys for every data row
2. Create bucket map: `rowKey → columnKey → TData[]`
3. Aggregate each cell bucket using the specified aggregation functions
4. Build rowTree (hierarchical grouping of row dimensions)
5. Return `{ rowTree, rowHeaders, columnHeaders, matrix, matrixByRowKey, grandTotals }`

**Server-side adapter:**

```ts
interface PivotServerAdapter<TData> {
  execute(
    request: PivotEngineRequest<TData>,
  ): Promise<PivotEngineResult<TData>>;
}
```

Pass to `createPivotPlugin({ serverAdapter, clientSide: false })` and call `table.pivot.runServerSidePivot()`.

---

## 9. Aggregation System

### 9.1 Built-in Functions

12 aggregation functions in `src/plugins/aggregation/aggregators.ts`:

| Name            | Behavior                     | Null Handling        |
| --------------- | ---------------------------- | -------------------- |
| `sum`           | Sum of numeric values        | Skips null/NaN       |
| `count`         | Total count                  | Counts all           |
| `avg`           | Mean of numeric values       | Skips null/NaN       |
| `min`           | Minimum numeric value        | Skips null/NaN       |
| `max`           | Maximum numeric value        | Skips null/NaN       |
| `median`        | Median of numeric values     | Skips null/NaN       |
| `stddev`        | Sample standard deviation    | Skips null/NaN       |
| `variance`      | Sample variance              | Skips null/NaN       |
| `pctOfTotal`    | Sum (placeholder for %)      | Skips null/NaN       |
| `pctOfColumn`   | Returns 100 (placeholder)    | —                    |
| `runningTotal`  | Cumulative sum, returns last | Skips null/NaN       |
| `countDistinct` | Unique non-null count        | Skips null/undefined |

### 9.2 Aggregation Plugin Behavior

The aggregation plugin operates differently from others:

- **Subtotal rows**: Detects `_groupKey` in `row.values`. When a group changes (last row with same `_groupKey`), inserts a subtotal row with `meta.isSubtotal: true`
- **Grand total row**: Always appended at the end with `id: 'grandTotal'`, `meta.isGrandTotal: true`
- **Column annotation**: `transformColumns` adds `meta.aggregator` and `meta.aggregatorLabel` to each column

### 9.3 Custom Aggregation Functions

```ts
const api = createAggregationApi(table);
api.registerFn("myCustom", (values) => {
  // values: unknown[]
  // return: number | null
  return values.filter((v) => v != null).length;
});

// Then use it:
api.setColumnAggregator("amount", "myCustom");
```

---

## 10. State Shape

The full state shape is the union of all registered plugin states:

```ts
interface TableState {
  // Core
  sorting: SortingRule[];
  filters: ColumnFilter[];
  columnVisibility: Record<string, boolean>;
  rowSelection: Record<string, boolean>;
  expanded: Record<string, boolean>;

  // Grouping
  rowGrouping: string[];
  columnGrouping: string[];
  expandedGroups: Record<string, boolean>;

  // Pivot
  pivotValues: PivotValueDef[];
  pivotEnabled: boolean;

  // Aggregation
  columnAggregators: Record<string, AggregationFnName | "custom">;

  // Ordering
  columnOrder: string[];

  // Pinning
  columnPinning: { left: string[]; right: string[] };

  // DnD
  rowOrder: string[];

  // Filtering
  globalFilter?: unknown;
}
```

Note: Not all keys are always present. Each plugin only contributes its keys when registered. The `createDefaultTableState()` function provides core defaults only.

---

## 11. Design Decisions and Trade-offs

### Why Headless?

- Consumers use different UI frameworks (MUI, Radix, custom)
- Table rendering is highly domain-specific
- Data logic and UI logic have different change frequencies
- Enables server-side rendering of state without rendering overhead

### Why Zustand?

- Minimal boilerplate compared to Redux/Context
- Vanilla store works outside React for testing
- `useStore` supports selector functions for granular subscriptions
- Easy to serialize/deserialize state

### Why Plugin Pipeline (Not Composable Hooks)?

- Single source of truth for row model
- Predictable execution order
- Caching at plugin boundary prevents redundant computation
- Plugins can be added/removed at runtime

### Why Int32Array for Sorting?

- Avoids creating/deleting objects during sort comparison
- `Array.sort` on index array is O(n log n) with minimal GC pressure
- Pre-extracts sort values to avoid repeated `row.values[id]` lookups

### Why `as any` in Examples?

The examples use `as any` for `initialState` because the generic `TState` parameter defaults to `TableState`, but plugin-specific states add additional keys (e.g., `rowGrouping`, `pivotEnabled`). In production code, consumers should define their own `TState` type that extends the appropriate plugin state interfaces.

---

## 12. How to Extend

### Add a New Plugin

1. Create `src/plugins/myFeature.ts`
2. Define `MyFeatureTableState` extending `TableState`
3. Define `MyFeatureApi<TData, TState>` with get/set methods
4. Create `createMyFeaturePlugin()` returning `PivotTablePlugin`
5. Create `createMyFeatureApi()` and `withMyFeature()`
6. Export from `src/index.ts`
7. Add tests for `transformRows` / `transformColumns`
8. Document in `docs/features/README.md`

### Add a New Aggregation Function

1. Add function to `src/plugins/aggregation/aggregators.ts`
2. Add to `aggregationFns` registry
3. Add to `AGGREGATOR_LABELS`
4. Add `AggregationFnName` union member in `src/types/aggregation.ts`
5. Export from aggregation index

### Override a Plugin at Runtime

```ts
const table = usePivotTable({ data, columns });

table.registerPlugin(createMyCustomPlugin());
// or
table.unregisterPlugin("sorting");
```

---

## 13. Debugging Tips

- **Plugin not running?** Check `name` uniqueness and that it's in the `plugins` array
- **Stale rows?** Ensure `data` reference changes (use new array, not mutated same array)
- **State not updating?** Check `shallowEqualState` in store — objects that look the same but are different refs will trigger updates
- **Type errors on initialState?** Define a `TState` type that extends the union of all plugin states you use
- **Pivot returning null?** Check `pivotEnabled` is `true` and `pivotValues` is non-empty
