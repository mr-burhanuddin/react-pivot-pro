# Feature: Virtualization

## Purpose

Row and column virtualization for large datasets via `@tanstack/virtual-core` `Virtualizer`.

## Entry Points

- **Hooks:** `useVirtualRows`, `useVirtualColumns` — `src/hooks/useVirtualRows.ts:50`, `src/hooks/useVirtualColumns.ts:50`
- **Re-export:** `src/index.ts:18-19`, `src/hooks/index.ts`

## Components

- None — hooks return virtualizer instances; consumer renders rows/cols based on `virtualRows`/`virtualColumns`.

## Hooks

### `useVirtualRows<TScrollElement, TItemElement>(options) → UseVirtualRowsResult`

`UseVirtualRowsResult { virtualizer, virtualRows: VirtualItem[], totalSize: number }` — `src/hooks/useVirtualRows.ts:41-48`

### `useVirtualColumns` — identical, `horizontal: true` — `src/hooks/useVirtualColumns.ts:50-211`

## Services

- `@tanstack/virtual-core` `Virtualizer`, `elementScroll`, `observeElementOffset/Rect`, `windowScroll`, `observeWindow...` — `src/hooks/useVirtualRows.ts:2-12`

## State

- Virtualizer internal state (offset, rect, totalSize) managed by `@tanstack/virtual-core`.
- No library state keys. `options.count` typically bound to `table.getRowModel().rows.length` or `table.columns.length`.
- `useReducer` force-update on `onChange` — `src/hooks/useVirtualRows.ts:58`, `161-163`.

**Options:** `UseVirtualRowsOptions { count, getScrollElement, estimateSize, scrollMode?: 'element'|'window', overscan?, paddingStart/End?, scrollPaddingStart/End?, initialOffset?, enabled?, debug?, getItemKey?, rangeExtractor?, ... }` — `src/hooks/useVirtualRows.ts:16-39`

**SSR-safe:** `useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect` — `src/hooks/useVirtualRows.ts:56`.

## API

| Hook | Returns |
|---|---|
| `useVirtualRows(options)` | `{ virtualizer, virtualRows: VirtualItem[], totalSize }` |
| `useVirtualColumns(options)` | `{ virtualizer, virtualColumns: VirtualItem[], totalSize }` |

**Usage:**

```ts
const { virtualRows, totalSize } = useVirtualRows({
  count: rows.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 36,
  overscan: 5,
});
```

## Dependencies

- `@tanstack/virtual-core`
- `react` (`useLayoutEffect`, `useEffect`, `useMemo`, `useRef`, `useReducer`)

## Evidence Sources

- `src/hooks/useVirtualRows.ts`
- `src/hooks/useVirtualColumns.ts`
- `package.json:98`
