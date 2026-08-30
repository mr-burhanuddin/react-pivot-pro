# 03 — Coding Patterns

> Only patterns with multiple occurrences are documented. Each pattern lists where it appears and a representative example.

## 1. Plugin Factory / API / Wrapper Triad

Every feature plugin exposes three functions with consistent naming.

**Pattern:**
- `createXPlugin(options?)` → `PivotTablePlugin<TData, TState>` — passed to `usePivotTable({ plugins })`
- `createXApi(table, options?)` → `XApi` — standalone API bound to a table instance
- `withX(table, options?)` → `PivotTableWithX` — `Object.assign(table, { x: createXApi })`
- `useX(table)` → `XApi` — thin alias for `createXApi` (where present)

**Occurrences:** All 10 plugins.

| Plugin | Factory | API Factory | Wrapper | Hook |
|---|---|---|---|---|
| sorting | `createSortingPlugin` | `createSortingApi` | `withSorting` | `useSorting` |
| filtering | `createFilteringPlugin` | `createFilteringApi` | `withFiltering` | `useFiltering` |
| grouping | `createGroupingPlugin` | `createGroupingApi` | `withGrouping` | `useGrouping` |
| pivot | `createPivotPlugin` | `createPivotApi` | `withPivot` | `usePivot` |
| aggregation | `createAggregationPlugin` | `createAggregationApi` | `withAggregation` | `usePivotAggregation` |
| columnVisibility | `createColumnVisibilityPlugin` | `createColumnVisibilityApi` | `withColumnVisibility` | — |
| columnOrdering | `createColumnOrderingPlugin` | `createColumnOrderingApi` | `withColumnOrdering` | — |
| columnPinning | `createColumnPinningPlugin` | `createColumnPinningApi` | `withColumnPinning` | — |
| dndRow | `createDndRowPlugin` | `createDndRowApi` | `withDndRow` | `useDndRow` |
| dndColumn | `createDndColumnPlugin` | `createDndColumnApi` | `withDndColumn` | `useDndColumn` |

**Example (`src/plugins/sorting.ts:74-158`):**

```ts
export function createSortingPlugin<TData extends RowData>(options = {}): PivotTablePlugin<TData, TState> {
  return { name: 'sorting', getInitialState, transformRows, onStateChange };
}
export function createSortingApi<TData extends RowData>(table, options = {}): SortingApi { ... }
export function withSorting<TData extends RowData>(table, options = {}): PivotTableWithSorting {
  return Object.assign(table, { sorting: createSortingApi(table, options) });
}
```

**Wrapper usage (`README.md:86`):**

```ts
const base = usePivotTable({ data, columns, plugins: [createSortingPlugin()] });
const table = withSorting(base);
// table.sorting.toggleSorting('amount')
```

## 2. Plugin Interface Contract

All plugins implement a subset of `PivotTablePlugin` (`src/types/plugin.ts:17-36`).

```ts
interface PivotTablePlugin<TData, TState> {
  name: string;
  getInitialState?: (state: TState) => Partial<TState>;
  transformRows?: (rows: Row<TData>[], context: PivotTablePluginContext) => Row<TData>[];
  transformColumns?: (cols: Column<TData>[], context: PivotTablePluginContext) => Column<TData>[];
  onStateChange?: (state, prevState, context) => void;
}
```

| Plugin | getInitialState | transformRows | transformColumns | onStateChange |
|---|---|---|---|---|
| sorting | ✓ | ✓ | — | ✓ |
| filtering | ✓ | ✓ | — | ✓ |
| grouping | ✓ | ✓ | — | ✓ |
| pivot | ✓ | ✓ | — | — |
| aggregation | ✓ | ✓ | ✓ | ✓ |
| columnVisibility | ✓ | — | — | — |
| columnOrdering | ✓ | — | ✓ | — |
| columnPinning | ✓ | — | ✓ | — |
| dndRow | ✓ | ✓ | — | — |
| dndColumn | ✓ | — | ✓ | — |

