# Feature Map

| Feature | Plugin File | State Keys | Transform | API Methods |
|---|---|---|---|---|
| sorting | `src/plugins/sorting.ts` | `sorting: SortingRule[]` | `transformRows` (Int32Array index sort) | `getSorting`, `getSortedColumnIds`, `getIsSorted`, `setSorting`, `toggleSorting`, `clearSorting` |
| filtering | `src/plugins/filtering.ts` | `filters: ColumnFilter[]`, `globalFilter?` | `transformRows` (typed operators) | `getColumnFilters`, `getGlobalFilter`, `setColumnFilters`, `setGlobalFilter`, `setColumnFilter`, `reset*`, `getFilteredColumnIds` |
| grouping | `src/plugins/grouping.ts` | `rowGrouping`, `columnGrouping`, `expandedGroups` | `transformRows` (tree → flattened with group rows) | `getRowGrouping`, `getColumnGrouping`, `setRowGrouping`, `setColumnGrouping`, `toggleGroupExpanded`, `getIsGroupExpanded`, `resetGrouping` |
| pivot | `src/plugins/pivot.ts` + `src/core/pivotEngine.ts` | `rowGrouping`, `columnGrouping`, `pivotValues`, `pivotEnabled` | `transformRows` (matrix via engine) | `getPivotResult`, `getPivotColumns`, `getPivotValues`, `setPivotValues`, `setPivotEnabled`, `runServerSidePivot` |
| aggregation | `src/plugins/aggregation/aggregationPlugin.ts` + `aggregators.ts` | `columnAggregators` | `transformRows` (subtotals+grandTotal) + `transformColumns` (meta annotator) | `get/setColumnAggregator*`, `registerFn`, `getGrandTotal`, etc. + `AggregatorDropdown` |
| columnVisibility | `src/plugins/columnVisibility.ts` | `columnVisibility` | — (API-only, no auto-filter) | `getIsColumnVisible`, `getVisibleColumnIds`, `set/toggleColumnVisibility`, `reset` |
| columnOrdering | `src/plugins/columnOrdering.ts` | `columnOrder` | `transformColumns` | `getColumnOrder`, `getOrderedColumnIds`, `setColumnOrder`, `reorderColumn`, `reset` |
| columnPinning | `src/plugins/columnPinning.ts` | `columnPinning: {left,right}` | `transformColumns` (`[left,center,right]` + `meta.pinned`) | `getColumnPinning`, `setColumnPinning`, `pinColumn`, `getPinned/ Center*` |
| dndRow | `src/plugins/dndRow.ts` | `rowOrder` | `transformRows` (`reorderByIds`) | `getRowOrder`, `getSortableRowIds`, `setRowOrder`, `reorderRows`, `handleDragEnd` |
| dndColumn | `src/plugins/dndColumn.ts` | `columnOrder` (shared) | `transformColumns` (`reorderByIds`) | `getColumnOrder`, `getSortableColumnIds`, `setColumnOrder`, `reorderColumns`, `handleDragEnd` |
| virtualization | `src/hooks/useVirtualRows.ts`, `useVirtualColumns.ts` | — (Virtualizer internal) | — | `useVirtualRows`, `useVirtualColumns` → `{virtualizer, virtualRows/Columns, totalSize}` |
| export/clipboard | `src/utils/exportCSV.ts`, `clipboard.ts` | — (pure) | — | `serializeCSV`, `exportCSV`, `copyToClipboard` |

**Conflicts:** `pivot↔grouping`, `columnOrdering↔dndColumn` — `src/store/pluginRegistry.ts:119-174`.

## Evidence Sources

- `src/plugins/*.ts`, `src/plugins/aggregation/*`, `src/core/pivotEngine.ts`, `src/hooks/*`, `src/utils/*`, `src/store/pluginRegistry.ts`
