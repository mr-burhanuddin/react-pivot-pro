# Feature Documentation

This project is headless and plugin-first. Each feature below includes direct API references and runnable examples.

## Core

### `usePivotTable`
- **Overview:** Core hook that builds state, core row model, and transformed row model via plugins.
- **Use when:** Building any table flow in this library.
- **Internal:** Normalizes columns, computes core rows, merges controlled/uncontrolled state, applies plugin pipeline.
- **API:** `usePivotTable`, `getCoreRowModel`, `getRowModel`, `setState`, plugin registry methods.
- **Performance:** Keep `data`, `columns`, `plugins` stable.
- **Example:** [basic-table.tsx](../examples/basic-table.tsx)

## Data Features

### Sorting (`src/plugins/sorting.ts`)
- **Use when:** Need single/multi-column sorting.
- **API:** `createSortingPlugin`, `withSorting`, `table.sorting.toggleSorting`, `setSorting`, `clearSorting`.
- **Internal:** Sort transform with cache keyed by rows + sorting rules.
- **Performance:** Prefer stable sorting arrays and immutable updates.
- **Example:** [sorting-filtering.tsx](../examples/sorting-filtering.tsx)

### Filtering (`src/plugins/filtering.ts`)
- **Use when:** Need column and global filtering.
- **API:** `createFilteringPlugin`, `withFiltering`, `setColumnFilter`, `setGlobalFilter`, reset methods.
- **Internal:** Applies column filters then global filter, with cached transform output.
- **Performance:** Debounce text input before state updates.
- **Example:** [sorting-filtering.tsx](../examples/sorting-filtering.tsx)

### Row Grouping (`src/plugins/grouping.ts`)
- **Use when:** Need hierarchical row view.
- **API:** `createGroupingPlugin`, `withGrouping`, `setRowGrouping`, `toggleGroupExpanded`.
- **Internal:** Builds grouped tree and flattens based on expansion map.
- **Performance:** Group after filtering to reduce grouped row count.
- **Example:** [row-grouping.tsx](../examples/row-grouping.tsx)

### Pivot + Aggregation (`src/plugins/pivot.ts`, `src/core/pivotEngine.ts`, `src/utils/aggregationFns.ts`)
- **Use when:** Need cross-tab analytics with aggregated metrics.
- **API:** `createPivotPlugin`, `withPivot`, `getPivotResult`, `setPivotValues`, `runServerSidePivot`.
- **Internal:** Generates row/column path headers and matrix cells via aggregation resolvers.
- **Performance:** Use server-side adapter for high-cardinality pivots.
- **Examples:**
  - Client-side: [pivot-aggregation.tsx](../examples/pivot-aggregation.tsx)
  - Server-side: [server-side-pivot.tsx](../examples/server-side-pivot.tsx)

### Column Visibility (`src/plugins/columnVisibility.ts`)
- **Use when:** User-configurable visible columns.
- **API:** `createColumnVisibilityPlugin`, `withColumnVisibility`, `toggleColumnVisibility`.
- **Internal:** Boolean map keyed by column id.
- **Performance:** Persist map externally if user preferences must survive reloads.

### Column Ordering (`src/plugins/columnOrdering.ts`)
- **Use when:** Need explicit column ordering.
- **API:** `createColumnOrderingPlugin`, `withColumnOrdering`, `reorderColumn`.
- **Internal:** Normalizes order against current column ids.
- **Performance:** Avoid changing column IDs after initialization.

### Column Pinning (`src/plugins/columnPinning.ts`)
- **Use when:** Sticky/frozen column layouts.
- **API:** `createColumnPinningPlugin`, `withColumnPinning`, `pinColumn`, `getCenterColumnIds`.
- **Internal:** Maintains disjoint left/right pin arrays.
- **Performance:** Keep pinned-state-driven layout recalculation scoped.

## Interaction Features

### DnD Column + Row (`src/plugins/dndColumn.ts`, `src/plugins/dndRow.ts`)
- **Use when:** Drag-to-reorder columns and/or rows.
- **API:** `createDndColumnPlugin`, `withDndColumn`, `createDndRowPlugin`, `withDndRow`, `handleDragEnd`.
- **Internal:** Maps dnd-kit ids to normalized `columnOrder`/`rowOrder` state; row plugin reorders model.
- **Performance:** Use id-based reorder, not full object cloning.
- **Example:** [dnd-reorder.tsx](../examples/dnd-reorder.tsx)

## Virtualization Hooks

### `useVirtualRows` + `useVirtualColumns` (`src/hooks/*`)
- **Use when:** Rendering very large row/column counts.
- **API:** `useVirtualRows(options)`, `useVirtualColumns(options)`.
- **Internal:** Stable virtualizer instance + option updates + subscription-driven rerenders.
- **Performance:** Accurate `estimateSize` values reduce correction work.
- **Example:** [virtualization-and-utilities.tsx](../examples/virtualization-and-utilities.tsx)

## Utility Features

### CSV Export + Clipboard + Fullscreen (`src/utils/*`)
- **Use when:** Export current view/pivot results, quick copy flows, focus mode.
- **API:** `serializeCSV`, `exportCSV`, `copyToClipboard`, `fullscreen`.
- **Internal:** CSV escaping + browser API wrappers with fallbacks.
- **Performance:** Offload huge exports to worker/server, trigger copy/fullscreen from explicit user interactions.
- **Example:** [virtualization-and-utilities.tsx](../examples/virtualization-and-utilities.tsx)
