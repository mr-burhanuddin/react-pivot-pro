import { a as PivotTableOptions, P as PivotTableInstance } from './table-DpHE5xCK.js';
import { T as TableState, P as PivotTablePlugin } from './column-B6J1oaDs.js';
export { a as Column, c as ColumnDef, C as ColumnFilter, d as PivotTablePluginContext, R as Row, e as RowMeta, b as RowModel, S as SortingRule, U as Updater, f as createDefaultTableState } from './column-B6J1oaDs.js';
import { R as RowData } from './rowData-BfpK7vQO.js';
export { DEFAULT_MANIFESTS, PivotTableStore, PluginManifest, PluginRegistry, createPivotTableStore, createPluginRegistry } from './store/index.js';
export { A as AggregationInput, C as ComputeConfig, d as ComputeEngine, e as ComputeMode, f as ComputeRequest, g as ComputeResult, L as LegacyAggregationFn, l as legacyAggregationFns, r as resolveAggregationFn } from './types-BOy1UmGh.js';
export { useVirtualColumns, useVirtualRows } from './hooks/index.js';
export { PivotTableWithSorting, SortingApi, SortingTableState, createSortingPlugin, useSorting, withSorting } from './plugins/sorting.js';
export { FilteringApi, FilteringTableState, PivotTableWithFiltering, createFilteringPlugin, useFiltering, withFiltering } from './plugins/filtering.js';
export { GroupingApi, GroupingTableState, PivotTableWithGrouping, createGroupingPlugin, useGrouping, withGrouping } from './plugins/grouping.js';
export { PivotApi, PivotTableState, PivotTableWithPivot, createPivotPlugin, usePivot, withPivot } from './plugins/pivot.js';
export { ColumnVisibilityApi, ColumnVisibilityTableState, PivotTableWithColumnVisibility, createColumnVisibilityPlugin, withColumnVisibility } from './plugins/columnVisibility.js';
export { ColumnOrderingApi, ColumnOrderingTableState, PivotTableWithColumnOrdering, createColumnOrderingPlugin, withColumnOrdering } from './plugins/columnOrdering.js';
export { ColumnPinningApi, ColumnPinningTableState, PinSide, PivotTableWithColumnPinning, createColumnPinningPlugin, withColumnPinning } from './plugins/columnPinning.js';
export { DndRowApi, DndRowTableState, PivotTableWithDndRow, createDndRowPlugin, useDndRow, withDndRow } from './plugins/dndRow.js';
export { DndColumnApi, DndColumnTableState, PivotTableWithDndColumn, createDndColumnPlugin, useDndColumn, withDndColumn } from './plugins/dndColumn.js';
import * as react_jsx_runtime from 'react/jsx-runtime';
import 'zustand/vanilla';
import '@tanstack/virtual-core';
import '@dnd-kit/core';

declare function usePivotTable<TData extends RowData, TState extends TableState = TableState>(options: PivotTableOptions<TData, TState>): PivotTableInstance<TData, TState>;

type CsvPrimitive = string | number | boolean | null | undefined | Date;
interface CsvColumn<TRecord extends Record<string, unknown> = Record<string, unknown>> {
    id: string;
    header?: string;
    accessor?: (record: TRecord, index: number) => CsvPrimitive;
}
interface ExportCsvOptions<TRecord extends Record<string, unknown> = Record<string, unknown>> {
    rows: TRecord[];
    columns?: CsvColumn<TRecord>[];
    includeHeader?: boolean;
    delimiter?: string;
    lineBreak?: '\n' | '\r\n';
    fileName?: string;
    quoteAllFields?: boolean;
    sanitizeValues?: boolean;
}
interface ExportCsvResult {
    csv: string;
    fileName: string;
    blob: Blob | null;
    download: () => void;
}
declare function serializeCSV<TRecord extends Record<string, unknown>>(options: ExportCsvOptions<TRecord>): string;
declare function exportCSV<TRecord extends Record<string, unknown>>(options: ExportCsvOptions<TRecord>): ExportCsvResult;

interface CopyToClipboardOptions {
    text: string;
    fallbackToExecCommand?: boolean;
}
declare function copyToClipboard(options: CopyToClipboardOptions): Promise<boolean>;

