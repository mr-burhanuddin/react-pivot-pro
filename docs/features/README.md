# Feature Documentation

Each section below documents a plugin's purpose, API, behavior, edge cases, and working examples. All examples reflect actual, usable code.

---

## Sorting Plugin

**File:** `src/plugins/sorting.ts`
**State key:** `sorting: SortingRule[]`
**Exports:** `createSortingPlugin`, `withSorting`, `useSorting`

### What it does

Multi-column sorting with ascending/descending order per column. Uses `Int32Array` index-based sort for performance — avoids object creation during comparisons.

### API

```ts
interface SortingApi<TData, TState> {
  getSorting(): SortingRule[];
  getSortedColumnIds(): string[];
  getIsSorted(columnId: string): "asc" | "desc" | false;
  setSorting(
    updater: SortingRule[] | ((prev: SortingRule[]) => SortingRule[]),
  ): void;
  toggleSorting(columnId: string, multi?: boolean): void;
  clearSorting(): void;
}
```

**`SortingRule`:** `{ id: string; desc: boolean }`

### Behavior

- `toggleSorting` cycles: none → asc → desc → none (removes column from sorting)
- When `multi` is `true` (or `Shift` key in UI), appends to existing sort rules instead of replacing
- Filters out sort rules for columns that don't exist (via `onStateChange`)
- Caches result keyed by `(rows ref, sorting array)` — skips sort if neither changed

### Edge Cases

- Sorting rules referencing non-existent columns are silently removed
- `null` values sort after non-null values
- `NaN` values are treated as equal
- Cross-type comparison falls back to `String(x).localeCompare(String(y))`

### Example

```tsx
import {
  usePivotTable,
  createSortingPlugin,
  withSorting,
  type ColumnDef,
} from "react-pivot-pro";

type Item = { id: string; name: string; score: number };

function SortableTable({ data }: { data: Item[] }) {
  const columns: ColumnDef<Item>[] = [
    { id: "name", accessorKey: "name" },
    { id: "score", accessorKey: "score" },
  ];

  const base = usePivotTable<Item>({
    data,
    columns,
    plugins: [createSortingPlugin()],
    initialState: { sorting: [{ id: "score", desc: true }] },
  });

  const table = withSorting(base);

  return (
    <table>
      <thead>
        <tr>
          {table.columns.map((col) => (
            <th
              key={col.id}
              onClick={() => table.sorting.toggleSorting(col.id)}
            >
              {col.id} {table.sorting.getIsSorted(col.id)}
            </th>
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

## Filtering Plugin

**File:** `src/plugins/filtering.ts`
**State keys:** `filters: ColumnFilter[]`, `globalFilter?: unknown`
**Exports:** `createFilteringPlugin`, `withFiltering`, `useFiltering`

### What it does

Column-level and global (search-all-columns) filtering with typed operators for text, number, date, enum, and boolean data.

### API

```ts
interface FilteringApi<TData, TState> {
  getColumnFilters(): ColumnFilter[];
  getGlobalFilter(): unknown;
  setColumnFilters(
    updater: ColumnFilter[] | ((prev: ColumnFilter[]) => ColumnFilter[]),
  ): void;
  setGlobalFilter(value: unknown): void;
  setColumnFilter(
    columnId: string,
    value: unknown,
    filterType?,
    operator?,
  ): void;
  resetColumnFilters(): void;
  resetGlobalFilter(): void;
  getFilteredColumnIds(): string[];
}
```

**`ColumnFilter`:**

```ts
interface ColumnFilter {
  id: string;
  value: unknown;
  filterType?: "text" | "number" | "date" | "enum" | "boolean";
  operator?:
    | "contains"
    | "startsWith"
    | "endsWith"
    | "equals"
    | "notEquals"
    | "eq"
    | "neq"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "between"
    | "in"
    | "notIn";
}
```

### Behavior

- Columns with `enableFiltering: false` in their `ColumnDef` are excluded from filtering
- Column filters are AND-combined (row must pass all active filters)
- Global filter checks if any column value matches (uses default text contains logic)
- Custom `rowFilterFn` and `globalFilterFn` can be passed via options

### Filter Operators by Type

| Type      | Operators                                                   | Default    |
| --------- | ----------------------------------------------------------- | ---------- |
| `text`    | `contains`, `startsWith`, `endsWith`, `equals`, `notEquals` | `contains` |
| `number`  | `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `between`            | `eq`       |
| `date`    | `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `between`            | `eq`       |
| `enum`    | `in`, `notIn`                                               | `in`       |
| `boolean` | (exact match)                                               | —          |

### Edge Cases

- Empty filter value (`''` or `null`) is treated as "no filter" — row passes
- Number/date parsing failures cause the row to fail the filter
- `between` operator expects `[min, max]` array as `value`
- `in`/`notIn` operators expect array of values

### Example

```tsx
import { useState } from "react";
import {
  usePivotTable,
  createFilteringPlugin,
  withFiltering,
  type ColumnDef,
} from "react-pivot-pro";

