# 08 — State Management

## Overview

State is owned by a **Zustand vanilla store** created inside `usePivotTable`. No React Context, Redux, or React Query is used.

**Evidence:** `src/store/pivotTableStore.ts:31-52` uses `createStore` from `zustand/vanilla`; `src/core/usePivotTable.ts:218-219` creates it; `src/core/usePivotTable.ts:291` subscribes via `useStore`.

## Store Definition

**File:** `src/store/pivotTableStore.ts:5-9`

```ts
export interface PivotTableStore<TState extends TableState> {
  state: TState;
  setState: (updater: Updater<TState>) => void; // Updater<T> = T | ((prev: T) => T)
  resetState: (nextState: TState) => void;
}
```

**Factory:** `src/store/pivotTableStore.ts:31-52`

```ts
export function createPivotTableStore<TState extends TableState>(initialState: TState): StoreApi<PivotTableStore<TState>> {
  return createStore<PivotTableStore<TState>>((set, get) => ({
    state: initialState,
    setState: (updater) => {
      const nextState = resolveUpdater(updater, get().state);
      if (shallowEqualState(currentState, nextState)) return; // bail out
      set(prev => ({ ...prev, state: nextState }));
    },
    resetState: (nextState) => set(prev => ({ ...prev, state: nextState }))
  }));
}
```

- `shallowEqualState` (`src/store/pivotTableStore.ts:21-29`) compares keys by `!==` (shallow) — prevents re-renders when state is referentially different but shallow-equal.
- `resolveUpdater` handles the `value | (prev => value)` union.

## State Shape

**Base state:** `src/types/state.ts:26-32`

```ts
export interface TableState {
  sorting: SortingRule[];        // { id, desc }
  filters: ColumnFilter[];       // { id, value, filterType?, operator? }
  columnVisibility: Record<string, boolean>;
  rowSelection: Record<string, boolean>;
  expanded: Record<string, boolean>;
}
export function createDefaultTableState(): TableState {
  return { sorting: [], filters: [], columnVisibility: {}, rowSelection: {}, expanded: {} };
}
```

**Extended by plugins** (each plugin merges its slice via `getInitialState`):

| Plugin | State Keys Added | File |
|---|---|---|
| sorting | `sorting` (same key, seeded) | `src/plugins/sorting.ts:88-91` |
| filtering | `filters`, `globalFilter` | `src/plugins/filtering.ts:308-313` |
| grouping | `rowGrouping`, `columnGrouping`, `expandedGroups` | `src/plugins/grouping.ts:176-181` |
| pivot | `rowGrouping`, `columnGrouping`, `pivotValues`, `pivotEnabled` | `src/plugins/pivot.ts:108-117` |
| aggregation | `columnAggregators` | `src/plugins/aggregation/aggregationPlugin.ts:159-169` |
| columnVisibility | `columnVisibility` | `src/plugins/columnVisibility.ts:37-42` |
| columnOrdering | `columnOrder` | `src/plugins/columnOrdering.ts:40-45` |
| columnPinning | `columnPinning: {left,right}` | `src/plugins/columnPinning.ts:46-54` |
| dndRow | `rowOrder` | `src/plugins/dndRow.ts:39-43` |
| dndColumn | `columnOrder` (shared with columnOrdering) | `src/plugins/dndColumn.ts:40-43` |

Full union example (all plugins registered):

```ts
type FullState = TableState & {
  rowGrouping: string[];
  columnGrouping: string[];
  expandedGroups: Record<string, boolean>;
  pivotValues: PivotValueDef[];
  pivotEnabled: boolean;
  columnAggregators: Record<string, AggregationFnName | 'custom'>;
  columnOrder: string[];
  columnPinning: { left: string[]; right: string[] };
  rowOrder: string[];
  globalFilter?: unknown;
};
```

## State Ownership

```
┌─────────────────────────────────────────────────┐
│           usePivotTable Hook                     │
│                                                  │
│  initialStateRef = {                             │
│    ...createDefaultTableState(),                 │
│    ...options.initialState,                      │
│    ...plugin.getInitialState() for each plugin   │
│  }                                               │
│         │                                        │
│         ▼                                        │
│  createPivotTableStore(initialState)             │
│  storeRef.current = StoreApi<PivotTableStore>    │
│         │                                        │
│         ▼                                        │
│  internalState = useStore(store, s => s.state)   │
│  state = mergeStates(internalState,              │
│          options.state)  // controlled override  │
│         │                                        │
│         ▼                                        │
│  pluginContext.state (passed to every plugin)    │
│  table.state (exposed to consumer)               │
└─────────────────────────────────────────────────┘
```