type AggregationFnName = "sum" | "count" | "avg" | "min" | "max" | "median" | "stddev" | "variance" | "pctOfTotal" | "pctOfColumn" | "runningTotal" | "countDistinct";
type AggregationFn<TValue = unknown> = (values: TValue[]) => number | null;
interface AggregationState {
    columnAggregators: Record<string, AggregationFnName | "custom">;
}
type AggregationTableState = TableState & AggregationState;
interface AggregationApi<TData extends RowData, TState extends AggregationTableState = AggregationTableState> {
    getColumnAggregator: (columnId: string) => AggregationFnName | "custom" | undefined;
    getColumnAggregators: () => Record<string, AggregationFnName | "custom">;
    setColumnAggregator: (columnId: string, updater: AggregationFnName | "custom" | ((previous: AggregationFnName | "custom") => AggregationFnName | "custom")) => void;
    setColumnAggregators: (updater: Record<string, AggregationFnName | "custom"> | ((previous: Record<string, AggregationFnName | "custom">) => Record<string, AggregationFnName | "custom">)) => void;
    registerFn: (name: string, fn: AggregationFn) => void;
    unregisterFn: (name: string) => void;
    getRegisteredFns: () => Readonly<Record<string, AggregationFn>>;
    resetColumnAggregators: () => void;
    getAggregatedValue: (columnId: string) => number | null;
    getGrandTotal: (columnId: string) => number | null;
}
type PivotTableWithAggregation<TData extends RowData, TState extends AggregationTableState = AggregationTableState> = PivotTableInstance<TData, TState> & {
    aggregation: AggregationApi<TData, TState>;
};
interface AggregationPluginOptions {
    defaultAggregator?: AggregationFnName;
    autoAggregateColumns?: string[];
    workerThreshold?: number;
}

declare function createAggregationPlugin<TData extends RowData, TState extends AggregationTableState = AggregationTableState>(options?: AggregationPluginOptions): PivotTablePlugin<TData, TState>;

declare function createAggregationApi<TData extends RowData, TState extends AggregationTableState = AggregationTableState>(table: PivotTableInstance<TData, TState>): AggregationApi<TData, TState>;
declare function withAggregation<TData extends RowData, TState extends AggregationTableState = AggregationTableState>(table: PivotTableInstance<TData, TState>): PivotTableInstance<TData, TState> & {
    aggregation: AggregationApi<TData, TState>;
};
declare function usePivotAggregation<TData extends RowData, TState extends AggregationTableState = AggregationTableState>(table: PivotTableInstance<TData, TState>): AggregationApi<TData, TState>;

interface AggregatorDropdownProps {
    columnId: string;
    currentValue: AggregationFnName | "custom" | undefined;
    onChange: (columnId: string, fnName: AggregationFnName | "custom") => void;
    aggregators?: AggregationFnName[];
    className?: string;
}
declare function AggregatorDropdown({ columnId, currentValue, onChange, aggregators, className, }: AggregatorDropdownProps): react_jsx_runtime.JSX.Element;

declare const sum: AggregationFn;
declare const count: AggregationFn;
declare const avg: AggregationFn;
declare const min: AggregationFn;
declare const max: AggregationFn;
declare const median: AggregationFn;
declare const variance: AggregationFn;
declare const stddev: AggregationFn;
/**
 * Returns the sum of values as a baseline for percentage calculations.
 * Note: True pctOfTotal requires grand total context passed from the matrix.
 * This returns the raw sum as a placeholder.
 */
declare const pctOfTotal: AggregationFn;
/**
 * Returns running (cumulative) sum of values up to each position.
 * Returns array of cumulative sums or null if all values are null.
 */
declare const runningTotal: AggregationFn;
declare const countDistinct: AggregationFn;
declare const aggregationFns: Record<AggregationFnName, AggregationFn>;
declare const AGGREGATOR_LABELS: Record<AggregationFnName, string>;
declare function resolveAggregationFn(name: AggregationFnName | "custom", customFns: Record<string, AggregationFn>, columnId: string): AggregationFn | null;

export { AGGREGATOR_LABELS, type AggregationApi, type AggregationFn, type AggregationFnName, type AggregationPluginOptions, type AggregationState, type AggregationTableState, AggregatorDropdown, type CopyToClipboardOptions, type ExportCsvOptions, type ExportCsvResult, PivotTableInstance, PivotTableOptions, PivotTablePlugin, type PivotTableWithAggregation, RowData, TableState, aggregationFns, avg, copyToClipboard, count, countDistinct, createAggregationApi, createAggregationPlugin, exportCSV, max, median, min, pctOfTotal, resolveAggregationFn as resolveAggregationFnPlugin, runningTotal, serializeCSV, stddev, sum, usePivotAggregation, usePivotTable, variance, withAggregation };