type Order = { id: string; customer: string; region: string; amount: number };

function FilteredTable({ data }: { data: Order[] }) {
  const [query, setQuery] = useState("");
  const columns: ColumnDef<Order>[] = [
    { id: "customer", accessorKey: "customer", enableFiltering: true },
    { id: "region", accessorKey: "region", enableFiltering: true },
    { id: "amount", accessorKey: "amount" },
  ];

  const base = usePivotTable<Order>({
    data,
    columns,
    plugins: [createFilteringPlugin()],
  });

  const table = withFiltering(base);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => table.filtering.setGlobalFilter(e.target.value)}
        placeholder="Search all columns..."
      />
      <table>
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
    </div>
  );
}
```

---

## Grouping Plugin

**File:** `src/plugins/grouping.ts`
**State keys:** `rowGrouping`, `columnGrouping`, `expandedGroups`
**Exports:** `createGroupingPlugin`, `withGrouping`, `useGrouping`

### What it does

Multi-level hierarchical row grouping. Builds a tree from grouping columns, inserts group header rows, and manages expansion state.

### API

```ts
interface GroupingApi<TData, TState> {
  getRowGrouping(): string[];
  getColumnGrouping(): string[];
  setRowGrouping(updater: string[] | ((prev: string[]) => string[])): void;
  setColumnGrouping(updater: string[] | ((prev: string[]) => string[])): void;
  toggleGroupExpanded(groupId: string, value?: boolean): void;
  getIsGroupExpanded(groupId: string): boolean;
  resetGrouping(): void;
}
```

### Behavior

- `rowGrouping` is an ordered array of column IDs — first element is top-level group
- Group rows are inserted before their children in the flat row array
- Group rows have special `values` properties:
  - `__group: true` — marker that this is a group row
  - `__depth: number` — nesting level (0 = top)
  - `__groupingColumnId: string` — which column this group is based on
  - `__groupingValue: unknown` — the value all children share
  - `__rowCount: number` — number of leaf rows in this group
- Group IDs follow the pattern: `group::<colId>:value|<colId>:value|...`
- Groups expand by default (unless `expandedGroups[id] === false`)

### Edge Cases

- Grouping columns that don't exist in the table are silently ignored
- If all grouping columns are invalid, returns rows unchanged
- Group rows have `index: -1` and `original: {}` — they are synthetic

### Example

See [`docs/examples/row-grouping.tsx`](../examples/row-grouping.tsx).

---

## Pivot Plugin

**File:** `src/plugins/pivot.ts`
**State keys:** `rowGrouping`, `columnGrouping`, `pivotValues`, `pivotEnabled`
**Exports:** `createPivotPlugin`, `withPivot`, `usePivot`

### What it does

Generates a pivot matrix (cross-tabulation) from row and column grouping dimensions. Can run client-side (built-in engine) or server-side (custom adapter).

### API

```ts
interface PivotApi<TData, TState> {
  getPivotResult(): PivotEngineResult<TData> | null;
  getPivotColumns(): PivotColumnHeader[];
  getPivotValues(): PivotValueDef<TData>[];
  setPivotValues(
    updater: PivotValueDef[] | ((prev: PivotValueDef[]) => PivotValueDef[]),
  ): void;
  setPivotEnabled(enabled: boolean): void;
  runServerSidePivot(): Promise<PivotEngineResult<TData> | null>;
}
```

### `createPivotPlugin` Options

```ts
interface PivotPluginOptions<TData> {
  aggregationFns?: Record<string, AggregationFn<TData>>;
  defaultValues?: PivotValueDef<TData>[];
  serverAdapter?: PivotServerAdapter<TData>;
  clientSide?: boolean; // default: true
}
```

### Behavior

- When `pivotEnabled` is `true` and `pivotValues` is non-empty, replaces all rows with pivot matrix rows
- Each pivot row's `values` contain keys like `<columnKey>::<valueId>` mapping to aggregated results
- Pivot rows have `__pivot: true` and `__rowKey: string` markers
- Client-side mode calls `createPivotEngineResult()` internally
- Server-side mode delegates to `serverAdapter.execute(request)`

### `PivotEngineResult` Shape

```ts
interface PivotEngineResult<TData> {
  rowTree: PivotNode<TData>[]; // Hierarchical row grouping tree
  rowHeaders: string[][]; // Row dimension paths
  columnHeaders: PivotColumnHeader[]; // Column dimension paths
  matrix: PivotCell[]; // Flat cell array
  matrixByRowKey: Record<string, Record<string, Record<string, unknown>>>; // Lookup
  grandTotals: Record<string, unknown>; // Overall totals
}
```

### Edge Cases

- Returns `null` from `getPivotResult()` if pivot is disabled or no values defined
- Server-side pivot returns `null` if no `serverAdapter` is configured
- Pivot mode replaces all rows — original data is only available via `getCoreRowModel()`

### Example

See [`docs/examples/pivot-aggregation.tsx`](../examples/pivot-aggregation.tsx) and [`docs/examples/server-side-pivot.tsx`](../examples/server-side-pivot.tsx).

---

## Aggregation Plugin

**File:** `src/plugins/aggregation/` (6 files)
**State key:** `columnAggregators: Record<string, AggregationFnName | 'custom'>`
**Exports:** `createAggregationPlugin`, `withAggregation`, `usePivotAggregation`, `AggregatorDropdown`, 12 aggregation functions, `aggregationFns`, `AGGREGATOR_LABELS`

### What it does

Appends subtotal rows and a grand total row to the row model based on per-column aggregation function assignments. Also annotates columns with `meta.aggregator` and `meta.aggregatorLabel`.

### API

```ts
interface AggregationApi<TData, TState> {
  getColumnAggregator(columnId: string): AggregationFnName | 'custom' | undefined;
  getColumnAggregators(): Record<string, AggregationFnName | 'custom'>;
  setColumnAggregator(columnId: string, updater: AggregationFnName | 'custom' | ((prev) => next)): void;
  setColumnAggregators(updater: Record<string, ...> | ((prev) => next)): void;
  registerFn(name: string, fn: AggregationFn): void;
  unregisterFn(name: string): void;
  getRegisteredFns(): Readonly<Record<string, AggregationFn>>;
  resetColumnAggregators(): void;
  getAggregatedValue(columnId: string): number | null;
  getGrandTotal(columnId: string): number | null;
}
```

### `createAggregationPlugin` Options

```ts
interface AggregationPluginOptions {
  defaultAggregator?: AggregationFnName; // default: 'sum'
  autoAggregateColumns?: string[]; // columns to auto-initialize
  workerThreshold?: number; // reserved for future worker offloading
}
```

### Behavior

- **Subtotal rows**: When rows have `_groupKey` in `values`, the plugin inserts a subtotal row after the last row of each group. Subtotal rows have `meta.isSubtotal: true` and `id: 'subtotal_<groupKey>'`
- **Grand total row**: Always appended at end with `id: 'grandTotal'`, `meta.isGrandTotal: true`
- **Column annotation**: `transformColumns` adds `meta.aggregator` (function name) and `meta.aggregatorLabel` (display name) to each column that has an aggregator assigned
- **Custom functions**: Registered via `api.registerFn(name, fn)` and used by setting column aggregator to `'custom'`

### Edge Cases

- Without `_groupKey` in rows, no subtotal rows are produced (only grand total)
- Custom functions must be registered before being referenced by a column
- `getGrandTotal()` sums numeric values across all rows — this is different from the aggregation function result

### Built-in Aggregation Functions

See `src/plugins/aggregation/aggregators.ts` for implementations. All are exported from the root package.

### Example

```tsx
import {
  usePivotTable,
  createAggregationPlugin,
  withAggregation,
  type ColumnDef,
} from "react-pivot-pro";