| State | Owner | Mutator | Evidence |
|---|---|---|---|
| Internal state | Zustand store (`storeRef.current`) | `store.setState` / `stableSetState` | `src/core/usePivotTable.ts:218-243` |
| Merged state | `usePivotTable` `useMemo` | `mergeStates` | `src/core/usePivotTable.ts:74-82`, `292-294` |
| Controlled state | Consumer (optional) | `options.state` prop | `src/types/table.ts:14` |
| Plugin state slices | Individual plugins | `plugin.getInitialState` + `transformRows/Columns` + `onStateChange` | Each plugin file |
| Version counters | `usePivotTable` local `useState` | `setPluginVersion`, `setDataVersion`, `setStateVersion` | `src/core/usePivotTable.ts:175-177` |
| Plugin cache | `pluginCacheRef` + per-plugin closures | `pluginCacheRef.current.clear()` on state change | `src/core/usePivotTable.ts:239` |
| Virtualization state | `@tanstack/virtual-core` `Virtualizer` instance | `virtualizer.setOptions` | `src/hooks/useVirtualRows.ts:62-198` |

## State Update Flow

**`table.setState(updater)`** — `src/core/usePivotTable.ts:227-243`

```
1. stableSetState(updater) called
2. Read internal = store.getState().state
3. Read previous = mergeStates(internal, options.state)
4. Compute next = typeof updater === 'function' ? updater(previous) : updater
5. store.getState().setState(next)  // Zustand shallowEqual check
6. options.onStateChange?.(next, previous)
7. pluginCacheRef.current.clear()
8. setStateVersion(v => v + 1) → triggers rowModel/columnModel memo recompute
```

**Plugin `onStateChange` side effects** — e.g., `src/plugins/sorting.ts:142-157` auto-removes sorting rules for deleted columns by calling `context.setState`.

## Controlled vs Uncontrolled

| Mode | How | Evidence |
|---|---|---|
| Uncontrolled | Omit `options.state`, seed via `initialState`, mutate via `table.setState` | `src/types/table.ts:14-15` |
| Partially controlled | Pass `state: { sorting: [...] }` to control only sorting, rest internal | `mergeStates` pattern |
| Fully controlled | Pass `state` with full `TState`, handle `onStateChange` to sync external store | `src/core/usePivotTable.ts:236` |

`mergeStates` gives controlled keys precedence. If consumer passes `state: { sorting: [...] }`, that sorting always wins over internal.

## No Redux / Context / Query Cache

- **Redux**: Not used. `package.json` has no `redux`, `@reduxjs/toolkit`.
- **React Context**: No `createContext` in `src/`.
- **React Query / RTK Query**: Not used.
- **Query cache**: Not present — data is passed as `TData[]` prop, not fetched.

## Persistence

No persistence (localStorage, IndexedDB) is implemented. State is in-memory only. Consumers can serialize `table.getState()` and restore via `initialState` or controlled `state`.

## Plugin Registry State

**File:** `src/store/pluginRegistry.ts:20-117`

`createPluginRegistry<TState>()` manages plugin manifests and conflict detection. It is **not** used inside `usePivotTable` — it is a utility for consumers that want runtime conflict validation. `usePivotTable` itself tracks plugins via a `Map<string, PivotTablePlugin>` (`src/core/usePivotTable.ts:195-197`).

## Evidence Sources

- `src/types/state.ts`, `table.ts`
- `src/store/pivotTableStore.ts`, `pluginRegistry.ts`
- `src/core/usePivotTable.ts`
- `src/plugins/sorting.ts`, `filtering.ts`, `grouping.ts`, `pivot.ts`, `aggregation/aggregationPlugin.ts`, `columnVisibility.ts`, `columnOrdering.ts`, `columnPinning.ts`, `dndRow.ts`, `dndColumn.ts`
- `package.json`
