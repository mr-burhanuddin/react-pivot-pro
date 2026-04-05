export { usePivotTable } from './core/usePivotTable';

export * from './types';
export { createPivotTableStore } from './store';
export type { PivotTableStore } from './store';

export { exportCSV, serializeCSV } from './utils/exportCSV';
export type { ExportCsvOptions, ExportCsvResult } from './utils/exportCSV';
export { copyToClipboard } from './utils/clipboard';
export type { CopyToClipboardOptions } from './utils/clipboard';
export {
  legacyAggregationFns,
  resolveAggregationFn,
  type AggregationInput,
  type LegacyAggregationFn,
} from './utils/aggregationFns';

export { useVirtualRows } from './hooks/useVirtualRows';
export { useVirtualColumns } from './hooks/useVirtualColumns';

export { createSortingPlugin, withSorting, useSorting } from './plugins/sorting';
export type { SortingTableState, SortingApi, PivotTableWithSorting } from './plugins/sorting';

export { createFilteringPlugin, withFiltering, useFiltering } from './plugins/filtering';
export type { FilteringTableState, FilteringApi, PivotTableWithFiltering } from './plugins/filtering';

export { createGroupingPlugin, withGrouping, useGrouping } from './plugins/grouping';
export type { GroupingTableState, GroupingApi, PivotTableWithGrouping } from './plugins/grouping';

export { createPivotPlugin, withPivot, usePivot } from './plugins/pivot';
export type { PivotTableState, PivotApi, PivotTableWithPivot } from './plugins/pivot';

export { createColumnVisibilityPlugin, withColumnVisibility } from './plugins/columnVisibility';
export type { ColumnVisibilityTableState, ColumnVisibilityApi, PivotTableWithColumnVisibility } from './plugins/columnVisibility';

export { createColumnOrderingPlugin, withColumnOrdering } from './plugins/columnOrdering';
export type { ColumnOrderingTableState, ColumnOrderingApi, PivotTableWithColumnOrdering } from './plugins/columnOrdering';

export { createColumnPinningPlugin, withColumnPinning } from './plugins/columnPinning';
export type { ColumnPinningTableState, ColumnPinningApi, PivotTableWithColumnPinning, PinSide } from './plugins/columnPinning';

export { createDndRowPlugin, withDndRow, useDndRow } from './plugins/dndRow';
export type { DndRowTableState, DndRowApi, PivotTableWithDndRow } from './plugins/dndRow';

export { createDndColumnPlugin, withDndColumn, useDndColumn } from './plugins/dndColumn';
export type { DndColumnTableState, DndColumnApi, PivotTableWithDndColumn } from './plugins/dndColumn';

export {
  createAggregationPlugin,
  createAggregationApi,
  withAggregation,
  usePivotAggregation,
  AggregatorDropdown,
  sum,
  count,
  avg,
  min,
  max,
  median,
  stddev,
  variance,
  pctOfTotal,
  runningTotal,
  countDistinct,
  aggregationFns,
  AGGREGATOR_LABELS,
  resolveAggregationFn as resolveAggregationFnPlugin,
} from './plugins/aggregation';
export type {
  AggregationFnName,
  AggregationFn,
  AggregationState,
  AggregationTableState,
  AggregationApi,
  AggregationPluginOptions,
  PivotTableWithAggregation,
} from './types/aggregation';
export * from './store';