type Row = { id: string; _groupKey: string; amount: number };

function AggregatedTable({ data }: { data: Row[] }) {
  const columns: ColumnDef<Row>[] = [{ id: "amount", accessorKey: "amount" }];

  const base = usePivotTable<Row>({
    data,
    columns,
    plugins: [
      createAggregationPlugin({
        autoAggregateColumns: ["amount"],
        defaultAggregator: "sum",
      }),
    ],
  });

  const table = withAggregation(base);
  const rows = table.getRowModel().rows;

  return (
    <table>
      <tbody>
        {rows.map((row) => {
          const isSubtotal = row.meta?.isSubtotal;
          const isGrandTotal = row.meta?.isGrandTotal;
          return (
            <tr
              key={row.id}
              style={{
                fontWeight: isSubtotal || isGrandTotal ? "bold" : "normal",
              }}
            >
              <td>
                {isSubtotal
                  ? `Subtotal: ${row.values._groupKey}`
                  : isGrandTotal
                    ? "Grand Total"
                    : row.id}
              </td>
              <td>{row.values.amount as string}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
```

---

## Column Visibility Plugin

**File:** `src/plugins/columnVisibility.ts`
**State key:** `columnVisibility: Record<string, boolean>`
**Exports:** `createColumnVisibilityPlugin`, `withColumnVisibility`

### What it does

Boolean visibility map keyed by column ID. Default is visible (`true` or missing).

### API

```ts
interface ColumnVisibilityApi<TData, TState> {
  getColumnVisibility(): Record<string, boolean>;
  getIsColumnVisible(columnId: string): boolean;
  getVisibleColumnIds(): string[];
  setColumnVisibility(
    updater: Record<string, boolean> | ((prev) => next),
  ): void;
  toggleColumnVisibility(columnId: string, value?: boolean): void;
  resetColumnVisibility(): void;
}
```

### Behavior

- Missing key = visible (`!== false` check)
- `toggleColumnVisibility` inverts current value unless `value` is explicitly provided

### Example

```tsx
const table = withColumnVisibility(base);
table.columnVisibility.toggleColumnVisibility("amount");
// Or set directly:
table.columnVisibility.setColumnVisibility({ amount: false, name: true });
```

---

## Column Ordering Plugin

**File:** `src/plugins/columnOrdering.ts`
**State key:** `columnOrder: string[]`
**Exports:** `createColumnOrderingPlugin`, `withColumnOrdering`

### What it does

Reorders columns so specified columns appear first, remaining columns follow.

### API

```ts
interface ColumnOrderingApi<TData, TState> {
  getColumnOrder(): string[];
  getOrderedColumnIds(): string[];
  setColumnOrder(updater: string[] | ((prev: string[]) => string[])): void;
  reorderColumn(columnId: string, targetIndex: number): void;
  resetColumnOrder(): void;
}
```

### Behavior

- `transformColumns` places ordered columns first (in specified order), then remaining columns (in original order)
- Unknown column IDs in `columnOrder` are ignored
- Columns not mentioned in `columnOrder` are appended at the end

### Edge Cases

- `columnOrdering` and `dndColumn` conflict (both use `columnOrder` state key) — cannot be used together

### Example

```tsx
const table = withColumnOrdering(base);
table.columnOrdering.setColumnOrder(["name", "amount", "region"]);
// Or move a single column:
table.columnOrdering.reorderColumn("amount", 0); // Move amount to first position
```

---

## Column Pinning Plugin

**File:** `src/plugins/columnPinning.ts`
**State key:** `columnPinning: { left: string[]; right: string[] }`
**Exports:** `createColumnPinningPlugin`, `withColumnPinning`

### What it does

Reorders columns into `[leftPinned, center, rightPinned]` and annotates each column with `meta.pinned: 'left' | 'right'`.

### API

```ts
interface ColumnPinningApi<TData, TState> {
  getColumnPinning(): { left: string[]; right: string[] };
  setColumnPinning(
    updater: { left: string[]; right: string[] } | ((prev) => next),
  ): void;
  pinColumn(columnId: string, side: "left" | "right" | false): void;
  getPinnedColumns(side: "left" | "right"): string[];
  getCenterColumnIds(): string[];
  resetColumnPinning(): void;
}
```

### Behavior

- `pinColumn` removes the column from its current side first (prevents duplicates)
- `pinColumn(id, false)` unpins the column (removes from both sides)
- `transformColumns` reorders to `[left, center, right]` and sets `meta.pinned`
- Duplicate IDs within `left` or `right` are deduplicated

### Example

```tsx
const table = withColumnPinning(base);
table.columnPinning.pinColumn("name", "left");
table.columnPinning.pinColumn("actions", "right");

// Consumer uses meta.pinned to apply CSS position: sticky
table.columns.map((col) => {
  const pinned = col.meta?.pinned;
  return (
    <th key={col.id} style={{ position: pinned ? "sticky" : undefined }}>
      {col.id}
    </th>
  );
});
```

---

## DnD Row Plugin

**File:** `src/plugins/dndRow.ts`
**State key:** `rowOrder: string[]`
**Peer dependency:** `@dnd-kit/core`
**Exports:** `createDndRowPlugin`, `withDndRow`, `useDndRow`

### What it does

Row drag-and-drop reordering via `@dnd-kit/core`. Maintains `rowOrder` state and reorders rows via `reorderByIds()`.

### API

```ts
interface DndRowApi<TData, TState> {
  getRowOrder(): string[];
  getSortableRowIds(): string[];
  setRowOrder(updater: string[] | ((prev: string[]) => string[])): void;
  reorderRows(activeId: UniqueIdentifier, overId: UniqueIdentifier): void;
  handleDragEnd(event: DragEndEvent): void;
  resetRowOrder(): void;
}
```

### Behavior

- `handleDragEnd(event)` is a drop-in handler for `@dnd-kit/core`'s `onDragEnd` callback
- `reorderRows` moves the active row to the target row's position
- Only core rows (from `getCoreRowModel()`) are sortable — grouped/pivoted rows are not supported

### Example

See [`docs/examples/dnd-reorder.tsx`](../examples/dnd-reorder.tsx).

---

## DnD Column Plugin

**File:** `src/plugins/dndColumn.ts`
**State key:** `columnOrder: string[]`
**Peer dependency:** `@dnd-kit/core`
**Exports:** `createDndColumnPlugin`, `withDndColumn`, `useDndColumn`

### What it does

Column drag-and-drop reordering. Same pattern as DnD Row but for columns.

### API

```ts
interface DndColumnApi<TData, TState> {
  getColumnOrder(): string[];
  getSortableColumnIds(): string[];
  setColumnOrder(updater: string[] | ((prev: string[]) => string[])): void;
  reorderColumns(activeId: UniqueIdentifier, overId: UniqueIdentifier): void;
  handleDragEnd(event: DragEndEvent): void;
  resetColumnOrder(): void;
}
```

### Edge Cases

- `dndColumn` and `columnOrdering` conflict — both use `columnOrder` state key

### Example

See [`docs/examples/dnd-reorder.tsx`](../examples/dnd-reorder.tsx).

---

## Virtualization Hooks

**Files:** `src/hooks/useVirtualRows.ts`, `src/hooks/useVirtualColumns.ts`
**Peer dependency:** `@tanstack/virtual-core`

### What they do

Wrap `@tanstack/virtual-core`'s `Virtualizer` class with React lifecycle management. `useVirtualColumns` is identical to `useVirtualRows` but with `horizontal: true`.

### API

```ts
interface UseVirtualRowsOptions {
  count: number;
  getScrollElement: () => Element | Window | null;
  estimateSize: (index: number) => number;
  scrollMode?: "element" | "window";
  overscan?: number;
  paddingStart?: number;
  paddingEnd?: number;
  scrollPaddingStart?: number;
  scrollPaddingEnd?: number;
  initialOffset?: number | (() => number);
  enabled?: boolean;
  debug?: boolean;
  // Advanced: custom observe/scroll/measure functions
  observeElementRect?: VirtualizerOptions["observeElementRect"];
  observeElementOffset?: VirtualizerOptions["observeElementOffset"];
  scrollToFn?: VirtualizerOptions["scrollToFn"];
  measureElement?: VirtualizerOptions["measureElement"];
  onChange?: (instance: Virtualizer, sync: boolean) => void;
}

interface UseVirtualRowsResult {
  virtualizer: Virtualizer;
  virtualRows: VirtualItem[]; // { key, index, start, size, end, ... }
  totalSize: number;
}
```

### Behavior

- Virtualizer instance is stable across re-renders
- Options are updated via `virtualizer.setOptions()` when dependencies change
- `scrollMode: 'window'` switches from element-based to window-based scrolling
- `onChange` callback fires on scroll/measurement events (triggers re-render)

### Example

See [`docs/examples/virtualization-and-utilities.tsx`](../examples/virtualization-and-utilities.tsx).

---

## Utilities

### CSV Export (`src/utils/exportCSV.ts`)

```ts
function serializeCSV<TRecord>(options: ExportCsvOptions<TRecord>): string;
function exportCSV<TRecord>(
  options: ExportCsvOptions<TRecord>,
): ExportCsvResult;
```

**`ExportCsvOptions`:**

| Property         | Type                   | Default                | Description                                              |
| ---------------- | ---------------------- | ---------------------- | -------------------------------------------------------- |
| `rows`           | `TRecord[]`            | —                      | Data rows                                                |
| `columns`        | `CsvColumn<TRecord>[]` | Inferred from row keys | Column definitions with optional `accessor` and `header` |
| `includeHeader`  | `boolean`              | `true`                 | Include header row                                       |
| `delimiter`      | `string`               | `','`                  | Field separator                                          |
| `lineBreak`      | `'\n' \| '\r\n'`       | `'\n'`                 | Line ending                                              |
| `fileName`       | `string`               | `'export.csv'`         | Download filename                                        |
| `quoteAllFields` | `boolean`              | `false`                | Wrap all fields in quotes                                |
| `sanitizeValues` | `boolean`              | `true`                 | Escape CSV injection (formula triggers)                  |

**CSV Injection Prevention:** When `sanitizeValues` is `true`, values starting with `=`, `+`, `-`, `@`, tab, or newline are prefixed with `'` to prevent spreadsheet formula execution.

**`ExportCsvResult`:** `{ csv: string, fileName: string, blob: Blob | null, download: () => void }`

- `download()` is a no-op outside the browser
- `blob` is `null` in non-browser environments

### Clipboard (`src/utils/clipboard.ts`)

```ts
async function copyToClipboard(
  options: CopyToClipboardOptions,
): Promise<boolean>;

interface CopyToClipboardOptions {
  text: string;
  fallbackToExecCommand?: boolean; // default: true
}
```

- Uses `navigator.clipboard.writeText()` first
- Falls back to `<textarea>` + `execCommand('copy')` if `fallbackToExecCommand` is `true`
- Returns `false` in non-browser environments