## 3. Updater Pattern

State setters accept either a value or a functional updater, consistent across store and plugin APIs.

**Type (`src/types/state.ts:1`):**

```ts
export type Updater<T> = T | ((previous: T) => T);
```

**Occurrences:**

- `src/store/pivotTableStore.ts:11-19` — `resolveUpdater`
- `src/core/usePivotTable.ts:228-242` — `stableSetState` resolves updater against merged state
- Every `setX` / `setColumnY` method in plugins (e.g., `src/plugins/sorting.ts:204-216`, `src/plugins/filtering.ts:424-435`)

**Example:**

```ts
table.setState(prev => ({ ...prev, sorting: [{ id: 'amount', desc: true }] }));
table.setState({ ...table.getState(), sorting: [] });
```

## 4. Zustand Vanilla Store

State is managed by a Zustand vanilla store created inside the hook, not a React context.

**Evidence:** `src/store/pivotTableStore.ts:31-52` uses `createStore` from `zustand/vanilla`; `src/core/usePivotTable.ts:2`, `218`, `291` use `useStore(storeRef.current, selector)`.

```ts
// src/store/pivotTableStore.ts:31
export function createPivotTableStore<TState extends TableState>(initialState: TState): StoreApi<PivotTableStore<TState>> {
  return createStore<PivotTableStore<TState>>((set, get) => ({
    state: initialState,
    setState: (updater) => { /* shallowEqualState check */ },
    resetState: (nextState) => { set(...) },
  }));
}
```

Consumers never import `zustand` directly.

## 5. Controlled / Uncontrolled State Merge

`mergeStates` gives controlled `options.state` precedence over internal store state.

**Evidence:** `src/core/usePivotTable.ts:74-82`, `292-294`

```ts
function mergeStates<TState extends TableState>(internalState: TState, controlledState?: Partial<TState>): TState {
  if (!controlledState) return internalState;
  return { ...internalState, ...controlledState };
}
const state = useMemo(() => mergeStates(internalState, options.state), [internalState, options.state]);
```

Used for fully-controlled, partially-controlled, or uncontrolled modes.

## 6. Internal Cache with Reference Equality

Every stateful plugin caches output keyed by input row/column reference + state equality.

**Occurrences:** `sorting.ts:80-84`, `filtering.ts:299-305`, `grouping.ts:167-172`, `pivot.ts:101-104`, `aggregationPlugin.ts:151-155`, `dndRow.ts:34-36`, `dndColumn.ts:34-36`, and pipeline cache in `usePivotTable.ts:84-89`.

**Representative (`src/plugins/sorting.ts:92-97`):**

```ts
const cache = { rows: null as Row<TData>[] | null, sorting: [] as SortingRule[], result: null as Row<TData>[] | null };
transformRows: (rows, context) => {
  const sorting = context.state.sorting ?? [];
  if (cache.rows === rows && cache.result && areSortingRulesEqual(sorting, cache.sorting)) return cache.result;
  // ... compute
  cache.rows = rows; cache.sorting = sorting; cache.result = result;
  return result;
}
```

## 7. Generic Constraints with `TData extends RowData`

All public types and functions constrain data generics to `RowData = Record<string, unknown>`.

**Evidence:** `src/types/table.ts:6`, `column.ts:3`, `row.ts:9`, `plugin.ts:7`, `core/usePivotTable.ts:171-173`, every plugin file.

```ts
export type RowData = Record<string, unknown>; // src/types/table.ts:6
export function usePivotTable<TData extends RowData, TState extends TableState>(options: PivotTableOptions<TData, TState>) { ... }
export interface ColumnDef<TData extends RowData, TValue = unknown> { accessorKey?: Extract<keyof TData, string>; ... }
```

## 8. `import type` for Type-Only Imports

Type imports consistently use `import type`.

