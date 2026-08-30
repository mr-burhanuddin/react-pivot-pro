# 05 — Frontend Architecture

> This library is **headless** — it ships no UI, CSS, or HTML. Frontend architecture here refers to the React integration surface and the optional docs-site app.

## Headless Principle

`src/core/usePivotTable.ts:171-439` is a headless hook. It returns data (`columns`, `rowModel`) and state controls (`state`, `setState`), never JSX.

- No table component exists in `src/`.
- No CSS files in `src/`.
- Consumer owns all rendering — `table.columns` → headers, `table.getRowModel().rows` → rows (`README.md:88-107`).

The only JSX-adjacent file in `src/` is `src/plugins/aggregation/AggregatorDropdown.tsx` — an optional UI helper for the aggregation feature, not required.

## Component Hierarchy

There is no component tree. The integration is hook-based:

```
Consumer Component
  └─ usePivotTable(options)  → PivotTableInstance
       ├─ table.columns        → render <th>
       ├─ table.getRowModel().rows → render <tr>/<td>
       ├─ table.state          → render controls (sort buttons, filters)
       ├─ table.sorting.*      → (if withSorting applied)
       ├─ table.filtering.*    → (if withFiltering applied)
       ├─ ... (per plugin)
       └─ useVirtualRows / useVirtualColumns → virtualization wrapper
```

Optional augmentation via `withX` composition:

```ts
const base = usePivotTable({ data, columns, plugins: [...] });
const table = withSorting(withFiltering(base));
// table.sorting and table.filtering now available
```

## Hook Layer

| Hook | Location | Purpose |
|---|---|---|
| `usePivotTable` | `src/core/usePivotTable.ts:171` | Core — orchestrates normalization, row model, store, plugin pipeline |
| `useVirtualRows` | `src/hooks/useVirtualRows.ts:50` | Virtualize rows via `@tanstack/virtual-core` |
| `useVirtualColumns` | `src/hooks/useVirtualColumns.ts:50` | Virtualize columns via `@tanstack/virtual-core` |
| `useSorting` | `src/plugins/sorting.ts:161` | Alias for `createSortingApi(table)` |
| `useFiltering` | `src/plugins/filtering.ts:405` | Alias for `createFilteringApi(table)` |
| `useGrouping` | `src/plugins/grouping.ts:329` | Alias for `createGroupingApi(table)` |
| `usePivot` | `src/plugins/pivot.ts:296` | Alias for `createPivotApi(table)` |
| `usePivotAggregation` | `src/plugins/aggregation/index.ts` | Alias for `createAggregationApi(table)` |
| `useDndRow` | `src/plugins/dndRow.ts:149` | Alias for `createDndRowApi(table)` |
| `useDndColumn` | `src/plugins/dndColumn.ts:149` | Alias for `createDndColumnApi(table)` |

All plugin `useX` hooks are thin passthroughs — they take a `PivotTableInstance` and return the corresponding API object. No React context or provider is used.

## Routing

No routing exists in the library. The library is consumed inside any React router (React Router, Next.js App Router, etc.) without coupling.

**Docs site** (`docs-site/`): Vite app with its own routing — not part of the library contract. See `docs-site/src/` and `docs-site/vite.config.ts`.

## Page Composition

No pages exist in `src/`. The library is page-agnostic.

**Docs site** pages live in `docs-site/src/` — out of scope for the library.

## State Flow (Frontend)

```
Consumer props (data, columns, plugins, initialState)
  → usePivotTable (useMemo + useRef + useState for version counters)
    → Zustand store (internal, vanilla)
      → mergeStates(internal, options.state)  → table.state (controlled override)
        → plugin pipeline (transformRows / transformColumns)
          → table.columns + table.rowModel
            → consumer render
            → useVirtualRows({ count: table.getRowModel().rows.length, ... })
```

Re-render trigger: `useStore(storeRef.current, s => s.state)` + local version counters (`pluginVersion`, `dataVersion`, `stateVersion`).

## Table Architecture

Library consumers build the table themselves. Recommended consumer pattern (`README.md:67-108`):

```tsx
function SalesTable({ data }: { data: Sale[] }) {
  const columns = useMemo<ColumnDef<Sale>[]>(() => [...], []);
  const base = usePivotTable({ data, columns, plugins: [createSortingPlugin()] });
  const table = withSorting(base);
  return (
    <table>
      <thead><tr>{table.columns.map(col => <th key={col.id}>{col.header ?? col.id}</th>)}</tr></thead>
      <tbody>{table.getRowModel().rows.map(row => <tr key={row.id}>{table.columns.map(col => <td key={col.id}>{String(row.getValue(col.id) ?? '')}</td>)}</tr>)}</tbody>
    </table>
  );
}
```

Virtualized variant:

```tsx
const { virtualRows, totalSize } = useVirtualRows({
  count: table.getRowModel().rows.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 36,
});
```

## Form Architecture

No form library integration. Filtering and sorting are controlled via state APIs:

- Text filter: `table.filtering.setColumnFilter('region','EMEA','text','contains')` — `src/plugins/filtering.ts:444-458`
- Number/date/enum/boolean filters dispatched via `filterType` + `operator` — `src/plugins/filtering.ts:243-260`
- Consumers typically debounce text input before calling `setColumnFilter`.

## Chart Architecture

Not present. No charting code detected.

## Modal Architecture

Not present. The library is headless — modals (e.g., column picker, aggregator dropdown) are consumer-owned. The only provided UI helper is `AggregatorDropdown` (`src/plugins/aggregation/AggregatorDropdown.tsx`).

## Permissions Architecture

Not present. No role, RBAC, or permission code detected.

## Styling Strategy

- Library ships no CSS.
- Consumer chooses any styling solution (Tailwind, MUI, Radix, etc.).
- Aggregation plugin annotates columns via `meta.aggregator` / `meta.aggregatorLabel` (`src/plugins/aggregation/aggregationPlugin.ts:199-221`) for consumer styling hooks.

## Docs-Site Frontend (Auxiliary)

`docs-site/` is a standalone Vite + React app (not part of the library dist).

- Build: `npm run docs:dev` / `docs:build` — `package.json:88-90`
- Config: `docs-site/vite.config.ts`
- Path alias: `@pivot/*` (per `AGENTS.md:96`)
- Deploy: Vercel (`vercel.json`)

No SSR, no Next.js, no app router in the library itself.

## Evidence Sources

- `src/core/usePivotTable.ts`
- `src/hooks/useVirtualRows.ts`, `useVirtualColumns.ts`, `index.ts`
- `src/plugins/sorting.ts`, `filtering.ts`, `grouping.ts`, `pivot.ts`, `aggregation/AggregatorDropdown.tsx`, `dndRow.ts`, `dndColumn.ts`, etc.
- `src/types/table.ts`, `row.ts`, `column.ts`
- `src/index.ts`
- `README.md`
- `docs-site/package.json`, `vite.config.ts`
- `tsconfig.json:10` (`jsx: react-jsx`)