**Evidence:** `src/core/usePivotTable.ts:4-16`, `src/store/pivotTableStore.ts:2`, `src/plugins/sorting.ts:1-8`, every plugin and type file.

```ts
import type { Column, ColumnDef, PivotTableInstance, Row, RowData } from '../types';
import { createStore, type StoreApi } from 'zustand/vanilla';
```

## 9. Barrel Re-Exports

Public surface is aggregated through `src/index.ts` and per-subpath barrels.

**Evidence:** `src/index.ts:1-78`, `src/types/index.ts:1-5`, `src/hooks/index.ts`, `src/store/index.ts`, `src/utils/index.ts`, `src/plugins/aggregation/index.ts`

```ts
// src/types/index.ts
export * from './column';
export * from './plugin';
export * from './row';
export * from './state';
export * from './table';
```

Subpath exports in `package.json:31-71` and `tsup.config.ts:5-17` mirror barrel entries.

## 10. Virtualization Adapter Pattern

`useVirtualRows` and `useVirtualColumns` are near-identical wrappers around `@tanstack/virtual-core` `Virtualizer`, differing only in `horizontal` flag.

**Evidence:** `src/hooks/useVirtualRows.ts:50-212` (`horizontal: false`) vs `src/hooks/useVirtualColumns.ts:50-212` (`horizontal: true`). Shared pattern: `useRef` for `Virtualizer` singleton + `useReducer` force-update + `useIsomorphicLayoutEffect` for SSR safety + `useMemo` for resolved options.

```ts
const [, forceUpdate] = useReducer((v: number) => v + 1, 0);
const virtualizerRef = useRef<Virtualizer<TScrollElement, TItemElement> | null>(null);
if (!virtualizerRef.current) virtualizerRef.current = new Virtualizer({ count, getScrollElement, estimateSize, horizontal: false, ... });
```

## 11. Defensive Key / ID Handling

- Prototype pollution guard: `src/utils/accessorHelpers.ts:3-8` (`DANGEROUS_KEYS`, `isSafeKey`)
- Column ID validation: `src/core/usePivotTable.ts:22-37` (`VALID_ID_PATTERN`, `validateAndNormalizeColumnId`, truncation to 128 chars)
- CSV injection guard: `src/utils/exportCSV.ts:29`, `51-53` (`FORMULA_TRIGGER_CHARS`)
- Deduplication: `src/core/usePivotTable.ts:52-60` (suffix `_index`), `src/utils/helpers.ts:1-3` (`unique` via `Set`)

## 12. `Object.assign` Table Augmentation

`withX` wrappers augment the table instance via `Object.assign`, not subclassing or proxy.

**Evidence:** every `withX` function, e.g., `src/plugins/sorting.ts:258-267`, `src/plugins/filtering.ts:484-490`, `src/store/pluginRegistry.ts` patterns.

```ts
export function withSorting<TData extends RowData>(table, options = {}): PivotTableWithSorting {
  return Object.assign(table, { sorting: createSortingApi(table, options) });
}
```

Allows chaining: `withFiltering(withSorting(base))`. Order of wrapping does not affect row pipeline order (pipeline order is plugin registration order).

## Evidence Sources

- `src/index.ts`
- `src/types/state.ts`, `plugin.ts`, `table.ts`, `column.ts`, `row.ts`, `aggregation.ts`
- `src/store/pivotTableStore.ts`, `pluginRegistry.ts`
- `src/core/usePivotTable.ts`, `pivotEngine.ts`
- `src/plugins/sorting.ts`, `filtering.ts`, `grouping.ts`, `pivot.ts`, `aggregation/*`, `columnVisibility.ts`, `columnOrdering.ts`, `columnPinning.ts`, `dndRow.ts`, `dndColumn.ts`
- `src/hooks/useVirtualRows.ts`, `useVirtualColumns.ts`
- `src/utils/helpers.ts`, `accessorHelpers.ts`, `exportCSV.ts`, `aggregationFns.ts`
